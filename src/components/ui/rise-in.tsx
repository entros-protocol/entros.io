import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Renders content immediately without hiding below-the-fold media behind scroll opacity gates. */
export function RiseIn({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}
