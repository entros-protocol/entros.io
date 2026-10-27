import { Counter } from "@/components/ui/counter";
import { solanaStats } from "@/data/stats";

/**
 * Why Solana—horizontal stat row in a hairline grid (2×2 mobile,
 * 1×4 desktop). Each cell centers a metric and a label.
 */
export function WhySolanaSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Built on the chain where
          agents already transact<span className="text-cyan">.</span>
        </h2>

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
