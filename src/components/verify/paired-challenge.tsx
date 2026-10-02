"use client";

import { useEffect, useRef, useState } from "react";
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
/**
 * Once the outline passes and Continue is offered, the round is waiting on
 * heard speech. If nothing registers within this window, ask for the word
 * again rather than leaving the round silent.
 */
const VOICE_PROMPT_DELAY_MS = 2500;
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
 * the surface until the server reveals a round. Continue availability and cue
 * phases come from the session controller. The meter shows microphone amplitude;
 * the word highlight follows the controller's speech activity classification.
 */
export function PairedChallenge({
  surfaceRef,
  round,
  phase,
  canContinue,
  level,
  speechActive,
  hasMotion = true,
  onContinue,
}: {
  /** Handed to `PairedSession.start`, which records pressed points from it. */
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  /** The revealed round. Null until the server reveals round 1. */
  round: PairedRoundView | null;
  phase: PairedPhase;
  canContinue: boolean;
  /** RMS of the latest audio frame. */
  level: number;
  /** Classification of this frame by the session tracker. */
  speechActive: boolean;
  hasMotion?: boolean;
  /** Requests the final cue after speech. Returns false until the visible outline passes. */
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
  /** The round whose speech never registered after its outline passed. */
  const [voicePrompt, setVoicePrompt] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "round" || !canContinue) return;
    const timer = setTimeout(() => setVoicePrompt(roundIndex), VOICE_PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, canContinue, roundIndex]);

  const reachedNow = reached.roundIndex === roundIndex ? reached.count : 0;
  const recording = round !== null && (phase === "round" || phase === "cue");
  const [now,setNow]=useState(() => performance.now());
  useEffect(() => {
    if (phase !== "round" && phase !== "cue_loading" && phase !== "cue") return;
    const timer=setInterval(() => setNow(performance.now()),100);
    return () => clearInterval(timer);
  },[phase]);
  const remaining=Math.max(0,Math.ceil(((round?.expiresAtMs ?? now)-now)/1000));

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
  const isVoiceActive = phase === "round" && speechActive;
  const waypoints = round?.waypoints ?? [];
  const announcement = !round
    ? ""
    : refusedRound === roundIndex
      ? "Trace the dots in order, then continue."
      : phase === "cue" ? "Trace to the new final point."
      : phase === "cue_loading" ? "Loading the final point."
      : voicePrompt === roundIndex && !speechActive
        ? "We couldn't hear that. Say the word once more, a little louder."
        : `Round ${round.roundIndex} of ${round.rounds}. Say the word ${round.word}. Trace the ${waypoints.length} dots in order.`;

  // One fixed height from preparation through the final round. Every row
  // keeps its size in every phase, and controls or prompts appear inside
  // reserved lines, so nothing that renders can ever shift or resize the
  // capture view or the card around it.
  return (
    <div className="flex h-[540px] flex-col md:h-[580px]">
      {/* The only live region, mounted before the first reveal so a screen
          reader announces each round when it arrives. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      {/* Round header. The slot is reserved before the first reveal. */}
      <div className="h-[104px] shrink-0 overflow-hidden text-center">
        <p className="font-mono text-sm text-foreground tabular-nums">
          {round ? `Round ${round.roundIndex} of ${round.rounds}` : " "}
        </p>
        <div
          className="mx-auto mt-2 flex max-w-xs gap-1.5"
          aria-hidden="true"
        >
          {Array.from({ length: round?.rounds ?? 3 }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 flex-1 rounded-full ${
                round && index < round.roundIndex ? "bg-cyan" : "bg-surface"
              }`}
            />
          ))}
        </div>
        <p className="mt-3 font-mono text-xs uppercase tracking-widest text-cyan">
          {round ? "Say this word" : " "}
        </p>
        <p
          className="mt-1 font-mono text-2xl font-bold transition-[color,text-shadow] duration-150 md:text-3xl"
          style={{
            color: isVoiceActive
              ? "var(--color-foreground)"
              : "var(--color-muted)",
            textShadow: isVoiceActive
              ? `0 0 ${10 + normalizedAudio * 20}px rgba(0, 240, 255, ${0.15 + normalizedAudio * 0.3})`
              : "none",
          }}
        >
          {round ? round.word : " "}
        </p>
      </div>

      {/* Trace label. One fixed line under the header. */}
      <p className="h-[20px] shrink-0 overflow-hidden text-center font-mono text-xs uppercase tracking-widest text-solana-green">
        {round
          ? phase === "cue"
            ? `Trace to the new point ${waypoints.length}`
            : `Trace from 1 to ${waypoints.length}`
          : " "}
      </p>

      {/* Trace surface. The square keeps one geometry from mount through the
          final round; only its visibility changes. The pre-reveal guidance is
          an overlay inside the same slot, never a resize. */}
      <div className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center transition-opacity duration-150 ${
            round ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-hidden={round !== null}
        >
          <p className="font-mono text-base uppercase tracking-[0.18em] text-foreground/70 md:text-lg">
            Preparing round 1
          </p>
          <div className="max-w-[22rem] space-y-2">
            <p className="text-lg font-medium text-foreground md:text-xl">
              Get ready to speak and trace.
            </p>
            <p className="text-balance text-base leading-relaxed text-foreground/70">
              Each round shows one word and a short path. Say the word and trace
              the path with your {hasMotion ? "finger" : "mouse"}.
            </p>
          </div>
        </div>
        <div className="flex h-full items-center justify-center">
          <div
            className={`aspect-square h-[260px] border transition-opacity duration-150 md:h-[280px] ${
              round
                ? "border-solana-green/30 bg-surface/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_18px_48px_rgba(0,0,0,0.18)]"
                : "pointer-events-none border-transparent opacity-0"
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

      {/* Microphone meter. Always mounted; the bars rest flat before reveal. */}
      <div className="flex h-[48px] shrink-0 flex-col items-center justify-center overflow-hidden">
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
        <p className="mt-1 font-mono text-[10px] text-muted">Microphone level</p>
      </div>

      {/* Status and prompts: three fixed lines. The Continue control and the
          messages appear inside them without moving anything else. */}
      <div className="h-[60px] shrink-0 overflow-hidden text-center">
        <div className="h-5">
          {phase === "committing" ? (
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              Sending round {round?.roundIndex}
            </p>
          ) : phase === "cue_loading" ? (
            <p className="text-xs text-muted">Loading the final point…</p>
          ) : phase === "cue" ? (
            <p className="text-xs text-muted">Finish the trace at the new point.</p>
          ) : (
            phase === "round" &&
            canContinue && (
              <button
                type="button"
                onClick={handleContinue}
                className="font-mono text-xs text-cyan underline underline-offset-4 transition-colors hover:text-foreground"
              >
                I spoke · Continue
              </button>
            )
          )}
        </div>
        <div className="h-5">
          {round &&
            phase === "round" &&
            canContinue &&
            refusedRound === roundIndex && (
              <p className="text-xs text-foreground/70">
                Trace the dots in order, then continue.
              </p>
            )}
        </div>
        <div className="h-5">
          {round &&
            phase === "round" &&
            canContinue &&
            voicePrompt === roundIndex &&
            !speechActive && (
              <p className="text-xs text-foreground/70">
                We couldn't hear that. Say the word once more, a little louder.
              </p>
            )}
        </div>
      </div>

      {/* Timer and privacy line. Both lines are reserved in every phase. */}
      <div className="h-[40px] shrink-0 overflow-hidden text-center">
        <p className="h-5 font-mono text-xs tabular-nums text-muted">
          {round &&
          (phase === "round" || phase === "cue_loading" || phase === "cue")
            ? `${remaining}s remaining`
            : " "}
        </p>
        <p className="mt-1 text-xs text-muted">
          All sensors recording simultaneously. Raw recordings are not retained.
        </p>
      </div>
    </div>
  );
}
