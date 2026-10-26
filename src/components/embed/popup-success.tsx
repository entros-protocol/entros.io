"use client";

import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

import { STATE_ICON_CLASS, STATE_ICON_STROKE } from "@/components/verify/console";

// Matches PopupFailure timing for visual symmetry. Long enough for the
// user to register the confirmation; short enough that the post-12s-capture
// flow doesn't feel sluggish at the end.
const CLOSE_DELAY_MS = 2500;

const closePopupWindow = () => {
  if (typeof window !== "undefined") window.close();
};

/**
 * Success surface for the popup. Renders a brief confirmation, then closes
 * the window. The verified postMessage is emitted by the parent before
 * this surface mounts; the close is purely UX.
 *
 * `onClose` defaults to a module-stable `window.close` reference so the
 * timeout fires once at `CLOSE_DELAY_MS` regardless of how many times the
 * parent re-renders. Tests can pass a stub.
 */
export function PopupSuccess({
  onClose = closePopupWindow,
}: {
  onClose?: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, CLOSE_DELAY_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="space-y-6 text-center">
      <CheckCircle
        className={`mx-auto text-cyan ${STATE_ICON_CLASS}`}
        strokeWidth={STATE_ICON_STROKE}
        aria-hidden
      />
      <div>
        <h1 className="font-display text-3xl font-normal tracking-[-0.015em] text-foreground">
          Verified.
        </h1>
        <p className="mt-3 text-sm text-foreground/60">
          Returning you to the integrator...
        </p>
      </div>
      <div className="mx-auto h-[2px] w-40 overflow-hidden bg-foreground/10" aria-hidden>
        <div className="vc-close-timer h-full origin-left bg-cyan" />
      </div>
    </div>
  );
}
