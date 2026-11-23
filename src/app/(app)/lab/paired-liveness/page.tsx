import Link from "next/link";
import { VerifyFlow } from "@/components/sections/verify-flow";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Paired Liveness Lab",
  description:
    "Experimental Solana devnet paired voice, touch, and motion browser liveness prototype.",
  path: "/lab/paired-liveness",
});

export default function PairedLivenessLab() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-12 text-center md:pt-40 md:pb-16">
          <h1 className="font-display text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-foreground text-balance md:text-6xl lg:text-7xl">
            One-Shot Browser Liveness Lab
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-balance text-base leading-relaxed text-muted md:mt-8 md:text-lg">
            Solana devnet prototype. Runs three short paired rounds of voice,
            touch, and motion, then one wallet signature.
          </p>

          <div
            role="note"
            className="mx-auto mt-8 max-w-2xl bg-surface px-4 py-3 text-left text-sm leading-6 text-muted"
          >
            <p>
              Secondary R&amp;D surface on Solana devnet.{" "}
              <Link
                href="/verify"
                className="font-medium text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
              >
                /verify
              </Link>{" "}
              and{" "}
              <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
                /embed/verify-popup
              </code>{" "}
              stay live for{" "}
              <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
                @entros/verify@0.7.0
              </code>{" "}
              and{" "}
              <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
                @entros/pulse-sdk@4.18.1
              </code>{" "}
              compatibility. See the{" "}
              <Link
                href="/roadmap"
                className="font-medium text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
              >
                Roadmap
              </Link>{" "}
              for active engineering on the live human-presence and consent
              firewall for Voice-AI and autonomous agents.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-32">
        <VerifyFlow />
      </section>
    </>
  );
}
