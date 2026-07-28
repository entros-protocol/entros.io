import { AsciiSpiral } from "@/components/ui/ascii-spiral";

/**
 * Temporal Consistency—the conceptual heart of Entros. The rotating
 * ascii disk and the copy read as one centered unit in the band above
 * the three phase cards, which sit in a hairline grid below.
 */

const phases = [
  {
    day: "Day 1",
    title: "First verification",
    description:
      "You speak a phrase, trace a curve, move your device. The protocol captures the behavioral signature of that moment and stores a cryptographic commitment.",
  },
  {
    day: "Day 7",
    title: "Re-verification",
    description:
      "Same person, different session. Your voice shifts slightly. Your touch pressure changes. The ZK proof confirms the drift is within human range.",
  },
  {
    day: "Day 30+",
    title: "Trust compounds",
    description:
      "Each successful re-verification raises your Trust Score. Consistent patterns over weeks prove what a single snapshot cannot.",
  },
];

export function TemporalConsistencySection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-20 md:pb-32">
        {/* `lg:justify-center` centers the spiral + copy pair as a unit on
            the x axis; both children are content-sized so the pair balances
            around the container's midpoint rather than hugging either rail. */}
        {/* Side by side at every width. Below lg the spiral floats right,
            so the copy runs down the left and wraps beside it, then reflows
            to full width once it clears — keeping the ascii next to the text
            without crushing the paragraph into a 20-character measure. At lg
            the spiral moves to the left of the copy. `after:` is the clearfix
            that makes this row contain the float; at lg the row is a flex
            container, floats stop applying, and the pseudo-element has to
            go or `gap-16` would count it as a third item. */}
        <div className="after:table after:clear-both lg:flex lg:items-center lg:justify-center lg:gap-16 lg:after:hidden">
          {/* Container dimensions track the spiral's rendered block at each
              step of its size ladder (80 cols × 0.6em advance wide, 80 rows
              × 1.5 line-height tall), so the row reserves its space before
              the frame payload decodes. */}
          <div className="relative float-right ml-5 flex h-[250px] w-[104px] items-center justify-center sm:ml-8 sm:h-[400px] sm:w-[170px] md:h-[440px] md:w-[200px] lg:float-none lg:ml-0 lg:h-[520px] lg:w-[280px] lg:shrink-0 xl:h-[560px]">
            <AsciiSpiral className="text-[2.2px] opacity-95 sm:text-[3.5px] md:text-[4px] lg:text-[5px] xl:text-[5.5px]" />
          </div>

          <div className="max-w-xl">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // TEMPORAL CONSISTENCY
            </span>

            <h2 className="mt-4 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Identity is a pattern<span className="text-cyan">.</span>
            </h2>

            <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">
              The protocol measures behavioral drift across sessions:
              small, involuntary changes in voice, motion, and touch
              that follow a bounded pattern unique to each person.
              Verify once to register, then verify again to prove you
              are still you. Each session strengthens the claim.
            </p>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
          {phases.map((phase) => (
            <div key={phase.day} className="bg-background p-8">
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
                {phase.day}
              </span>
              <h3 className="mt-4 font-display text-lg font-medium tracking-tight text-foreground">
                {phase.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                {phase.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
