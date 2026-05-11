import { mobileRoadmapItems } from "@/data/mobile-roadmap";
import { getIcon } from "@/lib/icons";

/**
 * Coming to Mobile—three feature cells in a hairline grid.
 */
export function MobileRoadmapSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // COMING TO MOBILE
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Verify on the go<span className="text-cyan">.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          A Solana Mobile app is in development for the Solana dApp
          Store, targeting Seeker. Native sensor APIs extend the
          biometric surface, and Trust Score carries across every
          dApp in the mobile ecosystem.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
          {mobileRoadmapItems.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <div key={item.title} className="bg-background p-8">
                <Icon className="h-6 w-6 text-cyan" strokeWidth={1.5} />
                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  {item.description}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  {item.benefit}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
