"use client";

import { Timeline } from "@/components/ui/timeline";
import { StepNumber } from "@/components/ui/step-number";
import { verificationSteps } from "@/data/verification-steps";
import { getIcon } from "@/lib/icons";

export function VerificationTimelineSection() {
  const timelineData = verificationSteps.map((step, i) => {
    const Icon = getIcon(step.icon);
    return {
      title: (
        <span className="flex items-center gap-4">
          <StepNumber n={i + 1} className="text-[1em] md:text-[1em]" />
          <span>{step.title}</span>
          <Icon className="h-6 w-6 shrink-0 text-foreground/60 md:h-7 md:w-7" />
        </span>
      ),
      content: (
        <div>
          <p className="text-lg font-medium text-foreground md:text-xl">
            {step.description}
          </p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground/60 md:text-base md:leading-relaxed">
            {step.detail}
          </p>
        </div>
      ),
    };
  });

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 pt-12 pb-24 md:pt-16 md:pb-32">
        <div className="text-center">
          <h2 className="mx-auto max-w-4xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            Three rounds<span className="text-cyan">.</span> The rest is
            automatic<span className="text-cyan">.</span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
            Each round asks for one spoken word and one traced path.
          </p>
        </div>

        <div className="mt-16">
          <Timeline data={timelineData} />
        </div>
      </div>
    </section>
  );
}
