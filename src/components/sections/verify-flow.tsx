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
import {
  clearPendingStudyEnrolmentId,
  createStudyAuthorization,
  fetchStudyDefinition,
  pendingStudyEnrolmentId,
  requestStudyEnrolment,
  resolveStudyGrant,
  StudyEnrolmentRequestError,
  studyAuthorizationIsFresh,
  studyProgressMessage,
} from "@/lib/population-study";
import {
  initialStudyFlowState,
  studyFlowReducer,
} from "@/components/verify/study-flow-state";

// The public route exposes wallet-connected validation only. The walletless
// scaffolding remains unavailable until it supports real validation.

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

  const handleStudyConsentAccepted = useCallback(() => {
    studyDispatch({ type: "CONSENT_ACCEPTED" });
  }, []);

  const handleStudyDeclined = useCallback(() => {
    studyDispatch({ type: "READY", grant: null });
  }, []);

  const handlePrepareStudyTrial = useCallback(async () => {
    if (
      study.decision !== "consented" ||
      !study.definition ||
      !walletAddress ||
      studyTokenRequestRef.current
    ) {
      return;
    }

    if (!signMessage) {
      studyDispatch({
        type: "PREPARE_FAILED",
        message: "This wallet cannot sign the study authorization message.",
      });
      return;
    }

    const requestGeneration = ++studyRequestGenerationRef.current;
    const enrolmentId = pendingStudyEnrolmentId(
      study.definition,
      walletAddress,
    );
    studyTokenRequestRef.current = true;
    studyDispatch({ type: "PREPARE_PENDING" });

    try {
      const authorization = await createStudyAuthorization(
        study.definition,
        walletAddress,
        signMessage,
      );
      const grant = await requestStudyEnrolment(
        authorization,
        study.definition,
        enrolmentId,
      );
      if (requestGeneration !== studyRequestGenerationRef.current) return;
      clearPendingStudyEnrolmentId(study.definition, walletAddress);
      studyDispatch({ type: "PREPARE_READY", grant });
    } catch (reason) {
      if (requestGeneration !== studyRequestGenerationRef.current) return;
      if (
        reason instanceof StudyEnrolmentRequestError &&
        (reason.code === "study_enrolment_expired" ||
          reason.code === "study_enrolment_conflict")
      ) {
        clearPendingStudyEnrolmentId(study.definition, walletAddress);
      }
      studyDispatch({
        type: "PREPARE_FAILED",
        message:
          reason instanceof Error
            ? reason.message
            : "Study trial authorization failed. Try again.",
        retryAllowed:
          !(reason instanceof StudyEnrolmentRequestError) ||
          (reason.code !== null &&
            reason.code !== "study_trial_limit_reached"),
      });
    } finally {
      if (requestGeneration !== studyRequestGenerationRef.current) return;
      studyTokenRequestRef.current = false;
    }
  }, [signMessage, study.decision, study.definition, walletAddress]);

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
          study.decision === "pending" ? (
            <StudyConsent
              key={study.definition.study_id}
              definition={study.definition}
              onAccept={handleStudyConsentAccepted}
              onDecline={handleStudyDeclined}
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
              studyPreparationRequired={study.decision === "consented"}
              studyPreparationError={
                study.decision === "consented" ? study.tokenError : null
              }
              studyPreparationRetryAllowed={study.tokenRetryAllowed}
              onStudyPrepare={handlePrepareStudyTrial}
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
