const tiers = [
  {
    name: "TIER 0",
    label: "Cryptographic gate",
    description:
      "Zero-knowledge proofs of behavioral consistency. Groth16 proving system. Public verifier on Solana. Every verification produces a proof that the user's behavioral fingerprint is within a hidden Hamming distance threshold of their baseline, without revealing either fingerprint. Open source, auditable, verifiable on-chain.",
  },
  {
    name: "TIER 1",
    label: "Statistical distribution checks",
    description:
      "Server-side validation of the 308-dimensional feature vector extracted from each verification. Multiple independent checks verify that the statistical properties of extracted features are consistent with human physiology, not synthetic generation. Specific checks and threshold values are not published.",
  },
  {
    name: "TIER 2",
    label: "Behavioral coupling signals",
    description:
      "Time-series analysis of phonation and kinematic signals sampled during capture. Real human speech and hand motion share motor-cortex origins and produce measurable temporal coupling at short lags; independent synthesis does not. Enforcement is live on production since April 2026, calibrated against a two-wave red team study that isolated the layer's specific contribution to voice-replay rejection.",
  },
];

/**
 * Defense Layers—vertical tier stack. Each layer is a full-width row
 * with a left rail (tier label) and a right column (label + description).
 * The vertical hairline between rail and content visually connects the
 * tiers from top to bottom, suggesting "stacked defense in depth."
 */
export function DefenseLayers() {
  return (
    <section id="defense-layers" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // DEFENSE LAYERS
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Three layers, one filter<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Defense in depth: cryptographic gate, statistical realism,
          behavioral coupling. Each tier is independent. An attack must
          pass all three to reach the chain.
        </p>

        <div className="mt-16 border-t border-border">
          {tiers.map((tier, idx) => (
            <div
              key={tier.name}
              className="grid grid-cols-1 gap-x-12 gap-y-4 border-b border-border py-10 md:grid-cols-[10rem_1fr] md:py-14"
            >
              {/* Mobile keeps the left rail / right column stacked. Desktop
                  flattens via display:contents so all four leaves
                  participate directly in the parent's 2x2 grid. That lets
                  TIER N self-center vertically against the title row,
                  putting the small label on the same horizontal axis as
                  the larger display headline. */}
              <div className="flex flex-col gap-3 md:contents">
                <span className="font-mono text-xs leading-none tracking-[0.2em] text-cyan md:col-start-1 md:row-start-1 md:self-center">
                  {tier.name}
                </span>
                <span className="font-mono text-xs uppercase leading-none tracking-[0.15em] text-foreground/40 md:col-start-1 md:row-start-2">
                  {String(idx).padStart(2, "0")} / {String(tiers.length - 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-col gap-4 md:contents">
                <h3 className="font-display text-xl font-medium leading-tight tracking-tight text-foreground md:col-start-2 md:row-start-1 md:text-2xl">
                  {tier.label}
                </h3>
                <p className="max-w-3xl text-base leading-relaxed text-foreground/65 md:col-start-2 md:row-start-2">
                  {tier.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
