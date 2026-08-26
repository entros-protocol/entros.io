export const primaryVerificationActionClass = [
  "inline-flex items-center justify-center gap-2",
  "rounded-full bg-foreground px-6 py-3",
  "text-sm font-medium text-background",
  "shadow-[0_12px_30px_rgba(0,0,0,0.16)]",
  "transition-[background-color,box-shadow,transform] duration-150",
  "hover:bg-foreground/90 hover:shadow-[0_16px_36px_rgba(0,0,0,0.2)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--verification-focus-ring)]",
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "active:scale-[0.96]",
  "motion-reduce:transform-none motion-reduce:transition-none",
  "disabled:cursor-not-allowed disabled:opacity-50",
].join(" ");
