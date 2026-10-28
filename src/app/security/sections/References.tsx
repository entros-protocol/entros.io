import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const links = [
  { label: "Research paper", href: "/paper", host: "entros.io/paper" },
  {
    label: "On-chain programs",
    href: "https://explorer.solana.com/address/GZYwTp2ozeuRA5Gof9vs4ya961aANcJBdUzB7LN6q4b2?cluster=devnet",
    host: "explorer.solana.com",
  },
  {
    label: "AUDIT.md, the public fix tracker",
    href: "https://github.com/entros-protocol/entros.io/blob/main/AUDIT.md",
    host: "github.com",
  },
  {
    label: "Public adversarial baseline tests",
    href: "https://github.com/entros-protocol/pulse-sdk/blob/main/test/pentest.test.ts",
    host: "github.com",
  },
  {
    label: "GitHub organization",
    href: "https://github.com/entros-protocol",
    host: "github.com",
  },
];

const ROW =
  "group grid grid-cols-[1fr_auto] items-center gap-6 py-5 text-foreground/80 transition-colors hover:text-foreground md:grid-cols-[1fr_14rem_auto]";

function RowBody({ label, host, external }: { label: string; host: string; external: boolean }): ReactNode {
  const Arrow = external ? ArrowUpRight : ArrowRight;
  return (
    <>
      <span className="text-base">{label}</span>
      <span className="hidden font-mono text-xs text-foreground/40 md:block">{host}</span>
      <span
        aria-hidden="true"
        className="
          inline-flex h-9 w-9 items-center justify-center border border-border
          text-foreground/60 transition-colors
          group-hover:border-foreground group-hover:bg-foreground group-hover:text-background
        "
      >
        <Arrow className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </>
  );
}

/**
 * References: hairline-divided link rows. Each row names the destination
 * host and ends in a square arrow tile that fills on hover.
 */
export function References() {
  return (
    <section id="references" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Learn more<span className="text-cyan">.</span>
        </h2>

        <ul className="mt-12 border-t border-border">
          {links.map((ref) => {
            const external = ref.href.startsWith("http");
            return (
              <li key={ref.label} className="border-b border-border">
                {external ? (
                  <a href={ref.href} target="_blank" rel="noopener noreferrer" className={ROW}>
                    <RowBody label={ref.label} host={ref.host} external />
                  </a>
                ) : (
                  <Link href={ref.href} className={ROW}>
                    <RowBody label={ref.label} host={ref.host} external={false} />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
