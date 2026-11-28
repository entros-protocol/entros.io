import { StepNumber } from "@/components/ui/step-number";
import { features } from "@/data/features";
import { getIcon } from "@/lib/icons";

/**
 * How It Works—three flat cards arranged in a hairline grid.
 */
export function HowItWorksSection() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Your voice, your touch, your motion<span className="text-cyan">.</span>{" "}
          One private proof<span className="text-cyan">.</span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = getIcon(feature.icon);
            return (
              <div
                key={feature.title}
                className="bg-background p-8 forced-colors:border forced-colors:border-[CanvasText]"
              >
                <div className="flex items-center justify-between gap-3">
                  <StepNumber n={i + 1} />
                  <Icon className="h-10 w-10 text-foreground/80" />
                </div>
                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
                <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted">
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
