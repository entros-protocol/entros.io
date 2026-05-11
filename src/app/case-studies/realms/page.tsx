import Link from "next/link";
import { ArrowRight, GitBranch, Vote, Coins, Layers } from "lucide-react";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Realms — Case Study",
  description:
    "Sybil-resistant DAO governance on Realms. The Entros voter-weight plugin gates votes on live behavioral verification, not token balance.",
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
      "The exploiter who drained the Mango Markets treasury used the protocol's own governance to vote on returning a portion and keeping the rest. Their wallet still held enough MNGO to clear quorum, and token balance was the only barrier they had to clear.",
  },
  {
    year: "2023",
    actor: "Synthetify",
    headline: "~$230K from ten proposals",
    detail:
      "Ten self-funded governance proposals moved roughly $230K out of the Synthetify treasury before the DAO responded. Each wallet bought enough tokens to clear the proposal threshold. The vote process had no way to ask whether a human stood behind any of them.",
  },
  {
    year: "2025",
    actor: "Jupiter Jupuary",
    headline: "750K wallets filtered as Sybil",
    detail:
      "The Jupiter team filtered more than 750,000 wallets out of Jupuary distribution after the fact. Each filter was hand-built, downstream, and ran on data the team had to source itself. An upstream personhood primitive moves that work off every protocol's plate.",
  },
];

const integrationSteps = [
  {
    Icon: GitBranch,
    title: "Point Realms at the plugin",
    body: "The DAO operator names the Entros voter-weight plugin as the registrar for an existing or new Realms governance. The plugin speaks spl-governance, so the instructions and accounts the operator already knows still apply.",
  },
  {
    Icon: Vote,
    title: "Choose the floor",
    body: "The operator picks a minimum Trust Score and a maximum staleness window. A comment thread can use a low floor and a long window. A treasury allocation can ask for a higher score and a recent verification.",
  },
  {
    Icon: Coins,
    title: "Voters verify once",
    body: "A voter holds an Entros Anchor, a non-transferable Token-2022 mint. They run a twelve-second verification at entros.io/verify and the Anchor updates. The same Anchor reads to this DAO and every other Entros-gated surface on Solana.",
  },
  {
    Icon: Layers,
    title: "Vote through the normal UI",
    body: "Voters cast ballots in Realms the way they already do. The plugin reads the Anchor at vote-cast time and applies the floor the operator configured. Dormant wallets, scripted delegations, and unattended agents do not count.",
  },
];

const beforeAfter = [
  {
    scenario: "Spam-quorum on a small DAO",
    before:
      "An attacker spins up a hundred fresh wallets, funds each one with the minimum token balance, and casts a hundred votes. Quorum lands at near-zero cost.",
    after:
      "Each of those hundred wallets needs an Entros Anchor with the floor Trust Score and a recent verification. The cost to clear the floor includes the verification fee, the time the attacker spends, and the consistency check the system runs across returns. The same attack now demands real money and real time per wallet.",
  },
  {
    scenario: "Whale dictating treasury allocation",
    before:
      "A whale holds concentrated token weight and pushes through proposals that pay their own bag. The outcome tracks the balance.",
    after:
      "The plugin reads the Anchor first, the balance second. A whale who clears the floor casts a single Anchor's worth of weight. The DAO decides how much token weight stacks on top of that.",
  },
  {
    scenario: "Dormant delegations",
    before:
      "Stakers delegate tokens to staking contracts and the contracts auto-vote off whale signals. Holders never see the proposal page.",
    after:
      "The plugin asks for a recent human verification at the moment of voting. A staking contract cannot present one. Dormant delegations drop out of quorum.",
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
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // CASE STUDY · REALMS
          </span>

          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Verified humans<span className="text-cyan">.</span>
            <br />
            Verified votes<span className="text-cyan">.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-foreground/70 md:text-lg">
            The Entros voter-weight plugin reads an on-chain Anchor before
            a Realms ballot counts. The DAO sets a Trust Score floor and a
            recency window; the plugin enforces both. spl-governance
            compatible, live on devnet, source on GitHub.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={PLUGIN_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
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
                rounded-full border border-foreground/20 px-6 py-3
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
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // WHY THIS EXISTS
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Token weight tells you about balances<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/65 md:text-lg">
            A standard Solana DAO counts ballots by token balance. Tokens
            change hands, sit in cold wallets, get delegated, and pile up
            on attackers willing to pay. The price of attacking governance
            tracks the token price; it has no connection to the price of
            being a returning human.
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
            Three protocols, three codebases, three years. The pattern is
            the same: the ballot asked about balance, not about the
            returning human behind it.
          </p>
        </div>
      </section>

      {/* How it integrates — 4-step */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // HOW IT INTEGRATES
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Plug in, set the floor, ship<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            The plugin sits behind the standard Realms registrar
            interface. The DAO operator configures it on-chain. Voters
            keep using the Realms UI they know.
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
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // BEFORE AND AFTER
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
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
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40 lg:absolute lg:bottom-full lg:left-0 lg:mb-6 lg:whitespace-nowrap">
                  // DEPLOYMENT
                </span>

                <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  Live and inspectable<span className="text-cyan">.</span>
                </h2>

                <p className="mt-8 text-base leading-relaxed text-foreground/65 md:text-lg">
                  The plugin runs on Solana devnet under the program ID
                  below. The source is on GitHub. Read it, run it locally,
                  fork it.
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
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Run your DAO<span className="text-cyan">.</span>
            <br />
            On verified humans<span className="text-cyan">.</span>
          </h2>
          <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-foreground/65 md:text-lg">
            The first wave of devnet pilots is open. Run a Realms
            governance and want to test the plugin against a live
            proposal? Get in touch.
          </p>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:contact@entros.io?subject=Realms%20plugin%20pilot"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
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
                rounded-full border border-foreground/20 px-6 py-3
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
