/** One labelled value in a review panel. Addresses take a full row so they never wrap. */
export function DetailField({
  label,
  value,
  prose = false,
  wide = false,
}: {
  label: string;
  value: string;
  prose?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={`min-w-0 ${wide ? "sm:col-span-2" : ""}`}>
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">{label}</dt>
      <dd
        className={
          prose
            ? "mt-1.5 text-sm leading-relaxed text-foreground/85"
            : "mt-1.5 break-all font-mono text-xs text-foreground/85"
        }
      >
        {value}
      </dd>
    </div>
  );
}
