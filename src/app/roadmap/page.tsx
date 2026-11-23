import Link from "next/link";
import {
  AgentGlyph,
  ServerGlyph,
  ShieldGlyph,
  VoiceGlyph,
} from "@/components/icons/glyphs";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Roadmap",
  description:
    "Active work on real-time voice liveness and Web2-first AI agent authorization, plus maintenance status for Solana devnet programs.",
  path: "/roadmap",
});

const activeTracks = [
  {
    Icon: VoiceGlyph,
    label: "Blind voice anti-spoofing and telephony codecs",
    status: "In progress",
    active: true,
    description:
      "Production validation enforces the pinned v2 AASIST-L model while Entros trains and evaluates a distilled successor against unseen neural TTS, live voice conversion, partial splices, webrtc_16k, and telephony_8k codecs under preregistered blind holdout gates.",
  },
  {
    Icon: ServerGlyph,
    label: "Hosted Voice Defense API and VPC sidecar",
    status: "Next",
    active: false,
    description:
      "Streaming WebSocket and HTTP endpoints score raw un-denoised audio in memory with zero disk persistence, calibrated operating profiles, and explicit insufficient_signal abstention states, paired with an INT8 CPU VPC sidecar.",
  },
  {
    Icon: AgentGlyph,
    label: "Web2-first AgentPermit v2",
    status: "Next",
    active: false,
    description:
      "Expanding pure-MIT @entros/verify/mcp with OIDC and JWT principals, Passkey and WebAuthn step-up approvals, signed voice-liveness binding, compliance receipts, and a Python SDK with zero wallet or SOL requirement, while keeping @entros/verify/solana as an optional adapter.",
  },
  {
    Icon: ShieldGlyph,
    label: "Design-partner pilots",
    status: "Upcoming",
    active: false,
    description:
      "Deploying real-time voice liveness and action-bound MCP authorization on live traffic with initial enterprise and developer partners.",
  },
];

export default function Roadmap() {
  return (
    <>
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-32 pb-16 md:pt-40 md:pb-24 lg:grid-cols-12 lg:items-center lg:gap-12">
          <div className="lg:col-span-7">
            <h1 className="text-balance font-display text-4xl font-normal leading-[1.04] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
              Voice defense and agent authorization first
              <span className="text-[var(--verification-accent-text)]">.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted md:mt-8 md:text-lg">
              Entros builds the live human-presence and consent firewall for
              voice-AI and autonomous agents: real-time zero-retention voice
              liveness paired with single-use AgentPermit and MCP authorization.
              Solana devnet programs remain live and open source while Solana
              mainnet deployment stays paused pending customer demand.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="#tracks"
                className="inline-flex items-center justify-center bg-foreground px-6 py-3 text-sm font-medium text-background transition-[background-color,transform] duration-150 ease-out hover:bg-foreground/90 active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none"
              >
                Active tracks
              </Link>
              <Link
                href="/security"
                className="inline-flex items-center justify-center bg-surface px-6 py-3 text-sm font-medium text-foreground transition-[background-color,transform] duration-150 ease-out hover:bg-surface-hover active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none"
              >
                Security Program
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-surface p-6 md:p-8">
              <p className="text-sm font-medium text-muted">
                Engineering sequence
              </p>
              <ol className="mt-6 space-y-5">
                {activeTracks.map((track) => (
                  <li key={track.label} className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className={
                        track.active
                          ? "mt-2 h-2 w-2 shrink-0 bg-[var(--verification-accent-text)]"
                          : "mt-2 h-2 w-2 shrink-0 bg-subtle"
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-medium tracking-tight text-foreground">
                        {track.label}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted">
                        {track.status}
                      </p>
                    </div>
                  </li>
                ))}
                <li className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2 w-2 shrink-0 bg-subtle"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-medium tracking-tight text-muted">
                      Solana mainnet ceremony and audit
                    </p>
                    <p className="mt-1 text-xs font-medium text-muted">
                      Paused pending customer demand
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section id="tracks" className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-28">
          <h2 className="max-w-3xl text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Active engineering tracks
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            Items below are in active development or queued next, not live as
            commercial SLAs today.
          </p>

          <div className="mt-12 space-y-4">
            {activeTracks.map((track) => {
              const Icon = track.Icon;
              return (
                <div
                  key={track.label}
                  className="grid grid-cols-1 gap-x-10 gap-y-4 bg-background p-6 md:grid-cols-[18rem_1fr] md:p-8"
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-6 w-6 shrink-0 text-foreground" />
                    <div>
                      <h3 className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                        {track.label}
                      </h3>
                      <p className="mt-2 text-sm font-medium text-muted">
                        {track.status}
                      </p>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-muted md:text-lg">
                    {track.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-28">
          <div className="max-w-3xl">
            <h2 className="text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Why the roadmap changed
              <span className="text-[var(--verification-accent-text)]">.</span>
            </h2>

            <div className="mt-8 space-y-5 text-base leading-relaxed text-muted md:text-lg">
              <p>
                Real-time voice cloning streams faster than a caller reads a
                prompt off a screen, exposing phone lines, help desks, wire
                approvals, and voice-AI channels to live impersonation. Teams
                shipping autonomous MCP agents also need signed human approval
                gates that work with standard enterprise authentication rather
                than crypto wallets or spoken browser popups.
              </p>
              <p>
                Entros concentrates active engineering on its strongest verified
                components: compact CPU ONNX voice anti-spoofing gated by a
                blind adversarial test bank, and the pure-MIT AgentPermit and
                MCP package in{" "}
                <span className="font-mono text-sm text-foreground md:text-base">
                  @entros/verify@0.7.0
                </span>
                . Spending capital on a Solana trusted-setup ceremony and
                mainnet contract audit ahead of paying security deployments
                would delay both tracks.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-28">
          <h2 className="max-w-3xl text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Live today
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h2>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="bg-background p-6 md:p-8">
              <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                Production validation and npm packages
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                Production validation enforces the pinned{" "}
                <span className="font-mono text-foreground">v2 AASIST-L</span>{" "}
                anti-spoofing model (
                <span className="font-mono text-foreground tabular-nums">
                  131.0 ms
                </span>{" "}
                p95 latency,{" "}
                <span className="font-mono text-foreground tabular-nums">
                  495.5 MB
                </span>{" "}
                RSS, and{" "}
                <span className="font-mono text-foreground tabular-nums">
                  61.84%
                </span>{" "}
                catch rate on unseen neural TTS). Published npm packages remain{" "}
                <span className="font-mono text-foreground">
                  @entros/verify@0.7.0
                </span>{" "}
                and{" "}
                <span className="font-mono text-foreground">
                  @entros/pulse-sdk@4.18.1
                </span>
                .
              </p>
            </div>

            <div className="bg-background p-6 md:p-8">
              <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                Solana devnet and browser lab
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                Solana devnet programs (
                <span className="font-mono text-foreground">entros-anchor</span>
                ,{" "}
                <span className="font-mono text-foreground">
                  entros-verifier
                </span>
                ,{" "}
                <span className="font-mono text-foreground">
                  entros-registry
                </span>
                , and{" "}
                <span className="font-mono text-foreground">
                  entros-voter-weight
                </span>
                ) remain deployed and open source. Paired browser liveness
                remains available at{" "}
                <Link
                  href="/lab/paired-liveness"
                  className="text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                >
                  Paired Liveness Lab
                </Link>{" "}
                and{" "}
                <Link
                  href="/verify"
                  className="text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                >
                  /verify
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-28">
          <h2 className="max-w-3xl text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Solana devnet and paired browser liveness
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
            Maintenance and paused surfaces stay online and documented.
          </p>

          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="bg-surface p-6 md:p-8">
              <h3 className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                Solana mainnet gates paused
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                The public multi-party trusted-setup ceremony, independent
                Anchor and circuit security audit, Solana mainnet deployment,
                and validator network research stay paused until customer demand
                calls for optional on-chain audit anchoring.
              </p>
            </div>

            <div className="bg-surface p-6 md:p-8">
              <h3 className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                Secondary research surface
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">
                The paired browser liveness flow stays available at{" "}
                <Link
                  href="/lab/paired-liveness"
                  className="text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                >
                  /lab/paired-liveness
                </Link>{" "}
                and{" "}
                <Link
                  href="/verify"
                  className="text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                >
                  /verify
                </Link>
                , with{" "}
                <span className="font-mono text-foreground">
                  /embed/verify-popup
                </span>{" "}
                preserved for published packages and the 2026 write-up archived
                at{" "}
                <Link
                  href="/paper"
                  className="text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                >
                  /paper
                </Link>
                .
              </p>
            </div>

            <div className="bg-surface p-6 md:p-8 md:col-span-2">
              <h3 className="font-display text-lg font-medium tracking-tight text-foreground md:text-xl">
                $ENTROS token separation
              </h3>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted md:text-base">
                $ENTROS remains a standard SPL mint with zero coupling to Entros
                security products, API billing, or engineering roadmaps. See{" "}
                <Link
                  href="/token"
                  className="text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground"
                >
                  Token Record
                </Link>{" "}
                for the public Streamflow lockup schedule.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:py-28">
          <h2 className="text-balance font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Inspect live security posture
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/security"
              className="inline-flex items-center justify-center bg-foreground px-6 py-3 text-sm font-medium text-background transition-[background-color,transform] duration-150 ease-out hover:bg-foreground/90 active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none"
            >
              Security Program
            </Link>
            <Link
              href="/docs/quickstart/mcp-approval"
              className="inline-flex items-center justify-center bg-background px-6 py-3 text-sm font-medium text-foreground transition-[background-color,transform] duration-150 ease-out hover:bg-surface-hover active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none"
            >
              MCP Quickstart
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
