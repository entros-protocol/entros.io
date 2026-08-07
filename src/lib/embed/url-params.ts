/**
 * URL parameter parser and validators for the embed/verify-popup route.
 *
 * Mirrors the strict validation in `@entros/verify`'s `url.ts`. Any URL
 * that fails validation is rejected before the popup attempts to render
 * the verify pipeline — preventing forged or malformed query strings
 * from reaching the wallet adapter or the validation service.
 *
 * The popup constructs a single `EmbedErrorReason` for any validation
 * failure rather than surfacing per-field detail. Specific failure modes
 * stay server-side; consumers see `origin_invalid` or `unknown`.
 */

import type { Cluster } from "./types";

const VALID_INTEGRATOR_KEY = /^[a-z0-9_-]{1,64}$/;
const ORIGIN_PATTERN = /^https?:\/\/[^/]+$/;
const VALID_CLUSTERS = new Set<Cluster>(["devnet"]);
const MIN_TRUST_SCORE_BOUNDS = { min: 0, max: 10000 } as const;

export interface ParsedEmbedParams {
  integratorKey: string;
  parentOrigin: string;
  cluster: Cluster;
  requestId: string;
  minTrustScore?: number;
}

export type ParseResult =
  | { ok: true; params: ParsedEmbedParams }
  | { ok: false; reason: "origin_invalid" | "unknown" };

/**
 * Parses the popup URL's query parameters and returns either a
 * validated `ParsedEmbedParams` object or a `ParseResult` with an
 * opaque rejection reason.
 *
 * Note: the second-stage origin allowlist check (parent_origin matches
 * the integrator's registered origins) is enforced separately in the
 * route handler. This function only validates well-formedness.
 */
export function parseEmbedParams(
  searchParams: URLSearchParams,
): ParseResult {
  const integratorKey = searchParams.get("integrator");
  const parentOrigin = searchParams.get("parent_origin");
  const cluster = searchParams.get("cluster");
  const requestId = searchParams.get("request_id");
  const minTrustScoreRaw = searchParams.get("min_trust_score");

  if (!integratorKey || !VALID_INTEGRATOR_KEY.test(integratorKey)) {
    return { ok: false, reason: "origin_invalid" };
  }
  if (!parentOrigin || !ORIGIN_PATTERN.test(parentOrigin)) {
    return { ok: false, reason: "origin_invalid" };
  }
  if (!cluster || !VALID_CLUSTERS.has(cluster as Cluster)) {
    return { ok: false, reason: "unknown" };
  }
  if (!requestId || requestId.length === 0 || requestId.length > 128) {
    return { ok: false, reason: "unknown" };
  }

  let minTrustScore: number | undefined;
  if (minTrustScoreRaw !== null) {
    const parsed = Number(minTrustScoreRaw);
    if (
      !Number.isInteger(parsed) ||
      parsed < MIN_TRUST_SCORE_BOUNDS.min ||
      parsed > MIN_TRUST_SCORE_BOUNDS.max
    ) {
      return { ok: false, reason: "unknown" };
    }
    minTrustScore = parsed;
  }

  return {
    ok: true,
    params: {
      integratorKey,
      parentOrigin,
      cluster: cluster as Cluster,
      requestId,
      minTrustScore,
    },
  };
}
