/**
 * Wire envelope and payload types for the embed/verify-popup route.
 *
 * Counterpart to the public types exported from `@entros/verify`. The
 * popup posts these envelopes back to the integrator's window via
 * postMessage. Field names use snake_case on the wire (`wallet_pubkey`)
 * to match the contract the consumer package validates against.
 *
 * Any drift between this file and `@entros/verify`'s `types.ts` will
 * cause silent message rejection on the consumer side. Keep them aligned.
 */

export type Cluster = "devnet";

export type EmbedMessageType =
  | "entros/verified"
  | "entros/error"
  | "entros/heartbeat";

export interface EmbedMessage<TPayload = unknown> {
  version: 1;
  source: "entros";
  type: EmbedMessageType;
  request_id: string;
  timestamp: number;
  payload: TPayload;
}

export interface VerifiedPayload {
  wallet_pubkey: string;
  attestation_pda: string;
  tx_sig: string;
  trust_score: number;
  cluster: Cluster;
}

export type EmbedErrorReason =
  | "wallet_rejected"
  | "validation_failed"
  | "network_error"
  | "user_canceled"
  | "origin_invalid"
  | "popup_blocked"
  | "timeout"
  | "unknown";

export interface ErrorPayload {
  reason: EmbedErrorReason;
}

export type EmbedProgressStatus =
  | "wallet_connecting"
  | "capturing"
  | "proving"
  | "submitting"
  | "attesting";

export interface HeartbeatPayload {
  status: EmbedProgressStatus;
}
