/**
 * Geometry for the home hero's head: the outline it is drawn from, where it
 * sits in a band of a given size, the grid of digit cells that fills it, what
 * fills a tall band under it, and reads of the shading map that lights those
 * cells. Nothing here touches a canvas, so the layout can be tested on its
 * own.
 */

/**
 * The outline, measured off a reference silhouette: distance from the crown
 * along the head, then distance out from the back line, in the image's
 * pixels. The edge was smoothed over about a pixel to remove stair steps;
 * the last rows are raw, so the jaw keeps its turn down to the floor.
 */
const TRACE: readonly (readonly [number, number])[] = [
  [0, 0], [1.5, 1.8], [4.5, 3.9], [7.5, 5.8], [10.5, 7.6], [13.5, 9.1],
  [16.5, 10.5], [19.5, 11.9], [22.5, 13.1], [25.5, 14.1], [28.5, 15.0], [31.5, 15.9],
  [34.5, 16.6], [37.5, 17.2], [40.5, 17.7], [43.5, 18.0], [46.5, 18.2], [49.5, 18.2],
  [52.5, 18.1], [55.5, 18.0], [58.5, 17.8], [61.5, 17.6], [64.5, 17.4], [67.5, 17.4],
  [70.5, 17.7], [73.5, 18.3], [76.5, 19.3], [79.5, 20.6], [82.5, 22.3], [85.5, 24.3],
  [88.5, 26.7], [91.5, 29.0], [94.5, 31.6], [97.5, 34.4], [100.5, 37.3], [103.5, 40.3],
  [106.5, 43.2], [109.5, 45.0], [112.5, 44.5], [115.5, 41.3], [118.5, 36.4], [121.5, 31.9],
  [124.5, 30.0], [127.5, 29.7], [130.5, 30.5], [133.5, 32.3], [136.5, 34.7], [139.5, 35.4],
  [142.5, 33.3], [145.5, 28.6], [148.5, 27.4], [151.5, 31.0], [154.5, 33.0], [157.5, 31.8],
  [160.5, 27.9], [163.5, 25.6], [166.5, 24.5], [169.5, 24.6], [172.5, 25.3], [175.5, 26.0],
  [178.5, 26.6], [181.5, 26.9], [184.5, 26.4], [188.5, 24.6], [190.5, 23.0], [192.5, 20.0],
  [193.5, 14.7], [194.5, 3.6], [195.5, 0],
];
export const LENGTH = 195.5;
export const DEPTH = 45;
/** The tallest a line gets, as a share of DEPTH, ripple included. */
export const PEAK = 1.05;
/**
 * How far out from its floor the profile is drawn, relative to the reference
 * silhouette, and the head's size in pixels per trace unit, both as it reads
 * in a 1512 x 855 laptop viewport. The stretch never changes, so the face
 * keeps one shape.
 */
export const STRETCH = 1.43;
export const STATURE = 6.77;
/**
 * Distance from the crown where the face begins, at the forehead. Cropping
 * never reaches past it.
 */
export const FACE_FROM = 55;

// Monotone cubic tangents (Fritsch-Carlson): the outline passes smoothly
// through every measured point and never overshoots one.
const TANGENTS = (() => {
  const n = TRACE.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    d.push((TRACE[i + 1]![1] - TRACE[i]![1]) / (TRACE[i + 1]![0] - TRACE[i]![0]));
  }
  const m = TRACE.map((_, i) => (i === 0 ? d[0]! : i === n - 1 ? d[n - 2]! : (d[i - 1]! + d[i]!) / 2));
  for (let i = 0; i < n - 1; i++) {
    const di = d[i]!;
    if (di === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    if (i > 0 && Math.sign(d[i - 1]!) !== Math.sign(di)) m[i] = 0;
    const a = m[i]! / di;
    const b = m[i + 1]! / di;
    if (a < 0) m[i] = 0;
    if (b < 0) m[i + 1] = 0;
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * di;
      m[i + 1] = t * b * di;
    }
  }
  return m;
})();

function hermite(d: number): number {
  if (d <= 0 || d >= LENGTH) return 0;
  let i = 0;
  while (TRACE[i + 1]![0] < d) i++;
  const [d0, h0] = TRACE[i]!;
  const [d1, h1] = TRACE[i + 1]!;
  const span = d1 - d0;
  const t = (d - d0) / span;
  const t2 = t * t;
  const t3 = t2 * t;
  return Math.max(
    0,
    (2 * t3 - 3 * t2 + 1) * h0 +
      (t3 - 2 * t2 + t) * span * TANGENTS[i]! +
      (-2 * t3 + 3 * t2) * h1 +
      (t3 - t2) * span * TANGENTS[i + 1]!,
  );
}

// The outline is read thousands of times a layout, so it is tabulated once.
const LUT_STEP = 0.05;
const LUT = (() => {
  const out = new Float32Array(Math.ceil(LENGTH / LUT_STEP) + 2);
  for (let i = 0; i < out.length; i++) out[i] = hermite(i * LUT_STEP);
  return out;
})();

/** Height of the outline at distance d from the crown; 0 off the head. */
export function outline(d: number): number {
  if (d <= 0 || d >= LENGTH) return 0;
  const f = d / LUT_STEP;
  const i = Math.floor(f);
  return LUT[i]! + (LUT[i + 1]! - LUT[i]!) * (f - i);
}

export interface Curve {
  /** Offset along the head, in trace units. */
  shift: number;
  amp: number;
  sway: number;
}

/** The head as it is drawn. The shading map was rendered to this line. */
export const REST: Curve = { shift: 0, amp: 1, sway: 0.4 };

/** Height of a curve at distance d from the head's crown, in trace units. */
export function profile(c: Curve, d: number): number {
  const at = d - c.shift;
  const h = outline(at);
  if (h <= 0) return 0;
  // A faint ripple, scaled by height so the ends stay on the floor.
  return (h + 0.6 * Math.sin(at * 0.09 + c.sway) * (h / DEPTH)) * c.amp;
}

export interface HeadLayout {
  /**
   * "floor": the head lies face up on the band's bottom edge. "stack": the
   * whole head lies near the band's top, over its underlay.
   */
  mode: "floor" | "stack";
  /** Pixels per trace unit along the head. */
  along: number;
  /** Pixels per trace unit out from the floor. */
  out: number;
  /** x of the crown's end of the head; below 0 when the crown is cropped. */
  crown: number;
  /** y of the line the head lies on. */
  floor: number;
  /** Width of the fade where a cropped crown meets the left edge. */
  fade: number;
}

/** A band at least this tall for its width, as on a tablet held upright, gets the stack. */
const STACK_ASPECT = 0.75;
/** So does any band narrower than this, as on a phone held upright, however short. */
const STACK_BELOW = 520;
/** Share of a stack band's width the head spans, crown to chin. */
const STACK_SPAN = 0.92;
/** Room above a stack's head, for the line's glow. */
const HEADROOM = 14;

/**
 * Where the head sits in a band `width` x `height`.
 *
 * A wide band lays the head on its floor at its laptop size where the band
 * allows. A band too small for the whole head at that size keeps that size
 * and lets the crown run off the left edge, fading out, so the face stays
 * whole; only when the face itself would be cut does the head shrink,
 * evenly.
 *
 * A tall or narrow band, as on a phone, shows the whole head across its
 * width near the top, and fills the rest with an `Underlay`.
 */
export function layoutHead(width: number, height: number): HeadLayout {
  if (height >= width * STACK_ASPECT || width < STACK_BELOW) {
    const along = (width * STACK_SPAN) / LENGTH;
    const out = along * STRETCH;
    return {
      mode: "stack",
      along,
      out,
      crown: (width - LENGTH * along) / 2,
      floor: HEADROOM + DEPTH * PEAK * out,
      fade: 0,
    };
  }
  const fade = Math.min(72, Math.max(24, width * 0.08));
  const room = (height - 1 - Math.max(16, height * 0.05)) / (DEPTH * PEAK * STRETCH);
  const whole = (width * 0.92) / LENGTH;
  const face = (width * 0.96 - fade) / (LENGTH - FACE_FROM);
  const along = Math.max(Math.min(room, whole), Math.min(STATURE, room, face));
  // Centred while the whole head fits; past that the jaw holds its place and
  // the crown runs off the edge.
  const crown = along <= whole ? (width - LENGTH * along) / 2 : width * 0.96 - LENGTH * along;
  return { mode: "floor", along, out: along * STRETCH, crown, floor: height - 1, fade };
}

/** Height of the drawn line above the floor, in pixels, at x. */
export function riseAt(layout: HeadLayout, c: Curve, x: number): number {
  return profile(c, (x - layout.crown) / layout.along) * layout.out;
}

/**
 * What fills a tall band under its head. "reflection": the head mirrored
 * below its floor in bars of digits, one every other column. "extrusion":
 * the head's line repeated below it, each slice standing taller and fainter,
 * as if the profile ran back into depth. "echoes": the line repeated lower,
 * each copy flatter and fainter, like earlier sessions settling.
 */
export type Underlay = "reflection" | "extrusion" | "echoes";

/** One of the lines drawn under a stack's head: an echo or a slice of the extrusion. */
export interface StackLine {
  /** y of the line it rises from. */
  base: number;
  /** Its shape: the head's profile, lower. */
  curve: Curve;
  /** Stroke alpha, before the theme's adjustment. */
  alpha: number;
}

/**
 * The echoes under a head in a tall band: the same profile repeated a step
 * lower each time, each one flatter and fainter, until the last fades out
 * just above the band's bottom edge. The head's line is the newest session
 * and the echoes are the earlier ones settling.
 *
 * The echoes share the head's position and shrink as they descend, so no
 * echo ever crosses the line above it. Each gets its own phase of the faint
 * ripple, so no two are quite the same.
 */
export function echoLines(layout: HeadLayout, height: number): StackLine[] {
  if (layout.mode !== "stack") return [];
  const step = Math.min(22, Math.max(11, DEPTH * PEAK * layout.out * 0.11));
  const count = Math.max(0, Math.floor((height - layout.floor - 8) / step));
  const echoes: StackLine[] = [];
  for (let k = 1; k <= count; k++) {
    const t = k / (count + 1);
    echoes.push({
      base: layout.floor + k * step,
      curve: { shift: REST.shift, amp: REST.amp * 0.82 * (1 - t) ** 1.35, sway: REST.sway + k * 0.6 },
      alpha: 0.42 * (1 - t) ** 1.6,
    });
  }
  return echoes;
}

/** Share of the space under a stack's head that the extrusion fills. */
const EXTRUDE_FILL = 0.88;
/** How tall the last slice stands, as a share of the head. */
const EXTRUDE_AMP = 0.75;

/**
 * The extrusion under a head in a tall band: the head's profile repeated a
 * step lower each time with the same outline, the first slice almost flat
 * and each one after it taller and fainter, as if the head ran back into
 * depth. The slices fill most of the space and fade out before its bottom
 * edge.
 *
 * Each slice grows by less than its step, so no slice crosses the one above
 * it, and none rises past the head's floor.
 */
export function extrusionLines(layout: HeadLayout, height: number): StackLine[] {
  if (layout.mode !== "stack") return [];
  const tallest = DEPTH * PEAK * layout.out;
  const step = Math.min(14, Math.max(8, tallest * 0.09));
  const count = Math.floor(((height - layout.floor) * EXTRUDE_FILL) / step);
  if (count < 1) return [];
  const grow = Math.min(EXTRUDE_AMP, (0.6 * count * step) / tallest);
  const slices: StackLine[] = [];
  for (let k = 1; k <= count; k++) {
    const t = k / (count + 1);
    slices.push({
      base: layout.floor + k * step,
      curve: { shift: REST.shift, amp: REST.amp * grow * (k / count), sway: REST.sway },
      alpha: 0.45 * (1 - t ** 1.6),
    });
  }
  return slices;
}

export interface HeadCells {
  count: number;
  /** Cell centres, in pixels. */
  x: Float32Array;
  y: Float32Array;
  /** Each centre in trace units: along the head, and out from the floor. */
  d: Float32Array;
  h: Float32Array;
  /** 1 for the outermost cell of each column, right under the line. */
  edge: Uint8Array;
}

/**
 * The grid's columns, `cellW` wide across the band, and how many rows of
 * cells each holds: every cell that sits clear of the line across the
 * column's width.
 */
function columns(layout: HeadLayout, width: number, cellW: number, rowH: number) {
  const lanes = Math.max(0, Math.floor(width / cellW));
  const start = (width - lanes * cellW) / 2;
  const gap = rowH / 2 + 2;
  const tallest = Math.floor((DEPTH * PEAK * layout.out) / rowH);
  const heights = new Uint16Array(lanes);
  for (let j = 0; j < lanes; j++) {
    const x0 = start + j * cellW;
    const low = Math.min(riseAt(layout, REST, x0), riseAt(layout, REST, x0 + cellW / 2), riseAt(layout, REST, x0 + cellW));
    heights[j] = Math.max(0, Math.min(tallest, Math.floor((low - gap - 1) / rowH + 0.5)));
  }
  return { start, heights };
}

/** Distance of row k's centre from the floor, either side of it. */
const rowAt = (rowH: number, k: number) => rowH * (k + 0.5) + 1;

/**
 * The digit grid: columns `cellW` wide across the band, rows `rowH` tall
 * stepping out from the floor. A column holds every cell that sits clear of
 * the line across the column's width.
 */
export function headCells(layout: HeadLayout, width: number, cellW: number, rowH: number): HeadCells {
  const { start, heights } = columns(layout, width, cellW, rowH);
  const count = heights.reduce((sum, n) => sum + n, 0);
  const cells: HeadCells = {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    d: new Float32Array(count),
    h: new Float32Array(count),
    edge: new Uint8Array(count),
  };
  let i = 0;
  heights.forEach((n, j) => {
    const x = start + (j + 0.5) * cellW;
    for (let k = 0; k < n; k++) {
      const v = rowAt(rowH, k);
      cells.x[i] = x;
      cells.y[i] = layout.floor - v;
      cells.d[i] = (x - layout.crown) / layout.along;
      cells.h[i] = v / layout.out;
      cells.edge[i] = k === n - 1 ? 1 : 0;
      i++;
    }
  });
  return cells;
}

/** Share of the space under a stack's head that the reflection reaches into. */
const MIRROR_FILL = 0.85;
/** The reflection runs at most this many times deeper than the head stands. */
const MIRROR_STRETCH = 2;
/** How fast the reflection fades with depth. */
const MIRROR_FADE = 1.2;

export interface MirrorCells {
  count: number;
  /** Cell centres, in pixels. */
  x: Float32Array;
  y: Float32Array;
  /** The point of the head each cell mirrors, in trace units. */
  d: Float32Array;
  h: Float32Array;
  /** 1 at the floor, falling toward 0 at the reflection's deepest point. */
  fade: Float32Array;
  /** How many times deeper the reflection runs than the head stands. */
  stretch: number;
}

/**
 * The head's reflection under it in a tall band, in bars of digits: every
 * other column of the head's grid runs on below the floor, mirroring the
 * column above it. The reflection is stretched to fill most of the space
 * under the head, up to twice the head's height, and fades as it deepens,
 * so its deepest bar, under the nose, dies out before the band's bottom
 * edge. Each cell takes the shading of the point of the head it mirrors.
 */
export function reflectionCells(
  layout: HeadLayout,
  width: number,
  height: number,
  cellW: number,
  rowH: number,
): MirrorCells {
  const { start, heights } = columns(layout, width, cellW, rowH);
  const tallest = heights.reduce((top, n) => Math.max(top, n), 0);
  const space = height - layout.floor;
  const stretch =
    layout.mode === "stack" && tallest > 0 && space > 0
      ? Math.min(MIRROR_STRETCH, (space * MIRROR_FILL) / (tallest * rowH))
      : 0;
  const depths = Array.from(heights, (n, j) => {
    if (j % 2) return 0;
    let m = Math.round(n * stretch);
    while (m > 0 && rowAt(rowH, m - 1) + rowH / 2 > space) m--;
    return m;
  });
  const count = depths.reduce((sum, m) => sum + m, 0);
  const deepest = rowAt(rowH, depths.reduce((top, m) => Math.max(top, m), 0) - 1) + rowH / 2;
  const cells: MirrorCells = {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    d: new Float32Array(count),
    h: new Float32Array(count),
    fade: new Float32Array(count),
    stretch,
  };
  let i = 0;
  depths.forEach((m, j) => {
    const x = start + (j + 0.5) * cellW;
    for (let k = 0; k < m; k++) {
      const v = rowAt(rowH, k);
      cells.x[i] = x;
      cells.y[i] = layout.floor + v;
      cells.d[i] = (x - layout.crown) / layout.along;
      cells.h[i] = v / stretch / layout.out;
      cells.fade[i] = (1 - v / deepest) ** MIRROR_FADE;
      i++;
    }
  });
  return cells;
}
/**
 * The head's shading, rendered offline from a 3D model: one byte per pixel,
 * `perUnit` pixels per trace unit, the first column at the crown and the
 * last row on the floor. Brighter is more lit.
 */
export interface ShadeMap {
  width: number;
  height: number;
  perUnit: number;
  data: Uint8Array;
}

/** The map's brightness at a point in trace units, 0 to 1, clamped at its edges. */
export function shadeAt(map: ShadeMap, d: number, h: number): number {
  const fx = Math.min(map.width - 1, Math.max(0, d * map.perUnit - 0.5));
  const fy = Math.min(map.height - 1, Math.max(0, map.height - 0.5 - h * map.perUnit));
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(map.width - 1, x0 + 1);
  const y1 = Math.min(map.height - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const row0 = y0 * map.width;
  const row1 = y1 * map.width;
  const top = map.data[row0 + x0]! + (map.data[row0 + x1]! - map.data[row0 + x0]!) * tx;
  const bottom = map.data[row1 + x0]! + (map.data[row1 + x1]! - map.data[row1 + x0]!) * tx;
  return (top + (bottom - top) * ty) / 255;
}

/**
 * The map's mean brightness over a cell `along` x `up` trace units around a
 * centre, so a small head on a phone still reads the whole patch each digit
 * covers.
 */
export function cellShade(map: ShadeMap, d: number, h: number, along: number, up: number): number {
  const nx = Math.min(4, Math.max(1, Math.round((along * map.perUnit) / 2)));
  const ny = Math.min(4, Math.max(1, Math.round((up * map.perUnit) / 2)));
  let sum = 0;
  for (let a = 0; a < nx; a++) {
    for (let b = 0; b < ny; b++) {
      sum += shadeAt(map, d + along * ((a + 0.5) / nx - 0.5), h + up * ((b + 0.5) / ny - 0.5));
    }
  }
  return sum / (nx * ny);
}

/**
 * Whether decoded map pixels look like the map: smooth, with a spread of
 * tones. Browsers that guard against canvas fingerprinting can hand back
 * blank or noisy pixels instead, and the head then keeps its plain ramp.
 */
export function plausibleShade(data: Uint8Array, width: number): boolean {
  if (data.length < 2 || width < 2) return false;
  let sum = 0;
  let squares = 0;
  let steps = 0;
  let pairs = 0;
  for (let i = 0; i < data.length; i++) {
    const v = data[i]!;
    sum += v;
    squares += v * v;
    if (i % width) {
      steps += Math.abs(v - data[i - 1]!);
      pairs++;
    }
  }
  const mean = sum / data.length;
  const spread = Math.sqrt(Math.max(0, squares / data.length - mean * mean));
  return spread > 20 && steps / Math.max(1, pairs) < 16;
}
