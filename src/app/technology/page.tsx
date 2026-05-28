import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AsciiFingerprint } from "@/components/ui/ascii-fingerprint";
import { VerificationTimelineSection } from "@/components/sections/verification-timeline-section";
import { ProtocolComponentsSection } from "@/components/sections/protocol-components-section";
import { PrivacySection } from "@/components/sections/privacy-section";
import { SecurityModelSection } from "@/components/sections/security-model-section";
import { VerificationModesSection } from "@/components/sections/verification-modes-section";
import { ResearchValidationSection } from "@/components/sections/research-validation-section";
import { FAQSection } from "@/components/sections/faq-section";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Technology",
  description:
    "How Entros verification works. Twelve seconds of speaking and tracing—feature extraction, ZK proof generation, and on-chain verification run automatically. Raw recordings are processed locally and never stored.",
  path: "/technology",
});

export default function Technology() {
  return (
    <>
      {/* Hero—split layout. Copy and CTAs on the left, fingerprint on
          the right. The cryptographic-loop subheading frames the page;
          the verification-flow section below carries the timing detail. */}
      <section>
        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 pt-28 pb-6 md:pt-36 md:pb-12 lg:min-h-[calc(100vh-4rem)] lg:flex-row lg:items-center lg:gap-12 lg:pt-24 lg:pb-24">
          <div className="relative z-10 flex flex-col lg:w-3/5 lg:max-w-3xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // HOW IT WORKS
            </span>

            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
              From challenge
              <br />
              to on-chain proof<span className="text-cyan">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
              A signed challenge in, a zero-knowledge proof out. The
              pipeline runs on your device, end to end—the protocol
              never sees the signal that produced the answer.
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
                Try the Demo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/paper"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full border border-foreground/20 px-6 py-3
                  text-sm font-medium text-foreground
                  transition-colors hover:border-foreground/40 hover:bg-foreground/5
                "
              >
                Read the paper
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <div className="relative flex h-[280px] flex-1 items-center justify-center sm:h-[360px] md:h-[400px] lg:h-[440px] lg:w-2/5 xl:h-[480px]">
            <AsciiFingerprint />
          </div>
        </div>
      </section>

      <VerificationTimelineSection />
      <ProtocolComponentsSection />
      <PrivacySection />
      <SecurityModelSection />
      <VerificationModesSection />
      <ResearchValidationSection />
      <FAQSection />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Raw data on your device.
            <br />
            Proof on the chain<span className="text-cyan">.</span>
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
              Try the Demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/solutions"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              See use cases
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
