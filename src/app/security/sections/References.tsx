import Link from "next/link";

const internalLinks = [{ label: "Research paper", href: "/paper" }];

const externalLinks = [
  {
    label: "On-chain programs (Solana Explorer)",
    href: "https://explorer.solana.com/address/GZYwTp2ozeuRA5Gof9vs4ya961aANcJBdUzB7LN6q4b2?cluster=devnet",
  },
  {
    label: "AUDIT.md (public fix tracker)",
    href: "https://github.com/entros-protocol/entros.io/blob/main/AUDIT.md",
  },
  {
    label: "Public adversarial baseline tests",
    href: "https://github.com/entros-protocol/pulse-sdk/blob/main/test/pentest.test.ts",
  },
  {
    label: "GitHub organization",
    href: "https://github.com/entros-protocol",
  },
];

/**
 * References—compact link list. Each row has a small chevron and
 * an external arrow indicator on hover; rows are hairline-divided.
 */
export function References() {
  return (
    <section id="references" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Learn more<span className="text-cyan">.</span>
        </h2>

        <ul className="mt-12 border-t border-border">
          {internalLinks.map((ref) => (
            <li key={ref.label} className="border-b border-border">
              <Link
                href={ref.href}
                className="group flex items-center justify-between py-5 text-foreground/80 transition-colors hover:text-foreground"
              >
                <span className="text-base">{ref.label}</span>
                <span
                  aria-hidden="true"
                  className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40 transition-colors group-hover:text-cyan"
                >
                  Internal →
                </span>
              </Link>
            </li>
          ))}
          {externalLinks.map((ref) => (
            <li key={ref.label} className="border-b border-border">
              <a
                href={ref.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between py-5 text-foreground/80 transition-colors hover:text-foreground"
              >
                <span className="text-base">{ref.label}</span>
                <span
                  aria-hidden="true"
                  className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40 transition-colors group-hover:text-cyan"
                >
                  External ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
