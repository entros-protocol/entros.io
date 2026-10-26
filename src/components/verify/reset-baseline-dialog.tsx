"use client";

import { useEffect, useRef } from "react";

import {
  dangerVerificationActionClass,
  secondaryVerificationActionClass,
} from "./verification-styles";

const RESET_CONSEQUENCES = [
  "Your on-chain commitment is overwritten with a fresh fingerprint from this capture.",
  "Verification count and Trust Score reset to zero. You rebuild them over time.",
  "Your wallet, Entros Anchor token, and SAS attestation are preserved.",
  "7-day cooldown before you can reset again.",
] as const;

/**
 * Confirmation overlay for `reset_identity_state`.
 *
 * Shown when the user's on-chain IdentityState exists but the local
 * baseline is unrecoverable. Makes the consequences of reset explicit
 * before the user signs the transaction—this is a reputation-destroying
 * operation and should not feel casual.
 */
export function ResetBaselineDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the Cancel button on open—safer default than Confirm for a
  // destructive action. Escape cancels, Tab stays inside the dialog, and
  // focus returns to the control that opened it.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>("button, a[href]"),
      );
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-baseline-dialog-title"
    >
      <div
        ref={panelRef}
        className="vc-slide relative w-full max-w-md border border-foreground/10 bg-background p-6"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-danger">
          Irreversible
        </p>
        <h2
          id="reset-baseline-dialog-title"
          className="mt-3 font-display text-2xl font-normal tracking-[-0.01em] text-foreground"
        >
          Reset baseline?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/65">
          Your Entros Anchor stays. Your on-chain commitment and verification
          history do not.
        </p>

        <ol className="mt-5 border-t border-foreground/[0.08]">
          {RESET_CONSEQUENCES.map((item, index) => (
            <li
              key={item}
              className="grid grid-cols-[2rem_1fr] border-b border-foreground/[0.08] py-2.5 text-sm leading-relaxed text-foreground/75"
            >
              <span className="font-mono text-[10px] leading-6 text-foreground/40">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={secondaryVerificationActionClass}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={dangerVerificationActionClass}
          >
            Reset baseline
          </button>
        </div>
      </div>
    </div>
  );
}
