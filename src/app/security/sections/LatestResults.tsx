import { Fragment } from "react";
import {
  AsciiFrontierScene,
  AsciiSolvedScene,
} from "@/components/ui/ascii-scenes";
import {
  campaignResults,
  lastUpdated,
  t4aNote,
  onChainBurstNote,
} from "@/data/security-metrics";

/**
 * Latest Results—the centerpiece data moment of the page. ASCII
 * scenes flanking the campaign table: monospace numbers, hairline
 * rows, cyan tier labels.
 */
export function LatestResults() {
  return (
    <section id="measurements" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Current measurements<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Pass rate is the share of attempts that satisfied the checks
          enabled for that row. Each result applies to its named generator,
          sample size, and configuration.
        </p>

        {/* Mobile-only: SOLVED scene slotted directly below the
            subheading. On desktop the same scene lives in the
            side-by-side grid below. */}
        <div className="mt-10 lg:hidden">
          <AsciiSolvedScene aspect="4/5" />
        </div>

        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-3 lg:items-stretch lg:gap-16">
          {/* Desktop-only: stacked scene column. Stretches to match the
              right column's full height (table + footer). lg:pt offsets
              past the thead so SLOT 1 starts at the first data row;
              lg:pb offsets past the "Last updated" footer so SLOT 2
              ends at the last data row. */}
          <div className="hidden lg:col-span-1 lg:flex lg:flex-col lg:gap-8 lg:pt-[3.25rem] lg:pb-[2.5rem]">
            <AsciiSolvedScene fill className="flex-1" />
            <AsciiFrontierScene fill className="flex-1" />
          </div>

          <div className="lg:col-span-2">
            <div tabIndex={0} className="overflow-x-auto border-y border-border">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th
                      scope="col"
                      className="text-sm font-medium py-4 pl-2 pr-4 text-left text-foreground/65"
                    >
                      Tier
                    </th>
                    <th
                      scope="col"
                      className="text-sm font-medium py-4 pr-4 text-left text-foreground/65"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="text-sm font-medium py-4 pr-4 text-right text-foreground/65"
                    >
                      Attempts
                    </th>
                    <th
                      scope="col"
                      className="text-sm font-medium py-4 pr-4 text-right text-foreground/65"
                    >
                      Pass
                    </th>
                    <th
                      scope="col"
                      className="text-sm font-medium py-4 pr-2 text-left text-foreground/65"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaignResults.map((row) => (
                    <Fragment key={row.tier}>
                      <tr className="border-b border-border last:border-b-0">
                        <td className="whitespace-nowrap py-3 pl-2 pr-4 font-mono text-cyan">
                          {row.tier}
                        </td>
                        <td className="py-3 pr-4 text-foreground/80">
                          {row.description}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-foreground/70">
                          {row.attempts}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-foreground">
                          {row.passRate}
                        </td>
                        <td className="py-3 pr-2 text-foreground/55">
                          {row.status}
                        </td>
                      </tr>
                      {row.note && (
                        <tr className="border-b border-border/40">
                          <td colSpan={5} className="py-3 pr-4 pl-2 text-xs leading-relaxed text-foreground/50">
                            {row.note}
                          </td>
                        </tr>
                      )}
                      {/* Mobile-only: FRONTIER scene marks the seam
                          between the closed studies (T4a Waves 1–4, T4b)
                          and the next-phase queued tiers starting at T5.
                          Hidden on desktop where the same scene lives
                          stacked beside the table. */}
                      {row.tier === "T4b" && (
                        <tr className="lg:hidden">
                          <td colSpan={5} className="py-6">
                            <AsciiFrontierScene aspect="4/5" />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-sm font-medium mt-4 text-foreground/60">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2">
          <div className="bg-background p-8">
            <p className="text-sm leading-relaxed text-foreground/70">
              {t4aNote}
            </p>
          </div>

          <div className="bg-background p-8">
            <p className="text-sm leading-relaxed text-foreground/70">
              {onChainBurstNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
