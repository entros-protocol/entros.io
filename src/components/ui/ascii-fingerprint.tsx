"use client";

/**
 * AsciiFingerprint: a fingerprint drawn as a dense field of ascii on a
 * canvas. Ridges come from a phase field: rings around the core that
 * flatten into arches below it, plus one
 * winding term each at the core and the delta, and small paired terms that
 * open ridge endings and forks. Every winding term has an integer weight
 * and the weights sum to zero, so the field has no seams and the minutiae
 * stay local. A soft pulse travels outward from the core.
 *
 * The loop runs at 25 fps, pauses offscreen and draws one still frame under
 * prefers-reduced-motion.
 */

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Winding = readonly [x: number, y: number, weight: number];

// Coordinates are in units of the print's half-height, y pointing down.
const CORE = [0.03, -0.14] as const;
const WINDINGS: Winding[] = [
  [CORE[0], CORE[1], 1],
  [0.44, 0.46, -1],
  [-0.4, 0.06, 1],
  [-0.33, 0.13, -1],
  [0.2, 0.58, 1],
  [0.27, 0.53, -1],
  [-0.12, -0.6, -1],
  [-0.05, -0.64, 1],
];

const FONT_PX = 7;
const ROW_PX = 7.6;
const RIDGE_ROWS = 3.3;
const FRAME_MS = 40;
const PULSE_S = 5.5;
const RAMP = " .:+*#";
const ALPHAS = [0.3, 0.52, 0.76, 1];
// Cyan on the light background needs more weight to hold the same contrast.
const LIGHT_ALPHAS = [0.5, 0.7, 0.88, 1];

interface Cell {
  px: number;
  py: number;
  base: number;
  ridge: number;
  rho: number;
  mask: number;
}

function hash01(a: number, b: number): number {
  let h = Math.imul(a, 374761393) + Math.imul(b, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

const smoothstep = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A fingertip outline: round at the top, flatter toward the crease. */
function outline(x: number, y: number): number {
  const ox = Math.abs(x) / 0.68;
  const oy = Math.abs(y) / (y < 0 ? 0.95 : 0.88);
  return Math.pow(Math.pow(ox, 2.2) + Math.pow(oy, y < 0 ? 2 : 2.8), 1 / 2.2);
}

export function AsciiFingerprint({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let cells: Cell[] = [];
    let width = 0;
    let height = 0;
    let ink = "#22D3E6";
    let hot = "#ffffff";
    let alphas = ALPHAS;

    const readColors = () => {
      alphas = document.documentElement.classList.contains("dark") ? ALPHAS : LIGHT_ALPHAS;
      const root = getComputedStyle(document.documentElement);
      ink = root.getPropertyValue("--color-cyan").trim() || ink;
      hot = root.getPropertyValue("--color-foreground").trim() || hot;
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
      const cellW = ctx.measureText("M").width || FONT_PX * 0.6;
      const cols = Math.floor(width / cellW);
      const rows = Math.floor(height / ROW_PX);
      const unit = Math.min(width / 1.44, height / 1.94);
      const k = (2 * Math.PI * unit) / (RIDGE_ROWS * ROW_PX);
      cells = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const px = (col + 0.5) * cellW;
          const py = (row + 0.5) * ROW_PX;
          const x = (px - width / 2) / unit;
          const y = (py - height / 2) / unit;
          const edge = outline(x, y) + (hash01(col, row) - 0.5) * 0.09;
          const mask = 1 - smoothstep(0.84, 1, edge);
          if (mask <= 0.02) continue;
          const dx = x - CORE[0];
          const dy = (y - CORE[1]) * 0.86;
          const rho = Math.sqrt(dx * dx + dy * dy);
          // Below the core the rings flatten into shallow arches, the way
          // ridges run across the lower half of a fingertip.
          const arch = dy + 0.32 * dx * dx;
          const flatten = smoothstep(0.08, 0.7, y - CORE[1]);
          const warp = 0.03 * Math.sin(3.1 * x + 1.7 * y) + 0.02 * Math.sin(4.3 * y - 2.2 * x + 1);
          let phase = k * (rho + (arch - rho) * flatten + warp);
          for (const [wx, wy, w] of WINDINGS) phase += w * Math.atan2(y - wy, x - wx);
          const ridge = Math.pow(0.5 + 0.5 * Math.cos(phase), 2.4);
          const centre = 0.7 + 0.3 * (1 - Math.min(1, rho));
          cells.push({ px, py, base: ridge * mask * centre, ridge, rho, mask });
        }
      }
      readColors();
    };

    const tierChars: string[][] = ALPHAS.map(() => []);
    const tierPos: number[][] = ALPHAS.map(() => []);
    const hotChars: string[] = [];
    const hotPos: number[] = [];

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < ALPHAS.length; i++) {
        tierChars[i]!.length = 0;
        tierPos[i]!.length = 0;
      }
      hotChars.length = 0;
      hotPos.length = 0;
      // The pulse eases out of the core, crosses the print and rests
      // offscreen for the last part of each cycle.
      const p = (time % PULSE_S) / PULSE_S;
      const front = -0.1 + 1.4 * (1 - Math.pow(1 - p, 1.6));
      for (const c of cells) {
        const near = (c.rho - front) / 0.075;
        const pulse = near > -3 && near < 3 ? Math.exp(-near * near) : 0;
        const v = Math.min(1, c.base + pulse * 0.55 * c.ridge * c.mask);
        if (v < 0.07) continue;
        const ch = RAMP[Math.min(RAMP.length - 1, Math.max(1, Math.round(v * (RAMP.length - 1))))]!;
        if (pulse > 0.5 && c.ridge > 0.55) {
          hotChars.push(ch);
          hotPos.push(c.px, c.py);
          continue;
        }
        const tier = Math.min(ALPHAS.length - 1, Math.floor(v * ALPHAS.length));
        tierChars[tier]!.push(ch);
        tierPos[tier]!.push(c.px, c.py);
      }
      ctx.fillStyle = ink;
      for (let t = 0; t < ALPHAS.length; t++) {
        const chars = tierChars[t]!;
        if (!chars.length) continue;
        ctx.globalAlpha = alphas[t]!;
        const pos = tierPos[t]!;
        for (let i = 0; i < chars.length; i++) ctx.fillText(chars[i]!, pos[2 * i]!, pos[2 * i + 1]!);
      }
      ctx.fillStyle = hot;
      ctx.globalAlpha = 0.9;
      for (let i = 0; i < hotChars.length; i++) ctx.fillText(hotChars[i]!, hotPos[2 * i]!, hotPos[2 * i + 1]!);
      ctx.globalAlpha = 1;
    };

    // A still frame shows the print with the pulse parked offscreen.
    const STILL = PULSE_S * 0.99;
    layout();
    draw(STILL);

    const resize = new ResizeObserver(() => {
      layout();
      draw(STILL);
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
      className={cn(
        "block aspect-[4/5] w-full max-w-[300px] select-none font-mono sm:max-w-[360px] md:max-w-[400px] lg:max-w-[440px] xl:max-w-[480px]",
        className,
      )}
    />
  );
}
