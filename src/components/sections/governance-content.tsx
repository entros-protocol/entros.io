import Link from "next/link";
import {
  AgentGlyph,
  BallotGlyph,
  BuildGlyph,
  ChainGlyph,
  ClockGlyph,
  CodeGlyph,
  GaugeGlyph,
  HumanGlyph,
  TreasuryGlyph,
  VerifiedGlyph,
} from "@/components/icons/glyphs";
import { FlowDiagram } from "@/components/ui/flow-diagram";
import { ExternalLink, ArrowRight } from "lucide-react";

const sybilIncidents = [
  {
    year: "2022",
    actor: "Mango Markets",
    summary:
      "The exploiter who drained $47M voted through Mango's own governance to keep most of the take. Their balance cleared quorum.",
  },
  {
    year: "2023",
    actor: "Synthetify",
    summary:
      "Ten self-funded proposals moved roughly $230K out of the Synthetify treasury, each clearing the threshold on bought-in tokens.",
  },
  {
    year: "2025",
    actor: "Jupiter Jupuary",
    summary:
      "The Jupiter team filtered 750,000+ wallets out of Jupuary after the fact. Every filter ran downstream of the airdrop.",
  },
];

const steps = [
  {
    number: "01",
    icon: GaugeGlyph,
    title: "Configure",
    description:
      "DAO admin sets a minimum Trust Score and a maximum verification age. One transaction creates the registrar.",
  },
  {
    number: "02",
    icon: VerifiedGlyph,
    title: "Verify",
    description:
      "Each voter completes a behavioral verification through Entros. Trust Score grows with each re-verification.",
  },
  {
    number: "03",
    icon: BallotGlyph,
    title: "Vote",
    description:
      "The planned Realms client inserts the voter-weight update before a governed action. Eligible Anchors receive one unit of weight.",
  },
];

const chainOptions = [
  {
    name: "Entros + Token Voter",
    description: "Planned composition with token-weighted voting.",
  },
  {
    name: "Entros + Quadratic",
    description: "Planned composition with quadratic voting.",
  },
  {
    name: "Entros + NFT Voter",
    description: "Planned composition with NFT-gated voting.",
  },
];

const PROGRAM_ID = "99nwXzcugse3x8kxE9v6mxZiq8T9gHDoznaaG6qcw534";

export function GovernanceContent() {
  return (
    <>
      {/* Problem—asymmetric split. The h2 and body live in the left
          column so the comparison panel starts at the same y as the
          heading. The grid stretches by default (no items-start), so the
          panel on the right grows to match the text column's height via
          h-full. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                Nobody proves they showed up<span className="text-cyan">.</span>
              </h2>

              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                Bots vote with delegated authority. Scripts auto-vote off
                whale signals. Staked wallets vote unread.
              </p>
              <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
                A token balance cannot say who stands behind the vote.
                Token weight ≠ community will.
              </p>
            </div>

            {/* Compact voter-weight comparison table */}
            <div className="lg:col-span-6">
              <div className="flex h-full flex-col border border-border p-6 md:p-8">
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-8 border-b border-border pb-3 md:gap-x-12">
                  <span className="text-sm font-medium text-foreground/60">
                    Voter
                  </span>
                  <span className="text-sm font-medium text-right text-foreground/60">
                    Standard
                  </span>
                  <span className="text-sm font-medium text-right text-foreground">
                    With Entros
                  </span>
                </div>

                {[
                  { Icon: AgentGlyph, label: "Bot", verified: false },
                  { Icon: CodeGlyph, label: "Script", verified: false },
                  { Icon: HumanGlyph, label: "Human", verified: true },
                ].map((row, i, arr) => {
                  const Icon = row.Icon;
                  return (
                    <div
                      key={i}
                      className={`grid flex-1 grid-cols-[1fr_auto_auto] items-center gap-x-8 py-5 md:gap-x-12 ${
                        i < arr.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`h-5 w-5 ${
                            row.verified ? "text-foreground/85" : "text-foreground/45"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            row.verified ? "text-foreground" : "text-foreground/65"
                          }`}
                        >
                          {row.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <span className="h-1.5 w-1.5 bg-foreground/30" aria-hidden />
                        <span className="font-mono text-xs text-foreground/45">×1</span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        {row.verified ? (
                          <>
                            <span className="h-1.5 w-1.5 bg-cyan" aria-hidden />
                            <span className="font-mono text-xs text-foreground">×1</span>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-foreground/60">
                            No weight
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's at stake—named incidents that prove the gap.
          Three-card row with year tag, named protocol, and one-line
          incident summary. Closes with a pointer to the deeper Realms
          case study without repeating its content. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            The gap is on the record<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Three Solana protocols across three years. Each ballot read
            the token balance. None read the human.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {sybilIncidents.map((incident) => (
              <div
                key={incident.actor}
                className="flex flex-col bg-background p-8 md:p-10"
              >
                <p className="text-sm font-medium text-foreground">
                  {incident.year}
                </p>
                <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {incident.actor}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  {incident.summary}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/case-studies/realms"
            className="text-sm font-medium mt-10 inline-flex items-center gap-2 text-foreground underline decoration-cyan/60 underline-offset-4 transition-colors hover:decoration-cyan"
          >
            Full case study
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* Solution—asymmetric split, h2 and body in the left
          column. The diagram on the right stretches via h-full to
          match the text column's height. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                Verified human<span className="text-cyan">.</span> Verified vote<span className="text-cyan">.</span>
              </h2>

              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                The plugin reads the voter's Trust Score and verification
                recency from their Anchor. The on-chain prototype applies
                those checks when its update instruction runs.
              </p>
              <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
                A forthcoming Realms client will insert that instruction
                before governed actions. Population uniqueness and
                Governance UI wiring remain release gates.
              </p>
            </div>

            <div className="lg:col-span-6">
              <FlowDiagram
                from={{ label: "Human", Icon: HumanGlyph }}
                to={{ label: "DAO", Icon: TreasuryGlyph }}
                signal="voter_weight = 1"
                properties={[
                  { label: "Verified", Icon: VerifiedGlyph },
                  { label: "Current", Icon: ClockGlyph },
                  { label: "On-chain", Icon: ChainGlyph },
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works—3-step hairline grid */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Three steps to verified governance<span className="text-cyan">.</span>
          </h2>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="flex flex-col bg-background p-8 md:p-10">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                      {step.number}
                    </span>
                    <Icon className="h-5 w-5 text-foreground/70" />
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                    {step.title}
                  </h3>

                  <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plugin chaining—h2 above, full-width 3-column hairline grid below */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Layer on top<span className="text-cyan">.</span> Don't replace<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            The current Registrar has no predecessor field, and the
            update instruction accepts no input voter-weight record. Future
            work will define safe composition.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {chainOptions.map((opt) => (
              <div key={opt.name} className="flex flex-col bg-background p-8 md:p-10">
                <div className="flex items-center gap-3">
                  <BuildGlyph className="h-5 w-5 text-foreground/70" />
                  <span className="h-px flex-1 bg-border" />
                </div>

                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {opt.name}
                </h3>

                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  {opt.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Configuration—h2 above, copy+dl on left, code on right */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Two parameters<span className="text-cyan">.</span> Full control<span className="text-cyan">.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:pb-10">
              <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
                The DAO admin sets two values when creating the
                registrar. The realm authority can update both anytime.
              </p>

              <dl className="mt-10 grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-[12rem_1fr] md:gap-y-6">
                <dt className="font-mono text-sm text-foreground md:pt-[0.2rem]">
                  min_trust_score
                  <span className="ml-2 text-foreground/40">u16</span>
                </dt>
                <dd className="text-sm leading-relaxed text-foreground/65">
                  Minimum Trust Score for voting weight. 0 means
                  any verified wallet qualifies. 100 requires one
                  re-verification. Higher values ask for longer
                  behavioral history.
                </dd>

                <dt className="font-mono text-sm text-foreground md:pt-[0.2rem]">
                  max_verification_age
                  <span className="ml-2 text-foreground/40">i64</span>
                </dt>
                <dd className="text-sm leading-relaxed text-foreground/65">
                  Maximum seconds since last verification. 2,592,000 = 30
                  days. 604,800 = 7 days. An expired voter re-verifies
                  before voting.
                </dd>
              </dl>
            </div>

            <div className="lg:col-span-7">
              {/* Same treatment as the home snippet: the block is sized to
                  its longest line, and the width it gives back becomes a
                  hairline off its vertical centre running out to the site's
                  right-hand skeleton line. `-mr-6` cancels the container
                  padding so it lands on the rail exactly. */}
              <div className="flex h-full items-center">
                <div className="min-w-0 w-full lg:w-auto lg:shrink lg:grow-0 lg:basis-[38rem]">
                  <div tabIndex={0} className="overflow-x-auto border border-panel-line bg-panel p-6 font-mono text-sm md:p-8">
                <pre className="leading-relaxed text-foreground/80">
                  <span className="text-foreground/40">
                    {"// DAO admin configures the Entros voter weight plugin\n"}
                  </span>
                  <span className="text-cyan">{"await"}</span>
                  {" program.methods\n  ."}
                  <span className="text-[#C084FC]">{"createRegistrar"}</span>
                  {"(\n    100,      "}
                  <span className="text-foreground/40">
                    {"// min_trust_score (at least one re-verification)"}
                  </span>
                  {"\n    2592000,  "}
                  <span className="text-foreground/40">
                    {"// max_verification_age (30 days in seconds)"}
                  </span>
                  {"\n  )\n  ."}
                  <span className="text-[#C084FC]">{"accounts"}</span>
                  {"({\n    realm: realmPubkey,\n    governanceProgramId: govProgramId,\n    governingTokenMint: mintPubkey,\n    realmAuthority: admin.publicKey,\n    payer: admin.publicKey,\n  })\n  ."}
                  <span className="text-[#C084FC]">{"signers"}</span>
                  {"([admin])\n  ."}
                  <span className="text-[#C084FC]">{"rpc"}</span>
                  {"();"}
                </pre>
                  </div>
                </div>
                <div aria-hidden className="-mr-6 hidden h-px flex-1 bg-border lg:block" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For DAOs—Realms integration */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                On-chain foundation deployed<span className="text-cyan">.</span>
              </h2>

              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                The voter-weight program runs on Solana devnet. A JavaScript
                client, Governance UI registration, and end-to-end Realms
                tests remain planned.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="flex h-full flex-col justify-center border border-border p-6 md:p-8">
                <p className="break-all font-mono text-sm text-cyan md:text-base">
                  {PROGRAM_ID}
                </p>
                <a
                  href="https://github.com/entros-protocol/entros-governance-plugin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium mt-6 inline-flex w-fit items-center gap-1.5 text-foreground/65 transition-colors hover:text-foreground"
                >
                  View source on GitHub
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
