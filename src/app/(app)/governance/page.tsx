import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GovernanceContent } from "@/components/sections/governance-content";
import { FactStrip } from "@/components/ui/fact-strip";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Governance Plugin",
  description:
    "Human-verified governance for Solana DAOs. A Realms voter-weight plugin gates votes on Entros verification, designed to keep bots, scripts, and dormant wallets out.",
  path: "/governance",
});

export default function Governance() {
  return (
    <>
      {/* Hero: headline left, copy and actions right on a shared
          baseline, closed by a strip of plugin facts. */}
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 md:pt-40">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
            <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:col-span-7 lg:text-7xl">
              Proof of presence<span className="text-cyan">,</span>
              <br />
              on every vote<span className="text-cyan">.</span>
            </h1>

            <div className="lg:col-span-5">
              <p className="max-w-md text-base leading-relaxed text-foreground/70 md:text-lg">
                A Realms voter-weight plugin that gives weight only to wallets
                with a recent Entros verification.
              </p>

              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/verify"
                  className="
                group inline-flex items-center justify-center gap-2
                bg-foreground px-6 py-3
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
                border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
                >
                  View on GitHub
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>

          <FactStrip
            facts={[
              { label: "Program", value: "Devnet prototype" },
              { label: "Checks", value: "Trust Score and recency" },
              { label: "Voter weight", value: "1 per eligible Anchor" },
              { label: "Works with", value: "spl-governance v3.x" },
            ]}
          />
        </div>
      </section>

      <GovernanceContent />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Verified humans<span className="text-cyan">.</span>
            <br />
            Verified votes<span className="text-cyan">.</span>
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
              Verify and vote
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/integrate"
              className="
                group inline-flex items-center justify-center gap-2
                border border-foreground/20 px-6 py-3
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
