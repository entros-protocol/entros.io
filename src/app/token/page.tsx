import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AsciiFlow } from "@/components/ui/ascii-flow";
import { TokenContent } from "@/components/sections/token-content";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Token",
  description:
    "Entros Token economics. Protocol fees, revenue flywheel, validator staking, and fair launch details.",
  path: "/token",
});

export default function Token() {
  return (
    <>
      {/* Hero—centered, ASCII orbit full-width below the copy. */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pt-32 pb-2 text-center md:pt-40">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
            // ENTROS TOKEN
          </span>

          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            The economic layer
            <br />
            of verified humanity<span className="text-cyan">.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
            Protocol fees, validator staking, treasury revenue. The Entros
            token is the economic substrate that turns genuine verification
            demand into network security.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
              href="/integrate"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Integrate
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="flex h-[225px] items-start justify-center pb-4 sm:h-[270px] md:h-[300px] md:pb-6 lg:h-[330px] xl:h-[360px]">
          <AsciiFlow className="text-[5px] sm:text-[6px] md:text-[7px] lg:text-[8px] xl:text-[9px]" />
        </div>
      </section>

      <TokenContent />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Verification volume<span className="text-cyan">.</span>
            <br />
            Token value<span className="text-cyan">.</span>
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
