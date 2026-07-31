/**
 * Failure routing: which surface a verification failure belongs on.
 *
 * Separated from the views it drives so it can be tested without a DOM. It is
 * a policy table rather than presentation, and it went wrong in production
 * without anything catching it: an on-chain revert was rendered as "Validation
 * rejected this attempt", because the matcher for a validator rejection also
 * matched `custom program error`.
 *
 * Nothing here imports React.
 */

import {
  COOLDOWN_REASONS,
  isUserRejection,
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

/**
 * Detects the "on-chain anchor exists, local baseline is gone" failure
 * surfaced from `pulse-sdk/src/pulse.ts:278-285`. The stable substring is
 * "baseline is missing", guarded by a reset.test.ts assertion in the SDK
 * to prevent silent copy drift.
 */
function isMissingBaselineError(error: string): boolean {
  return error.includes("baseline is missing");
}

// A different wallet signed the baseline key-derivation prompt than the one
// connected (propagated from the SDK's complete()). The on-chain baseline is
// intact, so this routes to a no-reset surface. Contract: the matched phrase
// is emitted verbatim by pulse-sdk pulse.ts complete() and survives
// sanitizeErrorMessage.
function isWalletMismatchError(error: string): boolean {
  return error.includes("different wallet signed");
}

// Wallet has zero (or insufficient) SOL. Phantom/Solflare/Backpack all
// surface variants of the runtime simulation error verbatim. Match the
// stable substrings the runtime uses, not the wrapper text.
function isInsufficientSolError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("prior credit") ||
    e.includes("insufficient funds") ||
    e.includes("insufficient lamports")
  );
}

// Transaction's recent blockhash expired before landing on chain.
// Recoverable by retrying, since the SDK requests a fresh blockhash on each
// attempt.
function isStaleBlockhashError(error: string): boolean {
  return (
    error.includes("Blockhash not found") ||
    error.includes("block height exceeded") ||
    error.includes("TransactionExpiredBlockheightExceeded")
  );
}

// A cooldown, by reason code where one arrived and by prose only as a
// fallback.
//
// The server sends 429 with `rate_limited` (per-wallet cap),
// `ip_rate_limited` (per-IP cap) or `cross_wallet_cooldown`, and the SDK now
// carries the code through. It used to be dropped, leaving this function to
// recover the same fact by matching "too many" in an English error string,
// so rewording the server's copy quietly regressed this screen to the generic
// "Verification failed" page. The substring branch stays only for a response
// that reaches us without a code.
function isRateLimitedError(error: string, reason?: string): boolean {
  if (COOLDOWN_REASONS.has(reason as VerificationReason)) return true;
  const e = error.toLowerCase();
  return e.includes("too many") || e.includes("recently verified") || e.includes("different wallet");
}

// pulse-sdk 1.5.0+ surfaces on-chain Anchor reverts as:
//   Transaction failed on chain: {"InstructionError":[N,{"Custom":CODE}]}
// Code 6011 is `PrevCommitmentMismatch` from entros-anchor. The local
// baseline produces a `commitment_prev` that doesn't match the on-chain
// identity. The user-actionable fix is the same as missing-baseline:
// rotate the on-chain commitment via reset.
function isPrevCommitmentMismatchError(error: string): boolean {
  return /"Custom":\s*6011\b/.test(error);
}

// pulse-sdk 3.6.0+ pre-flight stale-baseline check: when the local baseline
// has fallen behind the on-chain verification chain (a verify landed from
// another origin/device) AND can't be re-synced from the on-chain
// EncryptedBaseline, the SDK fails BEFORE submitting, with no wasted signature
// and no fee, using this stable phrase. Same user-actionable surface as an
// on-chain 6011 revert: reset to re-sync.
function isStaleBaselineMessage(error: string): boolean {
  return error.toLowerCase().includes("out of sync with your on-chain identity");
}

// pulse-sdk 3.7.0+ pre-flight Hamming bounds check: when the new behavioral
// fingerprint drifts past the circuit's max-distance ceiling (an interrupted or
// rushed capture), the SDK fails BEFORE proving, with no wasted proof and no
// second signature, using this stable phrase. Recoverable by retrying with a
// clean capture, so it routes to its own friendly "try again" surface rather
// than the opaque validation-rejected bucket. The drift ceiling is published in the
// paper, so naming the goal reveals nothing an attacker can't already read.
// Guarded by a pulse-sdk source-string test to prevent silent copy drift.
function isDriftTooHighError(error: string): boolean {
  return error.toLowerCase().includes("closely match your usual pattern");
}

// Code 6012 is `ResetCooldownActive` from entros-anchor. The 7-day
// cooldown after a successful baseline reset has not elapsed. Until it
// does, no further reset can land. Distinct from program-revert because
// the user-actionable answer is "wait". Re-attempting today, even with
// a perfect capture, produces the same revert.
function isResetCooldownError(error: string): boolean {
  return /"Custom":\s*6012\b/.test(error);
}

// Catch-all for any other on-chain Anchor program revert (proof-from-
// future, missing receipt, malformed accounts, etc.). Routes to the
// validation-rejected surface alongside opaque validator rejections so
// the user-facing copy is identical across the two paths. Telling an
// attacker whether the validator or the chain caught them would itself
// be a calibration signal.
function isProgramRevertError(error: string): boolean {
  return error.includes("InstructionError") || /"Custom":\s*\d+/.test(error);
}

// A rejection the validator declined to label: sybil match, TTS detection, or
// one of the checks it keeps deliberately unnamed. It returns
// `safe_reason=null` for those, and the SDK propagates whatever generic body
// came with it.
//
// Since 4.1.0 the SDK answers this directly with `VerificationResult.opaque`,
// and this function is the fallback for a failure raised by the host or by an
// older SDK. It used to also carry the raw RPC formats now in
// `isRawRpcRejectionError`, which is how an on-chain revert came to be
// rendered as a validator rejection.
function isOpaqueValidatorError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    // Validator anti-probing rejections. The validation service returns
    // `safe_reason=None` for sybil-match / TTS-detected / advanced
    // biometric checks, with the user-facing error body set to a generic
    // phrase. Matching "verification failed" catches the sybil and related
    // cases; "validation failed" and "feature validation" cover the
    // SDK-side fallback wording.
    e.includes("verification failed") ||
    e.includes("verification rejected") ||
    e.includes("feature validation") ||
    e.includes("validation rejected") ||
    e.includes("validation failed") ||
    // Upstream-failure patterns from executor-node when the validation-
    // service is unreachable (crash loop, restart window, network blip).
    // The executor returns the reqwest "error sending request for url
    // ([internal])" envelope verbatim in that case. Routing these
    // through validation-rejected gives the user the same polished
    // surface without revealing infrastructure detail. The sanitizer in
    // verify-wallet-connected.tsx strips the URL itself; this routes the
    // category. Both are defense-in-depth: either alone closes the leak,
    // both together survive a future regression in the other.
    e.includes("error sending request") ||
    e.includes("502 bad gateway") ||
    e.includes("503 service unavailable") ||
    e.includes("504 gateway timeout") ||
    e.includes("upstream connect error")
  );
}

// Raw Solana RPC and wallet-adapter error formats. Phantom, Solflare and
// Backpack surface these verbatim when simulation rejects before pulse-sdk's
// confirm wrapper runs.
//
// These used to sit alongside the validator matchers above, and that is how an
// on-chain revert came to be rendered as "Validation rejected this attempt".
// All five can only occur after the validator already returned 200, so they
// are now gated on the phases where they are possible. They still route to the
// same surface: telling an attacker whether the validator or the chain caught
// them is itself calibration information.
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

// Microphone permission denied. Surface paths:
// - verify-wallet-connected.tsx synthesizes "Microphone access denied. ..."
//   when session.startAudio() throws (browser permissions API rejected).
// - pulse-sdk/pulse.ts wraps captureAudio failures as
//   "Audio capture failed: ${msg}. Ensure microphone permission is granted ..."
// - Some browsers throw native NotAllowedError / PermissionDeniedError, whose
//   message text varies by browser/OS so match the canonical substrings.
function isMicrophonePermissionError(error: string): boolean {
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

// Microphone reached the page but the audio coming through was effectively
// silent: input device muted at the OS level, wrong default device selected,
// gain too low, or browser-quirk processing returning a near-zero stream.
// verify-wallet-connected.tsx synthesizes "Microphone audio too quiet. ..."
// when the local voiced-frame counter stays below the validator's voicing-
// ratio floor on a server-rejected attempt with no specific safe reason.
// Routed before isMicrophonePermissionError so the more specific condition
// wins; the substrings are disjoint anyway.
function isMicrophoneTooQuietError(error: string): boolean {
  return error.toLowerCase().includes("microphone audio too quiet");
}

// Motion sensor permission denied. iOS 13+ requires explicit consent via
// DeviceMotionEvent.requestPermission(). Denial surfaces as our synthetic
// "Motion permission denied" string from verify-wallet-connected.tsx.
function isMotionPermissionError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("motion permission denied") || e.includes("motion access")
  );
}

export type FailureKind =
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
  | { kind: "rate-limited" }
  | { kind: "permission-denied"; device: "microphone" | "motion" }
  | { kind: "microphone-too-quiet" }
  | { kind: "drift-too-high"; canReset: boolean }
  | { kind: "generic"; message: string };

/**
 * Pick the surface for a failure.
 *
 * Every matcher below is a substring test, which is what this used to be built
 * entirely out of. The `context` argument narrows where each one may run, and
 * that narrowing is the fix for the 2026-07-31 defect: an on-chain revert was
 * rendered as "Validation rejected this attempt" because the matcher for a
 * validator rejection also matched `custom program error`, a string that can
 * only appear after the validator already returned 200.
 *
 * Substring matching stays, because phase alone does not separate `Custom 6011`
 * from `Custom 6012`, or a declined prompt from an empty wallet. The matchers
 * now run inside a phase rather than across all of them.
 *
 * When `context.failedAt` is absent, every matcher runs. That is the old
 * behaviour exactly, and it is what a host talking to an older SDK gets, along
 * with the failures this app raises itself before the SDK sees anything.
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

  // The SDK knows exactly why the on-chain baseline could not be restored, so
  // prefer that over reading it back out of the message. Five of the six
  // reasons used to be discarded, which put an anchor minted before on-chain
  // baselines existed, a blob that no longer decrypts, and a wallet that
  // cannot sign on one screen that told all three their device had lost
  // something. Most of them had never had it.
  if (baselineRecovery) {
    switch (baselineRecovery) {
      case "wallet-mismatch":
        // The on-chain baseline is intact. This one must not offer a reset.
        return { kind: "wallet-mismatch" };
      case "no-encrypted-baseline":
        return { kind: "no-portable-baseline", canReset: canResetBaseline };
      case "signing-unavailable":
        return { kind: "signing-unavailable", canReset: canResetBaseline };
      case "stale-baseline":
        // A blob that no longer decrypts and a baseline that was never written
        // need the same thing from the user, and the copy already covers both.
        return { kind: "missing-baseline", canReset: canResetBaseline };
      default:
        // `no-on-chain-identity` and `unknown-error` fall through to prose.
        break;
    }
  }

  // The relayer is reached twice: once for the challenge, before capture, and
  // once to validate.
  if (inPhase("capture", "validation", "submission") && isRelayerError(error)) {
    return { kind: "relayer-down" };
  }
  // Quiet-mic detection routes BEFORE permission-denied so a captured-but-
  // silent stream surfaces its own actionable copy ("check input device + OS
  // mute") rather than the permission-recovery instructions, which don't
  // apply when the browser already granted access. It is synthesised on a
  // server rejection as well as on a capture failure, so it spans two phases.
  if (inPhase("capture", "validation") && isMicrophoneTooQuietError(error)) {
    return { kind: "microphone-too-quiet" };
  }
  // Permission denials route before generic categories. Both surfaces are
  // browser-state issues the user can fix directly; the generic "Verification
  // failed" copy would misrepresent the cause and bury the actionable fix.
  if (inPhase("capture")) {
    if (isMicrophonePermissionError(error)) {
      return { kind: "permission-denied", device: "microphone" };
    }
    if (isMotionPermissionError(error)) {
      return { kind: "permission-denied", device: "motion" };
    }
  }
  if (inPhase("baseline")) {
    // Route before missing-baseline: a wallet-signature mismatch is NOT a
    // missing baseline (the on-chain baseline is intact), so this surface must
    // not reset.
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
  // An empty wallet can be reported by the adapter at the prompt, by the RPC
  // on send, or by the runtime on chain, so all three phases keep the matcher.
  if (
    inPhase("signing", "submission", "confirmation") &&
    isInsufficientSolError(error)
  ) {
    return { kind: "insufficient-sol" };
  }
  // `isUserRejection` comes from the SDK rather than from a local copy, and it
  // has to. The SDK runs the same predicate to decide whether a failure was
  // `signing` or `submission`, and the branch below only runs in `signing`. A
  // local copy that recognised one more phrasing than the SDK's would never get
  // to use it: the SDK would have called the failure `submission` already.
  if (inPhase("signing") && isUserRejection(error)) {
    return { kind: "user-rejection" };
  }
  if (inPhase("submission", "confirmation") && isStaleBlockhashError(error)) {
    return { kind: "stale-blockhash" };
  }
  if (inPhase("validation") && isRateLimitedError(error, reason)) {
    return { kind: "rate-limited" };
  }
  // Specific Custom codes route before the opaque bucket so each gets its own
  // user-actionable surface. Cooldowns and stale baselines reveal protocol
  // state the user needs to act on, not the outcome of a detection check, so
  // naming them does not help an attacker calibrate.
  if (inPhase("confirmation") && isPrevCommitmentMismatchError(error)) {
    return { kind: "stale-baseline", canReset: canResetBaseline };
  }
  // The 7-day reset cooldown surfaces twice: as a pre-flight check against the
  // on-chain timestamp before capture, and as `Custom 6012` from the chain.
  if (inPhase("baseline", "confirmation") && isResetCooldownError(error)) {
    return { kind: "cooldown-active" };
  }
  // Drift-too-high is a recoverable capture-quality issue (an interrupted or
  // rushed capture pushed the fingerprint past the consistency ceiling). It
  // gets its own friendly "try again" surface, ahead of the opaque bucket.
  if (inPhase("proving") && isDriftTooHighError(error)) {
    return { kind: "drift-too-high", canReset: canResetBaseline };
  }
  // What may be shown is a separate question from where it failed, and the SDK
  // answers it directly. A replay-floor rejection in `proving`, an
  // attack-signal rejection in `validation` and a program revert in
  // `confirmation` all land here and must be indistinguishable.
  if (opaque === true) return { kind: "validation-rejected" };
  if (opaque === undefined) {
    // No answer from the SDK, so fall back to reading the message. This is the
    // path for a host-raised failure and for an older SDK.
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
 * What the user may have paid, for the surface to say so.
 *
 * A failure past the point of broadcast is not free, and for two months the
 * interface said only that verification had failed while every baseline reset
 * was charged for a transaction that could not deserialize. `signing` and
 * everything before it spent nothing, so most failures render no note at all.
 *
 * An unknown phase reports `none`, where `phaseSpend` reports `possible`. The
 * SDK has to fail closed there because it cannot know its caller. This app
 * can: every SDK-originated failure carries a phase, and the ones that do not
 * are raised here, before a transaction exists. The single exception is the
 * backstop timer, whose own copy already tells the user to check their wallet
 * for a pending transaction.
 */
export function failureSpend(failedAt: VerificationPhase | undefined): PhaseSpend {
  return failedAt === undefined ? "none" : phaseSpend(failedAt);
}
