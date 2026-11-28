import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AgentNetworkAnimation } from "@/components/ui/agent-network-animation";
import { AgentAuthorize } from "@/components/sections/agent-authorize";
import { AgentsContent } from "@/components/sections/agents-content";
import { AgentsCheckSection } from "@/components/sections/agents-check-section";
import { pageMetadata } from "@/lib/page-metadata";
import {
  buttonArrowClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/button-styles";

export const metadata = pageMetadata({
  title: "Agent Operator Permit",
  description:
    "An Agent Operator Permit lets an app say yes to your agent for one action. You sign it with the owning wallet, and the app checks it and your Entros verification on devnet.",
  path: "/agents",
});

export default function Agents() {
  return (
    <>
      {/* An agent's link replaces the hero with the signing section. Otherwise the hero keeps its
          split layout: copy and CTAs to the left of the network sphere. */}
      <AgentAuthorize>
        <section>
          <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pt-28 pb-16 md:pt-36 md:pb-20 lg:flex-row lg:items-center lg:gap-16 lg:py-32">
            <div className="relative z-10 flex flex-col lg:w-1/2 lg:max-w-2xl">
              <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
                Your agent acts<span className="text-cyan">.</span>
                <br />
                You approve<span className="text-cyan">.</span>
              </h1>

              <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
                An Agent Operator Permit lets an app say yes to an agent for one
                action. You sign it with the owning wallet, and the app checks
                it and your Entros verification on devnet.
              </p>

              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/docs/integrate/agent-permit"
                  className={primaryButtonClass}
                >
                  <span className="[text-box:trim-both_cap_alphabetic]">
                    Integration guide
                  </span>
                  <ArrowRight className={buttonArrowClass} aria-hidden="true" />
                </Link>
                <Link href="#check" className={secondaryButtonClass}>
                  <span className="[text-box:trim-both_cap_alphabetic]">
                    Check an agent
                  </span>
                  <ArrowRight className={buttonArrowClass} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* The sphere is square, so a width cap plus `aspect-square` sizes it
                on both axes. */}
            <div className="relative flex flex-1 items-center justify-center lg:w-1/2">
              <AgentNetworkAnimation className="aspect-square w-full max-w-[400px] sm:max-w-[480px] lg:max-w-[560px]" />
            </div>
          </div>
        </section>
      </AgentAuthorize>

      <AgentsContent />
      <AgentsCheckSection />

      {/* Footer CTA */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Let your agent act on a permit you signed<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/verify" className={primaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                Verify with Entros
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
            <Link
              href="/docs/integrate/agent-permit"
              className={secondaryButtonClass}
            >
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
