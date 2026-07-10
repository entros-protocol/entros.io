import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { trustSignals } from "@/data/trust-signals";
import { getIcon } from "@/lib/icons";

/**
 * Status / Trust Signals—flat 2×2 hairline grid. Each cell carries
 * an icon, the signal name, the operational state, a short detail,
 * and an arrow indicator that links to the relevant page.
 */
export function TrustSignalsSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // STATUS
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Live on devnet,
          proven in the open<span className="text-cyan">.</span>
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-2">
          {trustSignals.map((signal) => {
            const Icon = getIcon(signal.icon);
            const isExternal = signal.href.startsWith("http");

            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <Icon className="h-6 w-6 text-cyan" strokeWidth={1.5} />
                  <ArrowUpRight className="h-4 w-4 text-foreground/30 transition-colors group-hover:text-foreground" />
                </div>

                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {signal.name}
                </h3>
                <p className="mt-2 text-sm font-medium text-foreground/70">
                  {signal.description}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/55">
                  {signal.detail}
                </p>
              </>
            );

            const cellClass =
              "group bg-background p-8 transition-colors hover:bg-foreground/[0.015]";

            return isExternal ? (
              <a
                key={signal.name}
                href={signal.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cellClass}
              >
                {content}
              </a>
            ) : (
              <Link key={signal.name} href={signal.href} className={cellClass}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
