/**
 * Threat Model—single-column long-form statement. Distinct from the
 * grid and table sections elsewhere on the page; reads like a policy
 * document, fitting the page's transparency posture.
 */
export function ThreatModel() {
  return (
    <section id="threat-model" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // THREAT MODEL
        </span>

        <h2 className="mt-6 max-w-3xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Who we build against<span className="text-cyan">.</span>
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
              // ASSUMED CAPABILITIES
            </p>
            <p className="mt-4 text-base leading-relaxed text-foreground/70 md:text-lg">
              A well-resourced adversary can control the browser client,
              modify the public SDK, generate submitted signals, operate many
              wallets, and study public programs and circuits. The private
              service must treat every client field as untrusted.
            </p>
          </div>

          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
              // OUT OF SCOPE
            </p>
            <p className="mt-4 text-base leading-relaxed text-foreground/55 md:text-lg">
              Wallet-key compromise, coercion, physical attacks against
              device hardware, and compromise of private service
              infrastructure are separate threat categories. Native app and
              device attestation remain planned for a higher-assurance tier.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
