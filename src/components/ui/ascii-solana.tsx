"use client";

/**
 * AsciiSolana: the Solana mark rendered as a dense field of ascii, drawn
 * from the mark's own geometry (three slanted bars) through a signed
 * distance field, and tinted along Solana's purple-to-green diagonal.
 * The fill brightens toward each bar's core under a slow diagonal shimmer.
 *
 * About 3,500 cells per frame on a 2D canvas at 25 fps. The loop pauses
 * offscreen and draws one still frame under prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const MARK_W = 397.7;
const MARK_H = 311.7;
const BAR_H = 77.6;
const BAR_W = 330.7;
const SLANT = 67;

type Point = readonly [number, number];

function bar(top: number, leansLeft: boolean): Point[] {
  const bottom = top + BAR_H;
  return leansLeft
    ? [[SLANT, top], [SLANT + BAR_W, top], [BAR_W, bottom], [0, bottom]]
    : [[0, top], [BAR_W, top], [SLANT + BAR_W, bottom], [SLANT, bottom]];
}

// The three parallelograms of the mark; the middle bar leans the other way.
const BARS: Point[][] = [bar(0, true), bar(116.3, false), bar(234.1, true)];

const RAMP = " .,:;-=+*#%@";
const FONT_PX = 6;
const FRAME_MS = 40;
const ALPHAS = [0.35, 0.6, 0.82, 1];

interface Cell {
  px: number;
  py: number;
  x: number;
  y: number;
  distance: number;
}

/** Exact signed distance to a convex polygon, negative inside. */
function polygonDistance(points: Point[], x: number, y: number): number {
  let nearest = Infinity;
  let inside = true;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i]!;
    const [bx, by] = points[(i + 1) % points.length]!;
    const ex = bx - ax;
    const ey = by - ay;
    const wx = x - ax;
    const wy = y - ay;
    const k = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey)));
    const dx = wx - ex * k;
    const dy = wy - ey * k;
    nearest = Math.min(nearest, dx * dx + dy * dy);
    if (ex * wy - ey * wx < 0) inside = false;
  }
  return inside ? -Math.sqrt(nearest) : Math.sqrt(nearest);
}

function markDistance(x: number, y: number): number {
  return Math.min(...BARS.map((points) => polygonDistance(points, x, y)));
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function intensity(c: Cell, t: number): number {
  const d = c.distance;
  if (d < 0) {
    const depth = clamp01(-d / 30);
    const shimmer = 0.5 + 0.5 * Math.sin(c.x * 0.045 - c.y * 0.03 + t * 1.4);
    return 0.4 + 0.35 * depth + 0.25 * shimmer;
  }
  return 0.4 * Math.exp(-d / 12);
}

export function AsciiSolana({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let cells: Cell[] = [];
    let width = 0;
    let height = 0;
    let gradient: CanvasGradient | string = "#888";

    const paintStyle = () => {
      const root = getComputedStyle(document.documentElement);
      const purple = root.getPropertyValue("--color-solana-purple").trim() || "#A855F7";
      const green = root.getPropertyValue("--color-solana-green").trim() || "#14F195";
      const g = ctx.createLinearGradient(0, height, width, 0);
      g.addColorStop(0, purple);
      g.addColorStop(1, green);
      gradient = g;
    };

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${FONT_PX}px ${getComputedStyle(canvas).fontFamily}`;
      ctx.textBaseline = "top";
      const cellW = ctx.measureText("M").width || FONT_PX * 0.6;
      const cols = Math.floor(width / cellW);
      const rows = Math.floor(height / FONT_PX);
      const scale = Math.min((width * 0.8) / MARK_W, (height * 0.8) / MARK_H);
      const offX = (width - MARK_W * scale) / 2;
      const offY = (height - MARK_H * scale) / 2;
      cells = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = col * cellW;
          const py = row * FONT_PX;
          const x = (px + cellW / 2 - offX) / scale;
          const y = (py + FONT_PX / 2 - offY) / scale;
          cells.push({ px, py, x, y, distance: markDistance(x, y) });
        }
      }
      paintStyle();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const chars: string[][] = ALPHAS.map(() => []);
      const positions: number[][] = ALPHAS.map(() => []);
      for (const cell of cells) {
        const v = intensity(cell, time);
        if (v < 0.04) continue;
        const level = Math.min(RAMP.length - 1, Math.max(1, Math.round(v * (RAMP.length - 1))));
        const tier = Math.min(ALPHAS.length - 1, Math.floor(v * ALPHAS.length));
        chars[tier]!.push(RAMP[level]!);
        positions[tier]!.push(cell.px, cell.py);
      }
      ctx.fillStyle = gradient;
      chars.forEach((tierChars, tier) => {
        if (!tierChars.length) return;
        ctx.globalAlpha = ALPHAS[tier]!;
        const pos = positions[tier]!;
        tierChars.forEach((ch, k) => ctx.fillText(ch, pos[2 * k]!, pos[2 * k + 1]!));
      });
      ctx.globalAlpha = 1;
    };

    layout();
    draw(0);

    const resize = new ResizeObserver(() => {
      layout();
      draw(0);
    });
    resize.observe(canvas);
    const theme = new MutationObserver(paintStyle);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        resize.disconnect();
        theme.disconnect();
      };
    }

    let rafId = 0;
    let last = 0;
    let elapsed = 0;
    let inView = false;
    const loop = (now: number) => {
      if (!inView) return;
      if (now - last >= FRAME_MS) {
        elapsed += Math.min(now - last, 100) / 1000;
        last = now;
        draw(elapsed);
      }
      rafId = requestAnimationFrame(loop);
    };
    const visible = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      const was = inView;
      inView = entry.isIntersecting;
      if (inView && !was) {
        last = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    });
    visible.observe(canvas);

    return () => {
      visible.disconnect();
      resize.disconnect();
      theme.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("block select-none font-mono", className)}
    />
  );
}
