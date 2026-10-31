"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Animated agent network for the agents page.
 * A 3D sphere of interconnected nodes with signal propagation, drawn in
 * SVG over a canvas that sets the sphere's surface in ascii. The surface
 * turns with the network, dims on the far side, and wakes into hex around
 * any node a signal has just reached.
 */

// The sphere's widest silhouette spans ~347 units: 2·RADIUS, plus the ~5%
// perspective gain on a rim node, plus drift, plus the frame around an
// energised one. A 390 viewBox leaves that margin and no more, so the sphere
// fills the element it is given instead of sitting in its own padding.
const VB = 390;
const CX = VB / 2;
const CY = VB / 2;
const FOV = 700;
const NODE_COUNT = 50;
const EDGE_ANGLE_THRESHOLD = 0.75;

const RADIUS = 155;
const ROTATION_SPEED = 0.06;
const TILT = 0.22;
const DRIFT_AMP = 0.025;
const NODE_R_MIN = 1;
const NODE_R_MAX = 1.9;

const BROADCAST_INTERVAL = 2.5;
const SIGNAL_DURATION = 0.6;
const SIGNAL_R = 1.2;
const ENERGY_DECAY = 0.98;

const FADE_IN_DURATION = 1.5;

const SURFACE_COUNT = 2600;
const SURFACE_INSET = 0.965;
const SURFACE_FONT = 8;
const WAKE_DOT = 0.965;
const HEX = "0123456789abcdef";
const SHADES = ".·:+*";
const LEVELS = 8;

interface Vec3 { x: number; y: number; z: number }
interface Edge { a: number; b: number }
interface Signal { fromIdx: number; toIdx: number; startTime: number }

interface BroadcastWave {
  frontier: number[];
  visited: Set<number>;
  nextTime: number;
}

const PHI_ANGLE = Math.PI * (3 - Math.sqrt(5));

function fibonacciSphere(n: number): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = PHI_ANGLE * i;
    pts.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r });
  }
  return pts;
}

function buildEdges(pts: Vec3[]): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < pts.length; i++) {
    const pi = pts[i];
    if (!pi) continue;
    for (let j = i + 1; j < pts.length; j++) {
      const pj = pts[j];
      if (!pj) continue;
      const dot = pi.x * pj.x + pi.y * pj.y + pi.z * pj.z;
      if (dot > EDGE_ANGLE_THRESHOLD) edges.push({ a: i, b: j });
    }
  }
  return edges;
}

function buildAdjacency(edges: Edge[], n: number): number[][] {
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const { a, b } of edges) {
    adj[a]?.push(b);
    adj[b]?.push(a);
  }
  return adj;
}

export function AgentNetworkAnimation({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!svg || !canvas || !ctx) return;

    let px = 1;
    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      px = rect.width / VB;
      ctx.setTransform(dpr * px, 0, 0, dpr * px, 0, 0);
      ctx.font = `${SURFACE_FONT / px}px ${getComputedStyle(canvas).fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    };
    sizeCanvas();
    const resize = new ResizeObserver(sizeCanvas);
    resize.observe(canvas);

    const surface = fibonacciSphere(SURFACE_COUNT);
    const surfaceSeed = surface.map((_, i) => (Math.imul(i + 1, 2654435761) >>> 0) % 997);
    const buckets = Array.from({ length: LEVELS * 2 }, () => ({ chars: [] as string[], pos: [] as number[] }));

    let raf = 0;
    const startTime = performance.now();
    let prev = startTime;

    // Read theme-aware cyan color from CSS variable
    const rawCyan = getComputedStyle(document.documentElement).getPropertyValue("--color-cyan").trim();
    const cyanRGB = rawCyan.startsWith("#")
      ? `${parseInt(rawCyan.slice(1, 3), 16)}, ${parseInt(rawCyan.slice(3, 5), 16)}, ${parseInt(rawCyan.slice(5, 7), 16)}`
      : "34, 211, 230";
    const hotColor = getComputedStyle(document.documentElement).getPropertyValue("--color-foreground").trim() || "#fff";

    const positions = fibonacciSphere(NODE_COUNT);
    const edges = buildEdges(positions);
    const adj = buildAdjacency(edges, NODE_COUNT);

    const energy: number[] = new Array(NODE_COUNT).fill(0);
    const driftPhase: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) driftPhase.push(i * 1.618033988749);

    let angle = 0;
    let broadcastTimer = 0.5;

    const waves: BroadcastWave[] = [];
    const signals: Signal[] = [];

    function project(p: Vec3, idx: number, t: number): { x: number; y: number; z: number; scale: number } {
      const dp = driftPhase[idx] ?? 0;
      const drift = DRIFT_AMP * Math.sin(t * 0.7 + dp);

      const x = p.x * (1 + drift);
      const y = p.y * (1 + drift * 0.6);
      const z = p.z * (1 + drift);

      const cosT = Math.cos(TILT), sinT = Math.sin(TILT);
      const y1 = y * cosT - z * sinT;
      const z1 = y * sinT + z * cosT;

      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const x2 = x * cosA - z1 * sinA;
      const z2 = x * sinA + z1 * cosA;

      const scale = FOV / (FOV + z2 * RADIUS);

      return {
        x: CX + x2 * RADIUS * scale,
        y: CY + y1 * RADIUS * scale,
        z: z2,
        scale,
      };
    }

    const cosTilt = Math.cos(TILT);
    const sinTilt = Math.sin(TILT);
    const drawSurface = (t: number, fadeIn: number) => {
      ctx.clearRect(0, 0, VB, VB);
      for (const b of buckets) {
        b.chars.length = 0;
        b.pos.length = 0;
      }
      const awake: number[] = [];
      for (let i = 0; i < NODE_COUNT; i++) if ((energy[i] ?? 0) > 0.12) awake.push(i);
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const flick = Math.floor(t * 8);
      for (let s = 0; s < SURFACE_COUNT; s++) {
        const p = surface[s]!;
        let wake = 0;
        for (const n of awake) {
          const q = positions[n]!;
          const dot = p.x * q.x + p.y * q.y + p.z * q.z;
          if (dot > WAKE_DOT) wake = Math.max(wake, (energy[n] ?? 0) * ((dot - WAKE_DOT) / (1 - WAKE_DOT)));
        }
        const y1 = p.y * cosTilt - p.z * sinTilt;
        const z1 = p.y * sinTilt + p.z * cosTilt;
        const x2 = p.x * cosA - z1 * sinA;
        const z2 = p.x * sinA + z1 * cosA;
        const r = RADIUS * SURFACE_INSET;
        const scale = FOV / (FOV + z2 * r);
        const x = CX + x2 * r * scale;
        const y = CY + y1 * r * scale;
        const depth = (1 + z2) / 2;
        // A slow band of light runs round the sphere so the surface reads
        // as turning even between broadcasts.
        const band = 0.5 + 0.5 * Math.sin(p.y * 5 + p.x * 2 - t * 0.9);
        let a = (0.12 + 0.62 * depth * depth + 0.2 * band * depth) * fadeIn;
        let ch = SHADES[Math.min(SHADES.length - 1, Math.floor(depth * depth * SHADES.length))]!;
        let hot = false;
        if (wake > 0.05) {
          ch = HEX[(surfaceSeed[s]! + flick) % 16]!;
          a = Math.min(1, a + wake * 0.9);
          hot = wake > 0.55 && depth > 0.5;
        }
        if (a < 0.04) continue;
        const b = buckets[(hot ? LEVELS : 0) + Math.min(LEVELS - 1, Math.floor(a * LEVELS))]!;
        b.chars.push(ch);
        b.pos.push(x, y);
      }
      for (let k = 0; k < buckets.length; k++) {
        const b = buckets[k]!;
        if (!b.chars.length) continue;
        ctx.fillStyle = k >= LEVELS ? hotColor : `rgb(${cyanRGB})`;
        ctx.globalAlpha = Math.min(1, ((k % LEVELS) + 0.5) / LEVELS);
        for (let j = 0; j < b.chars.length; j++) ctx.fillText(b.chars[j]!, b.pos[2 * j]!, b.pos[2 * j + 1]!);
      }
      ctx.globalAlpha = 1;
    };

    // An arrow bound after the `svg` null-check, rather than a hoisted
    // declaration, so the narrowing reaches the innerHTML write below.
    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05);
      prev = now;

      const elapsed = (now - startTime) / 1000;
      const fadeIn = Math.min(elapsed / FADE_IN_DURATION, 1);

      angle += ROTATION_SPEED * dt;
      const t = now / 1000;

      // Broadcasts
      broadcastTimer -= dt;
      if (broadcastTimer <= 0) {
        const src = Math.floor(Math.random() * NODE_COUNT);
        waves.push({ frontier: [src], visited: new Set([src]), nextTime: t + SIGNAL_DURATION });
        energy[src] = 1;
        broadcastTimer = BROADCAST_INTERVAL;
      }

      // Wave propagation
      for (let w = waves.length - 1; w >= 0; w--) {
        const wave = waves[w];
        if (!wave) continue;
        if (t >= wave.nextTime) {
          const next: number[] = [];
          for (const idx of wave.frontier) {
            const neighbors = adj[idx] ?? [];
            for (const nb of neighbors) {
              if (!wave.visited.has(nb)) {
                wave.visited.add(nb);
                next.push(nb);
                energy[nb] = 1;
                signals.push({ fromIdx: idx, toIdx: nb, startTime: t });
              }
            }
          }
          if (next.length === 0) { waves.splice(w, 1); continue; }
          wave.frontier = next;
          wave.nextTime = t + SIGNAL_DURATION;
        }
      }

      // Energy decay
      for (let i = 0; i < NODE_COUNT; i++) {
        energy[i] = (energy[i] ?? 0) * ENERGY_DECAY;
      }

      // Project all nodes
      const projected = positions.map((p, i) => ({ ...project(p, i, t), i }));
      const sorted = [...projected].sort((a, b) => a.z - b.z);

      let html = "";

      // Edges
      for (const { a, b } of edges) {
        const pa = projected[a], pb = projected[b];
        if (!pa || !pb) continue;
        const depth = (Math.min(pa.z, pb.z) + 1) / 2;
        const opacity = (0.1 + 0.15 * depth) * fadeIn;
        html += `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="rgba(${cyanRGB},${opacity})" stroke-width="0.6"/>`;
      }

      // Signals
      for (let s = signals.length - 1; s >= 0; s--) {
        const sig = signals[s];
        if (!sig) { signals.splice(s, 1); continue; }
        const progress = (t - sig.startTime) / SIGNAL_DURATION;
        if (progress > 1) { signals.splice(s, 1); continue; }
        const pa = projected[sig.fromIdx], pb = projected[sig.toIdx];
        if (!pa || !pb) { signals.splice(s, 1); continue; }
        const sx = pa.x + (pb.x - pa.x) * progress;
        const sy = pa.y + (pb.y - pa.y) * progress;
        const so = (0.9 * (1 - progress)) * fadeIn;
        html += `<rect x="${sx - SIGNAL_R}" y="${sy - SIGNAL_R}" width="${2 * SIGNAL_R}" height="${2 * SIGNAL_R}" fill="rgba(${cyanRGB},${so})"/>`;
      }

      // Nodes: small squares that sit in the ascii surface. Near nodes are
      // solid, far ones an outline, and a node a signal has just reached
      // grows a little and gains a hairline frame.
      for (const { x, y, z, scale, i } of sorted) {
        const e = energy[i] ?? 0;
        const r = (NODE_R_MIN + (NODE_R_MAX - NODE_R_MIN) * scale) * (1 + e * 0.5);
        const depth = (1 + z) / 2;
        const alpha = (0.3 + 0.6 * depth) * fadeIn;
        if (depth > 0.45) {
          html += `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" fill="rgba(${cyanRGB},${alpha})" />`;
        } else {
          html += `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" fill="none" stroke="rgba(${cyanRGB},${alpha})" stroke-width="0.5" />`;
        }
        if (e > 0.15) {
          const f = r + 2.5;
          html += `<rect x="${x - f}" y="${y - f}" width="${2 * f}" height="${2 * f}" fill="none" stroke="rgba(${cyanRGB},${e * 0.6 * fadeIn})" stroke-width="0.4" />`;
        }
      }
      svg.innerHTML = html;
      drawSurface(t, fadeIn);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
    };
  }, []);

  return (
    <div className={cn("relative", className)} aria-hidden="true" style={{ pointerEvents: "none" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full select-none font-mono" />
      <svg ref={svgRef} viewBox={`0 0 ${VB} ${VB}`} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
