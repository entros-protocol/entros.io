import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GovernanceContent } from "@/components/sections/governance-content";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Governance Plugin",
  description:
    "Human-verified governance for Solana DAOs. A Realms voter-weight plugin gating votes on Entros verification. Bots, scripts, and dormant wallets stay out.",
  path: "/governance",
});

export default function Governance() {
  return (
    <>
      {/* Hero—centered editorial. The body sections carry the visual
          story (before/after, plugin chaining, registrar parameters). */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pt-32 pb-24 text-center md:pt-40 md:pb-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // GOVERNANCE PLUGIN
          </span>

          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Proof of presence<span className="text-cyan">,</span>
            <br />
            on every vote<span className="text-cyan">.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-foreground/70 md:text-lg">
            A Realms voter-weight plugin gating governance on a recent,
            live behavioral verification. Each vote pays a presence
            cost in time and SOL. Dormant wallets, scripted delegations,
            and unattended agents stay out.{" "}
            <span className="block">spl-governance compatible.</span>
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
              Verify and vote
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="https://github.com/entros-protocol/entros-governance-plugin"
              target="_blank"
              rel="noopener noreferrer"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              View on GitHub
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>

      <GovernanceContent />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Verified humans<span className="text-cyan">.</span>
            <br />
            Verified votes<span className="text-cyan">.</span>
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
              Verify and vote
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
