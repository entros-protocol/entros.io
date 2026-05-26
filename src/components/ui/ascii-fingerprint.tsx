"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const COLS = 96;
const ROWS = 28;
const X_CENTER_COL = 48;
const Y_CENTER_ROW = 14;
const X_SCALE = 40;
const Y_SCALE = 20;
const FRAME_INTERVAL_MS = 33;

const OVAL_RX = 0.58;
const OVAL_RY = 0.66;
const CORE_X = 0;
const CORE_Y = 0.08;
const DELTA_X = 0.34;
const DELTA_Y = -0.46;
const RIDGE_FREQ = 4.2;
const RADIAL_BIAS = 5.5;
const DELTA_WEIGHT = 0.42;
const SCAN_SPEED = 0.34;
const SCAN_WIDTH = 0.09;

interface AsciiFingerprintProps {
  className?: string;
}

export function AsciiFingerprint({ className }: AsciiFingerprintProps) {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    const pre = preRef.current;
    if (!pre) return;

    const tierBuf = new Uint8Array(COLS * ROWS);
    const charBuf = new Uint8Array(COLS * ROWS);
    // Per-cell flag: cell is currently inside the radial scan band.
    // Decoupled from tier so the streak can have its own color treatment
    // — important in light mode where opacity-only contrast washes out
    // and the sweep needs a non-cyan accent to read against #FAFAF8.
    const streakBuf = new Uint8Array(COLS * ROWS);

    let t = 0;
    let prev = performance.now();
    let lastFrame = 0;
    let rafId = 0;
    let inView = true;

    function frame(now: number) {
      if (now - lastFrame < FRAME_INTERVAL_MS) {
        if (inView) rafId = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;
      lastFrame = now;
      t += dt;

      tierBuf.fill(0);
      charBuf.fill(0);
      streakBuf.fill(0);

      const scanR = (t * SCAN_SPEED) % 1.4;

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const u = (col - X_CENTER_COL) / X_SCALE;
          const v = -(row - Y_CENTER_ROW) / Y_SCALE;

          const ovalDist =
            (u * u) / (OVAL_RX * OVAL_RX) + (v * v) / (OVAL_RY * OVAL_RY);
          if (ovalDist > 1.04) continue;

          const angC = Math.atan2(v - CORE_Y, u - CORE_X);
          const angD = Math.atan2(v - DELTA_Y, u - DELTA_X);
          const rOrigin = Math.sqrt(u * u + v * v);
          const phase = angC - DELTA_WEIGHT * angD + rOrigin * RADIAL_BIAS;
          const ridge = Math.sin(phase * RIDGE_FREQ);

          const edgeFade =
            ovalDist > 0.85 ? Math.max(0, (1.04 - ovalDist) / 0.19) : 1;

          const du = u - CORE_X;
          const dv = v - CORE_Y;
          const rFromCore = Math.sqrt(du * du + dv * dv);
          const scanDist = Math.abs(rFromCore - scanR);
          const scanBoost = Math.max(0, 1 - scanDist / SCAN_WIDTH);

          let level: number;
          if (ridge > 0.55) level = 0.92;
          else if (ridge > 0.1) level = 0.7;
          else if (ridge > -0.25) level = 0.42;
          else continue;

          level = level * edgeFade + scanBoost * 0.35 * edgeFade;

          let tierVal: number;
          if (level > 0.86) tierVal = 4;
          else if (level > 0.58) tierVal = 3;
          else if (level > 0.28) tierVal = 2;
          else if (level > 0.08) tierVal = 1;
          else continue;

          const idx = row * COLS + col;
          if (tierVal > tierBuf[idx]!) {
            tierBuf[idx] = tierVal;
            charBuf[idx] = ridge > 0.7 ? 0 : 1;
          }
          // Mark the cell as actively streaking when the radial scan ring
          // passes near it. Threshold 0.3 keeps the band visually
          // distinct without being so wide it covers half the spiral.
          if (scanBoost > 0.3) streakBuf[idx] = 1;
        }
      }

      let html = "";
      // Encode (tier, streak) into a single key so the rendering loop only
      // emits a new <span> when either dimension changes. Streak is a
      // 1-bit flag layered on top of the 4 tiers.
      let lastKey = -1;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const idx = r * COLS + c;
          const v = tierBuf[idx]!;
          if (v === 0) {
            if (lastKey !== -1) html += "</span>";
            html += " ";
            lastKey = -1;
            continue;
          }
          const streak = streakBuf[idx]!;
          const key = (streak << 3) | v;
          if (key !== lastKey) {
            if (lastKey !== -1) html += "</span>";
            // Light mode: streak cells render in foreground so the
            // sweep reads against the off-white background. Dark mode:
            // streak cells fall back to the tier-based cyan opacity
            // (identical to baseline at the same tier) so the original
            // gradient sweep — driven by the level-math tier boost in
            // the inner loop — is preserved.
            let cls: string;
            if (streak === 1) {
              cls =
                v === 1
                  ? "text-foreground dark:text-cyan/25"
                  : v === 2
                    ? "text-foreground dark:text-cyan/50"
                    : v === 3
                      ? "text-foreground dark:text-cyan/75"
                      : "text-foreground dark:text-cyan";
            } else {
              cls =
                v === 1
                  ? "text-cyan/40 dark:text-cyan/25"
                  : v === 2
                    ? "text-cyan/60 dark:text-cyan/50"
                    : v === 3
                      ? "text-cyan/80 dark:text-cyan/75"
                      : "text-cyan";
            }
            // aria-hidden on each generated span: axe-core's color-contrast
            // rule walks innerHTML-injected children and doesn't reliably
            // honor the parent <pre aria-hidden>. Same rationale as the
            // ascii-flow patch.
            html += `<span class="${cls}" aria-hidden="true">`;
          }
          html += charBuf[idx] === 1 ? "1" : "0";
          lastKey = key;
        }
        if (lastKey !== -1) {
          html += "</span>";
          lastKey = -1;
        }
        if (r < ROWS - 1) html += "\n";
      }
      pre!.innerHTML = html;

      if (inView) rafId = requestAnimationFrame(frame);
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
    rafId = requestAnimationFrame(frame);

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
