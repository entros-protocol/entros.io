import { AsciiDataFlowScene } from "@/components/ui/ascii-scenes";
import { privacyGuarantees } from "@/data/privacy-guarantees";
import { getIcon } from "@/lib/icons";

/**
 * Privacy Model: the data-flow scene in a panel joined to a 2×3 hairline
 * grid of short guarantees, sized so the pair fits one screen.
 */
export function PrivacySection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Privacy by architecture<span className="text-cyan">.</span>
        </h2>

        {/* On lg the grid butts against the panel with no gutter, so its top
            and bottom rules run into the panel's edges and the row rules
            end on its side. */}
        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-stretch lg:gap-0">
          <div className="mx-auto w-full max-w-[420px] lg:col-span-5 lg:max-w-none">
            <AsciiDataFlowScene aspect="1/1" fit className="lg:h-full" />
          </div>

          <ul className="bleed-right grid grid-cols-1 gap-px border-y border-border bg-border sm:grid-cols-2 lg:col-span-7">
            {privacyGuarantees.map((guarantee) => {
              const Icon = getIcon(guarantee.icon);
              return (
                <li key={guarantee.title} className="bg-background p-6 md:p-7">
                  <Icon className="h-7 w-7 text-foreground/80" />
                  <h3 className="mt-5 font-display text-base font-medium tracking-tight text-foreground">
                    {guarantee.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                    {guarantee.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
