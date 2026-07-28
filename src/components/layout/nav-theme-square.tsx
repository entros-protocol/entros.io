"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/**
 * Square theme block matching the other nav tiles.
 *
 * `nav` inverts with the theme via bg-foreground / text-background, so it
 * reads white-on-dark and black-on-light with no extra branching. `sheet`
 * sits inside the mobile menu, which is already a bg-foreground panel, so
 * it outlines itself in the panel's own text colour instead.
 */
const VARIANTS = {
  nav: "hidden h-[46px] w-[46px] bg-foreground text-background shadow-[0_10px_34px_rgba(0,0,0,0.3)] hover:bg-foreground/90 md:inline-flex",
  sheet:
    "inline-flex h-10 w-10 shrink-0 border border-background/25 text-background hover:bg-background/10",
} as const;

export function NavThemeSquare({
  variant = "nav",
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
        <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} />
      ) : (
        <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} />
      )}
    </button>
  );
}
