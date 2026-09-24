/**
 * Compares two identity feature vectors and predicts how far apart their fingerprints land.
 *
 * The fingerprint is a sign-random-projection hash. For two vectors separated by angle theta,
 * each projection bit disagrees with probability theta / pi, independent of the seed. So the
 * expected Hamming distance follows from the angle alone, and this predicts the server
 * fingerprint distance without holding the server's private seed.
 *
 * Nothing here reads audio, motion or touch. It takes the derived vectors and returns numbers.
 */

/** Fingerprint width in bits. Mirrors the verifier IDL through the SDK. */
export const FINGERPRINT_BITS = 256;

/** Upper bound on an accepted self-match distance. The verifier program is authoritative. */
export const MAX_THRESHOLD = 96;

/** Lower bound. A distance under this reads as a replayed fingerprint rather than a person. */
export const MIN_DISTANCE_FLOOR = 3;

/**
 * Largest angle a pair may span and still be expected to match, in radians.
 * At the 96-bit threshold this is 67.5 degrees, so the vectors must stay above a cosine
 * of about 0.383.
 */
export const MAX_ACCEPTED_ANGLE = (Math.PI * MAX_THRESHOLD) / FINGERPRINT_BITS;

/** Smallest cosine a pair may have and still be expected to match. */
export const MIN_ACCEPTED_COSINE = Math.cos(MAX_ACCEPTED_ANGLE);

export interface VectorComparison {
  /** Cosine of the angle between the two vectors, in [-1, 1]. */
  cosine: number;
  /** Angle between them in radians, in [0, pi]. */
  angleRadians: number;
  /** Expected fingerprint distance in bits. */
  expectedDistance: number;
  /**
   * One standard deviation of that distance. Each bit is an independent Bernoulli trial, so
   * the spread is the binomial one. A measured distance inside two of these of the
   * prediction says the two agree.
   */
  distanceStdDev: number;
  /** True when the expected distance lands inside the accepted band. */
  withinAcceptedBand: boolean;
}

export function compareVectors(left: number[], right: number[]): VectorComparison {
  if (left.length !== right.length) {
    throw new Error(`Vector lengths differ: ${left.length} and ${right.length}`);
  }
  if (left.length === 0) {
    throw new Error("Cannot compare empty vectors");
  }

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  }

  const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm);
  // A zero vector has no direction, so no angle exists. Report the worst case rather than
  // NaN, because a silent NaN downstream reads as a passing measurement.
  const cosine = denominator === 0 ? -1 : clamp(dot / denominator, -1, 1);
  const angleRadians = Math.acos(cosine);
  const disagreement = angleRadians / Math.PI;
  const expectedDistance = FINGERPRINT_BITS * disagreement;

  return {
    cosine,
    angleRadians,
    expectedDistance,
    distanceStdDev: Math.sqrt(FINGERPRINT_BITS * disagreement * (1 - disagreement)),
    withinAcceptedBand:
      expectedDistance >= MIN_DISTANCE_FLOOR && expectedDistance < MAX_THRESHOLD,
  };
}

export interface FeatureMove {
  index: number;
  left: number;
  right: number;
  /** Signed difference, right minus left. */
  delta: number;
  /**
   * Difference scaled by how much room the feature has to move, so features on different
   * scales rank against each other. Zero when neither value carries magnitude.
   */
  relative: number;
}

/** Per-feature movement, largest relative move first. */
export function featureMoves(left: number[], right: number[]): FeatureMove[] {
  if (left.length !== right.length) {
    throw new Error(`Vector lengths differ: ${left.length} and ${right.length}`);
  }
  const moves: FeatureMove[] = [];
  for (let index = 0; index < left.length; index += 1) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    const scale = Math.max(Math.abs(a), Math.abs(b));
    moves.push({
      index,
      left: a,
      right: b,
      delta: b - a,
      relative: scale === 0 ? 0 : Math.abs(b - a) / scale,
    });
  }
  return moves.sort((first, second) => second.relative - first.relative);
}

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}
