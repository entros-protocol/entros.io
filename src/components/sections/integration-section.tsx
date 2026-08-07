import { CodeBlock } from "@/components/ui/code-block";
import { integrationSnippets } from "@/data/integration-snippets";

/**
 * Integration — two verification modes side-by-side. Each panel: title,
 * description, code block. Mode label as a left-rail mono mark.
 */
export function IntegrationSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // INTEGRATION
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          One SDK, one flow<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Wallet-connected verification is the primary devnet path. First
          verification uses a validator receipt to mint the Anchor.
          Re-verification adds a Groth16 proof. Best-effort SAS issuance runs
          as a separate wallet action after protocol settlement.
        </p>

        <div className="mt-16 border-y border-border">
          {integrationSnippets.map((snippet) => (
            <div key={snippet.mode} className="flex flex-col bg-background p-8 md:p-10">
              <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                {snippet.title}
              </h3>

              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-foreground/65">
                {snippet.description}
              </p>

              <div className="mt-6">
                <CodeBlock code={snippet.code} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
