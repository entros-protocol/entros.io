"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { EntrosGate } from "@/components/ui/entros-gate";
import { CodeBlock } from "@/components/ui/code-block";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { ConnectedWalletPill } from "@/components/ui/connected-wallet-pill";

const USAGE_CODE = `import { EntrosGate } from "@/components/ui/entros-gate";

export function PremiumPage() {
  return (
    <EntrosGate minTrustScore={100}>
      {/* Children render only when the connected wallet
          has an Entros Anchor with trust score >= 100 */}
      <h1>Welcome, verified human.</h1>
    </EntrosGate>
  );
}`;

const FALLBACK_CODE = `<EntrosGate
  minTrustScore={100}
  fallback={<YourCustomPrompt />}
>
  <PremiumContent />
</EntrosGate>`;

const COMPONENT_CODE = `"use client";

/**
 * <EntrosGate>—drop-in route guard for Entros Trust Score.
 *
 * Renders children only when the connected wallet has an Entros Anchor with
 * trustScore >= minTrustScore. Otherwise renders a fallback (default: a
 * verification prompt linking to https://entros.io/verify, or a custom node via the
 * \`fallback\` prop).
 *
 * This component has zero internal UI dependencies. It uses only:
 *   - React + Next.js Link
 *   - @solana/web3.js (PublicKey, Connection)
 *   - @solana/wallet-adapter-react (useWallet, useConnection)
 *   - @solana/wallet-adapter-react-ui (WalletMultiButton)
 *   - @entros/pulse-sdk (PROGRAM_IDS constant)
 *   - lucide-react (icons)
 *   - Tailwind CSS for styling (no custom design system imports)
 *
 * Drop into any Next.js + Tailwind project with Solana wallet adapter set up.
 *
 * Example:
 *   <EntrosGate minTrustScore={100}>
 *     <PremiumContent />
 *   </EntrosGate>
 *
 * SECURITY: This is a client-side gate. It is suitable for UI gating, paywalls
 * with low stakes, and progressive disclosure. For high-stakes access control
 * (spending funds, sensitive data), also validate Trust Score server-side
 * since a determined user can bypass any client-side check via DevTools.
 */

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Connection, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PROGRAM_IDS } from "@entros/pulse-sdk";
import { Loader2, ShieldAlert, Wallet } from "lucide-react";

const EXPECTED_SIZE = 62;
const ENTROS_PROGRAM_ID = new PublicKey(PROGRAM_IDS.entrosAnchor);

interface EntrosGateProps {
  minTrustScore: number;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  verifyHref?: string;
}

type FetchState =
  | { status: "loading" }
  | { status: "disconnected" }
  | { status: "no-identity" }
  | { status: "ready"; trustScore: number };

export function EntrosGate({
  minTrustScore,
  children,
  fallback,
  loadingFallback,
  verifyHref = "https://entros.io/verify",
}: EntrosGateProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [fetchState, setFetchState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    if (!connected || !publicKey) {
      setFetchState({ status: "disconnected" });
      return;
    }

    setFetchState({ status: "loading" });
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      (async () => {
        try {
          const [identityPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode("identity"), publicKey.toBuffer()],
            ENTROS_PROGRAM_ID,
          );
          const conn = connection ?? new Connection("https://api.devnet.solana.com", "confirmed");
          const account = await conn.getAccountInfo(identityPda);
          if (!isMounted) return;

          if (!account || account.data.length < EXPECTED_SIZE) {
            setFetchState({ status: "no-identity" });
            return;
          }

          const view = new DataView(
            account.data.buffer,
            account.data.byteOffset,
            account.data.byteLength,
          );
          setFetchState({ status: "ready", trustScore: view.getUint16(60, true) });
        } catch {
          if (isMounted) setFetchState({ status: "no-identity" });
        }
      })();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [publicKey, connected, connection]);

  if (fetchState.status === "ready" && fetchState.trustScore >= minTrustScore) {
    return <>{children}</>;
  }

  if (fetchState.status === "loading") {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (fallback) return <>{fallback}</>;

  const fallbackState =
    fetchState.status === "ready"
      ? ({ status: "below-threshold", trustScore: fetchState.trustScore } as const)
      : fetchState;

  return (
    <DefaultFallback
      state={fallbackState}
      minTrustScore={minTrustScore}
      verifyHref={verifyHref}
    />
  );
}`;

export default function GateDemo() {
  const [thresholdInput, setThresholdInput] = useState("100");
  const [copied, setCopied] = useState(false);
  const { connected } = useWallet();

  const threshold = Math.min(10000, Math.max(0, parseInt(thresholdInput, 10) || 0));

  function copySource() {
    navigator.clipboard.writeText(COMPONENT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {/* Hero—asymmetric split. Left: wide h1 + copy + CTAs. Right:
          two stacked state cards showing the gate's branching output. */}
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-20 md:pt-40 md:pb-28">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // ENTROS GATE
          </span>

          <div className="mt-8 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
                Trust<span className="text-cyan">,</span>
                <br />
                as a gate<span className="text-cyan">.</span>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg">
                A drop-in React component that gates content by Entros
                Trust Score. Wrap any children, set a threshold, the gate
                handles wallet connection, identity lookup, and
                verification prompts.
              </p>

              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/integrate"
                  className="
                    group inline-flex items-center justify-center gap-2
                    rounded-full bg-foreground px-6 py-3
                    text-sm font-medium text-background
                    transition-colors hover:bg-foreground/90
                  "
                >
                  All components
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
                  Try the demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Two stacked state cards—the gate's branching output */}
            <div className="lg:col-span-5">
              <div className="space-y-6">
                {/* PASS state */}
                <div className="relative border border-cyan/40 bg-cyan/[0.03] p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan/80">
                      // PASS
                    </p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan/70">
                      482 ≥ 100
                    </span>
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 shrink-0 text-cyan" />
                    <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                      Welcome, verified human.
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-foreground/45">
                    {"<children />"} rendered
                  </p>
                </div>

                {/* BLOCK state */}
                <div className="relative border border-border p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                      // BLOCK
                    </p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                      0 &lt; 100
                    </span>
                  </div>
                  <div className="mt-6 flex items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-foreground/30 text-foreground/40">
                      <span className="h-1 w-1 rounded-full bg-foreground/40" />
                    </span>
                    <p className="font-display text-base font-medium tracking-tight text-foreground/55 md:text-lg">
                      Verify your humanness.
                    </p>
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-foreground/35">
                    {"<fallback />"} rendered
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live preview */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // LIVE PREVIEW
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Try it now<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Connect your wallet, dial the Trust Score threshold, and watch
            the gate decide what your wallet can see.
          </p>

          {/* Wallet status pill */}
          <div className="mt-10 flex justify-start">
            {connected ? (
              <ConnectedWalletPill size="sm" />
            ) : (
              <WalletConnectButton align="start" />
            )}
          </div>

          <div className="mt-8 border border-border p-6 md:p-8">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                // GATE
              </p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Devnet
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <label
                  htmlFor="threshold-input"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40"
                >
                  Required Trust Score
                </label>
                <input
                  id="threshold-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground transition-colors focus:border-cyan/50 focus:outline-none"
                  value={thresholdInput}
                  onChange={(e) =>
                    setThresholdInput(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
                <p className="mt-3 text-xs leading-relaxed text-foreground/50">
                  Try 0 to allow any verified human, or a high number to
                  block. Adjust to test the gate against your connected
                  wallet's Trust Score.
                </p>
              </div>

              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Output
                </p>
                <div className="border border-border bg-surface p-6">
                  <EntrosGate minTrustScore={threshold}>
                    <div className="border border-cyan/30 bg-cyan/[0.05] p-6 text-center">
                      <CheckCircle className="mx-auto mb-3 h-7 w-7 text-cyan" />
                      <p className="font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                        Protected content visible
                      </p>
                      <p className="mt-1 text-xs text-foreground/55">
                        Your Trust Score meets the threshold of {threshold}.
                      </p>
                    </div>
                  </EntrosGate>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // USAGE
          </span>

          <div className="mt-6 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                Wrap<span className="text-cyan">.</span> Set
                <span className="text-cyan">.</span> Render
                <span className="text-cyan">.</span>
              </h2>
              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                Wrap any component tree. The gate handles wallet
                connection state, identity lookup, and Trust Score
                comparison. A default fallback prompts the user to
                connect, verify, or improve their score.
              </p>
            </div>

            <div className="lg:col-span-7">
              <CodeBlock code={USAGE_CODE} />
            </div>
          </div>
        </div>
      </section>

      {/* Custom fallback */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // CUSTOM FALLBACK
          </span>

          <div className="mt-6 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                Override the prompt<span className="text-cyan">.</span>
              </h2>
              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                Pass a{" "}
                <code className="font-mono text-cyan">fallback</code> prop
                to override the default verification prompt. Useful for
                paywalls, branded gates, or progressive disclosure flows.
              </p>
            </div>

            <div className="lg:col-span-7">
              <CodeBlock code={FALLBACK_CODE} />
            </div>
          </div>
        </div>
      </section>

      {/* Component source */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // COMPONENT SOURCE
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Copy. Paste. Ship<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            Paste this file at{" "}
            <code className="font-mono text-cyan">
              components/ui/entros-gate.tsx
            </code>
            . Requires{" "}
            <code className="font-mono text-cyan">@entros/pulse-sdk</code>,{" "}
            <code className="font-mono text-cyan">@solana/web3.js</code>,
            and{" "}
            <code className="font-mono text-cyan">
              @solana/wallet-adapter-react
            </code>
            .
          </p>

          <div className="relative mt-12">
            <button
              onClick={copySource}
              className="absolute right-4 top-4 z-10 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40 transition-colors hover:text-cyan"
            >
              {copied ? "COPIED" : "COPY"}
            </button>
            <CodeBlock
              code={COMPONENT_CODE}
              className="max-h-[600px] overflow-y-auto"
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            One wrapper<span className="text-cyan">.</span>
            <br />
            Every gated route<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/integrate"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              All components
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/badge-demo"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              See &lt;EntrosBadge /&gt;
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
