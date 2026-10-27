import Link from "next/link";
import type { ReactNode } from "react";

import { CloseButton } from "./close-button";

/**
 * Layout chrome for popup-host pages under /embed/*.
 *
 * Server component. Wraps the popup content in header + footer with
 * a single client island for the close button. Keeps the popup
 * minimal: small wordmark, a close affordance, the slot, and a
 * tiny "powered by entros.io" footer.
 *
 * The wordmark links to the entros.io home page and matches the
 * canonical typography defined in `layout/navbar-wordmark.tsx`:
 * lowercase glyph, `--font-wordmark` family, square cyan dot scaled
 * to the popup's 20px text size.
 */
export function PopupShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col bg-background">
      <header className="flex items-center justify-between border-b border-foreground/[0.07] px-5 py-3">
        <Link
          href="/"
          style={{ fontFamily: "var(--font-wordmark)" }}
          className="inline-flex items-baseline text-3xl tracking-tight text-foreground transition-opacity hover:opacity-80"
          aria-label="entros — home"
        >
          <span aria-hidden>entros</span>
          <span
            aria-hidden
            className="ml-1 inline-block size-[4px] bg-cyan"
          />
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
