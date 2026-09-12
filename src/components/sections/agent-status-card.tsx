import { CheckCircle, ExternalLink, XCircle } from "lucide-react";
import { AgentSnapshotNote } from "@/components/sections/agent-snapshot-note";
import type { AgentStatus } from "@/lib/agent-status";
import { explorerUrl } from "@/lib/explorer";

function formatDate(seconds: number): string {
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function failure(reason: string): string {
  if (reason === "agent_missing") return "This agent no longer exists on devnet.";
  if (reason === "agent_unregistered") return "This asset is not an agent in the 8004 agent registry.";
  if (reason === "invalid_request") return "Enter a valid agent asset address.";
  if (reason === "rpc_unavailable") return "Could not read devnet. Try again.";
  return "This account does not decode as an 8004 agent.";
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">{label}</p>
      <div className="mt-2 text-sm text-foreground/85">{children}</div>
    </div>
  );
}

/** Current owner, agent wallet and the owner's Entros Anchor for one registry agent. */
export function AgentStatusCard({ status }: { status: AgentStatus }) {
  const { state, ownerAnchor, snapshot } = status;
  if (state.status !== "available") {
    return (
      <div className="flex items-start gap-3 border border-border p-5">
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-foreground/50" aria-hidden />
        <p className="text-sm text-foreground/70">{failure(state.reason)}</p>
      </div>
    );
  }
  const { evidence } = state;
  const wallet =
    evidence.agentWalletStatus === "bound"
      ? evidence.agentWallet
      : evidence.agentWalletStatus === "stale"
        ? "Set before the last transfer. The owner must bind it again."
        : "Not bound. The agent cannot present permits yet.";
  return (
    <div className="border border-border p-6 md:p-8">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-solana-green" aria-hidden />
        <p className="text-sm font-medium text-foreground">Registered agent on the 8004 registry</p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-6">
        <Row label="Current owner">
          <span className="flex items-center gap-2">
            <span className="break-all font-mono text-xs">{evidence.owner}</span>
            <a
              href={explorerUrl(evidence.owner)}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-cyan transition-colors hover:text-foreground"
              aria-label="View the current owner on Solana Explorer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </span>
        </Row>
        <Row label="Agent wallet">
          <span className={evidence.agentWalletStatus === "bound" ? "break-all font-mono text-xs" : ""}>
            {wallet}
          </span>
        </Row>
        <Row label="Owner's Entros Anchor">
          {ownerAnchor
            ? `Trust Score ${ownerAnchor.trustScore} · last verified ${formatDate(ownerAnchor.lastVerificationTimestamp)}`
            : "The current owner has no Entros Anchor."}
        </Row>
      </div>
      {snapshot.status === "present" && (
        <div className="mt-8">
          <AgentSnapshotNote snapshot={snapshot.snapshot} currentOwner={evidence.owner} />
        </div>
      )}
    </div>
  );
}
