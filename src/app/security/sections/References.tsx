import Link from "next/link";
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

const LINK =
  "inline-flex items-center gap-2.5 text-base font-medium text-foreground underline decoration-cyan/60 underline-offset-4 transition-colors hover:decoration-cyan md:text-lg";

/**
 * References: hairline-divided rows, each an underlined link with its
 * destination host on the right.
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
              <li
                key={ref.label}
                className="flex items-center justify-between gap-6 border-b border-border py-5"
              >
                {external ? (
                  <a href={ref.href} target="_blank" rel="noopener noreferrer" className={LINK}>
                    {ref.label}
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </a>
                ) : (
                  <Link href={ref.href} className={LINK}>
                    {ref.label}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
                <span className="hidden text-sm text-foreground/40 md:block">{ref.host}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
