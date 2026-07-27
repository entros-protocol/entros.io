"use client";

import { AsciiScene, type SceneRender } from "@/components/ui/ascii-scene";

const TWO_PI = Math.PI * 2;

function plot(
  tier: Uint8Array,
  char: Uint8Array,
  cols: number,
  rows: number,
  cx: number,
  cy: number,
  v: number,
  ch: 0 | 1
) {
  const c = Math.round(cx);
  const r = Math.round(cy);
  if (c < 0 || c >= cols || r < 0 || r >= rows) return;
  const idx = r * cols + c;
  if (v > tier[idx]!) {
    tier[idx] = v;
    char[idx] = ch;
  }
}

function plotLine(
  tier: Uint8Array,
  char: Uint8Array,
  cols: number,
  rows: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  v: number,
  ch: 0 | 1
) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy * 2)) | 0;
  if (steps === 0) {
    plot(tier, char, cols, rows, x0, y0, v, ch);
    return;
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    plot(tier, char, cols, rows, x0 + dx * t, y0 + dy * t, v, ch);
  }
}

function plotCircle(
  tier: Uint8Array,
  char: Uint8Array,
  cols: number,
  rows: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  v: number,
  ch: 0 | 1,
  step = 0.04
) {
  for (let a = 0; a < TWO_PI; a += step) {
    plot(
      tier,
      char,
      cols,
      rows,
      cx + Math.cos(a) * rx,
      cy + Math.sin(a) * ry,
      v,
      ch
    );
  }
}

function tierFromT(x: number): number {
  if (x > 0.85) return 4;
  if (x > 0.55) return 3;
  if (x > 0.25) return 2;
  return 1;
}

function hash(n: number): number {
  let x = (n | 0) ^ 0x9e3779b9;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 0xffffffff;
}

const sdkRender: SceneRender = (cols, rows, tier, char, t) => {
  const padX = 3;
  const padY = 2;
  const innerW = cols - padX * 2;
  const innerH = rows - padY * 2;
  const bandH = innerH / 4;
  const channels = [
    { freq: 0.65, amp: 1.4, speed: 1.6 },
    { freq: 0.32, amp: 1.6, speed: 1.0 },
    { freq: 0.18, amp: 1.7, speed: 0.6 },
  ];
  for (let i = 0; i < channels.length; i++) {
    const ch = channels[i]!;
    const yC = padY + bandH * (i + 0.5);
    for (let xi = 0; xi < innerW; xi++) {
      const x = padX + xi;
      const phase = xi * ch.freq - t * ch.speed;
      const y = yC + Math.sin(phase) * ch.amp;
      const yEnv = yC + Math.sin(phase) * ch.amp * 0.55;
      const peak = Math.abs(Math.sin(phase));
      plot(tier, char, cols, rows, x, y, peak > 0.85 ? 4 : 3, peak > 0.85 ? 0 : 1);
      plot(tier, char, cols, rows, x, yEnv, 1, 1);
    }
    for (let xi = 0; xi < innerW; xi += 6) {
      const x = padX + xi;
      plot(tier, char, cols, rows, x, padY + bandH * i, 1, 1);
    }
  }
  const fpY = padY + bandH * 3 + bandH * 0.5;
  const sweep = ((t * 0.4) % 1) * innerW;
  for (let xi = 0; xi < innerW; xi++) {
    const x = padX + xi;
    let bit = 0;
    for (let i = 0; i < channels.length; i++) {
      bit ^= Math.sin(xi * channels[i]!.freq * 1.7 + i * 1.7) > 0 ? 1 : 0;
    }
    const known = xi <= sweep;
    plot(tier, char, cols, rows, x, fpY, known ? 4 : 1, bit as 0 | 1);
  }
  for (let xi = 0; xi < innerW; xi += 4) {
    plot(tier, char, cols, rows, padX + xi, padY + bandH * 3, 2, 1);
  }
  for (let dy = 0; dy < bandH * 0.4; dy += 0.5) {
    plot(tier, char, cols, rows, padX + sweep, fpY - dy, 4, 0);
    plot(tier, char, cols, rows, padX + sweep, fpY + dy, 4, 0);
  }
};

const circuitRender: SceneRender = (cols, rows, tier, char, t) => {
  const margin = 4;
  const span = cols - margin * 2 - 6;
  const cy = (rows - 1) / 2;
  const yA = cy - 4;
  const yX = cy;
  const yB = cy + 4;
  let weight = 0;
  for (let i = 0; i < span; i++) {
    const x = margin + i;
    const a = hash(i * 7 + 31) > 0.5 ? 1 : 0;
    const drift = i < span * 0.84 ? a : (hash(i * 11 + 47 + Math.floor(t)) > 0.5 ? 1 : 0);
    const b = drift;
    const xor = a ^ b;
    if (xor) weight++;
    plot(tier, char, cols, rows, x, yA - 1, 1, 1);
    plot(tier, char, cols, rows, x, yB + 1, 1, 1);
    plot(tier, char, cols, rows, x, yA, 3, a as 0 | 1);
    plot(tier, char, cols, rows, x, yB, 3, b as 0 | 1);
    if (xor) {
      const breathe = 0.7 + 0.3 * Math.sin(t * 3 + i * 0.3);
      plot(tier, char, cols, rows, x, yX, tierFromT(breathe), 1);
      plot(tier, char, cols, rows, x, yA + 1, 2, 1);
      plot(tier, char, cols, rows, x, yB - 1, 2, 1);
    } else {
      plot(tier, char, cols, rows, x, yX, 1, 0);
    }
  }
  const sumX = cols - 5;
  const threshold = Math.floor(span * 0.18);
  const filled = Math.min(1, weight / threshold);
  for (let dy = -3; dy <= 3; dy++) {
    plot(tier, char, cols, rows, sumX - 1, cy + dy, 2, 1);
    plot(tier, char, cols, rows, sumX + 3, cy + dy, 2, 1);
  }
  for (let dy = -2; dy <= 2; dy++) {
    const localFill = (3 + dy) / 5;
    const lit = localFill <= filled;
    plot(tier, char, cols, rows, sumX, cy - dy, lit ? 4 : 1, lit ? 0 : 1);
    plot(tier, char, cols, rows, sumX + 1, cy - dy, lit ? 4 : 1, lit ? 0 : 1);
    plot(tier, char, cols, rows, sumX + 2, cy - dy, lit ? 4 : 1, lit ? 0 : 1);
  }
  const passing = weight < threshold;
  for (let dx = -3; dx <= 3; dx++) {
    plot(tier, char, cols, rows, sumX + 1, cy - 4, passing ? 3 : 1, 1);
    plot(tier, char, cols, rows, sumX + 1, cy + 4, passing ? 3 : 1, 1);
  }
};

const triadRender: SceneRender = (cols, rows, tier, char, t) => {
  const padY = 2;
  const innerH = rows - padY * 2;
  const colW = (cols - 4) / 3;
  const blockH = innerH * 0.6;
  const blockY0 = padY + (innerH - blockH) / 2;
  const blockY1 = blockY0 + blockH;
  const cy = (blockY0 + blockY1) / 2;
  const centers: number[] = [];
  for (let i = 0; i < 3; i++) {
    const cx = 2 + colW * (i + 0.5);
    centers.push(cx);
    const w = Math.floor(colW * 0.65);
    const halfW = Math.floor(w / 2);
    for (let dy = 0; dy <= blockH; dy++) {
      const y = blockY0 + dy;
      plot(tier, char, cols, rows, cx - halfW, y, 3, 1);
      plot(tier, char, cols, rows, cx + halfW, y, 3, 1);
    }
    for (let dx = -halfW; dx <= halfW; dx++) {
      plot(tier, char, cols, rows, cx + dx, blockY0, 3, 1);
      plot(tier, char, cols, rows, cx + dx, blockY1, 3, 1);
    }
    const inner = halfW - 1;
    for (let dy = 1; dy < blockH; dy++) {
      for (let dx = -inner; dx <= inner; dx++) {
        const cell = (dx + dy + i + Math.floor(t * 1.5 + i * 0.4)) * 17;
        const mod = ((cell % 11) + 11) % 11;
        if (mod < 3) {
          const v = mod === 0 ? 4 : 2;
          plot(tier, char, cols, rows, cx + dx, blockY0 + dy, v, mod === 0 ? 0 : 1);
        }
      }
    }
    const tag = (Math.floor(t * 1.2) + i) % 3;
    if (tag === i % 3) {
      const blink = Math.floor(t * 4) & 1;
      plot(tier, char, cols, rows, cx, blockY0 - 1, blink ? 4 : 3, 0);
    }
  }
  for (let i = 0; i < 2; i++) {
    const a = centers[i]!;
    const b = centers[i + 1]!;
    const halfW = Math.floor(colW * 0.65 / 2);
    const fromX = a + halfW + 1;
    const toX = b - halfW - 1;
    for (let xi = fromX; xi <= toX; xi++) {
      plot(tier, char, cols, rows, xi, cy, 1, 1);
    }
    plot(tier, char, cols, rows, toX, cy - 1, 2, 1);
    plot(tier, char, cols, rows, toX, cy + 1, 2, 1);
    plot(tier, char, cols, rows, toX - 1, cy, 2, 1);
    const phase = (t * 0.7 + i * 0.4) % 1.4;
    if (phase < 1) {
      const px = fromX + (toX - fromX) * phase;
      plot(tier, char, cols, rows, px, cy, 4, 0);
      plot(tier, char, cols, rows, px - 1, cy, 3, 0);
    }
  }
};

const relayRender: SceneRender = (cols, rows, tier, char, t) => {
  const padX = 3;
  const innerW = cols - padX * 2;
  const yClient = 3;
  const yExec = (rows - 1) / 2;
  const yChain = rows - 4;
  const exX = (cols - 1) / 2;
  const clients = 5;
  for (let i = 0; i < clients; i++) {
    const cx = padX + (innerW / (clients - 1)) * i;
    plot(tier, char, cols, rows, cx, yClient, 3, 1);
    plot(tier, char, cols, rows, cx - 1, yClient, 2, 1);
    plot(tier, char, cols, rows, cx + 1, yClient, 2, 1);
    plot(tier, char, cols, rows, cx, yClient - 1, 1, 1);
    plot(tier, char, cols, rows, cx, yClient + 1, 1, 1);
    const phase = (t * 0.6 + i * 0.18) % 2.2;
    if (phase < 1) {
      const ease = phase * phase;
      const px = cx + (exX - cx) * ease;
      const py = yClient + (yExec - yClient) * ease;
      plot(tier, char, cols, rows, px, py, 4, 0);
      plot(tier, char, cols, rows, px, py - 0.5, 2, 1);
    }
  }
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const w = 3 - Math.abs(dy);
      if (Math.abs(dx) > w) continue;
      const isEdge = Math.abs(dx) === w || dy === -1 || dy === 1;
      const v = isEdge ? 3 : (dx === 0 && dy === 0 ? 4 : 2);
      plot(tier, char, cols, rows, exX + dx, yExec + dy, v, dx === 0 && dy === 0 ? 0 : 1);
    }
  }
  const breathing = 0.5 + 0.5 * Math.sin(t * 2.4);
  for (let r = 4; r < 7; r += 0.5) {
    plotCircle(tier, char, cols, rows, exX, yExec, r, r * 0.5, breathing > 0.7 ? 2 : 1, 1, 0.18);
  }
  const blocks = 9;
  for (let i = 0; i < blocks; i++) {
    const bx = padX + (innerW / (blocks - 1)) * i;
    for (let dx = -1; dx <= 1; dx++) {
      plot(tier, char, cols, rows, bx + dx, yChain, 3, 1);
      plot(tier, char, cols, rows, bx + dx, yChain - 1, 2, 1);
      plot(tier, char, cols, rows, bx + dx, yChain + 1, 2, 1);
    }
    if (i < blocks - 1) {
      plot(tier, char, cols, rows, bx + 2, yChain, 1, 1);
      plot(tier, char, cols, rows, bx + 3, yChain, 1, 1);
    }
  }
  for (let i = 0; i < 3; i++) {
    const phase = (t * 0.55 + i * 0.42) % 2;
    if (phase >= 1) continue;
    const ease = phase * phase;
    const targetIdx = (Math.floor(t * 0.6) + i * 3) % blocks;
    const targetX = padX + (innerW / (blocks - 1)) * targetIdx;
    const px = exX + (targetX - exX) * ease;
    const py = yExec + (yChain - yExec) * ease;
    plot(tier, char, cols, rows, px, py, 4, 0);
  }
};

const shieldRender: SceneRender = (cols, rows, tier, char, t) => {
  const padX = 3;
  const padY = 2;
  const gw = 12;
  const gh = 11;
  const cellW = (cols - padX * 2) / gw;
  const cellH = (rows - padY * 2) / gh;
  const sweepCol = ((t * 0.45) % 1) * gw;
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const idx = gy * gw + gx;
      if (idx >= 134) continue;
      const seed = gx * 31 + gy * 17;
      const cx = padX + gx * cellW + cellW / 2;
      const cy = padY + gy * cellH + cellH / 2;
      const baseLevel = 0.3 + 0.4 * hash(seed);
      const oscillation = 0.5 + 0.5 * Math.sin(t * 0.8 + seed * 0.13);
      const sweepDist = Math.abs(gx - sweepCol);
      const sweepBoost = sweepDist < 0.8 ? 0.4 : sweepDist < 2 ? 0.15 : 0;
      const isAnomaly = hash(seed) > 0.92;
      const level = isAnomaly && sweepDist < 1.2
        ? 1
        : baseLevel + oscillation * 0.15 + sweepBoost;
      const v = tierFromT(level);
      const ch: 0 | 1 = isAnomaly && sweepDist < 1.2 ? 0 : (hash(seed * 3) > 0.5 ? 1 : 0);
      plot(tier, char, cols, rows, cx, cy, v, ch);
      if (cellW > 2.4) {
        plot(tier, char, cols, rows, cx - 0.7, cy, Math.max(1, v - 1), ch);
        plot(tier, char, cols, rows, cx + 0.7, cy, Math.max(1, v - 1), ch);
      }
    }
  }
  const sweepX = padX + sweepCol * cellW + cellW / 2;
  for (let r = padY; r < rows - padY; r++) {
    const flicker = (Math.floor(t * 6) + r) & 1;
    plot(tier, char, cols, rows, sweepX, r, flicker ? 4 : 3, flicker ? 0 : 1);
  }
  for (let gx = 0; gx < gw; gx++) {
    plot(tier, char, cols, rows, padX + gx * cellW + cellW / 2, padY - 1, 1, 1);
    plot(tier, char, cols, rows, padX + gx * cellW + cellW / 2, rows - padY, 1, 1);
  }
};

const airdropRender: SceneRender = (cols, rows, tier, char, t) => {
  const gateX = cols * 0.66;
  const cy = (rows - 1) / 2;
  for (let i = 0; i < 280; i++) {
    const seed = i * 17 + 9;
    const lane = hash(seed);
    const y = lane * (rows - 1);
    const speed = 0.45 + 0.3 * hash(seed + 5);
    const phase = (t * speed + hash(seed + 11)) % 1.6;
    const trust = hash(seed + 19);
    const eligible = trust > 0.82;
    const fadeStart = eligible ? cols : gateX - 1 + (hash(seed + 23) - 0.5) * 1.5;
    const x = phase * fadeStart;
    if (x > fadeStart || x < 0) continue;
    let v: number;
    if (eligible) {
      v = x < gateX ? tierFromT(0.4 + phase * 0.4) : tierFromT(0.85);
    } else {
      const distToGate = (gateX - x) / gateX;
      v = tierFromT(Math.max(0.1, distToGate * 0.5));
    }
    plot(tier, char, cols, rows, x, y, v, eligible && x > gateX ? 0 : 1);
  }
  for (let r = 0; r < rows; r++) {
    if ((r + Math.floor(t * 3)) % 3 === 0) {
      plot(tier, char, cols, rows, gateX, r, 2, 1);
    } else {
      plot(tier, char, cols, rows, gateX, r, 1, 1);
    }
  }
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  for (let dy = -1; dy <= 1; dy++) {
    plot(tier, char, cols, rows, gateX + 1, cy + dy * 4, tierFromT(0.5 + pulse * 0.4), 0);
  }
};

const voteRender: SceneRender = (cols, rows, tier, char, t) => {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  for (let i = 0; i < 160; i++) {
    const seed = i * 23 + 13;
    const baseX = hash(seed) * (cols - 4) + 2;
    const baseY = hash(seed + 7) * (rows - 4) + 2;
    const cycle = 3.2;
    const phase = (t / cycle + hash(seed + 13)) % 1;
    let x: number, y: number, v: number;
    if (phase < 0.45) {
      x = baseX;
      y = baseY;
      v = 1;
    } else if (phase < 0.65) {
      const ease = (phase - 0.45) / 0.2;
      const e = ease * ease;
      x = baseX + (cx - baseX) * e;
      y = baseY + (cy - baseY) * e;
      v = tierFromT(0.3 + ease * 0.5);
    } else if (phase < 0.85) {
      x = cx + (hash(seed + 19) - 0.5) * 0.5;
      y = cy + (hash(seed + 23) - 0.5) * 0.5;
      v = 4;
    } else {
      const ease = (phase - 0.85) / 0.15;
      x = cx;
      y = cy;
      v = tierFromT(1 - ease);
    }
    plot(tier, char, cols, rows, x, y, v, hash(seed + 29) > 0.5 ? 1 : 0);
  }
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.9);
  for (let dr = 0; dr <= 3; dr += 0.4) {
    plotCircle(tier, char, cols, rows, cx, cy, dr, dr * 0.5, dr < 1 ? 4 : tierFromT(0.5 + pulse * 0.3 - dr * 0.1), 0, 0.3);
  }
};

const mintRender: SceneRender = (cols, rows, tier, char, t) => {
  const LANES = 6;
  const finishX = cols * 0.86;
  const startX = cols * 0.06;
  for (let lane = 0; lane < LANES; lane++) {
    const y = (rows - 1) * (0.1 + lane * (0.8 / (LANES - 1)));
    for (let i = 0; i < cols - 4; i += 2) {
      plot(tier, char, cols, rows, i + 2, y, 1, 1);
    }
    const racers = 4;
    for (let r = 0; r < racers; r++) {
      const seed = lane * 100 + r * 17;
      const speed = 0.35 + 0.4 * hash(seed);
      const phase = (t * speed + hash(seed + 9)) % 1.5;
      if (phase > 1) continue;
      const x = startX + phase * (finishX - startX);
      const isLeader = r === 0 && hash(lane + 7) > 0.6;
      const v = isLeader ? 4 : tierFromT(0.4 + phase * 0.5);
      plot(tier, char, cols, rows, x, y, v, isLeader ? 0 : 1);
      plot(tier, char, cols, rows, x - 1, y, Math.max(1, v - 2), 1);
    }
  }
  for (let r = 0; r < rows; r++) {
    plot(tier, char, cols, rows, finishX, r, 3, r & 1 ? 1 : 0);
  }
  for (let r = 0; r < rows; r++) {
    plot(tier, char, cols, rows, startX, r, 1, 1);
  }
};

const creatorRender: SceneRender = (cols, rows, tier, char, t) => {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const rOuter = Math.min(cols * 0.32, rows * 0.42);
  const rInner = rOuter * 0.55;
  for (let a = 0; a < TWO_PI; a += 0.025) {
    const r1 = rOuter;
    const r2 = rOuter * 0.94;
    plot(tier, char, cols, rows, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 0.55, 3, 1);
    plot(tier, char, cols, rows, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2 * 0.55, 2, 1);
  }
  const ticks = 32;
  for (let i = 0; i < ticks; i++) {
    const a = (i * TWO_PI) / ticks + t * 0.4;
    const rt = rOuter * 0.78;
    const v = (i + Math.floor(t * 3)) % 4 === 0 ? 4 : 2;
    plot(
      tier,
      char,
      cols,
      rows,
      cx + Math.cos(a) * rt,
      cy + Math.sin(a) * rt * 0.55,
      v,
      v === 4 ? 0 : 1
    );
  }
  for (let a = 0; a < TWO_PI; a += 0.06) {
    plot(tier, char, cols, rows, cx + Math.cos(a) * rInner, cy + Math.sin(a) * rInner * 0.55, 2, 1);
  }
  const stamp = 0.5 + 0.5 * Math.sin(t * 1.2);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy * 4);
      if (d < 2.5) {
        plot(tier, char, cols, rows, cx + dx, cy + dy, d < 0.6 ? 4 : tierFromT(0.5 + stamp * 0.4 - d * 0.1), 0);
      }
    }
  }
  const hashLen = 12;
  for (let i = 0; i < hashLen; i++) {
    const seed = i + Math.floor(t * 0.8);
    const x = cx - hashLen / 2 + i;
    const y = cy + Math.floor(rOuter * 0.55) + 2;
    plot(tier, char, cols, rows, x, y, 2, hash(seed) > 0.5 ? 1 : 0);
  }
};

const botRender: SceneRender = (cols, rows, tier, char, t) => {
  const split = Math.floor(rows / 2);
  for (let r = 0; r < split; r++) {
    for (let c = 0; c < cols; c++) {
      const grid = (c + r * 2) % 5 === 0;
      const sweep = (Math.floor(t * 8) + c) % 12 < 2;
      const v = sweep ? 3 : grid ? 2 : 1;
      plot(tier, char, cols, rows, c, r, v, (c + r) & 1 ? 1 : 0);
    }
  }
  for (let r = split + 1; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const seed = c * 41 + r * 67;
      const noise = hash(seed + Math.floor(t * 1.3));
      const wave = 0.5 + 0.5 * Math.sin((c + t * 6) * 0.18 + r * 0.3);
      const intensity = noise * 0.6 + wave * 0.4;
      if (intensity < 0.35) continue;
      plot(tier, char, cols, rows, c, r, tierFromT(intensity), hash(seed + 3) > 0.5 ? 1 : 0);
    }
  }
  for (let c = 0; c < cols; c++) {
    plot(tier, char, cols, rows, c, split, 4, c & 1 ? 0 : 1);
  }
};

const dataFlowRender: SceneRender = (cols, rows, tier, char, t) => {
  const cy = (rows - 1) / 2;
  for (let i = 0; i < 700; i++) {
    const seed = i * 19 + 3;
    const phase = (t * (0.5 + 0.3 * hash(seed)) + hash(seed + 7)) % 1.4;
    if (phase > 1) continue;
    const startWidth = (rows - 1) * 0.45;
    const endWidth = 1;
    const width = startWidth + (endWidth - startWidth) * phase;
    const yOffset = (hash(seed + 11) - 0.5) * 2 * width;
    const x = phase * (cols - 4) + 2;
    const y = cy + yOffset;
    const inFunnel = Math.abs(yOffset) <= width;
    if (!inFunnel) continue;
    const v = tierFromT(0.4 + phase * 0.5);
    plot(tier, char, cols, rows, x, y, v, hash(seed + 13) > 0.5 ? 1 : 0);
  }
  for (let x = 2; x < cols - 2; x++) {
    const phase = (x - 2) / (cols - 4);
    const w = (rows - 1) * 0.5 * (1 - phase) + 1;
    plot(tier, char, cols, rows, x, cy - w, 2, 1);
    plot(tier, char, cols, rows, x, cy + w, 2, 1);
  }
  const proofPulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  for (let dy = -1; dy <= 1; dy++) {
    plot(tier, char, cols, rows, cols - 3, cy + dy, dy === 0 ? 4 : tierFromT(0.5 + proofPulse * 0.4), 0);
  }
};

const walletFlowRender: SceneRender = (cols, rows, tier, char, t) => {
  const cy = (rows - 1) / 2;
  const anchorX = cols * 0.32;
  const scoreStart = cols * 0.5;
  const scoreEnd = cols * 0.92;
  plotCircle(tier, char, cols, rows, anchorX, cy, 4, 2.2, 3, 1);
  plotCircle(tier, char, cols, rows, anchorX, cy, 2.2, 1.2, 4, 0);
  plot(tier, char, cols, rows, anchorX, cy, 4, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i * TWO_PI) / 12 + t * 0.35;
    const r = 6 + 0.6 * Math.sin(t * 1.4 + i);
    plot(tier, char, cols, rows, anchorX + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, 2, 1);
  }
  const fill = 0.5 + 0.5 * Math.sin(t * 0.5);
  const filled = scoreStart + (scoreEnd - scoreStart) * fill;
  for (let dy = -1; dy <= 1; dy++) {
    for (let x = scoreStart; x < scoreEnd; x++) {
      const isFilled = x < filled;
      plot(tier, char, cols, rows, x, cy + dy, isFilled ? (dy === 0 ? 4 : 3) : 1, isFilled ? 0 : 1);
    }
  }
  for (let r = 0; r < 4; r++) {
    plot(tier, char, cols, rows, scoreStart - 1 + Math.floor(t * 8) % 8, cy + r - 1, 2, 1);
  }
};

const walletlessFlowRender: SceneRender = (cols, rows, tier, char, t) => {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const rOuter = Math.min(cols * 0.28, rows * 0.4);
  for (let a = 0; a < TWO_PI; a += 0.04) {
    const flick = (a + t * 0.5) % 0.6 < 0.06 ? 4 : 2;
    plot(tier, char, cols, rows, cx + Math.cos(a) * rOuter, cy + Math.sin(a) * rOuter * 0.55, flick, flick === 4 ? 0 : 1);
  }
  for (let i = 0; i < 90; i++) {
    const seed = i * 29 + 7;
    const a = hash(seed) * TWO_PI;
    const radius = hash(seed + 11) * rOuter * 0.85;
    const lifeCycle = 2.5;
    const phase = ((t + hash(seed + 19) * lifeCycle) % lifeCycle) / lifeCycle;
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius * 0.55;
    const v = tierFromT(phase < 0.5 ? phase * 2 : (1 - phase) * 2);
    plot(tier, char, cols, rows, x, y, v, hash(seed + 23) > 0.5 ? 1 : 0);
  }
  const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy * 4);
      if (d < 2.4) {
        plot(tier, char, cols, rows, cx + dx, cy + dy, d < 0.6 ? 4 : tierFromT(0.5 + pulse * 0.3 - d * 0.15), 0);
      }
    }
  }
};

const solvedRender: SceneRender = (cols, rows, tier, char, t) => {
  const tilesX = 5;
  const tilesY = 4;
  const tileW = (cols - 4) / tilesX;
  const tileH = (rows - 4) / tilesY;
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const seed = tx * 31 + ty * 17;
      const solved = hash(seed) > 0.18;
      const x0 = 2 + tx * tileW;
      const y0 = 2 + ty * tileH;
      const cxT = x0 + tileW / 2;
      const cyT = y0 + tileH / 2;
      const baseV = solved ? 1 : 2;
      for (let dy = 0; dy < tileH - 1; dy++) {
        for (let dx = 0; dx < tileW - 1; dx++) {
          if ((dx + dy) % 3 !== 0) continue;
          plot(tier, char, cols, rows, x0 + dx, y0 + dy, baseV, hash(seed + dx + dy * 3) > 0.5 ? 1 : 0);
        }
      }
      if (solved) {
        const r = Math.min(tileW, tileH * 2) * 0.32;
        for (let s = -r; s <= r; s += 0.5) {
          plot(tier, char, cols, rows, cxT + s, cyT + s * 0.5, 4, 0);
          plot(tier, char, cols, rows, cxT + s, cyT - s * 0.5, 4, 0);
        }
      } else {
        const blink = Math.floor(t * 2 + seed) & 1;
        const v = blink ? 4 : 3;
        plot(tier, char, cols, rows, cxT, cyT, v, blink ? 1 : 0);
        plot(tier, char, cols, rows, cxT - 1, cyT, v - 1, 1);
        plot(tier, char, cols, rows, cxT + 1, cyT, v - 1, 1);
      }
    }
  }
};

const frontierRender: SceneRender = (cols, rows, tier, char, t) => {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const sweep = (t * 0.6) % TWO_PI;
  const beamHalf = 0.35;
  for (let r = 1; r < Math.min(cols, rows * 2) / 2; r += 1) {
    plotCircle(tier, char, cols, rows, cx, cy, r, r * 0.5, 1, 1, 0.04);
  }
  for (let a = 0; a < TWO_PI; a += 0.03) {
    let dist = a - sweep;
    while (dist > Math.PI) dist -= TWO_PI;
    while (dist < -Math.PI) dist += TWO_PI;
    const inBeam = Math.abs(dist) < beamHalf;
    if (!inBeam) continue;
    const intensity = 1 - Math.abs(dist) / beamHalf;
    for (let r = 1; r < Math.min(cols, rows * 2) / 2; r += 1) {
      const v = tierFromT(0.3 + intensity * 0.6);
      plot(tier, char, cols, rows, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5, v, 1);
    }
  }
  const blips = 7;
  for (let i = 0; i < blips; i++) {
    const seed = i * 37 + 11;
    const a = hash(seed) * TWO_PI;
    const r = (0.3 + hash(seed + 7) * 0.6) * Math.min(cols, rows * 2) / 2;
    let dist = a - sweep;
    while (dist > Math.PI) dist -= TWO_PI;
    while (dist < -Math.PI) dist += TWO_PI;
    const detected = Math.abs(dist) < 0.6;
    const v = detected ? 4 : tierFromT(0.3 + (1 - Math.min(1, Math.abs(dist))) * 0.4);
    plot(tier, char, cols, rows, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.5, v, detected ? 0 : 1);
  }
  plot(tier, char, cols, rows, cx, cy, 4, 0);
  plot(tier, char, cols, rows, cx + Math.cos(sweep) * 2, cy + Math.sin(sweep) * 1, 4, 0);
};

interface SceneProps {
  label?: string;
  aspect?: string;
  className?: string;
  fill?: boolean;
  fit?: boolean;
}

export function AsciiSDKScene(p: SceneProps) {
  return <AsciiScene cols={80} rows={24} render={sdkRender} {...p} />;
}

export function AsciiCircuitScene(p: SceneProps) {
  return <AsciiScene cols={80} rows={24} render={circuitRender} {...p} />;
}

export function AsciiTriadScene(p: SceneProps) {
  return <AsciiScene cols={80} rows={24} render={triadRender} {...p} />;
}

export function AsciiRelayScene(p: SceneProps) {
  return <AsciiScene cols={80} rows={24} render={relayRender} {...p} />;
}

export function AsciiShieldScene(p: SceneProps) {
  return <AsciiScene cols={80} rows={24} render={shieldRender} {...p} />;
}

export function AsciiAirdropScene(p: SceneProps) {
  return <AsciiScene cols={50} rows={32} render={airdropRender} {...p} />;
}

export function AsciiVoteScene(p: SceneProps) {
  return <AsciiScene cols={50} rows={32} render={voteRender} {...p} />;
}

export function AsciiMintScene(p: SceneProps) {
  return <AsciiScene cols={50} rows={32} render={mintRender} {...p} />;
}

export function AsciiCreatorScene(p: SceneProps) {
  return <AsciiScene cols={50} rows={32} render={creatorRender} {...p} />;
}

export function AsciiBotScene(p: SceneProps) {
  return <AsciiScene cols={50} rows={32} render={botRender} {...p} />;
}

export function AsciiDataFlowScene(p: SceneProps) {
  return <AsciiScene cols={50} rows={32} render={dataFlowRender} {...p} />;
}

export function AsciiWalletFlowScene(p: SceneProps) {
  return <AsciiScene cols={80} rows={25} render={walletFlowRender} {...p} />;
}

export function AsciiWalletlessFlowScene(p: SceneProps) {
  return <AsciiScene cols={80} rows={25} render={walletlessFlowRender} {...p} />;
}

export function AsciiSolvedScene(p: SceneProps) {
  return <AsciiScene cols={50} rows={32} render={solvedRender} {...p} />;
}

export function AsciiFrontierScene(p: SceneProps) {
  return <AsciiScene cols={50} rows={32} render={frontierRender} {...p} />;
}
