import { SolanaIcon } from "@/lib/solana-icon";
import { Shield, Vote, Layers, Rocket, TrendingUp, Lock, Flame, AlertTriangle } from "lucide-react";
import {
  protocolFee,
  flywheel,
  tokenDistribution,
  tokenUtilities,
  launchDetails,
} from "@/data/token-economics";

const UTILITY_ICONS = [Shield, Vote, Layers];

export function TokenContent() {
  return (
    <>
      {/* Protocol Fee */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              <div className="lg:relative">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55 lg:absolute lg:bottom-full lg:left-0 lg:mb-6 lg:whitespace-nowrap">
                  // PROTOCOL FEE
                </span>

                <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  Every verification<span className="text-cyan">.</span>
                  <br />
                  On-chain revenue<span className="text-cyan">.</span>
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
                  Users pay a small fee to prove they're human. Integrators
                  read on-chain state for free. Bot farms pay real money at
                  scale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Flywheel */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
            // REVENUE FLYWHEEL
          </span>

          <h2 className="mt-6 max-w-5xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Verification volume drives token value<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Five steps. Protocol revenue scales linearly with verification
            volume. Each step compounds the next.
          </p>

          {/* Labeled diagram — five nodes in a horizontal flow with
              connector arrows between, and a dashed return arrow under
              the row signaling the loop. ViewBox keeps the layout
              proportional across breakpoints. */}
          <div className="mt-16 hidden overflow-hidden border border-border md:block">
            <svg
              viewBox="0 0 1200 320"
              className="block w-full"
              role="img"
              aria-label="Token revenue flywheel diagram. Five steps from user verification through treasury, token buy, validator rewards, and security improvements, looping back to user verification."
            >
              <defs>
                <marker
                  id="flywheel-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path
                    d="M 0 0 L 10 5 L 0 10 z"
                    style={{ fill: "var(--color-cyan)" }}
                  />
                </marker>
              </defs>

              {/* Nodes */}
              {flywheel.map((step, i) => {
                const cx = 120 + i * 240;
                return (
                  <g key={step.step}>
                    <circle
                      cx={cx}
                      cy={130}
                      r="46"
                      style={{
                        fill: "var(--color-background)",
                        stroke: "var(--color-cyan)",
                        strokeOpacity: 0.5,
                      }}
                      strokeWidth="1"
                    />
                    <text
                      x={cx}
                      y={138}
                      textAnchor="middle"
                      style={{
                        fill: "var(--color-cyan)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 20,
                        letterSpacing: "0.1em",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </text>
                    <text
                      x={cx}
                      y={208}
                      textAnchor="middle"
                      style={{
                        fill: "var(--color-foreground)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                      }}
                    >
                      {step.step}
                    </text>
                  </g>
                );
              })}

              {/* Connector arrows between consecutive nodes */}
              {[0, 1, 2, 3].map((i) => {
                const x1 = 120 + i * 240 + 52;
                const x2 = 120 + (i + 1) * 240 - 56;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={130}
                    x2={x2}
                    y2={130}
                    style={{
                      stroke: "var(--color-cyan)",
                      strokeOpacity: 0.5,
                    }}
                    strokeWidth="1"
                    markerEnd="url(#flywheel-arrow)"
                  />
                );
              })}

              {/* Return loop — node 5 back to node 1 */}
              <path
                d="M 1080 178 Q 1080 268 940 268 L 260 268 Q 120 268 120 178"
                fill="none"
                style={{ stroke: "var(--color-cyan)", strokeOpacity: 0.35 }}
                strokeWidth="1"
                strokeDasharray="4,4"
                markerEnd="url(#flywheel-arrow)"
              />

              {/* Loop label */}
              <text
                x={600}
                y={290}
                textAnchor="middle"
                style={{
                  fill: "var(--color-foreground)",
                  fillOpacity: 0.5,
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                }}
              >
                THE LOOP
              </text>
            </svg>
          </div>

          {/* Mobile fallback — vertical stack with arrow glyphs */}
          <ol className="mt-16 space-y-2 border border-border p-6 md:hidden">
            {flywheel.map((step, i) => (
              <li
                key={step.step}
                className="flex items-center gap-3 font-mono text-xs"
              >
                <span className="text-cyan">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground/80">{step.step}</span>
                {i < flywheel.length - 1 && (
                  <span className="ml-auto text-cyan/80" aria-hidden="true">↓</span>
                )}
                {i === flywheel.length - 1 && (
                  <span className="ml-auto text-cyan/35">↺</span>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-5">
            {flywheel.map((step, i) => (
              <div
                key={step.step}
                className="flex flex-col bg-background p-6 md:p-8"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <h3 className="mt-6 font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                  {step.step}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token Distribution */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
            // TOKEN DISTRIBUTION
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Allocation at genesis<span className="text-cyan">.</span>
          </h2>

          <div className="mt-12 border border-border">
            {tokenDistribution.map((allocation, i) => (
              <div
                key={allocation.name}
                className={`grid grid-cols-1 items-center gap-6 px-6 py-6 md:grid-cols-[1fr_2fr_auto] md:gap-10 md:px-8 ${
                  i < tokenDistribution.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div>
                  <p className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                    {allocation.name}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-foreground/45">
                    {allocation.vesting}
                  </p>
                </div>
                <div className="h-1.5 overflow-hidden bg-foreground/[0.06]">
                  <div
                    className="h-full bg-cyan"
                    style={{ width: `${(allocation.percentage / 30) * 100}%` }}
                  />
                </div>
                <p className="font-display text-2xl font-medium tracking-tight text-cyan md:text-3xl md:min-w-[5rem] md:text-right">
                  {allocation.percentage}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token Utility */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55">
            // TOKEN UTILITY
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Stake<span className="text-cyan">.</span> Govern<span className="text-cyan">.</span> Validate<span className="text-cyan">.</span>
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {tokenUtilities.map((utility, i) => {
              const Icon = UTILITY_ICONS[i] ?? Shield;
              return (
                <div
                  key={utility.title}
                  className="flex flex-col bg-background p-8 md:p-10"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-cyan" strokeWidth={1.5} />
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

      {/* Economic Hardening & Slashing */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              <div className="lg:relative">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55 lg:absolute lg:bottom-full lg:left-0 lg:mb-6 lg:whitespace-nowrap">
                  // ECONOMIC HARDENING
                </span>

                <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  Slashing & incentive alignment<span className="text-cyan">.</span>
                </h2>
                
                <p className="mt-6 text-sm leading-relaxed text-foreground/65 max-w-md">
                  Validators are financially incentivized to act honestly. Lazy validation or collusion results in severe economic penalties.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-border">
                <div className="grid grid-cols-1 gap-4 border-b border-border p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <Flame className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Ground-Truth Honey-pots
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      The protocol continuously serves validators randomly interspersed, pre-calibrated test challenges (ground-truth captures with known human/bot status). Node accuracy is evaluated in real-time.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 border-b border-border p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <AlertTriangle className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Asymmetric Slashing
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      A validator earning a tiny protocol fee per verification stands to lose their entire staked amount (minimum 5,000 ENTROS) if they validate inaccurately, accept bots, or reject real users.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <Shield className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Multi-Party Consensus
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      Verification requests require validation receipts from randomized validator quorums. A single colluding node cannot unilaterally approve a bot or forge a valid on-chain attestation.
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
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/55 lg:absolute lg:bottom-full lg:left-0 lg:mb-6 lg:whitespace-nowrap">
                  // LAUNCH
                </span>

                <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  Verified humans only<span className="text-cyan">.</span>
                </h2>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="border border-border">
                <div className="grid grid-cols-1 gap-4 border-b border-border p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <Rocket className="h-5 w-5 text-cyan" strokeWidth={1.5} />
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
                  <Lock className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      {launchDetails.standard}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      Supply fixed at genesis. Confidential Balances for
                      private staking.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-[auto_1fr] md:gap-8 md:p-8">
                  <TrendingUp className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                  <div>
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Revenue-backed from day one
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/65">
                      The protocol generates SOL revenue before the token
                      launches. Treasury accumulates real value. The token
                      amplifies the flywheel.
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
