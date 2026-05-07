"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Temporal Consistency—the conceptual heart of Entros. Two-column
 * split: copy on the left, the bounded-drift waveform on the right.
 * Below that, three flat phase cards in a hairline grid.
 */

const phases = [
  {
    day: "Day 1",
    title: "First verification",
    description:
      "You speak a phrase, trace a curve, move your device. The protocol captures the behavioral signature of that moment and stores a cryptographic commitment.",
  },
  {
    day: "Day 7",
    title: "Re-verification",
    description:
      "Same person, different session. Your voice shifts slightly. Your touch pressure changes. The ZK proof confirms the drift is within human range.",
  },
  {
    day: "Day 30+",
    title: "Trust compounds",
    description:
      "Each successful re-verification raises your Trust Score. Consistent patterns over weeks prove what a single snapshot cannot.",
  },
];

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

function DriftWaveform({ active }: { active: boolean }) {
  const width = 600;
  const height = 320;
  const mid = height / 2;
  const points = 80;

  const prevPath = buildSmoothPath(width, mid, 0, 0.85, 1.0, points);
  const currPath = buildSmoothPath(width, mid, 0.5, 1.0, 1.02, points);
  const currAnimated = buildSmoothPath(width, mid, 0.9, 1.05, 1.01, points);

  // Fill paths close the curve back to the bottom edge so a gradient
  // can wash underneath each wave.
  const prevFill = `${prevPath} L${width},${height} L0,${height} Z`;
  const currFill = `${currPath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Two behavioral waveforms showing bounded drift between sessions"
    >
      <defs>
        <linearGradient id="prev-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34, 211, 230, 0.10)" />
          <stop offset="100%" stopColor="rgba(34, 211, 230, 0)" />
        </linearGradient>
        <linearGradient id="curr-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34, 211, 230, 0.28)" />
          <stop offset="100%" stopColor="rgba(34, 211, 230, 0)" />
        </linearGradient>
        <filter id="curr-glow" x="-10%" y="-50%" width="120%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Previous session—ghost, thin, low opacity, no fill glow */}
      <path
        d={prevFill}
        fill="url(#prev-fill)"
        className="transition-opacity duration-1000"
        style={{ opacity: active ? 1 : 0 }}
      />
      <path
        d={prevPath}
        fill="none"
        stroke="rgba(34, 211, 230, 0.25)"
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-opacity duration-1000"
        style={{ opacity: active ? 1 : 0 }}
      />

      {/* Current session—primary, brighter, with gradient fill and soft glow */}
      <path
        d={currFill}
        fill="url(#curr-fill)"
        className="transition-opacity duration-1000 delay-300"
        style={{ opacity: active ? 1 : 0 }}
      >
        {active && (
          <animate
            attributeName="d"
            values={`${currFill};${currAnimated} L${width},${height} L0,${height} Z;${currFill}`}
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </path>
      <path
        d={currPath}
        fill="none"
        stroke="rgba(34, 211, 230, 0.55)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#curr-glow)"
        className="transition-opacity duration-1000 delay-300"
        style={{ opacity: active ? 0.6 : 0 }}
      >
        {active && (
          <animate
            attributeName="d"
            values={`${currPath};${currAnimated};${currPath}`}
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </path>
      <path
        d={currPath}
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
            values={`${currPath};${currAnimated};${currPath}`}
            dur="9s"
            repeatCount="indefinite"
          />
        )}
      </path>
    </svg>
  );
}

export function TemporalConsistencySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) setVisible(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // TEMPORAL CONSISTENCY
        </span>

        <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-5 lg:items-start lg:gap-16">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Identity is a pattern<span className="text-cyan">.</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
              The protocol measures behavioral drift across sessions:
              small, involuntary changes in voice, motion, and touch
              that follow a bounded pattern unique to each person.
              Verify once to register. Verify again to prove you are
              still you. Each session strengthens the claim.
            </p>
          </div>

          <div className="lg:col-span-3">
            <DriftWaveform active={visible} />
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
          {phases.map((phase) => (
            <div key={phase.day} className="bg-background p-8">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
                {phase.day}
              </span>
              <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-foreground">
                {phase.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                {phase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
