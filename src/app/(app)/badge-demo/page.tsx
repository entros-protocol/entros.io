"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { EntrosBadge } from "@/components/ui/entros-badge";
import { CodeBlock } from "@/components/ui/code-block";

const COMPONENT_CODE = `"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_IDS } from "@entros/pulse-sdk";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const EXPECTED_SIZE = 62;
const ENTROS_PROGRAM_ID = new PublicKey(PROGRAM_IDS.entrosAnchor);

interface EntrosBadgeProps {
  walletAddress: string;
  connection?: Connection;
  className?: string;
}

export function EntrosBadge({ walletAddress, connection, className }: EntrosBadgeProps) {
  const [loading, setLoading] = useState(true);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!walletAddress) {
      setTrustScore(null);
      setInvalid(false);
      setLoading(false);
      return;
    }

    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(walletAddress);
      setInvalid(false);
    } catch (err) {
      setInvalid(true);
      setTrustScore(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let isMounted = true;

    const timeoutId = setTimeout(() => {
      const fetchIdentity = async () => {
        try {
          const [identityPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode("identity"), pubkey.toBuffer()],
            ENTROS_PROGRAM_ID
          );

          const conn = connection || new Connection("https://api.devnet.solana.com", "confirmed");
          const account = await conn.getAccountInfo(identityPda);

          if (isMounted) {
            if (!account || account.data.length < EXPECTED_SIZE) {
              setTrustScore(null);
            } else {
              const data = account.data;
              const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
              const score = view.getUint16(60, true);
              setTrustScore(score);
            }
          }
        } catch (err) {
          if (isMounted) {
            setTrustScore(null);
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      fetchIdentity();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [walletAddress, connection]);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors",
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
          <span className="h-2 w-2 rounded-full bg-danger/50" />
          <span>Invalid Address</span>
        </>
      ) : loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />
          <span>Verifying Entros...</span>
        </>
      ) : trustScore !== null ? (
        <>
          <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
          <span>
            Verified <span className="text-cyan/50">·</span> Trust:{" "}
            <span className="font-bold">{trustScore}</span>
          </span>
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-danger/50" />
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
      {/* Hero—asymmetric split. Left: wide h1 + copy + CTAs. Right:
          a profile-list mockup showing the badge in real context. */}
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-20 md:pt-40 md:pb-28">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // ENTROS BADGE
          </span>

          <div className="mt-8 grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <h1 className="font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
                Trust<span className="text-cyan">,</span>
                <br />
                on display<span className="text-cyan">.</span>
              </h1>

              <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground/70 md:text-lg">
                A drop-in React component that displays any wallet's
                Entros Trust Score. Use in profiles, comments,
                leaderboards—anywhere humanness matters.
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

            {/* Mock profile list—the badge in real UI context */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-foreground/[0.06] p-6 md:p-8">

                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  // PROFILES
                </p>

                <div className="mt-8 space-y-6">
                  {[
                    { handle: "anatoly.sol", score: "1,247", state: "verified", pulse: true },
                    { handle: "lily.sol", score: "482", state: "verified", pulse: false },
                    { handle: "ada.sol", score: null, state: "loading", pulse: false },
                    { handle: "0x4ku9.sol", score: null, state: "unverified", pulse: false },
                  ].map((row) => (
                    <div key={row.handle} className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 shrink-0 rounded-full border ${
                          row.state === "verified"
                            ? "border-cyan/50 bg-cyan shadow-[0_0_12px_rgba(34,211,230,0.45)]"
                            : "border-border bg-surface"
                        }`}
                      />
                      <p className="flex-1 truncate font-mono text-sm text-foreground/85">
                        {row.handle}
                      </p>
                      {row.state === "verified" && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/[0.05] px-3 py-1 font-mono text-[11px] text-cyan">
                          <span
                            className={`h-1.5 w-1.5 rounded-full bg-cyan ${
                              row.pulse ? "animate-pulse" : ""
                            }`}
                          />
                          {row.score}
                        </span>
                      )}
                      {row.state === "loading" && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-[11px] text-foreground/45">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-foreground/40" />
                          …
                        </span>
                      )}
                      {row.state === "unverified" && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 font-mono text-[11px] text-foreground/35">
                          <span className="h-1.5 w-1.5 rounded-full bg-foreground/25" />
                          —
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
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // LIVE PREVIEW
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Try it now<span className="text-cyan">.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Enter any Solana address to see the badge render its
            verification state and live Trust Score from devnet.
          </p>

          <div className="mt-12 border border-border p-6 md:p-8">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                // INPUT
              </p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solana-green/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-solana-green" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Devnet
                </span>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <label
                  htmlFor="wallet-input"
                  className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40"
                >
                  Wallet Address
                </label>
                <input
                  id="wallet-input"
                  type="text"
                  placeholder="Paste a Solana wallet address..."
                  className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:border-cyan/50 focus:outline-none"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                />
                <p className="mt-3 text-xs leading-relaxed text-foreground/50">
                  Use a wallet from your devnet testing to see the
                  verified state.
                </p>
              </div>

              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Preview
                </p>
                <div className="flex min-h-[120px] items-center justify-center border border-border bg-surface p-6">
                  {isValidLength ? (
                    <EntrosBadge walletAddress={walletInput} connection={connection} />
                  ) : (
                    <span className="font-mono text-xs uppercase tracking-[0.15em] text-foreground/35">
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
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // USAGE
          </span>

          <div className="mt-6 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
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
      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // COMPONENT SOURCE
          </span>

          <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
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
              onClick={copySource}
              className="absolute right-4 top-4 z-10 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40 transition-colors hover:text-cyan"
            >
              {copied ? "COPIED" : "COPY"}
            </button>
            <CodeBlock code={COMPONENT_CODE} className="max-h-[600px] overflow-y-auto" />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            One component<span className="text-cyan">.</span>
            <br />
            Every profile<span className="text-cyan">.</span>
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
              href="/gate-demo"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              See &lt;EntrosGate /&gt;
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
