import { SolanaIcon } from "@/lib/solana-icon";
import {
  BallotGlyph,
  BenchmarkGlyph,
  BuildGlyph,
  DelegateGlyph,
  FeeGlyph,
  KeyGlyph,
  LaunchGlyph,
  LockGlyph,
  NetworkGlyph,
  PersonGlyph,
  QuorumGlyph,
  SlashGlyph,
  StakeGlyph,
  TierGlyph,
  TreasuryGlyph,
} from "@/components/icons/glyphs";
import {
  protocolFee,
  flywheel,
  supplyPrinciples,
  tokenUtilities,
  launchDetails,
} from "@/data/token-economics";

const UTILITY_GLYPHS = [StakeGlyph, DelegateGlyph, TierGlyph, BallotGlyph];

/** One glyph per flywheel node, in order. None reused elsewhere on this page. */
const FLYWHEEL_GLYPHS = [PersonGlyph, FeeGlyph, BuildGlyph, KeyGlyph, NetworkGlyph];

export function TokenContent() {
  return (
    <>
      {/* Revenue Flywheel */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-5xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Each verification pays a fee<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            The roadmap connects validator security, capacity, and governance
            to $ENTROS.
          </p>

          {/* Five square nodes in a row, hairline connectors between them,
              and a dashed return path under the labels that closes the
              loop. The viewBox keeps the layout proportional. */}
          <div className="mt-16 hidden border border-panel-line bg-panel md:block">
            <svg
              viewBox="0 0 1200 300"
              className="block w-full"
              role="img"
              aria-label="Token flywheel diagram: verification, protocol fees, integrator adoption, token-secured validation, a compounding network, looping back to verification."
            >
              <defs>
                <marker
                  id="flywheel-arrow"
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                >
                  <path
                    d="M 1 1 L 7 4 L 1 7"
                    fill="none"
                    strokeWidth="1"
                    style={{ stroke: "var(--color-cyan)" }}
                  />
                </marker>
              </defs>

              {flywheel.map((step, i) => {
                const cx = 120 + i * 240;
                const Glyph = FLYWHEEL_GLYPHS[i] ?? PersonGlyph;
                return (
                  <g key={step.step}>
                    <text
                      x={cx}
                      y={70}
                      textAnchor="middle"
                      style={{
                        fill: "var(--color-cyan)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.2em",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </text>
                    <rect
                      x={cx - 36}
                      y={84}
                      width="72"
                      height="72"
                      strokeWidth="1"
                      style={{
                        fill: "var(--color-background)",
                        stroke: "var(--color-foreground)",
                        strokeOpacity: 0.18,
                      }}
                    />
                    <Glyph
                      x={cx - 19}
                      y={101}
                      width={38}
                      height={38}
                      className="text-foreground/80"
                    />
                    <text
                      x={cx}
                      y={186}
                      textAnchor="middle"
                      style={{
                        fill: "var(--color-foreground)",
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                      }}
                    >
                      {step.step}
                    </text>
                  </g>
                );
              })}

              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1={120 + i * 240 + 48}
                  y1={120}
                  x2={120 + (i + 1) * 240 - 48}
                  y2={120}
                  strokeWidth="1"
                  style={{ stroke: "var(--color-cyan)", strokeOpacity: 0.55 }}
                  markerEnd="url(#flywheel-arrow)"
                />
              ))}

              <path
                d="M 1080 204 V 236 H 120 V 206"
                fill="none"
                strokeWidth="1"
                strokeDasharray="3 5"
                style={{ stroke: "var(--color-cyan)", strokeOpacity: 0.45 }}
                markerEnd="url(#flywheel-arrow)"
              />

              <text
                x={600}
                y={264}
                textAnchor="middle"
                style={{
                  fill: "var(--color-foreground)",
                  fillOpacity: 0.45,
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.24em",
                }}
              >
                THE LOOP
              </text>
            </svg>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-5">
            {flywheel.map((step, i) => {
              const Glyph = FLYWHEEL_GLYPHS[i] ?? PersonGlyph;
              return (
                <div
                  key={step.step}
                  className="flex flex-col bg-background p-6 md:p-8"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <Glyph className="h-7 w-7 text-foreground/80 md:hidden" />
                  </div>

                  <h3 className="mt-6 font-display text-lg font-medium tracking-tight text-foreground">
                    {step.step}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Supply — fair launch */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            A fair launch<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            No presale and no VC round. One launch, open to everyone.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {supplyPrinciples.map((principle) => (
              <div
                key={principle.title}
                className="flex flex-col bg-background p-8 md:p-10"
              >
                <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {principle.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protocol Fee */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              <div className="lg:relative">
                <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  Every verification<span className="text-cyan">.</span>
                  <br />
                  One on-chain treasury<span className="text-cyan">.</span>
                </h2>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-border p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <SolanaIcon className="mt-1 h-6 w-6 shrink-0 text-cyan" />
                  <div>
                    <p className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                      {protocolFee.amount}
                    </p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                      {protocolFee.destination}
                    </p>
                  </div>
                </div>

                <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                  {protocolFee.description}
                </p>
                <p className="mt-4 text-base leading-relaxed text-foreground/65 md:text-lg">
                  Users pay the configured fee to write protocol state.
                  Integrators read that state for free. Detection decides
                  whether a verification passes. The fee bounds repeated
                  attempts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Utility */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Utility expands with decentralization<span className="text-cyan">.</span>
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-2">
            {tokenUtilities.map((utility, i) => {
              const Icon = UTILITY_GLYPHS[i] ?? StakeGlyph;
              return (
                <div
                  key={utility.title}
                  className="flex flex-col bg-background p-8 md:p-10"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-10 w-10 text-foreground/80" />
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                    {utility.title}
                  </h3>

                  <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                    {utility.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Planned economic hardening and slashing */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              <div className="lg:relative">
                <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  Slashing and incentive design<span className="text-cyan">.</span>
                </h2>
                
                <p className="mt-6 text-sm leading-relaxed text-foreground/65 max-w-md">
                  These mechanisms are design targets. The registry does not
                  implement selection, quorum, rewards, or slashing today.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-border">
                <div className="grid grid-cols-1 gap-4 border-b border-border p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <BenchmarkGlyph className="h-9 w-9 text-foreground/80" />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Ground-Truth Honey-pots
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      The planned design can include blinded benchmark tasks.
                      The specification must define dataset governance and
                      prevent validators from identifying benchmark traffic.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-b border-border p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <SlashGlyph className="h-9 w-9 text-foreground/80" />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Asymmetric Slashing
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      A future slashing design must define objective evidence,
                      bounded penalties, appeals, and correlated-failure
                      handling before funds can be at risk.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <QuorumGlyph className="h-9 w-9 text-foreground/80" />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Multi-Party Consensus
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      A future validator network can require receipts from a
                      selected cohort. Selection, quorum, and aggregation are
                      not implemented in the current registry.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Launch */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              <div className="lg:relative">
                <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  How the token works<span className="text-cyan">.</span>
                </h2>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-border">
                <div className="grid grid-cols-1 gap-4 border-b border-border p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <LaunchGlyph className="h-9 w-9 text-foreground/80" />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      {launchDetails.mechanism}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      {launchDetails.airdrop}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-b border-border p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <LockGlyph className="h-9 w-9 text-foreground/80" />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      {launchDetails.standard}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      Fixed supply at genesis, launched through the EasyA
                      Kickstart bonding curve on Solana.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <TreasuryGlyph className="h-9 w-9 text-foreground/80" />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      The treasury is on-chain
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      $ENTROS utility stays separate from the fee until its
                      mechanisms ship.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
