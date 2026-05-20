"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  randomLissajousParams,
  generateLissajousPoints,
} from "@entros/pulse-sdk";

const CAPTURE_DURATION_S = 12;

const AUDIO_BAR_COUNT = 12;
const BAR_OFFSETS = Array.from({ length: AUDIO_BAR_COUNT }, (_, i) =>
  0.6 + 0.4 * Math.sin(i * 1.3)
);
const TOUCH_BAR_COUNT = 10;
const TOUCH_BAR_OFFSETS = Array.from({ length: TOUCH_BAR_COUNT }, (_, i) =>
  0.4 + 0.6 * Math.sin(i * 0.9 + 0.5)
);
const MOTION_BAR_HEIGHTS = Array.from({ length: 6 }, () => 4 + Math.random() * 16);

export function PulseChallenge({
  onComplete,
  touchRef,
  audioLevel = 0,
  hasMotion = true,
  phrase: providedPhrase,
}: {
  onComplete: () => void;
  touchRef?: React.RefObject<HTMLDivElement | null>;
  audioLevel?: number;
  hasMotion?: boolean;
  /**
   * Server-issued challenge phrase. The verify flow fetches this through the
   * `/api/relay-challenge` same-origin proxy. Required — if absent, the
   * parent component must fail the verification before rendering this
   * component. Earlier versions silently fell back to client-generated
   * nonsense syllables, which produced a broken UX (gibberish words shown
   * to users) and bypassed phrase content binding server-side.
   */
  phrase: string;
}) {
  const [countdown, setCountdown] = useState(3);
  const [captureStarted, setCaptureStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [tracePath, setTracePath] = useState("");
  const [touchLevel, setTouchLevel] = useState(0);
  const traceRef = useRef<string[]>([]);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const [audioHintVisible, setAudioHintVisible] = useState(false);
  const lastVoicedAtRef = useRef<number | null>(null);
  const captureStartedAtRef = useRef<number | null>(null);

  const phrase = providedPhrase;
  const lissajousPoints = useMemo(() => {
    const params = randomLissajousParams();
    return generateLissajousPoints(params);
  }, []);

  // Anchor positions for the lissajous curve in the 200×200 viewBox. Each
  // entry places a 100×100 curve box. Corner anchors fill one quadrant;
  // the middle anchor centers the curve at (100, 100). 100×100 matches
  // the historical curve dimensions so velocity-derivative features stay
  // at the same scale across all five anchors.
  const lissajousAnchor = useMemo(() => {
    const anchors = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 50, y: 50 },
    ];
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return { ...anchors[arr[0]! % anchors.length]!, size: 100 };
  }, []);

  const svgPath = useMemo(() => {
    if (lissajousPoints.length === 0) return "";
    const { x: ox, y: oy, size } = lissajousAnchor;
    const first = lissajousPoints[0]!;
    return (
      `M ${first.x * size + ox} ${first.y * size + oy}` +
      lissajousPoints
        .slice(1)
        .map((p) => ` L ${p.x * size + ox} ${p.y * size + oy}`)
        .join("")
    );
  }, [lissajousPoints, lissajousAnchor]);

  // 3-second countdown before capture begins
  useEffect(() => {
    if (captureStarted) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [captureStarted]);

  // When countdown hits 0, start capture
  useEffect(() => {
    if (countdown === 0 && !captureStarted) {
      setCaptureStarted(true);
    }
  }, [countdown, captureStarted]);

  // Capture timer—starts after countdown
  // onComplete is stored in a ref to avoid restarting the interval when the
  // parent re-renders (audio RMS callbacks cause rapid re-renders with a new
  // onComplete reference each time, which would clear+recreate the interval
  // before it ever fires).
  useEffect(() => {
    if (!captureStarted) return;
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= CAPTURE_DURATION_S && !completedRef.current) {
          completedRef.current = true;
          clearInterval(interval);
          setTimeout(() => onCompleteRef.current(), 300);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [captureStarted]);

  // Touch trace handler
  const handlePointer = useCallback((e: PointerEvent) => {
    const container = svgContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 200;
    const y = ((e.clientY - rect.top) / rect.height) * 200;

    if (lastTouchPos.current) {
      const dx = x - lastTouchPos.current.x;
      const dy = y - lastTouchPos.current.y;
      const vel = Math.sqrt(dx * dx + dy * dy);
      setTouchLevel((prev) => prev * 0.6 + vel * 0.02);
    }
    lastTouchPos.current = { x, y };

    const cmd = traceRef.current.length === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    traceRef.current.push(cmd);
    setTracePath(traceRef.current.join(""));
  }, []);

  useEffect(() => {
    const decay = setInterval(() => setTouchLevel((prev) => prev * 0.9), 100);
    return () => clearInterval(decay);
  }, []);

  useEffect(() => {
    if (audioLevel > 0.005) {
      lastVoicedAtRef.current = Date.now();
    }
  }, [audioLevel]);

  useEffect(() => {
    if (!captureStarted) return;
    captureStartedAtRef.current = Date.now();
    const interval = setInterval(() => {
      const captureStart = captureStartedAtRef.current;
      if (captureStart == null) return;
      if (Date.now() - captureStart < 2000) return;
      const lastVoiced = lastVoicedAtRef.current;
      const quietFor =
        lastVoiced == null ? Date.now() - captureStart : Date.now() - lastVoiced;
      setAudioHintVisible(quietFor >= 2000);
    }, 500);
    return () => clearInterval(interval);
  }, [captureStarted]);

  useEffect(() => {
    const el = svgContainerRef.current;
    if (!el) return;
    el.addEventListener("pointermove", handlePointer as EventListener);
    el.addEventListener("pointerdown", handlePointer as EventListener);
    return () => {
      el.removeEventListener("pointermove", handlePointer as EventListener);
      el.removeEventListener("pointerdown", handlePointer as EventListener);
    };
  }, [handlePointer, captureStarted]);

  useEffect(() => {
    if (!touchRef || !("current" in touchRef)) return;
    const mutableRef = touchRef as React.MutableRefObject<HTMLDivElement | null>;
    if (svgContainerRef.current) {
      mutableRef.current = svgContainerRef.current;
    }
    return () => {
      // Null the parent ref on unmount. React only auto-nulls refs attached
      // via the `ref={}` prop; manually-assigned refs must clean themselves
      // up or the parent keeps pointing at detached DOM nodes.
      mutableRef.current = null;
    };
  }, [touchRef, captureStarted]);

  // --- Countdown screen ---
  if (!captureStarted) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-sm text-foreground/70">Recording starts in...</p>
        <p className="font-mono text-6xl font-bold text-cyan tabular-nums">
          {countdown}
        </p>
        <p className="text-xs text-muted">
          {hasMotion
            ? "Speak clearly and trace the curve with your finger"
            : "Speak clearly and trace the curve with your mouse"}
        </p>
      </div>
    );
  }

  // --- Active capture ---
  const remaining = Math.max(0, CAPTURE_DURATION_S - elapsed);
  const progress = (elapsed / CAPTURE_DURATION_S) * 100;
  const normalizedAudio = Math.min(audioLevel * 25, 1);
  const isVoiceActive = audioLevel > 0.005;
  const normalizedTouch = Math.min(touchLevel, 1);

  return (
    <div className="space-y-5">
      {/* Timer */}
      <div className="text-center">
        <p className="font-mono text-3xl font-bold text-foreground tabular-nums">
          {remaining}s
        </p>
        <div className="mt-2 mx-auto max-w-xs h-1.5 rounded-full bg-surface overflow-hidden">
          <div
            className="h-full rounded-full bg-cyan transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Phrase */}
      <div className="text-center">
        <p className="text-xs font-mono uppercase tracking-widest text-cyan mb-1">
          Speak this phrase
        </p>
        <p
          className="text-lg font-mono font-bold transition-all duration-150 md:text-xl"
          style={{
            color: isVoiceActive ? "var(--color-foreground)" : "var(--color-muted)",
            textShadow: isVoiceActive
              ? `0 0 ${10 + normalizedAudio * 20}px rgba(0, 240, 255, ${0.15 + normalizedAudio * 0.3})`
              : "none",
          }}
        >
          &ldquo;{phrase}&rdquo;
        </p>
      </div>

      {/* Curve */}
      <div>
        <p className="text-center text-xs font-mono uppercase tracking-widest text-solana-green mb-1">
          Trace the curve
        </p>
        <div
          ref={svgContainerRef}
          className="mx-auto h-[200px] w-[200px] md:h-[240px] md:w-[240px] rounded-2xl border border-solana-green/50 bg-surface/30 flex items-center justify-center touch-none cursor-crosshair"
        >
          <svg viewBox="0 0 200 200" className="h-full w-full">
            <path
              d={svgPath}
              fill="none"
              stroke="var(--color-solana-green)"
              strokeWidth="3"
              strokeOpacity={0.7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {tracePath && (
              <path
                d={tracePath}
                fill="none"
                stroke="var(--color-cyan)"
                strokeWidth="3"
                strokeOpacity="0.95"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Sensor indicators */}
      <div className={`grid gap-3 text-center ${hasMotion ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="p-2.5">
          <div className="h-7 flex items-center justify-center">
            <div className="flex gap-[2px] items-end">
              {BAR_OFFSETS.map((offset, i) => (
                <div
                  key={i}
                  className="w-1 bg-cyan/60 rounded-full"
                  style={{
                    height: `${2 + normalizedAudio * 32 * offset}px`,
                    transition: "height 100ms ease",
                  }}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted font-mono">Voice</p>
        </div>

        {hasMotion && (
          <div className="p-2.5">
            <div className="h-7 flex items-center justify-center">
              <div className="flex gap-[2px] items-end">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-solana-purple/60 rounded-full animate-pulse"
                    style={{
                      height: `${MOTION_BAR_HEIGHTS[i]}px`,
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
            <p className="mt-1 text-[10px] text-muted font-mono">Motion</p>
          </div>
        )}

        <div className="p-2.5">
          <div className="h-7 flex items-center justify-center">
            <div className="flex gap-[2px] items-end">
              {TOUCH_BAR_OFFSETS.map((offset, i) => (
                <div
                  key={i}
                  className="w-1 bg-solana-green/60 rounded-full"
                  style={{
                    height: `${3 + normalizedTouch * 32 * offset}px`,
                    transition: "height 120ms ease-out",
                  }}
                />
              ))}
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted font-mono">Touch</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {audioHintVisible && (
          <p className="text-center text-xs text-warning">
            We can&apos;t hear you. Try moving closer to your microphone.
          </p>
        )}
        <p className="text-center text-xs text-muted">
          All sensors recording simultaneously. Raw data is never stored.
        </p>
      </div>
    </div>
  );
}
