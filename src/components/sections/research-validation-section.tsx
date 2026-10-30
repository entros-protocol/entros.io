const FINDINGS = [
  {
    title: "Single-signal detectors age fast",
    source: "SONAR Benchmark, ACM 2024-2025",
    body: "The best classifier caught OpenAI's TTS 78% of the time. Detectors trained on older data lost up to 43% against newer TTS.",
  },
  {
    title: "Touch and motion fusion",
    source: "BioMoTouch, arXiv 2025",
    body: "Fusion reached 99.71% accuracy and a 0.27% equal error rate for authentication, a different task from liveness.",
  },
  {
    title: "Arm movement perturbs the voice",
    source: "Pouw et al., Royal Society Proceedings B, 2025",
    body: "Upper-limb movement changed a sustained vowel's amplitude in the lab. Whether phones can use it for liveness is open.",
  },
  {
    title: "Physics-informed voice features",
    source: "VoiceRadar, NDSS 2025",
    body: "A micro-frequency feature reached a 0.45% equal error rate in the authors' tests.",
  },
  {
    title: "TTS artifacts run both ways",
    source: "Warren et al., \"Pitch Imperfect\", 2025",
    body: "Neural vocoders can push acoustic perturbation above human levels as well as below, so a detector has to check both directions.",
  },
  {
    title: "Touch shows up in motion",
    source: "Device physics, BioMoTouch 2025",
    body: "A physical touch can leave a time-aligned trace in motion sensors. Whether consumer devices measure it well enough is open.",
  },
];

/**
 * Research Validation: six findings in a 3-column hairline grid (3×2,
 * no orphan cells).
 */
export function ResearchValidationSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <h2 className="max-w-2xl font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Evidence behind the research
          program<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Outside studies shape this research. Their numbers describe their
          own tests and do not describe Entros on consumer devices.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {FINDINGS.map((f) => (
            <article key={f.title} className="bg-background p-7">
              <h3 className="font-display text-base font-medium tracking-tight text-foreground">
                {f.title}
              </h3>
              <p className="text-sm font-medium mt-2 text-foreground">
                {f.source}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/60">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
