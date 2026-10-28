"use client";

/**
 * AsciiHelix: the spiral drawn as two strands of binary twisting along one
 * axis, in the same 1s, 0s and cyan opacity tiers as the site's other
 * ascii art. The two strands stand for two sessions; each place they cross
 * is a visit where they meet. The twist opens from left to right, so the
 * thread grows the way a wallet's history does.
 *
 * Each frame is computed on the fly (about 5,000 cells), so no payload
 * ships. Glyphs come from a fixed per-cell hash, so the strands turn
 * through a still field of digits. The loop pauses offscreen and draws a
 * single frame under prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const TURNS = 3;
const FRAMES_PER_TURN = 150;
const FRAME_INTERVAL_MS = 33;

const TIER_CLASS: Record<number, string> = {
  5: "text-cyan",
  4: "text-cyan/60 dark:text-cyan/55",
  3: "text-cyan/40 dark:text-cyan/35",
  2: "text-cyan/20 dark:text-cyan/[0.18]",
  1: "text-foreground/[0.08] dark:text-cyan/[0.12]",
};

function hashBit(x: number, y: number): string {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h >>> 16) & 1 ? "1" : "0";
}

function strandTier(distance: number, front: boolean): number {
  if (distance < 0.55) return front ? 5 : 3;
  if (distance < 1.15) return front ? 4 : 2;
  return 0;
}

function buildFrame(cols: number, rows: number, offset: number): string {
  const center = (rows - 1) / 2;
  const reach = center - 3;
  const tiers: number[][] = Array.from({ length: rows }, () =>
    new Array<number>(cols).fill(0),
  );

  for (let x = 0; x < cols; x++) {
    const progress = x / (cols - 1);
    const amplitude = reach * (0.22 + 0.78 * Math.pow(progress, 0.7));
    const phase = (x / cols) * TURNS * Math.PI * 2 + offset;
    const yA = center + amplitude * Math.sin(phase);
    const yB = center - amplitude * Math.sin(phase);
    const aFront = Math.cos(phase) >= 0;

    if (x % 8 === 0) {
      const top = Math.ceil(Math.min(yA, yB));
      const bottom = Math.floor(Math.max(yA, yB));
      for (let y = top; y <= bottom; y++) {
        const row = tiers[y];
        if (row) row[x] = 1;
      }
    }

    for (let y = 0; y < rows; y++) {
      const row = tiers[y];
      if (!row) continue;
      const tier = Math.max(
        strandTier(Math.abs(y - yA), aFront),
        strandTier(Math.abs(y - yB), !aFront),
      );
      if (tier > (row[x] ?? 0)) row[x] = tier;
    }
  }

  let html = "";
  tiers.forEach((line, y) => {
    let last = 0;
    line.forEach((tier, x) => {
      if (tier !== last) {
        if (last !== 0) html += "</span>";
        // aria-hidden on each span: axe walks innerHTML children and does
        // not reliably honour the parent <pre aria-hidden>.
        if (tier !== 0) html += `<span class="${TIER_CLASS[tier]}" aria-hidden="true">`;
      }
      html += tier === 0 ? " " : hashBit(x, y);
      last = tier;
    });
    if (last !== 0) html += "</span>";
    if (y < rows - 1) html += "\n";
  });
  return html;
}

interface AsciiHelixProps {
  cols: number;
  rows: number;
  className?: string;
}

export function AsciiHelix({ cols, rows, className }: AsciiHelixProps) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    pre.innerHTML = buildFrame(cols, rows, 0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    let last = 0;
    let frame = 0;
    let inView = false;

    const render = (now: number) => {
      if (!inView) return;
      if (now - last >= FRAME_INTERVAL_MS) {
        last = now;
        frame = (frame + 1) % FRAMES_PER_TURN;
        pre.innerHTML = buildFrame(cols, rows, (-frame / FRAMES_PER_TURN) * Math.PI * 2);
      }
      rafId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      const wasInView = inView;
      inView = entry.isIntersecting;
      if (inView && !wasInView) rafId = requestAnimationFrame(render);
    });
    observer.observe(pre);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [cols, rows]);

  return (
    <pre
      ref={preRef}
      aria-hidden="true"
      className={cn(
        "ascii-art-bright select-none whitespace-pre font-mono leading-[1]",
        className,
      )}
    />
  );
}
