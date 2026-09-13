/**
 * Raw pointer samples to a coarse path on the grid.
 *
 * Only integer grid coordinates leave the device. No timestamp, no pressure and no motion
 * sample crosses the wire. The resampler reads local timestamps to space the points evenly
 * in time, then drops them.
 */

import { COORDINATE_MAX, MAX_PATH_POINTS, MIN_PATH_POINTS, type Point } from "./transcript";

export interface RawPoint {
  x: number;
  y: number;
  t: number;
}

/** Points in one transmitted path. Inside the schema bounds, with room to spare. */
export const COARSE_PATH_POINTS = 32;

function quantize(value: number, extent: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(extent) || extent <= 0) return 0;
  const scaled = Math.round((value / extent) * COORDINATE_MAX);
  return Math.min(COORDINATE_MAX, Math.max(0, scaled));
}

/**
 * Resamples against the real time axis, not the sample index, so a slow stretch and a fast
 * one contribute in proportion to how long they took.
 *
 * Returns an empty array when the trace is too short to resample, which the caller reads as
 * "no path yet" rather than an error.
 */
export function toCoarsePath(
  raw: readonly RawPoint[],
  surface: { width: number; height: number },
  count: number = COARSE_PATH_POINTS,
): Point[] {
  if (count < MIN_PATH_POINTS || count > MAX_PATH_POINTS) return [];
  const usable = raw.filter(
    (point) => Number.isFinite(point.t) && Number.isFinite(point.x) && Number.isFinite(point.y),
  );
  if (usable.length < 2) return [];

  const start = usable[0]!.t;
  const span = usable[usable.length - 1]!.t - start;
  if (!(span > 0)) return [];

  const points: Point[] = [];
  let cursor = 0;
  for (let step = 0; step < count; step += 1) {
    const target = start + (span * step) / (count - 1);
    while (cursor < usable.length - 2 && usable[cursor + 1]!.t < target) {
      cursor += 1;
    }
    const before = usable[cursor]!;
    const after = usable[cursor + 1] ?? before;
    const gap = after.t - before.t;
    const ratio = gap > 0 ? Math.min(1, Math.max(0, (target - before.t) / gap)) : 0;
    points.push({
      x: quantize(before.x + (after.x - before.x) * ratio, surface.width),
      y: quantize(before.y + (after.y - before.y) * ratio, surface.height),
    });
  }
  return points;
}

/** Reads the waypoints back out of an encoded path target so the client can draw it. */
export function decodePathTarget(encoded: Uint8Array): Point[] {
  if (encoded.length < 2 || encoded[0] !== 1) return [];
  const count = encoded[1] ?? 0;
  if (encoded.length !== 2 + count * 4) return [];
  const view = new DataView(encoded.buffer, encoded.byteOffset, encoded.byteLength);
  const points: Point[] = [];
  for (let index = 0; index < count; index += 1) {
    points.push({
      x: view.getUint16(2 + index * 4, false),
      y: view.getUint16(4 + index * 4, false),
    });
  }
  return points;
}
