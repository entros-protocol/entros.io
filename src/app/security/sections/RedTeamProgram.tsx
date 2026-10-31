const taxonomy = [
  { tier: "T1", attackClass: "Procedural synthesis (script-kiddie baseline)", tests: "Absolute attacker floor" },
  { tier: "T2", attackClass: "Parameter-varied procedural", tests: "Tier 1 statistical consistency checks" },
  { tier: "T3", attackClass: "Feature-space optimization with source access", tests: "Tier 1 distributional realism" },
  { tier: "T4a", attackClass: "Pre-recorded human voice + procedural motion/touch", tests: "Layer contribution and phrase binding" },
  { tier: "T4b", attackClass: "Real-time synthesized voice (XTTS-v2, Kokoro, streaming TTS)", tests: "TTS artifact detection + content binding + Sybil registry" },
  { tier: "T5", attackClass: "Coupled cross-modal synthesis", tests: "Current cross-signal detector" },
  { tier: "T6", attackClass: "Targeted human-mimicry / identity theft", tests: "Blocked until T5 closes" },
  { tier: "T7", attackClass: "Replay with adversarial perturbation", tests: "Min-distance floor + commitment registry" },
  { tier: "T8", attackClass: "Black-box adaptive probing", tests: "Rate limits + response opacity" },
];

/**
 * Red Team Program—taxonomy table. Eight attack tiers with what they
 * test against. Distinct from grid-based sections; reads as a reference.
 */
export function RedTeamProgram() {
  return (
    <section id="red-team" className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          How we test our defenses<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          The private harness runs isolated and full-stack campaigns against
          the devnet pipeline. T5 remains open; T6 through T8 are planned.
        </p>

        <div tabIndex={0} className="mt-16 overflow-x-auto border-y border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="text-sm font-medium py-4 pl-2 pr-6 text-left text-foreground/65"
                >
                  Tier
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium py-4 pr-6 text-left text-foreground/65"
                >
                  Attack class
                </th>
                <th
                  scope="col"
                  className="text-sm font-medium py-4 pr-2 text-left text-foreground/65"
                >
                  Tests defense against
                </th>
              </tr>
            </thead>
            <tbody>
              {taxonomy.map((row) => (
                <tr key={row.tier} className="border-b border-border last:border-b-0">
                  <td className="whitespace-nowrap py-4 pl-2 pr-6 font-display text-lg font-light tabular-nums tracking-tight text-foreground/55">
                    {row.tier}
                  </td>
                  <td className="py-4 pr-6 text-foreground/80">
                    {row.attackClass}
                  </td>
                  <td className="py-4 pr-2 text-foreground/55">
                    {row.tests}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 max-w-3xl text-sm leading-relaxed text-foreground/55">
          Attack code, per-attempt telemetry, and parameter values that
          produce elevated pass rates stay in a private repository.
        </p>
      </div>
    </section>
  );
}
