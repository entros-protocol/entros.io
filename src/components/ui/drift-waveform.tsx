"use client";

import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import { cn } from "@/lib/utils";
import {
  DEPTH,
  LENGTH,
  PEAK,
  REST,
  cellShade,
  echoLines,
  extrusionLines,
  headCells,
  layoutHead,
  plausibleShade,
  reflectionCells,
  riseAt,
  type Curve,
  type HeadCells,
  type HeadLayout,
  type MirrorCells,
  type ShadeMap,
  type StackLine,
  type Underlay,
} from "@/lib/head-layout";

/**
 * DriftWaveform: a face in profile, lying face up, drawn in hex digits under
 * a glowing line. Each digit takes its brightness from a 3D render of a head,
 * so the face reads in relief: in dark mode lit planes glow and creases fall
 * dark; in light mode the shadows take the most ink. The head holds still
 * while its digits change, each every few seconds. A faint second line, the
 * prior session, drifts a few units out of register and shows only where it
 * rises clear of the head.
 *
 * A wide band lays the head on its floor line. A tall one, as on a phone,
 * shows the whole head near the top and fills the space under it with the
 * `underlay`: the head's reflection in bars of digits, its profile extruded
 * into depth, or a stack of its fading echoes. Under a lying head the
 * reflection hangs past the band's bottom edge into whatever follows it; the
 * canvas runs on below the band for it without taking any space. See
 * `layoutHead`.
 */

/** The 3D shading, rendered offline from a CC0 head model. */
const SHADE_SRC = "/images/hero-head.webp";
/** Pixels of the shading map per trace unit, as it was built. */
const SHADE_PER_UNIT = 3;
/** How long the head waits for its shading before starting without it. */
const SHADE_WAIT_MS = 1500;

/** The prior session's line eases between its rest and this shape. */
const NEXT: Curve = { shift: -1.5, amp: 1.03, sway: 1.2 };
const GHOST_SHIFT = 2.5;
const GHOST_AMP = 0.98;
/** Where in its loop the prior session's drift starts. */
const GHOST_PHASE_S = -1.6;

const LOOP_S = 9;
/** Digit size, and the row pitch it sits on. */
const FONT_PX = 9;
const ROW_PX = 10;
/** A stack narrower than this uses smaller digits, so a phone's head keeps its detail. */
const SMALL_BELOW = 520;
const SMALL_FONT_PX = 7;
const SMALL_ROW_PX = 8;
const FRAME_MS = 40;
const HEX = "0123456789abcdef";
/** Mean seconds between digit changes in any one cell. */
const GLYPH_S = 12;
/** Without the shading: fill alpha at the floor and at the height of the nose tip. */
const FILL_FLOOR = 0.2;
const FILL_TOP = 0.8;
/** Extra alpha for the cell right inside the line, where it is lit. */
const EDGE = 0.25;
/** Share of the head's alpha its reflection gives back, before the reflection fades with depth. */
const MIRROR_ALPHA = 0.6;
/** Alpha of each line's wash at the height of the nose tip. */
const LIVE_WASH = 0.1;
const GHOST_WASH = 0.08;
/** Share of an echo's length over which each of its ends fades out. */
const ECHO_END = 0.12;
/** Depth of the soft edge that uncovers the underlay, top first, as the hero fades in. */
const REVEAL_PX = 80;

const ease = (time: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * time) / LOOP_S);

function ghostAt(time: number): Curve {
  const k = ease(time + GHOST_PHASE_S);
  return {
    shift: REST.shift + (NEXT.shift - REST.shift) * k + GHOST_SHIFT,
    amp: (REST.amp + (NEXT.amp - REST.amp) * k) * GHOST_AMP,
    sway: REST.sway + (NEXT.sway - REST.sway) * k,
  };
}

/** The map's pixels, or null where the browser will not hand them over. */
function readShade(image: HTMLImageElement): ShadeMap | null {
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const scratch = document.createElement("canvas");
  scratch.width = width;
  scratch.height = height;
  const sctx = scratch.getContext("2d", { willReadFrequently: true });
  if (!width || !height || !sctx) return null;
  sctx.drawImage(image, 0, 0);
  let rgba: Uint8ClampedArray;
  try {
    rgba = sctx.getImageData(0, 0, width, height).data;
  } catch {
    return null;
  }
  const data = new Uint8Array(width * height);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4]!;
  return plausibleShade(data, width) ? { width, height, perUnit: SHADE_PER_UNIT, data } : null;
}

export function DriftWaveform({
  className,
  underlay,
}: {
  className?: string;
  /** What lies under the head. See `Underlay`. */
  underlay: Underlay;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  preload(SHADE_SRC, { as: "image", fetchPriority: "low" });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    /** The band the head is laid out in. The canvas may run on below it. */
    const box = canvas?.parentElement;
    // The underlay and digits are painted once into this layer and copied in
    // whole each frame; a frame repaints only the digits that change.
    const layer = document.createElement("canvas");
    const lctx = layer.getContext("2d");
    if (!canvas || !ctx || !box || !lctx) return;

    let width = 0;
    let height = 0;
    /** The canvas's height: the band's, or more where a reflection hangs below it. */
    let bottom = 0;
    let dpr = 1;
    let font = "";
    let rowPx = ROW_PX;
    let cellW = FONT_PX * 0.6;
    let ink = "#22D3E6";
    let rgb = "34, 211, 230";
    let light = false;
    let head: HeadLayout | null = null;
    let cells: HeadCells | null = null;
    let mirror: MirrorCells | null = null;
    let lines: StackLine[] = [];
    /** Every digit's centre: the head's cells, then its reflection's. */
    let xs = new Float32Array(0);
    let ys = new Float32Array(0);
    let glyphs = new Uint8Array(0);
    let alpha = new Float32Array(0);
    let shade: ShadeMap | null = null;
    /** Set once the shading has loaded, failed, or kept the head waiting too long. */
    let settled = false;
    let livePath = new Path2D();
    /** Where the prior session may show: above the floor and outside the head. */
    let clear = new Path2D();
    let fadeMask: CanvasGradient | null = null;
    let liveWash: CanvasGradient | string = "transparent";
    let ghostWash: CanvasGradient | string = "transparent";

    /** Adds a curve's outline as a path along its base, crown to chin. */
    const traceOutline = (path: Path2D, h: HeadLayout, c: Curve, base = h.floor) => {
      const x0 = h.crown + c.shift * h.along;
      const x1 = h.crown + (LENGTH + c.shift) * h.along;
      path.moveTo(x0, base);
      for (let x = x0 + 1; x < x1; x += 1) path.lineTo(x, base - riseAt(h, c, x));
      path.lineTo(x1, base);
    };

    const shadeCells = () => {
      if (!head || !cells) return;
      alpha = new Float32Array(xs.length);
      const along = cellW / head.along;
      const up = rowPx / head.out;
      /** How lit the head is at a point, inverted in light mode, where shadow takes the ink. */
      const litAt = (d: number, h: number, span: number) => {
        if (!shade) return null;
        const s = cellShade(shade, d, h, along, span);
        return light ? 1 - s : s;
      };
      const inkAt = (lit: number | null, h: number) => {
        if (lit === null) return (FILL_FLOOR + (FILL_TOP - FILL_FLOOR) * Math.min(1, h / DEPTH)) * (light ? 1.35 : 1);
        return light ? 0.14 + 0.86 * lit ** 1.15 : 0.05 + 0.95 * lit ** 1.6;
      };
      const { count, d, h, edge } = cells;
      for (let i = 0; i < count; i++) {
        const lit = litAt(d[i]!, h[i]!, up);
        let a = inkAt(lit, h[i]!);
        // Lying on the floor, the head rises out of it.
        if (lit !== null && head.mode === "floor") a *= 0.55 + 0.45 * Math.min(1, h[i]! / DEPTH);
        if (edge[i]) a += EDGE * (0.3 + 0.7 * (lit ?? 1));
        alpha[i] = Math.min(1, a);
      }
      if (!mirror) return;
      const span = up / mirror.stretch;
      for (let i = 0; i < mirror.count; i++) {
        const lit = litAt(mirror.d[i]!, mirror.h[i]!, span);
        alpha[count + i] = Math.min(1, inkAt(lit, mirror.h[i]!) * MIRROR_ALPHA * mirror.fade[i]!);
      }
    };

    const paintCell = (i: number) => {
      const x = xs[i]!;
      const y = ys[i]!;
      lctx.clearRect(x - cellW / 2, y - rowPx / 2, cellW, rowPx);
      lctx.globalAlpha = alpha[i]!;
      lctx.fillText(HEX[glyphs[i]!]!, x, y);
    };

    const paintLines = (h: HeadLayout) => {
      lctx.strokeStyle = ink;
      if (underlay === "echoes") {
        // Each echo fades out toward both ends, so the jaw's turn does not
        // pile up into a fringe at the chin. The extrusion keeps its ends:
        // there the jaw's turns stack into the solid's side.
        const ends = lctx.createLinearGradient(h.crown, 0, h.crown + LENGTH * h.along, 0);
        ends.addColorStop(0, `rgba(${rgb}, 0)`);
        ends.addColorStop(ECHO_END, `rgba(${rgb}, 1)`);
        ends.addColorStop(1 - ECHO_END, `rgba(${rgb}, 1)`);
        ends.addColorStop(1, `rgba(${rgb}, 0)`);
        lctx.strokeStyle = ends;
      }
      lctx.lineWidth = 1;
      lctx.lineJoin = "round";
      for (const line of lines) {
        const path = new Path2D();
        traceOutline(path, h, line.curve, line.base);
        lctx.globalAlpha = Math.min(1, line.alpha * (light ? 0.85 : 1));
        lctx.stroke(path);
      }
      // The head stands in front of the lines under it.
      lctx.globalCompositeOperation = "destination-out";
      lctx.globalAlpha = 1;
      lctx.fill(livePath);
      lctx.globalCompositeOperation = "source-over";
    };

    const paintLayer = () => {
      layer.width = canvas.width;
      layer.height = canvas.height;
      if (!head || !cells) return;
      lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (lines.length) paintLines(head);
      lctx.font = font;
      lctx.textAlign = "center";
      lctx.textBaseline = "middle";
      lctx.fillStyle = ink;
      for (let i = 0; i < xs.length; i++) {
        lctx.globalAlpha = alpha[i]!;
        lctx.fillText(HEX[glyphs[i]!]!, xs[i]!, ys[i]!);
      }
    };

    const wash = (h: HeadLayout, strength: number) => {
      const g = ctx.createLinearGradient(0, h.floor - DEPTH * PEAK * h.out, 0, h.floor);
      g.addColorStop(0, `rgba(${rgb}, ${strength})`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      return g;
    };

    const readColors = () => {
      ink = getComputedStyle(document.documentElement).getPropertyValue("--color-cyan").trim() || ink;
      light = !document.documentElement.classList.contains("dark");
      // The canvas reports any opaque colour back as #rrggbb.
      ctx.fillStyle = ink;
      const hex = /^#([0-9a-f]{6})$/i.exec(String(ctx.fillStyle))?.[1] ?? "22d3e6";
      rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ");
      if (head) {
        liveWash = wash(head, LIVE_WASH * (light ? 1.3 : 1));
        ghostWash = wash(head, GHOST_WASH * (light ? 1.3 : 1));
      }
      shadeCells();
      paintLayer();
    };

    const layout = () => {
      const rect = box.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (!width || !height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const h = layoutHead(width, height);
      head = h;
      const small = h.mode === "stack" && width < SMALL_BELOW;
      const fontPx = small ? SMALL_FONT_PX : FONT_PX;
      rowPx = small ? SMALL_ROW_PX : ROW_PX;
      font = `${fontPx}px ${getComputedStyle(canvas).fontFamily}`;
      ctx.font = font;
      cellW = ctx.measureText("M").width || fontPx * 0.6;
      cells = headCells(h, width, cellW, rowPx);
      mirror = underlay === "reflection" ? reflectionCells(h, width, height, cellW, rowPx) : null;
      lines = underlay === "echoes" ? echoLines(h, height) : underlay === "extrusion" ? extrusionLines(h, height) : [];
      let deepest = 0;
      if (mirror) for (let i = 0; i < mirror.count; i++) deepest = Math.max(deepest, mirror.y[i]! + rowPx / 2);
      bottom = deepest > height ? Math.ceil(deepest) : height;
      canvas.style.height = bottom > height ? `${bottom}px` : "";
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(bottom * dpr);
      const total = cells.count + (mirror?.count ?? 0);
      xs = new Float32Array(total);
      ys = new Float32Array(total);
      xs.set(cells.x);
      ys.set(cells.y);
      if (mirror) {
        xs.set(mirror.x, cells.count);
        ys.set(mirror.y, cells.count);
      }
      glyphs = new Uint8Array(total);
      for (let i = 0; i < glyphs.length; i++) glyphs[i] = Math.floor(Math.random() * 16);
      livePath = new Path2D();
      traceOutline(livePath, h, REST);
      clear = new Path2D();
      clear.rect(0, 0, width, h.floor);
      clear.addPath(livePath);
      fadeMask = ctx.createLinearGradient(0, 0, h.fade, 0);
      fadeMask.addColorStop(0, "rgba(0, 0, 0, 1)");
      fadeMask.addColorStop(1, "rgba(0, 0, 0, 0)");
      readColors();
    };

    const draw = (time: number, fade: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!settled || !head || !cells?.count || fade <= 0) return;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = fade;
      ctx.fillStyle = liveWash;
      ctx.fill(livePath);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(layer, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // As the hero fades in, the underlay is uncovered from the top down.
      if ((lines.length || mirror?.count) && fade < 1) {
        const front = head.floor + (bottom - head.floor + REVEAL_PX) * (1 - (1 - fade) ** 3);
        const veil = ctx.createLinearGradient(0, front - REVEAL_PX, 0, front);
        veil.addColorStop(0, "rgba(0, 0, 0, 0)");
        veil.addColorStop(1, "rgba(0, 0, 0, 1)");
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = 1;
        ctx.fillStyle = veil;
        // Only below the floor, so the reveal never dims the head itself.
        const top = Math.max(head.floor, front - REVEAL_PX);
        ctx.fillRect(0, top, width, bottom - top);
        ctx.globalCompositeOperation = "source-over";
      }

      // The prior session shows only where it rises clear of the head, so
      // it never cuts through the digits.
      ctx.strokeStyle = ink;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      const ghost = new Path2D();
      traceOutline(ghost, head, ghostAt(time));
      ctx.save();
      ctx.clip(clear, "evenodd");
      ctx.globalAlpha = fade;
      ctx.fillStyle = ghostWash;
      ctx.fill(ghost);
      ctx.globalAlpha = fade * (light ? 0.5 : 0.4);
      ctx.lineWidth = 1.5;
      ctx.stroke(ghost);
      ctx.restore();

      if (!light) {
        ctx.globalAlpha = fade * 0.5;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = ink;
        ctx.shadowBlur = 10;
        ctx.stroke(livePath);
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = fade;
      ctx.lineWidth = 2;
      ctx.stroke(livePath);

      // Where the crown runs off the edge, the head fades out into it.
      const edge = riseAt(head, REST, 0);
      if (edge > 0 && fadeMask) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.globalAlpha = Math.min(1, edge / 24);
        ctx.fillStyle = fadeMask;
        ctx.fillRect(0, 0, head.fade, bottom);
        ctx.globalCompositeOperation = "source-over";
      }
      ctx.globalAlpha = 1;
    };

    let elapsed = 0;
    let fadeStart = 0;
    let fade = 0;
    let turnover = 0;
    let alive = true;
    layout();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) fade = 1;

    const settle = (map: ShadeMap | null) => {
      window.clearTimeout(wait);
      if (!alive) return;
      if (map) {
        shade = map;
        shadeCells();
        paintLayer();
      }
      settled = true;
      draw(elapsed, fade);
    };
    const image = new Image();
    image.decoding = "async";
    image.onload = () => settle(readShade(image));
    image.onerror = () => settle(null);
    image.src = SHADE_SRC;
    const wait = window.setTimeout(() => settle(null), SHADE_WAIT_MS);

    // The digits are set in the mono face, which may still be loading.
    void document.fonts?.ready.then(() => {
      if (!alive) return;
      layout();
      draw(elapsed, fade);
    });
    // The band, not the canvas: the canvas's own height follows the layout.
    const resize = new ResizeObserver(() => {
      layout();
      draw(elapsed, fade);
    });
    resize.observe(box);
    const theme = new MutationObserver(() => {
      readColors();
      draw(elapsed, fade);
    });
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const stop = () => {
      alive = false;
      window.clearTimeout(wait);
      image.onload = null;
      image.onerror = null;
      resize.disconnect();
      theme.disconnect();
    };
    if (reduced) return stop;

    let rafId = 0;
    let last = 0;
    let inView = false;
    const loop = (now: number) => {
      if (!inView) return;
      if (now - last >= FRAME_MS) {
        const dt = Math.min(now - last, 100) / 1000;
        last = now;
        if (settled) {
          elapsed += dt;
          if (!fadeStart) fadeStart = now;
          fade = Math.min(1, (now - fadeStart) / 1000);
          turnover += (glyphs.length * dt) / GLYPH_S;
          for (; turnover >= 1; turnover--) {
            const i = Math.floor(Math.random() * glyphs.length);
            glyphs[i] = Math.floor(Math.random() * 16);
            paintCell(i);
          }
          draw(elapsed, fade);
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    const visible = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        const was = inView;
        inView = entry.isIntersecting;
        if (inView && !was) {
          last = performance.now();
          rafId = requestAnimationFrame(loop);
        }
      },
      { threshold: 0.05 },
    );
    visible.observe(canvas);

    return () => {
      stop();
      visible.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [underlay]);

  return (
    <div aria-hidden className={cn("pointer-events-none relative", className)}>
      <canvas ref={canvasRef} className="absolute inset-x-0 top-0 block h-full w-full select-none font-mono" />
    </div>
  );
}
