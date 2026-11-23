import { cn } from "@/lib/utils";

interface DevnetNoticeProps {
  className?: string;
}

export function DevnetNotice({ className }: DevnetNoticeProps) {
  return (
    <div
      role="note"
      className={cn(
        "mb-8 max-w-3xl bg-surface px-4 py-3 text-sm leading-6 text-muted",
        className,
      )}
    >
      <p>
        Solana devnet reference surface. Maintained for devnet compatibility
        while Solana mainnet deployment stays paused.
      </p>
    </div>
  );
}
