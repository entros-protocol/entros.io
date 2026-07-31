/**
 * Failure bucketing for the embed popup.
 *
 * Separated from the component so it can be tested. It is the integrator wire
 * contract rather than presentation: the opener receives one of these buckets
 * and never the raw message, so an adversarial probe cannot enumerate the
 * validator's rejection codes through the popup boundary.
 *
 * It broke once without anything catching it. The backstop timer was
 * recognised by matching "timed out" in its own message, a contract nobody had
 * written down, and a copy edit turned a plain timeout into `unknown` on the
 * wire. Nothing here reads a message the SDK owns unless the phase decided
 * nothing first.
 */

import {
  isUserRejection,
  type VerificationPhase,
  type VerificationResult,
} from "@entros/pulse-sdk";

import type { EmbedErrorReason } from "@/lib/embed/types";

/**
 * `entros-anchor` Custom error code 6011 (`PrevCommitmentMismatch`):
 * the proof's `commitment_prev` doesn't match the identity's current
 * on-chain commitment. Re-clicking the integrator's button can't fix
 * this; the user has to reset baseline on /verify first. Detected here
 * so we route to a dedicated recovery surface instead of the generic
 * "Try again from the integrator" copy.
 */
export const PREV_COMMITMENT_MISMATCH_PATTERN = /"Custom":\s*6011\b/;


/**
 * Maps a free-form error string from the SDK / wallet adapter / RPC layer
 * into one of the popup's opaque `EmbedErrorReason` buckets. The buckets
 * are deliberately coarse. Integrators receive a category, never the raw
 * message, so adversarial probes can't enumerate the validator's internal
 * rejection codes through the popup boundary.
 */
/**
 * Bucket a failure by the stage that produced it, before falling back to prose.
 *
 * `categorizeError` below reads the message, and that is how it has to work for
 * an error this component raised itself. It is the wrong tool for an SDK
 * result: two failures the SDK gained in 4.1.0, a wallet that never answered
 * and a transaction the cluster never confirmed, carry messages it has never
 * seen and bucketed as `unknown`, which tells an integrator nothing.
 *
 * Returns `null` when the phase decides nothing, which is every phase before a
 * transaction exists. Those messages are raised here and prose still reads them
 * correctly.
 */
const PHASE_BUCKETS: Partial<Record<VerificationPhase, EmbedErrorReason>> = {
  // A declined prompt. The SDK attributes nothing else to this phase.
  signing: "wallet_rejected",
  // Everything ambiguous: a send that failed, a wallet that never answered, a
  // confirmation that never arrived. All transient, all worth another attempt.
  submission: "network_error",
  // The cluster reported the program rejecting it.
  confirmation: "validation_failed",
  // The drift ceiling and the replay floor.
  proving: "validation_failed",
};

export function bucketForResult(result: VerificationResult): EmbedErrorReason | null {
  const phase = result.failedAt;
  if (!phase) return null;
  // An empty wallet reaches the popup through the same phases as a decline,
  // and the integrator bucket for both is `wallet_rejected`. Prose is the only
  // thing that separates them, and here it separates them correctly.
  if (phase === "submission" || phase === "confirmation") {
    const e = (result.error ?? "").toLowerCase();
    if (
      e.includes("prior credit") ||
      e.includes("insufficient funds") ||
      e.includes("insufficient lamports")
    ) {
      return "wallet_rejected";
    }
  }
  return PHASE_BUCKETS[phase] ?? null;
}

export function categorizeError(error: string): EmbedErrorReason {
  const e = error.toLowerCase();
  if (
    // `isUserRejection` comes from the SDK, which runs the same predicate to
    // decide whether a failure was `signing` or `submission`. A local copy here
    // could recognise a phrasing the SDK's does not, and the two would then
    // disagree about the same error.
    isUserRejection(error) ||
    e.includes("prior credit") ||
    e.includes("insufficient funds") ||
    e.includes("insufficient lamports")
  ) {
    return "wallet_rejected";
  }
  if (
    e.includes("doctype") ||
    e.includes("failed to fetch") ||
    e.includes("networkerror") ||
    e.includes("blockhash not found") ||
    e.includes("block height exceeded")
  ) {
    return "network_error";
  }
  if (e.includes("timed out") || e.includes("timeout")) {
    return "timeout";
  }
  // Anchor program reverts surface from pulse-sdk 1.5.0 as
  //   Transaction failed on chain: {"InstructionError":[N,{"Custom":CODE}]}
  // The Custom codes (PrevCommitmentMismatch 6011, ResetCooldownActive
  // 6012, ProofFromFuture 6014, MissingValidatorReceipt 6015, etc.) all
  // signal that the on-chain program rejected the submission, so they
  // collapse into validation_failed and the integrator sees a meaningful
  // bucket rather than the catch-all unknown.
  if (e.includes('"custom"') || e.includes("instructionerror")) {
    return "validation_failed";
  }
  // pulse-sdk 3.7.0 drift-too-high (recoverable capture-quality retry) and the
  // opaque replay-floor rejection ("Verification rejected"). Both mean the
  // verification didn't pass, so both map to validation_failed rather than
  // the catch-all unknown.
  if (
    e.includes("closely match your usual pattern") ||
    e.includes("verification rejected")
  ) {
    return "validation_failed";
  }
  return "unknown";
}
