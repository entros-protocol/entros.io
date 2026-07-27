import { AsciiDataFlowScene } from "@/components/ui/ascii-scenes";
import { privacyGuarantees } from "@/data/privacy-guarantees";
import { getIcon } from "@/lib/icons";

/**
 * Privacy Model—2-column split: the data-flow scene on the left,
 * vertical list of guarantees on the right. Distinct geometry from
 * the grids elsewhere; reads like a documentation diagram + caption.
 */
export function PrivacySection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // PRIVACY MODEL
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Privacy by architecture<span className="text-cyan">.</span>
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start lg:gap-16">
          <AsciiDataFlowScene label="DATA FLOW" aspect="4/5" fit />

          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {privacyGuarantees.map((guarantee) => {
              const Icon = getIcon(guarantee.icon);
              return (
                <li key={guarantee.title} className="flex gap-4 py-6">
                  <Icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-cyan"
                    strokeWidth={1.5}
                  />
                  <div>
                    <h3 className="font-display text-base font-medium tracking-tight text-foreground">
                      {guarantee.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                      {guarantee.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
