import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DriftWaveform } from "@/components/ui/drift-waveform";
import {
  buttonArrowClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/button-styles";

/**
 * Homepage hero: copy stacked at the top of the viewport-height section,
 * the drift waveform filling the rest of it.
 */
export function HeroSection() {
  return (
    <section className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 pt-28 pb-0 md:pt-32 lg:min-h-[calc(100svh-4rem)] lg:pt-24">
      {/* Copy + CTAs */}
      <div className="relative z-10 flex max-w-2xl flex-col lg:max-w-5xl">
        <h1 className="font-display text-[clamp(1.75rem,6.5vw,3.75rem)] font-normal leading-[1.04] tracking-[-0.02em] text-foreground text-balance">
          Prove you&rsquo;re human<span className="text-cyan">,</span>{" "}
          not who you are<span className="text-cyan">.</span>
        </h1>

        <p className="mt-7 max-w-xl text-balance text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg lg:mt-6 lg:leading-7">
          Privacy-preserving proof of humanity for the AI era.
        </p>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center lg:mt-8">
          <Link href="/verify" className={primaryButtonClass}>
            <span className="[text-box:trim-both_cap_alphabetic]">Try the Demo</span>
            <ArrowRight className={buttonArrowClass} aria-hidden="true" />
          </Link>

          <Link href="/integrate" className={secondaryButtonClass}>
            <span className="[text-box:trim-both_cap_alphabetic]">Build with Entros</span>
            <ArrowRight className={buttonArrowClass} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* `-mx-6` cancels the section padding so the canvas spans rail to
          rail. `flex-1` hands the wave all the height left under the
          buttons. On laptops the copy's spacing is tightened to keep that
          height at 483 px on a 1512 x 855 screen, the size the head is
          drawn for. The head keeps one shape at every size: it lies on the
          section's floor, or, where the band is tall and narrow, near its
          top, over the underlay picked here. Under a lying head the
          reflection hangs past the floor into the next section, without
          taking any of its space. */}
      <DriftWaveform className="-mx-6 mt-12 min-h-[220px] flex-1 lg:mt-5" underlay="reflection" />
    </section>
  );
}
