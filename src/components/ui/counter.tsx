import { cn } from "@/lib/utils";

interface CounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function Counter({
  target,
  prefix = "",
  suffix = "",
  className,
}: CounterProps) {
  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      {target}
      {suffix}
    </span>
  );
}
