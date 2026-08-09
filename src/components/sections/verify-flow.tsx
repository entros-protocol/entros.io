"use client";

import { Component, useCallback, useReducer, useState, useSyncExternalStore } from "react";
import type { StudyRecordStatus } from "@entros/pulse-sdk";
import {
  verifyReducer,
  initialState,
} from "@/components/verify/verify-state-machine";
import { VerifyWalletConnected } from "./verify-wallet-connected";
import { StudyConsent } from "@/components/verify/study-consent";
import type { ActiveStudyGrant } from "@/lib/population-study";
import {
  clearStudyInvitationFragment,
  readStudyInvitationFromFragment,
  requestStudyEnrolment,
  resolveStudyStatusUpdate,
} from "@/lib/population-study";

// Walletless preview is not exposed on the public verify route: the
// preview path didn't run real validation, so a user could pass by being
// silent for 12 seconds — the impression that creates is incompatible with
// the article's claims about behavioral verification. Driving every tester
// through the wallet-connected (real-validation) path is the only honest
// signal. The walletless components (`verify-walletless.tsx`,
// `verify-mode-toggle.tsx`) and the `VerifyMode` type alias remain in the
// codebase so the path can be restored as a clearly-labelled product demo
// later, or upgraded to a real-validation walletless tier.

class VerifyErrorBoundary extends Component<
  { children: React.ReactNode; onError: () => void },
  { error: string | null }
> {
  state = { error: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { error: err.message ?? "An unexpected error occurred" };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="space-y-4 py-8 text-center">
          <p className="text-sm text-danger">Verification error</p>
          <p className="text-xs text-foreground/55">{this.state.error}</p>
          <button
            onClick={() => {
              this.setState({ error: null });
              this.props.onError();
            }}
            className="rounded-full border border-border px-6 py-2 text-sm text-foreground/65 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export function VerifyFlow() {
  const [state, dispatch] = useReducer(verifyReducer, initialState);
  const invitation = useSyncExternalStore(
    () => () => undefined,
    readStudyInvitationFromFragment,
    () => null,
  );
  const [studyDecision, setStudyDecision] = useState<"pending" | "normal" | "joined">("pending");
  const [studyGrant, setStudyGrant] = useState<ActiveStudyGrant | null>(null);
  const [studyStatus, setStudyStatus] = useState<StudyRecordStatus | null>(null);
  const [studyJoined, setStudyJoined] = useState(false);
  const [studyTokenPending, setStudyTokenPending] = useState(false);
  const [studyComplete, setStudyComplete] = useState(false);

  const handleStudyReady = useCallback((grant: ActiveStudyGrant | null) => {
    clearStudyInvitationFragment();
    setStudyGrant(grant);
    setStudyJoined(grant !== null);
    setStudyDecision(grant ? "joined" : "normal");
  }, []);

  const handleStudyRecordStatus = useCallback(
    async (status: StudyRecordStatus | undefined) => {
      const update = resolveStudyStatusUpdate(status);
      if (!studyGrant || !update.confirmed) return;
      setStudyStatus(update.status);
      if (studyGrant.definition.preview_only || update.status === "disabled") {
        setStudyGrant(null);
        setStudyComplete(true);
        return;
      }
      if (studyGrant.trial_index >= studyGrant.trial_limit) {
        setStudyGrant(null);
        setStudyComplete(true);
        return;
      }

      setStudyTokenPending(true);
      setStudyGrant(null);
      try {
        const nextGrant = await requestStudyEnrolment(
          studyGrant.invitation,
          studyGrant.definition,
        );
        setStudyGrant(nextGrant);
      } catch {
        setStudyComplete(true);
      } finally {
        setStudyTokenPending(false);
      }
    },
    [studyGrant],
  );

  function handleBoundaryError() {
    dispatch({ type: "RESET" });
  }

  return (
    <div className="space-y-8">
      {/* Pinned-height card: sized for the tallest state (capturing) so the
          surrounding layout doesn't shift between idle / capturing /
          processing / failed / verified. Content centers vertically within
          the fixed container, occasional whitespace in shorter states is
          the deliberate trade-off for layout stability across the flow. */}
      <div className="mx-auto flex min-h-[620px] md:min-h-[660px] max-w-xl flex-col justify-center border border-border px-8 py-10">
        <VerifyErrorBoundary onError={handleBoundaryError}>
          {invitation && studyDecision === "pending" ? (
            <StudyConsent invitation={invitation} onReady={handleStudyReady} />
          ) : (
            <VerifyWalletConnected
              state={state}
              dispatch={dispatch}
              studyGrant={studyGrant}
              studyCaptureBlocked={studyTokenPending}
              onStudyRecordStatus={handleStudyRecordStatus}
            />
          )}
        </VerifyErrorBoundary>
      </div>
      {studyJoined && studyStatus && (
        <p className="text-center font-mono text-xs uppercase tracking-[0.14em] text-foreground/45" aria-live="polite">
          {studyTokenPending
            ? "Preparing the next research trial"
            : studyStatus !== "recorded" && studyStatus !== "replayed"
              ? "Verification finished. Research capture was not recorded."
              : studyComplete
                ? "Research trials complete"
                : "Research capture recorded"}
        </p>
      )}
    </div>
  );
}
