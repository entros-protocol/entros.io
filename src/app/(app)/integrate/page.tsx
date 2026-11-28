import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IntegrateGuide } from "@/components/sections/integrate-guide";
import { pageMetadata } from "@/lib/page-metadata";
import {
  buttonArrowClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/button-styles";

export const metadata = pageMetadata({
  title: "Integrate",
  description:
    "Drop the EntrosVerify component into any Solana app in five lines, or wire the Pulse SDK for custom UX. On-chain reads are free.",
  path: "/integrate",
});

export default function Integrate() {
  return (
    <>
      {/* Hero—centered, terminal install callout below the copy. */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pt-32 pb-12 text-center md:pt-40">
          <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Five lines<span className="text-cyan">.</span>
            <br />
            Every dApp on Solana<span className="text-cyan">.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
            Drop in <code className="font-mono text-cyan">{`<EntrosVerify />`}</code> for the five-line path, or wire the Pulse SDK for custom UX. Reading on-chain verification state is free and needs no account.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://github.com/entros-protocol/entros-verify"
              target="_blank"
              rel="noopener noreferrer"
              className={primaryButtonClass}
            >
              <span className="[text-box:trim-both_cap_alphabetic]">
                View on GitHub
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </a>
            <Link href="/verify" className={secondaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                Try the demo
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Install callout */}
        <div className="mx-auto max-w-3xl px-6 pb-20 md:pb-28">
          <div className="relative bg-surface px-6 py-5 font-mono text-sm forced-colors:border forced-colors:border-[CanvasText] md:px-8 md:py-6 md:text-base">

            <span className="text-muted">$</span>
            <span className="ml-3 text-foreground/90">npm install </span>
            <span className="text-cyan">@entros/verify</span>
            <span className="text-muted"> # or @entros/pulse-sdk for programmatic UX</span>
          </div>
        </div>
      </section>

      <IntegrateGuide />

      {/* Footer CTA */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Verified humans<span className="text-cyan">.</span>
            <br />
            Free for integrators<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/verify" className={primaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                Try the demo
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
            <Link href="/solutions" className={secondaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                See use cases
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
