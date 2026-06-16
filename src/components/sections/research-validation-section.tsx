const FINDINGS = [
  {
    title: "Single-Modality Detection Is Failing",
    source: "SONAR Benchmark, ACM 2024-2025",
    body: "OpenAI's TTS is detected only 78% of the time by the best available classifier. Models trained on older datasets lose up to 43% performance against newer TTS systems. Audio-only verification is a losing game.",
  },
  {
    title: "Multi-Modal Fusion Is the Defense",
    source: "BioMoTouch, arXiv 2025",
    body: "Touch and motion sensor fusion from commodity devices achieves 99.71% accuracy with 0.27% equal error rate. Mimicry attacks succeed less than 1% of the time. Replicating physiological characteristics across multiple modalities in temporally consistent patterns is exponentially harder.",
  },
  {
    title: "Voice-Gesture Coupling Is Biomechanical",
    source: "Pouw et al., Royal Society Proceedings B, 2025",
    body: "Hand movement and voice prosody couple through shared respiratory and motor control systems. The coupling is involuntary and biomechanical. A bot using TTS and a movement simulator produces two independent signals that lack this natural coupling.",
  },
  {
    title: "Physics-Informed Detection Still Works",
    source: "VoiceRadar, NDSS 2025",
    body: "Micro-frequency oscillations derived from vocal fold physics achieve 0.45% equal error rate against modern TTS. TTS models the statistical distribution of speech features but not the underlying physics of speech production.",
  },
  {
    title: "Modern TTS Produces Artifacts in Both Directions",
    source: "Warren et al., \"Pitch Imperfect\", 2025",
    body: "Neural vocoders can produce acoustic perturbation values higher than human baselines, not just lower. This overturns the assumption that synthetic speech is \"too perfect.\" Detection must account for artifacts in both directions.",
  },
  {
    title: "Touch-IMU Shockwave Is a Liveness Signal",
    source: "Device physics, BioMoTouch 2025",
    body: "Physical touch produces a measurable hardware response in a device's motion sensors. A signal generated without genuine physical interaction cannot reproduce it.",
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
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // RESEARCH VALIDATION
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Why multi-modal behavioral
          verification works<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Single-modality detection is losing to modern AI. Entros&apos;s
          multi-modal approach is the architecture recent research
          converges on for proof of personhood.
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
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
            // CORE ADVANTAGE
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">
            Entros captures voice, movement, and touch simultaneously
            and verifies their temporal correlation. Spoofing one
            modality in isolation is feasible. Spoofing all three with
            consistent behavioral characteristics across modalities is
            an exponentially harder problem. Trust Score then requires
            maintaining that consistency across sessions over weeks,
            compounding the difficulty further.
          </p>
        </div>
      </div>
    </section>
  );
}
