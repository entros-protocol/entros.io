"use client";

/**
 * postMessage emitter for the embed/verify-popup route.
 *
 * Three verification events match the wire contract in `@entros/verify`:
 *
 *   - `entros/verified`  on successful verification
 *   - `entros/error`     on any failure (opaque categories only)
 *   - `entros/heartbeat` mid-pipeline progress signal
 *
 * The diagnostic event is an opt-in extension for registered observers.
 *
 * Each call sends a versioned envelope to `window.opener` with an
 * explicit `parent_origin` target. The browser enforces that the
 * message only delivers when the opener's actual origin matches —
 * never call with `"*"` as the target.
 */

import type {
  EmbedErrorReason,
  EmbedMessage,
  EmbedMessageType,
  EmbedProgressStatus,
  VerifiedPayload,
} from "./types";
import type { PolicyDiagnostic } from "./policy-diagnostics";
import type { PolicyReason } from "@entros/verify/policy";

export interface EmbedContext {
  /** The parent window's origin, parsed from the popup URL. */
  parentOrigin: string;
  /** The request ID the integrator generated when opening the popup. */
  requestId: string;
}

export function emitVerified(
  ctx: EmbedContext,
  payload: VerifiedPayload,
): void {
  postEnvelope(ctx, "entros/verified", payload);
}

export function emitError(
  ctx: EmbedContext,
  reason: EmbedErrorReason,
  policyReason?: PolicyReason,
): void {
  postEnvelope(ctx, "entros/error", {
    reason,
    ...(policyReason ? { policy_reason: policyReason } : {}),
  });
}

export function emitHeartbeat(
  ctx: EmbedContext,
  status: EmbedProgressStatus,
): void {
  postEnvelope(ctx, "entros/heartbeat", { status });
}

function postEnvelope<TPayload>(
  ctx: EmbedContext,
  type: EmbedMessageType,
  payload: TPayload,
): void {
  if (typeof window === "undefined") return;

  const opener = window.opener as Window | null;
  if (!opener) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[embed] window.opener unavailable; postMessage skipped",
      );
    }
    return;
  }

  const envelope: EmbedMessage<TPayload> = {
    version: 1,
    source: "entros",
    type,
    request_id: ctx.requestId,
    timestamp: Date.now(),
    payload,
  };

  opener.postMessage(envelope, ctx.parentOrigin);
}

export function emitPolicyDiagnostic(ctx: EmbedContext, diagnostic: PolicyDiagnostic): void {
  postEnvelope(ctx, "entros/policy-diagnostic", diagnostic);
}
