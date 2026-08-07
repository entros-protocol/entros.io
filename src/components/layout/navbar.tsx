import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { mainNav } from "@/data/navigation";
import { MobileNav } from "./mobile-nav";
import { NavDropdown, type DropdownItem } from "./nav-dropdown";
import { NavbarWordmark } from "./navbar-wordmark";
import { NavThemeSquare } from "./nav-theme-square";
import { GithubMark } from "./github-mark";

const technologyDropdown: DropdownItem[] = [
  {
    label: "How It Works",
    href: "/technology",
    description:
      "From challenge to on-chain proof in twelve seconds.",
  },
  {
    label: "Security Program",
    href: "/security",
    description:
      "Continuous red team audit, transparent results.",
  },
  {
    label: "Roadmap",
    href: "/roadmap",
    description:
      "Where Entros is, and where it's headed.",
  },
];

const solutionsDropdown: DropdownItem[] = [
  {
    label: "Use Cases",
    href: "/solutions",
    description: "Where temporal proof changes the equation.",
  },
  {
    label: "Agent Anchor",
    href: "/agents",
    description: "Pseudonymous accountability for AI agents.",
  },
  {
    label: "Governance",
    href: "/governance",
    description: "Sybil-resistant DAO voting and DAO oversight.",
  },
  {
    label: "Realms Case Study",
    href: "/case-studies/realms",
    description: "Devnet voter-weight prototype and planned Realms client.",
  },
  {
    label: "Integrate",
    href: "/integrate",
    description: "Two modes, one SDK. Drop-in for any dApp.",
  },
  {
    label: "Stats",
    href: "/stats",
    description: "Live protocol metrics, on-chain truth.",
  },
];

export function Navbar() {
  return (
    /* Floating bar: a wordmark-and-links strip plus detached action
       blocks, each 46px square with its own shadow. */
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-2.5 md:pt-3">
      <div className="pointer-events-auto mx-auto flex max-w-7xl items-center gap-2.5 px-6 md:gap-3">
        {/* White strip: wordmark, then links pushed left to free right-hand room */}
        <div className="flex h-[46px] min-w-0 flex-1 items-center bg-foreground px-5 shadow-[0_10px_34px_rgba(0,0,0,0.3)]">
          <div className="shrink-0 text-background [&_a]:text-background [&_a]:text-2xl">
            <NavbarWordmark />
          </div>

          <ul className="ml-auto hidden items-center gap-8 navbar:flex">
            {mainNav.map((item) =>
              item.label === "Technology" ? (
                <li key={item.href} className="[&_button]:font-medium [&_button]:text-background [&_button:hover]:text-background/70">
                  <NavDropdown label="Technology" items={technologyDropdown} />
                </li>
              ) : item.label === "Solutions" ? (
                <li key={item.href} className="[&_button]:font-medium [&_button]:text-background [&_button:hover]:text-background/70">
                  <NavDropdown label="Solutions" items={solutionsDropdown} />
                </li>
              ) : (
                <li key={item.href}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className="text-sm font-medium leading-none text-background transition-colors hover:text-background/70"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-sm font-medium leading-none text-background transition-colors hover:text-background/70"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              )
            )}
          </ul>
        </div>

        {/* Detached square blocks */}
        <a
          href="https://github.com/entros-protocol"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Entros on GitHub"
          className="
            hidden h-[46px] w-[46px] items-center justify-center bg-foreground
            text-background shadow-[0_10px_34px_rgba(0,0,0,0.3)]
            transition-colors hover:bg-foreground/90 navbar:inline-flex
          "
        >
          <GithubMark className="h-[18px] w-[18px]" />
        </a>

        <Link
          href="/dashboard"
          className="
            hidden h-[46px] items-center bg-foreground px-4
            text-sm font-medium text-background
            shadow-[0_10px_34px_rgba(0,0,0,0.3)]
            transition-colors hover:bg-foreground/90 navbar:inline-flex
          "
        >
          Dashboard
        </Link>

        <Link
          href="/verify"
          className="
            hidden h-[46px] items-center gap-2 border border-foreground/25
            bg-background px-4 text-sm font-medium text-foreground
            shadow-[0_10px_34px_rgba(0,0,0,0.3)]
            transition-colors hover:bg-surface navbar:inline-flex
          "
        >
          Verify
          <ArrowRight className="h-4 w-4" />
        </Link>

        <NavThemeSquare />

        <div className="flex h-[46px] items-center bg-foreground px-1 shadow-[0_10px_34px_rgba(0,0,0,0.3)] navbar:hidden [&_button]:text-background">
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
