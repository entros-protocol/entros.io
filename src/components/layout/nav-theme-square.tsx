"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Square theme toggle. It lives in the footer, outlined like the social row. */
const VARIANTS = {
  footer:
    "inline-flex h-9 w-9 shrink-0 border border-border text-foreground/70 hover:border-foreground/30 hover:text-foreground",
} as const;

export function NavThemeSquare({
  variant = "footer",
}: {
  variant?: keyof typeof VARIANTS;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const base = cn(
    "items-center justify-center transition-colors",
    VARIANTS[variant]
  );

  if (!mounted) return <div className={base} aria-hidden />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      className={base}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Moon className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <Sun className="h-4 w-4" strokeWidth={1.75} />
      )}
    </button>
  );
}
