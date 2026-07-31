import type { BaselineRecoveryReason, VerificationPhase } from "@entros/pulse-sdk";

/**
 * Intent that a capture is running for. `verify` is the normal path;
 * `reset` rotates the on-chain baseline via `reset_identity_state`.
 * Propagated through capturing → processing → signing → verified so
 * the UI can render reset-specific copy on success.
 */
export type CaptureIntent = "verify" | "reset";

/**
 * What the SDK, or this app, knows about a failure beyond its message.
 *
 * Failure routing used to read the stage out of English prose, which put an
 * on-chain revert on the screen that says validation rejected the attempt: the
 * matcher for a validator rejection also matched `custom program error`. These
 * three fields replace that inference.
 *
 * Every field is optional on purpose. Mic permission, motion permission and
 * challenge-fetch failures are raised here and never pass through the SDK, and
 * a host running against an older SDK gets none of them. `categorizeFailure`
 * falls back to prose whenever a field is absent, which is exactly the old
 * behaviour.
 */
export interface FailureContext {
  /** Which stage failed. See `phaseChargesAttempt` before metering an attempt. */
  failedAt?: VerificationPhase;
  /**
   * Whether the cause must not be described. A second axis over `failedAt`,
   * never derivable from it: a replay-floor rejection, a validator rejection
   * and a program revert sit in three different phases and have to render
   * identically.
   */
  opaque?: boolean;
  /** Why the on-chain baseline could not be restored, when `failedAt` is `baseline`. */
  baselineRecovery?: BaselineRecoveryReason;
}

export type VerifyState =
  | { step: "idle" }
  | { step: "capturing"; intent: CaptureIntent }
  | { step: "processing"; intent: CaptureIntent }
  | { step: "signing"; intent: CaptureIntent }
  | {
      step: "verified";
      intent: CaptureIntent;
      commitment: string;
      txSignature?: string;
      /**
       * False when the verification landed but wrote no portable copy of the
       * baseline, so this identity is recoverable on no other device.
       * `undefined` in walletless mode, where none is written at all.
       *
       * Surfaced rather than left silent because silence is how it went wrong:
       * 13 of 107 devnet anchors carry an on-chain baseline, and the rest
       * found out on their second device.
       */
      portableBaseline?: boolean;
    }
  | {
      // Soft-reject: a server-validation rejection in a
      // user-recoverable category (variance_floor, entropy_bounds,
      // temporal_coupling_low, phrase_content_mismatch). The user is invited
      // to retry without a hard failure UI. After `attemptsRemaining` hits
      // zero the next failure routes to `failed` instead.
      step: "soft_failed";
      intent: CaptureIntent;
      reason: string;
      attemptsRemaining: number;
    }
  | ({
      step: "failed";
      error: string;
      /**
       * The SDK's reason code, kept rather than discarded. Failure routing
       * used to run entirely off substring matches against the server's
       * English prose, so a copy edit on the server silently regressed the
       * rate-limit screen to a generic "Verification failed".
       */
      reason?: string;
      /** Cooldown in seconds, when the server sent one with a 429. */
      retryAfterSec?: number;
    } & FailureContext);

export type VerifyAction =
  | { type: "START_CAPTURE"; intent: CaptureIntent }
  | { type: "CAPTURE_DONE" }
  | { type: "PROOF_COMPLETE" }
  | {
      type: "VERIFICATION_SUCCESS";
      commitment: string;
      txSignature?: string;
      portableBaseline?: boolean;
    }
  | {
      type: "VERIFICATION_SOFT_FAILED";
      reason: string;
      attemptsRemaining: number;
    }
  | ({
      type: "VERIFICATION_FAILED";
      error: string;
      reason?: string;
      retryAfterSec?: number;
    } & FailureContext)
  | { type: "RESET" };

export type VerifyMode = "walletless" | "wallet-connected";
