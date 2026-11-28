import { StepNumber } from "@/components/ui/step-number";
import {
  campaigns,
  lastUpdated,
  onChainBurstNote,
  plannedCampaigns,
  type Campaign,
} from "@/data/security-metrics";
import { cn } from "@/lib/utils";

function Waves({ waves }: { waves: NonNullable<Campaign["waves"]> }) {
  return (
    <ol className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
      {waves.map((wave) => (
        <li key={wave.label}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="whitespace-nowrap text-sm text-muted">{wave.label}</span>
            <span className="font-display text-lg font-normal tabular-nums tracking-tight text-foreground">
              {wave.passRate}
            </span>
          </div>
          <div aria-hidden className="mt-2 h-1 bg-foreground/15">
            <div className="h-full bg-cyan forced-colors:bg-[Highlight]" style={{ width: `${wave.percent}%` }} />
          </div>
          <p className="mt-2 text-xs leading-snug text-muted">
            {wave.condition}
            <span> · {wave.attempts} runs</span>
          </p>
        </li>
      ))}
    </ol>
  );
}

export function LatestResults() {
  return (
    <section id="measurements">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Current measurements<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-[65ch] text-base leading-relaxed text-muted md:text-lg">
          A pass is an attempt that cleared every check enabled for its
          campaign. Each result covers its named attack, sample size and
          configuration.
        </p>

        <ol className="mt-14 divide-y divide-border">
          {campaigns.map((c) => (
            <li
              key={c.tier}
              className="grid grid-cols-1 gap-y-4 py-9 md:grid-cols-[6rem_1fr_13rem] md:gap-x-10 md:gap-y-5 md:py-11"
            >
              <StepNumber n={c.tier} className="pt-1" />

              <div className="min-w-0">
                <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                  {c.name}
                </h3>
                <p className="mt-2 max-w-[34rem] text-sm leading-relaxed text-muted md:text-base">
                  {c.description}
                </p>
                {c.waves && <Waves waves={c.waves} />}
                {c.note && (
                  <p className="mt-5 max-w-[34rem] text-sm leading-relaxed text-muted">
                    {c.note}
                  </p>
                )}
              </div>

              <div className="flex items-baseline gap-4 md:col-start-3 md:row-start-1 md:flex-col md:items-end md:gap-1 md:text-right">
                <p className="font-display text-4xl font-normal tabular-nums tracking-tight text-foreground md:text-5xl">
                  {c.passRate}
                </p>
                <div className="text-sm text-muted">
                  <p className="tabular-nums">{c.caption}</p>
                  {c.date && <p>{c.date}</p>}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-20">
          <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
            Still to run
          </h3>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {plannedCampaigns.map((p) => (
              <li
                key={p.tier}
                className="bg-surface p-6 forced-colors:border forced-colors:border-[CanvasText]"
              >
                <StepNumber n={p.tier} className="text-xl md:text-2xl" />
                <p className="mt-4 text-base text-foreground">{p.name}</p>
                <p
                  className={cn(
                    "mt-1 inline-flex items-center gap-2 text-sm",
                    p.active ? "text-cyan" : "text-muted",
                  )}
                >
                  {p.active && <span aria-hidden className="size-1.5 bg-cyan" />}
                  {p.status}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-3 text-sm leading-relaxed text-muted md:flex-row md:justify-between md:gap-12">
          <p className="max-w-[65ch]">{onChainBurstNote}</p>
          <p className="shrink-0">Last updated {lastUpdated}</p>
        </div>
      </div>
    </section>
  );
}
