"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: string;
  href: string;
  description?: string;
}

const OPEN_EVENT = "entros:nav-dropdown-open";

/**
 * Hover/click navigation dropdown.
 *
 * - 340px panel; each row carries a label + optional one-line description.
 * - Hover-triggered with a 150ms delay before close (forgiving when
 *   the cursor briefly leaves the panel boundary).
 * - Click on the trigger toggles open (touch / a11y).
 * - Escape closes; clicks outside close.
 * - Animated entry: opacity + 4px slide-in.
 * - Sibling coordination: when one dropdown opens, it broadcasts an
 *   event so other dropdowns close instantly. Without this the 150ms
 *   close delay overlaps with the new dropdown's open animation when
 *   the cursor moves quickly between triggers.
 */
export function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: DropdownItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Listen for siblings opening; close instantly if it isn't us.
  useEffect(() => {
    function handleSiblingOpen(e: Event) {
      const detail = (e as CustomEvent<{ label: string }>).detail;
      if (detail?.label !== label) {
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        setOpen(false);
      }
    }
    document.addEventListener(OPEN_EVENT, handleSiblingOpen);
    return () => document.removeEventListener(OPEN_EVENT, handleSiblingOpen);
  }, [label]);

  const announceOpen = useCallback(() => {
    document.dispatchEvent(
      new CustomEvent(OPEN_EVENT, { detail: { label } })
    );
  }, [label]);

  const handleEnter = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setOpen(true);
    announceOpen();
  }, [announceOpen]);

  const handleLeave = useCallback(() => {
    leaveTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          setOpen((prev) => {
            const next = !prev;
            if (next) announceOpen();
            return next;
          });
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => {
              const next = !prev;
              if (next) announceOpen();
              return next;
            });
          }
          if (e.key === "Escape") setOpen(false);
        }}
        className="inline-flex items-center gap-1 py-2 text-sm text-foreground/70 transition-colors duration-200 hover:text-foreground"
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-foreground/40 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Panel: a small invisible bridge above the panel keeps hover
          alive when the cursor crosses the gap from trigger to panel.
          Open uses a short opacity-only fade (75ms, no slide) so it
          appears almost in place; close uses duration-0 so a
          sibling-triggered handoff snaps away the same frame the next
          panel begins opening—no overlapping animation. */}
      <div
        className={cn(
          "absolute left-1/2 top-full -translate-x-1/2 pt-3 transition-opacity",
          open
            ? "pointer-events-auto opacity-100 duration-75"
            : "pointer-events-none opacity-0 duration-0"
        )}
      >
        <div className="w-[340px] border border-border bg-surface p-1.5 shadow-xl shadow-black/[0.06] dark:shadow-2xl dark:shadow-black/30">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="group block px-3 py-2.5 transition-colors hover:bg-foreground/5"
            >
              <div className="text-sm font-medium text-foreground transition-colors group-hover:text-foreground">
                {item.label}
              </div>
              {item.description && (
                <div className="mt-0.5 text-xs leading-relaxed text-foreground/55">
                  {item.description}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
