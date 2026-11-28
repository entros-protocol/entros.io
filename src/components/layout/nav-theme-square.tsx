"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
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

const NEXT_THEME = {
  system: "light",
  light: "dark",
  dark: "system",
} as const;

const THEME_LABEL = {
  system: "Theme: System. Switch to light mode",
  light: "Theme: Light. Switch to dark mode",
  dark: "Theme: Dark. Switch to system theme",
} as const;

export function NavThemeSquare({
  variant = "footer",
}: {
  variant?: keyof typeof VARIANTS;
}) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  const base = cn(
    "items-center justify-center transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
    VARIANTS[variant]
  );

  if (!mounted) return <div className={base} aria-hidden />;

  const current: keyof typeof NEXT_THEME =
    theme === "light" || theme === "dark" || theme === "system"
      ? theme
      : "system";

  return (
    <button
      type="button"
      className={base}
      onClick={() => setTheme(NEXT_THEME[current])}
      aria-label={THEME_LABEL[current]}
    >
      {current === "system" ? (
        <Monitor className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      ) : current === "dark" ? (
        <Moon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
      )}
    </button>
  );
}
