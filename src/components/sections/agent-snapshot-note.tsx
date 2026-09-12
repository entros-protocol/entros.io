import type { AgentOperatorSnapshot } from "@entros/pulse-sdk";

function formatDate(seconds: number): string {
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** The old metadata entry, shown as a claim someone wrote rather than a current fact. */
export function AgentSnapshotNote({
  snapshot,
  currentOwner,
}: {
  snapshot: AgentOperatorSnapshot;
  currentOwner: string | null;
}) {
  const matches = currentOwner !== null && snapshot.wallet === currentOwner;
  return (
    <div className="border-t border-border pt-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
        Legacy operator snapshot
      </p>
      <p className="mt-3 text-sm leading-relaxed text-foreground/65">
        An owner of this agent wrote an{" "}
        <span className="font-mono text-xs text-foreground/80">entros:human-operator</span> entry. Any
        owner can write one with any content, and it grants no permission.
      </p>
      {/* Only the address may break mid-word. The spaces between the spans stay outside them,
          so the line can still wrap before each detail. */}
      <p className="mt-3 font-mono text-xs text-foreground/70">
        <span className="break-all">Names {snapshot.wallet}</span>{" "}
        <span className="whitespace-nowrap">· Trust Score {snapshot.trustScore}</span>{" "}
        <span className="whitespace-nowrap">· {formatDate(snapshot.verifiedAt)}</span>
      </p>
      <p className={`mt-2 text-xs ${matches ? "text-foreground/55" : "text-amber-500"}`}>
        {matches
          ? "The named wallet is the current owner."
          : "The named wallet is not the current owner."}
      </p>
    </div>
  );
}
