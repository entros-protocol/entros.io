"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const sections = [
  {
    heading: "Technology",
    items: [
      { label: "How It Works", href: "/technology" },
      { label: "Security Program", href: "/security" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    items: [
      { label: "Token", href: "/token" },
      { label: "Docs", href: "/docs" },
      { label: "Paper", href: "/paper" },
    ],
  },
  {
    heading: "Solutions",
    items: [
      { label: "Use Cases", href: "/solutions" },
      { label: "Agent Anchor", href: "/agents" },
      { label: "Governance", href: "/governance" },
      { label: "Realms Case Study", href: "/case-studies/realms" },
      { label: "Integrate", href: "/integrate" },
      { label: "Stats", href: "/stats" },
    ],
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-foreground"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute left-0 top-16 w-full border-b border-border bg-background">
          <div className="flex flex-col px-6 py-4">
            {sections.map((section, i) => (
              <div key={i}>
                {i > 0 && (
                  <hr className="my-2 border-border/50" />
                )}
                {section.heading && (
                  <span className="block pt-1 pb-1 text-xs font-mono uppercase tracking-widest text-muted/60">
                    {section.heading}
                  </span>
                )}
                <ul className="flex flex-col">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block py-2.5 text-base text-muted transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <hr className="my-3 border-border/50" />
            <div className="flex gap-4 pt-2 pb-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="inline-flex items-center rounded-full px-5 py-2.5 text-base font-medium text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/verify"
                onClick={() => setOpen(false)}
                className="inline-flex items-center rounded-full bg-foreground px-6 py-2.5 text-base font-medium text-background transition-colors hover:bg-foreground/90"
              >
                Verify
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
