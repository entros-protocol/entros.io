"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { Loader2, Search } from "lucide-react";
import { AgentStatusCard } from "@/components/sections/agent-status-card";
import { primaryButtonClass, textInputClass } from "@/components/ui/button-styles";
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
  const errorId = `${inputId}-error`;

  async function runCheck(asset: string) {
    const trimmed = asset.trim();
    if (!trimmed) {
      setError("Enter an agent asset address.");
      setStatus(null);
      return;
    }
    const thisRequest = ++requestId.current;
    setChecking(true);
    setError(null);
    setStatus(null);
    try {
      const result = await readAgentStatus(trimmed, connection);
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
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void runCheck(agentAsset);
        }}
        noValidate
        className="flex flex-col gap-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label
            htmlFor={inputId}
            className="mb-2 block text-sm font-medium text-muted"
          >
            Agent Asset Address
          </label>
          <input
            id={inputId}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste a Solana Agent Registry asset address..."
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={textInputClass}
            value={agentAsset}
            onChange={(event) => {
              requestId.current++;
              setAgentAsset(event.target.value);
              setStatus(null);
              setError(null);
              setChecking(false);
            }}
          />
        </div>
        <button
          type="submit"
          disabled={checking}
          className={primaryButtonClass}
        >
          {checking ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span className="[text-box:trim-both_cap_alphabetic]">Check</span>
        </button>
      </form>
      {error && (
        <p id={errorId} role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}
      {status && (
        <div className="mt-8">
          <AgentStatusCard status={status} />
        </div>
      )}
    </div>
  );
}
