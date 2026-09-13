/**
 * Client side of the paired-round chain.
 *
 * The browser computes every digest itself and sends only digests at commit time. The
 * bytes follow at finalize, where the server checks them against what it already accepted.
 *
 * Nothing here touches identity capture. It handles one word, one short path, and the
 * commitment chain.
 */

import {
  audioDigest,
  challengeDigest,
  commitRequestDigest,
  encodeCoarsePath,
  fromHex,
  pathDigest,
  roundCommitment,
  sessionCommitment,
  toHex,
  type Point,
  type Tier,
} from "./transcript";

export interface RevealDto {
  round_index: number;
  round_nonce: string;
  word: string;
  path_target: string;
  challenge_digest: string;
  expires_at: number;
}

export interface SessionDto {
  session_id: string;
  tier: Tier;
  rounds: number;
  session_nonce: string;
  attempt_binding: string;
  session_expires_at: number;
  reveal: RevealDto;
}

export interface CommitDto {
  state: string;
  reveal: RevealDto | null;
}

export interface RoundEvidence {
  /** Signed 16-bit little-endian PCM, exactly the bytes the finalize request carries. */
  audio: Uint8Array;
  points: Point[];
}

export interface BuiltCommit {
  body: Record<string, unknown>;
  commitment: Uint8Array;
  coarsePath: Uint8Array;
}

/** `C_0`, the head of the chain before any round is committed. */
export function initialCommitment(session: SessionDto): Promise<Uint8Array> {
  return sessionCommitment(
    fromHex(session.session_nonce),
    fromHex(session.attempt_binding),
    session.rounds,
    session.session_expires_at,
  );
}

/**
 * Recomputes the challenge digest from the word and target the server sent. A server that
 * sends a digest over anything else fails here, before the client speaks.
 */
export async function revealMatchesItsDigest(
  sessionNonce: string,
  reveal: RevealDto,
): Promise<boolean> {
  const recomputed = await challengeDigest(
    fromHex(sessionNonce),
    reveal.round_index,
    fromHex(reveal.round_nonce),
    reveal.word,
    fromHex(reveal.path_target),
  );
  return toHex(recomputed) === reveal.challenge_digest;
}

export async function buildCommit(args: {
  session: SessionDto;
  reveal: RevealDto;
  previous: Uint8Array;
  evidence: RoundEvidence;
  idempotencyKey: Uint8Array;
}): Promise<BuiltCommit> {
  const { session, reveal, previous, evidence, idempotencyKey } = args;
  const sessionNonce = fromHex(session.session_nonce);
  const roundNonce = fromHex(reveal.round_nonce);
  const challenge = fromHex(reveal.challenge_digest);
  const coarsePath = encodeCoarsePath(session.tier, evidence.points);

  const audio = await audioDigest(sessionNonce, reveal.round_index, challenge, evidence.audio);
  const path = await pathDigest(sessionNonce, reveal.round_index, challenge, coarsePath);
  const commitment = await roundCommitment({
    sessionNonce,
    roundIndex: reveal.round_index,
    roundNonce,
    challenge,
    previous,
    audioByteLength: evidence.audio.length,
    audio,
    pathPointCount: evidence.points.length,
    path,
  });
  const requestDigest = await commitRequestDigest({
    sessionNonce,
    roundIndex: reveal.round_index,
    roundNonce,
    challenge,
    previous,
    current: commitment,
    audioByteLength: evidence.audio.length,
    pathPointCount: evidence.points.length,
  });

  return {
    body: {
      session_id: session.session_id,
      round_index: reveal.round_index,
      round_nonce: reveal.round_nonce,
      challenge_digest: reveal.challenge_digest,
      previous_commitment: toHex(previous),
      commitment: toHex(commitment),
      audio_byte_length: evidence.audio.length,
      audio_digest: toHex(audio),
      path_point_count: evidence.points.length,
      path_digest: toHex(path),
      idempotency_key: toHex(idempotencyKey),
      request_digest: toHex(requestDigest),
    },
    commitment,
    coarsePath,
  };
}

/** One key for each round attempt. A retry reuses it, so the server repeats its answer. */
export function randomIdempotencyKey(): Uint8Array {
  const key = new Uint8Array(16);
  crypto.getRandomValues(key);
  return key;
}

/**
 * Float samples to signed 16-bit little-endian bytes.
 *
 * The SDK encodes straight to base64. The chain needs the raw bytes, because the audio
 * digest covers exactly what the finalize request carries, so this returns bytes and the
 * caller encodes them once.
 */
export function encodePcm16(samples: Float32Array): Uint8Array {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let index = 0; index < samples.length; index += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[index] ?? 0));
    view.setInt16(index * 2, Math.round(clamped * (clamped < 0 ? 0x8000 : 0x7fff)), true);
  }
  return new Uint8Array(buffer);
}

export function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}
