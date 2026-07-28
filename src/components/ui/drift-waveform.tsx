"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * DriftWaveform—two behavioral traces from different sessions, drawn as
 * smooth waves that diverge slightly and stay within bounds. The ghost
 * wave is the prior session; the bright wave is the current one, which
 * animates on a slow 9s loop.
 *
 * `preserveAspectRatio="none"` is deliberate: the wave is decorative, so
 * it stretches to whatever box it is given. That only reads well while
 * the viewBox aspect stays near the box aspect, so there are two
 * geometries. The wide one fills a 3.5:1 desktop band. The narrow one
 * covers everything below lg, where the box is far closer to square—
 * forcing the wide geometry through it compresses two full periods into a
 * few hundred pixels and stretches them vertically, turning the humps
 * into skinny spikes. The narrow set shows a single broad hump at roughly
 * the amplitude-to-width ratio the desktop band has, and toward the wide
 * end of its range it stretches flatter, never sharper.
 */

/**
 * Smooth Catmull-Rom-ish path generator. Each segment is a Bezier
 * approximation drawn through the sample points so the curve reads
 * like a fluid waveform rather than a polyline.
 */
function buildSmoothPath(
  width: number,
  mid: number,
  phaseOffset: number,
  ampScale: number,
  freqScale: number,
  points: number
): string {
  const ys: number[] = [];
  const xs: number[] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * width;
    const t = (i / points) * Math.PI * 4 * freqScale;
    const y =
      mid +
      Math.sin(t + phaseOffset) * 56 * ampScale +
      Math.sin(t * 2.3 + phaseOffset * 0.7) * 22 * ampScale;
    xs.push(x);
    ys.push(y);
  }
  let d = `M${xs[0]!.toFixed(1)},${ys[0]!.toFixed(1)}`;
  for (let i = 0; i < points; i++) {
    const x0 = xs[i]!;
    const y0 = ys[i]!;
    const x1 = xs[i + 1]!;
    const y1 = ys[i + 1]!;
    const cx = (x0 + x1) / 2;
    // Quadratic Bezier with control midway between the two anchors —
    // gives smoother, more organic curves than straight L segments.
    d += ` Q${x0.toFixed(1)},${y0.toFixed(1)} ${cx.toFixed(1)},${((y0 + y1) / 2).toFixed(1)}`;
  }
  d += ` T${xs[points]!.toFixed(1)},${ys[points]!.toFixed(1)}`;
  return d;
}

/**
 * One geometry: the three curves plus their closed fill counterparts.
 * `freqMul` sets how many periods span the viewBox; `ampMul` scales the
 * peak height, in viewBox units, against the fixed 340-unit height;
 * `midFactor` is where the baseline sits vertically. The narrow set runs
 * a high baseline so its crest reaches the top of the hero's wave band
 * instead of leaving a void under the buttons.
 */
function buildSet(
  width: number,
  height: number,
  freqMul: number,
  ampMul: number,
  points: number,
  midFactor = 0.5
) {
  const mid = height * midFactor;
  const prev = buildSmoothPath(width, mid, 0, 0.85 * ampMul, 1.0 * freqMul, points);
  const curr = buildSmoothPath(width, mid, 0.5, 1.0 * ampMul, 1.02 * freqMul, points);
  const anim = buildSmoothPath(width, mid, 0.9, 1.05 * ampMul, 1.01 * freqMul, points);
  const close = (d: string) => `${d} L${width},${height} L0,${height} Z`;
  return {
    width,
    height,
    prev,
    curr,
    anim,
    prevFill: close(prev),
    currFill: close(curr),
    animFill: close(anim),
  };
}

const WIDE = buildSet(1400, 340, 1, 1, 80);
const NARROW = buildSet(360, 340, 0.55, 0.6, 60, 0.32);

type WaveSet = typeof WIDE;

function Wave({
  set,
  active,
  ids,
  className,
}: {
  set: WaveSet;
  active: boolean;
  ids: string;
  className: string;
}) {
  const prevFillId = `${ids}-prev-fill`;
  const currFillId = `${ids}-curr-fill`;
  const glowId = `${ids}-glow`;

  return (
    <svg
      viewBox={`0 0 ${set.width} ${set.height}`}
      className={cn("h-full w-full", className)}
      preserveAspectRatio="none"
      role="img"
      aria-label="Two behavioral waveforms showing bounded drift between sessions"
    >
      <defs>
        <linearGradient id={prevFillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34, 211, 230, 0.10)" />
          <stop offset="100%" stopColor="rgba(34, 211, 230, 0)" />
        </linearGradient>
        <linearGradient id={currFillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34, 211, 230, 0.28)" />
          <stop offset="100%" stopColor="rgba(34, 211, 230, 0)" />
        </linearGradient>
        <filter id={glowId} x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Previous session—ghost, thin, low opacity, no fill glow */}
      <path
        d={set.prevFill}
        fill={`url(#${prevFillId})`}
        className="transition-opacity duration-1000"
        style={{ opacity: active ? 1 : 0 }}
      />
      <path
        d={set.prev}
        fill="none"
        stroke="rgba(34, 211, 230, 0.25)"
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-opacity duration-1000"
        style={{ opacity: active ? 1 : 0 }}
      />

      {/* Current session—primary, brighter, with gradient fill and soft glow */}
      <path
        d={set.currFill}
        fill={`url(#${currFillId})`}
        className="transition-opacity duration-1000 delay-300"
        style={{ opacity: active ? 1 : 0 }}
      >
        {active && (
          <animate
            attributeName="d"
            values={`${set.currFill};${set.animFill};${set.currFill}`}
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </path>
      <path
        d={set.curr}
        fill="none"
        stroke="rgba(34, 211, 230, 0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter={`url(#${glowId})`}
        className="transition-opacity duration-1000 delay-300"
        style={{ opacity: active ? 0.6 : 0 }}
      >
        {active && (
          <animate
            attributeName="d"
            values={`${set.curr};${set.anim};${set.curr}`}
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </path>
      <path
        d={set.curr}
        fill="none"
        stroke="rgb(34, 211, 230)"
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-opacity duration-1000 delay-300"
        style={{ opacity: active ? 1 : 0 }}
      >
        {active && (
          <animate
            attributeName="d"
            values={`${set.curr};${set.anim};${set.curr}`}
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
}

interface DriftWaveformProps {
  /** Sizing + placement for the wrapper. The svg fills it. */
  className?: string;
  /** Unique id prefix—two instances on one page must not share gradient ids. */
  idPrefix?: string;
}

export function DriftWaveform({
  className,
  idPrefix = "drift",
}: DriftWaveformProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  // Fade the waves in when the block scrolls into view, and let them
  // fade back out so re-entry replays the reveal.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setActive(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn("pointer-events-none", className)}
    >
      <Wave
        set={NARROW}
        active={active}
        ids={`${idPrefix}-n`}
        className="lg:hidden"
      />
      <Wave
        set={WIDE}
        active={active}
        ids={`${idPrefix}-w`}
        className="hidden lg:block"
      />
    </div>
  );
}
