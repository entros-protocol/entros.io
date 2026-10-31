import { describe, expect, it } from "vitest";
import {
  DEPTH,
  FLOOR_DROP,
  FLOOR_REACH,
  LENGTH,
  PEAK,
  REST,
  STATURE,
  cellShade,
  echoLines,
  extrusionLines,
  headCells,
  layoutHead,
  outline,
  plausibleShade,
  reflectionCells,
  riseAt,
  shadeAt,
  type ShadeMap,
} from "../src/lib/head-layout";

const CELL_W = 5.4;
const ROW_H = 10;

// Hero bands measured in the browser, as [viewport, band width, band height].
const WIDE: [string, number, number][] = [
  ["1512x855 laptop", 1439.4, 482.6],
  ["1280x800", 1218.5, 427.6],
  ["1440x900", 1370.9, 527.6],
  ["1920x1080", 1720, 707.6],
  ["2560x1440", 1720, 1067.6],
  ["1024x768 tablet", 974.8, 333.2],
  ["844x390 phone on its side", 800, 220],
];
const TALL: [string, number, number][] = [
  ["360x800", 316, 351.5],
  ["390x844", 346, 395.5],
  ["430x932", 386, 483.5],
  ["768x1024", 724, 600.9],
  ["820x1180", 776, 756.9],
  ["1024x1366", 974.8, 931.2],
];
// Phones as a browser shows them with its toolbars out, where the band sits
// at or near its 220 px minimum.
const SHORT: [string, number, number][] = [
  ["390x664", 346, 220],
  ["375x548", 331, 220],
  ["360x640", 316, 220],
  ["430x740", 386, 291.5],
];
const STACKED = [...TALL, ...SHORT];

/** The digit cell a band uses: phones set smaller digits. */
const grid = (width: number): [number, number] => (width < 520 ? [4.2, 8] : [CELL_W, ROW_H]);

describe("head outline", () => {
  it("passes through the measured points and is zero off the head", () => {
    expect(outline(109.5)).toBeCloseTo(45, 3);
    expect(outline(49.5)).toBeCloseTo(18.2, 3);
    expect(outline(148.5)).toBeCloseTo(27.4, 3);
    for (const d of [-1, 0, LENGTH, LENGTH + 1]) expect(outline(d)).toBe(0);
  });
});

describe("layoutHead", () => {
  it.each(WIDE)("lays the head on the floor in a wide band (%s)", (_, width, height) => {
    const head = layoutHead(width, height);
    expect(head.mode).toBe("floor");
    expect(head.floor).toBe(height - 1);
    expect(DEPTH * PEAK * head.out).toBeLessThan(height);
    // The face is never cut, only the crown.
    expect(head.crown + LENGTH * head.along).toBeLessThanOrEqual(width);
  });

  it("keeps the laptop size on the laptop", () => {
    const head = layoutHead(1439.4, 482.6);
    expect(head.along).toBeCloseTo(STATURE, 2);
    expect(head.crown).toBeGreaterThanOrEqual(0);
  });

  it("crops the crown, not the face, in a band too narrow for the whole head", () => {
    const head = layoutHead(1218.5, 427.6);
    expect(head.crown).toBeLessThan(0);
    expect(head.crown + LENGTH * head.along).toBeCloseTo(1218.5 * 0.96, 6);
  });

  it.each(TALL)("shows the whole head near the top of a tall band (%s)", (_, width, height) => {
    const head = layoutHead(width, height);
    expect(head.mode).toBe("stack");
    expect(head.crown).toBeGreaterThan(0);
    expect(head.crown + LENGTH * head.along).toBeLessThan(width);
    expect(head.floor - DEPTH * PEAK * head.out).toBeGreaterThan(0);
    expect(head.floor).toBeLessThan(height / 2);
  });

  it.each(SHORT)("shows the whole head on a phone however short the band (%s)", (_, width, height) => {
    const head = layoutHead(width, height);
    expect(head.mode).toBe("stack");
    expect(head.crown).toBeGreaterThan(0);
    expect(head.crown + LENGTH * head.along).toBeLessThan(width);
    expect(head.floor - DEPTH * PEAK * head.out).toBeGreaterThan(0);
    // Room is left under the head for its underlay.
    expect(height - head.floor).toBeGreaterThan(80);
  });
});

describe("headCells", () => {
  it("fills a lying head under its line, with one edge cell per column", () => {
    const [width, height] = [1439.4, 482.6];
    const head = layoutHead(width, height);
    const cells = headCells(head, width, CELL_W, ROW_H);
    expect(cells.count).toBeGreaterThan(5000);
    const columns = new Set<number>();
    let edges = 0;
    for (let i = 0; i < cells.count; i++) {
      const x = cells.x[i]!;
      const v = head.floor - cells.y[i]!;
      const low = Math.min(
        riseAt(head, REST, x - CELL_W / 2),
        riseAt(head, REST, x),
        riseAt(head, REST, x + CELL_W / 2),
      );
      expect(v).toBeGreaterThan(0);
      expect(v + ROW_H / 2).toBeLessThanOrEqual(low - 2 + 1e-3);
      expect(cells.h[i]).toBeCloseTo(v / head.out, 4);
      expect(cells.d[i]).toBeCloseTo((x - head.crown) / head.along, 3);
      columns.add(x);
      edges += cells.edge[i]!;
    }
    expect(edges).toBe(columns.size);
  });

  it("keeps a phone's digits inside its head, above the floor", () => {
    const width = 346;
    const head = layoutHead(width, 475.5);
    const cells = headCells(head, width, 4.2, 8);
    expect(cells.count).toBeGreaterThan(300);
    for (let i = 0; i < cells.count; i++) expect(cells.y[i]).toBeLessThan(head.floor);
  });
});

describe("echoLines", () => {
  it.each(WIDE)("leaves a wide band without echoes (%s)", (_, width, height) => {
    expect(echoLines(layoutHead(width, height), height)).toEqual([]);
  });

  it.each(STACKED)("stacks echoes that never cross and fade out before the bottom edge (%s)", (_, width, height) => {
    const head = layoutHead(width, height);
    const echoes = echoLines(head, height);
    expect(echoes.length).toBeGreaterThan(5);
    const step = echoes[0]!.base - head.floor;
    const chin = head.crown + LENGTH * head.along;
    let above = (x: number) => head.floor - riseAt(head, REST, x);
    for (const [k, e] of echoes.entries()) {
      expect(e.base).toBeCloseTo(head.floor + (k + 1) * step, 6);
      expect(e.base).toBeLessThan(height);
      if (k > 0) {
        expect(e.curve.amp).toBeLessThan(echoes[k - 1]!.curve.amp);
        expect(e.alpha).toBeLessThan(echoes[k - 1]!.alpha);
      }
      const y = (x: number) => e.base - riseAt(head, e.curve, x);
      for (let x = head.crown; x <= chin; x += 0.5) expect(y(x) - above(x)).toBeGreaterThan(step * 0.7);
      above = y;
    }
    const last = echoes[echoes.length - 1]!;
    expect(last.alpha).toBeLessThan(0.02);
    expect(last.base).toBeGreaterThan(height - 8 - step);
  });
});

describe("extrusionLines", () => {
  it.each(WIDE)("leaves a wide band without an extrusion (%s)", (_, width, height) => {
    expect(extrusionLines(layoutHead(width, height), height)).toEqual([]);
  });

  it.each(STACKED)("runs the profile into depth without a crossing, fading out inside the band (%s)", (_, width, height) => {
    const head = layoutHead(width, height);
    const slices = extrusionLines(head, height);
    expect(slices.length).toBeGreaterThan(5);
    const step = slices[0]!.base - head.floor;
    const chin = head.crown + LENGTH * head.along;
    // The first slice must stay under the head's floor line.
    let above: (x: number) => number = () => head.floor;
    for (const [k, s] of slices.entries()) {
      expect(s.base).toBeCloseTo(head.floor + (k + 1) * step, 6);
      expect(s.curve.shift).toBe(REST.shift);
      if (k > 0) {
        expect(s.curve.amp).toBeGreaterThan(slices[k - 1]!.curve.amp);
        expect(s.alpha).toBeLessThan(slices[k - 1]!.alpha);
      }
      const y = (x: number) => s.base - riseAt(head, s.curve, x);
      for (let x = head.crown; x <= chin; x += 0.5) expect(y(x) - above(x)).toBeGreaterThan(step * 0.3);
      above = y;
    }
    const last = slices[slices.length - 1]!;
    expect(last.base).toBeLessThan(height);
    expect(last.alpha).toBeLessThan(0.1);
    expect(last.curve.amp).toBeLessThanOrEqual(0.75 + 1e-9);
  });
});

describe("reflectionCells", () => {
  it.each(WIDE)("hangs a lying head's reflection below the band, within its reach (%s)", (_, width, height) => {
    const head = layoutHead(width, height);
    const cells = headCells(head, width, CELL_W, ROW_H);
    const mirror = reflectionCells(head, width, height, CELL_W, ROW_H);
    expect(mirror.count).toBeGreaterThan(100);
    expect(mirror.stretch).toBeGreaterThan(0);
    expect(mirror.stretch).toBeLessThanOrEqual(1);
    let deepest = 0;
    let under = 0;
    for (let i = 0; i < mirror.count; i++) {
      const x = mirror.x[i]!;
      const v = mirror.y[i]! - head.floor - FLOOR_DROP;
      // Wholly past the band's bottom edge, and no deeper than its reach,
      // to the precision of the Float32 centres.
      expect(mirror.y[i]! - ROW_H / 2).toBeGreaterThanOrEqual(height - 1e-3);
      expect(mirror.y[i]! - head.floor + ROW_H / 2).toBeLessThanOrEqual(FLOOR_REACH + 1e-3);
      // On the head's grid, even where the bars run on past its digits.
      const lane = (x - cells.x[0]!) / CELL_W;
      expect(Math.abs(lane - Math.round(lane))).toBeLessThan(1e-3);
      expect(mirror.d[i]).toBeCloseTo((x - head.crown) / head.along, 3);
      expect(mirror.h[i]! * head.out * mirror.stretch).toBeCloseTo(v, 3);
      if (i > 0 && mirror.x[i - 1] === x) expect(mirror.fade[i]).toBeLessThan(mirror.fade[i - 1]!);
      if (v > deepest) {
        deepest = v;
        under = mirror.d[i]!;
      }
    }
    const bars = [...new Set(mirror.x)].sort((a, b) => a - b);
    for (let j = 1; j < bars.length; j++) expect(bars[j]! - bars[j - 1]!).toBeGreaterThan(CELL_W * 1.5);
    // Its chin ends where the head's line meets the floor, within a column.
    const foot = head.crown + LENGTH * head.along;
    expect(Math.abs(bars[bars.length - 1]! + CELL_W / 2 - foot)).toBeLessThan(CELL_W);
    // The first row's centre sits a little further below the divider, a
    // pixel under the floor, than the head's last row's centre sits above
    // it, since a digit's ink sits high in its row.
    const below = Math.min(...mirror.y) - (head.floor + 2);
    const above = head.floor + 1 - Math.max(...cells.y);
    expect(below).toBeGreaterThan(above);
    expect(below - above).toBeLessThan(ROW_H / 2);
    // Deepest under the nose, as deep as the head stands up to its reach.
    expect(Math.abs(under - 109.5)).toBeLessThan(8);
    let top = 0;
    for (let i = 0; i < cells.count; i++) top = Math.max(top, head.floor - cells.y[i]!);
    expect(deepest).toBeGreaterThan(Math.min(FLOOR_REACH - FLOOR_DROP, top) - 2 * ROW_H);
    expect(Math.min(...mirror.fade)).toBeLessThan(0.05);
  });

  it.each(STACKED)("mirrors the head in bars every other column, fading out inside the band (%s)", (_, width, height) => {
    const [cellW, rowH] = grid(width);
    const head = layoutHead(width, height);
    const cells = headCells(head, width, cellW, rowH);
    const mirror = reflectionCells(head, width, height, cellW, rowH);
    const space = height - head.floor;
    expect(mirror.count).toBeGreaterThan(100);
    expect(mirror.stretch).toBeGreaterThan(0);
    expect(mirror.stretch).toBeLessThanOrEqual(2);
    const lanes = new Set(cells.x);
    let deepest = 0;
    let under = 0;
    for (let i = 0; i < mirror.count; i++) {
      const x = mirror.x[i]!;
      const v = mirror.y[i]! - head.floor;
      expect(v).toBeGreaterThan(0);
      expect(mirror.y[i]! + rowH / 2).toBeLessThanOrEqual(height);
      expect(lanes.has(x)).toBe(true);
      // Each cell mirrors the point of its own column that lies v / stretch
      // above the floor, inside the head.
      expect(mirror.d[i]).toBeCloseTo((x - head.crown) / head.along, 3);
      expect(mirror.h[i]! * head.out * mirror.stretch).toBeCloseTo(v, 3);
      expect(mirror.h[i]! * head.out).toBeLessThan(riseAt(head, REST, x));
      if (i > 0 && mirror.x[i - 1] === x) expect(mirror.fade[i]).toBeLessThan(mirror.fade[i - 1]!);
      if (v > deepest) {
        deepest = v;
        under = mirror.d[i]!;
      }
    }
    // No two bars side by side.
    const bars = [...new Set(mirror.x)].sort((a, b) => a - b);
    for (let j = 1; j < bars.length; j++) expect(bars[j]! - bars[j - 1]!).toBeGreaterThan(cellW * 1.5);
    // Deepest under the nose, and it reaches as far as the space allows.
    expect(Math.abs(under - 109.5)).toBeLessThan(8);
    let top = 0;
    for (let i = 0; i < cells.count; i++) top = Math.max(top, head.floor - cells.y[i]!);
    expect(deepest + rowH / 2).toBeLessThanOrEqual(space * 0.85 + rowH);
    expect(deepest).toBeGreaterThan(Math.min(space * 0.85, 2 * top) - 2 * rowH);
    expect(Math.min(...mirror.fade)).toBeLessThan(0.05);
  });
});

describe("shading map reads", () => {
  // Four columns from black to white, two rows, one pixel per trace unit.
  const map: ShadeMap = { width: 4, height: 2, perUnit: 1, data: new Uint8Array([0, 85, 170, 255, 0, 85, 170, 255]) };

  it("interpolates between pixel centres and clamps at the edges", () => {
    expect(shadeAt(map, 0.5, 1)).toBe(0);
    expect(shadeAt(map, 1, 1)).toBeCloseTo(42.5 / 255, 6);
    expect(shadeAt(map, 3.5, 0.5)).toBe(1);
    expect(shadeAt(map, -10, -10)).toBe(0);
    expect(shadeAt(map, 99, 99)).toBe(1);
  });

  it("averages a cell's whole footprint", () => {
    expect(cellShade(map, 2, 1, 4, 2)).toBeCloseTo((0 + 85 + 170 + 255) / 4 / 255, 6);
  });

  it("accepts smooth pixels and rejects blank or noisy ones", () => {
    const width = 64;
    const smooth = new Uint8Array(width * 16).map((_, i) => (i % width) * 4);
    expect(plausibleShade(smooth, width)).toBe(true);
    expect(plausibleShade(new Uint8Array(width * 16).fill(255), width)).toBe(false);
    let seed = 7;
    const noise = new Uint8Array(width * 16).map(() => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % 256;
    });
    expect(plausibleShade(noise, width)).toBe(false);
  });
});
