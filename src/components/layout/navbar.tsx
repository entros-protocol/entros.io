import Link from "next/link";
import { mainNav } from "@/data/navigation";
import { MobileNav } from "./mobile-nav";
import { NavDropdown, type DropdownItem } from "./nav-dropdown";
import { NavbarWordmark } from "./navbar-wordmark";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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
    label: "Mainnet Roadmap",
    href: "/roadmap",
    description:
      "What gates the flip from devnet to mainnet.",
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
    description: "Verified-human governance on Realms, live on devnet.",
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
    <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
        {/* Wordmark—client component, runs a one-shot hash-shuffle reveal
            on first mount when entering on the home route. */}
        <NavbarWordmark />

        {/* Center navigation */}
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {mainNav.map((item) =>
            item.label === "Technology" ? (
              <li key={item.href}>
                <NavDropdown label="Technology" items={technologyDropdown} />
              </li>
            ) : item.label === "Solutions" ? (
              <li key={item.href}>
                <NavDropdown label="Solutions" items={solutionsDropdown} />
              </li>
            ) : (
              <li key={item.href}>
                {item.external ? (
                  <a
                    href={item.href}
                    className="py-2 text-sm leading-none text-foreground/70 transition-colors duration-200 hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="py-2 text-sm leading-none text-foreground/70 transition-colors duration-200 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          )}
        </ul>

        {/* Right-side actions: ghost Dashboard + filled-primary Verify. */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard"
            className="
              hidden md:inline-flex items-center
              rounded-full px-4 py-1.5 text-sm font-medium
              text-foreground/70
              transition-colors duration-200
              hover:bg-foreground/5 hover:text-foreground
            "
          >
            Dashboard
          </Link>
          <Link
            href="/verify"
            className="
              hidden md:inline-flex items-center
              rounded-full bg-foreground px-4 py-1.5
              text-sm font-medium text-background
              transition-colors duration-200
              hover:bg-foreground/90
            "
          >
            Verify
          </Link>
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
