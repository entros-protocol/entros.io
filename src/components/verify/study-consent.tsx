"use client";

import { useEffect, useRef, useState } from "react";
import {
  clearPendingStudyEnrolmentId,
  createStudyAuthorization,
  hasStudyConsentAcknowledgement,
  pendingStudyEnrolmentId,
  rememberStudyConsentAcknowledgement,
  requestStudyEnrolment,
  studyConsentParagraphs,
  type ActiveStudyGrant,
  type StudyDefinition,
} from "@/lib/population-study";

interface StudyConsentProps {
  definition: StudyDefinition;
  walletAddress: string;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  onReady: (grant: ActiveStudyGrant | null) => void;
}

export function StudyConsent({
  definition,
  walletAddress,
  signMessage,
  onReady,
}: StudyConsentProps) {
  const [acknowledged] = useState(() =>
    hasStudyConsentAcknowledgement(definition),
  );
  const [accepted, setAccepted] = useState(acknowledged);
  const [state, setState] = useState<"consent" | "joining">("consent");
  const [error, setError] = useState<string | null>(null);
  const requestGenerationRef = useRef(0);

  useEffect(() => {
    return () => {
      requestGenerationRef.current += 1;
    };
  }, []);

  async function joinStudy() {
    if (!accepted) return;
    const requestGeneration = ++requestGenerationRef.current;
    setState("joining");
    setError(null);
    try {
      const authorization = await createStudyAuthorization(
        definition,
        walletAddress,
        signMessage,
      );
      const enrolmentId = pendingStudyEnrolmentId(definition, walletAddress);
      const grant = await requestStudyEnrolment(authorization, definition, enrolmentId);
      if (requestGeneration !== requestGenerationRef.current) return;
      clearPendingStudyEnrolmentId(definition, walletAddress);
      if (!acknowledged) {
        rememberStudyConsentAcknowledgement(definition);
      }
      onReady(grant);
    } catch (reason) {
      if (requestGeneration !== requestGenerationRef.current) return;
      setError(reason instanceof Error ? reason.message : "Study enrolment could not be completed.");
      setState("consent");
    }
  }

  function continueNormally() {
    requestGenerationRef.current += 1;
    clearPendingStudyEnrolmentId(definition, walletAddress);
    onReady(null);
  }

  return (
    <div
      className="mx-auto w-full max-w-md space-y-6"
      aria-busy={state === "joining"}
    >
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan">Devnet population study</p>
        <h2 className="mt-3 font-display text-3xl font-medium text-foreground">Help calibrate Entros</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/65">
          Complete the normal devnet verification. Entros links your encrypted study record to the wallet that owns your Anchor.
        </p>
      </div>

      <div className="space-y-3 border-y border-border py-5 text-sm leading-relaxed text-foreground/65">
        {studyConsentParagraphs(definition).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {definition.preview_only && (
          <p>This local interface preview does not write a study record.</p>
        )}
      </div>

      {acknowledged ? (
        <p className="text-center text-sm leading-relaxed text-foreground/65">
          This browser has already acknowledged this study notice. Starting a trial still requires your action.
        </p>
      ) : (
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground/75">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            disabled={state === "joining"}
            className="mt-1 size-4 accent-cyan"
          />
          <span>I have read this notice and consent to the encrypted study record described above.</span>
        </label>
      )}

      {error && (
        <p className="text-center text-xs text-danger" role="alert">
          {error}
        </p>
      )}

      <p className="sr-only" aria-live="polite">
        {state === "joining" ? "Preparing study trial" : ""}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={joinStudy}
          disabled={!accepted || state === "joining"}
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "joining"
            ? "Preparing study trial..."
            : acknowledged
              ? "Start study trial"
              : "Join study and continue"}
        </button>
        <button
          type="button"
          onClick={continueNormally}
          disabled={state === "joining"}
          className="rounded-full border border-border px-6 py-3 text-sm text-foreground/70 transition-colors hover:border-foreground/35 hover:text-foreground disabled:opacity-40"
        >
          Continue without study
        </button>
      </div>
    </div>
  );
}
