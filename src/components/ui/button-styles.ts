export const focusRingClass = [
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verification-focus-ring)]",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
].join(" ");

export const primaryButtonClass = [
  "group inline-flex min-h-11 items-center justify-center gap-2",
  "bg-foreground px-5 py-2.5 sm:px-6",
  "text-sm font-medium leading-none text-background",
  "transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
  "hover:bg-foreground/90 active:scale-[0.96]",
  "motion-reduce:transform-none motion-reduce:transition-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "forced-colors:border forced-colors:border-[ButtonText]",
  focusRingClass,
].join(" ");

export const secondaryButtonClass = [
  "group inline-flex min-h-11 items-center justify-center gap-2",
  "bg-surface px-5 py-2.5 sm:px-6",
  "text-sm font-medium leading-none text-foreground",
  "transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
  "hover:bg-surface-hover active:scale-[0.96]",
  "motion-reduce:transform-none motion-reduce:transition-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "forced-colors:border forced-colors:border-[ButtonText]",
  focusRingClass,
].join(" ");

export const secondaryButtonOnSurfaceClass = [
  "group inline-flex min-h-11 items-center justify-center gap-2",
  "bg-background px-5 py-2.5 sm:px-6",
  "text-sm font-medium leading-none text-foreground",
  "transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
  "hover:bg-surface-hover active:scale-[0.96]",
  "motion-reduce:transform-none motion-reduce:transition-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "forced-colors:border forced-colors:border-[ButtonText]",
  focusRingClass,
].join(" ");

export const buttonArrowClass =
  "optical-icon-nudge h-4 w-4 shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none";

export const textInputClass = [
  "w-full min-h-11 border border-control-border bg-background px-4 py-2.5",
  "font-mono text-base text-foreground placeholder:text-muted",
  "transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--verification-focus-ring)]",
  "forced-colors:border-[ButtonText]",
].join(" ");
