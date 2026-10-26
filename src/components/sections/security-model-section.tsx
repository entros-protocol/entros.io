const DEFENSES = [
  {
    title: "Minimum Distance Constraint",
    description:
      "Re-verification proves committed fingerprints sit inside the circuit's minimum and maximum Hamming-distance bounds. The circuit rejects identical committed fingerprints.",
  },
  {
    title: "Server-Side Feature Validation",
    description:
      "The validation service checks the 308-feature summary before accepting the on-chain proof: acoustic artifacts, submitted-signal statistics, duplicate fingerprints. Detection logic and thresholds stay private as calibration material.",
  },
  {
    title: "Progressive Trust Score",
    description:
      "Trust Score counts active weekly verification bins and account age. A repeat inside one weekly bin adds no active bin.",
  },
  {
    title: "Per-Session Randomness",
    description:
      "The server issues fresh words and paths, one pair per round. It checks the transcript against the issued words before settlement.",
  },
  {
    title: "Multi-Modal Capture",
    description:
      "The client captures microphone, pointer or touch, and available motion. Entros is measuring which combinations add reliable separation across people, devices, and synthesis methods.",
  },
  {
    title: "Cross-Wallet Fingerprint Registry",
    description:
      "The private service keeps a bounded registry of recent fingerprints and compares new submissions with other wallets; population-scale performance remains under evaluation.",
  },
  {
    title: "Economic Disincentives",
    description:
      "The configured fee and rate limits bound request volume. They do not decide whether a capture passes. The private validation policy makes that decision.",
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
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          How Entros checks a capture<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          The private service evaluates each capture before settlement.
          Detection logic stays private. Published results state their tested
          attack class and denominator.
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
