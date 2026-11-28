export const verificationFocusRing = [
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verification-focus-ring)]",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
].join(" ");

const press = [
  "transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
  "active:scale-[0.96]",
  "motion-reduce:transform-none motion-reduce:transition-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "forced-colors:border forced-colors:border-[ButtonText]",
].join(" ");

/** The one solid action on each verification screen. Square, like the console. */
export const primaryVerificationActionClass = [
  "inline-flex h-12 items-center justify-center gap-2.5",
  "bg-foreground px-7",
  "text-sm font-medium text-background",
  "hover:bg-foreground/90",
  verificationFocusRing,
  press,
].join(" ");

export const secondaryVerificationActionClass = [
  "inline-flex h-11 items-center justify-center gap-2",
  "bg-background px-6",
  "text-sm font-medium text-foreground",
  "hover:bg-surface-hover",
  verificationFocusRing,
  press,
].join(" ");

export const dangerVerificationActionClass = [
  "inline-flex h-11 items-center justify-center gap-2",
  "bg-danger/10 px-6",
  "text-sm font-medium text-danger",
  "hover:bg-danger/15",
  verificationFocusRing,
  press,
].join(" ");

export const accentVerificationActionClass = [
  "inline-flex h-11 items-center justify-center gap-2",
  "bg-cyan/10 px-6",
  "text-sm font-medium text-cyan",
  "hover:bg-cyan/15",
  verificationFocusRing,
  press,
].join(" ");
