import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCases } from "@/data/use-cases";
import { getIcon } from "@/lib/icons";
import { buttonArrowClass, secondaryButtonClass } from "@/components/ui/button-styles";

export function UseCasesSection() {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Where a verified
          wallet matters<span className="text-cyan">.</span>
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {useCases.map((useCase) => {
            const Icon = getIcon(useCase.icon);
            return (
              <div
                key={useCase.title}
                className="bg-surface p-8 forced-colors:border forced-colors:border-[CanvasText]"
              >
                <Icon className="h-12 w-12 text-foreground/80" />
                <h3 className="mt-8 font-display text-xl font-medium tracking-tight text-foreground">
                  {useCase.title}
                </h3>
                <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-muted">
                  {useCase.solution}
                </p>
              </div>
            );
          })}
        </div>

        <Link href="/solutions" className={`mt-12 ${secondaryButtonClass}`}>
          <span className="[text-box:trim-both_cap_alphabetic]">
            See all use cases
          </span>
          <ArrowRight className={buttonArrowClass} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
