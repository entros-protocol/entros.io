import { readBoundedJson } from "./bounded-json";

const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MAX_RESPONSE_BYTES = 64 * 1_024;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export interface ExecutorProxyRoute {
  path: "/challenge" | "/validate-features" | "/attest";
  method: "GET" | "POST";
  timeoutMs: number;
  maxRequestBytes?: number;
}

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
  const declaredLength = response.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > MAX_RESPONSE_BYTES) {
      throw new RangeError("Upstream response is too large");
    }
  }
  if (!response.body) throw new Error("Upstream response is empty");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        throw new RangeError("Upstream response is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
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

  let body: string | undefined;
  if (route.method === "GET") {
    const wallet = new URL(request.url).searchParams.get("wallet");
    if (!wallet || !PUBKEY_REGEX.test(wallet)) {
      return json({ error: "Invalid or missing wallet pubkey" }, 400);
    }
    upstream.searchParams.set("wallet", wallet);
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
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), route.timeoutMs);
  try {
    const response = await (runtime.fetchImpl ?? fetch)(upstream, {
      method: route.method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        "X-API-Key": runtime.relayerApiKey,
      },
      ...(body ? { body } : {}),
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
