export const verificationFocusRing = [
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verification-focus-ring)]",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
].join(" ");

const press = [
  "transition-[background-color,border-color,color,transform] duration-150 ease-out",
  "active:scale-[0.96]",
  "motion-reduce:transform-none motion-reduce:transition-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
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
  "border border-foreground/15 px-6",
  "text-sm text-foreground/70",
  "hover:border-foreground/40 hover:text-foreground",
  verificationFocusRing,
  press,
].join(" ");

export const dangerVerificationActionClass = [
  "inline-flex h-11 items-center justify-center gap-2",
  "border border-danger/35 px-6",
  "text-sm text-danger",
  "hover:border-danger/70 hover:bg-danger/[0.06]",
  verificationFocusRing,
  press,
].join(" ");

export const accentVerificationActionClass = [
  "inline-flex h-11 items-center justify-center gap-2",
  "border border-cyan/40 px-6",
  "text-sm font-medium text-cyan",
  "hover:border-cyan/80 hover:bg-cyan/[0.06]",
  verificationFocusRing,
  press,
].join(" ");
