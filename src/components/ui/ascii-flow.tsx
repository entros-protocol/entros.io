"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { buildWordMask, MASK_STRIDE } from "./ascii-font";

const COLS = 96;
const ROWS = 28;
const FRAME_INTERVAL_MS = 33;

const STREAM_Y_MIN = 5;
const STREAM_Y_MAX = 18;
const PARTICLE_COUNT = 460;
const SPEED_MIN = 14;
const SPEED_MAX = 32;

interface Particle {
  x: number;
  y: number;
  speed: number;
}

/** Tier code for a brand cell that no particle is currently occupying. */
const TIER_BRAND = 5;

interface AsciiFlowProps {
  className?: string;
  /**
   * Word to emboss into the particle field. Rendered as a dim, static
   * lattice that the flowing particles brighten as they pass through it.
   */
  brand?: string;
}

export function AsciiFlow({ className, brand }: AsciiFlowProps) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const tierBuffer = new Uint8Array(COLS * ROWS);

    // Brand mask, centered on the stream band. Stretched 2x horizontally
    // (a monospace cell is far taller than wide) but left at 1x vertically
    // so the word occupies only half the band height. The particle flow
    // continues above and below it, which is what lets the shape read.
    const brandMask = new Uint8Array(COLS * ROWS);
    // Bounding box of the word. Particles inside it are thinned by a tier so
    // the counters and inter-letter gaps stay legible; the field outside
    // keeps its full density and brightness.
    let boxY0 = -1;
    let boxY1 = -1;
    let boxX0 = -1;
    let boxX1 = -1;
    if (brand) {
      const { cells, cols: wCols, rows: wRows } = buildWordMask(brand, 2, 1, 1);
      const offX = Math.round((COLS - wCols) / 2);
      const offY = Math.round((STREAM_Y_MIN + STREAM_Y_MAX) / 2 - wRows / 2);
      boxY0 = offY;
      boxY1 = offY + wRows - 1;
      boxX0 = offX;
      boxX1 = offX + wCols - 1;
      for (const key of cells) {
        const r = Math.floor(key / MASK_STRIDE) + offY;
        const c = (key % MASK_STRIDE) + offX;
        if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
        brandMask[r * COLS + c] = 1;
      }
    }
    const yRange = STREAM_Y_MAX - STREAM_Y_MIN;
    const particles: Particle[] = new Array(PARTICLE_COUNT);

    function reseed(p: Particle, randomX: boolean) {
      const magnitude = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      const dir = Math.random() < 0.5 ? 1 : -1;
      p.speed = dir * magnitude;
      if (randomX) {
        p.x = Math.random() * COLS;
      } else if (p.speed > 0) {
        p.x = -1 - Math.random() * 3;
      } else {
        p.x = COLS + Math.random() * 3;
      }
      p.y = STREAM_Y_MIN + Math.random() * yRange;
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p: Particle = { x: 0, y: 0, speed: 0 };
      reseed(p, true);
      particles[i] = p;
    }

    let rafId = 0;
    let lastFrame = 0;
    let prev = performance.now();
    let inView = true;

    const center = (COLS - 1) / 2;

    function render(now: number) {
      if (now - lastFrame < FRAME_INTERVAL_MS) {
        if (inView) rafId = requestAnimationFrame(render);
        return;
      }
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      lastFrame = now;

      tierBuffer.fill(0);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i]!;
        p.x += p.speed * dt;
        if (p.x >= COLS + 2 || p.x <= -2) reseed(p, false);

        const row = Math.floor(p.y);
        const col = Math.floor(p.x);
        if (row < 0 || row >= ROWS) continue;
        if (col < 0 || col >= COLS) continue;

        const dist = Math.abs(p.x - center) / center;
        const t = 1 - dist;
        let tier: number;
        if (t > 0.85) tier = 4;
        else if (t > 0.55) tier = 3;
        else if (t > 0.25) tier = 2;
        else tier = 1;

        const idx = row * COLS + col;
        if (tier > tierBuffer[idx]!) tierBuffer[idx] = tier;
      }

      let html = "";
      let lastTier = -1;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const idx = r * COLS + c;
          const particleTier = tierBuffer[idx]!;
          const isBrand = brandMask[idx] === 1;
          // The flow reveals the word rather than sitting on top of it. A
          // brand cell carrying a particle lights to full; with no particle
          // it holds a faint trace. The word surfaces continuously as the
          // stream crosses it, and never outshines the substrate.
          const inBox =
            r >= boxY0 && r <= boxY1 && c >= boxX0 && c <= boxX1;
          const tier = isBrand
            ? particleTier === 0
              ? TIER_BRAND
              : 4
            : inBox && particleTier > 0
              ? particleTier - 1
              : particleTier;
          if (tier === 0) {
            if (lastTier !== -1) html += "</span>";
            html += " ";
            lastTier = -1;
            continue;
          }
          if (tier !== lastTier) {
            if (lastTier !== -1) html += "</span>";
            // Substrate keeps its full palette; the brand only adds a faint
            // resting trace. Legibility comes from the digit itself, not
            // from making the word brighter than the field.
            const cls =
              tier === TIER_BRAND
                ? "text-cyan/38"
                : tier === 1
                  ? "text-cyan/25"
                  : tier === 2
                    ? "text-cyan/50"
                    : tier === 3
                      ? "text-cyan/75"
                      : "text-cyan";
            // aria-hidden on each span. The parent <pre aria-hidden> sets the
            // ARIA inheritance for screen readers, but axe-core's color-contrast
            // rule walks innerHTML-injected children and doesn't always honor
            // inherited aria-hidden when the spans are inserted post-render.
            html += `<span class="${cls}" aria-hidden="true">`;
          }
          // Character weight is what carries the word. "0" is round and
          // visually solid, "1" is a thin stroke, so an all-0 letterform
          // separates from an all-1 field even at identical luminance.
          html += isBrand ? "0" : "1";
          lastTier = tier;
        }
        if (lastTier !== -1) {
          html += "</span>";
          lastTier = -1;
        }
        if (r < ROWS - 1) html += "\n";
      }
      pre!.innerHTML = html;

      if (inView) rafId = requestAnimationFrame(render);
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Paint the first frame immediately (avoids a flash of empty). The
    // render() call self-schedules a rAF via its own tail, so cancel that
    // one and let the single controlled loop below own the animation —
    // otherwise two rAF loops run at once, and reduced-motion is ignored.
    render(performance.now() + FRAME_INTERVAL_MS + 1);
    cancelAnimationFrame(rafId);

    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const wasInView = inView;
        inView = entry.isIntersecting;
        if (!wasInView && inView) rafId = requestAnimationFrame(render);
      },
      { threshold: 0 }
    );
    observer.observe(pre);

    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [brand]);

  return (
    <pre
      ref={preRef}
      aria-hidden="true"
      className={cn(
        "select-none whitespace-pre font-mono leading-[1] text-cyan",
        "ascii-art-bright",
        "text-[7px] sm:text-[9px] md:text-[10px] lg:text-[11px] xl:text-[12px]",
        className
      )}
    />
  );
}
