/**
 * Same-origin client for the `/api/relay-challenge` server route.
 *
 * Replaces direct calls to `pulse-sdk`'s `fetchChallenge`, which required
 * `NEXT_PUBLIC_RELAYER_API_KEY` to be inlined into the client bundle.
 * That inlining was the failure point: a stale browser-cached chunk
 * could load the page with the env reference resolving to `undefined`
 * (cached from a build before the var was added, or from a different
 * deployment), the cross-origin GET to the executor would then go
 * without the `X-API-Key` header, the executor returned 401, and the
 * verify UI silently fell back to client-generated nonsense syllables.
 *
 * Going through a same-origin Next.js API route eliminates the entire
 * class of bug:
 *   - No CORS preflight (same-origin)
 *   - No client env-injection dependency (key lives only in server env)
 *   - No browser cache of "request headers without the auth key"
 *   - API key never appears in any client bundle (security upgrade)
 */
import type { LissajousParams } from "@entros/pulse-sdk";

export interface ChallengeResponse {
  nonce: Uint8Array;
  phrase: string;
  expiresIn: number;
  curve?: LissajousParams;
}

export async function fetchChallengeViaProxy(
  walletAddress: string,
): Promise<ChallengeResponse> {
  const url = `/api/relay-challenge?wallet=${encodeURIComponent(walletAddress)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Unable to fetch challenge via proxy: ${msg}`);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw new Error(`Relay returned ${response.status} for /api/relay-challenge`);
  }

  const body = (await response.json()) as {
    nonce: number[];
    expires_in: number;
    phrase: string;
    curve?: {
      a: number;
      b: number;
      delta: number;
      points: number;
      anchor_x?: number;
      anchor_y?: number;
    };
  };

  if (!Array.isArray(body.nonce) || body.nonce.length !== 32) {
    throw new Error("Relay returned malformed nonce; expected 32-byte array");
  }
  if (typeof body.phrase !== "string" || body.phrase.trim().length === 0) {
    throw new Error("Relay returned empty challenge phrase");
  }

  const curve: LissajousParams | undefined = body.curve
    ? {
        a: body.curve.a,
        b: body.curve.b,
        delta: body.curve.delta,
        points: body.curve.points ?? 200,
        anchorX: body.curve.anchor_x,
        anchorY: body.curve.anchor_y,
      }
    : undefined;

  return {
    nonce: Uint8Array.from(body.nonce),
    phrase: body.phrase,
    expiresIn: body.expires_in,
    curve,
  };
}
