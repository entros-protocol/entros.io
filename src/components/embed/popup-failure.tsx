"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

import type { EmbedErrorReason } from "@/lib/embed/types";
import type { PolicyReason } from "@entros/verify/policy";

const CLOSE_DELAY_MS = 2500;

/**
 * Per-reason copy for the popup's failure surface. Body text is opaque —
 * never names what was measured or which check rejected. The user's next
 * step is always "try again from the integrator" because the popup is
 * one-shot by design (no in-popup retry surface).
 */
const REASON_COPY: Record<EmbedErrorReason, { title: string; body: string }> = {
  wallet_rejected: {
    title: "Verification canceled",
    body: "The wallet didn't complete the request.",
  },
  validation_failed: {
    title: "Verification failed",
    body: "Try again from the integrator.",
  },
  network_error: {
    title: "Network error",
    body: "Couldn't reach the verification service.",
  },
  user_canceled: {
    title: "Canceled",
    body: "Try again from the integrator.",
  },
  origin_invalid: {
    title: "Origin not recognized",
    body: "This integration isn't authorized.",
  },
  popup_blocked: {
    title: "Popup blocked",
    body: "Allow popups for this site.",
  },
  timeout: {
    title: "Timed out",
    body: "Try again from the integrator.",
  },
  unknown: {
    title: "Something went wrong",
    body: "Try again from the integrator.",
  },
};

const closePopupWindow = () => {
  if (typeof window !== "undefined") window.close();
};

const POLICY_COPY: Partial<Record<PolicyReason, { title: string; body: string }>> = {
  score_below_minimum: {
    title: "App requirements not met",
    body: "This app requires a higher Trust Score.",
  },
  verification_stale: {
    title: "A recent verification is required",
    body: "Return to the app to verify again.",
  },
  attestation_required: {
    title: "Attestation not available",
    body: "This app requires an on-chain attestation. Return to the app to try again.",
  },
  state_unavailable: {
    title: "Could not confirm verification",
    body: "The on-chain result is unavailable. Return to the app to try again.",
  },
};

/**
 * Failure surface for the popup. Renders an opaque category title + body,
 * then closes the window. The error postMessage is emitted by the parent
 * before this surface mounts; the close is purely UX.
 *
 * `onClose` defaults to a module-stable `window.close` reference so the
 * timeout fires once at `CLOSE_DELAY_MS` regardless of how many times the
 * parent re-renders. Tests can pass a stub.
 */
export function PopupFailure({
  reason,
  policyReason,
  onClose = closePopupWindow,
}: {
  reason: EmbedErrorReason;
  policyReason?: PolicyReason;
  onClose?: () => void;
}) {
  const { title, body } = (policyReason && POLICY_COPY[policyReason]) || REASON_COPY[reason];

  useEffect(() => {
    const t = setTimeout(onClose, CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="text-center space-y-4">
      <AlertCircle className="mx-auto h-12 w-12 text-danger" />
      <p className="font-mono text-sm text-foreground">{title}</p>
      <p className="text-xs text-foreground/55">{body}</p>
    </div>
  );
}
