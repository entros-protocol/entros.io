import "server-only";
import { NextResponse } from "next/server";
import { readBoundedJson } from "@/lib/bounded-json";

/**
 * Server-side proxy to the paired-round prototype service.
 *
 * The browser never learns the service host and never holds its key. It sends the
 * participant code, which is the only credential a tester has, and this route adds the
 * service key from server-only env.
 *
 * The prototype is research, not product. Every route here returns 404 unless
 * `ENTROS_PAIRED_ROUND_PROTOTYPE` is `1`.
 */

const CODE_HEADER = "x-paired-round-code";
/**
 * The minted alphabet, without the characters people misread. The check rejects junk at the
 * edge; the service still decides whether the code exists.
 */
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8,64}$/;
const REQUEST_TIMEOUT_MS = 30_000;
const NO_STORE = { "Cache-Control": "no-store" } as const;

export function prototypeEnabled(): boolean {
  return process.env.ENTROS_PAIRED_ROUND_PROTOTYPE === "1";
}

function noStoreJson(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function forwardToPrototype(
  path: string,
  request: Request,
  maxBodyBytes: number,
): Promise<NextResponse> {
  if (!prototypeEnabled()) {
    return noStoreJson({ error: "not_found" }, 404);
  }

  const serviceUrl = process.env.PAIRED_ROUND_SERVICE_URL;
  const serviceKey = process.env.PAIRED_ROUND_SERVICE_KEY;
  if (!serviceUrl || !serviceKey) {
    return noStoreJson({ error: "prototype_unconfigured" }, 503);
  }

  const code = request.headers.get(CODE_HEADER)?.trim() ?? "";
  if (!CODE_PATTERN.test(code)) {
    return noStoreJson({ error: "participant_unknown" }, 400);
  }

  let body: unknown;
  try {
    body = await readBoundedJson(request, maxBodyBytes);
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 400;
    return noStoreJson(
      { error: status === 413 ? "request_too_large" : "invalid_request" },
      status,
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const upstream = await fetch(new URL(path, serviceUrl).toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Bearer, matching the scheme the validation service already uses.
        Authorization: `Bearer ${serviceKey}`,
        [CODE_HEADER]: code,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    const text = await upstream.text();
    let parsed: unknown;
    try {
      parsed = text.length > 0 ? JSON.parse(text) : {};
    } catch {
      return noStoreJson({ error: "prototype_unavailable" }, 502);
    }
    return noStoreJson(parsed, upstream.status);
  } catch {
    return noStoreJson({ error: "prototype_unavailable" }, 502);
  } finally {
    clearTimeout(timer);
  }
}
