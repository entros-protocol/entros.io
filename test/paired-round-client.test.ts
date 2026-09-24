import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildCommit,
  bytesToBase64,
  encodePcm16,
  initialCommitment,
  randomIdempotencyKey,
  revealMatchesItsDigest,
  type SessionDto,
} from "@/lib/paired-round/client";
import { MAX_ROUND_SAMPLES, trimmedRange } from "@/lib/paired-round/capture";
import {
  COARSE_PATH_POINTS,
  decodePathTarget,
  toCoarsePath,
  type RawPoint,
} from "@/lib/paired-round/coarse-path";
import {
  COORDINATE_MAX,
  encodePathTarget,
  fromHex,
  toHex,
  type Point,
  type Tier,
} from "@/lib/paired-round/transcript";

interface RoundVector {
  index: number;
  roundNonceHex: string;
  word: string;
  pathTargetHex: string;
  coarsePathHex: string;
  coarsePathPoints: [number, number][];
  pathPointCount: number;
  audioSegmentHex: string;
  audioByteLength: number;
  challengeDigestHex: string;
  audioDigestHex: string;
  pathDigestHex: string;
  previousCommitmentHex: string;
  commitmentHex: string;
  requestDigestHex: string;
}

interface SessionVector {
  tier: Tier;
  sessionNonceHex: string;
  attemptBindingDigestHex: string;
  sessionExpiryUnixMs: number;
  rounds: number;
  sessionCommitmentHex: string;
  roundEntries: RoundVector[];
}

const vectors = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/paired-round-vectors.json", import.meta.url)), "utf8"),
) as { sessions: SessionVector[] };

function sessionFrom(vector: SessionVector): SessionDto {
  return {
    session_id: "vector-session",
    tier: vector.tier,
    rounds: vector.rounds,
    session_nonce: vector.sessionNonceHex,
    attempt_binding: vector.attemptBindingDigestHex,
    session_expires_at: vector.sessionExpiryUnixMs,
    reveal: revealFrom(vector.roundEntries[0]!),
  };
}

function revealFrom(round: RoundVector) {
  return {
    round_index: round.index,
    round_nonce: round.roundNonceHex,
    word: round.word,
    path_target: round.pathTargetHex,
    challenge_digest: round.challengeDigestHex,
    expires_at: 0,
  };
}

describe("paired-round client", () => {
  it.each(vectors.sessions.map((session) => [session.tier, session] as const))(
    "reproduces the chain the generator wrote, %s",
    async (_tier, vector) => {
      const session = sessionFrom(vector);
      let previous = await initialCommitment(session);
      expect(toHex(previous)).toBe(vector.sessionCommitmentHex);

      for (const round of vector.roundEntries) {
        const reveal = revealFrom(round);
        expect(await revealMatchesItsDigest(session.session_nonce, reveal)).toBe(true);

        const built = await buildCommit({
          session,
          reveal,
          previous,
          evidence: {
            audio: fromHex(round.audioSegmentHex),
            points: round.coarsePathPoints.map(([x, y]) => ({ x, y })),
          },
          idempotencyKey: new Uint8Array(16).fill(4),
        });

        expect(toHex(built.coarsePath)).toBe(round.coarsePathHex);
        expect(built.body.audio_digest).toBe(round.audioDigestHex);
        expect(built.body.path_digest).toBe(round.pathDigestHex);
        expect(built.body.previous_commitment).toBe(round.previousCommitmentHex);
        expect(built.body.commitment).toBe(round.commitmentHex);
        expect(built.body.request_digest).toBe(round.requestDigestHex);
        expect(built.body.audio_byte_length).toBe(round.audioByteLength);
        expect(built.body.path_point_count).toBe(round.pathPointCount);
        previous = built.commitment;
      }
    },
  );

  it("rejects a reveal whose digest covers other content", async () => {
    const vector = vectors.sessions[0]!;
    const reveal = revealFrom(vector.roundEntries[0]!);
    const tampered = { ...reveal, word: `${reveal.word}s` };
    expect(await revealMatchesItsDigest(vector.sessionNonceHex, tampered)).toBe(false);
  });

  it("gives every round attempt its own idempotency key", () => {
    const first = toHex(randomIdempotencyKey());
    const second = toHex(randomIdempotencyKey());
    expect(first).toHaveLength(32);
    expect(first).not.toBe(second);
  });

  it("encodes samples as signed 16-bit little-endian bytes", () => {
    const bytes = encodePcm16(new Float32Array([0, 1, -1, 0.5]));
    expect(bytes).toHaveLength(8);
    const view = new DataView(bytes.buffer);
    expect(view.getInt16(0, true)).toBe(0);
    expect(view.getInt16(2, true)).toBe(0x7fff);
    expect(view.getInt16(4, true)).toBe(-0x8000);
    expect(view.getInt16(6, true)).toBe(Math.round(0.5 * 0x7fff));
  });

  it("clamps samples outside the unit range", () => {
    const view = new DataView(encodePcm16(new Float32Array([4, -4])).buffer);
    expect(view.getInt16(0, true)).toBe(0x7fff);
    expect(view.getInt16(2, true)).toBe(-0x8000);
  });

  it("base64 encodes a buffer larger than one chunk", () => {
    const bytes = new Uint8Array(100_000).fill(65);
    expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
  });
});

describe("coarse path", () => {
  const surface = { width: 400, height: 400 };

  function line(count: number): RawPoint[] {
    return Array.from({ length: count }, (_, index) => ({
      x: (index / (count - 1)) * surface.width,
      y: 0,
      t: index * 10,
    }));
  }

  it("returns the requested number of points on the grid", () => {
    const path = toCoarsePath(line(50), surface);
    expect(path).toHaveLength(COARSE_PATH_POINTS);
    for (const point of path) {
      expect(Number.isInteger(point.x)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(COORDINATE_MAX);
    }
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: COORDINATE_MAX, y: 0 });
  });

  it("resamples against time rather than sample index", () => {
    // Half the samples cover the first tenth of the duration.
    const raw: RawPoint[] = [
      ...Array.from({ length: 20 }, (_, index) => ({ x: index, y: 0, t: index })),
      { x: 400, y: 0, t: 1_000 },
    ];
    const path = toCoarsePath(raw, surface, 8);
    // An index-based resampler would put the midpoint near x=10 of 400.
    expect(path[4]!.x).toBeGreaterThan(400);
  });

  it("returns nothing for a trace too short to resample", () => {
    expect(toCoarsePath([], surface)).toEqual([]);
    expect(toCoarsePath([{ x: 1, y: 1, t: 1 }], surface)).toEqual([]);
    expect(
      toCoarsePath(
        [
          { x: 1, y: 1, t: 5 },
          { x: 2, y: 2, t: 5 },
        ],
        surface,
      ),
    ).toEqual([]);
  });

  it("refuses a point count outside the schema bounds", () => {
    expect(toCoarsePath(line(50), surface, 4)).toEqual([]);
    expect(toCoarsePath(line(50), surface, 128)).toEqual([]);
  });

  it("drops points the browser reported as not a number", () => {
    const raw: RawPoint[] = [
      { x: 0, y: 0, t: 0 },
      { x: Number.NaN, y: 5, t: 5 },
      { x: 400, y: 400, t: 10 },
    ];
    const path = toCoarsePath(raw, surface, 8);
    expect(path).toHaveLength(8);
    expect(path.every((point) => Number.isInteger(point.x) && Number.isInteger(point.y))).toBe(true);
  });

  it("reads back the waypoints of an encoded target", () => {
    const waypoints: Point[] = [
      { x: 150, y: 150 },
      { x: 150, y: 700 },
      { x: 750, y: 700 },
    ];
    expect(decodePathTarget(encodePathTarget("trace", waypoints))).toEqual(waypoints);
    expect(decodePathTarget(encodePathTarget("speech_only", []))).toEqual([]);
    expect(decodePathTarget(new Uint8Array([1, 2, 0]))).toEqual([]);
  });
});

describe("round audio trimming", () => {
  it("keeps a short round whole", () => {
    expect(trimmedRange(0, 16_000, 16_000)).toEqual({ start: 0, end: 16_000 });
  });

  it("keeps the most recent samples when a round runs past the bound", () => {
    // The owner's first run recorded over two minutes in one round, and the service refused
    // it with evidence_bounds_invalid. The client trims instead of failing.
    const total = 16_000 * 133;
    const { start, end } = trimmedRange(0, total, total);
    expect(end - start).toBe(MAX_ROUND_SAMPLES);
    expect(end).toBe(total);
  });

  it("never returns more than the bound, whatever the round length", () => {
    for (const seconds of [1, 19, 20, 21, 60, 600]) {
      const total = 16_000 * seconds;
      const { start, end } = trimmedRange(0, total, total);
      expect(end - start).toBeLessThanOrEqual(MAX_ROUND_SAMPLES);
    }
  });

  it("clamps a range that runs past what was recorded", () => {
    expect(trimmedRange(500, 9_999, 1_000)).toEqual({ start: 500, end: 1_000 });
    expect(trimmedRange(9_999, 9_999, 1_000)).toEqual({ start: 1_000, end: 1_000 });
  });
});
