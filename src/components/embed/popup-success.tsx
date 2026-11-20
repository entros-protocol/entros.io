"use client";

import { useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";

import { STATE_ICON_CLASS, STATE_ICON_STROKE } from "@/components/verify/console";

const CLOSE_DELAY_MS = 2500;

const closePopupWindow = () => {
  if (typeof window !== "undefined") window.close();
};

/**
 * Success surface for the popup. Renders a brief confirmation, then closes
 * the window after the verified postMessage has been emitted.
 */
export function PopupSuccess({
  detail,
  onClose = closePopupWindow,
}: {
  detail?: string;
  onClose?: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

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
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="font-display text-3xl font-normal tracking-[-0.015em] text-foreground outline-none"
        >
          Verified.
        </h1>
        {detail && (
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-foreground/75">
            {detail}
          </p>
        )}
        <p className="mt-3 text-sm text-foreground/60">
          Returning you to the app...
        </p>
      </div>
      <div className="mx-auto h-[2px] w-40 overflow-hidden bg-foreground/10" aria-hidden>
        <div className="vc-close-timer h-full origin-left bg-cyan" />
      </div>
    </div>
  );
}
