"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import type { Connection } from "@solana/web3.js";
import {
  PairedProtocolError,
  type PairedPhase,
  type PairedRoundView,
  type PairedSession,
} from "@entros/pulse-sdk";
import { usePulse } from "@/components/providers/pulse-provider";
import { PairedChallenge } from "./paired-challenge";
import type {
  CaptureIntent,
  PairedCaptureHandle,
  PairedFinish,
  VerifyAction,
} from "./types";

/** A frame above this level counts as heard for the quiet-microphone message. */
const VOICED_RMS = 0.008;
/** The SDK reports a level every 50 ms. The meter redraws at most this often. */
const METER_INTERVAL_MS = 100;

interface LiveSession {
  session: PairedSession;
  /** The wallet the session opened for. */
  wallet: string;
  intent: CaptureIntent;
  voicedFrames: number;
}

interface Meter {
  latest: number;
  /** The pending animation frame, or 0. */
  frame: number;
  paintedAt: number;
}

/** What the card shows for a session that could not start or continue. */
function failureAction(error: unknown): VerifyAction {
  // `start` keeps the browser's own error for a refused or missing microphone.
  if (error instanceof DOMException) {
    return {
      type: "VERIFICATION_FAILED",
      error:
        "Microphone access denied. Please allow microphone permission and try again.",
      failedAt: "capture",
    };
  }
  const failure =
    error instanceof PairedProtocolError
      ? error
      : new PairedProtocolError("technical_failure");
  return {
    type: "VERIFICATION_FAILED",
    error:
      failure.reason === "validation_unavailable"
        ? "Verification service unavailable. Please refresh and try again."
        : "This verification could not continue. Start a new verification.",
    reason: failure.reason,
    retryAfterSec: failure.retryAfterSecs,
    failedAt: "capture",
  };
}

/**
 * Runs a paired session: three rounds of one word and one short path.
 *
 * The verify card mounts this before its start screen, because the session
 * starts inside the tap that begins verification and this code has to be
 * loaded by then. It renders nothing until the card reaches its capture step.
 * A session ends when the card leaves that step, when the connected wallet
 * changes or disconnects, or when this unmounts.
 */
export function PairedCapture({
  capturing,
  wallet,
  connection,
  hasMotion,
  dispatch,
  onHandle,
  onCommitted,
}: {
  /** The card is on its capture step. */
  capturing: boolean;
  /** The connected wallet, or null. */
  wallet: string | null;
  connection: Connection;
  hasMotion: boolean;
  dispatch: React.ActionDispatch<[action: VerifyAction]>;
  /** Receives the handle once mounted, and null on unmount. */
  onHandle: (handle: PairedCaptureHandle | null) => void;
  /** Every round is committed. `finish` validates the session. */
  onCommitted: (finish: PairedFinish, voicedFrames: number) => void;
}) {
  const pulse = usePulse();
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const liveRef = useRef<LiveSession | null>(null);
  const meterRef = useRef<Meter>({ latest: 0, frame: 0, paintedAt: 0 });
  const [round, setRound] = useState<PairedRoundView | null>(null);
  const [phase, setPhase] = useState<PairedPhase>("idle");
  const [stalled, setStalled] = useState(false);
  const [level, setLevel] = useState(0);

  // The handle outlives each render, so it reads the latest props from here.
  const propsRef = useRef({ pulse, wallet, connection, dispatch, onCommitted });
  useLayoutEffect(() => {
    propsRef.current = { pulse, wallet, connection, dispatch, onCommitted };
  });

  /** Forgets the live session, so its late callbacks change nothing. */
  const detach = useCallback((): LiveSession | null => {
    const live = liveRef.current;
    liveRef.current = null;
    const meter = meterRef.current;
    if (meter.frame !== 0) cancelAnimationFrame(meter.frame);
    meter.frame = 0;
    return live;
  }, []);

  const handle = useMemo<PairedCaptureHandle>(() => {
    const isLive = (session: PairedSession) =>
      liveRef.current?.session === session;

    const fail = (session: PairedSession, error: unknown) => {
      if (!isLive(session)) return;
      detach();
      session.abort();
      propsRef.current.dispatch(failureAction(error));
    };

    // One redraw for each animation frame at most, and none sooner than the
    // interval, always with the latest level.
    const paint = (now: number) => {
      const meter = meterRef.current;
      if (now - meter.paintedAt < METER_INTERVAL_MS) {
        meter.frame = requestAnimationFrame(paint);
        return;
      }
      meter.frame = 0;
      meter.paintedAt = now;
      setLevel(meter.latest);
    };

    const commit = (session: PairedSession) => {
      if (!isLive(session) || session.currentPhase !== "ready") return;
      const live = detach();
      if (!live) return;
      // Finalize cannot be abandoned part way, so nothing aborts it from here on.
      const finish: PairedFinish = (signer, chain, onProgress) =>
        live.intent === "reset"
          ? session.completeReset(signer, chain, onProgress)
          : session.complete(signer, chain, onProgress);
      propsRef.current.onCommitted(finish, live.voicedFrames);
    };

    return {
      start(intent) {
        const { pulse, wallet, connection, dispatch } = propsRef.current;
        if (liveRef.current || !wallet) return false;
        const session = pulse.createPairedSession({
          onReveal: (next) => {
            if (!isLive(session)) return;
            setStalled(false);
            setRound(next);
          },
          onPhase: (next) => {
            if (!isLive(session)) return;
            setPhase(next);
            // Finalizing sets the phase again, so it starts outside this callback.
            if (next === "ready") queueMicrotask(() => commit(session));
          },
          onStall: () => {
            if (isLive(session)) setStalled(true);
          },
          onLevel: (rms) => {
            const live = liveRef.current;
            if (live?.session !== session) return;
            if (session.currentPhase === "round" && rms > VOICED_RMS) {
              live.voicedFrames += 1;
            }
            const meter = meterRef.current;
            meter.latest = rms;
            if (meter.frame === 0) meter.frame = requestAnimationFrame(paint);
          },
          onFailure: (error) => fail(session, error),
        });
        liveRef.current = { session, wallet, intent, voicedFrames: 0 };
        // The capture view commits inside the tap, because the session
        // records from its trace surface.
        flushSync(() => {
          setRound(null);
          setPhase("idle");
          setStalled(false);
          setLevel(0);
          dispatch({ type: "START_CAPTURE", intent });
        });
        const surface = surfaceRef.current;
        if (!surface) {
          detach();
          session.abort();
          dispatch({
            type: "VERIFICATION_FAILED",
            error: "The trace surface could not start. Try again.",
            failedAt: "capture",
          });
          return false;
        }
        session
          .start(wallet, surface, connection)
          .catch((error: unknown) => fail(session, error));
        return true;
      },
    };
  }, [detach]);

  useEffect(() => {
    onHandle(handle);
    return () => onHandle(null);
  }, [handle, onHandle]);

  // Leaving the capture step ends the session, including one still opening.
  useEffect(() => {
    if (!capturing) detach()?.session.abort();
  }, [capturing, detach]);

  // A session belongs to the wallet it opened for.
  useEffect(() => {
    const live = liveRef.current;
    if (!live || live.wallet === wallet) return;
    detach();
    live.session.abort();
    dispatch({ type: "RESET" });
  }, [wallet, dispatch, detach]);

  useEffect(
    () => () => {
      const live = detach();
      if (!live) return;
      live.session.abort();
      propsRef.current.dispatch({ type: "RESET" });
    },
    [detach],
  );

  if (!capturing) return null;
  return (
    <PairedChallenge
      surfaceRef={surfaceRef}
      round={round}
      phase={phase}
      stalled={stalled}
      level={level}
      hasMotion={hasMotion}
      onContinue={() => liveRef.current?.session.continueRound() ?? false}
    />
  );
}
