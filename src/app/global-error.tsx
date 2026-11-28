"use client";

/**
 * Top-level Next.js error boundary. Catches any uncaught error that
 * escapes route-segment boundaries (including errors thrown during root
 * layout rendering) and presents a static, brand-safe fallback instead
 * of React's default error UI.
 *
 * Scope: the verification flow already routes known error classes
 * through its own categorizer and dispatches sanitized strings to the
 * failure modal. This boundary is strictly defense-in-depth for the
 * residual class of bugs — uncaught render errors, third-party SDK
 * exceptions, or future code paths that haven't yet been categorized —
 * so the user never sees a raw stack trace or a white screen.
 *
 * Next.js requires `global-error.tsx` to render its own `<html>` and
 * `<body>` because it replaces the root layout when triggered.
 */

import { AlertCircle } from "lucide-react";
import { primaryButtonClass } from "@/components/ui/button-styles";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        <main className="flex min-h-[100svh] items-center justify-center px-6">
          <div className="max-w-md space-y-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-danger" strokeWidth={1.5} />
            <div>
              <h1 className="font-sans text-2xl font-normal">
                Something unexpected happened
              </h1>
              <p className="mt-2 text-sm text-muted">
                The page hit an error. Reload it to try again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => reset()}
              className={primaryButtonClass}
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
