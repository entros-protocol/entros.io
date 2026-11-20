"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, ArrowUpRight, ExternalLink } from "lucide-react";

import { STATE_ICON_CLASS, STATE_ICON_STROKE } from "@/components/verify/console";
import {
  accentVerificationActionClass,
  secondaryVerificationActionClass,
} from "@/components/verify/verification-styles";

import type { EmbedErrorReason } from "@/lib/embed/types";
import type { PolicyReason } from "@entros/verify/policy";

const CLOSE_DELAY_MS = 2500;

export interface PopupRecoveryDetail {
  title: string;
  body: string;
  cta?: {
    label: string;
    href: string;
    external?: boolean;
  };
  /** Keep the window open when the user must read guidance or click a recovery link. */
  stayOpen?: boolean;
}

/**
 * Per-reason copy for the popup's failure surface. Body text stays opaque and
 * never names internal detection checks.
 */
const REASON_COPY: Record<EmbedErrorReason, { title: string; body: string }> = {
  wallet_rejected: {
    title: "Verification canceled",
    body: "The wallet did not complete the request. Return to the app to try again.",
  },
  validation_failed: {
    title: "Verification failed",
    body: "Return to the app to try again.",
  },
  network_error: {
    title: "Network error",
    body: "Could not reach the verification service. Return to the app to try again.",
  },
  user_canceled: {
    title: "Canceled",
    body: "Return to the app to try again.",
  },
  origin_invalid: {
    title: "Origin not recognized",
    body: "This app is not authorized to open verification.",
  },
  popup_blocked: {
    title: "Popup blocked",
    body: "Allow popups for this site, then return to the app to try again.",
  },
  timeout: {
    title: "Timed out",
    body: "Return to the app to try again.",
  },
  unknown: {
    title: "Something went wrong",
    body: "Return to the app to try again.",
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
 * Failure surface for the popup. Renders an opaque category or client-local
 * recovery guidance, then closes automatically unless user action is needed.
 */
export function PopupFailure({
  reason,
  policyReason,
  recovery,
  onClose = closePopupWindow,
}: {
  reason: EmbedErrorReason;
  policyReason?: PolicyReason;
  recovery?: PopupRecoveryDetail;
  onClose?: () => void;
}) {
  const { title, body } =
    recovery ??
    (policyReason && POLICY_COPY[policyReason]) ??
    REASON_COPY[reason];
  const stayOpen = recovery?.stayOpen === true;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (stayOpen) return;
    const t = setTimeout(onClose, CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, [onClose, stayOpen]);

  return (
    <div className="space-y-6 text-center">
      <AlertCircle
        className={`mx-auto text-danger ${STATE_ICON_CLASS}`}
        strokeWidth={STATE_ICON_STROKE}
        aria-hidden
      />
      <div>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-[1.75rem] font-normal leading-tight tracking-[-0.015em] text-foreground outline-none"
        >
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-balance text-sm leading-relaxed text-foreground/65">
          {body}
        </p>
      </div>
      {stayOpen ? (
        <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            className={secondaryVerificationActionClass}
          >
            Close
          </button>
          {recovery?.cta && (
            <a
              href={recovery.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={accentVerificationActionClass}
            >
              {recovery.cta.label}
              {recovery.cta.external ? (
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              )}
            </a>
          )}
        </div>
      ) : (
        <div className="mx-auto h-[2px] w-40 overflow-hidden bg-foreground/10" aria-hidden>
          <div className="vc-close-timer h-full origin-left bg-danger/70" />
        </div>
      )}
    </div>
  );
}
