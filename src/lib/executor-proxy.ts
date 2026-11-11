import { readBoundedJson, readBoundedResponseBytes } from "./bounded-json";

const MAX_RESPONSE_BYTES = 64 * 1_024;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export type ExecutorProxyRoute =
  | {
      path:
        | "/attest"
        | "/challenge/paired"
        | "/paired/commit"
        | "/paired/cue"
        | "/validate-session";
      method: "POST";
      timeoutMs: number;
      maxRequestBytes?: number;
    }
  | {
      path: "/paired/authorization";
      method: "GET";
      timeoutMs: number;
      /** The query parameters the route forwards, each with the form its value must have. */
      query: Readonly<Record<string, RegExp>>;
    };

export interface ExecutorProxyRuntime {
  enabled: boolean;
  relayerUrl?: string;
  relayerApiKey?: string;
  fetchImpl?: typeof fetch;
}

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

async function readBoundedResponse(response: Response): Promise<unknown> {
  const bytes = await readBoundedResponseBytes(response, MAX_RESPONSE_BYTES);
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    if (response.ok) throw new Error("Upstream response is not JSON");
    return { error: `Executor returned ${response.status}` };
  }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
}

export async function proxyExecutorRequest(
  request: Request,
  route: ExecutorProxyRoute,
  runtime: ExecutorProxyRuntime,
): Promise<Response> {
  if (!runtime.enabled) return json({ error: "Not found" }, 404);
  if (!runtime.relayerUrl || !runtime.relayerApiKey) {
    return json({ error: "Relayer not configured" }, 503);
  }
  if (request.method !== route.method) {
    return json({ error: "Method not allowed" }, 405);
  }

  let upstream: URL;
  try {
    upstream = new URL(route.path, new URL(runtime.relayerUrl).origin);
  } catch {
    return json({ error: "Relayer not configured" }, 503);
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-API-Key": runtime.relayerApiKey,
  };
  let body: string | undefined;
  if (route.method === "GET") {
    // Only the named parameters reach the executor, and only in their expected form.
    const sent = new URL(request.url).searchParams;
    for (const [name, form] of Object.entries(route.query)) {
      const value = sent.get(name);
      if (value === null || !form.test(value)) {
        return json({ error: "Invalid request" }, 400);
      }
      upstream.searchParams.set(name, value);
    }
  } else {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ error: "Content-Type must be application/json" }, 415);
    }
    try {
      const parsed = await readBoundedJson(request, route.maxRequestBytes ?? 0);
      body = JSON.stringify(parsed);
    } catch (error) {
      const status = error instanceof RangeError ? 413 : 400;
      return json(
        { error: status === 413 ? "Request too large" : "Invalid request" },
        status,
      );
    }
    headers["Content-Type"] = "application/json";
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), route.timeoutMs);
  try {
    const response = await (runtime.fetchImpl ?? fetch)(upstream, {
      method: route.method,
      headers,
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    const responseBody = await readBoundedResponse(response);
    return json(responseBody, response.status);
  } catch {
    return json({ error: "Executor unreachable" }, 502);
  } finally {
    clearTimeout(timer);
  }
}
