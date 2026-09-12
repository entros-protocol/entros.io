import { CheckCircle, Loader2, XCircle } from "lucide-react";
import type { AuthorizeCheck } from "@/lib/agent-permit-authorize";

export function AuthorizeCheckList({
  checks,
  loading,
}: {
  checks: AuthorizeCheck[] | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-foreground/60">
        <Loader2 className="h-4 w-4 animate-spin text-cyan" aria-hidden />
        Reading the agent and your Entros Anchor from devnet…
      </p>
    );
  }
  if (!checks) return null;
  return (
    <ul className="divide-y divide-border border-y border-border">
      {checks.map((check) => (
        <li key={check.id} className="flex items-start gap-3 py-3.5">
          {check.status === "pass" ? (
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-solana-green" aria-label="Passed" />
          ) : (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-label="Failed" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">{check.label}</p>
            <p className="mt-0.5 break-words text-xs leading-relaxed text-foreground/60">
              {check.detail}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
