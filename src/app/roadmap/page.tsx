import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Roadmap",
  description:
    "Entros is live on devnet with a shipped SDK and proven red-team results. The token funds the path to mainnet: a public trusted setup ceremony and an external security audit.",
  path: "/roadmap",
});

const gates = [
  {
    Icon: KeyRound,
    label: "Trusted setup ceremony",
    window: "Public ceremony",
    description:
      "Multiple participants run the ceremony in sequence, each contributing random entropy and destroying it after use. The resulting verifying key replaces the one currently compiled into entros-verifier. The math holds when one participant is honest about the destruction step. Ecosystem builders and integrators sign up to participate; contributors fill the remaining slots.",
  },
  {
    Icon: ShieldCheck,
    label: "External security audit",
    window: "Independent audit",
    description:
      "An established Solana audit firm reviews the three on-chain programs and the on-chain proof flow. entros-verifier carries the highest stakes; entros-registry handles fees and validator staking; entros-anchor mints the non-transferable token. The firm publishes its report on completion, with findings remediated in public.",
  },
  {
    Icon: Wrench,
    label: "Operational lift",
    window: "Launch prep",
    description:
      "Paid RPC capacity, a hardware-wallet upgrade authority, treasury backup and recovery procedures, monitoring, an incident-response runbook, and a partner integrator on standby for the first live mainnet verification. Each item is small. The items run in sequence.",
  },
];

const timeline = [
  {
    window: "May 2026",
    title: "Devnet pilot live",
    body: "The devnet pilot is open at entros.io/verify. Three Anchor programs run live. The Solana Attestation Service issues an attestation on every verification. The Realms voter-weight plugin and Agent Anchor for the 8004 registry both ship.",
  },
  {
    window: "Now",
    title: "$ENTROS launch",
    body: "The token launches to fund the path to mainnet and align the community from day one. Validator staking, fee-share, and governance activate in phases as the network decentralizes.",
  },
  {
    window: "Next",
    title: "Trusted setup ceremony",
    body: "Participants from across the ecosystem run the multi-party setup, each contributing entropy. We recompile entros-verifier against the new key and publish the log and hash chain at entros.io/ceremony.",
  },
  {
    window: "Then",
    title: "External security audit",
    body: "An established Solana firm reviews the three programs and the proof flow. The firm publishes its final report and we publish the patch trail alongside.",
  },
  {
    window: "Launch",
    title: "Mainnet launch",
    body: "The three programs deploy under a hardware-wallet upgrade authority, with a partner integrator on the first live verification. The treasury and incident procedures run against real flow.",
  },
  {
    window: "After launch",
    title: "Decentralized validator network",
    body: "VRF-selected validator cohorts stake $ENTROS, earn a share of verification fees, and govern protocol parameters. The Anonymity Ring opens to permissionless operation.",
  },
];

const flipCriteria = [
  "Trusted setup ceremony complete, with the public log and at least one independent participant on record",
  "Audit report published, with all critical and high findings remediated",
  "Hardware-wallet upgrade authority configured",
  "Deploy procedure verified end-to-end against a mainnet-cloned local validator",
  "Monitoring and incident-response runbook documented",
  "Treasury backup and recovery procedure tested",
  "Partner integrator on standby for the first live mainnet verification",
];

export default function Roadmap() {
  return (
    <>
      {/* Hero — asymmetric: text left (3/5), checklist panel right (2/5).
          The panel previews the three gates so a reader sees the structure
          before scrolling. */}
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-32 pb-20 md:pt-40 md:pb-28 lg:grid-cols-9 lg:items-center lg:gap-10">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // MAINNET ROADMAP
            </span>

            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
              Devnet today<span className="text-cyan">.</span>
              <br />
              Mainnet next<span className="text-cyan">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
              Entros is live on devnet: three programs, a shipped SDK, and a
              pipeline that already blocks recorded-voice replay and collapses
              synthetic sybil farms in our own red-team. The token funds the
              path to mainnet.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="#timeline"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full bg-foreground px-6 py-3
                  text-sm font-medium text-background
                  transition-colors hover:bg-foreground/90
                "
              >
                See the timeline
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/paper"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full border border-foreground/20 px-6 py-3
                  text-sm font-medium text-foreground
                  transition-colors hover:border-foreground/40 hover:bg-foreground/5
                "
              >
                Read the paper
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Hero panel: the path to mainnet as a plain ordered sequence.
              No header — the section eyebrow and headline beside it already
              say what this is and that devnet is live. No per-gate icons or
              category chips either: those restated the step titles. What is
              left is the order, which step is next, and where the sequence
              ends. Each gate's substance lives in the section below. */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl bg-foreground/[0.06] px-8 py-10 md:px-10 md:py-12">
              {/* `w-fit` collapses the list to its own content width so the
                  sequence sits centred rather than against the left edge
                  with a wide empty gutter. */}
              <ol className="relative mx-auto w-fit">
                {/* One continuous spine behind every marker, stopped short
                    at both ends so it reads as a path rather than a rule. */}
                <span
                  aria-hidden
                  className="absolute bottom-3 left-[3.5px] top-3 w-px bg-border"
                />

                {[...gates.map((g) => g.label), "Mainnet launch"].map(
                  (label, i, all) => {
                    const isNext = i === 0;
                    const isDestination = i === all.length - 1;
                    return (
                      <li
                        key={label}
                        className={cn(
                          "relative flex items-center gap-5",
                          isDestination ? "pt-10" : "pb-10"
                        )}
                      >
                        <span
                          aria-hidden
                          className={cn(
                            "relative z-10 h-2 w-2 shrink-0 rounded-full",
                            isNext && "bg-cyan",
                            isDestination && "bg-foreground",
                            !isNext &&
                              !isDestination &&
                              "border border-foreground/30 bg-background"
                          )}
                        />
                        <p
                          className={cn(
                            "font-display text-base font-medium tracking-tight md:text-lg",
                            isNext || isDestination
                              ? "text-foreground"
                              : "text-foreground/55"
                          )}
                        >
                          {label}
                        </p>
                        {isNext && (
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan">
                            Next
                          </span>
                        )}
                      </li>
                    );
                  }
                )}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* The three gates — vertical hairline stack, full description */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // THE THREE GATES
          </span>

          <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            What still has to happen<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Three pieces of work take Entros to mainnet: a public cryptographic
            ceremony, an independent audit, and the operational lift to run
            real value on live infrastructure. Each ships in public.
          </p>

          <div className="mt-16 border-t border-border">
            {gates.map((gate) => {
              const Icon = gate.Icon;
              return (
                <div
                  key={gate.label}
                  className="grid grid-cols-1 gap-x-12 gap-y-4 border-b border-border py-10 md:grid-cols-[14rem_1fr] md:py-14"
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className="mt-1 h-5 w-5 shrink-0 text-cyan"
                      strokeWidth={1.5}
                    />
                    <div>
                      <p className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                        {gate.label}
                      </p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/50">
                        {gate.window}
                      </p>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-foreground/65 md:text-lg">
                    {gate.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline — vertical milestone list with date rails */}
      <section id="timeline" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // TIMELINE
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            From devnet to decentralized<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            What has shipped, and what comes next.
          </p>

          <ol className="mt-16 border-t border-border">
            {timeline.map((item) => (
              <li
                key={item.title}
                className="grid grid-cols-1 gap-x-12 gap-y-3 border-b border-border py-10 md:grid-cols-[14rem_1fr] md:py-12"
              >
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
                  {item.window}
                </p>
                <div>
                  <h3 className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-foreground/65 md:text-lg">
                    {item.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Decision gates — the checklist */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
              <div className="lg:relative">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40 lg:absolute lg:bottom-full lg:left-0 lg:mb-6 lg:whitespace-nowrap">
                  // LAUNCH CRITERIA
                </span>

                <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  The go/no-go list<span className="text-cyan">.</span>
                </h2>

                <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                  The three gates above, restated as conditions anyone
                  can check. Each one gets ticked off in the open.
                </p>
              </div>
            </div>

            <div className="lg:col-span-7">
              <ul className="border border-border">
                {flipCriteria.map((item, i) => (
                  <li
                    key={item}
                    className={`flex items-start gap-4 px-6 py-5 md:px-8 ${
                      i < flipCriteria.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <span className="mt-1 font-mono text-xs tracking-[0.2em] text-cyan">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why wait — closing principle */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // RATIONALE
          </span>

          <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Why both, and why in public<span className="text-cyan">.</span>
          </h2>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/70 md:text-lg">
            <p>
              The multi-party ceremony matters because a single-party setup
              lets whoever ran it forge proofs against the verifier. The audit
              matters because a bug in the cryptographic anchor should surface
              under contract with an audit firm, not under live traffic. So we
              do both, in public, before mainnet carries real value.
            </p>
            <p>
              The token funds that work.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            The road to mainnet<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/security"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Security program
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Try it live
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
