"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  randomLissajousParams,
  generateLissajousPoints,
  type LissajousParams,
  type CurveTracePoint,
} from "@entros/pulse-sdk";
import { appendBoundedPoint } from "../../lib/bounded-trace";

const CAPTURE_DURATION_S = 12;
const OUTLINE_SOURCE_LIMIT = 512;
/**
 * Grace period between the final tick rendering and handing the capture back,
 * so the user sees the counter reach zero rather than the view swapping under
 * them. It is recorded audio, so it is deliberately small.
 */
const CAPTURE_SETTLE_MS = 300;

const AUDIO_BAR_COUNT = 12;
const BAR_OFFSETS = Array.from(
  { length: AUDIO_BAR_COUNT },
  (_, i) => 0.6 + 0.4 * Math.sin(i * 1.3),
);
const TOUCH_BAR_COUNT = 10;
const TOUCH_BAR_OFFSETS = Array.from(
  { length: TOUCH_BAR_COUNT },
  (_, i) => 0.4 + 0.6 * Math.sin(i * 0.9 + 0.5),
);
const MOTION_BAR_HEIGHTS = Array.from(
  { length: 6 },
  () => 4 + Math.random() * 16,
);

export function PulseChallenge({
  onComplete,
  onCaptureWindowOpen,
  onCaptureError,
  touchRef,
  audioLevel = 0,
  hasMotion = true,
  phrase: providedPhrase,
  curve,
}: {
  onComplete: (outline: CurveTracePoint[]) => void;
  /**
   * Starts SDK touch capture against the mounted trace surface. The speak
   * prompt opens only after this callback resolves.
   */
  onCaptureWindowOpen?: (surface: HTMLDivElement) => void | Promise<void>;
  onCaptureError?: (error: unknown) => void;
  touchRef?: React.RefObject<HTMLDivElement | null>;
  audioLevel?: number;
  hasMotion?: boolean;
  phrase: string;
  /** Server-issued Lissajous curve parameters for touch challenge binding. */
  curve?: LissajousParams;
}) {
  const [countdown, setCountdown] = useState(3);
  const [captureStarted, setCaptureStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [touchLevel, setTouchLevel] = useState(0);
  const touchLevelRef = useRef(0);
  const outlineRef = useRef<CurveTracePoint[]>([]);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const captureRectRef = useRef<DOMRect | null>(null);
  const tracePathRef = useRef<SVGPathElement>(null);
  const traceFrameRef = useRef<number | null>(null);
  const tracePathDataRef = useRef("");
  const pendingTraceStartRef = useRef<CurveTracePoint | null>(null);
  const pendingTracePointRef = useRef<CurveTracePoint | null>(null);
  const displayedTracePointRef = useRef<CurveTracePoint | null>(null);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);
  const completedRef = useRef(false);
  const [audioHintVisible, setAudioHintVisible] = useState(false);
  const lastVoicedAtRef = useRef<number | null>(null);
  const firstVoicedAtRef = useRef<number | null>(null);
  const hasSpokenEnoughRef = useRef(false);
  const captureStartedAtRef = useRef<number | null>(null);

  // Both callbacks are held in refs because audio RMS updates re-render this
  // component several times a second with a fresh callback identity, and an
  // effect keyed on the prop itself would tear down and restart its timer on
  // every one of those renders.
  //
  // The refs are refreshed in an effect rather than assigned during render.
  // Writing a ref while rendering is a side effect in the render phase, which
  // React's compiler rules reject and which misbehaves under concurrent
  // rendering. Both reads happen from timers and event handlers after mount,
  // so a value that lands one commit later costs nothing.
  const onCompleteRef = useRef(onComplete);
  const onCaptureWindowOpenRef = useRef(onCaptureWindowOpen);
  const onCaptureErrorRef = useRef(onCaptureError);
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onCaptureWindowOpenRef.current = onCaptureWindowOpen;
    onCaptureErrorRef.current = onCaptureError;
  });

  const phrase = providedPhrase;
  const lissajousPoints = useMemo(() => {
    const params: LissajousParams = curve ?? randomLissajousParams();
    return generateLissajousPoints(params);
  }, [curve]);

  // Anchor positions for the lissajous curve in the 200×200 viewBox. Each
  // entry places a 100×100 curve box. Corner anchors fill one quadrant;
  // the middle anchor centers the curve at (100, 100). 100×100 matches
  // the historical curve dimensions so velocity-derivative features stay
  // at the same scale across all five anchors.
  const lissajousAnchor = useMemo(() => {
    if (curve?.anchorX != null && curve?.anchorY != null) {
      return { x: curve.anchorX, y: curve.anchorY, size: 100 };
    }
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
  }, [curve]);

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
    let remaining = 3;
    let cancelled = false;
    const interval = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        const surface = svgContainerRef.current;
        if (!surface) {
          onCaptureErrorRef.current?.(
            new Error("Touch surface was not mounted before capture"),
          );
          return;
        }
        void Promise.resolve(onCaptureWindowOpenRef.current?.(surface))
          .then(() => {
            if (!cancelled) setCaptureStarted(true);
          })
          .catch((error: unknown) => {
            if (!cancelled) onCaptureErrorRef.current?.(error);
          });
      }
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [captureStarted]);

  // Capture timer—starts after countdown
  // onComplete is stored in a ref to avoid restarting the interval when the
  // parent re-renders (audio RMS callbacks cause rapid re-renders with a new
  // onComplete reference each time, which would clear+recreate the interval
  // before it ever fires).
  useEffect(() => {
    if (!captureStarted) return;
    let nextElapsed = 0;
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      nextElapsed += 1;
      setElapsed(nextElapsed);
      if (nextElapsed >= CAPTURE_DURATION_S && !completedRef.current) {
        completedRef.current = true;
        clearInterval(interval);
        settleTimer = setTimeout(
          () => onCompleteRef.current(outlineRef.current),
          CAPTURE_SETTLE_MS,
        );
      }
    }, 1000);
    return () => {
      clearInterval(interval);
      if (settleTimer !== null) {
        clearTimeout(settleTimer);
      }
    };
  }, [captureStarted]);

  // Touch trace handler
  const handlePointer = useCallback(
    (e: PointerEvent) => {
      if (!captureStarted) return;
      const container = svgContainerRef.current;
      if (!container) return;
      const rect = captureRectRef.current ?? container.getBoundingClientRect();
      if (
        !Number.isFinite(rect.width) ||
        !Number.isFinite(rect.height) ||
        rect.width <= 0 ||
        rect.height <= 0
      ) {
        return;
      }
      captureRectRef.current = rect;
      const unitX = (e.clientX - rect.left) / rect.width;
      const unitY = (e.clientY - rect.top) / rect.height;
      if (unitX < 0 || unitX > 1 || unitY < 0 || unitY > 1) return;
      const x = unitX * 200;
      const y = unitY * 200;

      if (e.type === "pointerdown" && "setPointerCapture" in container) {
        try {
          container.setPointerCapture(e.pointerId);
        } catch {
          // The SDK still validates the path when pointer capture is unavailable.
        }
      }

      if (lastTouchPos.current) {
        const dx = x - lastTouchPos.current.x;
        const dy = y - lastTouchPos.current.y;
        const vel = Math.sqrt(dx * dx + dy * dy);
        const nextTouchLevel = touchLevelRef.current * 0.6 + vel * 0.02;
        touchLevelRef.current = nextTouchLevel;
      }
      lastTouchPos.current = { x, y };

      const point = { x, y, t: performance.now() };
      appendBoundedPoint(outlineRef.current, point, OUTLINE_SOURCE_LIMIT);
      if (
        displayedTracePointRef.current === null &&
        pendingTraceStartRef.current === null
      ) {
        pendingTraceStartRef.current = point;
      }
      pendingTracePointRef.current = point;
      if (traceFrameRef.current === null) {
        traceFrameRef.current = requestAnimationFrame(() => {
          traceFrameRef.current = null;
          const pointToDisplay = pendingTracePointRef.current;
          const firstPoint =
            displayedTracePointRef.current ?? pendingTraceStartRef.current;
          pendingTraceStartRef.current = null;
          pendingTracePointRef.current = null;
          if (firstPoint && pointToDisplay) {
            if (displayedTracePointRef.current === null) {
              tracePathDataRef.current = `M ${firstPoint.x} ${firstPoint.y}`;
            }
            if (
              firstPoint.x !== pointToDisplay.x ||
              firstPoint.y !== pointToDisplay.y
            ) {
              tracePathDataRef.current += ` L ${pointToDisplay.x} ${pointToDisplay.y}`;
            }
            displayedTracePointRef.current = pointToDisplay;
            tracePathRef.current?.setAttribute("d", tracePathDataRef.current);
          }
          setTouchLevel(touchLevelRef.current);
        });
      }
    },
    [captureStarted],
  );

  useEffect(() => {
    if (!captureStarted) {
      captureRectRef.current = null;
      return;
    }
    const invalidateCaptureRect = () => {
      captureRectRef.current = null;
    };
    window.addEventListener("resize", invalidateCaptureRect, { passive: true });
    return () => {
      window.removeEventListener("resize", invalidateCaptureRect);
    };
  }, [captureStarted]);

  useEffect(() => {
    return () => {
      if (traceFrameRef.current !== null) {
        cancelAnimationFrame(traceFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const decay = setInterval(() => setTouchLevel((prev) => prev * 0.9), 100);
    return () => clearInterval(decay);
  }, []);

  // Speech-presence threshold (0.008 RMS) aligns with voicedFramesRef across
  // verification components. Once voiced samples span at least 800ms between
  // first and last voiced sample, hasSpokenEnoughRef latches true and suppresses
  // the quiet warning for the remainder of the capture session.
  useEffect(() => {
    if (audioLevel > 0.008) {
      const now = Date.now();
      if (firstVoicedAtRef.current == null) {
        firstVoicedAtRef.current = now;
      }
      lastVoicedAtRef.current = now;
      if (
        !hasSpokenEnoughRef.current &&
        now - firstVoicedAtRef.current >= 800
      ) {
        hasSpokenEnoughRef.current = true;
        setAudioHintVisible(false);
      }
    }
  }, [audioLevel]);

  useEffect(() => {
    if (!captureStarted) return;
    captureStartedAtRef.current = Date.now();
    const interval = setInterval(() => {
      // Check if user spoke enough before evaluating quiet duration
      if (firstVoicedAtRef.current != null && lastVoicedAtRef.current != null) {
        if (lastVoicedAtRef.current - firstVoicedAtRef.current >= 800) {
          hasSpokenEnoughRef.current = true;
        }
      }

      if (hasSpokenEnoughRef.current) {
        setAudioHintVisible(false);
        clearInterval(interval);
        return;
      }
      const captureStart = captureStartedAtRef.current;
      if (captureStart == null) return;
      if (Date.now() - captureStart < 2000) return;
      const lastVoiced = lastVoicedAtRef.current;
      const quietFor =
        lastVoiced == null
          ? Date.now() - captureStart
          : Date.now() - lastVoiced;
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
    const mutableRef =
      touchRef as React.MutableRefObject<HTMLDivElement | null>;
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

  const remaining = Math.max(0, CAPTURE_DURATION_S - elapsed);
  const progress = (elapsed / CAPTURE_DURATION_S) * 100;
  const normalizedAudio = Math.min(audioLevel * 25, 1);
  const isVoiceActive = audioLevel > 0.005;
  const normalizedTouch = Math.min(touchLevel, 1);

  return (
    <div className="space-y-5">
      {!captureStarted ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-foreground/70">
            {countdown > 0 ? "Recording starts in..." : "Preparing capture..."}
          </p>
          <p className="font-mono text-6xl font-bold text-cyan tabular-nums">
            {countdown}
          </p>
          <p className="text-xs text-muted">
            {hasMotion
              ? "Speak clearly and trace the curve with your finger"
              : "Speak clearly and trace the curve with your mouse"}
          </p>
        </div>
      ) : (
        <>
          <div className="text-center">
            <p className="font-mono text-3xl font-bold text-foreground tabular-nums">
              {remaining}s
            </p>
            <div className="mt-2 mx-auto max-w-xs h-1.5 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full rounded-full bg-cyan transition-[width] duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan mb-1">
              Speak this phrase
            </p>
            <p
              className="text-lg font-mono font-bold transition-[color,text-shadow] duration-150 md:text-xl"
              style={{
                color: isVoiceActive
                  ? "var(--color-foreground)"
                  : "var(--color-muted)",
                textShadow: isVoiceActive
                  ? `0 0 ${10 + normalizedAudio * 20}px rgba(0, 240, 255, ${0.15 + normalizedAudio * 0.3})`
                  : "none",
              }}
            >
              &ldquo;{phrase}&rdquo;
            </p>
          </div>
        </>
      )}

      {/* Curve */}
      <div>
        {captureStarted && (
          <p className="text-center text-xs font-mono uppercase tracking-widest text-solana-green mb-1">
            Trace the curve
          </p>
        )}
        <div
          ref={svgContainerRef}
          aria-hidden={!captureStarted}
          className={`mx-auto flex h-[200px] w-[200px] items-center justify-center rounded-2xl border touch-none md:h-[240px] md:w-[240px] ${
            captureStarted
              ? "cursor-crosshair border-solana-green/50 bg-surface/30"
              : "cursor-default border-transparent bg-transparent"
          }`}
        >
          {captureStarted && (
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
              <path
                ref={tracePathRef}
                d=""
                fill="none"
                stroke="var(--color-cyan)"
                strokeWidth="3"
                strokeOpacity="0.95"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Sensor indicators */}
      {captureStarted && (
        <div
          className={`grid gap-3 text-center ${hasMotion ? "grid-cols-3" : "grid-cols-2"}`}
        >
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
      )}

      {captureStarted && (
        <div className="space-y-1.5">
          <div className="min-h-[1rem]" role="status" aria-live="polite">
            {audioHintVisible && (
              <p className="text-center text-xs text-warning">
                Microphone audio is too quiet. Try speaking up or moving closer.
              </p>
            )}
          </div>
          <p className="text-center text-xs text-muted">
            All sensors recording simultaneously. Raw recordings are not
            retained.
          </p>
        </div>
      )}
    </div>
  );
}
