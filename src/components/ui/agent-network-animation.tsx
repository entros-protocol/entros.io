"use client";

import { useRef, useEffect } from "react";

/**
 * Animated agent network for the Agent Anchor page.
 * A 3D sphere of interconnected nodes with signal propagation.
 * Pure SVG, no external dependencies.
 */

// The sphere's widest silhouette spans ~347 units: 2·RADIUS, plus the ~5%
// perspective gain on a rim node, plus drift, plus the 2.5x glow halo of an
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
const NODE_R_MIN = 2;
const NODE_R_MAX = 4;

const BROADCAST_INTERVAL = 2.5;
const SIGNAL_DURATION = 0.6;
const SIGNAL_R = 2;
const ENERGY_DECAY = 0.98;

const FADE_IN_DURATION = 1.5;

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

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    let raf = 0;
    const startTime = performance.now();
    let prev = startTime;

    // Read theme-aware cyan color from CSS variable
    const rawCyan = getComputedStyle(document.documentElement).getPropertyValue("--color-cyan").trim();
    const cyanRGB = rawCyan.startsWith("#")
      ? `${parseInt(rawCyan.slice(1, 3), 16)}, ${parseInt(rawCyan.slice(3, 5), 16)}, ${parseInt(rawCyan.slice(5, 7), 16)}`
      : "34, 211, 230";

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
        html += `<circle cx="${sx}" cy="${sy}" r="${SIGNAL_R}" fill="rgba(${cyanRGB},${so})"/>`;
      }

      // Nodes
      for (const { x, y, z, scale, i } of sorted) {
        const e = energy[i] ?? 0;
        const r = (NODE_R_MIN + (NODE_R_MAX - NODE_R_MIN) * scale) * (1 + e * 0.6);
        const depth = (1 + z) / 2;
        const alpha = (0.35 + 0.65 * depth) * fadeIn;
        const glow = e > 0.1 ? e * 0.4 : 0;

        if (glow > 0) {
          html += `<circle cx="${x}" cy="${y}" r="${r * 2.5}" fill="rgba(${cyanRGB},${glow * 0.12 * fadeIn})" />`;
        }
        html += `<circle cx="${x}" cy="${y}" r="${r}" fill="rgba(${cyanRGB},${alpha})" />`;
      }

      svg.innerHTML = html;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VB} ${VB}`}
      className={className}
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    />
  );
}
