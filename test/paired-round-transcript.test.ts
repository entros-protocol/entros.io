import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ATTEMPT_DOMAIN,
  AUDIO_DOMAIN,
  AUDIO_FORMAT,
  CHALLENGE_DOMAIN,
  COMMIT_REQUEST_DOMAIN,
  COORDINATE_MAX,
  EncodingError,
  FINAL_DOMAIN,
  MAX_PATH_POINTS,
  MAX_WAYPOINTS,
  MIN_PATH_POINTS,
  MIN_WAYPOINTS,
  PATH_DOMAIN,
  ROUND_DOMAIN,
  SCHEMA_VERSION,
  SESSION_DOMAIN,
  attemptBindingDigest,
  audioDigest,
  challengeDigest,
  checkTierPointCount,
  commitRequestDigest,
  encode,
  encodeCoarsePath,
  encodePathTarget,
  evidenceManifest,
  finalDigest,
  fromHex,
  pathDigest,
  roundCommitment,
  sessionCommitment,
  sha256,
  toHex,
  type Point,
  type Tier,
} from "@/lib/paired-round/transcript";

interface RoundVector {
  index: number;
  roundNonceHex: string;
  word: string;
  pathTargetHex: string;
  pathTargetWaypoints: [number, number][];
  coarsePathHex: string;
  coarsePathPoints: [number, number][];
  pathPointCount: number;
  audioFormat: string;
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
  name: string;
  tier: Tier;
  sessionNonceHex: string;
  serverAttemptIdHex: string;
  originalChallengeNonceHex: string;
  sessionExpiryUnixMs: number;
  rounds: number;
  attemptBindingDigestHex: string;
  sessionCommitmentHex: string;
  roundEntries: RoundVector[];
  evidenceManifestHex: string;
  finalDigestHex: string;
}

interface InvalidEncoding {
  name: string;
  encoding: "pathTarget" | "coarsePath" | "tier";
  reason: string;
  waypoints?: [number, number][];
  points?: [number, number][];
  tier?: Tier;
  pointCount?: number;
}

interface Vectors {
  domains: Record<string, string>;
  constants: Record<string, number | string>;
  sessions: SessionVector[];
  invalidEncodings: InvalidEncoding[];
  separation: {
    naiveConcatenationMatches: boolean;
    encodedLeftHex: string;
    encodedRightHex: string;
    encodedDigestsDiffer: boolean;
  };
}

const vectors = JSON.parse(
  readFileSync(fileURLToPath(new URL("./fixtures/paired-round-vectors.json", import.meta.url)), "utf8"),
) as Vectors;

const decoder = new TextDecoder();
const points = (pairs: [number, number][] = []): Point[] => pairs.map(([x, y]) => ({ x, y }));

describe("paired-round transcript", () => {
  it("uses the domain prefixes the generator wrote", () => {
    const expected: [string, Uint8Array][] = [
      ["session", SESSION_DOMAIN],
      ["attempt", ATTEMPT_DOMAIN],
      ["challenge", CHALLENGE_DOMAIN],
      ["audio", AUDIO_DOMAIN],
      ["path", PATH_DOMAIN],
      ["round", ROUND_DOMAIN],
      ["commitRequest", COMMIT_REQUEST_DOMAIN],
      ["final", FINAL_DOMAIN],
    ];
    for (const [key, domain] of expected) {
      expect(decoder.decode(domain)).toBe(vectors.domains[key]);
    }
  });

  it("uses the constants the generator wrote", () => {
    expect(vectors.constants.schemaVersion).toBe(SCHEMA_VERSION);
    expect(vectors.constants.audioFormat).toBe(decoder.decode(AUDIO_FORMAT));
    expect(vectors.constants.minWaypoints).toBe(MIN_WAYPOINTS);
    expect(vectors.constants.maxWaypoints).toBe(MAX_WAYPOINTS);
    expect(vectors.constants.minPathPoints).toBe(MIN_PATH_POINTS);
    expect(vectors.constants.maxPathPoints).toBe(MAX_PATH_POINTS);
    expect(vectors.constants.coordinateMax).toBe(COORDINATE_MAX);
  });

  it.each(vectors.sessions.map((session) => [session.name, session] as const))(
    "reproduces every digest for %s",
    async (_name, session) => {
      const sessionNonce = fromHex(session.sessionNonceHex);
      const attempt = await attemptBindingDigest(
        fromHex(session.serverAttemptIdHex),
        fromHex(session.originalChallengeNonceHex),
      );
      expect(toHex(attempt)).toBe(session.attemptBindingDigestHex);

      let previous = await sessionCommitment(
        sessionNonce,
        attempt,
        session.rounds,
        session.sessionExpiryUnixMs,
      );
      expect(toHex(previous)).toBe(session.sessionCommitmentHex);

      const manifestEntries: { audio: Uint8Array; path: Uint8Array }[] = [];
      for (const entry of session.roundEntries) {
        const roundNonce = fromHex(entry.roundNonceHex);
        const target = encodePathTarget(session.tier, points(entry.pathTargetWaypoints));
        expect(toHex(target)).toBe(entry.pathTargetHex);

        const path = encodeCoarsePath(session.tier, points(entry.coarsePathPoints));
        expect(toHex(path)).toBe(entry.coarsePathHex);

        const challenge = await challengeDigest(
          sessionNonce,
          entry.index,
          roundNonce,
          entry.word,
          target,
        );
        expect(toHex(challenge)).toBe(entry.challengeDigestHex);

        const segment = fromHex(entry.audioSegmentHex);
        const audio = await audioDigest(sessionNonce, entry.index, challenge, segment);
        expect(toHex(audio)).toBe(entry.audioDigestHex);

        const pathHash = await pathDigest(sessionNonce, entry.index, challenge, path);
        expect(toHex(pathHash)).toBe(entry.pathDigestHex);
        expect(toHex(previous)).toBe(entry.previousCommitmentHex);

        const current = await roundCommitment({
          sessionNonce,
          roundIndex: entry.index,
          roundNonce,
          challenge,
          previous,
          audioByteLength: entry.audioByteLength,
          audio,
          pathPointCount: entry.pathPointCount,
          path: pathHash,
        });
        expect(toHex(current)).toBe(entry.commitmentHex);

        const request = await commitRequestDigest({
          sessionNonce,
          roundIndex: entry.index,
          roundNonce,
          challenge,
          previous,
          current,
          audioByteLength: entry.audioByteLength,
          pathPointCount: entry.pathPointCount,
        });
        expect(toHex(request)).toBe(entry.requestDigestHex);

        manifestEntries.push({ audio, path: pathHash });
        previous = current;
      }

      const manifest = evidenceManifest(manifestEntries);
      expect(toHex(manifest)).toBe(session.evidenceManifestHex);
      expect(toHex(await finalDigest(sessionNonce, previous, session.rounds, manifest))).toBe(
        session.finalDigestHex,
      );
    },
  );

  it.each(vectors.invalidEncodings.map((entry) => [entry.name, entry] as const))(
    "rejects %s",
    (_name, entry) => {
      const run = () => {
        if (entry.encoding === "pathTarget") return encodePathTarget("trace", points(entry.waypoints));
        if (entry.encoding === "coarsePath") return encodeCoarsePath("trace", points(entry.points));
        return checkTierPointCount(entry.tier as Tier, entry.pointCount as number);
      };
      expect(run).toThrowError(EncodingError);
      try {
        run();
      } catch (error) {
        expect((error as EncodingError).reason).toBe(entry.reason);
      }
    },
  );

  it("separates fields that naive concatenation merges", async () => {
    const encoder = new TextEncoder();
    const left = encode([encoder.encode("entros"), encoder.encode("paired")]);
    const right = encode([encoder.encode("entrospaired"), new Uint8Array(0)]);
    expect(toHex(left)).toBe(vectors.separation.encodedLeftHex);
    expect(toHex(right)).toBe(vectors.separation.encodedRightHex);
    expect(toHex(await sha256(left))).not.toBe(toHex(await sha256(right)));
    expect(vectors.separation.naiveConcatenationMatches).toBe(true);
  });

  it("binds the tier through the challenge digest", async () => {
    const sessionNonce = new Uint8Array(32).fill(7);
    const roundNonce = new Uint8Array(32).fill(9);
    const waypoints = [
      { x: 100, y: 100 },
      { x: 200, y: 400 },
      { x: 300, y: 150 },
    ];
    const traced = await challengeDigest(
      sessionNonce,
      1,
      roundNonce,
      "balance",
      encodePathTarget("trace", waypoints),
    );
    const spoken = await challengeDigest(
      sessionNonce,
      1,
      roundNonce,
      "balance",
      encodePathTarget("speech_only", []),
    );
    expect(toHex(traced)).not.toBe(toHex(spoken));
  });

  it("rejects a coordinate above the grid", () => {
    const grid = Array.from({ length: MIN_PATH_POINTS }, () => ({ x: 10, y: 10 }));
    grid[0] = { x: COORDINATE_MAX + 1, y: 10 };
    expect(() => encodeCoarsePath("trace", grid)).toThrowError(
      expect.objectContaining({ reason: "coordinate_out_of_range" }),
    );
  });

  it("carries no path on the speech-only tier", () => {
    expect(encodePathTarget("speech_only", [])).toHaveLength(0);
    expect(encodeCoarsePath("speech_only", [])).toHaveLength(0);
    expect(() => encodeCoarsePath("speech_only", [{ x: 1, y: 1 }])).toThrowError(
      expect.objectContaining({ reason: "tier_violation" }),
    );
    expect(() => checkTierPointCount("speech_only", 8)).toThrowError(
      expect.objectContaining({ reason: "tier_violation" }),
    );
    expect(() => checkTierPointCount("trace", 0)).toThrowError(
      expect.objectContaining({ reason: "tier_violation" }),
    );
  });
});
