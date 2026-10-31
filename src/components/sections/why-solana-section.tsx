import { Counter } from "@/components/ui/counter";
import { SolanaGlyph } from "@/components/icons/glyphs";
import { AsciiSolana } from "@/components/ui/ascii-solana";
import { solanaStats } from "@/data/stats";

/**
 * Why Solana: the headline with the Solana lockup on its baseline, a faint
 * shimmering ascii Solana mark in the open space to the right, then the network
 * figures in a hairline grid (2×2 mobile, 1×4 desktop).
 */
export function WhySolanaSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="relative">
          <AsciiSolana className="pointer-events-none absolute -bottom-10 right-[21%] hidden aspect-[1.35] w-[330px] opacity-90 xl:block 2xl:w-[370px] dark:opacity-85" />

          <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              Built on the chain where
              agents already transact<span className="text-cyan">.</span>
            </h2>

            <p className="flex shrink-0 items-center gap-2.5 font-display text-xl tracking-tight text-foreground md:text-2xl">
              <SolanaGlyph className="h-8 w-8 md:h-9 md:w-9" />
              Solana
            </p>
          </div>
        </div>

        {/* Hairline grid: bg-border on the outer container shows through
            the gap-px gaps between cells, giving us auto-responsive
            dividers at every breakpoint without nth-child gymnastics. */}
        <div className="mt-16 grid grid-cols-2 gap-px border-y border-border bg-border md:grid-cols-4">
          {solanaStats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center bg-background p-8 text-center"
            >
              <div className="font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl">
                {stat.numericValue != null ? (
                  <Counter
                    target={stat.numericValue}
                    prefix={stat.value.startsWith("$") ? "$" : ""}
                    suffix={stat.suffix}
                  />
                ) : (
                  stat.value
                )}
              </div>
              <p className="mt-3 text-sm text-foreground/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
