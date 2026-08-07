import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AsciiFlow } from "@/components/ui/ascii-flow";
import { TokenContent } from "@/components/sections/token-content";
import { TokenLaunchCard } from "@/components/sections/token-launch-card";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Token",
  description:
    "Current protocol fees, fair-launch details, and the planned $ENTROS utility roadmap.",
  path: "/token",
});

export default function Token() {
  return (
    <>
      {/* Hero—centered, ASCII orbit full-width below the copy. */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pt-32 pb-2 text-center md:pt-40">
          {/* Breaks are set per breakpoint rather than left to wrapping.
              Desktop keeps its "The economic layer / of verified humanity."
              split. Below md the phrase is broken explicitly so it reads
              "The economic / layer of / verified / humanity."

              The breaks only hold if the longest of those rows fits. At
              48px "The economic" measures ~302px against a 298px column on
              a 390px phone, so below md the size is fluid: "The economic"
              runs ~6.29x the font size and the column is `100vw - 92px`,
              which is what the slope solves for. It reaches the full 3rem
              by ~400px and never exceeds it. md and up are untouched. */}
          <h1 className="font-display text-[clamp(2rem,calc(15.2vw_-_14px),3rem)] font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            The economic{" "}
            <br className="md:hidden" />
            layer{" "}
            <br className="hidden md:inline" />
            of{" "}
            <br className="md:hidden" />
            verified humanity<span className="text-cyan">.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
            {/* Bound so "revenue." never wraps away from what it belongs to. */}
            Protocol fees today. Validator utility after hardening.
            <br />
            $ENTROS is planned to support staking, capacity, and governance.
          </p>

          <TokenLaunchCard />
        </div>

        <div className="flex h-[225px] items-start justify-center pb-4 sm:h-[270px] md:h-[300px] md:pb-6 lg:h-[330px] xl:h-[360px]">
          <AsciiFlow
            brand="$ENTROS"
            className="text-[5px] sm:text-[6px] md:text-[7px] lg:text-[8px] xl:text-[9px]"
          />
        </div>
      </section>

      <TokenContent />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            $ENTROS
            <br />
            Built to secure human verification<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Try the demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/stats"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              See live stats
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
