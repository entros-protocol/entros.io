/**
 * Canonical transcript for the paired-round prototype.
 *
 * The server reveals the next round only after it accepts a commitment binding the current
 * round's evidence. Every digest carries the session nonce and the round index, so a
 * commitment from one session or one round cannot stand in for another.
 *
 * Three implementations must agree byte for byte: this file, the Rust module in
 * `entros-validation/src/paired_round/transcript.rs`, and the independent generator at
 * `scripts/paired-round/generate-vectors.py`. The generator writes the vectors both others
 * check against.
 *
 * `encode` writes a four-byte big-endian length in front of every field. Without it,
 * ("entros", "paired") and ("entrospaired", "") hash to the same digest.
 */

const textEncoder = new TextEncoder();

function ascii(value: string): Uint8Array {
  return textEncoder.encode(value);
}

export const SESSION_DOMAIN = ascii("entros/paired-round/v1/session\0");
export const ATTEMPT_DOMAIN = ascii("entros/paired-round/v1/attempt\0");
export const CHALLENGE_DOMAIN = ascii("entros/paired-round/v1/challenge\0");
export const AUDIO_DOMAIN = ascii("entros/paired-round/v1/audio\0");
export const PATH_DOMAIN = ascii("entros/paired-round/v1/path\0");
export const ROUND_DOMAIN = ascii("entros/paired-round/v1/round\0");
export const COMMIT_REQUEST_DOMAIN = ascii("entros/paired-round/v1/commit-request\0");
export const FINAL_DOMAIN = ascii("entros/paired-round/v1/final\0");

/** The label enters the audio digest, so a second format cannot reuse the first's digest. */
export const AUDIO_FORMAT = ascii("pcm_s16le_16000_mono");

export const SCHEMA_VERSION = 1;
export const MIN_WAYPOINTS = 3;
export const MAX_WAYPOINTS = 5;
export const MIN_PATH_POINTS = 8;
export const MAX_PATH_POINTS = 64;
export const COORDINATE_MAX = 1000;

export type Tier = "trace" | "speech_only";

export interface Point {
  x: number;
  y: number;
}

export type EncodingReason =
  | "waypoint_count_out_of_range"
  | "point_count_out_of_range"
  | "coordinate_out_of_range"
  | "tier_violation"
  | "malformed";

export class EncodingError extends Error {
  readonly reason: EncodingReason;

  constructor(reason: EncodingReason) {
    super(reason);
    this.name = "EncodingError";
    this.reason = reason;
  }
}

/** Length-prefixed concatenation. Every field carries a four-byte big-endian length. */
export function encode(fields: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const field of fields) total += field.length + 4;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let offset = 0;
  for (const field of fields) {
    view.setUint32(offset, field.length, false);
    offset += 4;
    out.set(field, offset);
    offset += field.length;
  }
  return out;
}

function u32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value, false);
  return out;
}

function u64(value: number | bigint): Uint8Array {
  const out = new Uint8Array(8);
  new DataView(out.buffer).setBigUint64(0, BigInt(value), false);
  return out;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data as BufferSource));
}

async function digest(fields: readonly Uint8Array[]): Promise<Uint8Array> {
  return sha256(encode(fields));
}

export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

export function fromHex(value: string): Uint8Array {
  if (value.length % 2 !== 0 || /[^0-9a-f]/.test(value)) {
    throw new EncodingError("malformed");
  }
  const out = new Uint8Array(value.length / 2);
  for (let index = 0; index < out.length; index += 1) {
    out[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
}

function checkCoordinates(points: readonly Point[]): void {
  for (const point of points) {
    if (
      !Number.isInteger(point.x) ||
      !Number.isInteger(point.y) ||
      point.x < 0 ||
      point.y < 0 ||
      point.x > COORDINATE_MAX ||
      point.y > COORDINATE_MAX
    ) {
      throw new EncodingError("coordinate_out_of_range");
    }
  }
}

function writePoints(view: DataView, offset: number, points: readonly Point[]): void {
  let cursor = offset;
  for (const point of points) {
    view.setUint16(cursor, point.x, false);
    view.setUint16(cursor + 2, point.y, false);
    cursor += 4;
  }
}

/** `version || waypoint_count || (x, y) ...`. The speech-only tier uses an empty target. */
export function encodePathTarget(tier: Tier, waypoints: readonly Point[]): Uint8Array {
  if (tier === "speech_only") {
    if (waypoints.length > 0) throw new EncodingError("tier_violation");
    return new Uint8Array(0);
  }
  if (waypoints.length < MIN_WAYPOINTS || waypoints.length > MAX_WAYPOINTS) {
    throw new EncodingError("waypoint_count_out_of_range");
  }
  checkCoordinates(waypoints);
  const out = new Uint8Array(2 + waypoints.length * 4);
  const view = new DataView(out.buffer);
  view.setUint8(0, SCHEMA_VERSION);
  view.setUint8(1, waypoints.length);
  writePoints(view, 2, waypoints);
  return out;
}

/** `version || point_count || (x, y) ...`. The speech-only tier submits an empty path. */
export function encodeCoarsePath(tier: Tier, points: readonly Point[]): Uint8Array {
  if (tier === "speech_only") {
    if (points.length > 0) throw new EncodingError("tier_violation");
    return new Uint8Array(0);
  }
  if (points.length < MIN_PATH_POINTS || points.length > MAX_PATH_POINTS) {
    throw new EncodingError("point_count_out_of_range");
  }
  checkCoordinates(points);
  const out = new Uint8Array(3 + points.length * 4);
  const view = new DataView(out.buffer);
  view.setUint8(0, SCHEMA_VERSION);
  view.setUint16(1, points.length, false);
  writePoints(view, 3, points);
  return out;
}

/** The declared point count must match the tier, in both directions. */
export function checkTierPointCount(tier: Tier, pointCount: number): void {
  if (tier === "speech_only") {
    if (pointCount !== 0) throw new EncodingError("tier_violation");
    return;
  }
  if (pointCount < MIN_PATH_POINTS || pointCount > MAX_PATH_POINTS) {
    throw new EncodingError("tier_violation");
  }
}

export function attemptBindingDigest(
  serverAttemptId: Uint8Array,
  challengeNonce: Uint8Array,
): Promise<Uint8Array> {
  return digest([ATTEMPT_DOMAIN, serverAttemptId, challengeNonce]);
}

export function challengeDigest(
  sessionNonce: Uint8Array,
  roundIndex: number,
  roundNonce: Uint8Array,
  word: string,
  pathTarget: Uint8Array,
): Promise<Uint8Array> {
  return digest([CHALLENGE_DOMAIN, sessionNonce, u32(roundIndex), roundNonce, ascii(word), pathTarget]);
}

export function audioDigest(
  sessionNonce: Uint8Array,
  roundIndex: number,
  challenge: Uint8Array,
  segment: Uint8Array,
): Promise<Uint8Array> {
  return digest([AUDIO_DOMAIN, sessionNonce, u32(roundIndex), challenge, AUDIO_FORMAT, segment]);
}

export function pathDigest(
  sessionNonce: Uint8Array,
  roundIndex: number,
  challenge: Uint8Array,
  coarsePath: Uint8Array,
): Promise<Uint8Array> {
  return digest([PATH_DOMAIN, sessionNonce, u32(roundIndex), challenge, coarsePath]);
}

/** `C_0`. The chain starts at the session, so no round commitment stands alone. */
export function sessionCommitment(
  sessionNonce: Uint8Array,
  attemptBinding: Uint8Array,
  rounds: number,
  sessionExpiryUnixMs: number | bigint,
): Promise<Uint8Array> {
  return digest([SESSION_DOMAIN, sessionNonce, attemptBinding, u32(rounds), u64(sessionExpiryUnixMs)]);
}

export interface RoundCommitmentInput {
  sessionNonce: Uint8Array;
  roundIndex: number;
  roundNonce: Uint8Array;
  challenge: Uint8Array;
  previous: Uint8Array;
  audioByteLength: number;
  audio: Uint8Array;
  pathPointCount: number;
  path: Uint8Array;
}

/** `C_k`. Carries the previous commitment, so the chain fixes order. */
export function roundCommitment(input: RoundCommitmentInput): Promise<Uint8Array> {
  return digest([
    ROUND_DOMAIN,
    input.sessionNonce,
    u32(input.roundIndex),
    input.roundNonce,
    input.challenge,
    input.previous,
    AUDIO_FORMAT,
    u32(input.audioByteLength),
    input.audio,
    u32(input.pathPointCount),
    input.path,
  ]);
}

export interface CommitRequestInput {
  sessionNonce: Uint8Array;
  roundIndex: number;
  roundNonce: Uint8Array;
  challenge: Uint8Array;
  previous: Uint8Array;
  current: Uint8Array;
  audioByteLength: number;
  pathPointCount: number;
}

/**
 * What the server recomputes from the commit request. The idempotency key stays outside it,
 * so a retry with the same key and the same fields reads as the same request.
 */
export function commitRequestDigest(input: CommitRequestInput): Promise<Uint8Array> {
  return digest([
    COMMIT_REQUEST_DOMAIN,
    input.sessionNonce,
    u32(input.roundIndex),
    input.roundNonce,
    input.challenge,
    input.previous,
    input.current,
    AUDIO_FORMAT,
    u32(input.audioByteLength),
    u32(input.pathPointCount),
  ]);
}

/** Audio and path digests in server round order. Fixed width, so no separator is needed. */
export function evidenceManifest(entries: readonly { audio: Uint8Array; path: Uint8Array }[]): Uint8Array {
  const out = new Uint8Array(entries.length * 64);
  entries.forEach((entry, index) => {
    out.set(entry.audio, index * 64);
    out.set(entry.path, index * 64 + 32);
  });
  return out;
}

export function finalDigest(
  sessionNonce: Uint8Array,
  lastCommitment: Uint8Array,
  rounds: number,
  manifest: Uint8Array,
): Promise<Uint8Array> {
  return digest([FINAL_DOMAIN, sessionNonce, lastCommitment, u32(rounds), manifest]);
}
