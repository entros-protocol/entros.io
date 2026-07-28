"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { GithubMark } from "./github-mark";
import { NavThemeSquare } from "./nav-theme-square";

/**
 * The menu opens as a sheet under the nav strip, square-cornered and
 * shadowed like the other floating blocks. Links sit in two columns per
 * group so the whole tree fits without scrolling on a phone.
 */
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
  {
    heading: "Protocol",
    items: [
      { label: "Token", href: "/token" },
      { label: "Docs", href: "/docs" },
      { label: "Paper", href: "/paper" },
    ],
  },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="flex items-center md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-70"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          {/* Scrim. `-z-10` keeps it behind the nav strip while still
              inside the header's z-50 stacking context, so it dims the
              page without dimming the bar it hangs from. */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="pointer-events-auto fixed inset-0 -z-10 cursor-default bg-background/70 backdrop-blur-sm"
          />

          <div className="absolute inset-x-0 top-[66px] px-6">
            <div className="mx-auto max-h-[calc(100svh-84px)] max-w-7xl overflow-y-auto bg-foreground text-background shadow-[0_10px_34px_rgba(0,0,0,0.3)]">
              <div className="px-5 py-4">
                {sections.map((section, i) => (
                  <div
                    key={section.heading}
                    className={
                      i > 0
                        ? "mt-3 border-t border-background/10 pt-3"
                        : undefined
                    }
                  >
                    <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-background/40">
                      {section.heading}
                    </span>
                    {/* Two columns keeps the whole tree on one screen.
                        13px so the longest label ("Realms Case Study")
                        still clears a single line in a 120px column. */}
                    <ul className="mt-1 grid grid-cols-2 gap-x-3">
                      {section.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={close}
                            className="block py-1.5 text-[13px] font-medium text-background/75 transition-colors hover:text-background"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t border-background/15 px-5 py-4">
                <Link
                  href="/dashboard"
                  onClick={close}
                  className="
                    inline-flex h-10 flex-1 items-center justify-center
                    border border-background/25 px-2 text-[13px] font-medium
                    text-background transition-colors hover:bg-background/10
                  "
                >
                  Dashboard
                </Link>
                <Link
                  href="/verify"
                  onClick={close}
                  className="
                    inline-flex h-10 flex-1 items-center justify-center gap-1.5
                    bg-background px-2 text-[13px] font-medium text-foreground
                    transition-colors hover:bg-background/90
                  "
                >
                  Verify
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="https://github.com/entros-protocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Entros on GitHub"
                  className="
                    inline-flex h-10 w-10 shrink-0 items-center justify-center
                    border border-background/25 text-background
                    transition-colors hover:bg-background/10
                  "
                >
                  <GithubMark className="h-[17px] w-[17px]" />
                </a>
                <NavThemeSquare variant="sheet" />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
