import { StepNumber } from "@/components/ui/step-number";

const DEFENSES = [
  {
    title: "Fresh challenges",
    description:
      "The server issues a new word and path for every round, then checks the transcript against the issued words before settlement.",
  },
  {
    title: "Feature validation",
    description:
      "The private service checks the 308 features for acoustic artifacts, unusual signal statistics and duplicate fingerprints. Its thresholds stay private.",
  },
  {
    title: "Cross-wallet registry",
    description:
      "The service compares each new fingerprint with recent fingerprints from other wallets. Population-scale performance is still under evaluation.",
  },
  {
    title: "Distance bounds",
    description:
      "Each re-verification proves the new fingerprint sits within the circuit's minimum and maximum distance from the last one. An identical fingerprint fails.",
  },
  {
    title: "Several signals",
    description:
      "Voice, touch or pointer, and motion where available. Entros is measuring which combinations separate people, devices and synthesis methods.",
  },
  {
    title: "Trust over time",
    description:
      "Trust Score counts active weekly verification bins and account age. A second verification in the same week adds no bin.",
  },
  {
    title: "Fees and rate limits",
    description:
      "Fees and rate limits bound how many attempts reach the service. The validation policy decides whether a capture passes.",
  },
];

/**
 * Security Model: a vertical numbered list. Each defense is a full-width
 * row with the number and title on the left and the body on the right.
 */
export function SecurityModelSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          How Entros checks a capture<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          A private service checks each capture before it settles. Published
          results name the attack class tested and the sample size.
        </p>

        <div className="mt-16 border-t border-border">
          {DEFENSES.map((d, idx) => (
            <div
              key={d.title}
              className="grid grid-cols-1 gap-y-3 border-b border-border py-7 md:grid-cols-[1fr_1.4fr] md:gap-x-12 md:gap-y-0 md:py-9"
            >
              <div className="flex items-baseline gap-5">
                <StepNumber n={idx + 1} className="w-9 shrink-0 md:w-11" />
                <h3 className="font-display text-xl font-medium tracking-tight text-foreground md:text-2xl md:leading-[1.15]">
                  {d.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-foreground/60 md:text-base md:leading-relaxed">
                {d.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
