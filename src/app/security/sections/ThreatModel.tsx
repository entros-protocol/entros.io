/**
 * Threat Model—single-column long-form statement. Distinct from the
 * grid and table sections elsewhere on the page; reads like a policy
 * document, fitting the page's transparency posture.
 */
export function ThreatModel() {
  return (
    <section id="threat-model" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <h2 className="max-w-3xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Who we build against<span className="text-cyan">.</span>
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-base leading-relaxed text-foreground/70 md:text-lg">
              A well-resourced adversary can control the browser, modify the
              SDK, generate submitted signals, run many wallets, and study
              the public programs and circuits. The service treats every
              client field as untrusted.
            </p>
          </div>

          <div>
            <p className="text-base leading-relaxed text-foreground/55 md:text-lg">
              Wallet-key compromise, coercion, attacks against device
              hardware, and compromise of private service infrastructure are
              separate categories. Native app and device attestation remain
              planned for a higher-assurance tier.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
