"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { verificationFocusRing } from "@/components/verify/verification-styles";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Square theme toggle. It lives in the footer, stepped off the footer surface. */
const VARIANTS = {
  footer:
    `inline-flex h-11 w-11 shrink-0 bg-background text-muted hover:bg-surface-hover hover:text-foreground forced-colors:border forced-colors:border-[ButtonText] ${verificationFocusRing}`,
} as const;

export function NavThemeSquare({
  variant = "footer",
}: {
  variant?: keyof typeof VARIANTS;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  const base = cn(
    "items-center justify-center transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
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
