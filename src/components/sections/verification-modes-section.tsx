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
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Verification state on Solana<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          A captcha checks one session. Entros is designed to show that a
          returning person keeps operating the same wallet. Apps read the
          state and set their own policy.
        </p>

        <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-10">
          <AsciiWalletFlowScene aspect="16/10" fit fitScale={1.25} />

          <div className="lg:self-center">
            <h3 className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
              Wallet-connected verification
            </h3>
            <p className="mt-5 text-base leading-relaxed text-foreground/65">
              Your wallet holds a non-transferable Entros Anchor, a Token-2022
              account. Its commitment, Trust Score and history stay readable
              on chain. The wallet pays the fee and the Anchor&apos;s rent.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
