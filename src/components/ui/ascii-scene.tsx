"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { cn } from "@/lib/utils";

const FRAME_INTERVAL_MS = 33;

/** Fraction of the box the fitted art is allowed to occupy on each axis. */
const FIT_W = 0.72;
const FIT_H = 0.75;

export type SceneRender = (
  cols: number,
  rows: number,
  tier: Uint8Array,
  char: Uint8Array,
  t: number,
  dt: number
) => void;

interface AsciiSceneProps {
  cols: number;
  rows: number;
  render: SceneRender;
  label?: string;
  aspect?: string;
  className?: string;
  fill?: boolean;
  /**
   * Scale the art to the box instead of the viewport breakpoint ladder.
   * The ladder cannot track a box whose width swings with the grid it
   * sits in (a two-column split is narrower at 1440 than it is stacked
   * at 768), which leaves the art stranded in the middle of the panel.
   */
  fit?: boolean;
  /** Multiplier on the fit ratio, for scenes that should fill more of the box. */
  fitScale?: number;
}

export function AsciiScene({
  cols,
  rows,
  render,
  label,
  aspect = "16/9",
  className,
  fill = false,
  fit = false,
  fitScale = 1,
}: AsciiSceneProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const renderFrame = useEffectEvent(render);

  useEffect(() => {
    if (!fit) return;
    const pre = preRef.current;
    const box = boxRef.current;
    if (!pre || !box) return;

    // Measure the cell advance off the live font rather than assuming
    // 0.6em, so swapping the mono stack cannot silently mis-scale.
    const probe = document.createElement("pre");
    probe.className = pre.className;
    probe.style.cssText =
      "position:absolute;visibility:hidden;font-size:100px;white-space:pre";
    probe.textContent = "0".repeat(20);
    box.appendChild(probe);
    const advance = probe.getBoundingClientRect().width / 20 / 100;
    probe.remove();
    if (!advance) return;

    let lastSize = 0;

    function resize() {
      const { width, height } = box!.getBoundingClientRect();
      const byWidth = (width * FIT_W * fitScale) / (cols * advance);
      const byHeight = (height * FIT_H * fitScale) / rows;
      // Snap to a whole pixel. A fractional font-size gives the monospace
      // cell a fractional advance, so every animated frame re-lays the
      // glyphs out at sub-pixel offsets and the field visibly jitters.
      const next = Math.max(1, Math.floor(Math.min(byWidth, byHeight)));
      if (next !== lastSize) {
        lastSize = next;
        pre!.style.fontSize = `${next}px`;
      }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(box);
    resize();
    return () => observer.disconnect();
  }, [fit, fitScale, cols, rows]);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const tier = new Uint8Array(cols * rows);
    const char = new Uint8Array(cols * rows);

    let t = 0;
    let prev = performance.now();
    let lastFrame = 0;
    let rafId = 0;
    let inView = true;
    let started = false;
    let lastHtml = "";

    function frame(now: number) {
      if (now - lastFrame < FRAME_INTERVAL_MS) {
        if (inView && started) rafId = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      lastFrame = now;
      t += dt;

      tier.fill(0);
      char.fill(0);
      renderFrame(cols, rows, tier, char, t, dt);

      let html = "";
      let lastTier = -1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const v = tier[idx]!;
          if (v === 0) {
            if (lastTier !== -1) html += "</span>";
            html += " ";
            lastTier = -1;
            continue;
          }
          if (v !== lastTier) {
            if (lastTier !== -1) html += "</span>";
            const cls =
              v === 1
                ? "text-cyan/60"
                : v === 2
                  ? "text-cyan/75"
                  : v === 3
                    ? "text-cyan/90"
                    : "text-cyan";
            html += `<span class="${cls}">`;
          }
          html += char[idx] === 1 ? "1" : "0";
          lastTier = v;
        }
        if (lastTier !== -1) {
          html += "</span>";
          lastTier = -1;
        }
        if (r < rows - 1) html += "\n";
      }
      // Only touch the DOM when the field actually changed. Assigning
      // innerHTML tears down and rebuilds the whole subtree and forces a
      // repaint even when the output is byte-identical — and most frames
      // ARE identical, because several renderers quantise on Math.floor(t).
      // At 7px that redundant repaint was invisible; at 12-16px it reads
      // as flicker.
      if (html !== lastHtml) {
        lastHtml = html;
        pre!.innerHTML = html;
      }

      if (inView && started) rafId = requestAnimationFrame(frame);
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    frame(performance.now() + FRAME_INTERVAL_MS + 1);
    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const wasInView = inView;
        inView = entry.isIntersecting;
        if (!wasInView && inView) rafId = requestAnimationFrame(frame);
      },
      { threshold: 0 }
    );
    observer.observe(pre);
    started = true;
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [cols, rows]);

  return (
    <div
      ref={boxRef}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-foreground/[0.06]",
        fill && "h-full",
        className
      )}
      style={fill ? undefined : { aspectRatio: aspect }}
    >

      {label && (
        <div className="absolute left-4 top-3 z-10 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/30">
          // {label}
        </div>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <pre
          ref={preRef}
          aria-hidden="true"
          className="select-none whitespace-pre font-mono leading-[1] text-cyan text-[7px] sm:text-[9px] md:text-[10px] lg:text-[11px] xl:text-[12px]"
        />
      </div>
    </div>
  );
}
