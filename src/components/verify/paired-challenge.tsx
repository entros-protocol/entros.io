"use client";

import { useRef, useState } from "react";
import {
  PAIRED_GRID_MAX as GRID,
  PAIRED_WAYPOINT_REACH as WAYPOINT_REACH,
  type PairedPhase,
  type PairedRoundView,
} from "@entros/pulse-sdk";

const AUDIO_BAR_COUNT = 12;
const BAR_OFFSETS = Array.from(
  { length: AUDIO_BAR_COUNT },
  (_, i) => 0.6 + 0.4 * Math.sin(i * 1.3),
);
/** Same rounding and clamping as the SDK, so reached waypoints agree with its tracker. */
function toGrid(offset: number, extent: number): number {
  return Math.min(GRID, Math.max(0, Math.round((offset / extent) * GRID)));
}

interface Stroke {
  roundIndex: number;
  data: string;
  /** True while the current subpath continues. A new press starts another one. */
  open: boolean;
  /** Waypoints reached so far, counted in the issued order as the SDK counts them. */
  reached: number;
}

/**
 * One paired round: the word, its numbered path and the person's stroke.
 *
 * The SDK records pressed points from the surface element this component
 * mounts, and the stroke drawn here shows the same points. Nothing appears on
 * the surface until the server reveals a round. The page never counts down and
 * never offers a way to skip ahead. A round ends on its own once the word is
 * heard and the trace has reached every dot in order, and the Continue link
 * appears only after the session reports a stall.
 */
export function PairedChallenge({
  surfaceRef,
  round,
  phase,
  stalled,
  level,
  hasMotion = true,
  onContinue,
}: {
  /** Handed to `PairedSession.start`, which records pressed points from it. */
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  /** The revealed round. Null until the server reveals round 1. */
  round: PairedRoundView | null;
  phase: PairedPhase;
  stalled: boolean;
  /** RMS of the latest audio frame. */
  level: number;
  hasMotion?: boolean;
  /** Ends a stalled round. Returns false until the trace has reached every dot in order. */
  onContinue: () => boolean;
}) {
  const roundIndex = round?.roundIndex ?? 0;
  const pathRef = useRef<SVGPathElement>(null);
  const strokeRef = useRef<Stroke>({
    roundIndex: 0,
    data: "",
    open: false,
    reached: 0,
  });
  // Each value carries the round it belongs to, so a new round starts clean
  // without an effect resetting state.
  const [reached, setReached] = useState({ roundIndex: 0, count: 0 });
  const [refusedRound, setRefusedRound] = useState<number | null>(null);

  const reachedNow = reached.roundIndex === roundIndex ? reached.count : 0;
  const recording = round !== null && phase === "round";

  function handlePointer(event: React.PointerEvent<HTMLDivElement>) {
    if (strokeRef.current.roundIndex !== roundIndex) {
      strokeRef.current = { roundIndex, data: "", open: false, reached: 0 };
    }
    const stroke = strokeRef.current;
    // Pressed points only, read from this event. A flag set on press and
    // cleared on release stays set when the release never arrives, and the
    // surface then draws on hover.
    if (!recording || !round || (event.buttons & 1) !== 1) {
      stroke.open = false;
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    if (!(rect.width > 0) || !(rect.height > 0)) return;
    if (event.type === "pointerdown") {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Touch input is captured implicitly. The SDK still records the points.
      }
    }
    const x = toGrid(event.clientX - rect.left, rect.width);
    const y = toGrid(event.clientY - rect.top, rect.height);
    stroke.data += stroke.open ? `L${x} ${y}` : `M${x} ${y}l0 0`;
    stroke.open = true;
    pathRef.current?.setAttribute("d", stroke.data);

    // A point counts toward the next waypoint only, so a dot passed out of
    // turn stays open until the ones before it are reached.
    let count = stroke.reached;
    for (let next = round.waypoints[count]; next; next = round.waypoints[count]) {
      const dx = x - next.x;
      const dy = y - next.y;
      if (dx * dx + dy * dy > WAYPOINT_REACH * WAYPOINT_REACH) break;
      count += 1;
    }
    if (count !== stroke.reached) {
      stroke.reached = count;
      setReached({ roundIndex, count });
    }
  }

  function endStroke() {
    strokeRef.current.open = false;
  }

  function handleContinue() {
    setRefusedRound(onContinue() ? null : roundIndex);
  }

  const normalizedAudio = Math.min(level * 25, 1);
  const isVoiceActive = level > 0.005;
  const waypoints = round?.waypoints ?? [];
  const announcement = !round
    ? ""
    : refusedRound === roundIndex
      ? "Trace the dots in order, then continue."
      : `Round ${round.roundIndex} of ${round.rounds}. Say the word ${round.word}. Trace the ${waypoints.length} dots in order.`;

  // Sized to fit the verify card's pinned height, so the card keeps one size
  // from the idle screen through every round.
  return (
    <div className="space-y-4">
      {/* The only live region, mounted before the first reveal so a screen
          reader announces each round when it arrives. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {round && (
        <>
          <div className="text-center">
            <p className="font-mono text-sm text-foreground tabular-nums">
              Round {round.roundIndex} of {round.rounds}
            </p>
            <div
              className="mx-auto mt-2 flex max-w-xs gap-1.5"
              aria-hidden="true"
            >
              {Array.from({ length: round.rounds }, (_, index) => (
                <span
                  key={index}
                  className={`h-1.5 flex-1 rounded-full ${
                    index < round.roundIndex ? "bg-cyan" : "bg-surface"
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-cyan">
              Say this word
            </p>
            <p
              className="font-mono text-2xl font-bold transition-[color,text-shadow] duration-150 md:text-3xl"
              style={{
                color: isVoiceActive
                  ? "var(--color-foreground)"
                  : "var(--color-muted)",
                textShadow: isVoiceActive
                  ? `0 0 ${10 + normalizedAudio * 20}px rgba(0, 240, 255, ${0.15 + normalizedAudio * 0.3})`
                  : "none",
              }}
            >
              {round.word}
            </p>
          </div>
        </>
      )}

      <div>
        {round && (
          <p className="mb-1 text-center font-mono text-xs uppercase tracking-widest text-solana-green">
            Trace from 1 to {waypoints.length}
          </p>
        )}
        <div
          className={
            round
              ? ""
              : "relative flex min-h-[340px] w-full items-center justify-center px-4 py-6"
          }
        >
          {!round && (
            <div className="flex max-w-sm flex-col items-center justify-center gap-4 text-center">
              <p className="font-mono text-base uppercase tracking-[0.18em] text-foreground/70 md:text-lg">
                Preparing round 1
              </p>
              <div className="max-w-[22rem] space-y-2">
                <p className="text-lg font-medium text-foreground md:text-xl">
                  Get ready to speak and trace.
                </p>
                <p className="text-balance text-base leading-relaxed text-foreground/70">
                  Each round shows one word and a short path. Say the word and
                  trace the path with your {hasMotion ? "finger" : "mouse"}.
                </p>
              </div>
            </div>
          )}
          <div
            className={`mx-auto aspect-square w-full max-w-[260px] border md:max-w-[280px] ${
              round
                ? "border-solana-green/30 bg-surface/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_48px_rgba(0,0,0,0.18)]"
                : "pointer-events-none absolute border-transparent opacity-0"
            }`}
          >
            <div
              ref={surfaceRef}
              aria-hidden={!round}
              data-testid="paired-trace-surface"
              className={`relative h-full w-full touch-none select-none ${
                round ? "cursor-crosshair" : "cursor-default"
              }`}
              onPointerDown={handlePointer}
              onPointerMove={handlePointer}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
            >
              {round && (
                <svg
                  viewBox={`0 0 ${GRID} ${GRID}`}
                  className="absolute inset-0 h-full w-full"
                  aria-hidden="true"
                >
                  <polyline
                    points={waypoints
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill="none"
                    stroke="var(--color-solana-green)"
                    strokeWidth={10}
                    strokeOpacity={0.45}
                    strokeDasharray="28 22"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    key={roundIndex}
                    ref={pathRef}
                    d=""
                    data-testid="paired-stroke"
                    fill="none"
                    stroke="var(--color-cyan)"
                    strokeWidth={12}
                    strokeOpacity={0.95}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {waypoints.map((point, index) => {
                    const done = index < reachedNow;
                    return (
                      <g key={`${roundIndex}-${index}`} data-reached={done}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r={40}
                          fill={
                            done
                              ? "var(--color-solana-green)"
                              : "var(--color-background)"
                          }
                          stroke="var(--color-solana-green)"
                          strokeWidth={8}
                        />
                        <text
                          x={point.x}
                          y={point.y}
                          dy="0.35em"
                          textAnchor="middle"
                          fontSize={44}
                          fontWeight={600}
                          className="font-mono"
                          fill={
                            done
                              ? "var(--color-background)"
                              : "var(--color-solana-green)"
                          }
                        >
                          {index + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {round && (
        <>
          <div className="flex flex-col items-center">
            <div className="flex h-7 items-end justify-center gap-[2px]">
              {BAR_OFFSETS.map((offset, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-cyan/60"
                  style={{
                    height: `${2 + normalizedAudio * 32 * offset}px`,
                    transition: "height 100ms ease",
                  }}
                />
              ))}
            </div>
            <p className="mt-1 font-mono text-[10px] text-muted">Voice</p>
          </div>

          <div className="space-y-2">
            <div className="min-h-[2.25rem] space-y-1 text-center">
              {phase === "committing" ? (
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  Sending round {round.roundIndex}
                </p>
              ) : (
                stalled &&
                phase === "round" && (
                  <>
                    <button
                      type="button"
                      onClick={handleContinue}
                      className="font-mono text-xs text-cyan underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Continue
                    </button>
                    {refusedRound === roundIndex && (
                      <p className="text-xs text-foreground/70">
                        Trace the dots in order, then continue.
                      </p>
                    )}
                  </>
                )
              )}
            </div>
            <p className="text-center text-xs text-muted">
              All sensors recording simultaneously. Raw recordings are not
              retained.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
