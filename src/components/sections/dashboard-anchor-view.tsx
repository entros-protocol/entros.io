"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { type IdentityState, PROGRAM_IDS } from "@entros/pulse-sdk";
import { PublicKey } from "@solana/web3.js";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { ConnectedWalletPill } from "@/components/ui/connected-wallet-pill";
import { commitmentBytesToHex } from "@/lib/on-chain";
import { explorerUrl } from "@/lib/explorer";
import { ArrowRight, ExternalLink, Wallet, Loader2, ShieldAlert } from "lucide-react";

function formatRelativeTime(unixSeconds: number): string {
  const now = new Date();
  const then = new Date(unixSeconds * 1000);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const thenStart = new Date(then.getFullYear(), then.getMonth(), then.getDate()).getTime();
  const days = Math.round((todayStart - thenStart) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardAnchorView() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [identity, setIdentity] = useState<IdentityState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || !connected) {
      setIdentity(null);
      return;
    }
    setLoading(true);
    setError(null);

    const programId = new PublicKey(PROGRAM_IDS.entrosAnchor);
    const [identityPda] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("identity"), publicKey.toBuffer()],
      programId
    );

    connection
      .getAccountInfo(identityPda)
      .then((account: { data: Uint8Array } | null) => {
        if (!account || account.data.length < 62) {
          setIdentity(null);
          return;
        }
        const data = account.data;
        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

        const creationTimestamp = Number(view.getBigInt64(40, true));
        const lastVerificationTimestamp = Number(view.getBigInt64(48, true));
        const verificationCount = view.getUint32(56, true);
        const trustScore = view.getUint16(60, true);
        const currentCommitment = new Uint8Array(data.slice(62, 94));
        const mintBytes = data.slice(94, 126);
        const mintPubkey = new PublicKey(mintBytes);
        const lastResetTimestamp =
          data.length >= 551 ? Number(view.getBigInt64(543, true)) : 0;
        const projectionVersion = data.length >= 585 ? view.getUint16(583, true) : 0;

        setIdentity({
          owner: publicKey.toBase58(),
          creationTimestamp,
          lastVerificationTimestamp,
          verificationCount,
          trustScore,
          currentCommitment,
          mint: mintPubkey.toBase58(),
          lastResetTimestamp,
          projectionVersion,
        });
      })
      .catch(() => setError("Failed to fetch identity state"))
      .finally(() => setLoading(false));
  }, [publicKey, connected, connection]);

  // Disconnected state
  if (!connected) {
    return (
      <section>
        <div className="mx-auto max-w-7xl px-6 pb-24">
          <div className="flex flex-col items-center gap-6 border border-border py-20 text-center">
            <Wallet className="h-10 w-10 text-foreground/40" strokeWidth={1.5} />
            <div className="max-w-md">
              <p className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                Connect your wallet<span className="text-cyan">.</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                View your Entros Anchor, Trust Score, and verification
                history.
              </p>
            </div>
            <WalletConnectButton />
          </div>
        </div>
      </section>
    );
  }

  const walletPill = (
    <div className="mb-8 flex">
      <ConnectedWalletPill size="md" />
    </div>
  );

  if (loading) {
    return (
      <section>
        <div className="mx-auto max-w-7xl px-6 pb-24">
          {walletPill}
          <div className="flex flex-col items-center gap-4 border border-border py-20">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              Reading from Solana devnet…
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <div className="mx-auto max-w-7xl px-6 pb-24">
          {walletPill}
          <div className="flex flex-col items-center gap-4 border border-border py-20 text-center">
            <ShieldAlert className="h-8 w-8 text-danger" strokeWidth={1.5} />
            <p className="text-sm text-foreground/65">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!identity) {
    return (
      <section>
        <div className="mx-auto max-w-7xl px-6 pb-24">
          {walletPill}
          <div className="flex flex-col items-center gap-6 border border-border py-20 text-center">
            <ShieldAlert className="h-10 w-10 text-foreground/40" strokeWidth={1.5} />
            <div className="max-w-md">
              <p className="font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                No Entros Anchor yet<span className="text-cyan">.</span>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                Complete your first verification to mint your Entros
                Anchor identity.
              </p>
            </div>
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Verify now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mx-auto max-w-7xl px-6 pb-16">
        {walletPill}

        <div className="grid grid-cols-1 gap-px border border-border bg-border lg:grid-cols-3">
          {/* Trust Score panel */}
          <div className="flex flex-col items-center justify-center bg-background p-8 text-center md:p-10 lg:col-span-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              Trust Score
            </p>
            <p className="mt-4 font-display text-7xl font-medium tracking-tight text-foreground md:text-8xl">
              {identity.trustScore}
            </p>
            <div className="mt-6 h-1 w-full max-w-[220px] overflow-hidden bg-foreground/[0.06]">
              <div
                className="h-full bg-cyan transition-all"
                style={{ width: `${Math.min(identity.trustScore, 100)}%` }}
              />
            </div>
            {identity.trustScore > 0 ? (
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan/80">
                Active
              </p>
            ) : (
              <div className="mt-4 max-w-[240px]">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan/80">
                  Baseline established
                </p>
                <p className="mt-3 text-xs leading-relaxed text-foreground/55">
                  Re-verify to start building your Trust Score. Each
                  session that matches your behavioral pattern increases
                  it.
                </p>
              </div>
            )}
          </div>

          {/* Stats panel */}
          <div className="flex flex-col bg-background p-8 md:p-10 lg:col-span-2">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Verifications
                </p>
                <p className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
                  {identity.verificationCount + 1}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Last verified
                </p>
                <p className="mt-2 font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                  {identity.lastVerificationTimestamp > 0
                    ? formatRelativeTime(identity.lastVerificationTimestamp)
                    : "Never"}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Anchor created
                </p>
                <p className="mt-2 font-mono text-sm text-foreground">
                  {formatDate(identity.creationTimestamp)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Commitment
                </p>
                <p className="mt-2 truncate font-mono text-sm text-foreground/70">
                  {commitmentBytesToHex(identity.currentCommitment)}
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Owner
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="truncate font-mono text-xs text-foreground/65">
                    {identity.owner}
                  </p>
                  <a
                    href={explorerUrl(identity.owner)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-cyan transition-colors hover:text-foreground"
                    aria-label="View owner on Solana Explorer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Mint
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <p className="truncate font-mono text-xs text-foreground/65">
                    {identity.mint}
                  </p>
                  <a
                    href={explorerUrl(identity.mint)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-cyan transition-colors hover:text-foreground"
                    aria-label="View mint on Solana Explorer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <Link
              href="/verify"
              className="mt-6 inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-cyan transition-colors hover:text-foreground"
            >
              Re-verify
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
