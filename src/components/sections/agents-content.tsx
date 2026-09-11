import { AgentPermitDiagram } from "@/components/ui/agent-permit-diagram";
import { AgentPermitSnippet } from "@/components/ui/agent-permit-snippet";
import { agentPermitChecks, agentPermitSteps } from "@/data/agent-permit";

export function AgentsContent() {
  return (
    <>
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // WHY PERMITS
          </span>
          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            A third option for agents<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
            <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
              Today an app has two options with agents. It can block all automation, which shuts out
              the agents people want to use. Or it can let every agent in, and then nothing shows
              whether anyone approved what an agent does.
            </p>
            <p className="text-base leading-relaxed text-foreground/65 md:text-lg">
              A permit adds a third option. The app lets an agent through for one action when the
              wallet that owns it signs off, and that wallet holds a recent Entros verification.
              Entros verification is the gate. The permit carries it to each agent action.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // THE PERMIT
          </span>
          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            One permit covers one action<span className="text-cyan">.</span>
          </h2>
          <div className="mt-16 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
                When an agent wants to do something that matters at an app, such as casting a vote or
                claiming a reward, it brings a permit. The agent's current owner signed it. It covers
                that one action and expires within 15 minutes.
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
                If the agent changes hands, its unused permits stop working. A copied permit is useless
                without the agent's key.
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
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // HOW IT WORKS
          </span>
          <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
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
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
                // FOR INTEGRATORS
              </span>
              <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                Everything the check needs is on Solana<span className="text-cyan">.</span>
              </h2>
              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                The Solana Agent Registry records each agent's owner and its own key. It does not say
                whether anyone approved what the agent does. The owner's Entros Anchor sits on Solana
                too, and any app can read it.
              </p>
              <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
                Your service checks the permit against the chain with Pulse and @entros/verify. No
                Entros service takes part. Expired and forged permits fail before any chain read.
                Devnet only.
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
