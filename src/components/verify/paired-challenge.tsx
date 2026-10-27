"use client";

import { useEffect, useRef, useState } from "react";
import {
  PAIRED_GRID_MAX as GRID,
  PAIRED_WAYPOINT_REACH as WAYPOINT_REACH,
  type PairedPhase,
  type PairedRoundView,
} from "@entros/pulse-sdk";

import { verificationFocusRing } from "./verification-styles";

const AUDIO_BAR_COUNT = 29;
/** A symmetric envelope: tall in the middle, short at the ends. */
const BAR_OFFSETS = Array.from({ length: AUDIO_BAR_COUNT }, (_, i) => {
  const center = 1 - Math.abs(i - (AUDIO_BAR_COUNT - 1) / 2) / ((AUDIO_BAR_COUNT - 1) / 2);
  return 0.6 + 0.4 * center;
});
/** The SDK's round window, used only to draw the countdown line. */
const ROUND_WINDOW_SEC = 12;
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
  const timerFraction =
    round && (phase === "round" || phase === "cue_loading" || phase === "cue")
      ? Math.min(1, remaining / ROUND_WINDOW_SEC)
      : 0;

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
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground/55 tabular-nums">
          {round ? `Round ${round.roundIndex} of ${round.rounds}` : " "}
        </p>
        <div className="mx-auto mt-2 flex max-w-[12rem] gap-1" aria-hidden="true">
          {Array.from({ length: round?.rounds ?? 3 }, (_, index) => (
            <span
              key={index}
              className={`h-[3px] flex-1 transition-colors duration-300 ${
                round && index < round.roundIndex ? "bg-cyan" : "bg-foreground/10"
              }`}
            />
          ))}
        </div>
        <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan">
          {round ? "Say this word" : " "}
        </p>
        <p
          key={round ? `word-${roundIndex}` : "word"}
          className={`mt-1 h-10 font-mono text-[2rem] font-semibold leading-10 tracking-[0.06em] transition-[color,text-shadow] duration-150 md:text-[2.25rem] ${
            round ? "vc-reveal" : ""
          }`}
          style={{
            color: isVoiceActive
              ? "var(--color-foreground)"
              : "color-mix(in srgb, var(--color-foreground) 55%, transparent)",
            textShadow: isVoiceActive
              ? `0 0 ${12 + normalizedAudio * 22}px color-mix(in srgb, var(--color-cyan) ${20 + normalizedAudio * 35}%, transparent)`
              : "none",
          }}
        >
          {round ? round.word : " "}
        </p>
      </div>

      {/* Trace label. One fixed line under the header. */}
      <p className="h-[20px] shrink-0 overflow-hidden text-center font-mono text-[10px] uppercase tracking-[0.22em] text-solana-green">
        {round
          ? phase === "cue"
            ? `Trace to the new point ${waypoints.length}`
            : `Trace from 1 to ${waypoints.length}`
          : " "}
      </p>

      {/* Trace surface. The square keeps one geometry from mount through the
          final round; only its visibility changes. The pre-reveal guidance is
          an overlay inside the same slot, never a resize. */}
      <div className="relative min-h-0 flex-1">
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center gap-5 px-4 text-center transition-opacity duration-150 ${
            round ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
          aria-hidden={round !== null}
        >
          <div className="relative h-14 w-14 overflow-hidden rounded-full border border-foreground/15" aria-hidden="true">
            <div className="vc-sweep absolute inset-0 rounded-full" />
            <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan" />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-foreground/55">
            Preparing round 1
          </p>
          <div className="max-w-[22rem] space-y-2">
            <p className="text-lg font-medium text-foreground md:text-xl">
              Get ready to speak and trace.
            </p>
            <p className="text-balance text-sm leading-relaxed text-foreground/60">
              Each round shows one word and a short path. Say the word and trace
              the path with your {hasMotion ? "finger" : "mouse"}.
            </p>
          </div>
        </div>
        <div className="flex h-full items-center justify-center">
          <div
            className={`relative aspect-square h-[260px] border transition-opacity duration-150 md:h-[280px] ${
              round
                ? "border-foreground/[0.12] bg-foreground/[0.015]"
                : "pointer-events-none border-transparent opacity-0"
            }`}
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-2 top-2 z-[1] font-mono text-[9px] tracking-[0.18em] text-foreground/35 tabular-nums"
            >
              {round ? `${String(Math.min(reachedNow, waypoints.length)).padStart(2, "0")}/${String(waypoints.length).padStart(2, "0")}` : ""}
            </span>
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
                  {[200, 400, 600, 800].map((line) => (
                    <path
                      key={line}
                      d={`M${line} 0V${GRID}M0 ${line}H${GRID}`}
                      stroke="var(--color-foreground)"
                      strokeOpacity={0.05}
                      strokeWidth={2}
                    />
                  ))}
                  <polyline
                    points={waypoints
                      .map((point) => `${point.x},${point.y}`)
                      .join(" ")}
                    fill="none"
                    stroke="var(--color-solana-green)"
                    strokeWidth={6}
                    strokeOpacity={0.4}
                    strokeDasharray="18 18"
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
                    const next = index === reachedNow && recording;
                    return (
                      <g key={`${roundIndex}-${index}`} data-reached={done}>
                        {next && (
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r={40}
                            fill="none"
                            stroke="var(--color-solana-green)"
                            strokeWidth={4}
                            className="vc-target"
                          />
                        )}
                        <circle
                          key={done ? "done" : "open"}
                          cx={point.x}
                          cy={point.y}
                          r={40}
                          className={done ? "vc-pop" : undefined}
                          fill={
                            done
                              ? "var(--color-solana-green)"
                              : "var(--color-background)"
                          }
                          stroke="var(--color-solana-green)"
                          strokeWidth={6}
                        />
                        <text
                          x={point.x}
                          y={point.y}
                          dy="0.35em"
                          textAnchor="middle"
                          fontSize={40}
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

      {/* Microphone meter. Always mounted; the ticks rest flat before reveal. */}
      <div className="flex h-[48px] shrink-0 flex-col items-center justify-center overflow-hidden">
        <div className="flex h-7 items-center justify-center gap-[3px]">
          {BAR_OFFSETS.map((offset, i) => (
            <div
              key={i}
              className="w-[2px] rounded-full bg-cyan/60"
              style={{
                height: `${2 + normalizedAudio * 32 * offset}px`,
                transition: "height 100ms ease-out",
              }}
            />
          ))}
        </div>
        <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-foreground/40">
          Microphone level
        </p>
      </div>

      {/* Status and prompts: three fixed lines. The Continue control and the
          messages appear inside them without moving anything else. */}
      <div className="flex h-[60px] shrink-0 flex-col items-center overflow-hidden text-center">
        <div className="flex h-7 items-center">
          {phase === "committing" ? (
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-foreground/55">
              Sending round {round?.roundIndex}
            </p>
          ) : phase === "cue_loading" ? (
            <p className="text-xs text-foreground/55">Loading the final point…</p>
          ) : phase === "cue" ? (
            <p className="text-xs text-foreground/55">Finish the trace at the new point.</p>
          ) : (
            phase === "round" &&
            canContinue && (
              <button
                type="button"
                onClick={handleContinue}
                className={`vc-slide inline-flex h-7 items-center border border-cyan/45 px-3.5 font-mono text-[11px] tracking-[0.06em] text-cyan transition-colors hover:border-cyan hover:bg-cyan/[0.07] active:scale-[0.97] motion-reduce:transform-none ${verificationFocusRing}`}
              >
                I spoke · Continue
              </button>
            )
          )}
        </div>
        <p className="h-4 text-xs text-foreground/65">
          {round &&
          phase === "round" &&
          canContinue &&
          refusedRound === roundIndex
            ? "Trace the dots in order, then continue."
            : " "}
        </p>
        <p className="h-4 text-xs text-foreground/65">
          {round &&
          phase === "round" &&
          canContinue &&
          voicePrompt === roundIndex &&
          !speechActive
            ? "We couldn't hear that. Say the word once more, a little louder."
            : " "}
        </p>
      </div>

      {/* Timer. Both lines are reserved in every phase. */}
      <div className="flex h-[40px] shrink-0 flex-col items-center justify-center gap-2 overflow-hidden">
        <div className="h-px w-40 bg-foreground/10" aria-hidden="true">
          <div
            className="h-px origin-left bg-cyan/80"
            style={{
              transform: `scaleX(${timerFraction})`,
              transition: "transform 100ms linear",
            }}
          />
        </div>
        <p className="h-4 font-mono text-[10px] tabular-nums tracking-[0.12em] text-foreground/45">
          {round &&
          (phase === "round" || phase === "cue_loading" || phase === "cue")
            ? `${remaining}s remaining`
            : " "}
        </p>
      </div>
    </div>
  );
}
