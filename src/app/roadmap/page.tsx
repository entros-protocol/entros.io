import Link from "next/link";
import { ArrowRight, KeyRound, ShieldCheck, Wrench } from "lucide-react";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Mainnet Roadmap",
  description:
    "What gates Entros mainnet. A public trusted setup ceremony, an external security audit, and the operational lift. Devnet today, mainnet earned.",
  path: "/roadmap",
});

const gates = [
  {
    Icon: KeyRound,
    label: "Trusted setup ceremony",
    window: "June 2026 target window",
    description:
      "Multiple participants run the ceremony in sequence, each contributing random entropy and destroying it after use. The resulting verifying key replaces the one currently compiled into entros-verifier. The math holds when one participant is honest about the destruction step. Ecosystem builders and integrators sign up to participate; contributors fill the remaining slots.",
  },
  {
    Icon: ShieldCheck,
    label: "External security audit",
    window: "July–August 2026 target window",
    description:
      "An established Solana audit firm reviews the three on-chain programs and the on-chain proof flow. entros-verifier carries the highest stakes; entros-registry handles fees and validator staking; entros-anchor mints the non-transferable token. The firm publishes its report on completion, with findings remediated in public.",
  },
  {
    Icon: Wrench,
    label: "Operational lift",
    window: "Pre-flip",
    description:
      "Paid RPC capacity, a hardware-wallet upgrade authority, treasury backup and recovery procedures, monitoring, an incident-response runbook, and a partner integrator on standby for the first live mainnet verification. Each item is small. The items run in sequence.",
  },
];

const timeline = [
  {
    window: "May 2026",
    title: "Submission shipped",
    body: "The devnet pilot is open at entros.io/verify. Three Anchor programs run live. The Solana Attestation Service issues an attestation on every verification. Realms voter-weight plugin and Agent Anchor for the 8004 registry both ship.",
  },
  {
    window: "June 2026",
    title: "Ceremony window",
    body: "Recruit participants from across the ecosystem. Run the multi-party setup. Recompile entros-verifier against the new key. Publish the log and hash chain at entros.io/ceremony.",
  },
  {
    window: "July–August 2026",
    title: "External audit window",
    body: "Four to eight weeks of active review, then one to two weeks of fix verification. The audit firm publishes its final report; we publish the patch trail alongside.",
  },
  {
    window: "August–September 2026",
    title: "Mainnet deploy",
    body: "The team deploys all three programs under a hardware-wallet upgrade authority. Smoke tests run from web, mobile, and a partner integrator's staging environment. The treasury and incident procedures get tested against real flow.",
  },
  {
    window: "September 2026",
    title: "Public mainnet launch",
    body: "Public announcement. Partner co-announcements. Token-related launches stay deferred until adoption and community involvement support them.",
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
              Mainnet earned<span className="text-cyan">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
              Three items gate the flip from devnet to mainnet: a public
              trusted setup ceremony, an external security audit, and the
              operational lift to run a treasury and incident response on
              live infrastructure. Each is a public artifact. None gets
              shortcut.
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

          {/* Hero panel — three-row preview of the gates with status pills */}
          <div className="lg:col-span-4">
            <div className="border border-border p-6 md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                // GATES TO MAINNET
              </p>

              <ol className="mt-8 space-y-6">
                {gates.map((gate, i) => {
                  const Icon = gate.Icon;
                  return (
                    <li key={gate.label} className="flex items-start gap-4">
                      <span className="mt-0.5 font-mono text-xs tracking-[0.2em] text-cyan">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon
                            className="h-4 w-4 text-cyan"
                            strokeWidth={1.5}
                          />
                          <p className="font-display text-base font-medium tracking-tight text-foreground">
                            {gate.label}
                          </p>
                        </div>
                        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/50">
                          {gate.window}
                        </p>
                      </div>
                    </li>
                  );
                })}
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
            What gates the flip<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            The first gate is a cryptographic ceremony. The second is an
            independent review. The third is the operational work to run
            real money on real infrastructure. Each clears before the next
            begins.
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
            The path from devnet to mainnet<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Each date is a target window. The decision criteria below
            govern the flip itself.
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
                  // DECISION GATES
                </span>

                <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:mt-0">
                  What clears the flip<span className="text-cyan">.</span>
                </h2>

                <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                  The calendar moves around the checklist. If an item is
                  missing on the target date, the flip waits.
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
            // WHY WAIT
          </span>

          <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            The cost of going early<span className="text-cyan">.</span>
          </h2>

          <div className="mt-8 space-y-6 text-base leading-relaxed text-foreground/70 md:text-lg">
            <p>
              Shipping mainnet ahead of the ceremony leaves the verifying
              key compiled from a single-party setup. Whoever ran that
              setup holds the keys to forge proofs against the deployed
              verifier. On devnet that matters to nobody. On mainnet, with
              users paying fees and integrators reading attestations as
              authoritative, that is a protocol-ending vulnerability.
            </p>
            <p>
              Shipping mainnet ahead of the audit means a bug in the
              cryptographic anchor only surfaces under live traffic. We
              would rather find the bug under contract with an audit firm
              than under contract with our integrators.
            </p>
            <p>
              The label change from devnet to mainnet is worth less than
              the integrity of what the label points at. Entros runs on
              devnet until the gates clear.
            </p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Devnet today<span className="text-cyan">.</span>
            <br />
            Mainnet earned<span className="text-cyan">.</span>
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
              Try the devnet pilot
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
