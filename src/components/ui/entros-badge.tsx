"use client";

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
 * bare present-tense claim. Use `EntrosGate` where access depends on it.
 */
function relativeAge(lastVerifiedAt: number): string {
  const days = Math.floor((Date.now() / 1000 - lastVerifiedAt) / 86_400);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return months < 12 ? `${months}mo ago` : `${Math.floor(days / 365)}y ago`;
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
      ? `${activeConnection.rpcEndpoint}:${parsedWallet.publicKey.toBase58()}`
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
          <span className="h-2 w-2 rounded-full bg-danger/50" />
          <span>Not Verified</span>
        </>
      )}
    </div>
  );
}
