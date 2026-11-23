"use client";

import { useEffect, useRef, useState } from "react";
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
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="flex items-center navbar:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-[46px] w-[46px] items-center justify-center transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-70 motion-reduce:transition-none forced-colors:border forced-colors:border-[ButtonText]"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          {/* Dimmed backdrop behind the floating bar stacking context. */}
          <div
            aria-hidden="true"
            onClick={close}
            className="pointer-events-auto fixed inset-0 -z-10 cursor-default bg-background/80"
          />

          <div className="absolute inset-x-0 top-[66px] px-6">
            <div className="mx-auto max-h-[calc(100svh-84px)] max-w-7xl overflow-y-auto bg-surface text-foreground forced-colors:border forced-colors:border-[CanvasText]">
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
                            className="block py-1.5 text-sm font-medium text-foreground transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-muted motion-reduce:transition-none"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-2 px-5 pt-2 pb-5 sm:flex-row sm:items-center">
                <Link
                  href="/docs/quickstart/mcp-approval"
                  onClick={close}
                  className="
                    inline-flex min-h-11 w-full items-center justify-center gap-2
                    bg-foreground px-4 text-sm font-medium leading-none text-background
                    transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]
                    hover:bg-foreground/90 motion-reduce:transition-none
                    forced-colors:border forced-colors:border-[ButtonText]
                    sm:order-2 sm:w-auto sm:flex-1
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
                <div className="flex items-center gap-2 sm:contents">
                  <Link
                    href="/docs"
                    onClick={close}
                    className="
                      inline-flex min-h-11 flex-1 items-center justify-center
                      bg-background px-4 text-sm font-medium leading-none text-foreground
                      transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]
                      hover:bg-surface-hover motion-reduce:transition-none
                      forced-colors:border forced-colors:border-[ButtonText]
                      sm:order-1 sm:flex-none
                    "
                  >
                    <span className="[text-box:trim-both_cap_alphabetic]">
                      Docs
                    </span>
                  </Link>
                  <a
                    href="https://github.com/entros-protocol"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Entros on GitHub"
                    className="
                      inline-flex h-11 w-11 shrink-0 items-center justify-center
                      bg-background text-foreground transition-colors duration-150
                      ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-surface-hover
                      motion-reduce:transition-none
                      forced-colors:border forced-colors:border-[ButtonText]
                      sm:order-3
                    "
                  >
                    <GithubMark className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
