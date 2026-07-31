/**
 * Intent that a capture is running for. `verify` is the normal path;
 * `reset` rotates the on-chain baseline via `reset_identity_state`.
 * Propagated through capturing → processing → signing → verified so
 * the UI can render reset-specific copy on success.
 */
export type CaptureIntent = "verify" | "reset";

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
  | {
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
    };

export type VerifyAction =
  | { type: "START_CAPTURE"; intent: CaptureIntent }
  | { type: "CAPTURE_DONE" }
  | { type: "PROOF_COMPLETE" }
  | { type: "VERIFICATION_SUCCESS"; commitment: string; txSignature?: string }
  | {
      type: "VERIFICATION_SOFT_FAILED";
      reason: string;
      attemptsRemaining: number;
    }
  | { type: "VERIFICATION_FAILED"; error: string; reason?: string; retryAfterSec?: number }
  | { type: "RESET" };

export type VerifyMode = "walletless" | "wallet-connected";
