import { NextResponse } from "next/server";

const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/**
 * Server-side proxy to the executor's `/challenge` endpoint.
 *
 * Holds the API key in server-only env (`RELAYER_API_KEY`, no
 * `NEXT_PUBLIC_` prefix) so it's never inlined into a client bundle.
 * Eliminates the failure mode where a stale browser-cached chunk loses
 * the inlined `NEXT_PUBLIC_RELAYER_API_KEY` value and silently sends
 * `/challenge` requests without the `X-API-Key` header — the executor
 * returns 401, the SDK's catch swallows the error, and the verify UI
 * fell back to client-generated nonsense syllables. After this proxy,
 * the browser fetch is same-origin (no CORS preflight, no inlined env
 * dependency, no header to omit).
 *
 * Returns the executor response unchanged. The client validates the nonce,
 * phrase, lifetime, and server-issued curve before capture.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet || !PUBKEY_REGEX.test(wallet)) {
    return NextResponse.json(
      { error: "Invalid or missing wallet pubkey" },
      { status: 400 },
    );
  }

  const relayerUrl = process.env.RELAYER_URL;
  const relayerApiKey = process.env.RELAYER_API_KEY;

  if (!relayerUrl || !relayerApiKey) {
    return NextResponse.json(
      { error: "Relayer not configured" },
      { status: 503 },
    );
  }

  const upstream = new URL("/challenge", new URL(relayerUrl).origin);
  upstream.searchParams.set("wallet", wallet);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": relayerApiKey,
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Executor returned ${res.status}` },
        { status: 502 },
      );
    }

    const body = await res.json();
    return NextResponse.json(body, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Executor unreachable" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
