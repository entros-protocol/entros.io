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
          className={`inline-flex min-h-11 items-center text-2xl tracking-tight text-foreground transition-opacity duration-150 hover:opacity-80 motion-reduce:transition-none ${verificationFocusRing}`}
        >
          <EntrosMark className="mr-1.5 size-[0.75em] shrink-0" />
          <span className="[text-box:trim-both_cap_alphabetic]">Entros</span>
          <span className="sr-only"> home</span>
        </Link>
        <CloseButton />
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="bg-surface px-5 py-3 text-center">
        <span className="font-mono text-xs text-muted">
          powered by entros.io
        </span>
      </footer>
    </div>
  );
}
