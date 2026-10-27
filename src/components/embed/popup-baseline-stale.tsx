"use client";

import { AlertCircle, ArrowUpRight } from "lucide-react";

import { STATE_ICON_CLASS, STATE_ICON_STROKE } from "@/components/verify/console";
import {
  accentVerificationActionClass,
  secondaryVerificationActionClass,
} from "@/components/verify/verification-styles";

/**
 * Failure surface for the stale-baseline case (on-chain `Custom(6011)`
 * `PrevCommitmentMismatch`). Distinct from `PopupFailure` because:
 *
 *   - It does not auto-close. Re-clicking the integrator's button won't
 *     resolve a stale baseline; the user has to reset on entros.io/verify
 *     first. We give them clear time to read and act.
 *   - It surfaces a primary action (open `/verify` in a new tab) and an
 *     explicit close button.
 *
 * The wire-level `EmbedErrorReason` emitted by the parent route is still
 * `validation_failed` — integrators don't need to handle a new bucket.
 * Only the popup-side UX changes.
 */

const closePopupWindow = () => {
  if (typeof window !== "undefined") window.close();
};

export function PopupBaselineStale({
  onClose = closePopupWindow,
}: {
  onClose?: () => void;
}) {
  return (
    <div className="space-y-7 text-center">
      <AlertCircle
        className={`mx-auto text-warning ${STATE_ICON_CLASS}`}
        strokeWidth={STATE_ICON_STROKE}
        aria-hidden
      />
      <div>
        <h1 className="font-display text-[1.75rem] font-normal leading-tight tracking-[-0.015em] text-foreground">
          Baseline out of sync
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-balance text-sm leading-relaxed text-foreground/65">
          This wallet&apos;s on-chain identity doesn&apos;t match the
          recovered baseline, usually after a reset on another device.
          Reset to re-enroll, then return here to verify.
        </p>
      </div>
      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onClose}
          className={secondaryVerificationActionClass}
        >
          Close
        </button>
        <a
          href="/verify"
          target="_blank"
          rel="noopener noreferrer"
          className={accentVerificationActionClass}
        >
          Reset baseline
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </a>
      </div>
    </div>
  );
}
