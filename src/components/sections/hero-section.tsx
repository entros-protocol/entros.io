import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DriftWaveform } from "@/components/ui/drift-waveform";

/**
 * Homepage hero—copy stacked at the top, the bounded-drift waveform
 * running edge to edge along the bottom. The wave bleeds the container
 * padding on both sides so it meets the skeleton rails, and `mt-auto`
 * pins it to the floor of the viewport-height section.
 */
export function HeroSection() {
  return (
    <section className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 pt-28 pb-0 md:pt-32 lg:min-h-[calc(100vh-4rem)] lg:pt-28">
      {/* Copy + CTAs */}
      <div className="relative z-10 flex max-w-2xl flex-col lg:max-w-5xl">
        {/* Each clause is bound with non-breaking spaces, so on narrow
            screens the headline breaks only at the comma. */}
        <h1 className="font-display text-[2rem] font-normal leading-[1.04] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
          Prove&nbsp;you&rsquo;re&nbsp;human<span className="text-cyan">,</span>{" "}
          not&nbsp;who&nbsp;you&nbsp;are<span className="text-cyan">.</span>
        </h1>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          {/* Primary CTA—solid filled, cyan label */}
          <Link
            href="/verify"
            className="
              group inline-flex items-center justify-center gap-2
              bg-foreground px-6 py-3
              text-sm font-medium text-background
              transition-colors hover:bg-foreground/90
            "
          >
            Try the Demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

          {/* Secondary CTA—outlined, neutral label */}
          <Link
            href="/integrate"
            className="
              group inline-flex items-center justify-center gap-2
              border border-foreground/20 px-6 py-3
              text-sm font-medium text-foreground
              transition-colors hover:border-foreground/40 hover:bg-foreground/5
            "
          >
            Build with Entros
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Bounded-drift waveform. `-mx-6` cancels the section padding so the
          wave reaches the rails on both sides; `mt-auto` drops it to the
          bottom edge, where its gradient dissolves into the section border
          below. Height is viewport-relative so the copy above always keeps
          its air on short screens. Growing the phone step past this only
          pushes the tail below the fold — the narrow geometry closes the
          gap under the buttons by raising its own baseline instead. */}
      <DriftWaveform
        idPrefix="hero"
        className="-mx-6 mt-auto h-[42svh] min-h-[240px] md:h-[44svh] lg:h-[46svh]"
      />
    </section>
  );
}
