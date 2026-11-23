"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { GithubMark } from "./github-mark";

/**
 * The menu opens as a surface-stepped square sheet under the nav strip.
 * Links sit in two columns per group so the tree fits without scrolling on a phone.
 */
const sections = [
  {
    heading: "Technology",
    items: [
      { label: "How It Works", href: "/technology" },
      { label: "Security Program", href: "/security" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Paper (2026)", href: "/paper" },
      { label: "Paired Liveness Lab", href: "/lab/paired-liveness" },
    ],
  },
  {
    heading: "Solutions",
    items: [
      { label: "Use Cases", href: "/solutions" },
      { label: "Agent Permits", href: "/agents" },
      { label: "Integrate", href: "/integrate" },
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
    <div className="flex items-center navbar:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-[46px] w-[46px] items-center justify-center transition-opacity hover:opacity-70"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          {/* Dimmed backdrop behind the floating bar stacking context. */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="pointer-events-auto fixed inset-0 -z-10 cursor-default bg-background/80"
          />

          <div className="absolute inset-x-0 top-[66px] px-6">
            <div className="mx-auto max-h-[calc(100svh-84px)] max-w-7xl overflow-y-auto bg-surface text-foreground">
              <div className="px-5 py-5">
                {sections.map((section, i) => (
                  <div key={section.heading} className={i > 0 ? "mt-5" : undefined}>
                    <span className="block text-xs font-medium text-muted">
                      {section.heading}
                    </span>
                    <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      {section.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={close}
                            className="block py-1.5 text-sm font-medium text-foreground transition-colors hover:text-muted"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 px-5 pt-2 pb-5">
                <Link
                  href="/docs"
                  onClick={close}
                  className="
                    inline-flex h-10 items-center justify-center bg-background
                    px-4 text-sm font-medium leading-4 text-foreground
                    transition-colors hover:bg-surface-hover
                  "
                >
                  Docs
                </Link>
                <Link
                  href="/docs/quickstart/mcp-approval"
                  onClick={close}
                  className="
                    inline-flex h-10 flex-1 items-center justify-center gap-1.5
                    bg-foreground px-3 text-sm font-medium leading-4 text-background
                    transition-colors hover:bg-foreground/90
                  "
                >
                  MCP Quickstart
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
                <a
                  href="https://github.com/entros-protocol"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Entros on GitHub"
                  className="
                    inline-flex h-10 w-10 shrink-0 items-center justify-center
                    bg-background text-foreground transition-colors
                    hover:bg-surface-hover
                  "
                >
                  <GithubMark className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
