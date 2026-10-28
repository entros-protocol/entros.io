"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const COLS = 9;
const ROWS = 9;
const CELLS = COLS * ROWS;
const TICK_MS = 650;
const MAX_VERIFIED = 14;

type CellState = 0 | 1 | 2; // not checked, checking, verified

interface Field {
  cells: CellState[];
  /** Verified cells, oldest first, so the field clears in the order it filled. */
  verified: number[];
}

// A fixed starting pattern so the server render and the first client
// render match; the field only starts to change after mount.
const SEED_VERIFIED = [3, 11, 19, 24, 31, 40, 44, 52, 57, 63, 70, 77];

// Cells fade toward the corners so the field has no hard edge. Each cell
// keeps one even tint rather than being cut by a gradient mask.
const FADE = Array.from({ length: CELLS }, (_, i) => {
  const dx = (i % COLS) - (COLS - 1) / 2;
  const dy = Math.floor(i / COLS) - (ROWS - 1) / 2;
  const d = Math.hypot(dx, dy) / Math.hypot((COLS - 1) / 2, (ROWS - 1) / 2);
  return Math.max(0, 1 - d * d * 0.85);
});

// Corner cells fade out entirely, so new checks only land where they show.
const VISIBLE = FADE.flatMap((f, i) => (f > 0.35 ? [i] : []));

function initial(): Field {
  const cells = new Array<CellState>(CELLS).fill(0);
  for (const i of SEED_VERIFIED) cells[i] = 2;
  return { cells, verified: SEED_VERIFIED.slice() };
}

function step({ cells, verified }: Field): Field {
  const next = cells.slice();
  const order = verified.slice();
  for (let i = 0; i < CELLS; i++) {
    if (next[i] === 1) {
      next[i] = 2;
      order.push(i);
    }
  }
  const idle = VISIBLE.filter((i) => next[i] === 0);
  const pick = idle[Math.floor(Math.random() * idle.length)];
  if (pick !== undefined) next[pick] = 1;
  while (order.length > MAX_VERIFIED) {
    const oldest = order.shift();
    if (oldest !== undefined) next[oldest] = 0;
  }
  return { cells: next, verified: order };
}

function Cell({ state, className, style }: { state: CellState; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "relative aspect-square border transition-[background-color,border-color] duration-700 ease-out",
        state === 0 && "border-foreground/20 bg-transparent",
        state === 1 && "border-cyan bg-transparent",
        state === 2 && "border-cyan bg-cyan",
        className,
      )}
    >
      {state === 1 && <span className="absolute inset-[30%] bg-cyan" />}
    </span>
  );
}

const LEGEND: { state: CellState; label: string }[] = [
  { state: 0, label: "Wallet" },
  { state: 1, label: "Checking" },
  { state: 2, label: "Verified" },
];

/**
 * A field of wallets, drawn as square cells. One wallet is checked at a
 * time and settles as verified; the oldest verified wallets clear so the
 * loop can run forever. A legend under the field names the three states.
 */
export function WalletField({ className }: { className?: string }) {
  const [field, setField] = useState<Field>(initial);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setField(step), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <figure className={cn("flex flex-col", className)}>
      <div aria-hidden className="grid grid-cols-9 gap-[clamp(8px,1.2vw,16px)]">
        {field.cells.map((state, i) => (
          <Cell key={i} state={state} style={{ opacity: FADE[i] }} />
        ))}
      </div>
      <figcaption className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/70">
        {LEGEND.map(({ state, label }) => (
          <span key={label} className="inline-flex items-center gap-2">
            <Cell
              state={state}
              className={cn("w-3.5 transition-none", state === 0 && "border-foreground/45")}
            />
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
