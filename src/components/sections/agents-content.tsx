import { AgentPermitDiagram } from "@/components/ui/agent-permit-diagram";
import { AgentPermitSnippet } from "@/components/ui/agent-permit-snippet";
import { ExternalLink } from "lucide-react";
import { agentPermitChecks, agentPermitRun, agentPermitSteps } from "@/data/agent-permit";
import { explorerUrl } from "@/lib/explorer";

export function AgentsContent() {
  return (
    <>
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            A third option for agents<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
              An app blocks automation and loses the agents people want, or
              admits every agent with no record of who approved what.
            </p>
            <p className="text-base leading-relaxed text-foreground/65 md:text-lg">
              A permit is that option: one action, signed by the owning wallet,
              which holds a current Entros verification. The permit carries that
              check to every action.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            One permit covers one action<span className="text-cyan">.</span>
          </h2>
          <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
                An agent that wants to cast a vote or claim a reward brings a
                permit. Its current owner signed it, and it expires within 15
                minutes.
              </p>
              <p className="mt-6 text-base leading-relaxed text-foreground/70 md:text-lg">
                When the action runs, the app checks three things:
              </p>
              <ol className="mt-5 space-y-3">
                {agentPermitChecks.map((check, index) => (
                  <li key={check} className="flex gap-4 text-base leading-relaxed text-foreground/70 md:text-lg">
                    <span className="mt-[0.4em] shrink-0 font-mono text-xs tracking-[0.2em] text-cyan">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{check}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
                If the agent changes hands, unused permits stop working. A copied
                permit is useless without the agent's key.
              </p>
            </div>
            <div className="lg:col-span-6">
              <AgentPermitDiagram />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            From request to action<span className="text-cyan">.</span>
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
            {agentPermitSteps.map((step) => (
              <div key={step.number} className="flex flex-col bg-background p-8 md:p-10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tracking-[0.2em] text-cyan">{step.number}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-foreground/65">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            One run, on the record<span className="text-cyan">.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            An owner bound a test agent, signed one permit, and tried four ways
            to reuse it. Every transaction is on devnet.
          </p>
          <ol className="mt-12 grid grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {agentPermitRun.steps.map((step) => (
              <li key={step.outcome} className="flex flex-col bg-background p-6">
                <p className="text-sm font-medium text-foreground">
                  {step.outcome}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/65">{step.detail}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-10">
            {[
              { label: "The agent", href: explorerUrl(agentPermitRun.agent) },
              { label: "Binding transaction", href: explorerUrl(agentPermitRun.bindTransaction, "tx") },
              { label: "Sale transaction", href: explorerUrl(agentPermitRun.transferTransaction, "tx") },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2.5 text-base font-medium text-foreground underline decoration-cyan/60 underline-offset-4 transition-colors hover:decoration-cyan md:text-lg"
              >
                {link.label}
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                Everything the check needs is on Solana<span className="text-cyan">.</span>
              </h2>
              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                The Solana Agent Registry records each agent's owner and key,
                and the owner's Entros Anchor sits on Solana for any app to
                read. Neither says who approved the agent's action.
              </p>
              <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
                Your service checks the permit against the chain with Pulse and
                @entros/verify. No Entros service takes part. Expired and forged
                permits fail before any chain read. Devnet today.
              </p>
            </div>
            <div className="lg:col-span-7">
              {/* The block is sized to its longest line. The width it gives back becomes a hairline
                  running out to the right-hand rail, and `-mr-6` cancels the container padding. */}
              <div className="flex items-center">
                <div className="min-w-0 w-full lg:w-auto lg:shrink lg:grow-0 lg:basis-[39rem]">
                  <AgentPermitSnippet />
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
