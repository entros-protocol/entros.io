"use client";

import { useEffect, useState } from "react";
import {
  POPULATION_STUDY_CONSENT_TEXT,
  parseStudyDefinition,
  requestStudyEnrolment,
  type ActiveStudyGrant,
  type StudyDefinition,
} from "@/lib/population-study";

interface StudyConsentProps {
  invitation: string;
  onReady: (grant: ActiveStudyGrant | null) => void;
}

export function StudyConsent({ invitation, onReady }: StudyConsentProps) {
  const [definition, setDefinition] = useState<StudyDefinition | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [state, setState] = useState<"checking" | "consent" | "joining" | "error">("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/study/definition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitation }),
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("This study invitation is unavailable.");
        const definition = parseStudyDefinition(await response.json());
        if (!definition) throw new Error("This study invitation returned an invalid response.");
        return definition;
      })
      .then((activeDefinition) => {
        setDefinition(activeDefinition);
        setState("consent");
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "This study invitation is unavailable.");
        setState("error");
      });
    return () => controller.abort();
  }, [invitation]);

  async function joinStudy() {
    if (!accepted || !definition) return;
    setState("joining");
    setError(null);
    try {
      onReady(await requestStudyEnrolment(invitation, definition));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Study enrolment could not be completed.");
      setState("error");
    }
  }

  function continueNormally() {
    onReady(null);
  }

  if (state === "checking") {
    return (
      <div className="space-y-4 text-center" aria-live="polite">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan">Research invitation</p>
        <p className="text-sm text-foreground/60">Checking the invitation...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="space-y-6 text-center" role="alert">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan">Research invitation</p>
        <h2 className="font-display text-3xl text-foreground">Study unavailable</h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-foreground/65">{error}</p>
        <button
          type="button"
          onClick={continueNormally}
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Continue with normal verification
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan">Private research invitation</p>
        <h2 className="mt-3 font-display text-3xl font-medium text-foreground">Help calibrate Entros</h2>
        <p className="mt-3 text-sm leading-relaxed text-foreground/65">
          Complete the normal devnet verification. Your study record stays separate from your wallet.
        </p>
      </div>

      <div className="space-y-3 border-y border-border py-5 text-sm leading-relaxed text-foreground/65">
        {POPULATION_STUDY_CONSENT_TEXT.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        {definition && (
          <p>
            Entros retains this study record for {definition.retention_days} days. This invitation allows up to {definition.trial_limit} trials.
          </p>
        )}
        {definition?.preview_only && (
          <p>This local interface preview does not write a study record.</p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground/75">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 size-4 accent-cyan"
        />
        <span>I have read this notice and consent to the encrypted study record described above.</span>
      </label>

      {error && <p className="text-center text-xs text-danger">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={joinStudy}
          disabled={!accepted || state === "joining"}
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {state === "joining" ? "Joining study..." : "Join study and continue"}
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
