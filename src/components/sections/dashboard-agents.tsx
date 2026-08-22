"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, type Connection } from "@solana/web3.js";
import {
  attestAgentOperator,
  getAgentHumanOperator,
  PROGRAM_IDS,
  type AgentHumanOperator,
} from "@entros/pulse-sdk";
import { Bot, CheckCircle, ExternalLink, Loader2, Search, Link2 } from "lucide-react";
import { explorerUrl } from "@/lib/explorer";
import { fetchAgentsByOwner, type OwnedAgent } from "@/lib/agent-indexer";

interface OwnedAgentWithStatus extends OwnedAgent {
  entrosOperator: AgentHumanOperator | null;
  liveTrustScore: number | null;
  queryFailed: boolean;
}

type OwnedAgentsFetchState =
  | { requestKey: string; status: "ready"; agents: OwnedAgentWithStatus[] }
  | { requestKey: string; status: "error" };

async function fetchLiveTrustScore(
  walletAddress: string,
  connection: Connection
): Promise<number | null> {
  try {
    const programId = new PublicKey(PROGRAM_IDS.entrosAnchor);
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

function formatTimestamp(unix: number): string {
  return new Date(unix * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncate(addr: string): string {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function DashboardAgents() {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;
  const { connection } = useConnection();
  const walletAddress = connected ? (publicKey?.toBase58() ?? null) : null;
  const requestKey = walletAddress
    ? `${connection.rpcEndpoint}:${walletAddress}`
    : null;
  const [ownedAgentsState, setOwnedAgentsState] =
    useState<OwnedAgentsFetchState | null>(null);
  const [attestingAsset, setAttestingAsset] = useState<string | null>(null);
  const [attestErrorAsset, setAttestErrorAsset] = useState<{ asset: string; message: string } | null>(null);

  const [agentAsset, setAgentAsset] = useState("");
  const [operator, setOperator] = useState<AgentHumanOperator | null>(null);
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [attesting, setAttesting] = useState(false);
  const [attestResult, setAttestResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress || !requestKey) return;

    let cancelled = false;

    void (async () => {
      const { agents, error: indexerFailed } = await fetchAgentsByOwner(
        walletAddress
      );
      if (cancelled) return;

      if (indexerFailed) {
        setOwnedAgentsState({ requestKey, status: "error" });
        return;
      }

      const withStatus = await Promise.all(
        agents.map(async (agent): Promise<OwnedAgentWithStatus> => {
          try {
            const entrosOperator = await getAgentHumanOperator(agent.asset, connection);
            const liveTrustScore = entrosOperator
              ? await fetchLiveTrustScore(entrosOperator.wallet, connection)
              : null;
            return { ...agent, entrosOperator, liveTrustScore, queryFailed: false };
          } catch {
            return { ...agent, entrosOperator: null, liveTrustScore: null, queryFailed: true };
          }
        })
      );

      if (cancelled) return;
      setOwnedAgentsState({ requestKey, status: "ready", agents: withStatus });
    })().catch(() => {
      if (!cancelled) setOwnedAgentsState({ requestKey, status: "error" });
    });

    return () => {
      cancelled = true;
    };
  }, [connection, requestKey, walletAddress]);

  const currentAgentsState =
    requestKey && ownedAgentsState?.requestKey === requestKey
      ? ownedAgentsState
      : null;
  const loadingAgents = requestKey !== null && currentAgentsState === null;
  const scanned = currentAgentsState !== null;
  const indexerError = currentAgentsState?.status === "error";
  const ownedAgents =
    currentAgentsState?.status === "ready" ? currentAgentsState.agents : [];

  if (!connected) return null;

  async function handleCheck() {
    if (!agentAsset.trim()) return;
    setChecking(true);
    setError(null);
    setOperator(null);
    setChecked(false);
    setAttestResult(null);

    try {
      const result = await getAgentHumanOperator(agentAsset.trim(), connection);
      setOperator(result);
      setChecked(true);
    } catch {
      setError("Failed to query agent. Check the asset address.");
    } finally {
      setChecking(false);
    }
  }

  async function handleAttest() {
    if (!agentAsset.trim()) return;
    setAttesting(true);
    setError(null);
    setAttestResult(null);

    try {
      const result = await attestAgentOperator(agentAsset.trim(), {
        wallet: wallet.wallet?.adapter ?? wallet,
        connection,
      });

      if (result.success) {
        setAttestResult(result.signature ?? "Success");
        const updated = await getAgentHumanOperator(agentAsset.trim(), connection);
        setOperator(updated);
      } else {
        setError(result.error ?? "Attestation failed");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Attestation failed");
    }
    setAttesting(false);
  }

  async function handleAttestOwned(asset: string) {
    setAttestingAsset(asset);
    setAttestErrorAsset(null);
    try {
      const result = await attestAgentOperator(asset, {
        wallet: wallet.wallet?.adapter ?? wallet,
        connection,
      });
      if (result.success) {
        const updated = await getAgentHumanOperator(asset, connection);
        const liveTrustScore = updated
          ? await fetchLiveTrustScore(updated.wallet, connection)
          : null;
        setOwnedAgentsState((previous) => {
          if (
            !requestKey ||
            previous?.requestKey !== requestKey ||
            previous.status !== "ready"
          ) {
            return previous;
          }

          return {
            ...previous,
            agents: previous.agents.map((agent) =>
              agent.asset === asset
                ? {
                    ...agent,
                    entrosOperator: updated,
                    liveTrustScore,
                    queryFailed: false,
                  }
                : agent
            ),
          };
        });
      } else {
        setAttestErrorAsset({ asset, message: result.error ?? "Attestation failed" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Attestation failed";
      setAttestErrorAsset({ asset, message });
    } finally {
      setAttestingAsset(null);
    }
  }

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // AI AGENTS
        </span>

        <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Link your agents<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Link an operator wallet&apos;s Entros Anchor to its registered AI agents
          on the Solana Agent Registry. The immutable metadata records the
          operator link and its verification snapshot.
        </p>

        {/* Auto-detected owned agents */}
        <div className="mt-12 border border-border p-6 md:p-8">
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              // YOUR REGISTERED AGENTS
            </p>
            {loadingAgents && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan" />
            )}
          </div>

          {loadingAgents && (
            <p className="mt-6 text-sm text-foreground/55">
              Scanning your wallet for agents…
            </p>
          )}

          {!loadingAgents && scanned && indexerError && (
            <p className="mt-6 text-sm text-foreground/55">
              Could not reach the agent registry. Use the field below to
              check a specific agent manually.
            </p>
          )}

          {!loadingAgents && scanned && !indexerError && ownedAgents.length === 0 && (
            <p className="mt-6 text-sm text-foreground/55">
              No agents found on this wallet. Use the field below to check
              or attest a specific agent.
            </p>
          )}

          {!loadingAgents && ownedAgents.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-2">
              {ownedAgents.map((agent) => {
                const attested = agent.entrosOperator !== null;
                return (
                  <div
                    key={agent.asset}
                    className={`flex flex-col p-5 ${
                      attested ? "bg-solana-green/[0.04]" : "bg-background"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {attested ? (
                        <CheckCircle className="h-4 w-4 shrink-0 text-solana-green" />
                      ) : (
                        <Bot className="h-4 w-4 shrink-0 text-foreground/45" strokeWidth={1.5} />
                      )}
                      <p className="font-mono text-xs text-foreground/80">
                        {truncate(agent.asset)}
                      </p>
                      <a
                        href={explorerUrl(agent.asset)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-cyan transition-colors hover:text-foreground"
                        aria-label="View agent on Solana Explorer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                    {attested && agent.entrosOperator && (
                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
                            Trust (Live)
                          </p>
                          <p className="mt-1 font-display text-xl font-medium tracking-tight text-foreground">
                            {agent.liveTrustScore ?? agent.entrosOperator.trustScore}
                          </p>
                          {agent.liveTrustScore !== null &&
                            agent.liveTrustScore !== agent.entrosOperator.trustScore && (
                              <p className="mt-0.5 text-[10px] text-foreground/45">
                                {agent.entrosOperator.trustScore} at attestation
                              </p>
                            )}
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground/40">
                            Verified
                          </p>
                          <p className="mt-1 font-mono text-xs text-foreground/85">
                            {formatTimestamp(agent.entrosOperator.verifiedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                    {!attested && agent.queryFailed && (
                      <p className="mt-3 text-xs text-foreground/55">
                        Status check failed. Refresh to retry.
                      </p>
                    )}
                    {!attested && !agent.queryFailed && (
                      <button
                        onClick={() => handleAttestOwned(agent.asset)}
                        disabled={attestingAsset === agent.asset}
                        className="mt-3 inline-flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-cyan transition-colors hover:text-foreground disabled:opacity-50"
                      >
                        {attestingAsset === agent.asset ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Link2 className="h-3.5 w-3.5" />
                        )}
                        {attestingAsset === agent.asset ? "Attesting…" : "Attest with Entros"}
                      </button>
                    )}
                    {attestErrorAsset?.asset === agent.asset && (
                      <p className="mt-2 text-xs text-danger">
                        {attestErrorAsset.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Manual check */}
        <div className="mt-6 border border-border p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            // CHECK ANY AGENT ADDRESS
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label
                htmlFor="agent-asset"
                className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40"
              >
                Asset Address
              </label>
              <input
                id="agent-asset"
                type="text"
                placeholder="Paste any agent's Metaplex Core asset address..."
                className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:border-cyan/50 focus:outline-none"
                value={agentAsset}
                onChange={(e) => {
                  setAgentAsset(e.target.value);
                  setChecked(false);
                  setOperator(null);
                  setAttestResult(null);
                  setError(null);
                }}
              />
            </div>
            <button
              onClick={handleCheck}
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
            <div className="mt-8 border border-border p-6">
              <div className="mb-4 flex items-center gap-3">
                <Bot className="h-5 w-5 text-foreground/50" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    No Entros attestation found
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/50">
                    This agent has no Entros operator identity link.
                  </p>
                </div>
              </div>
              <button
                onClick={handleAttest}
                disabled={attesting}
                className="inline-flex items-center justify-center gap-2 border border-foreground/20 bg-foreground px-5 py-2.5 font-mono text-sm text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {attesting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {attesting ? "Attesting..." : "Attest with Entros"}
              </button>
            </div>
          )}

          {operator && (
            <div className="mt-8 border border-solana-green/30 bg-solana-green/[0.04] p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-solana-green" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Entros-linked Operator
                  </p>
                  <p className="mt-0.5 text-xs text-foreground/55">
                    This agent is attested with an immutable Entros
                    identity link.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Trust Score
                  </p>
                  <p className="mt-2 font-display text-3xl font-medium tracking-tight text-foreground">
                    {operator.trustScore}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Anchor last verified
                  </p>
                  <p className="mt-2 font-mono text-sm text-foreground">
                    {formatTimestamp(operator.verifiedAt)}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                    Operator Wallet
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="truncate font-mono text-xs text-foreground/65">
                      {operator.wallet}
                    </p>
                    <a
                      href={explorerUrl(operator.wallet)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-cyan transition-colors hover:text-foreground"
                      aria-label="View operator on Solana Explorer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {attestResult && (
            <p className="mt-4 font-mono text-xs text-solana-green">
              Attestation confirmed: {attestResult.slice(0, 20)}...
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
