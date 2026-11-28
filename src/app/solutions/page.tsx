import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SolutionCasesSection } from "@/components/sections/solution-cases-section";
import { PartnersSection } from "@/components/sections/partners-section";
import { WalletField } from "@/components/ui/wallet-field";
import { pageMetadata } from "@/lib/page-metadata";
import {
  buttonArrowClass,
  primaryButtonClass,
  secondaryButtonClass,
  secondaryButtonOnSurfaceClass,
} from "@/components/ui/button-styles";

export const metadata = pageMetadata({
  title: "Solutions",
  description:
    "Entros use cases: sybil-resistant airdrops, verified governance, fair mints, creator verification, bot prevention.",
  path: "/solutions",
});

export default function Solutions() {
  return (
    <>
      {/* Hero: copy left, a field of wallets right in which wallets are
          checked one at a time and light up as verified. */}
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 pt-32 pb-24 md:pt-40 md:pb-32 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-center lg:gap-12 xl:grid-cols-[minmax(0,1fr)_520px]">
          <div>
            <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
              Built for apps that need real people<span className="text-cyan">.</span>
            </h1>

            <p className="mt-12 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg">
              For protocols that need to know their users are real,
              without learning who they are. Five concrete patterns,
              one SDK.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link href="/integrate" className={primaryButtonClass}>
                <span className="[text-box:trim-both_cap_alphabetic]">
                  Start integrating
                </span>
                <ArrowRight className={buttonArrowClass} aria-hidden="true" />
              </Link>
              <Link href="/verify" className={secondaryButtonClass}>
                <span className="[text-box:trim-both_cap_alphabetic]">
                  Try the demo
                </span>
                <ArrowRight className={buttonArrowClass} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <WalletField className="mx-auto w-full max-w-[320px] sm:max-w-[400px] lg:max-w-none" />
        </div>
      </section>

      <SolutionCasesSection />
      <PartnersSection />

      {/* Modality comparison cross-link */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="flex flex-col items-start justify-between gap-6 bg-surface p-6 forced-colors:border forced-colors:border-[CanvasText] md:flex-row md:items-center md:p-8">
            <div className="max-w-2xl">
              <h2 className="font-display text-2xl font-normal tracking-tight text-foreground md:text-3xl">
                Evaluating verification modalities
                <span className="text-cyan">?</span>
              </h2>
              <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted md:text-base">
                Compare anatomical, credential, KYC, and behavioral evidence
                across Integrator Policy v1 primitives with dated primary
                sources and explicit limits.
              </p>
            </div>
            <Link
              href="/compare"
              className={`shrink-0 ${secondaryButtonOnSurfaceClass}`}
            >
              <span className="[text-box:trim-both_cap_alphabetic]">
                Compare modalities
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Verify once<span className="text-cyan">.</span>
            <br />
            Compose anywhere<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/integrate" className={primaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                Start integrating
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
    </>
  );
}
