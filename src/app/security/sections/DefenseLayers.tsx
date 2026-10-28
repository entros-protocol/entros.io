const tiers = [
  {
    name: "TIER 0",
    label: "Cryptographic gate",
    description:
      "Re-verification produces a Groth16 proof that committed fingerprints satisfy the circuit's Hamming-distance bounds. The Solana verifier sees neither plaintext fingerprint. A wallet's initial verification uses a validator-signed receipt instead.",
  },
  {
    name: "TIER 1",
    label: "Statistical distribution checks",
    description:
      "The validation service checks the 308-feature summary against configured capture, phrase, acoustic, and distribution policies. It publishes no thresholds.",
  },
  {
    name: "TIER 2",
    label: "Behavioral coupling signals",
    description:
      "The validator records speech-motion time-series relationships. Enforcement stays off while Entros measures reliability across people, devices, and adaptive synthesis.",
  },
];

/**
 * Defense Layers: one row per tier across the full span. The tier rail,
 * the title and the description each take a column, so the rows fill the
 * width and the descriptions keep a readable measure.
 */
export function DefenseLayers() {
  return (
    <section id="defense-layers" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Three layers, one evidence stack<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Enforced checks decide whether a capture can settle. Temporal
          analysis remains research telemetry.
        </p>

        <div className="mt-16 border-t border-border">
          {tiers.map((tier, idx) => (
            <div
              key={tier.name}
              className="grid grid-cols-1 gap-y-4 border-b border-border py-10 md:py-14 lg:grid-cols-12 lg:gap-x-16"
            >
              <div className="flex items-baseline gap-4 lg:col-span-2 lg:flex-col lg:gap-3">
                <span className="font-mono text-xs leading-none tracking-[0.2em] text-cyan">
                  {tier.name}
                </span>
                <span className="text-sm font-medium leading-none text-foreground/60">
                  {String(idx).padStart(2, "0")} / {String(tiers.length - 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="font-display text-xl font-medium leading-tight tracking-tight text-foreground md:text-2xl lg:col-span-4">
                {tier.label}
              </h3>
              <p className="text-base leading-relaxed text-foreground/65 lg:col-span-6">
                {tier.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
