import { cn } from "@/lib/utils";

/** A two-digit step index set in the display face with tabular figures. */
export function StepNumber({ n, className }: { n: number | string; className?: string }) {
  return (
    <span
      className={cn(
        "font-display text-2xl font-light leading-none tracking-tight tabular-nums text-foreground/45 md:text-[1.75rem]",
        className,
      )}
    >
      {typeof n === "number" ? String(n).padStart(2, "0") : n}
    </span>
  );
}
