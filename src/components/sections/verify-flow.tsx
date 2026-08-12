"use client";

import { Component, useCallback, useEffect, useReducer, useRef } from "react";
import type { StudyRecordStatus } from "@entros/pulse-sdk";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  verifyReducer,
  initialState,
} from "@/components/verify/verify-state-machine";
import { VerifyWalletConnected } from "./verify-wallet-connected";
import { StudyConsent } from "@/components/verify/study-consent";
import type { ActiveStudyGrant } from "@/lib/population-study";
import {
  clearPendingStudyEnrolmentId,
  createStudyAuthorization,
  fetchStudyDefinition,
  pendingStudyEnrolmentId,
  requestStudyEnrolment,
  resolveStudyGrant,
  studyAuthorizationIsFresh,
  studyProgressMessage,
} from "@/lib/population-study";
import {
  initialStudyFlowState,
  studyFlowReducer,
} from "@/components/verify/study-flow-state";

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
  const { connected, publicKey, signMessage } = useWallet();
  const walletAddress = connected && publicKey ? publicKey.toBase58() : null;
  const [state, dispatch] = useReducer(verifyReducer, initialState);
  const [study, studyDispatch] = useReducer(
    studyFlowReducer,
    initialStudyFlowState,
  );
  const studyTokenRequestRef = useRef(false);
  const studyRequestGenerationRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchStudyDefinition(controller.signal)
      .then((definition) => {
        studyDispatch({ type: "DEFINITION_READY", definition });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          studyDispatch({ type: "STUDY_UNAVAILABLE" });
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (
      study.grant &&
      walletAddress !== study.grant.authorization.wallet_address
    ) {
      studyRequestGenerationRef.current += 1;
      studyTokenRequestRef.current = false;
      studyDispatch({ type: "LEAVE" });
      dispatch({ type: "RESET" });
    }
  }, [study.grant, walletAddress]);

  const handleStudyReady = useCallback((grant: ActiveStudyGrant | null) => {
    studyDispatch({ type: "READY", grant });
  }, []);

  const handleStudyRecordStatus = useCallback(
    (status: StudyRecordStatus | undefined) => {
      if (!study.grant) return;
      const resolution = resolveStudyGrant(study.grant, status);
      if (resolution.state === "unconfirmed") return;
      studyDispatch({
        type: "RECORD_STATUS",
        progress: {
          status: resolution.status,
          trialIndex: study.grant.trial_index,
          trialLimit: study.grant.trial_limit,
          completionReason:
            resolution.state === "complete" ? resolution.reason : null,
        },
        continuation:
          resolution.state === "awaiting_participant"
            ? {
                definition: resolution.definition,
                authorization: resolution.authorization,
              }
            : null,
      });
    },
    [study.grant],
  );

  const handleNextStudyTrial = useCallback(async () => {
    if (
      !study.continuation ||
      !walletAddress ||
      !signMessage ||
      studyTokenRequestRef.current
    ) {
      return;
    }
    const requestGeneration = ++studyRequestGenerationRef.current;
    const enrolmentId = pendingStudyEnrolmentId(
      study.continuation.definition,
      walletAddress,
    );
    studyTokenRequestRef.current = true;
    studyDispatch({ type: "NEXT_PENDING" });
    try {
      const authorization = studyAuthorizationIsFresh(
        study.continuation.authorization,
        walletAddress,
      )
        ? study.continuation.authorization
        : await createStudyAuthorization(
            study.continuation.definition,
            walletAddress,
            signMessage,
          );
      const nextGrant = await requestStudyEnrolment(
        authorization,
        study.continuation.definition,
        enrolmentId,
      );
      if (requestGeneration !== studyRequestGenerationRef.current) return;
      clearPendingStudyEnrolmentId(
        study.continuation.definition,
        walletAddress,
      );
      studyDispatch({ type: "NEXT_READY", grant: nextGrant });
      dispatch({ type: "RESET" });
    } catch {
      if (requestGeneration !== studyRequestGenerationRef.current) return;
      studyDispatch({
        type: "NEXT_FAILED",
        message:
          "The next study trial could not be prepared. Try again when you are ready.",
      });
    } finally {
      if (requestGeneration !== studyRequestGenerationRef.current) return;
      studyTokenRequestRef.current = false;
    }
  }, [signMessage, study.continuation, walletAddress]);

  const handleLeaveStudy = useCallback(() => {
    studyRequestGenerationRef.current += 1;
    studyTokenRequestRef.current = false;
    if (study.continuation) {
      clearPendingStudyEnrolmentId(
        study.continuation.definition,
        study.continuation.authorization.wallet_address,
      );
    }
    studyDispatch({ type: "LEAVE" });
    dispatch({ type: "RESET" });
  }, [study.continuation]);

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
          {study.definition &&
          study.decision === "pending" &&
          walletAddress &&
          signMessage ? (
            <StudyConsent
              key={`${study.definition.study_id}:${walletAddress}`}
              definition={study.definition}
              walletAddress={walletAddress}
              signMessage={signMessage}
              onReady={handleStudyReady}
            />
          ) : (
            <VerifyWalletConnected
              state={state}
              dispatch={dispatch}
              studyGrant={study.grant}
              studyCaptureBlocked={study.tokenPending}
              onStudyRecordStatus={handleStudyRecordStatus}
              onStudyNextTrial={handleNextStudyTrial}
              onStudyLeave={handleLeaveStudy}
              studyNextTrialPending={study.tokenPending}
              studyNextTrialAvailable={study.continuation !== null}
              studySessionActive={study.decision === "joined"}
            />
          )}
        </VerifyErrorBoundary>
      </div>
      {study.decision === "joined" && study.progress && (
        <div className="space-y-2 text-center" aria-live="polite">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-foreground/45">
            {study.tokenPending
              ? "Preparing the next research trial"
              : studyProgressMessage(
                  study.progress.status,
                  study.progress.trialIndex,
                  study.progress.trialLimit,
                  study.progress.completionReason,
                )}
          </p>
          {study.tokenError && (
            <p className="text-xs text-danger">{study.tokenError}</p>
          )}
        </div>
      )}
    </div>
  );
}
