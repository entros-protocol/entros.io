/**
 * URL parameter parser and validators for the embed/verify-popup route.
 *
 * Mirrors the strict validation in `@entros/verify`'s `url.ts`. The popup
 * rejects any URL that fails validation before it renders the verify
 * pipeline, so a forged or malformed query string never reaches the wallet
 * adapter or the validation service.
 *
 * The popup constructs a single `EmbedErrorReason` for any validation
 * failure rather than surfacing per-field detail. Specific failure modes
 * stay server-side; consumers see `origin_invalid` or `unknown`.
 */

import type { Cluster } from "./types";
import { parsePolicyParameters, type PolicyRequest } from "@entros/verify/policy";

const VALID_INTEGRATOR_KEY = /^[a-z0-9_-]{1,64}$/;
const VALID_CLUSTERS = new Set<Cluster>(["devnet"]);
const MIN_TRUST_SCORE_BOUNDS = { min: 0, max: 10000 } as const;

/**
 * True when `value` is an origin exactly as a browser reports one: scheme, host
 * and a port that is not the default, and nothing else. A pattern over the text
 * also admits credentials, a query and a fragment, and the popup posts its
 * result to this origin. The partner package applies the same rule.
 */
function isOrigin(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.origin === value;
  } catch {
    return false;
  }
}

export interface ParsedEmbedParams {
  integratorKey: string;
  parentOrigin: string;
  cluster: Cluster;
  requestId: string;
  minTrustScore?: number;
  policy?: PolicyRequest;
  diagnosticsEnabled?: boolean;
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
  for (const name of [
    "integrator", "parent_origin", "cluster", "request_id",
    "min_trust_score", "policy_version", "policy",
  ]) {
    if (searchParams.getAll(name).length > 1) {
      return { ok: false, reason: "unknown" };
    }
  }
  const integratorKey = searchParams.get("integrator");
  const parentOrigin = searchParams.get("parent_origin");
  const cluster = searchParams.get("cluster");
  const requestId = searchParams.get("request_id");
  const minTrustScoreRaw = searchParams.get("min_trust_score");

  if (!integratorKey || !VALID_INTEGRATOR_KEY.test(integratorKey)) {
    return { ok: false, reason: "origin_invalid" };
  }
  if (!parentOrigin || !isOrigin(parentOrigin)) {
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
    if (!/^(0|[1-9][0-9]*)$/.test(minTrustScoreRaw)) {
      return { ok: false, reason: "unknown" };
    }
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

  let policy: PolicyRequest | undefined;
  try {
    const parsedPolicy = parsePolicyParameters(searchParams, minTrustScore);
    if (parsedPolicy.policy.cluster !== cluster) {
      return { ok: false, reason: "unknown" };
    }
    if (parsedPolicy.negotiated) policy = parsedPolicy.policy;
  } catch {
    return { ok: false, reason: "unknown" };
  }

  return {
    ok: true,
    params: {
      integratorKey,
      parentOrigin,
      cluster: cluster as Cluster,
      requestId,
      minTrustScore,
      ...(policy ? { policy } : {}),
    },
  };
}
