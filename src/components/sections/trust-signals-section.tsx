import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { trustSignals } from "@/data/trust-signals";
import { getIcon } from "@/lib/icons";

/**
 * Status / Trust Signals—flat 2×2 hairline grid. Each cell carries
 * an icon, the signal name, the operational state, a short detail,
 * and an arrow indicator that links to the relevant page. Hover lights
 * only the arrow: the hairlines are the grid's ground showing between
 * opaque cells, so a translucent cell fill would turn the cell grey.
 */
export function TrustSignalsSection() {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Live on devnet<span className="text-cyan">,</span> open source<span className="text-cyan">,</span>{" "}
          red-teamed<span className="text-cyan">.</span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2">
          {trustSignals.map((signal) => {
            const Icon = getIcon(signal.icon);
            const isExternal = signal.href.startsWith("http");

            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <Icon className="h-10 w-10 text-foreground/80" />
                  <ArrowUpRight className="h-4 w-4 text-muted transition-colors duration-150 ease-out group-hover:text-cyan group-focus-visible:text-cyan motion-reduce:transition-none" aria-hidden="true" />
                </div>

                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {signal.name}
                </h3>
                <p className="mt-2 max-w-[34rem] text-sm font-medium text-foreground/80">
                  {signal.description}
                </p>
                <p className="mt-4 max-w-[34rem] text-sm leading-relaxed text-muted">
                  {signal.detail}
                </p>
              </>
            );

            const cellClass =
              "group block bg-surface p-8 transition-colors duration-150 hover:bg-surface-hover motion-reduce:transition-none forced-colors:border forced-colors:border-[CanvasText]";

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
