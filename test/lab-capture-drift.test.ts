import { describe, expect, it } from "vitest";
import {
  compareVectors,
  featureMoves,
  FINGERPRINT_BITS,
  MAX_ACCEPTED_ANGLE,
  MAX_THRESHOLD,
  MIN_ACCEPTED_COSINE,
} from "@/lib/lab/capture-drift";

/** Deterministic uniform source, so a failure reproduces. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal from two uniforms. Random hyperplanes need Gaussian coefficients. */
function gaussian(random: () => number): number {
  const first = Math.max(random(), Number.MIN_VALUE);
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * random());
}

/** Signs of `bits` random projections of `vector`. This is the fingerprint construction. */
function fingerprint(vector: number[], bits: number, random: () => number): boolean[] {
  const out: boolean[] = [];
  for (let bit = 0; bit < bits; bit += 1) {
    let dot = 0;
    for (const value of vector) {
      dot += value * gaussian(random);
    }
    out.push(dot >= 0);
  }
  return out;
}

function hamming(left: boolean[], right: boolean[]): number {
  let distance = 0;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) distance += 1;
  }
  return distance;
}

describe("compareVectors", () => {
  it("reports no angle between a vector and itself", () => {
    const vector = [1, -2, 3.5, 0, 9];
    const comparison = compareVectors(vector, vector);
    expect(comparison.cosine).toBeCloseTo(1, 12);
    expect(comparison.angleRadians).toBeCloseTo(0, 12);
    expect(comparison.expectedDistance).toBeCloseTo(0, 12);
  });

  it("reports a right angle between orthogonal vectors as half the bits", () => {
    const comparison = compareVectors([1, 0], [0, 1]);
    expect(comparison.cosine).toBeCloseTo(0, 12);
    expect(comparison.expectedDistance).toBeCloseTo(FINGERPRINT_BITS / 2, 10);
  });

  it("reports every bit differing for opposed vectors", () => {
    const comparison = compareVectors([1, 2], [-1, -2]);
    expect(comparison.cosine).toBeCloseTo(-1, 12);
    // acos has a square-root singularity at both ends, so a rounding error of 1e-16 in the
    // cosine lands as roughly 1e-8 in the angle. The loose bound here is that singularity,
    // not slack in the formula.
    expect(comparison.expectedDistance).toBeCloseTo(FINGERPRINT_BITS, 4);
  });

  it("ignores scale, because the projection sign does", () => {
    const base = compareVectors([1, 2, 3], [3, 2, 1]);
    const scaled = compareVectors([10, 20, 30], [0.3, 0.2, 0.1]);
    expect(scaled.cosine).toBeCloseTo(base.cosine, 12);
  });

  it("treats a zero vector as the worst case rather than returning NaN", () => {
    const comparison = compareVectors([0, 0, 0], [1, 2, 3]);
    expect(Number.isNaN(comparison.cosine)).toBe(false);
    expect(comparison.cosine).toBe(-1);
    expect(comparison.withinAcceptedBand).toBe(false);
  });

  it("places the accepted band exactly where the verifier threshold sits", () => {
    expect(MAX_ACCEPTED_ANGLE).toBeCloseTo((Math.PI * MAX_THRESHOLD) / FINGERPRINT_BITS, 12);
    expect(MIN_ACCEPTED_COSINE).toBeCloseTo(0.38268343236, 8);

    const justInside = compareVectors([1, 0], [Math.cos(MAX_ACCEPTED_ANGLE * 0.99), Math.sin(MAX_ACCEPTED_ANGLE * 0.99)]);
    expect(justInside.withinAcceptedBand).toBe(true);

    const justOutside = compareVectors([1, 0], [Math.cos(MAX_ACCEPTED_ANGLE * 1.01), Math.sin(MAX_ACCEPTED_ANGLE * 1.01)]);
    expect(justOutside.withinAcceptedBand).toBe(false);
  });

  it("rejects an identical pair, because a distance under the floor reads as a replay", () => {
    expect(compareVectors([1, 2, 3], [1, 2, 3]).withinAcceptedBand).toBe(false);
  });

  it("refuses vectors of differing length", () => {
    expect(() => compareVectors([1, 2], [1, 2, 3])).toThrow(/lengths differ/);
  });

  it("refuses empty vectors", () => {
    expect(() => compareVectors([], [])).toThrow(/empty/);
  });

  /**
   * The load-bearing claim: predicted distance matches a real sign-random projection, so the
   * prediction stands in for a server fingerprint whose seed stays private.
   */
  it("predicts the distance a real random projection produces", () => {
    const random = mulberry32(20260918);
    const dimension = 308;

    for (const targetCosine of [0.99, 0.9, 0.7, 0.5, 0.383, 0.2, 0.0]) {
      const left = Array.from({ length: dimension }, () => gaussian(random));
      const orthogonal = orthogonalTo(left, random);
      const angle = Math.acos(targetCosine);
      const right = left.map(
        (value, index) => Math.cos(angle) * value + Math.sin(angle) * (orthogonal[index] ?? 0),
      );

      const predicted = compareVectors(left, right);
      expect(predicted.cosine).toBeCloseTo(targetCosine, 6);

      const bits = 4096;
      const projection = mulberry32(7);
      const measured = hamming(
        fingerprint(left, bits, mulberry32(7)),
        fingerprint(right, bits, projection),
      );
      const measuredPerBit = measured / bits;
      const predictedPerBit = predicted.expectedDistance / FINGERPRINT_BITS;
      // Four standard errors over 4096 bits. Wide enough not to flake, tight enough that a
      // wrong formula fails.
      const tolerance = (4 * Math.sqrt(0.25 / bits));
      expect(Math.abs(measuredPerBit - predictedPerBit)).toBeLessThan(tolerance);
    }
  });
});

/** A unit vector at right angles to `vector`, by Gram-Schmidt. */
function orthogonalTo(vector: number[], random: () => number): number[] {
  const candidate = vector.map(() => gaussian(random));
  let dot = 0;
  let norm = 0;
  for (let index = 0; index < vector.length; index += 1) {
    dot += (vector[index] ?? 0) * (candidate[index] ?? 0);
    norm += (vector[index] ?? 0) ** 2;
  }
  const projected = candidate.map((value, index) => value - (dot / norm) * (vector[index] ?? 0));
  const length = Math.sqrt(projected.reduce((sum, value) => sum + value * value, 0));
  const unitLeft = Math.sqrt(norm);
  return projected.map((value) => (value / length) * unitLeft);
}

describe("featureMoves", () => {
  it("ranks the largest relative move first", () => {
    const moves = featureMoves([100, 1, 50], [110, 4, 50]);
    expect(moves[0]?.index).toBe(1);
    expect(moves[0]?.relative).toBeCloseTo(0.75, 12);
    expect(moves[1]?.index).toBe(0);
    expect(moves[2]?.index).toBe(2);
    expect(moves[2]?.relative).toBe(0);
  });

  it("keeps the sign of the change", () => {
    const moves = featureMoves([10, 10], [5, 20]);
    expect(moves.find((move) => move.index === 0)?.delta).toBe(-5);
    expect(moves.find((move) => move.index === 1)?.delta).toBe(10);
  });

  it("reports no movement between two zeros rather than dividing by zero", () => {
    const moves = featureMoves([0], [0]);
    expect(moves[0]?.relative).toBe(0);
    expect(Number.isNaN(moves[0]?.relative ?? NaN)).toBe(false);
  });

  it("refuses vectors of differing length", () => {
    expect(() => featureMoves([1], [1, 2])).toThrow(/lengths differ/);
  });
});
