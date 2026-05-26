"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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

interface AsciiFlowProps {
  className?: string;
}

export function AsciiFlow({ className }: AsciiFlowProps) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const tierBuffer = new Uint8Array(COLS * ROWS);
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
          const tier = tierBuffer[r * COLS + c]!;
          if (tier === 0) {
            if (lastTier !== -1) html += "</span>";
            html += " ";
            lastTier = -1;
            continue;
          }
          if (tier !== lastTier) {
            if (lastTier !== -1) html += "</span>";
            const cls =
              tier === 1
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
          html += tier === 4 ? "0" : "1";
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

    render(performance.now() + FRAME_INTERVAL_MS + 1);

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
  }, []);

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
