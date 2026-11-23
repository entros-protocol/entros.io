import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { mainNav } from "@/data/navigation";
import { MobileNav } from "./mobile-nav";
import { NavDropdown, type DropdownItem } from "./nav-dropdown";
import { NavbarWordmark } from "./navbar-wordmark";
import { GithubMark } from "./github-mark";

const technologyDropdown: DropdownItem[] = [
  {
    label: "How It Works",
    href: "/technology",
    description:
      "Architecture, acoustic anti-spoofing, and privacy boundaries.",
  },
  {
    label: "Security Program",
    href: "/security",
    description:
      "Scoped adversarial testing with published results.",
  },
  {
    label: "Roadmap",
    href: "/roadmap",
    description:
      "Active voice defense, agent authorization, and devnet status.",
  },
  {
    label: "Paper (2026)",
    href: "/paper",
    description:
      "Archived 2026 paired-liveness research paper.",
  },
  {
    label: "Paired Liveness Lab",
    href: "/lab/paired-liveness",
    description:
      "Secondary browser paired-liveness devnet prototype.",
  },
];

const solutionsDropdown: DropdownItem[] = [
  {
    label: "Use Cases",
    href: "/solutions",
    description:
      "Human-presence verification for voice and agent workflows.",
  },
  {
    label: "Agent Permits",
    href: "/agents",
    description:
      "Single-use cryptographic permits bound to exact actions.",
  },
  {
    label: "Integrate",
    href: "/integrate",
    description:
      "Pure-MIT verification SDKs and developer guides.",
  },
];

export function Navbar() {
  return (
    /* Floating bar: surface-stepped link strip plus detached 46px square
       controls, with one high-contrast solid primary action. */
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-2.5 md:pt-3">
      <div className="pointer-events-auto mx-auto flex max-w-7xl items-center gap-2.5 px-6 md:gap-3">
        <div className="flex h-[46px] min-w-0 flex-1 items-center bg-surface px-5 text-foreground forced-colors:border forced-colors:border-[CanvasText]">
          <div className="shrink-0 [&_a]:text-2xl">
            <NavbarWordmark />
          </div>

          <ul className="ml-auto hidden items-center gap-8 navbar:flex">
            {mainNav.map((item) =>
              item.label === "Technology" ? (
                <li
                  key={item.href}
                  className="[&_button]:font-medium [&_button]:text-foreground [&_button:hover]:text-foreground/75"
                >
                  <NavDropdown label="Technology" items={technologyDropdown} />
                </li>
              ) : item.label === "Solutions" ? (
                <li
                  key={item.href}
                  className="[&_button]:font-medium [&_button]:text-foreground [&_button:hover]:text-foreground/75"
                >
                  <NavDropdown label="Solutions" items={solutionsDropdown} />
                </li>
              ) : (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className="inline-flex h-[46px] items-center text-sm font-medium leading-none text-foreground transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground/75 motion-reduce:transition-none"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="[text-box:trim-both_cap_alphabetic]">
                        {item.label}
                      </span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-flex h-[46px] items-center text-sm font-medium leading-none text-foreground transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-foreground/75 motion-reduce:transition-none"
                    >
                      <span className="[text-box:trim-both_cap_alphabetic]">
                        {item.label}
                      </span>
                    </Link>
                  )}
                </li>
              )
            )}
          </ul>
        </div>

        <a
          href="https://github.com/entros-protocol"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Entros on GitHub"
          className="
            hidden h-[46px] w-[46px] items-center justify-center bg-surface
            text-foreground transition-colors duration-150
            ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-hover
            motion-reduce:transition-none
            forced-colors:border forced-colors:border-[ButtonText]
            navbar:inline-flex
          "
        >
          <GithubMark className="h-[18px] w-[18px]" />
        </a>

        <Link
          href="/docs"
          className="
            hidden h-[46px] items-center bg-surface px-4
            text-sm font-medium leading-none text-foreground
            transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]
            hover:bg-surface-hover motion-reduce:transition-none
            forced-colors:border forced-colors:border-[ButtonText]
            navbar:inline-flex
          "
        >
          <span className="[text-box:trim-both_cap_alphabetic]">Docs</span>
        </Link>

        <Link
          href="/docs/quickstart/mcp-approval"
          className="
            hidden h-[46px] items-center gap-2 bg-foreground px-4
            text-sm font-medium leading-none text-background
            transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]
            hover:bg-foreground/90 motion-reduce:transition-none
            forced-colors:border forced-colors:border-[ButtonText]
            navbar:inline-flex
          "
        >
          <span className="[text-box:trim-both_cap_alphabetic]">
            MCP Quickstart
          </span>
          <ArrowRight
            className="optical-icon-nudge h-4 w-4 shrink-0"
            aria-hidden="true"
          />
        </Link>

        <div className="flex h-[46px] items-center bg-surface text-foreground navbar:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
