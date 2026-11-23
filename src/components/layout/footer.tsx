import Link from "next/link";
import type { ReactNode } from "react";
import { GITHUB_URL, TWITTER_URL } from "@/lib/site";
import { EntrosMark } from "./entros-mark";
import { GithubMark } from "./github-mark";
import { NavThemeSquare } from "./nav-theme-square";
import { DiscordMark, XMark } from "./social-marks";

const DISCORD_URL = "https://discord.com/invite/RaaXjBPWz7";

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <ul className="mt-4 flex flex-col gap-3">{children}</ul>
    </div>
  );
}

const SOCIAL = [
  { label: "Entros on X", href: TWITTER_URL, Mark: XMark, size: "h-4 w-4" },
  { label: "Entros on Discord", href: DISCORD_URL, Mark: DiscordMark, size: "h-[18px] w-[18px]" },
  { label: "Entros on GitHub", href: GITHUB_URL, Mark: GithubMark, size: "h-4 w-4" },
];

export function Footer() {
  return (
    <footer className="bg-surface">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 md:pt-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Link
              href="/"
              aria-label="Entros home"
              style={{
                fontFamily:
                  "var(--font-wordmark), 'JetBrains Mono', ui-monospace, monospace",
              }}
              className="inline-flex items-baseline text-2xl tracking-tight text-foreground"
            >
              {/* The navbar's lockup and type size, at which the mark's
                  grid lands on whole pixels. */}
              <EntrosMark className="mr-1.5 size-[0.75em] shrink-0" />
              <span aria-hidden>Entros</span>
            </Link>
            <p className="mt-3 text-sm text-muted">
              Private human verification
            </p>

            <ul className="mt-8 flex items-center gap-2">
              {SOCIAL.map(({ label, href, Mark, size }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="
                      inline-flex h-10 w-10 items-center justify-center
                      bg-background text-muted transition-colors
                      hover:bg-surface-hover hover:text-foreground
                    "
                  >
                    <Mark className={size} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-10 lg:col-span-7 lg:col-start-6"
          >
            <FooterColumn title="Product">
              <FooterLink href="/solutions">Solutions</FooterLink>
              <FooterLink href="/agents">Agent Permits</FooterLink>
              <FooterLink href="/technology">Technology</FooterLink>
              <FooterLink href="/security">Security</FooterLink>
            </FooterColumn>
            <FooterColumn title="Build">
              <FooterLink href="/docs">Docs</FooterLink>
              <FooterLink href="/integrate">Integrate</FooterLink>
              <FooterLink href="/compare">Compare</FooterLink>
              <FooterLink href="/lab/paired-liveness">Paired Liveness Lab</FooterLink>
            </FooterColumn>
            <FooterColumn title="About">
              <FooterLink href="/manifesto">Manifesto</FooterLink>
              <FooterLink href="/paper">Paper</FooterLink>
              <FooterLink href="/roadmap">Roadmap</FooterLink>
              <FooterLink href="/token">Token Record</FooterLink>
              <FooterLink href="/press">Press</FooterLink>
              <FooterLink href="/privacy">Privacy</FooterLink>
            </FooterColumn>
          </nav>
        </div>

        <div className="mt-16 flex items-center justify-between gap-4 pt-2 pb-2">
          <p className="text-xs text-muted">&copy; 2026 Entros Protocol</p>
          <NavThemeSquare variant="footer" />
        </div>
      </div>
    </footer>
  );
}
