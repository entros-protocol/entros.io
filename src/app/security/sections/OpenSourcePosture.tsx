const openSource = [
  "On-chain programs (entros-anchor, entros-verifier, entros-registry)",
  "ZK circuit source and verification keys",
  "Client SDK (pulse-sdk on npm)",
  "Executor node",
  "Website and documentation",
  "Security program page, public documentation, and scoped campaign results",
  "Baseline adversarial testing (script-kiddie tier in pulse-sdk)",
];

const privateComponents = [
  "Server-side validation service (entros-validation): check thresholds and parameter values",
  "Red-team harness (entros-redteam): attack code, per-attempt telemetry, captured baseline fixtures",
  "Pre-disclosure vulnerability reports (per standard responsible-disclosure practice)",
];

/**
 * Open Source Posture—two-column comparison: open vs private.
 * Hairline-divided list pairs each item; cyan accent on the open
 * column, neutral on the private column.
 */
export function OpenSourcePosture() {
  return (
    <section id="open-source" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // OPEN SOURCE
        </span>

        <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          What we open-source,
          and why<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/65 md:text-lg">
          The client and on-chain protocol are MIT licensed. The private
          validation service and red-team harness stay closed.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-2">
          <div className="bg-background p-8 md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
              // OPEN—MIT LICENSED
            </p>
            <ul className="mt-8 space-y-4 border-t border-border pt-6">
              {openSource.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/75"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-background p-8 md:p-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50">
              // PRIVATE—DEFENSE LAYER
            </p>
            <ul className="mt-8 space-y-4 border-t border-border pt-6">
              {privateComponents.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/65"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/30" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-12 max-w-3xl text-sm leading-relaxed text-foreground/55">
          On-chain transitions, cryptographic checks, and client computations
          are public. The private service decides whether submitted evidence
          satisfies the current acceptance policy. Its operational detectors
          and thresholds remain private to limit directed calibration.
        </p>
      </div>
    </section>
  );
}
