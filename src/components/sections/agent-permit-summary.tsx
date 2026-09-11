import type { AgentPermitRequest } from "@entros/verify/agent-permit";
import { DetailField } from "@/components/ui/detail-field";

function formatTime(seconds: number): string {
  return new Date(seconds * 1000).toISOString().replace(".000Z", " UTC").replace("T", " ");
}

function policyText(request: AgentPermitRequest): string {
  const { policy } = request;
  const hours = policy.maxVerificationAgeSeconds / 3600;
  const age = Number.isInteger(hours)
    ? `${hours} h`
    : `${Math.round(policy.maxVerificationAgeSeconds / 60)} min`;
  return [
    `${policy.id} v${policy.version}`,
    `Trust Score ${policy.minTrustScore} or more`,
    `verified within ${age}`,
    policy.requireAttestation ? "attestation required" : "attestation optional",
  ].join(" · ");
}

/** Every field the owner signs, shown before the wallet prompt. */
export function AgentPermitSummary({ request }: { request: AgentPermitRequest }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">Action</p>
      <p className="mt-2 font-display text-2xl font-medium tracking-tight text-foreground">
        {request.action.label}
      </p>
      <p className="mt-2 break-all text-sm text-foreground/60">
        At <span className="font-mono text-foreground/85">{request.audience}</span>
      </p>
      <dl className="mt-8 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <DetailField label="Agent" value={request.agent} wide />
        <DetailField label="Agent wallet" value={request.agentWallet} wide />
        <DetailField label="Owner" value={request.operator} wide />
        <DetailField label="Expires" value={formatTime(request.expiresAt)} />
        <DetailField label="Policy" value={policyText(request)} prose />
        <DetailField label="Action digest" value={request.action.sha256} wide />
      </dl>
    </div>
  );
}
