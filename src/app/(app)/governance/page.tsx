import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GovernanceContent } from "@/components/sections/governance-content";
import { DevnetNotice } from "@/components/ui/devnet-notice";
import { FactStrip } from "@/components/ui/fact-strip";
import { pageMetadata } from "@/lib/page-metadata";
import {
  buttonArrowClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/button-styles";

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
          <DevnetNotice />

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
                <Link href="/verify" className={primaryButtonClass}>
                  <span className="[text-box:trim-both_cap_alphabetic]">
                    Verify and vote
                  </span>
                  <ArrowRight className={buttonArrowClass} aria-hidden="true" />
                </Link>
                <a
                  href="https://github.com/entros-protocol/entros-governance-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={secondaryButtonClass}
                >
                  <span className="[text-box:trim-both_cap_alphabetic]">
                    View on GitHub
                  </span>
                  <ArrowRight className={buttonArrowClass} aria-hidden="true" />
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
      <section>
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Verified humans<span className="text-cyan">.</span>
            <br />
            Verified votes<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/verify" className={primaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                Verify and vote
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
            <Link href="/integrate" className={secondaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                Read the docs
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
