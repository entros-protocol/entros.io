import { AsciiWalletFlowScene } from "@/components/ui/ascii-scenes";

/**
 * On-chain verification—single-flow explainer. ASCII scene + description
 * of how a wallet-connected verification produces a persistent on-chain
 * identity. Distinct from the hairline-grid pattern used elsewhere.
 */
export function VerificationModesSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // VERIFICATION FLOW
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          On-chain identity, behaviorally proven<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Traditional captcha answers &ldquo;is this session human?&rdquo;
          Entros answers a harder question: &ldquo;is this the same human,
          and how long have they been proving it?&rdquo; The protocol
          provides the signal. The integrator sets the threshold.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-10">
          <AsciiWalletFlowScene label="WALLET FLOW" aspect="16/10" />

          <div>
            <h3 className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              Wallet-connected verification
            </h3>
            <p className="mt-5 text-base leading-relaxed text-foreground/65">
              Connect a Solana wallet. Your Entros Anchor (non-transferable Token-2022) is tied to that wallet. The behavioral fingerprint stays encrypted with AES-256-GCM in a wallet-keyed on-chain blob—only your wallet's signature unlocks it, on any browser or device. The blob holds a one-way hash, not raw biometrics. Commitment and Trust Score live on chain, visible to every integrator. This is the persistent, portable identity. Each wallet requires funded SOL, and re-verification costs compound, making bot farms economically unsustainable at scale.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
