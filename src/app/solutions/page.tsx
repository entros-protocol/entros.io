import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SolutionCasesSection } from "@/components/sections/solution-cases-section";
import { PartnersSection } from "@/components/sections/partners-section";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Solutions",
  description:
    "Entros use cases: sybil-resistant airdrops, verified governance, fair mints, creator verification, bot prevention.",
  path: "/solutions",
});

export default function Solutions() {
  return (
    <>
      {/* Hero — editorial typography, no visual element on the right.
          The other pages lead with animation, diagram, or stat panel;
          this one lets the headline carry the weight, since the use
          cases below ARE the visual story. */}
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-24 md:pt-40 md:pb-32">
          <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Proof of personhood<span className="text-cyan">,</span>
            <br />
            wherever bots break things<span className="text-cyan">.</span>
          </h1>

          <p className="mt-12 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            For protocols that need to know their users are real,
            without learning who they are. Five concrete patterns,
            one SDK.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Link
              href="/integrate"
              className="
                group inline-flex items-center justify-center gap-2
                bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Start integrating
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Try the demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      <SolutionCasesSection />
      <PartnersSection />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Verify once<span className="text-cyan">.</span>
            <br />
            Compose anywhere<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/integrate"
              className="
                group inline-flex items-center justify-center gap-2
                bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Start integrating
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
    </>
  );
}
