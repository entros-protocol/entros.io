const DEFENSES = [
  {
    title: "Minimum Distance Constraint",
    description:
      "The ZK circuit enforces a minimum Hamming distance between consecutive fingerprints. Perfect replay is rejected at the proof level. A bot submitting identical synthetic data twice gets blocked before reaching the chain.",
  },
  {
    title: "Server-Side Feature Validation",
    description:
      "The 308-dimensional statistical feature summary is validated by proprietary server-side models before the on-chain proof is accepted. These models detect synthetic speech artifacts, unnatural jitter patterns, and cross-modality inconsistencies. The validation logic is private—the attacker can see that checks happen but not how they work.",
  },
  {
    title: "Progressive Trust Score",
    description:
      "Trust Score rewards consistency over time, not volume. 100 verifications in one day scores lower than weekly verifications over 3 months. Recency weighting and cadence analysis make bot farming slow and expensive.",
  },
  {
    title: "Per-Session Randomness",
    description:
      "Each verification generates a unique random phrase and Lissajous curve. No two sessions share the same challenge. The challenge elicits involuntary behavioral patterns (voice prosody, hand tremor, touch pressure) that are harder to synthesize than the words themselves.",
  },
  {
    title: "Multi-Modal Capture",
    description:
      "Three independent sensor streams record in parallel: microphone, pointer/touch digitizer, and device motion (where available). A bot needs to fake realistic voice, tremor, and touch pressure simultaneously. Spoofing one modality is feasible. Spoofing all three with consistent behavioral entropy is exponentially harder.",
  },
  {
    title: "Cross-Wallet Fingerprint Registry",
    description:
      "The server maintains a registry of all verified behavioral fingerprints. New verifications are compared against existing entries. Sybil attacks—where one actor creates many identities—produce clustered fingerprints that the registry detects and rejects.",
  },
  {
    title: "Economic Disincentives",
    description:
      "Each verification costs the user SOL. Each wallet requires funding. Server-side validation rejects synthetic data before it reaches the chain. Maintaining thousands of fake identities over months—funding wallets, paying per verification, building Trust Score across separate days—costs real money. The attacker pays for every attempt.",
  },
];

/**
 * Security Model—vertical numbered list. Each defense is a full-width
 * row: number on the left rail, title + body on the right. Removes the
 * orphan-cell problem that a 7-item grid creates and gives the section
 * a different geometry from grid-based sections elsewhere on the page.
 */
export function SecurityModelSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // SECURITY MODEL
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          How Entros resists bots<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Open protocol for trust. Private validation for security.
          Synthetic data is rejected server-side before reaching the
          chain. Users pay a small protocol fee per verification. Bots
          pay real money at scale.
        </p>

        <div className="mt-16 border-t border-border">
          {DEFENSES.map((d, idx) => (
            <div
              key={d.title}
              className="grid grid-cols-1 gap-y-4 border-b border-border py-8 md:grid-cols-[1fr_1.4fr] md:gap-x-12 md:gap-y-0 md:py-10"
            >
              <div className="flex items-center gap-5">
                <span className="shrink-0 font-mono text-xs tracking-[0.2em] text-cyan">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl md:leading-[1.15]">
                  {d.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-foreground/60 md:text-base md:leading-relaxed">
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
