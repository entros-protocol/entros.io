const FINDINGS = [
  {
    title: "Single-modality detection degrades across models",
    source: "SONAR Benchmark, ACM 2024-2025",
    body: "The best available classifier detects OpenAI's TTS 78% of the time; classifiers trained on older datasets lose up to 43% against newer TTS.",
  },
  {
    title: "Mobile fusion can improve authentication",
    source: "BioMoTouch, arXiv 2025",
    body: "BioMoTouch reports 99.71% accuracy and a 0.27% equal error rate for touch and motion fusion. It does not establish Entros liveness or resistance to generated input.",
  },
  {
    title: "Arm movement can perturb the voice",
    source: "Pouw et al., Royal Society Proceedings B, 2025",
    body: "Pouw et al. measured upper-limb movement changing a sustained vowel's amplitude envelope under laboratory conditions. Whether consumer devices can turn that into a liveness signal remains open.",
  },
  {
    title: "Physics-informed features merit evaluation",
    source: "VoiceRadar, NDSS 2025",
    body: "VoiceRadar reports a 0.45% equal error rate for its micro-frequency feature. That result does not establish an Entros error rate.",
  },
  {
    title: "Modern TTS produces artifacts in both directions",
    source: "Warren et al., \"Pitch Imperfect\", 2025",
    body: "Neural vocoders can push acoustic perturbation above human baselines as well as below. Detection must account for artifacts in both directions.",
  },
  {
    title: "Touch and motion can share a physical response",
    source: "Device physics, BioMoTouch 2025",
    body: "A physical touch can produce a time-aligned response in motion sensors. Whether consumer devices can measure it well enough to separate physical interaction from generated input remains open research.",
  },
];

/**
 * Research Validation—six findings in a 3-column hairline grid (3×2,
 * no orphan cells), followed by a cyan-bordered closing callout. The
 * cards intentionally compact—academic citation card feel.
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
          External studies motivate this research; their accuracy numbers do
          not establish Entros performance on consumer devices.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-px border-y border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {FINDINGS.map((f) => (
            <article key={f.title} className="bg-background p-7">
              <h3 className="font-display text-base font-medium tracking-tight text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-cyan/80">
                {f.source}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/60">
                {f.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-16 border-l-2 border-cyan pl-6">
          <p className="max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">
            Entros captures voice, movement, and touch in one session; the
            current fingerprint projection mixes them without proving a causal
            link. Temporal analysis stays observable while challenge-bound
            designs and human completion are tested.
          </p>
        </div>
      </div>
    </section>
  );
}
