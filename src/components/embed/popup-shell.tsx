import Link from "next/link";
import type { ReactNode } from "react";

import { EntrosMark } from "@/components/layout/entros-mark";
import { verificationFocusRing } from "@/components/verify/verification-styles";
import { CloseButton } from "./close-button";

/**
 * Layout chrome for popup-host pages under /embed/*.
 *
 * Server component. Wraps the popup content in header and footer with
 * a single client island for the close button. Uses the whole-pixel
 * EntrosMark lockup at 24px (18px mark) and keeps the footer minimal.
 */
export function PopupShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col bg-background">
      <header className="flex items-center justify-between border-b border-foreground/[0.07] px-5 py-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily:
              "var(--font-wordmark), 'JetBrains Mono', ui-monospace, monospace",
          }}
          className={`inline-flex items-baseline text-2xl tracking-tight text-foreground transition-opacity hover:opacity-80 ${verificationFocusRing}`}
          aria-label="Entros home"
        >
          <EntrosMark className="mr-1.5 size-[0.75em] shrink-0" />
          <span aria-hidden>Entros</span>
        </Link>
        <CloseButton />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="border-t border-foreground/[0.07] px-5 py-3 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/30">
          powered by entros.io
        </span>
      </footer>
    </div>
  );
}
