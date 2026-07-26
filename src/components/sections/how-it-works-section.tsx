import { features } from "@/data/features";
import { getIcon } from "@/lib/icons";

/**
 * How It Works—three flat cards arranged in a hairline grid.
 */
export function HowItWorksSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // HOW IT WORKS
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Three involuntary signals,
          one cryptographic commitment<span className="text-cyan">.</span>
        </h2>

        {/* Hairline grid via bg-border + gap-px (see why-solana-section.tsx). */}
        <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = getIcon(feature.icon);
            return (
              <div key={feature.title} className="bg-background p-8">
                {/* Index rule—step number, hairline span, mini icon.
                    Mirrors the integration cards on the Realms case study. */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm tracking-[0.2em] text-cyan">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                  <Icon className="h-5 w-5 text-cyan" strokeWidth={1.5} />
                </div>
                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  {feature.description}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  {feature.benefit}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
