import { AgentCheckForm } from "@/components/sections/agent-check-form";

const TEST_AGENT = "CW9ogj3qxGxqdyMdsbVr6fkh6F9S5xYYkiNQir7LMW1M";

export function AgentsCheckSection() {
  return (
    <section id="check" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // CHECK AN AGENT
        </span>

        <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Read an agent's current state<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Enter an agent asset address to read its current owner, its agent wallet, and the
          owner's Entros Anchor from devnet. The example below is an Entros test agent.
        </p>

        <div className="mt-12 border border-border p-6 md:p-8">
          <AgentCheckForm initialAgent={TEST_AGENT} inputId="check-agent-asset" />
        </div>
      </div>
    </section>
  );
}
