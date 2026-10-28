import { AsciiHelix } from "@/components/ui/ascii-helix";

const phases = [
  {
    day: "Day 1",
    title: "First verification",
    description:
      "Say three words and trace three short paths. Your wallet receives its Entros Anchor.",
  },
  {
    day: "Day 7",
    title: "Verify again",
    description:
      "The new session is compared with your last one. A zero-knowledge proof shows they match without revealing either.",
  },
  {
    day: "Day 30+",
    title: "Trust grows",
    description:
      "Each return adds to your wallet's history. Trust Score counts the weeks you were active, how recently you verified and how long you have held the Anchor.",
  },
];

const HELIX_COLS = 200;
const HELIX_ROWS = 26;

/**
 * Temporal Consistency: the headline and its explanation side by side,
 * then a twisting thread that runs over the three visits. Ticks drop from
 * the thread to each card, so it reads as the history those visits build.
 */
export function TemporalConsistencySection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-16">
          <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05] lg:col-span-6">
            Come back, and your wallet builds a history
            <span className="text-cyan">.</span>
          </h2>

          <p className="text-base leading-relaxed text-foreground/65 md:text-lg lg:col-span-5 lg:col-start-8">
            Each time you verify, a zero-knowledge proof shows you match
            your last session without revealing either one. Your Trust
            Score grows with the weeks you return.
          </p>
        </div>

        {/* Glyph size follows the viewport so the thread spans the content
            width: HELIX_COLS glyphs at a 0.6em advance, capped at 11px. The box
            height is the row count in em, reserved before the frames decode. */}
        <div
          className="relative mt-16 mb-10 md:mt-20"
          style={{
            fontSize: `min(calc((100vw - 7rem) / ${(HELIX_COLS * 0.6).toFixed(1)}), 11px)`,
          }}
        >
          <div
            className="flex items-center justify-center overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]"
            style={{ height: `${HELIX_ROWS}em` }}
          >
            <AsciiHelix cols={HELIX_COLS} rows={HELIX_ROWS} className="text-[1em]" />
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
          {phases.map((phase) => (
            <div key={phase.day} className="relative bg-background p-8">
              <span
                aria-hidden
                className="absolute -top-10 left-1/2 hidden h-10 w-px bg-gradient-to-b from-transparent to-cyan/50 md:block"
              />
              <span
                aria-hidden
                className="absolute -top-[3px] left-1/2 hidden size-[5px] -translate-x-1/2 bg-cyan md:block"
              />
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
