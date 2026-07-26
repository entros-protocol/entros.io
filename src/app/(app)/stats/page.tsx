import { ProtocolStats } from "@/components/sections/protocol-stats";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Protocol Stats",
  description:
    "Live on-chain metrics for the Entros Protocol. Total anchors minted, trust scores, and verification activity, queried directly from Solana devnet.",
  path: "/stats",
});

export default function Stats() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-10 md:pt-40 md:pb-12">
          <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Protocol stats<span className="text-cyan">.</span>
          </h1>

          <p className="mt-7 max-w-4xl text-base leading-relaxed text-foreground/65 md:mt-8 md:text-lg">
            Live on-chain metrics, read directly from Solana devnet. No
            backend, no cache.
          </p>
        </div>
      </section>

      <ProtocolStats />
    </>
  );
}
