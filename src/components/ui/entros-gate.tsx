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
 *   - @solana/wallet-adapter-react-ui (WalletMultiButton, the universal Solana wallet UI)
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
 * The gate reads two fields, not one. `trustScore` says how consistently this
 * wallet has verified. `maxVerificationAge` bounds how long ago it last did.
 * A score on its own describes a history; pairing it with recency keeps the
 * gate about the operator rather than the record.
 *
 * For an action with real stakes, run a verification at the point of the
 * action and let the gate read the result: `<EntrosVerify />` from
 * `@entros/verify` opens the capture in place, and this gate passes on the
 * next render.
 *
 * SECURITY: this is a client-side gate, suitable for UI gating, paywalls and
 * progressive disclosure. A determined user can bypass any client-side check
 * via DevTools, so for high-stakes access control assert the same two fields
 * in your own program or server route, reading the Anchor PDA directly.
 */

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Connection, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PROGRAM_IDS } from "@entros/pulse-sdk";
import { Loader2, ShieldAlert, Wallet } from "lucide-react";

/**
 * Smallest account this component can read. `last_verification_timestamp` ends
 * at 56 and `trust_score` at 62, so 62 covers both. Every layout the program
 * has ever written is longer than this.
 */
const EXPECTED_SIZE = 62;
const DEFAULT_DEVNET_CONNECTION = new Connection(
  "https://api.devnet.solana.com",
  "confirmed",
);

/** One day. Long enough for a session, short enough to mean something. */
const DEFAULT_MAX_VERIFICATION_AGE = 86_400;

/**
 * Whether an Anchor clears both thresholds.
 *
 * Pure, so the gate's decision can be tested without a DOM and read without
 * tracing a component. `nowSeconds` is injected for the same reason.
 *
 * The clock here is the browser's, and a user controls it. That is fine for
 * what this is: a client-side gate for UI, which a user could bypass with
 * DevTools regardless. Anything that moves value asserts the same two fields
 * where it settles, against `Clock::get()` on chain or a server clock.
 */
export function passesEntrosGate(
  anchor: { trustScore: number; lastVerifiedAt: number },
  thresholds: { minTrustScore: number; maxVerificationAge: number },
  nowSeconds: number = Math.floor(Date.now() / 1000),
): boolean {
  // A minted Anchor always carries a verification timestamp, so a zero here
  // means the account is not one, and no threshold should pass it.
  if (anchor.lastVerifiedAt <= 0) return false;
  if (anchor.trustScore < thresholds.minTrustScore) return false;
  return nowSeconds - anchor.lastVerifiedAt <= thresholds.maxVerificationAge;
}
const ENTROS_PROGRAM_ID = new PublicKey(PROGRAM_IDS.entrosAnchor);

interface EntrosGateProps {
  minTrustScore: number;
  /**
   * Seconds since the wallet's last verification, above which the gate does
   * not pass. Defaults to one day. Pass `Infinity` to gate on score alone,
   * which is appropriate for display and for anything with no real stakes.
   */
  maxVerificationAge?: number;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  verifyHref?: string;
}

type FetchState =
  | { status: "loading" }
  | { status: "disconnected" }
  | { status: "no-identity" }
  | { status: "ready"; trustScore: number; lastVerifiedAt: number };

type StoredFetchState = { requestKey: string } & Exclude<
  FetchState,
  { status: "loading" | "disconnected" }
>;

export function EntrosGate({
  minTrustScore,
  maxVerificationAge = DEFAULT_MAX_VERIFICATION_AGE,
  children,
  fallback,
  loadingFallback,
  verifyHref = "https://entros.io/verify",
}: EntrosGateProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const walletAddress = connected ? (publicKey?.toBase58() ?? null) : null;
  const activeConnection = connection ?? DEFAULT_DEVNET_CONNECTION;
  const requestKey = walletAddress
    ? `${activeConnection.rpcEndpoint}:${walletAddress}`
    : null;
  const [storedState, setStoredState] = useState<StoredFetchState | null>(null);

  useEffect(() => {
    if (!walletAddress || !requestKey) return;

    let isMounted = true;
    const owner = new PublicKey(walletAddress);

    const timeoutId = setTimeout(() => {
      (async () => {
        try {
          const [identityPda] = PublicKey.findProgramAddressSync(
            [new TextEncoder().encode("identity"), owner.toBuffer()],
            ENTROS_PROGRAM_ID,
          );
          const account = await activeConnection.getAccountInfo(identityPda);
          if (!isMounted) return;

          if (!account || account.data.length < EXPECTED_SIZE) {
            setStoredState({ requestKey, status: "no-identity" });
            return;
          }

          const view = new DataView(
            account.data.buffer,
            account.data.byteOffset,
            account.data.byteLength,
          );
          setStoredState({
            requestKey,
            status: "ready",
            trustScore: view.getUint16(60, true),
            // i64 at offset 48. Unix seconds fit in a Number until year 275760.
            lastVerifiedAt: Number(view.getBigInt64(48, true)),
          });
        } catch {
          if (isMounted) setStoredState({ requestKey, status: "no-identity" });
        }
      })();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [activeConnection, requestKey, walletAddress]);

  const currentState =
    requestKey && storedState?.requestKey === requestKey ? storedState : null;
  const fetchState: FetchState = !walletAddress
    ? { status: "disconnected" }
    : currentState ?? { status: "loading" };

  // Both comparisons happen at render time, not in the fetch effect. Changing
  // either threshold re-renders without triggering a new RPC call.
  if (
    fetchState.status === "ready" &&
    passesEntrosGate(fetchState, { minTrustScore, maxVerificationAge })
  ) {
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
