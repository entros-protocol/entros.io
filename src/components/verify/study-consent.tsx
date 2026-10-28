"use client";

import { useState } from "react";
import {
  hasStudyConsentAcknowledgement,
  rememberStudyConsentAcknowledgement,
  studyConsentParagraphs,
  type StudyDefinition,
} from "@/lib/population-study";
import {
  primaryVerificationActionClass,
  secondaryVerificationActionClass,
} from "./verification-styles";

interface StudyConsentProps {
  definition: StudyDefinition;
  onAccept: () => void;
  onDecline: () => void;
}

export function StudyConsent({
  definition,
  onAccept,
  onDecline,
}: StudyConsentProps) {
  const [acknowledged] = useState(() =>
    hasStudyConsentAcknowledgement(definition),
  );
  const [accepted, setAccepted] = useState(acknowledged);

  function joinStudy() {
    if (!accepted) return;
    if (!acknowledged) {
      rememberStudyConsentAcknowledgement(definition);
    }
    onAccept();
  }

  function continueNormally() {
    onDecline();
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          Devnet population study
        </p>
        <h2 className="mt-3 font-display text-3xl font-normal tracking-[-0.01em] text-foreground">
          Help calibrate Entros
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/65">
          Complete the normal devnet verification. Entros links your encrypted
          study record to the wallet that owns your Anchor.
        </p>
      </div>

      <div className="space-y-3 border-y border-foreground/[0.08] py-5 text-[13px] leading-relaxed text-foreground/60">
        {studyConsentParagraphs(definition).map((paragraph, index) => (
          <p key={paragraph} className="grid grid-cols-[1.75rem_1fr]">
            <span className="font-mono text-[10px] leading-[1.6rem] text-foreground/35">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{paragraph}</span>
          </p>
        ))}
        {definition.preview_only && (
          <p>This local interface preview does not write a study record.</p>
        )}
      </div>

      {acknowledged ? (
        <p className="text-center text-sm leading-relaxed text-foreground/65">
          This browser has already acknowledged this study notice. Starting a
          trial still requires your action.
        </p>
      ) : (
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground/75">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 size-4 accent-cyan"
          />
          <span>
            I have read this notice and consent to the encrypted study record
            described above.
          </span>
        </label>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={joinStudy}
          disabled={!accepted}
          className={primaryVerificationActionClass}
        >
          {acknowledged
            ? "Continue to wallet setup"
            : "Join study and continue"}
        </button>
        <button
          type="button"
          onClick={continueNormally}
          className={secondaryVerificationActionClass}
        >
          Continue without study
        </button>
      </div>
    </div>
  );
}
