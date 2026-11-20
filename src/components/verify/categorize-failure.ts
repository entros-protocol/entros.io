/**
 * Failure routing: maps a verification failure to its user-facing surface.
 *
 * Kept free of React so routing invariants stay unit-testable without a DOM.
 */

import {
  isUserRejection,
  isVerificationReason,
  phaseSpend,
  type PhaseSpend,
  type VerificationReason,
  type VerificationPhase,
} from "@entros/pulse-sdk";

import type { FailureContext } from "./types";

function isRelayerError(error: string): boolean {
  return (
    error.includes("DOCTYPE") ||
    error.includes("Failed to fetch") ||
    error.includes("NetworkError") ||
    error.includes("localhost")
  );
}

/** Detects the missing-local-baseline message emitted by the SDK. */
function isMissingBaselineError(error: string): boolean {
  return error.includes("baseline is missing");
}

// A different wallet signed the baseline key-derivation prompt than the one
// connected. The on-chain baseline stays intact, so this routes to a no-reset surface.
function isWalletMismatchError(error: string): boolean {
  return error.includes("different wallet signed");
}

// Wallet has insufficient SOL for protocol fees, account rent, or network fees.
export function isInsufficientSolError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("prior credit") ||
    e.includes("insufficient funds") ||
    e.includes("insufficient lamports")
  );
}

// Transaction blockhash expired before landing on chain. Retrying fetches a fresh blockhash.
function isStaleBlockhashError(error: string): boolean {
  return (
    error.includes("Blockhash not found") ||
    error.includes("block height exceeded") ||
    error.includes("TransactionExpiredBlockheightExceeded")
  );
}

// Fallback matcher for cooldown prose when no structured reason code arrived.
function isRateLimitedError(error: string): boolean {
  const e = error.toLowerCase();
  return e.includes("too many") || e.includes("recently verified") || e.includes("different wallet");
}

// Anchor error 6011 (`PrevCommitmentMismatch`): the local baseline commitment
// does not match the on-chain identity and needs a baseline reset.
function isPrevCommitmentMismatchError(error: string): boolean {
  return /"Custom":\s*6011\b/.test(error);
}

// Pre-flight stale-baseline message emitted when the local baseline trails
// the on-chain identity and cannot be re-synced automatically.
function isStaleBaselineMessage(error: string): boolean {
  return error.toLowerCase().includes("out of sync with your on-chain identity");
}

// Pre-flight consistency-bound mismatch before proving. Routes to retry and
// optional baseline reset guidance rather than the opaque rejection bucket.
export function isDriftTooHighError(error: string): boolean {
  const lower = error.toLowerCase();
  return (
    lower.includes("did not match your stored baseline") ||
    lower.includes("closely match your usual pattern")
  );
}

// Anchor error 6012 (`ResetCooldownActive`): the 7-day reset cooldown is active.
function isResetCooldownError(error: string): boolean {
  return /"Custom":\s*6012\b/.test(error);
}

// Catch-all for other on-chain program reverts; routes to the opaque rejection surface
// so validator and on-chain rejections present identically.
function isProgramRevertError(error: string): boolean {
  return error.includes("InstructionError") || /"Custom":\s*\d+/.test(error);
}

// Fallback matcher for unlabelled rejections and upstream gateway faults when
// `VerificationResult.opaque` is not supplied by the caller.
function isOpaqueValidatorError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("verification failed") ||
    e.includes("verification rejected") ||
    e.includes("feature validation") ||
    e.includes("validation rejected") ||
    e.includes("validation failed") ||
    e.includes("error sending request") ||
    e.includes("502 bad gateway") ||
    e.includes("503 service unavailable") ||
    e.includes("504 gateway timeout") ||
    e.includes("upstream connect error")
  );
}

// Raw Solana RPC and wallet-adapter simulation errors. Gated to submission and
// confirmation phases so they never fire during validation.
function isRawRpcRejectionError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("-32002") ||
    e.includes("sendtransactionpreflightfailure") ||
    e.includes("@solana/errors") ||
    e.includes("custom program error") ||
    e.includes("transaction simulation failed")
  );
}

// Microphone permission denied or audio device unavailable in the browser.
export function isMicrophonePermissionError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("microphone access denied") ||
    e.includes("microphone permission") ||
    e.includes("audio capture failed") ||
    e.includes("microphone unavailable") ||
    (e.includes("notallowederror") && e.includes("audio")) ||
    (e.includes("permission denied") && e.includes("audio"))
  );
}

// Microphone opened, but no audible voice frames were recorded.
// Routed before permission-denied because browser permission is already granted.
function isMicrophoneTooQuietError(error: string): boolean {
  return error.toLowerCase().includes("microphone audio too quiet");
}

// Motion sensor permission denied on platforms requiring explicit motion consent.
function isMotionPermissionError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("motion permission denied") || e.includes("motion access")
  );
}

/**
 * The surface a reason decides by itself.
 *
 * - `matched`: the phase-gated matchers in `categorizeFailure` decide.
 * - `cooldown`: this wallet, device or network has to wait before the next
 *   attempt.
 * - `session-wait`: the service refuses another session until a cooldown ends.
 * - `session-restart`: the session cannot continue and a new one can succeed.
 * - `session-broken`: this client and the server disagree about the protocol,
 *   so the page has to reload before anything else can work.
 * - `automated-browser`: every attempt from this browser meets the same
 *   refusal.
 *
 * Every surface except `matched` routes by code in every phase, because a
 * paired session can end while it opens, while a round commits or at
 * finalize, and a cooldown can refuse any of those requests.
 */
export type ReasonSurface =
  | "matched"
  | "cooldown"
  | "session-wait"
  | "session-restart"
  | "session-broken"
  | "baseline-quality"
  | "automated-browser";

// Keyed on the SDK's full reason union, so a reason added upstream fails the
// build here until it has a surface. An uncovered code would otherwise reach
// the user as a dead end.
const REASON_SURFACE = {
  variance_floor: "matched",
  entropy_bounds: "matched",
  temporal_coupling_low: "matched",
  phrase_content_mismatch: "matched",
  trace_incomplete: "matched",
  audio_evidence_insufficient: "matched",
  anchor_retry: "baseline-quality",
  paired_required: "session-broken",
  captcha_required: "matched",
  rate_limited: "cooldown",
  ip_rate_limited: "cooldown",
  cross_wallet_cooldown: "cooldown",
  payload_too_large: "matched",
  automated_browser_detected: "automated-browser",
  validation_unavailable: "matched",
  validation_timeout: "matched",
  technical_failure: "session-restart",
  session_expired: "session-restart",
  round_expired: "session-restart",
  session_superseded: "session-restart",
  session_consumed: "session-restart",
  session_unknown: "session-restart",
  session_not_ready: "session-restart",
  round_not_outstanding: "session-restart",
  session_busy: "session-restart",
  authorization_required: "session-restart",
  authorization_invalid: "session-restart",
  finalize_in_progress: "session-wait",
  session_active: "session-wait",
  session_budget_exhausted: "session-wait",
  capacity_reached: "session-wait",
  commitment_mismatch: "session-broken",
  challenge_mismatch: "session-broken",
  previous_commitment_mismatch: "session-broken",
  round_nonce_mismatch: "session-broken",
  idempotency_conflict: "session-broken",
  evidence_digest_mismatch: "session-broken",
  evidence_length_mismatch: "session-broken",
  evidence_bounds_invalid: "session-broken",
  final_digest_mismatch: "session-broken",
  audio_format_invalid: "session-broken",
  tier_violation: "session-broken",
  subject_mismatch: "session-broken",
  projection_not_supported: "session-broken",
  invalid_request: "session-broken",
  unsupported_session: "session-broken",
  malformed_response: "session-broken",
} as const satisfies Record<VerificationReason, ReasonSurface>;

/** The surface for a reason. Unknown and absent reasons are left to the matchers. */
export function surfaceOf(reason: string | undefined): ReasonSurface {
  return isVerificationReason(reason) ? REASON_SURFACE[reason] : "matched";
}

export type FailureKind =
  | { kind: "session-restart"; reason: VerificationReason }
  | { kind: "session-wait"; reason: VerificationReason }
  | { kind: "session-broken" }
  | { kind: "relayer-down" }
  | { kind: "wallet-mismatch" }
  | { kind: "missing-baseline"; canReset: boolean }
  | { kind: "no-portable-baseline"; canReset: boolean }
  | { kind: "signing-unavailable"; canReset: boolean }
  | { kind: "stale-baseline"; canReset: boolean }
  | { kind: "cooldown-active" }
  | { kind: "validation-rejected" }
  | { kind: "insufficient-sol" }
  | { kind: "user-rejection" }
  | { kind: "stale-blockhash" }
  | { kind: "rate-limited"; reason?: VerificationReason }
  | { kind: "permission-denied"; device: "microphone" | "motion" }
  | { kind: "microphone-too-quiet" }
  | { kind: "automated-browser" }
  | { kind: "drift-too-high"; canReset: boolean }
  | { kind: "generic"; message: string };

export function requiresBaselineRecoveryChoice(failure: FailureKind): boolean {
  return (
    failure.kind === "no-portable-baseline" ||
    failure.kind === "signing-unavailable" ||
    failure.kind === "missing-baseline" ||
    failure.kind === "stale-baseline"
  );
}

/**
 * Picks the UI surface for a verification failure.
 *
 * `context.failedAt` scopes prose matchers to the phase where each error can
 * arise. When `failedAt` is omitted, every matcher runs as a fallback for
 * host-raised errors.
 */
export function categorizeFailure(
  error: string,
  canResetBaseline: boolean,
  reason?: string,
  context: FailureContext = {},
): FailureKind {
  const { failedAt, opaque, baselineRecovery } = context;
  const inPhase = (...phases: VerificationPhase[]) =>
    failedAt === undefined || phases.includes(failedAt);

  // Structured reason codes route ahead of prose matchers.
  if (isVerificationReason(reason)) {
    switch (surfaceOf(reason)) {
      case "cooldown":
        return { kind: "rate-limited", reason };
      case "session-wait":
        return { kind: "session-wait", reason };
      case "session-restart":
        return { kind: "session-restart", reason };
      case "session-broken":
        return { kind: "session-broken" };
      case "automated-browser":
        return { kind: "automated-browser" };
      case "baseline-quality":
        return { kind: "generic", message: "We couldn't set your baseline from those captures. Start a new verification to try again. Say each word once." };
      case "matched":
        break;
    }
  }

  // Prefer structured baseline recovery causes from the SDK over error strings.
  if (baselineRecovery) {
    switch (baselineRecovery) {
      case "wallet-mismatch":
        // The on-chain baseline is intact; do not offer a reset.
        return { kind: "wallet-mismatch" };
      case "no-encrypted-baseline":
        return { kind: "no-portable-baseline", canReset: canResetBaseline };
      case "signing-unavailable":
        return { kind: "signing-unavailable", canReset: canResetBaseline };
      case "stale-baseline":
        return { kind: "missing-baseline", canReset: canResetBaseline };
      default:
        break;
    }
  }

  if (inPhase("capture", "validation", "submission") && isRelayerError(error)) {
    return { kind: "relayer-down" };
  }
  // Route quiet-mic ahead of permission-denied because permission is already granted.
  if (inPhase("capture", "validation") && isMicrophoneTooQuietError(error)) {
    return { kind: "microphone-too-quiet" };
  }
  if (inPhase("capture")) {
    if (isMicrophonePermissionError(error)) {
      return { kind: "permission-denied", device: "microphone" };
    }
    if (isMotionPermissionError(error)) {
      return { kind: "permission-denied", device: "motion" };
    }
  }
  if (inPhase("baseline")) {
    if (isWalletMismatchError(error)) {
      return { kind: "wallet-mismatch" };
    }
    if (isStaleBaselineMessage(error)) {
      return { kind: "stale-baseline", canReset: canResetBaseline };
    }
    if (isMissingBaselineError(error)) {
      return { kind: "missing-baseline", canReset: canResetBaseline };
    }
  }
  if (
    inPhase("signing", "submission", "confirmation") &&
    isInsufficientSolError(error)
  ) {
    return { kind: "insufficient-sol" };
  }
  if (inPhase("signing") && isUserRejection(error)) {
    return { kind: "user-rejection" };
  }
  if (inPhase("submission", "confirmation") && isStaleBlockhashError(error)) {
    return { kind: "stale-blockhash" };
  }
  if (inPhase("validation") && isRateLimitedError(error)) {
    return { kind: "rate-limited" };
  }
  if (inPhase("confirmation") && isPrevCommitmentMismatchError(error)) {
    return { kind: "stale-baseline", canReset: canResetBaseline };
  }
  if (inPhase("baseline", "confirmation") && isResetCooldownError(error)) {
    return { kind: "cooldown-active" };
  }
  // Pre-proving baseline-consistency mismatch; offers retry and optional reset.
  if (inPhase("proving") && isDriftTooHighError(error)) {
    return { kind: "drift-too-high", canReset: canResetBaseline };
  }
  // Opaque failures across proving, validation, and confirmation render identically.
  if (opaque === true) return { kind: "validation-rejected" };
  if (opaque === undefined) {
    if (inPhase("validation") && isOpaqueValidatorError(error)) {
      return { kind: "validation-rejected" };
    }
    if (
      inPhase("submission", "confirmation") &&
      (isRawRpcRejectionError(error) || isProgramRevertError(error))
    ) {
      return { kind: "validation-rejected" };
    }
  }
  return { kind: "generic", message: error };
}

/**
 * Reports whether a failed verification phase could have spent a network fee.
 * Errors without a phase originate before any transaction is built.
 */
export function failureSpend(failedAt: VerificationPhase | undefined): PhaseSpend {
  return failedAt === undefined ? "none" : phaseSpend(failedAt);
}
