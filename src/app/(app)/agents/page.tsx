import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AgentNetworkAnimation } from "@/components/ui/agent-network-animation";
import { AgentsContent } from "@/components/sections/agents-content";
import { AgentsCheckSection } from "@/components/sections/agents-check-section";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Agent Anchor",
  description:
    "Verify the human behind every AI agent on Solana. Link your Entros identity to your registered agents with immutable on-chain attestation.",
  path: "/agents",
});

export default function Agents() {
  return (
    <>
      {/* Hero—split layout. Network sphere is the page's visual
          signature; copy + CTAs sit to its left. */}
      <section>
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pt-28 pb-16 md:pt-36 md:pb-20 lg:flex-row lg:items-center lg:gap-16 lg:py-32">
          <div className="relative z-10 flex flex-col lg:w-1/2 lg:max-w-2xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // AGENT ANCHOR
            </span>

            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
              The human behind
              <br />
              every agent<span className="text-cyan">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
              Bind any registered AI agent on Solana to its verified
              human operator with one immutable on-chain attestation.
              Any platform reads it for free.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="/verify"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full bg-foreground px-6 py-3
                  text-sm font-medium text-background
                  transition-colors hover:bg-foreground/90
                "
              >
                Verify and link
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="#check"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full border border-foreground/20 px-6 py-3
                  text-sm font-medium text-foreground
                  transition-colors hover:border-foreground/40 hover:bg-foreground/5
                "
              >
                Check an agent
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* The sphere is square, so a width cap plus `aspect-square` sizes it
              on both axes. A fixed height cannot: `flex-1` resolves to
              `flex-basis: 0%`, which overrides `height` while this row is
              stacked, and leaves the box taller than its own column once the
              row splits at lg. */}
          <div className="relative flex flex-1 items-center justify-center lg:w-1/2">
            <AgentNetworkAnimation className="aspect-square w-full max-w-[400px] sm:max-w-[480px] lg:max-w-[560px]" />
          </div>
        </div>
      </section>

      <AgentsContent />
      <AgentsCheckSection />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            One human<span className="text-cyan">.</span>
            <br />
            All their agents<span className="text-cyan">.</span>
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
              Verify and link
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
              Read the docs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
