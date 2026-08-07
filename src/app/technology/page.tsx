import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AsciiFingerprint } from "@/components/ui/ascii-fingerprint";
import { VerificationTimelineSection } from "@/components/sections/verification-timeline-section";
import { ProtocolComponentsSection } from "@/components/sections/protocol-components-section";
import { PrivacySection } from "@/components/sections/privacy-section";
import { SecurityModelSection } from "@/components/sections/security-model-section";
import { VerificationModesSection } from "@/components/sections/verification-modes-section";
import { ResearchValidationSection } from "@/components/sections/research-validation-section";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Technology",
  description:
    "Speaking and tracing produce local feature extraction and ZK proofs. Raw motion and full-resolution touch stay on the device.",
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
              Capture, feature extraction, and proof generation all run on
              your device. The validation path receives a statistical summary
              and transient challenge evidence. Solana stores protocol state,
              commitments, and proofs.
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

          {/* Below lg this row is stacked, so `flex-1` resolves to
              `flex-basis: 0%` and overrides any height set here. The box takes
              the glyph block's own height instead. The lg and xl heights do
              apply, and reserve the band the print is centred in. */}
          <div className="relative flex flex-1 items-center justify-center lg:h-[580px] lg:w-2/5 xl:h-[640px]">
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

      {/* Calls to action, no closing headline. No border or top padding:
          the research section's own bottom padding sets the gap, so these
          read as the tail of that section rather than a separate band. */}
      <section>
        <div className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-start">
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
