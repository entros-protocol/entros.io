"use client";

import { useState, useEffect, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import {
  getAgentHumanOperator,
  type AgentHumanOperator,
} from "@entros/pulse-sdk";
import { Bot, CheckCircle, ExternalLink, Loader2, Search } from "lucide-react";
import { explorerUrl } from "@/lib/explorer";

const TEST_AGENT = "CW9ogj3qxGxqdyMdsbVr6fkh6F9S5xYYkiNQir7LMW1M";

function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AgentsCheckSection() {
  const { connection } = useConnection();
  const [agentAsset, setAgentAsset] = useState("");
  const [operator, setOperator] = useState<AgentHumanOperator | null>(null);
  const [liveTrustScore, setLiveTrustScore] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoChecked = useRef(false);
  const requestId = useRef(0);

  async function fetchLiveTrustScore(walletAddress: string) {
    try {
      const { PublicKey } = await import("@solana/web3.js");
      const programId = new PublicKey("GZYwTp2ozeuRA5Gof9vs4ya961aANcJBdUzB7LN6q4b2");
      const walletPubkey = new PublicKey(walletAddress);
      const [identityPda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("identity"), walletPubkey.toBuffer()],
        programId
      );
      const accountInfo = await connection.getAccountInfo(identityPda);
      if (!accountInfo || accountInfo.data.length < 62) return null;
      const view = new DataView(
        accountInfo.data.buffer,
        accountInfo.data.byteOffset,
        accountInfo.data.byteLength
      );
      return view.getUint16(60, true);
    } catch {
      return null;
    }
  }

  async function runCheck(asset: string) {
    if (!asset.trim()) return;
    const thisRequest = ++requestId.current;
    setChecking(true);
    setError(null);
    setOperator(null);
    setLiveTrustScore(null);
    setChecked(false);

    try {
      const result = await getAgentHumanOperator(asset.trim(), connection);
      if (requestId.current !== thisRequest) return;
      setOperator(result);
      setChecked(true);

      if (result?.wallet) {
        const live = await fetchLiveTrustScore(result.wallet);
        if (requestId.current === thisRequest) setLiveTrustScore(live);
      }
    } catch {
      if (requestId.current !== thisRequest) return;
      setError("Invalid asset address or network error.");
    } finally {
      if (requestId.current === thisRequest) setChecking(false);
    }
  }

  useEffect(() => {
    if (autoChecked.current) return;
    autoChecked.current = true;

    setAgentAsset(TEST_AGENT);
    runCheck(TEST_AGENT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  return (
    <section id="check" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // CHECK AN AGENT
        </span>

        <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Verify any agent on Solana<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Enter an agent asset address to check for an Entros-linked operator
          identity.
        </p>

        <div className="mt-12 border border-border p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="check-agent-asset"
                className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40"
              >
                Agent Asset Address
              </label>
              <input
                id="check-agent-asset"
                type="text"
                placeholder="Paste a Solana Agent Registry asset address..."
                className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:border-cyan/50 focus:outline-none"
                value={agentAsset}
                onChange={(e) => {
                  requestId.current++;
                  setAgentAsset(e.target.value);
                  setChecked(false);
                  setOperator(null);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && runCheck(agentAsset)}
              />
            </div>
            <button
              onClick={() => runCheck(agentAsset)}
              disabled={checking || !agentAsset.trim()}
              className="inline-flex items-center justify-center gap-2 border border-foreground/20 bg-foreground px-6 py-3 font-mono text-sm text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Check
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-danger">{error}</p>}

          {checked && !operator && !error && (
            <div className="mt-8 flex items-center gap-3 border border-border p-5">
              <Bot className="h-6 w-6 text-foreground/50" strokeWidth={1.5} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  No Entros attestation
                </p>
                <p className="mt-0.5 text-xs text-foreground/50">
                  This agent has no Entros operator identity link.
                </p>
              </div>
            </div>
          )}

          {operator && (
            <div className="mt-8 border border-solana-green/30 bg-solana-green/[0.04] p-6 md:p-8">
              <div className="mb-8 flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-solana-green" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Entros-linked Operator
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    Immutable on-chain attestation via{" "}
                    <span className="font-mono text-cyan">
                      entros:human-operator
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Trust Score (Live)
                  </p>
                  <p className="mt-2 font-display text-4xl font-medium tracking-tight text-foreground">
                    {liveTrustScore !== null ? liveTrustScore : operator.trustScore}
                  </p>
                  {liveTrustScore !== null && liveTrustScore !== operator.trustScore && (
                    <p className="mt-1 text-xs text-foreground/50">
                      {operator.trustScore} at attestation
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Anchor Last Verified
                  </p>
                  <p className="mt-2 font-mono text-sm text-foreground">
                    {formatTimestamp(operator.verifiedAt)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Operator Wallet
                  </p>
                  <p className="mt-2 break-all font-mono text-xs text-foreground/70">
                    {operator.wallet}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Entros Anchor PDA
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="break-all font-mono text-xs text-foreground/70">
                      {operator.anchorPda}
                    </p>
                    <a
                      href={explorerUrl(operator.anchorPda)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-cyan transition-colors hover:text-foreground"
                      aria-label="View on Solana Explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-xs text-foreground/50">
          Try with{" "}
          <button
            onClick={() => {
              setAgentAsset(TEST_AGENT);
              runCheck(TEST_AGENT);
            }}
            className="font-mono text-cyan transition-colors hover:text-foreground"
          >
            CW9ogj…LMW1M
          </button>{" "}
         —Entros test agent on devnet.
        </p>
      </div>
    </section>
  );
}
