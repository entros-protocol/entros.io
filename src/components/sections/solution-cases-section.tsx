import {
  AsciiAirdropScene,
  AsciiBotScene,
  AsciiCreatorScene,
  AsciiMintScene,
  AsciiVoteScene,
} from "@/components/ui/ascii-scenes";
import { solutionCases } from "@/data/solution-cases";

const SCENES = [
  AsciiAirdropScene,
  AsciiVoteScene,
  AsciiMintScene,
  AsciiCreatorScene,
  AsciiBotScene,
];

/**
 * Solution Cases — five editorial spreads. Each case is a full row
 * with a number badge + title + category at top, an ASCII scene on
 * one side (alternating L/R), and the Problem · Solution · Example
 * triplet on the other. Reads as a magazine feature spread.
 */
export function SolutionCasesSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // USE CASES
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Where Entros fits<span className="text-cyan">.</span>
        </h2>

        <div className="mt-10 flex flex-col gap-40 md:gap-56">
          {solutionCases.map((c, idx) => {
            const number = String(idx + 1).padStart(2, "0");
            const reverse = idx % 2 === 1;
            const Scene = SCENES[idx] ?? AsciiAirdropScene;
            return (
              <article
                key={c.title}
                className={`grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-20 ${
                  reverse ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <Scene
                  label={`CASE ${number}`}
                  aspect="4/5"
                  fit
                  className="lg:col-span-5 lg:h-full"
                />

                {/* Copy side, centred against the tall scene so the
                    column doesn't sit top-aligned with dead space under it. */}
                <div className="lg:col-span-7 lg:self-center">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs tracking-[0.2em] text-cyan">
                      {number}
                    </span>
                    <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50">
                      {c.category}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <h3 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-4xl md:leading-[1.05]">
                    {c.title}
                  </h3>

                  {/* Single grid so labels share one column track across rows.
                      pt-[0.2rem] on the label nudges its cap-height onto the
                      body's first-line baseline, removing visual drift. */}
                  <dl className="mt-10 grid grid-cols-1 gap-x-6 gap-y-2 md:grid-cols-[6rem_1fr] md:gap-y-6">
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40 md:pt-[0.2rem]">
                      Problem
                    </dt>
                    <dd className="text-sm leading-relaxed text-foreground/65">
                      {c.problem}
                    </dd>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan md:pt-[0.2rem]">
                      Solution
                    </dt>
                    <dd className="text-sm leading-relaxed text-foreground/75">
                      {c.solution}
                    </dd>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40 md:pt-[0.2rem]">
                      Example
                    </dt>
                    <dd className="text-sm leading-relaxed text-foreground/65">
                      {c.example}
                    </dd>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
