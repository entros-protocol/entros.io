import type { CurveTracePoint } from "@entros/pulse-sdk";

export function appendBoundedPoint(
  points: CurveTracePoint[],
  point: CurveTracePoint,
  limit: number,
): void {
  if (points.length >= limit) {
    let write = 1;
    for (let read = 2; read < points.length; read += 2) {
      points[write] = points[read]!;
      write += 1;
    }
    points.length = write;
  }
  points.push(point);
}
