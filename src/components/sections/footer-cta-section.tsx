import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Footer CTA: the closing statement before the global footer, with the
 * demo as the primary action and the technology page beside it.
 */
export function FooterCTASection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
        <h2 className="text-balance font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
          Private human verification<span className="text-cyan">.</span>
        </h2>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/verify"
            className="
              group inline-flex items-center justify-center gap-2
              bg-foreground px-6 py-3
              text-sm font-medium text-background
              transition-colors hover:bg-foreground/90
            "
          >
            Try the Demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/technology"
            className="
              group inline-flex items-center justify-center gap-2
              border border-foreground/20 px-6 py-3
              text-sm font-medium text-foreground
              transition-colors hover:border-foreground/40 hover:bg-foreground/5
            "
          >
            How it works
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
