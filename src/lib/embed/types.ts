/**
 * Wire envelope and payload types for the embed/verify-popup route.
 *
 * Counterpart to the public types exported from `@entros/verify`. The
 * popup posts these envelopes back to the integrator's window via
 * postMessage. Field names use snake_case on the wire (`wallet_pubkey`)
 * to match the contract the consumer package validates against.
 *
 * The diagnostic event is an opt-in extension. The verification consumer
 * ignores it. Keep the verification envelopes aligned with `@entros/verify`.
 */

import type { PolicyReason, PolicyWireResult } from "@entros/verify/policy";

export type Cluster = "devnet";

export type EmbedMessageType =
  | "entros/verified"
  | "entros/error"
  | "entros/heartbeat"
  | "entros/policy-diagnostic";

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
  attestation_pda: string | null;
  tx_sig: string;
  trust_score: number;
  cluster: Cluster;
  policy?: PolicyWireResult;
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
  policy_reason?: PolicyReason;
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
