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
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Security Program",
  description:
    "Scoped adversarial campaigns against the verification pipeline, with attack classes, denominators, and observed results.",
  path: "/security",
});

type RungState = "published" | "open" | "planned";

const ladder: { tier: string; state: RungState }[] = [
  { tier: "T1", state: "published" },
  { tier: "T2", state: "published" },
  { tier: "T3", state: "published" },
  { tier: "T4a", state: "published" },
  { tier: "T4b", state: "published" },
  { tier: "T5", state: "open" },
  { tier: "T6", state: "planned" },
  { tier: "T7", state: "planned" },
  { tier: "T8", state: "planned" },
];

const STATE_LABEL: Record<RungState, string> = {
  published: "result published",
  open: "testing now",
  planned: "planned",
};

export default function Security() {
  return (
    <>
      {/* Hero: copy left, the published attempt count and the campaign
          ladder right. */}
      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-32 pb-20 md:pt-40 md:pb-28 lg:min-h-[calc(100svh-4rem)] lg:grid-cols-9 lg:content-center lg:items-center lg:gap-16 lg:pt-24 lg:pb-24">
          <div className="lg:col-span-5">
            <h1 className="font-display text-5xl font-normal leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
              Continuous adversarial
              <br />
              testing<span className="text-cyan">.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
              Each published campaign names its attack class, attempt count,
              and observed pass rate.
            </p>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="#measurements"
                className="
                  group inline-flex items-center justify-center gap-2
                  bg-foreground px-6 py-3
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
                  border border-foreground/20 px-6 py-3
                  text-sm font-medium text-foreground
                  transition-colors hover:border-foreground/40 hover:bg-foreground/5
                "
              >
                Read the paper
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Campaign ladder: one square per attack tier, filled where a
              campaign result is published, outlined where testing is open,
              hairline where it is planned. */}
          <div className="lg:col-span-4">
            <p className="font-display text-6xl font-normal tracking-[-0.02em] text-foreground md:text-7xl">
              17,000<span className="text-cyan">+</span>
            </p>
            <p className="mt-3 text-sm text-foreground/60">
              published attack attempts, T1 to T4b
            </p>

            <ol className="mt-12 grid grid-cols-9 gap-1.5 sm:gap-2">
              {ladder.map((rung) => (
                <li key={rung.tier} className="flex flex-col items-center gap-3">
                  <span
                    aria-hidden
                    className={cn(
                      "relative block aspect-square w-full",
                      rung.state === "published" && "bg-cyan",
                      rung.state === "open" && "border border-cyan",
                      rung.state === "planned" && "border border-foreground/20",
                    )}
                  >
                    {rung.state === "open" && (
                      <span className="absolute inset-[30%] animate-pulse bg-cyan/60 motion-reduce:animate-none" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "font-display text-xs tabular-nums sm:text-sm",
                      rung.state === "planned" ? "text-foreground/35" : "text-foreground/70",
                    )}
                  >
                    {rung.tier}
                  </span>
                  <span className="sr-only">{STATE_LABEL[rung.state]}</span>
                </li>
              ))}
            </ol>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-foreground/55">
              <li className="inline-flex items-center gap-2">
                <span aria-hidden className="size-2.5 bg-cyan" />
                Published
              </li>
              <li className="inline-flex items-center gap-2">
                <span aria-hidden className="size-2.5 border border-cyan" />
                Testing now
              </li>
              <li className="inline-flex items-center gap-2">
                <span aria-hidden className="size-2.5 border border-foreground/25" />
                Planned
              </li>
            </ul>
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
          <h2 className="font-display text-4xl font-normal tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Built to keep pace with AI<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/paper"
              className="
                group inline-flex items-center justify-center gap-2
                bg-foreground px-6 py-3
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
                border border-foreground/20 px-6 py-3
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
