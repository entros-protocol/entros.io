"use client";

import { AlertCircle } from "lucide-react";

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
    <div className="space-y-5 text-center">
      <AlertCircle
        className="mx-auto h-12 w-12 text-amber-500"
        strokeWidth={1.5}
      />
      <div>
        <p className="font-mono text-sm text-foreground">
          Baseline out of sync
        </p>
        <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-foreground/55">
          This wallet&apos;s on-chain identity doesn&apos;t match the
          recovered baseline—usually after a reset on another device.
          Reset to re-enroll, then return here to verify.
        </p>
      </div>
      <div className="flex flex-col-reverse items-center gap-2 sm:flex-row sm:justify-center">
        <button
          onClick={onClose}
          className="rounded-full border border-border px-5 py-2 text-xs text-foreground/65 transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Close
        </button>
        <a
          href="/verify"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-cyan/30 bg-cyan/10 px-5 py-2 text-xs font-medium text-cyan transition-colors hover:bg-cyan/20"
        >
          Reset baseline →
        </a>
      </div>
    </div>
  );
}
