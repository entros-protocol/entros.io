import { ShieldCheck, Bot } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Verify as human",
    description:
      "Complete a behavioral verification to prove you're human. Your Entros Anchor is minted on Solana with a Trust Score that grows over time.",
  },
  {
    number: "02",
    title: "Register your agent",
    description:
      "Register your AI agent on the Solana Agent Registry. Your agent gets a Metaplex Core NFT identity on-chain.",
  },
  {
    number: "03",
    title: "Attest with Agent Anchor",
    description:
      "Link your Entros Anchor to your agent with one transaction. The attestation is immutable and on-chain. Any platform can verify the link.",
  },
];

export function AgentsContent() {
  return (
    <>
      {/* Problem */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // THE PROBLEM
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            AI agents have no human accountability<span className="text-cyan">.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
              Thousands of AI agents are registered on Solana. They trade,
              vote, execute transactions, and interact with protocols
              autonomously. None of them can prove a real human operates
              them.
            </p>
            <p className="text-base leading-relaxed text-foreground/65 md:text-lg">
              Anyone can register unlimited anonymous agents with no link
              between the agent's on-chain identity and a verified person.
              Platforms gating access by agent count have nothing to count
              against.
            </p>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // THE SOLUTION
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            One person<span className="text-cyan">.</span> One identity<span className="text-cyan">.</span>
            <br />
            All their agents<span className="text-cyan">.</span>
          </h2>

          <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
                Agent Anchor writes immutable metadata on a registered
                agent linking it to its verified human operator's Entros
                Anchor. One human, one Trust Score. Register 100 agents
                and all 100 trace back to the same verified identity.
              </p>
              <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
                Platforms set their own policies—minimum Trust Score
                to register, maximum agents per operator, age requirements
                on the operator's Anchor.
              </p>
            </div>

            {/* Attestation diagram—hairline frame, concentric-ringed
                nodes connected by a signal-dot channel, on the same matte
                panel the ASCII scenes use elsewhere on the site. */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl bg-foreground/[0.06] p-8 md:p-12">

                {/* Header row—eyebrow + status pill */}
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    // ON-CHAIN ATTESTATION
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solana-green/60" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-solana-green" />
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                      Devnet
                    </span>
                  </div>
                </div>

                {/* Attestation label—sits above the whole diagram rather than
                    inside the connector. The connector is only as wide as the
                    gap between the two nodes, so on a narrow card an absolutely
                    positioned label overflows across both circles. */}
                <p className="mt-10 text-center font-mono text-[11px] tracking-[0.15em] text-cyan">
                  entros:human-operator
                </p>

                {/* Diagram */}
                <div className="mt-6 flex items-center px-2">
                  {/* Human—animated ripple rings */}
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border border-cyan/35 animate-ripple" aria-hidden />
                    <span className="absolute inset-0 rounded-full border border-cyan/35 animate-ripple [animation-delay:1.8s]" aria-hidden />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan/50 bg-cyan/[0.04]">
                      <ShieldCheck className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Connection channel */}
                  <div className="relative mx-3 flex-1">
                    {/* Channel—gradient hairline + 3 signal dots */}
                    <div className="relative h-px bg-gradient-to-r from-cyan/15 via-cyan/55 to-cyan/15">
                      <span className="absolute left-[20%] top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/60" aria-hidden />
                      <span className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_8px_rgba(34,211,230,0.6)]" aria-hidden />
                      <span className="absolute left-[80%] top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/60" aria-hidden />
                    </div>

                    {/* Below the line—direction arrow */}
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[1px] text-cyan">
                      <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden>
                        <path d="M0 0L6 3L0 6V0Z" fill="currentColor" />
                      </svg>
                    </span>
                  </div>

                  {/* Agent—animated ripple rings */}
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border border-foreground/25 animate-ripple [animation-delay:0.9s]" aria-hidden />
                    <span className="absolute inset-0 rounded-full border border-foreground/25 animate-ripple [animation-delay:2.7s]" aria-hidden />
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-foreground/30 bg-foreground/[0.03]">
                      <Bot className="h-5 w-5 text-foreground/60" strokeWidth={1.5} />
                    </div>
                  </div>
                </div>

                {/* Node labels */}
                <div className="mt-4 flex items-center justify-between px-2">
                  <span className="w-20 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-cyan/80">
                    Human
                  </span>
                  <span className="w-20 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                    Agent
                  </span>
                </div>

                {/* Property strip—3 cells, hairline dividers */}
                <div className="mt-12 grid grid-cols-3 border-t border-border">
                  {[
                    { label: "Immutable" },
                    { label: "Verifiable" },
                    { label: "On-chain" },
                  ].map((p, i) => (
                    <div
                      key={p.label}
                      className={`flex items-center justify-center gap-1.5 px-1 py-5 md:gap-2 md:px-2 ${
                        i > 0 ? "border-l border-border" : ""
                      }`}
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-cyan" aria-hidden />
                      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-foreground/55 md:text-[10px] md:tracking-[0.2em]">
                        {p.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works—3-step hairline grid */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // HOW IT WORKS
          </span>

          <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Three steps to human accountability<span className="text-cyan">.</span>
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col bg-background p-8 md:p-10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                    {step.number}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {step.title}
                </h3>

                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For integrators—split with code block */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
                // FOR INTEGRATORS
              </span>

              <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                One function call<span className="text-cyan">.</span>
              </h2>

              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                Check if any agent has a verified human operator. Returns
                the operator's Trust Score, verification timestamp, and
                wallet address. Works on devnet and mainnet.
              </p>
            </div>

            <div className="lg:col-span-7">
              {/* Same treatment as the home snippet: the block is sized to
                  its longest line, and the width it gives back becomes a
                  hairline off its vertical centre running out to the site's
                  right-hand skeleton line. `-mr-6` cancels the container
                  padding so it lands on the rail exactly. */}
              <div className="flex items-center">
                <div className="min-w-0 w-full lg:w-auto lg:shrink lg:grow-0 lg:basis-[36rem]">
                  <div className="overflow-x-auto rounded-2xl bg-foreground/[0.06] p-6 font-mono text-sm md:p-8">
                <pre className="leading-relaxed text-foreground">
                  <span className="text-cyan">{"import"}</span>
                  {" { getAgentHumanOperator } "}
                  <span className="text-cyan">{"from"}</span>
                  {" "}
                  <span className="text-solana-green">{"'@entros/pulse-sdk'"}</span>
                  {";\n\n"}
                  <span className="text-cyan">{"const"}</span>
                  {" operator = "}
                  <span className="text-cyan">{"await"}</span>
                  {" "}
                  <span className="text-[#C084FC]">{"getAgentHumanOperator"}</span>
                  {"(agentAsset);\n\n"}
                  <span className="text-cyan">{"if"}</span>
                  {" (operator) {\n"}
                  {"  "}
                  <span className="text-foreground/40">
                    {"// { anchorPda, trustScore, verifiedAt, wallet }"}
                  </span>
                  {"\n  console."}
                  <span className="text-[#C084FC]">{"log"}</span>
                  {"('Trust Score:', operator.trustScore);\n}"}
                </pre>
                  </div>
                </div>
                <div aria-hidden className="-mr-6 hidden h-px flex-1 bg-border lg:block" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
