"use client";

import { useState, useRef } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { CheckCircle, XCircle, Loader2, Search, ExternalLink } from "lucide-react";
import { explorerUrl } from "@/lib/explorer";
import { primaryButtonClass, textInputClass } from "@/components/ui/button-styles";

const DEMO_WALLET = "2jowceXRayDC3ufU3kRjf67zT3cLv48q4gbcdhA1SNQw";
const ENTROS_ANCHOR_PROGRAM = "GZYwTp2ozeuRA5Gof9vs4ya961aANcJBdUzB7LN6q4b2";

interface IdentityResult {
  trustScore: number;
  verificationCount: number;
  lastVerified: number;
  createdAt: number;
  anchorPda: string;
}

function formatTimestamp(unix: number): string {
  if (unix === 0) return "Never";
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(unix: number): string {
  if (unix === 0) return "";
  const seconds = Math.floor(Date.now() / 1000 - unix);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function IntegratePlayground() {
  const { connection } = useConnection();
  const [wallet, setWallet] = useState("");
  const [result, setResult] = useState<IdentityResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  async function checkWallet(address: string) {
    const trimmed = address.trim();
    if (!trimmed) {
      setError("Enter a Solana wallet address.");
      setResult(null);
      setNotFound(false);
      return;
    }
    const thisRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    setResult(null);
    setNotFound(false);

    try {
      const { PublicKey } = await import("@solana/web3.js");

      let pubkey: InstanceType<typeof PublicKey>;
      try {
        pubkey = new PublicKey(trimmed);
      } catch {
        if (requestId.current === thisRequest) {
          setError("Invalid Solana address.");
          setLoading(false);
        }
        return;
      }

      const programId = new PublicKey(ENTROS_ANCHOR_PROGRAM);
      const [identityPda] = PublicKey.findProgramAddressSync(
        [new TextEncoder().encode("identity"), pubkey.toBuffer()],
        programId
      );

      const account = await connection.getAccountInfo(identityPda);
      if (requestId.current !== thisRequest) return;

      if (!account || account.data.length < 62) {
        setNotFound(true);
        return;
      }

      const data = account.data;
      const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

      setResult({
        createdAt: Number(view.getBigInt64(40, true)),
        lastVerified: Number(view.getBigInt64(48, true)),
        verificationCount: view.getUint32(56, true),
        trustScore: view.getUint16(60, true),
        anchorPda: identityPda.toBase58(),
      });
    } catch {
      if (requestId.current === thisRequest)
        setError("Network error. Try again.");
    } finally {
      if (requestId.current === thisRequest) setLoading(false);
    }
  }

  return (
    <div>
      <div className="bg-surface p-6 forced-colors:border forced-colors:border-[CanvasText] md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-cyan" aria-hidden />
            <span className="text-sm font-medium text-muted">
              Devnet
            </span>
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-foreground/75">
          Check any wallet's verification status on devnet.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void checkWallet(wallet);
          }}
          noValidate
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label
              htmlFor="playground-wallet"
              className="mb-2 block text-sm font-medium text-muted"
            >
              Wallet Address
            </label>
            <input
              id="playground-wallet"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="Paste a Solana wallet address..."
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "playground-wallet-error" : undefined}
              className={textInputClass}
              value={wallet}
              onChange={(e) => {
                requestId.current++;
                setWallet(e.target.value);
                setResult(null);
                setNotFound(false);
                setError(null);
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={primaryButtonClass}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span className="[text-box:trim-both_cap_alphabetic]">Check</span>
          </button>
        </form>

        {error && (
          <p id="playground-wallet-error" role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}

        {notFound && (
          <div className="mt-8 flex items-center gap-3 bg-background p-5 forced-colors:border forced-colors:border-[CanvasText]">
            <XCircle className="h-6 w-6 shrink-0 text-muted" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-foreground">Not verified</p>
              <p className="mt-0.5 text-xs text-muted">
                No Entros Anchor on devnet. No Trust Score,
                no history.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-8 bg-background p-6 forced-colors:border forced-colors:border-[CanvasText] md:p-8">
            <div className="mb-8 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 shrink-0 text-solana-green" />
              <p className="text-sm font-medium text-foreground">
                Verified wallet
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-foreground/60">
                  Trust Score
                </p>
                <p className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
                  {result.trustScore}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/60">
                  Verifications
                </p>
                <p className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
                  {result.verificationCount + 1}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/60">
                  Last Verified
                </p>
                <p className="mt-2 text-sm tabular-nums text-foreground">
                  {timeAgo(result.lastVerified)}
                </p>
                <p className="text-xs text-foreground/50">
                  {formatTimestamp(result.lastVerified)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground/60">
                  Created
                </p>
                <p className="mt-2 text-sm tabular-nums text-foreground">
                  {formatTimestamp(result.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-border/50 pt-6">
              <p className="text-sm font-medium text-foreground/60">
                Entros Anchor PDA
              </p>
              <div className="mt-2 flex items-center gap-2">
                <p className="break-all font-mono text-xs text-foreground/65">
                  {result.anchorPda}
                </p>
                <a
                  href={explorerUrl(result.anchorPda)}
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
        )}
      </div>

      <p className="mt-6 text-xs text-foreground/50">
        Try with{" "}
        <button
          onClick={() => {
            setWallet(DEMO_WALLET);
            checkWallet(DEMO_WALLET);
          }}
          className="font-mono text-cyan transition-colors hover:text-foreground"
        >
          2jowce…SNQw
        </button>
        {", a verified devnet wallet."}
      </p>
    </div>
  );
}
