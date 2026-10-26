"use client";

import { X } from "lucide-react";

import { verificationFocusRing } from "@/components/verify/verification-styles";

/**
 * Tiny client component for the popup close button. Extracted so the
 * surrounding `PopupShell` can stay a server component while the close
 * action (which needs `window.close`) remains client-side.
 */
export function CloseButton() {
  return (
    <button
      type="button"
      onClick={() => window.close()}
      className={`flex h-9 w-9 items-center justify-center border border-foreground/12 text-foreground/55 transition-colors hover:border-foreground/40 hover:text-foreground ${verificationFocusRing}`}
      aria-label="Close"
    >
      <X className="h-4 w-4" strokeWidth={2} />
    </button>
  );
}
