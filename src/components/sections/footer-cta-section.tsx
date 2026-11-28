import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  buttonArrowClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/button-styles";

/**
 * Footer CTA: the closing statement before the global footer, with the
 * demo as the primary action and the technology page beside it.
 */
export function FooterCTASection() {
  return (
    <section>
      <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
        <h2 className="text-balance font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
          Private human verification<span className="text-cyan">.</span>
        </h2>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/verify" className={primaryButtonClass}>
            <span className="[text-box:trim-both_cap_alphabetic]">
              Try the Demo
            </span>
            <ArrowRight className={buttonArrowClass} aria-hidden="true" />
          </Link>
          <Link href="/technology" className={secondaryButtonClass}>
            <span className="[text-box:trim-both_cap_alphabetic]">
              How it works
            </span>
            <ArrowRight className={buttonArrowClass} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
