"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { EntrosBadge } from "@/components/ui/entros-badge";
import { CodeBlock } from "@/components/ui/code-block";
import { DevnetNotice } from "@/components/ui/devnet-notice";
import {
  buttonArrowClass,
  primaryButtonClass,
  secondaryButtonClass,
  textInputClass,
} from "@/components/ui/button-styles";

const COMPONENT_CODE = `"use client";

import { useEffect, useMemo, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_IDS } from "@entros/pulse-sdk";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const EXPECTED_SIZE = 62;
const ENTROS_PROGRAM_ID = new PublicKey(PROGRAM_IDS.entrosAnchor);
const DEFAULT_DEVNET_CONNECTION = new Connection(
  "https://api.devnet.solana.com",
  "confirmed",
);

/**
 * A badge reports state, it does not gate. It shows when the wallet last
 * verified alongside the score, so the reader sees a history rather than a
 * bare present-tense claim. Use \`EntrosGate\` where access depends on it.
 */
function relativeAge(lastVerifiedAt: number): string {
  const days = Math.floor((Date.now() / 1000 - lastVerifiedAt) / 86_400);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return \`\${days}d ago\`;
  const months = Math.floor(days / 30);
  return months < 12 ? \`\${months}mo ago\` : \`\${Math.floor(days / 365)}y ago\`;
}

interface EntrosBadgeProps {
  walletAddress: string;
  connection?: Connection;
  className?: string;
}

type ParsedWallet =
  | { status: "empty" | "invalid" }
  | { status: "valid"; publicKey: PublicKey };

interface BadgeFetchState {
  requestKey: string;
  trustScore: number | null;
  lastVerifiedAt: number | null;
}

export function EntrosBadge({ walletAddress, connection, className }: EntrosBadgeProps) {
  const parsedWallet = useMemo<ParsedWallet>(() => {
    if (!walletAddress) return { status: "empty" };
    try {
      return { status: "valid", publicKey: new PublicKey(walletAddress) };
    } catch {
      return { status: "invalid" };
    }
  }, [walletAddress]);
  const activeConnection = connection ?? DEFAULT_DEVNET_CONNECTION;
  const requestKey =
    parsedWallet.status === "valid"
      ? \`\${activeConnection.rpcEndpoint}:\${parsedWallet.publicKey.toBase58()}\`
      : null;
  const [badgeState, setBadgeState] = useState<BadgeFetchState | null>(null);

  useEffect(() => {
    if (parsedWallet.status !== "valid" || !requestKey) return;

    let isMounted = true;

    const timeoutId = setTimeout(() => {
      const fetchIdentity = async () => {
        try {
          const [identityPda] = PublicKey.findProgramAddressSync(
            [
              new TextEncoder().encode("identity"),
              parsedWallet.publicKey.toBuffer(),
            ],
            ENTROS_PROGRAM_ID
          );

          const account = await activeConnection.getAccountInfo(identityPda);

          if (isMounted) {
            if (!account || account.data.length < EXPECTED_SIZE) {
              setBadgeState({
                requestKey,
                trustScore: null,
                lastVerifiedAt: null,
              });
            } else {
              const data = account.data;
              const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
              setBadgeState({
                requestKey,
                trustScore: view.getUint16(60, true),
                lastVerifiedAt: Number(view.getBigInt64(48, true)),
              });
            }
          }
        } catch {
          if (isMounted) {
            setBadgeState({
              requestKey,
              trustScore: null,
              lastVerifiedAt: null,
            });
          }
        }
      };

      fetchIdentity();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [activeConnection, parsedWallet, requestKey]);

  const currentState =
    requestKey && badgeState?.requestKey === requestKey ? badgeState : null;
  const invalid = parsedWallet.status === "invalid";
  const loading = parsedWallet.status === "valid" && currentState === null;
  const trustScore = currentState?.trustScore ?? null;
  const lastVerifiedAt = currentState?.lastVerifiedAt ?? null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs transition-colors",
        invalid
          ? "border-danger/30 bg-danger/10 text-danger"
          : loading
            ? "border-border bg-surface/30 text-muted"
            : trustScore !== null
              ? "border-cyan/30 bg-cyan/10 text-cyan"
              : "border-danger/30 bg-danger/10 text-danger",
        className
      )}
    >
      {invalid ? (
        <>
          <span className="h-1.5 w-1.5 bg-danger/60" />
          <span>Invalid Address</span>
        </>
      ) : loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
          <span>Verifying Entros...</span>
        </>
      ) : trustScore !== null ? (
        <>
          <span className="h-1.5 w-1.5 bg-cyan" />
          <span>
            Verified <span className="text-cyan/50">·</span> Trust:{" "}
            <span className="font-bold">{trustScore}</span>
            {lastVerifiedAt !== null && lastVerifiedAt > 0 && (
              <>
                {" "}
                <span className="text-cyan/50">·</span>{" "}
                <span className="text-foreground/60">{relativeAge(lastVerifiedAt)}</span>
              </>
            )}
          </span>
        </>
      ) : (
        <>
          <span className="h-1.5 w-1.5 bg-danger/60" />
          <span>Not Verified</span>
        </>
      )}
    </div>
  );
}`;

const USAGE_CODE = `import { EntrosBadge } from "@/components/ui/entros-badge";
import { useConnection } from "@solana/wallet-adapter-react";

export function ProfileHeader({ walletAddress }) {
  const { connection } = useConnection();

  return (
    <div className="flex items-center gap-4">
      <h2 className="text-xl font-bold">{walletAddress}</h2>
      <EntrosBadge walletAddress={walletAddress} connection={connection} />
    </div>
  );
}`;

export default function BadgeDemo() {
  const { connection } = useConnection();
  const [walletInput, setWalletInput] = useState("");
  const [copied, setCopied] = useState(false);
  const isValidLength = walletInput.length >= 32;

  function copySource() {
    navigator.clipboard.writeText(COMPONENT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      {/* Hero: asymmetric split. Left: wide h1 + copy + CTAs. Right:
          a profile-list mockup showing the badge in real context. */}
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-20 md:pt-40 md:pb-28">
          <DevnetNotice />

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
                Trust<span className="text-cyan">,</span>
                <br />
                on display<span className="text-cyan">.</span>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg">
                A drop-in React component that displays any wallet's
                Entros Trust Score. Use in profiles, comments,
                leaderboards, anywhere humanness matters.
              </p>

              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Link href="/integrate" className={primaryButtonClass}>
                  <span className="[text-box:trim-both_cap_alphabetic]">
                    All components
                  </span>
                  <ArrowRight className={buttonArrowClass} aria-hidden="true" />
                </Link>
                <Link href="/verify" className={secondaryButtonClass}>
                  <span className="[text-box:trim-both_cap_alphabetic]">
                    Try the demo
                  </span>
                  <ArrowRight className={buttonArrowClass} aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Mock profile list showing the badge in real UI context */}
            <div className="lg:col-span-5">
              <div className="relative bg-surface p-6 forced-colors:border forced-colors:border-[CanvasText] md:p-8">

                <div className="space-y-6">
                  {[
                    { handle: "anatoly.sol", score: "1,247", state: "verified" },
                    { handle: "lily.sol", score: "482", state: "verified" },
                    { handle: "ada.sol", score: null, state: "loading" },
                    { handle: "0x4ku9.sol", score: null, state: "unverified" },
                  ].map((row) => (
                    <div key={row.handle} className="flex items-center gap-3">
                      <div className="h-8 w-8 shrink-0 bg-background" />
                      <p className="flex-1 truncate font-mono text-sm text-foreground/85">
                        {row.handle}
                      </p>
                      {row.state === "verified" && (
                        <span className="inline-flex items-center gap-2 bg-cyan/10 px-3 py-1 font-mono text-xs text-cyan">
                          <span className="h-1.5 w-1.5 bg-cyan" />
                          {row.score}
                        </span>
                      )}
                      {row.state === "loading" && (
                        <span className="inline-flex items-center gap-2 bg-background px-3 py-1 font-mono text-xs text-muted">
                          <span className="h-1.5 w-1.5 bg-muted" />
                          …
                        </span>
                      )}
                      {row.state === "unverified" && (
                        <span className="inline-flex items-center gap-2 bg-background px-3 py-1 font-mono text-xs text-muted">
                          <span className="h-1.5 w-1.5 bg-muted" />
                          None
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live preview */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Try it now<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Enter any Solana address to see the badge render its
            verification state and live Trust Score from devnet.
          </p>

          <div className="mt-12 bg-background p-6 forced-colors:border forced-colors:border-[CanvasText] md:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 bg-cyan" aria-hidden />
                <span className="text-sm font-medium text-muted">
                  Devnet
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <label
                  htmlFor="wallet-input"
                  className="mb-2 block text-sm font-medium text-muted"
                >
                  Wallet Address
                </label>
                <input
                  id="wallet-input"
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="Paste a Solana wallet address..."
                  className={textInputClass}
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                />
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Use a wallet from your devnet testing to see the
                  verified state.
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-muted">
                  Preview
                </p>
                <div className="flex min-h-[120px] items-center justify-center bg-surface p-6 forced-colors:border forced-colors:border-[CanvasText]">
                  {isValidLength ? (
                    <EntrosBadge walletAddress={walletInput} connection={connection} />
                  ) : (
                    <span className="text-sm font-medium text-muted">
                      Enter a valid address
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
                Import<span className="text-cyan">.</span> Render
                <span className="text-cyan">.</span>
              </h2>
              <p className="mt-8 text-base leading-relaxed text-foreground/70 md:text-lg">
                Import the component and pass a wallet address. Pass your
                active Solana connection through the{" "}
                <code className="font-mono text-cyan">connection</code>{" "}
                prop, or omit it for an automatic devnet fallback.
              </p>
            </div>

            <div className="lg:col-span-7">
              <CodeBlock code={USAGE_CODE} />
            </div>
          </div>
        </div>
      </section>

      {/* Component source */}
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Copy<span className="text-cyan">.</span> Paste
            <span className="text-cyan">.</span> Ship
            <span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-foreground/70 md:text-lg">
            Paste this file at{" "}
            <code className="font-mono text-cyan">
              components/ui/entros-badge.tsx
            </code>
            . Requires{" "}
            <code className="font-mono text-cyan">@entros/pulse-sdk</code>{" "}
            and{" "}
            <code className="font-mono text-cyan">@solana/web3.js</code>.
          </p>

          <div className="relative mt-12">
            <button
              type="button"
              onClick={copySource}
              className="absolute right-4 top-4 z-10 min-h-11 bg-background px-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-hover motion-reduce:transition-none forced-colors:border forced-colors:border-[ButtonText]"
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <CodeBlock code={COMPONENT_CODE} className="max-h-[600px] overflow-y-auto" />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            One component<span className="text-cyan">.</span>
            <br />
            Every profile<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/integrate" className={primaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                All components
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
            <Link href="/gate-demo" className={secondaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                See &lt;EntrosGate /&gt;
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
