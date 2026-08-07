import Link from "next/link";
import { ArrowRight, BadgeCheck, ShieldCheck } from "lucide-react";
import {
  integrationSnippets,
  useCaseSnippets,
  verifyComponentSnippet,
} from "@/data/integration-snippets";
import { CodeBlock } from "@/components/ui/code-block";
import { IntegratePlayground } from "./integrate-playground";

const CONFIG_OPTIONS = [
  { name: "cluster", type: '"devnet" | "mainnet-beta" | "localnet"', description: "SDK target. Current hosted Entros support is devnet-only." },
  { name: "rpcEndpoint", type: "string", description: "Custom RPC URL (optional)." },
  { name: "relayerUrl", type: "string", description: "Entros executor endpoint (advanced; not needed for wallet-connected)." },
  { name: "relayerApiKey", type: "string", description: "Executor API key (advanced; not needed for wallet-connected)." },
  { name: "wasmUrl", type: "string", description: "Path to entros_hamming.wasm circuit artifact." },
  { name: "zkeyUrl", type: "string", description: "Path to entros_hamming_final.zkey proving key." },
  { name: "threshold", type: "number", description: "Hamming distance threshold (default: 96)." },
];

const ABUSE_MECHANISMS = [
  {
    number: "01",
    title: "Rate limiting",
    description:
      "Cap verifications per IP, per session, or per time window. The relayer enforces limits before a transaction reaches the chain.",
  },
  {
    number: "02",
    title: "Trust Score thresholds",
    description:
      "Require a Trust Score floor and a recent verification to reach protected features. New identities start at zero. High-value actions can ask for a verification at the action itself.",
  },
  {
    number: "03",
    title: "Protocol fee",
    description:
      "The configured fee and rate limits bound request volume. The validation policy still decides whether a capture passes.",
  },
  {
    number: "04",
    title: "Closed-source defense layer",
    description:
      "Captures pass through a closed-source validation pipeline before reaching the chain. Rejection responses are uniform across check types—no per-check signal leaks to clients, denying attackers a directed-calibration channel.",
  },
];

export function IntegrateGuide() {
  return (
    <>
      {/* Tier 1 — Drop-in component. Lead with the truly five-line path. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // TIER 1 — DROP-IN
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
              FASTEST PATH
            </span>
          </div>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Five lines<span className="text-cyan">.</span> One component<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            {verifyComponentSnippet.description}
          </p>

          <div className="mt-12 grid grid-cols-1 gap-px border-y border-border bg-border lg:grid-cols-5">
            <div className="flex flex-col bg-background p-8 md:p-10 lg:col-span-2">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tracking-[0.2em] text-cyan">01</span>
                <span className="h-px flex-1 bg-border" />
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground/50">
                  RECOMMENDED
                </span>
              </div>

              <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                {verifyComponentSnippet.title}
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                The popup hosts the wallet connection, the 12-second
                capture, the proof, and the chain submit. Your app stays
                wallet-adapter-free until the moment a verified payload
                arrives on the callback.
              </p>

              <div className="mt-6 font-mono text-xs text-foreground/55">
                <span className="text-foreground/30">$</span>{" "}
                {verifyComponentSnippet.installCommand}
              </div>
            </div>

            <div className="flex flex-col justify-center bg-background p-8 md:p-10 lg:col-span-3">
              <CodeBlock code={verifyComponentSnippet.code} />
            </div>
          </div>
        </div>
      </section>

      {/* Tier 2 — Programmatic SDK. For apps that want to own the UX. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // TIER 2 — PROGRAMMATIC SDK
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
              CUSTOM UX
            </span>
          </div>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Custom UX<span className="text-cyan">.</span> Full control<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            For apps that want to own the verification UX—custom capture
            canvas, inline rather than popup, branded loading states. Each
            verification produces a Groth16 proof, an on-chain Anchor, a
            SAS attestation, and a Trust Score that compounds across
            re-verifications.
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

          <div className="mt-8 font-mono text-xs text-foreground/55">
            <span className="text-foreground/30">$</span> npm install @entros/pulse-sdk
          </div>
        </div>
      </section>

      {/* Try it live—playground */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // TRY IT LIVE
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Query on-chain identity<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            This is what your integration reads. Paste any wallet address
            to see its Entros verification status, Trust Score, and history
            directly from Solana devnet.
          </p>

          <div className="mt-12">
            <IntegratePlayground />
          </div>
        </div>
      </section>

      {/* Tier 3 — Read-only patterns. No verification flow in your app. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // TIER 3 — READ-ONLY
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
              GATE OR DISPLAY
            </span>
          </div>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Read<span className="text-cyan">.</span> Gate<span className="text-cyan">.</span> Display<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            For apps that read an existing Anchor rather than running the
            capture. Free reads via <code className="font-mono text-cyan">verifyEntrosAttestation()</code>,
            optional copy-source React components for badges and gates. For an
            action worth the friction, pair it with a verification at the point
            of the action.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border lg:grid-cols-2">
            {useCaseSnippets.map((snippet, idx) => (
              <div
                key={snippet.title}
                className={`flex flex-col bg-background p-8 md:p-10 ${
                  idx === 2 ? "lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {snippet.title}
                </h3>

                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
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

      {/* Live demos for the Tier 3 display primitives. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // LIVE DEMOS
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Display primitives<span className="text-cyan">.</span> Live previews<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            Copy the source, paste into your Tailwind project, render
            anywhere. No custom UI dependencies, no Entros backend. Each
            component reads directly from Solana via your existing wallet
            connection.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-2">
            <div className="flex flex-col bg-background p-8 md:p-10">
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                <span className="h-px flex-1 bg-border" />
              </div>

              <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                &lt;EntrosBadge /&gt;
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                Pill that displays any wallet's Trust Score. Use in
                profiles, comments, leaderboards, anywhere humanness
                matters.
              </p>

              <Link
                href="/badge-demo"
                className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-cyan transition-colors hover:text-foreground"
              >
                Live demo · source
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="flex flex-col bg-background p-8 md:p-10">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                <span className="h-px flex-1 bg-border" />
              </div>

              <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                &lt;EntrosGate minTrustScore=&#123;N&#125;&gt;
              </h3>

              <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                Route guard. Wrap any content, set a Trust Score floor and a
                recency window, and the gate handles wallet connection,
                identity lookup, and verification prompts.
              </p>

              <Link
                href="/gate-demo"
                className="mt-6 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-cyan transition-colors hover:text-foreground"
              >
                Live demo · source
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pulse SDK configuration—hairline table. */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // PULSE SDK · CONFIGURATION
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Seven options<span className="text-cyan">.</span> Sensible defaults<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            Tier 2 only. The drop-in <code className="font-mono text-cyan">{`<EntrosVerify />`}</code> component takes its config from the popup-host and exposes a smaller prop surface (integrator key, cluster, optional trust-score floor).
          </p>

          <div className="mt-12 overflow-x-auto border border-border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-5 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Option
                  </th>
                  <th className="px-5 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Type
                  </th>
                  <th className="px-5 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {CONFIG_OPTIONS.map((opt, i) => (
                  <tr
                    key={opt.name}
                    className={i < CONFIG_OPTIONS.length - 1 ? "border-b border-border" : ""}
                  >
                    <td className="px-5 py-4 font-mono text-cyan">{opt.name}</td>
                    <td className="px-5 py-4 font-mono text-foreground/55">{opt.type}</td>
                    <td className="px-5 py-4 leading-relaxed text-foreground/75">
                      {opt.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Pricing—single panel */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
                // PRICING
              </span>

              <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                Zero integration cost<span className="text-cyan">.</span>
              </h2>
            </div>

            <div className="lg:col-span-7">
              <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
                Wallet-connected users pay a small protocol fee per
                verification (~0.005 SOL). Your application reads on-chain
                state for free via{" "}
                <code className="font-mono text-cyan">verifyEntrosAttestation()</code>.
                No escrow, no API keys, no billing relationship.
              </p>
              <p className="mt-6 text-sm leading-relaxed text-foreground/55 md:text-base">
                First verification also funds Solana account rent for the
                Anchor mint, token account, and identity state. Network rent
                and transaction fees vary. The wallet displays the final
                amount before approval.
              </p>
              <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
                Integrators receive a public policy signal without an API
                billing relationship. Current protocol fees accrue to the
                treasury. Validator rewards remain a planned mechanism.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Abuse Prevention—4 mechanism cards in 2-col hairline grid */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // ABUSE PREVENTION
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Built-in bot resistance<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            The validation service evaluates submitted evidence before it reaches the
            chain. Verification also costs SOL, so Anchors are not free to
            hold. You control trust requirements through four mechanisms.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-2">
            {ABUSE_MECHANISMS.map((m) => (
              <div key={m.number} className="flex flex-col bg-background p-8 md:p-10">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                    {m.number}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <h3 className="mt-6 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {m.title}
                </h3>

                <p className="mt-4 text-sm leading-relaxed text-foreground/65">
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
