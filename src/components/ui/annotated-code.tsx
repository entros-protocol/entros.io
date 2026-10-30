"use client";

import { useState } from "react";
import { tokenizeLine } from "@/components/ui/code-block";
import { cn } from "@/lib/utils";

interface AnnotatedCodeProps {
  code: string;
  /** Notes keyed by zero-based line index. */
  notes: Record<number, string>;
}

/**
 * Code with its non-blank lines numbered in the left margin and short notes
 * on hairlines to the right. Pointing at a note or a line lights up the
 * pair. The block keeps the plain code-block look; only the margins carry
 * the extra reading.
 */
export function AnnotatedCode({ code, notes }: AnnotatedCodeProps) {
  const [active, setActive] = useState<number | null>(null);
  const lines = code.split("\n");
  let count = 0;
  // Margin numbers and notes stay out of a copied selection of the code.
  const numbers = lines.map((line) => (line === "" ? null : ++count));
  const last = lines.length - 1;

  return (
    <figure
      className="grid grid-cols-[1fr_auto_1fr] font-mono text-[15px] leading-relaxed"
      onMouseLeave={() => setActive(null)}
    >
      {lines.map((line, index) => {
        const note = notes[index];
        const on = active === index;
        const point = () => setActive(note ? index : null);
        return (
          <div key={index} className="contents">
            <span
              aria-hidden
              className={cn(
                "flex select-none items-center justify-end pr-5 text-xs tabular-nums transition-colors duration-150",
                index === 0 && "pt-7",
                index === last && "pb-7",
                on ? "text-cyan" : "text-foreground/30",
              )}
            >
              {numbers[index] ?? ""}
            </span>
            <div
              onMouseEnter={point}
              className={cn(
                "border-x border-panel-line bg-panel px-8 text-foreground/80 transition-colors duration-150",
                index === 0 && "border-t pt-7",
                index === last && "border-b pb-7",
                on && "bg-[color-mix(in_oklab,var(--color-panel),var(--color-cyan)_12%)]",
              )}
            >
              <div className="whitespace-pre">{tokenizeLine(line)}</div>
            </div>
            <div
              onMouseEnter={point}
              className={cn("flex select-none items-center", index === 0 && "pt-7", index === last && "pb-7")}
            >
              {note && (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      "h-px w-12 origin-left transition-[transform,background-color] duration-200 ease-out",
                      on ? "scale-x-150 bg-cyan" : "bg-foreground/15",
                    )}
                  />
                  <span
                    className={cn(
                      "ml-8 whitespace-nowrap font-sans text-sm transition-colors duration-150",
                      on ? "text-foreground" : "text-foreground/50",
                    )}
                  >
                    {note}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}
    </figure>
  );
}
