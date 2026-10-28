const signals = [
  {
    label: "Agents",
    text: "Software now holds wallets, trades and votes on its own.",
  },
  {
    label: "The gap",
    text: "A wallet address cannot show whether a person stands behind it.",
  },
  {
    label: "The signal",
    text: "Entros is designed to show that a person verified, without asking who they are.",
  },
];

/**
 * Problem section: the stakes at display size across the full span, then
 * a two-column band with the frame on the left and three numbered lines
 * on the right.
 */
export function ProblemSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-4xl text-balance font-display text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-foreground md:text-[3.5rem]">
          Agents are becoming economic actors<span className="text-cyan">.</span>
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-12 border-t border-border pt-12 md:mt-24 lg:grid-cols-12 lg:gap-16">
          <p className="text-lg leading-relaxed text-foreground/70 md:text-xl lg:col-span-5">
            Apps need a signal that a person still holds the controls. Entros
            is designed to give that signal, privately, each time you verify.
          </p>

          <ol className="divide-y divide-border lg:col-span-6 lg:col-start-7">
            {signals.map((signal, i) => (
              <li
                key={signal.label}
                className="grid grid-cols-[3rem_1fr] items-baseline gap-x-4 gap-y-1 py-6 text-base leading-relaxed first:pt-1 last:pb-0 md:grid-cols-[3.5rem_8rem_1fr] md:gap-x-6"
              >
                <span className="font-mono text-sm tracking-[0.2em] text-cyan">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-medium text-foreground">
                  {signal.label}
                </span>
                <span className="col-start-2 text-foreground/65 md:col-start-3">
                  {signal.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
