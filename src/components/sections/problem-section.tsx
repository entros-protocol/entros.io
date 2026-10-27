/**
 * Problem section—single statement of stakes + frame, set in the
 * display register to carry the same typographic weight as the hero.
 */
export function ProblemSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          {/* Non-breaking spaces bind "within two years" into one unit so it
              wraps to the second line together, instead of stranding "years."
              alone. Responsive in a way a hard <br /> would not be. */}
          {/* {" "} is load-bearing: JSX drops a space that sits between a
              closing tag and the text following it. */}
          Agents are becoming economic actors on Solana
          <span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Apps need a signal that a person still holds the controls. Entros
          is designed to give that signal through repeated verification on
          Solana.
        </p>
      </div>
    </section>
  );
}
