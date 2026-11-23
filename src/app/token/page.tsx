import Link from "next/link";
import { TokenContent } from "@/components/sections/token-content";
import { TokenLaunchCard } from "@/components/sections/token-launch-card";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Token Record",
  description:
    "Factual on-chain record for the $ENTROS SPL mint, Streamflow lockups, and separation from Entros security products.",
  path: "/token",
});

export default function Token() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-5xl px-6 pt-32 pb-16 text-center md:pt-40 md:pb-24">
          <h1 className="text-balance font-display text-4xl font-normal leading-[1.04] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            $ENTROS token record
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-muted md:mt-8 md:text-lg">
            $ENTROS is a fixed-supply SPL mint launched on July 30, 2026. It has
            zero coupling to Entros security products, API billing, or
            engineering roadmaps.
          </p>

          <TokenLaunchCard />
        </div>
      </section>

      <TokenContent />

      <section className="bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <h2 className="text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Explore Entros engineering
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/security"
              className="inline-flex items-center justify-center bg-foreground px-6 py-3 text-sm font-medium text-background transition-[background-color,transform] duration-150 ease-out hover:bg-foreground/90 active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none"
            >
              Security Program
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center bg-background px-6 py-3 text-sm font-medium text-foreground transition-[background-color,transform] duration-150 ease-out hover:bg-surface-hover active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none"
            >
              Developer Docs
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
