import type { VerifyState, VerifyAction } from "./types";

export const initialState: VerifyState = { step: "idle" };

export function verifyReducer(
  state: VerifyState,
  action: VerifyAction
): VerifyState {
  switch (action.type) {
    case "START_CAPTURE":
      // Allow starting from idle, re-entering from the failed state when the
      // user chose to reset their baseline after a baseline-missing error, or
      // re-entering from soft_failed when the user clicks "Try again" on a
      // soft-reject. The parent component owns the retry
      // counter—by the time it dispatches START_CAPTURE we trust the
      // attempt budget has been checked.
      if (
        state.step !== "idle" &&
        state.step !== "failed" &&
        state.step !== "soft_failed"
      ) {
        return state;
      }
      return { step: "capturing", intent: action.intent };

    case "CAPTURE_DONE":
      if (state.step !== "capturing") return state;
      return { step: "processing", intent: state.intent };

    case "PROOF_COMPLETE":
      if (state.step !== "processing") return state;
      return { step: "signing", intent: state.intent };

    case "VERIFICATION_SUCCESS":
      if (state.step !== "processing" && state.step !== "signing") return state;
      return {
        step: "verified",
        intent: state.intent,
        commitment: action.commitment,
        txSignature: action.txSignature,
      };

    case "VERIFICATION_SOFT_FAILED":
      // Only reachable from processing/signing—capture must have completed
      // and validation must have happened. attemptsRemaining is the budget
      // left AFTER this attempt; the parent decrements before dispatching.
      if (state.step !== "processing" && state.step !== "signing") return state;
      return {
        step: "soft_failed",
        intent: state.intent,
        reason: action.reason,
        attemptsRemaining: action.attemptsRemaining,
      };

    case "VERIFICATION_FAILED":
      if (state.step === "verified") return state;
      return { step: "failed", error: action.error };

    case "RESET":
      return { step: "idle" };

    default:
      return state;
  }
}
