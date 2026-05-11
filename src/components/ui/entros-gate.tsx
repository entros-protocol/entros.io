"use client";

/**
 * <EntrosGate>—drop-in route guard for Entros Trust Score.
 *
 * Renders children only when the connected wallet has an Entros Anchor with
 * trustScore >= minTrustScore. Otherwise renders a fallback (default: a
 * verification prompt linking to https://entros.io/verify, or a custom node via the
 * `fallback` prop).
 *
 * This component has zero internal UI dependencies. It uses only:
 *   - React + Next.js Link
 *   - @solana/web3.js (PublicKey, Connection)
 *   - @solana/wallet-adapter-react (useWallet, useConnection)
 *   - @solana/wallet-adapter-react-ui (WalletMultiButton—the universal Solana wallet UI)
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

  // Threshold comparison happens at render time, not in the fetch effect.
  // Changing minTrustScore re-renders without triggering a new RPC call.
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
}

type FallbackState =
  | { status: "disconnected" }
  | { status: "no-identity" }
  | { status: "below-threshold"; trustScore: number };

function DefaultFallback({
  state,
  minTrustScore,
  verifyHref,
}: {
  state: FallbackState;
  minTrustScore: number;
  verifyHref: string;
}) {
  const statusLabel =
    state.status === "disconnected"
      ? "WALLET"
      : state.status === "no-identity"
        ? "UNVERIFIED"
        : "BELOW THRESHOLD";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
          // {statusLabel}
        </p>
        {state.status === "below-threshold" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            {state.trustScore} &lt; {minTrustScore}
          </span>
        )}
      </div>

      <div className="mt-8 flex flex-col items-start gap-6">
        {state.status === "disconnected" ? (
          <Wallet className="h-7 w-7 text-cyan/80" strokeWidth={1.5} />
        ) : (
          <ShieldAlert className="h-7 w-7 text-cyan/80" strokeWidth={1.5} />
        )}

        {state.status === "disconnected" && (
          <>
            <div>
              <p className="text-base font-medium text-foreground">
                Connect your wallet
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                This content requires a verified Entros identity.
              </p>
            </div>
            <WalletMultiButton />
          </>
        )}

        {state.status === "no-identity" && (
          <>
            <div>
              <p className="text-base font-medium text-foreground">
                Verify your humanness
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                This content requires an Entros Anchor with Trust Score{" "}
                <span className="font-mono text-cyan">{minTrustScore}</span>{" "}
                or higher.
              </p>
            </div>
            <Link
              href={verifyHref}
              className="inline-flex items-center gap-2 border border-cyan/40 bg-cyan/[0.08] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan transition-colors hover:border-cyan/70 hover:bg-cyan/[0.15]"
            >
              Verify now
            </Link>
          </>
        )}

        {state.status === "below-threshold" && (
          <>
            <div>
              <p className="text-base font-medium text-foreground">
                Trust Score too low
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                Your Trust Score is{" "}
                <span className="font-mono text-cyan">{state.trustScore}</span>.
                This content requires{" "}
                <span className="font-mono text-cyan">{minTrustScore}</span>.
                Re-verify across multiple days to grow your score.
              </p>
            </div>
            <Link
              href={verifyHref}
              className="inline-flex items-center gap-2 border border-cyan/40 bg-cyan/[0.08] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-cyan transition-colors hover:border-cyan/70 hover:bg-cyan/[0.15]"
            >
              Re-verify
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
