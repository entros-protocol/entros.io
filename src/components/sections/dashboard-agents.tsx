"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { readAgentState, type AgentStateReadResult } from "@entros/pulse-sdk";
import { Bot, ExternalLink, Loader2 } from "lucide-react";
import { AgentCheckForm } from "@/components/sections/agent-check-form";
import { fetchAgentsByOwner, type OwnedAgent } from "@/lib/agent-indexer";
import { explorerUrl } from "@/lib/explorer";

interface OwnedAgentState extends OwnedAgent {
  state: AgentStateReadResult;
}

type OwnedAgentsFetchState =
  | { requestKey: string; status: "ready"; agents: OwnedAgentState[] }
  | { requestKey: string; status: "error" };

function truncate(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

function describe(state: AgentStateReadResult, wallet: string): string {
  if (state.status !== "available") return "Could not read this agent on devnet.";
  if (state.evidence.owner !== wallet) return "The Core asset names another owner. The index is behind.";
  if (state.evidence.agentWalletStatus === "bound") return `Agent wallet ${truncate(state.evidence.agentWallet ?? "")}`;
  if (state.evidence.agentWalletStatus === "stale") return "Agent wallet set before a transfer. Bind it again.";
  return "No agent wallet bound yet.";
}

export function DashboardAgents() {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const walletAddress = connected ? (publicKey?.toBase58() ?? null) : null;
  const requestKey = walletAddress ? `${connection.rpcEndpoint}:${walletAddress}` : null;
  const [owned, setOwned] = useState<OwnedAgentsFetchState | null>(null);

  useEffect(() => {
    if (!walletAddress || !requestKey) return;
    let cancelled = false;
    void (async () => {
      const { agents, error } = await fetchAgentsByOwner(walletAddress);
      if (error) {
        if (!cancelled) setOwned({ requestKey, status: "error" });
        return;
      }
      const withState = await Promise.all(
        agents.map(async (agent) => ({
          ...agent,
          state: await readAgentState({ agent: agent.asset, connection }),
        })),
      );
      if (!cancelled) setOwned({ requestKey, status: "ready", agents: withState });
    })();
    return () => {
      cancelled = true;
    };
  }, [connection, requestKey, walletAddress]);

  if (!walletAddress) return null;
  const current = owned?.requestKey === requestKey ? owned : null;

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">// AI AGENTS</span>
        <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Your agents<span className="text-cyan">.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          When an app asks for a permit, your agent sends you a link. Open it to review the action
          and sign.{" "}
          <Link href="/docs/integrate/agent-permit" className="text-cyan transition-colors hover:text-foreground">
            How permits work
          </Link>
        </p>

        <div className="mt-12 border border-border p-6 md:p-8">
          <div className="flex items-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
              // REGISTERED TO THIS WALLET
            </p>
            {!current && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan" aria-hidden />}
          </div>
          {current?.status === "error" && (
            <p className="mt-6 text-sm text-foreground/55">
              Could not reach the agent registry index. Check a specific agent below.
            </p>
          )}
          {current?.status === "ready" && current.agents.length === 0 && (
            <p className="mt-6 text-sm text-foreground/55">No agents are registered to this wallet.</p>
          )}
          {current?.status === "ready" && current.agents.length > 0 && (
            <ul className="mt-8 grid grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-2">
              {current.agents.map((agent) => (
                <li key={agent.asset} className="flex flex-col gap-3 bg-background p-5">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 shrink-0 text-foreground/45" strokeWidth={1.5} aria-hidden />
                    <p className="font-mono text-xs text-foreground/80">{truncate(agent.asset)}</p>
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
                  <p className="text-xs text-foreground/60">{describe(agent.state, walletAddress)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 border border-border p-6 md:p-8">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            // CHECK ANY AGENT ADDRESS
          </p>
          <AgentCheckForm inputId="dashboard-agent-asset" />
        </div>
      </div>
    </section>
  );
}
