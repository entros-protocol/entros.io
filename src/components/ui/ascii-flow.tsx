"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * AsciiFlow: a word set in dense hex inside a field of flowing streams.
 *
 * The word is drawn once in the display face on an offscreen canvas and
 * sampled at each character cell, so its letterforms match the headings.
 * Inside the letters, hex digits flicker under a slow diagonal shimmer.
 * Around them, lanes of streaks
 * run left and right at their own speeds, faster near the middle of the
 * band, and part to leave a clean margin around the letters.
 *
 * The loop runs at 25 fps, pauses offscreen and draws one still frame under
 * prefers-reduced-motion.
 */

const FONT_PX = 8;
const ROW_PX = 9;
const FRAME_MS = 40;
const LEVELS = 10;
const HEX = "0123456789abcdef";
const MARGIN = 2;

function hash01(a: number, b: number): number {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const fract = (v: number) => v - Math.floor(v);

export function AsciiFlow({ className, brand = "" }: { className?: string; brand?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let cellW = FONT_PX * 0.6;
    let cols = 0;
    let rows = 0;
    let ink = "#22D3E6";
    let hot = "#ffffff";
    let light = false;
    /** Letter coverage per cell, 0 to 1. */
    let cover = new Float32Array(0);
    /** Distance in cells to the nearest letter cell, capped at MARGIN + 1. */
    let near = new Uint8Array(0);

    const buckets = Array.from({ length: LEVELS * 2 }, () => ({ chars: [] as string[], pos: [] as number[] }));
    const put = (ch: string, x: number, y: number, a: number, isHot = false) => {
      if (a <= 0.03) return;
      const level = Math.min(LEVELS - 1, Math.floor(Math.min(1, a) * LEVELS));
      const b = buckets[(isHot ? LEVELS : 0) + level]!;
      b.chars.push(ch);
      b.pos.push(x, y);
    };

    const readColors = () => {
      const root = getComputedStyle(document.documentElement);
      ink = root.getPropertyValue("--color-cyan").trim() || ink;
      hot = root.getPropertyValue("--color-foreground").trim() || hot;
      light = !document.documentElement.classList.contains("dark");
    };

    const sampleWord = () => {
      cover = new Float32Array(cols * rows);
      near = new Uint8Array(cols * rows).fill(MARGIN + 1);
      if (!brand) return;
      const off = document.createElement("canvas");
      off.width = cols;
      off.height = rows;
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      const family = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "sans-serif";
      // One offscreen pixel per cell. Cells are taller than wide, so the
      // text is stretched horizontally by the cell aspect to read true.
      const aspect = ROW_PX / cellW;
      let size = rows * 0.72;
      o.font = `500 ${size}px ${family}`;
      const measured = o.measureText(brand).width * aspect;
      if (measured > cols * 0.74) size *= (cols * 0.74) / measured;
      o.font = `500 ${size}px ${family}`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#fff";
      o.setTransform(aspect, 0, 0, 1, cols / 2, rows / 2);
      o.fillText(brand, 0, size * 0.04);
      const data = o.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < cols * rows; i++) {
        const a = data[i * 4 + 3]! / 255;
        cover[i] = a;
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (cover[r * cols + c]! <= 0.45) continue;
          for (let dr = -MARGIN; dr <= MARGIN; dr++) {
            for (let dc = -MARGIN * 2; dc <= MARGIN * 2; dc++) {
              const rr = r + dr;
              const cc = c + dc;
              if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
              const d = Math.max(Math.abs(dr), Math.ceil(Math.abs(dc) / 2));
              const j = rr * cols + cc;
              if (d < near[j]!) near[j] = d;
            }
          }
        }
      }
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
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      cellW = ctx.measureText("M").width || FONT_PX * 0.6;
      cols = Math.floor(width / cellW);
      rows = Math.floor(height / ROW_PX);
      readColors();
      sampleWord();
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const b of buckets) {
        b.chars.length = 0;
        b.pos.length = 0;
      }
      const boost = light ? 1.45 : 1;
      const midRow = (rows - 1) / 2;
      const midCol = (cols - 1) / 2;
      const flick = Math.floor(time * 6);

      for (let r = 0; r < rows; r++) {
        const y = (r + 0.5) * ROW_PX;
        const band = 1 - Math.abs(r - midRow) / (midRow + 1);
        const bandFade = Math.pow(Math.max(0, band), 1.4);
        const lane = hash01(r, 11);
        const dir = lane < 0.5 ? 1 : -1;
        const speed = dir * (6 + 26 * hash01(r, 12) * (0.4 + 0.6 * band));
        const period = 18 + Math.floor(40 * hash01(r, 13));
        const length = 0.18 + 0.35 * hash01(r, 14);

        for (let c = 0; c < cols; c++) {
          const x = (c + 0.5) * cellW;
          const i = r * cols + c;
          const m = cover[i]!;

          if (m > 0.45) {
            const shimmer = 0.5 + 0.5 * Math.sin(c * 0.11 - r * 0.24 - time * 1.6);
            const ch = HEX[Math.floor(hash01(i, flick + Math.floor(hash01(i, 1) * 9)) * 16)]!;
            put(ch, x, y, (0.62 + 0.38 * shimmer) * Math.min(1, m * 1.3) * (light ? 1.35 : 0.95));
            continue;
          }
          if (m > 0.12) {
            put(".", x, y, 0.35 * boost);
            continue;
          }

          const gap = near[i]!;
          if (gap <= MARGIN) continue;

          const across = 1 - Math.abs(c - midCol) / (midCol + 1);
          const f = fract((c - speed * time) / period + hash01(r, 15));
          const head = dir > 0 ? f > 1 - 0.035 : f < 0.035;
          const inStreak = f < length || f > 1 - length * 0.15;
          if (head && inStreak) {
            put(HEX[Math.floor(hash01(c, r + flick) * 16)]!, x, y, bandFade * (0.5 + 0.5 * across) * boost, across > 0.7 && band > 0.55);
          } else if (f < length) {
            const t = dir > 0 ? 1 - f / length : f / length;
            const a = bandFade * (0.15 + 0.5 * t) * (0.35 + 0.65 * across) * boost;
            put(t > 0.66 ? "=" : t > 0.33 ? "-" : "·", x, y, a);
          } else if (hash01(c, r) < 0.05 * band) {
            put("·", x, y, 0.16 * bandFade * boost);
          }
        }
      }

      for (let k = 0; k < buckets.length; k++) {
        const b = buckets[k]!;
        if (!b.chars.length) continue;
        ctx.fillStyle = k >= LEVELS ? hot : ink;
        ctx.globalAlpha = Math.min(1, ((k % LEVELS) + 0.5) / LEVELS);
        for (let j = 0; j < b.chars.length; j++) ctx.fillText(b.chars[j]!, b.pos[2 * j]!, b.pos[2 * j + 1]!);
      }
      ctx.globalAlpha = 1;
    };

    let elapsed = 0;
    layout();
    draw(0);
    // The word is sampled from the display face, which may still be loading.
    void document.fonts?.ready.then(() => {
      layout();
      draw(elapsed);
    });

    const resize = new ResizeObserver(() => {
      layout();
      draw(elapsed);
    });
    resize.observe(canvas);
    const theme = new MutationObserver(readColors);
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return () => {
        resize.disconnect();
        theme.disconnect();
      };
    }

    let rafId = 0;
    let last = 0;
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
  }, [brand]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("block h-full w-full select-none font-mono", className)}
    />
  );
}
