import type { ReactNode } from "react";

/** A titled section of long-form text, as on /privacy and /manifesto. */
export function ProseSection({
  id,
  title,
  size = "base",
  children,
}: {
  id: string;
  title: string;
  size?: "base" | "lg";
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-border">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-20">
        <h2 className="font-display text-2xl font-normal tracking-tight text-foreground md:text-3xl">
          {title}
          <span className="text-cyan">.</span>
        </h2>
        <div
          className={
            size === "lg"
              ? "mt-6 space-y-5 text-base leading-relaxed text-foreground/75 md:text-lg"
              : "mt-6 space-y-4 text-base leading-relaxed text-foreground/70"
          }
        >
          {children}
        </div>
      </div>
    </section>
  );
}
