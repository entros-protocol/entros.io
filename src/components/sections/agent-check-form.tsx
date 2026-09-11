"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Loader2, Search } from "lucide-react";
import { AgentStatusCard } from "@/components/sections/agent-status-card";
import { readAgentStatus, type AgentStatus } from "@/lib/agent-status";

/** Reads one agent's current owner, agent wallet and owner Anchor from devnet. */
export function AgentCheckForm({
  initialAgent = "",
  inputId,
}: {
  initialAgent?: string;
  inputId: string;
}) {
  const { connection } = useConnection();
  const [agentAsset, setAgentAsset] = useState(initialAgent);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  async function runCheck(asset: string) {
    if (!asset.trim()) return;
    const thisRequest = ++requestId.current;
    setChecking(true);
    setError(null);
    setStatus(null);
    try {
      const result = await readAgentStatus(asset.trim(), connection);
      if (requestId.current === thisRequest) setStatus(result);
    } catch {
      if (requestId.current === thisRequest) setError("Could not read devnet. Try again.");
    } finally {
      if (requestId.current === thisRequest) setChecking(false);
    }
  }

  useEffect(() => {
    if (!initialAgent) return;
    const thisRequest = ++requestId.current;
    void readAgentStatus(initialAgent, connection).then(
      (result) => {
        if (requestId.current === thisRequest) setStatus(result);
      },
      () => {
        if (requestId.current === thisRequest) setError("Could not read devnet. Try again.");
      },
    );
  }, [connection, initialAgent]);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor={inputId}
            className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40"
          >
            Agent Asset Address
          </label>
          <input
            id={inputId}
            type="text"
            placeholder="Paste a Solana Agent Registry asset address..."
            className="w-full border border-border bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-foreground/30 transition-colors focus:border-cyan/50 focus:outline-none"
            value={agentAsset}
            onChange={(event) => {
              requestId.current++;
              setAgentAsset(event.target.value);
              setStatus(null);
              setError(null);
              setChecking(false);
            }}
            onKeyDown={(event) => event.key === "Enter" && runCheck(agentAsset)}
          />
        </div>
        <button
          type="button"
          onClick={() => runCheck(agentAsset)}
          disabled={checking || !agentAsset.trim()}
          className="inline-flex items-center justify-center gap-2 border border-foreground/20 bg-foreground px-6 py-3 font-mono text-sm text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
          Check
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      {status && (
        <div className="mt-8">
          <AgentStatusCard status={status} />
        </div>
      )}
    </div>
  );
}
