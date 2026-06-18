import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThreatModel } from "./sections/ThreatModel";
import { DefenseLayers } from "./sections/DefenseLayers";
import { RedTeamProgram } from "./sections/RedTeamProgram";
import { LatestResults } from "./sections/LatestResults";
import { OpenSourcePosture } from "./sections/OpenSourcePosture";
import { ResponsibleDisclosure } from "./sections/ResponsibleDisclosure";
import { References } from "./sections/References";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Security Program",
  description:
    "Continuous adversarial testing against state-level synthesis attacks. Methodology public, defenses layered, results measured.",
  path: "/security",
});

const heroStats = [
  { value: "17,000+", label: "Adversarial attempts" },
  { value: "0%", label: "T1–T4 production pass rate" },
  { value: "4 tiers", label: "Closed (T1–T4)" },
  { value: "Live", label: "Continuous testing" },
];

export default function Security() {
  return (
    <>
      {/* Hero—asymmetric: text left (3/5), key-results stat panel right
          (2/5). Distinct from the home (split with animation) and the
          technology page (centered with diagram). The stats panel is the
          visual element—numbers up front, no decorative art. */}
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-32 pb-20 md:pt-40 md:pb-28 lg:grid-cols-9 lg:items-center lg:gap-10">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // SECURITY PROGRAM
            </span>

            <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
              Continuous adversarial
              <br />
              testing<span className="text-cyan">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
              Methodology public, defenses layered, results measured.
              Every attack class against the verification pipeline,
              with attempt counts and pass rates rounded to prevent
              threshold inference.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="#measurements"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full bg-foreground px-6 py-3
                  text-sm font-medium text-background
                  transition-colors hover:bg-foreground/90
                "
              >
                See latest measurements
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/paper"
                className="
                  group inline-flex items-center justify-center gap-2
                  rounded-full border border-foreground/20 px-6 py-3
                  text-sm font-medium text-foreground
                  transition-colors hover:border-foreground/40 hover:bg-foreground/5
                "
              >
                Read the paper
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Stat panel—2×2 hairline grid, doubles as the hero's visual element. */}
          <div className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-px border border-border bg-border">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col justify-end bg-background p-7 md:p-10"
                >
                  <div className="font-display text-4xl font-medium tracking-tight text-foreground md:text-5xl lg:text-6xl">
                    {stat.value}
                  </div>
                  <p className="mt-3 font-mono text-xs uppercase tracking-[0.15em] text-foreground/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ThreatModel />
      <DefenseLayers />
      <RedTeamProgram />
      <LatestResults />
      <OpenSourcePosture />
      <ResponsibleDisclosure />
      <References />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Methodology public.
            <br />
            Defenses private<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/paper"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Read the paper
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/technology"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              How it works
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
