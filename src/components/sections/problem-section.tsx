/**
 * Problem section—single statement of stakes + frame, set in the
 * display register to carry the same typographic weight as the hero.
 */
export function ProblemSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // THE PROBLEM
        </span>

        <h2 className="mt-6 font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          99.99% of Solana transactions will be agent-driven within two years<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          At that scale, identifying a returning human across time
          becomes the foundational signal for airdrops, governance, and
          agent accountability. Static biometrics verify a moment.
          Entros is the behavioral layer—continuous proof-of-personhood
          that runs in any browser and keeps raw data on the device,
          compounding trust across every dApp on Solana.
        </p>
      </div>
    </section>
  );
}
