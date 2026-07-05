"use client";

import { useEffect, useRef, useState } from "react";
import type { PulseSession } from "@entros/pulse-sdk";
import type { VerifyState, VerifyAction } from "@/components/verify/types";
import { PulseChallenge } from "@/components/verify/pulse-challenge";
import { ProvingView, VerifiedView, FailedView } from "@/components/verify/step-views";
import { usePulse } from "@/components/providers/pulse-provider";
import { generateWalletlessPhrase } from "@/data/walletless-phrase-words";
import { Radio } from "lucide-react";

function commitmentToHex(bytes: Uint8Array): string {
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function VerifyWalletless({
  state,
  dispatch,
}: {
  state: VerifyState;
  dispatch: React.ActionDispatch<[action: VerifyAction]>;
}) {
  const pulse = usePulse();
  const touchRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<PulseSession | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasMotion, setHasMotion] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [processingStage, setProcessingStage] = useState("Extracting features...");
  const startingRef = useRef(false);
  const voicedFramesRef = useRef(0);
  // Cosmetic phrase for the walletless preview. Walletless mode doesn't
  // hit `/validate-features` so the phrase isn't bound to anything
  // server-side—but since #89 v3 the wallet-connected flow shows real
  // curated words, showing nonsense here would create a jarring style
  // mismatch for researchers comparing the two modes. Refreshed at the
  // top of every handleStart() so a Try-again gives a new phrase, and
  // never re-rolls during a single capture.
  const [walletlessPhrase, setWalletlessPhrase] = useState<string>(() =>
    generateWalletlessPhrase(5),
  );

  useEffect(() => {
    setHasMotion(navigator.maxTouchPoints > 0);
  }, []);

  async function handleStart() {
    if (startingRef.current) return;
    startingRef.current = true;
    setRequesting(true);
    // Roll a fresh cosmetic phrase for this attempt. Try-again clicks
    // re-enter handleStart and get a new phrase rather than reusing the
    // previous one.
    setWalletlessPhrase(generateWalletlessPhrase(5));

    try {
      voicedFramesRef.current = 0;

      const session = pulse.createSession(touchRef.current ?? document.body);
      sessionRef.current = session;

      // Motion first—DeviceMotionEvent.requestPermission() requires an active
      // user gesture on iOS. getUserMedia does not. If audio goes first, the gesture
      // token is consumed by the mic dialog and motion is silently denied.
      if (hasMotion) {
        try {
          await session.startMotion();
          if (!session.isMotionCapturing()) {
            dispatch({
              type: "VERIFICATION_FAILED",
              error: "Motion permission denied. Please allow motion access and try again.",
            });
            return;
          }
        } catch {
          dispatch({
            type: "VERIFICATION_FAILED",
            error: "Motion permission denied. Please allow motion access and try again.",
          });
          return;
        }
      } else {
        session.skipMotion();
      }

      // Audio second—getUserMedia works without a gesture on secure origins
      try {
        let audioFrameCount = 0;
        await session.startAudio((rms) => {
          if (rms > 0.008) voicedFramesRef.current++;
          audioFrameCount++;
          if (audioFrameCount % 2 === 0) setAudioLevel(rms);
        });
      } catch {
        dispatch({
          type: "VERIFICATION_FAILED",
          error: "Microphone access denied. Please allow microphone permission and try again.",
        });
        return;
      }

      session.startTouch().catch(() => session.skipTouch());

      dispatch({ type: "START_CAPTURE", intent: "verify" });
    } finally {
      startingRef.current = false;
      setRequesting(false);
    }
  }

  async function handleCaptureComplete() {
    const session = sessionRef.current;
    if (!session) return;

    try { await session.stopAudio(); } catch { /* skipped */ }
    try { await session.stopMotion(); } catch { /* skipped */ }
    try { await session.stopTouch(); } catch { /* skipped */ }

    dispatch({ type: "CAPTURE_DONE" });

    const PROOF_TIMEOUT_MS = 120_000;
    const proofPromise = session.complete(undefined, undefined, (stage) => {
      setProcessingStage(stage);
    });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Proof generation timed out. Please try again.")), PROOF_TIMEOUT_MS)
    );

    Promise.race([proofPromise, timeoutPromise])
      .then((result) => {
        if (result.compositeRiskScore !== undefined) {
          console.log(`[Entros] Walletless verification telemetry composite risk score: ${result.compositeRiskScore.toFixed(4)}`);
        }
        if (result.success) {
          dispatch({
            type: "VERIFICATION_SUCCESS",
            commitment: commitmentToHex(result.commitment),
            txSignature: result.txSignature,
          });
        } else {
          dispatch({
            type: "VERIFICATION_FAILED",
            error: result.error ?? "Verification failed",
          });
        }
      })
      .catch((err: Error) => {
        dispatch({
          type: "VERIFICATION_FAILED",
          error: err.message ?? "Unexpected error",
        });
      });
  }

  function handleReset() {
    sessionRef.current = null;
    (touchRef as React.MutableRefObject<HTMLDivElement | null>).current = null;
    setAudioLevel(0);
    dispatch({ type: "RESET" });
  }

  if (state.step === "idle") {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Radio className="mx-auto h-10 w-10 text-muted mb-4" strokeWidth={1.5} />
          <p className="font-mono text-base font-semibold text-foreground">
            Behavioral Verification
          </p>
          <p className="mt-2 text-sm text-foreground/70 max-w-sm mx-auto">
            Speak a phrase while tracing a shape. All sensors record
            simultaneously for 12 seconds. No wallet needed.
          </p>
        </div>
        <div className={`grid gap-4 mx-auto max-w-sm ${hasMotion ? "grid-cols-3" : "grid-cols-2"}`}>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-cyan font-mono text-xl font-bold">1</span>
            <span className="text-sm text-foreground/70">Speak the displayed phrase</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-solana-green font-mono text-xl font-bold">2</span>
            <span className="text-sm text-foreground/70">Trace the curve on screen</span>
          </div>
          {hasMotion && (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-solana-purple font-mono text-xl font-bold">3</span>
              <span className="text-sm text-foreground/70">Move naturally throughout</span>
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleStart}
            disabled={requesting}
            className="
              inline-flex items-center justify-center gap-2
              rounded-full bg-foreground px-6 py-3
              text-sm font-medium text-background
              transition-colors hover:bg-foreground/90
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {requesting ? "Requesting access..." : "Start Verification"}
          </button>
        </div>
        <p className="text-center text-xs text-muted">
          Capture and proof generation run entirely on your device.
        </p>
      </div>
    );
  }

  if (state.step === "capturing") {
    return (
      <PulseChallenge
        onComplete={handleCaptureComplete}
        touchRef={touchRef}
        audioLevel={audioLevel}
        hasMotion={hasMotion}
        phrase={walletlessPhrase}
      />
    );
  }

  if (state.step === "processing") return <ProvingView stage={processingStage} />;

  if (state.step === "verified") {
    return (
      <VerifiedView
        commitment={state.commitment}
        subtitle="Proof submitted via Entros relayer"
        onReset={handleReset}
      />
    );
  }

  if (state.step === "failed") {
    // No `onResetBaseline` passed: the "baseline missing" error path is
    // unreachable in walletless mode (it's gated on an on-chain anchor
    // existing for the connected wallet, and walletless has no wallet).
    // FailedView suppresses the Reset CTA when the handler is absent.
    return <FailedView error={state.error} onReset={handleReset} />;
  }

  return null;
}
