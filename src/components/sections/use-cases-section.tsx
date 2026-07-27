import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCases } from "@/data/use-cases";
import { getIcon } from "@/lib/icons";

/**
 * Use Cases—flat hairline-divided grid of three cells.
 */
export function UseCasesSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // USE CASES
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Where temporal proof
          changes the equation<span className="text-cyan">.</span>
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-3">
          {useCases.map((useCase) => {
            const Icon = getIcon(useCase.icon);
            return (
              <div key={useCase.title} className="bg-background p-8">
                <Icon className="h-6 w-6 text-cyan" strokeWidth={1.5} />
                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {useCase.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/60">
                  {useCase.solution}
                </p>
              </div>
            );
          })}
        </div>

        <Link
          href="/solutions"
          className="
            group mt-12 inline-flex items-center gap-2
            rounded-full border border-foreground/20 px-5 py-2.5
            text-sm text-foreground
            transition-colors hover:border-foreground/40 hover:bg-foreground/5
          "
        >
          See all use cases
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
