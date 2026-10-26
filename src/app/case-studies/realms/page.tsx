import Link from "next/link";
import { ArrowRight, GitBranch, Vote, Coins, Layers } from "lucide-react";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Realms Case Study",
  description:
    "Design study for Entros voter weight on Realms, from the devnet prototype and planned client integration.",
  path: "/case-studies/realms",
});

const PROGRAM_ID = "99nwXzcugse3x8kxE9v6mxZiq8T9gHDoznaaG6qcw534";
const PLUGIN_REPO = "https://github.com/entros-protocol/entros-governance-plugin";

const incidents = [
  {
    year: "2022",
    actor: "Mango Markets",
    headline: "$47M whale self-vote",
    detail:
      "The exploiter who drained the treasury then voted through Mango's governance on returning a portion and keeping the rest. Their wallet held enough MNGO to clear quorum. Token balance was the whole barrier.",
  },
  {
    year: "2023",
    actor: "Synthetify",
    headline: "~$230K from ten proposals",
    detail:
      "Ten self-funded proposals moved roughly $230K out of the Synthetify treasury before the DAO responded. Each wallet bought enough tokens to clear the threshold. The vote had no way to ask whether a human stood behind them.",
  },
  {
    year: "2025",
    actor: "Jupiter Jupuary",
    headline: "750K wallets filtered as Sybil",
    detail:
      "The Jupiter team filtered more than 750,000 wallets out of Jupuary after the fact. Each filter was hand-built and downstream. An upstream personhood primitive moves that work off every protocol's plate.",
  },
];

const integrationSteps = [
  {
    Icon: GitBranch,
    title: "Register the future client",
    body: "The planned JavaScript client registers with Governance UI and constructs each plugin instruction.",
  },
  {
    Icon: Vote,
    title: "Choose the floor",
    body: "The operator picks a minimum Trust Score and a maximum staleness window: a comment thread a low floor, a treasury allocation a recent verification.",
  },
  {
    Icon: Coins,
    title: "Voters stay current",
    body: "A voter holds an Entros Anchor, a non-transferable Token-2022 mint. Verification at entros.io/verify runs three paired rounds, each one word to say and one short path to trace, locked in before the next appears. A pass refreshes the Anchor, and any Solana app reads it from chain state.",
  },
  {
    Icon: Layers,
    title: "Insert the eligibility update",
    body: "The planned client updates the voter-weight record before the governed action. The program then applies the configured Anchor checks.",
  },
];

const beforeAfter = [
  {
    scenario: "Spam-quorum on a small DAO",
    before:
      "An attacker spins up a hundred fresh wallets, funds each with the minimum balance, and casts a hundred votes. Quorum passes.",
    after:
      "The intended design requires each wallet to clear the configured Anchor policy. That the wallets are distinct people is open work before any one-person-one-vote claim.",
  },
  {
    scenario: "Whale dictating treasury allocation",
    before:
      "A whale holds concentrated weight and pushes through proposals that pay their own bag. The outcome tracks the balance.",
    after:
      "The prototype writes one unit for an eligible Anchor. Future plugin chaining can define how that composes with token weight.",
  },
  {
    scenario: "Dormant delegations",
    before:
      "Stakers delegate to contracts that auto-vote off whale signals. Holders never see the proposal page.",
    after:
      "The intended client requests a recent Entros result before the action. Integration tests must confirm the behavior for delegated voting.",
  },
];

const status = [
  { label: "Program ID", value: PROGRAM_ID, monospace: true },
  { label: "Cluster", value: "Devnet", monospace: false },
  { label: "Compatibility", value: "spl-governance v3.x", monospace: false },
  { label: "Source", value: "Open, MIT-licensed", monospace: false },
];

export default function RealmsCaseStudy() {
  return (
    <>
      {/* Hero — centered editorial */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pt-32 pb-24 text-center md:pt-40 md:pb-32">
          <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Verified humans<span className="text-cyan">.</span>
            <br />
            Verified votes<span className="text-cyan">.</span>
          </h1>

          {/* text-balance evens the two line lengths and prevents a
              single-word orphan on the last row. */}
          <p className="mx-auto mt-8 max-w-2xl text-balance text-base leading-relaxed text-foreground/70 md:text-lg">
            The devnet program reads an Entros Anchor and writes an eligible
            voter-weight record.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={PLUGIN_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group inline-flex items-center justify-center gap-2
                bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              View the plugin
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/governance"
              className="
                group inline-flex items-center justify-center gap-2
                border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Governance overview
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why this exists — named incidents */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Token weight tells you about balances<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/65 md:text-lg">
            A standard Solana DAO counts ballots by token balance. Tokens
            change hands, sit in cold wallets, and get delegated.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {incidents.map((incident) => (
              <div
                key={incident.actor}
                className="flex flex-col bg-background p-8 md:p-10"
              >
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
                  {incident.year}
                </p>
                <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {incident.actor}
                </h3>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/50">
                  {incident.headline}
                </p>
                <p className="mt-6 text-sm leading-relaxed text-foreground/65">
                  {incident.detail}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-12 max-w-3xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Each ballot asked about balance. None asked whether a
            returning human stood behind it.
          </p>
        </div>
      </section>

      {/* How it integrates — 4-step */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Program now, client next<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            The on-chain addin implements the voter-weight record format.
            A JavaScript client and Governance UI registration are required
            before voters can use the normal Realms flow.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-2 lg:grid-cols-4">
            {integrationSteps.map((step, i) => {
              const Icon = step.Icon;
              return (
                <div
                  key={step.title}
                  className="flex flex-col bg-background p-6 md:p-8"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                    <Icon
                      className="h-4 w-4 text-cyan"
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3 className="mt-8 font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Before / after */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            What the plugin changes<span className="text-cyan">.</span>
          </h2>

          <div className="mt-16 border-t border-border">
            {beforeAfter.map((row) => (
              <div
                key={row.scenario}
                className="grid grid-cols-1 gap-x-12 gap-y-6 border-b border-border py-10 md:grid-cols-3 md:py-14"
              >
                <p className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                  {row.scenario}
                </p>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                    Standard
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/60 md:text-base">
                    {row.before}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
                    With Entros
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-foreground/70 md:text-base">
                    {row.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Status / deployment specifics */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              <div className="lg:relative">
                <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  Deployed and inspectable<span className="text-cyan">.</span>
                </h2>

                <p className="mt-8 text-base leading-relaxed text-foreground/65 md:text-lg">
                  The plugin runs on Solana devnet under the program ID
                  below. The source is on GitHub: read it, run it, fork it.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <dl className="border border-border">
                {status.map((row, i) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-1 gap-3 p-6 md:grid-cols-[10rem_1fr] md:gap-8 md:p-8 ${
                      i < status.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <dt className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/45">
                      {row.label}
                    </dt>
                    <dd
                      className={`text-foreground/85 ${
                        row.monospace
                          ? "break-all font-mono text-xs md:text-sm"
                          : "text-sm md:text-base"
                      }`}
                    >
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>

              <a
                href={PLUGIN_REPO}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.15em] text-cyan transition-colors hover:text-foreground"
              >
                Open the repo
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Run your DAO<span className="text-cyan">.</span>
            <br />
            On verified humans<span className="text-cyan">.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-foreground/65 md:text-lg">
            The on-chain prototype is ready for program-level testing.
            Proposal pilots begin after the client and chaining
            boundaries ship.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:contact@entros.io?subject=Realms%20plugin%20pilot"
              className="
                group inline-flex items-center justify-center gap-2
                bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Propose a pilot
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Try the demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
