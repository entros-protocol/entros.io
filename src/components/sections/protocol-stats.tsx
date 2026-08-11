"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_IDS, SAS_CONFIG } from "@entros/pulse-sdk";
import { ArrowRight, ExternalLink, Loader2, ShieldAlert } from "lucide-react";

const IDENTITY_STATE_DISC_B58 = "T7d2447Yv5U";

interface OnChainStats {
  totalAnchors: number;
  averageTrustScore: number;
  highestTrustScore: number;
  totalVerifications: number;
  mostRecentTimestamp: number | null;
  attestationCount: number;
}

function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(unix: number): string {
  const seconds = Math.floor(Date.now() / 1000 - unix);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ProtocolStats() {
  const { connection } = useConnection();
  const [stats, setStats] = useState<OnChainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const programId = new PublicKey(PROGRAM_IDS.entrosAnchor);
      const sasProgramId = new PublicKey(SAS_CONFIG.programId);

      const [accounts, attestations] = await Promise.all([
        connection.getProgramAccounts(programId, {
          filters: [{ memcmp: { offset: 0, bytes: IDENTITY_STATE_DISC_B58 } }],
          dataSlice: { offset: 48, length: 14 },
        }),
        connection.getProgramAccounts(sasProgramId, {
          filters: [{ memcmp: { offset: 33, bytes: SAS_CONFIG.entrosCredentialPda } }],
          dataSlice: { offset: 0, length: 0 },
        }),
      ]);

      if (cancelled) return;

      const attestationCount = attestations.length;

      if (accounts.length === 0) {
        setStats({
          totalAnchors: 0,
          averageTrustScore: 0,
          highestTrustScore: 0,
          totalVerifications: 0,
          mostRecentTimestamp: null,
          attestationCount,
        });
        return;
      }

      let totalTrust = 0;
      let highestTrust = 0;
      let totalVerifications = 0;
      let mostRecentTimestamp = 0;

      for (const { account } of accounts) {
        const data = account.data;
        if (data.length < 14) continue;

        const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
        const lastVerif = Number(view.getBigInt64(0, true));
        const count = view.getUint32(8, true);
        const trust = view.getUint16(12, true);

        totalTrust += trust;
        if (trust > highestTrust) highestTrust = trust;
        totalVerifications += count + 1;
        if (lastVerif > mostRecentTimestamp) mostRecentTimestamp = lastVerif;
      }

      if (cancelled) return;

      setStats({
        totalAnchors: accounts.length,
        averageTrustScore:
          accounts.length > 0 ? Math.round(totalTrust / accounts.length) : 0,
        highestTrustScore: highestTrust,
        totalVerifications,
        mostRecentTimestamp: mostRecentTimestamp > 0 ? mostRecentTimestamp : null,
        attestationCount,
      });
    })()
      .catch(() => {
        if (!cancelled)
          setError(
            "Failed to fetch on-chain stats. The RPC may be rate-limited—try again shortly."
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connection]);

  return (
    <section>
      <div className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
        {/* Devnet pilot banner */}
        <div className="flex flex-col items-start justify-between gap-6 border border-cyan/30 bg-cyan/[0.03] p-6 md:flex-row md:items-center md:p-8">
          <div className="max-w-4xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
              // DEVNET PILOT · OPEN TO ALL
            </p>
            <p className="mt-3 text-base leading-relaxed text-foreground/75 md:text-lg">
              The pilot is open. Verify your humanness and join the first
              wave of Entros Anchors.
            </p>
          </div>
          <Link
            href="/verify"
            className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Verify now
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 border border-border py-24">
            <Loader2 className="h-6 w-6 animate-spin text-cyan" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              Reading from Solana devnet…
            </p>
          </div>
        )}

        {error && (
          <div className="mt-12 flex flex-col items-center justify-center gap-4 border border-border py-24">
            <ShieldAlert className="h-6 w-6 text-danger" strokeWidth={1.5} />
            <p className="max-w-sm text-center text-sm text-foreground/65">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && stats && (
          <div className="mt-12">
            {/* 5-card hairline grid */}
            <div className="grid grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "Anchors minted",
                  value: stats.totalAnchors.toLocaleString(),
                  sub: "IdentityState PDAs on devnet",
                },
                {
                  label: "Verifications",
                  value: stats.totalVerifications.toLocaleString(),
                  sub: "Cumulative across all anchors",
                },
                {
                  label: "Avg. trust score",
                  value: stats.averageTrustScore.toLocaleString(),
                  sub: "Mean across active anchors",
                },
                {
                  label: "Top trust score",
                  value: stats.highestTrustScore.toLocaleString(),
                  sub: "Highest on the network",
                },
                {
                  label: "SAS attestations",
                  value: stats.attestationCount.toLocaleString(),
                  sub: "Issued via Solana Attestation Service",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col bg-background p-6 md:p-8"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    {stat.label}
                  </p>
                  <p className="mt-6 break-all font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl">
                    {stat.value}
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-foreground/45">
                    {stat.sub}
                  </p>
                </div>
              ))}
            </div>

            {/* Most recent verification */}
            <div className="mt-8 border border-border p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
                </span>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                  Most recent verification
                </p>
              </div>
              {stats.mostRecentTimestamp ? (
                <>
                  <p className="mt-4 font-display text-2xl font-medium tracking-tight text-foreground md:text-3xl">
                    {formatTimestamp(stats.mostRecentTimestamp)}
                  </p>
                  <p className="mt-2 font-mono text-xs text-foreground/50">
                    {timeAgo(stats.mostRecentTimestamp)}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-foreground/55">
                  No verifications recorded yet.
                </p>
              )}
            </div>

            {/* Data source attribution */}
            <div className="mt-6 flex flex-col items-start justify-between gap-3 border border-border p-5 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan" />
                <p className="font-mono text-[11px] text-foreground/50">
                  Live read from{" "}
                  <a
                    href={`https://explorer.solana.com/address/${PROGRAM_IDS.entrosAnchor}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-cyan transition-colors hover:text-foreground"
                  >
                    GZYwTp2o…q4b2
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  {" · entros-anchor"}
                </p>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                Solana devnet
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
