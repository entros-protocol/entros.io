import Image from "next/image";
import { integrationPartners } from "@/data/integration-partners";
import { getIcon } from "@/lib/icons";

/**
 * Partners — 4×4 hairline grid of integration targets. Each cell:
 * logo + name, category label, one-line description.
 */
export function PartnersSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Building for the Solana ecosystem<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Target surfaces across identity primitives, agent
          infrastructure, DeFi, governance, and creator tooling. Each
          reads the same on-chain Trust Score, free.
        </p>

        <div className="mt-16 grid grid-cols-2 gap-px border-y border-border bg-border md:grid-cols-3 lg:grid-cols-4">
          {integrationPartners.map((partner) => {
            const Icon = getIcon(partner.icon);
            return (
              <div
                key={partner.name}
                className="flex flex-col bg-background p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  {partner.logoUrl ? (
                    <Image
                      src={partner.logoUrl}
                      alt={`${partner.name} logo`}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center border border-border">
                      <Icon className="h-4 w-4 text-foreground/60" />
                    </div>
                  )}
                  <h3 className="font-display text-base font-medium tracking-tight text-foreground">
                    {partner.name}
                  </h3>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-cyan/80">
                  {partner.category}
                </span>
                <p className="mt-3 text-sm leading-relaxed text-foreground/55">
                  {partner.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
