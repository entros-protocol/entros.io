const openSource = [
  "On-chain programs (protocol-core: entros-anchor, entros-verifier, entros-registry), MIT",
  "Governance voter-weight plugin (entros-governance-plugin), MIT",
  "Verification integrator library (@entros/verify), pure MIT using only MIT @noble/curves and @noble/hashes with zero GPL-3.0 dependencies",
  "Executor gateway (executor-node), MIT",
  "Website and documentation (entros.io), MIT first-party source",
  "ZK circuits (circuits): Entros-authored source and keys are MIT, while compiled artifacts include circomlib (GPL-3.0) templates and tooling uses snarkjs and circom (GPL-3.0)",
  "Client SDK (@entros/pulse-sdk): Entros-authored source is MIT, and dist/ loads snarkjs and pitchfinder (GPL-3.0) via runtime dynamic import() without bundling them",
  "Security program results and baseline adversarial suite in pulse-sdk",
];

const privateComponents = [
  "Server-side validation service (entros-validation): thresholds and parameter values",
  "Red-team harness (entros-redteam): attack code, per-attempt telemetry, captured baseline fixtures",
  "Pre-disclosure vulnerability reports (standard practice)",
];

/**
 * Open Source Posture: two-column comparison between public and private
 * components. Hairline-divided list pairs each item, with cyan accent on
 * the open column and neutral on the private column.
 */
export function OpenSourcePosture() {
  return (
    <section id="open-source" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          What we open-source,
          and why<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Entros-authored source in our public repositories carries the MIT
          License. Compiled circuits and runtime SDK dependencies carry GPL-3.0
          terms. The private validation service and red-team harness stay closed.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-2">
          <div className="bg-background p-8 md:p-10">
            <p className="text-sm font-medium text-foreground">
              Open source (MIT first-party source)
            </p>
            <ul className="mt-8 space-y-4 border-t border-border pt-6">
              {openSource.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/75"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 bg-cyan" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-background p-8 md:p-10">
            <p className="text-sm font-medium text-foreground/65">
              Kept private
            </p>
            <ul className="mt-8 space-y-4 border-t border-border pt-6">
              {privateComponents.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-sm leading-relaxed text-foreground/65"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 bg-foreground/30" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 max-w-3xl space-y-4 text-sm leading-relaxed text-foreground/65">
          <p>
            Compiled circuits artifacts include circomlib (GPL-3.0) templates.
            @entros/pulse-sdk loads snarkjs and pitchfinder (GPL-3.0) via
            runtime dynamic import() without bundling them into dist/.
            @entros/verify provides a pure-MIT verification surface with zero
            GPL-3.0 dependencies, using only MIT @noble/curves and
            @noble/hashes.
          </p>
          <p>
            On-chain transitions, cryptographic checks, and client computations
            are public. The private service decides whether submitted evidence
            satisfies the acceptance policy. Its detectors and thresholds stay
            private to limit directed calibration.
          </p>
        </div>
      </div>
    </section>
  );
}
