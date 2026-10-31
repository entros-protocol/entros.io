import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DriftWaveform } from "@/components/ui/drift-waveform";

/**
 * Homepage hero—copy stacked at the top of the viewport-height section,
 * the drift waveform filling the rest of it.
 */
export function HeroSection() {
  return (
    <section className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 pt-28 pb-0 md:pt-32 lg:min-h-[calc(100vh-4rem)] lg:pt-24">
      {/* Copy + CTAs */}
      <div className="relative z-10 flex max-w-2xl flex-col lg:max-w-5xl">
        {/* Each clause is bound with non-breaking spaces, so on narrow
            screens the headline breaks only at the comma. */}
        <h1 className="font-display text-[2rem] font-normal leading-[1.04] tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl lg:text-6xl">
          Prove&nbsp;you&rsquo;re&nbsp;human<span className="text-cyan">,</span>{" "}
          not&nbsp;who&nbsp;you&nbsp;are<span className="text-cyan">.</span>
        </h1>

        <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg lg:mt-6 lg:leading-7">
          Privacy-preserving proof of humanity for the AI era.
        </p>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:mt-8">
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

      {/* `-mx-6` cancels the section padding so the canvas spans rail to
          rail. `flex-1` hands the wave all the height left under the
          buttons. On laptops the copy's spacing is tightened to keep that
          height at 483 px on a 1512 x 855 screen, the size the head is
          drawn for. The head keeps one shape at every size: it lies on the
          section's floor, or, where the band is tall and narrow, near its
          top over the underlay picked here. */}
      <DriftWaveform className="-mx-6 mt-12 min-h-[220px] flex-1 lg:mt-5" underlay="reflection" />
    </section>
  );
}
