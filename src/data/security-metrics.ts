export interface CampaignResult {
  tier: string;
  description: string;
  attempts: string;
  passRate: string;
  status: string;
  note?: string;
}

export const campaignResults: CampaignResult[] = [
  {
    tier: "T1",
    description: "Procedural synthesis",
    attempts: "2,000",
    passRate: "0%",
    status: "hardened · 2026-03",
  },
  {
    tier: "T2",
    description: "Multi-strategy parameter variation",
    attempts: "4,000",
    passRate: "0%",
    status: "hardened · 2026-03",
  },
  {
    tier: "T3a",
    description: "Unconstrained feature optimization",
    attempts: "1,000",
    passRate: "0%",
    status: "hardened · 2026-04",
  },
  {
    tier: "T3b",
    description: "Constrained feature optimization",
    attempts: "9,000",
    passRate: "0%",
    status: "hardened · 2026-04",
    note: "Campaign surfaced a gap in server-side feature validation. Hardened—see AUDIT.md.",
  },
  {
    tier: "T4a—Wave 1",
    description: "Pre-recorded human voice + procedural motion/touch (temporal enforcement OFF—log-only)",
    attempts: "50",
    passRate: "100%",
    status: "counterfactual baseline",
  },
  {
    tier: "T4a—Wave 2",
    description: "Pre-recorded human voice + procedural motion/touch (temporal enforcement ON)",
    attempts: "10",
    passRate: "10%",
    status: "production enforcement truth",
    note: "Cross-program binding gap in update_anchor discovered during cross-analysis, patched same day—see AUDIT.md protocol-core Critical.",
  },
  {
    tier: "T4a—Wave 3",
    description: "Pre-recorded human voice + procedural motion/touch (temporal enforcement ON + phrase content binding ON)",
    attempts: "20",
    passRate: "0%",
    status: "phrase binding closes the residual",
    note: "Whisper-based content matching against the server-issued challenge phrase rejects every attempt where the spoken audio doesn't match. Combined three-layer stack drops T4a from 100% → 10% → 0%.",
  },
  {
    tier: "T4a—Wave 4",
    description: "Wave 3 methodology at scale (N=1000) to tighten the statistical bound on the closed attack class",
    attempts: "1,000",
    passRate: "0%",
    status: "definitively closed",
    note: "1,000 of 1,000 attempts rejected at server-side validation by phrase content binding. 95% CI on the pass rate: [0%, 0.37%]. The pre-recorded-arbitrary-content attack class is closed at production scale.",
  },
  {
    tier: "T4b",
    description: "Real-time synthesized voice speaking the issued challenge phrase, across two independent TTS model families (Kokoro-82M, XTTS-v2) and 58 distinct synthetic voices, paired with procedural motion/touch—full production stack",
    attempts: "200",
    passRate: "0%",
    status: "closed · 2026-06",
    note: "Synthesized voice that correctly speaks the challenge phrase clears the audio-texture checks; the layered stack closes it regardless. 0% reached the chain at production scale across both model families. Higher-fidelity synthesis did not improve end-to-end success—it evades the texture checks more but is less stable at reproducing the exact phrase.",
  },
  {
    tier: "T5",
    description: "Coupled cross-modal synthesis",
    attempts: "—",
    passRate: "queued",
    status: "next-phase",
  },
  {
    tier: "T6",
    description: "Targeted human-mimicry / identity theft",
    attempts: "—",
    passRate: "queued",
    status: "next-phase",
  },
  {
    tier: "T7",
    description: "Replay-perturbed",
    attempts: "—",
    passRate: "queued",
    status: "next-phase",
  },
  {
    tier: "T8",
    description: "Adaptive probing",
    attempts: "—",
    passRate: "queued",
    status: "post-mainnet",
  },
];

export const lastUpdated = "June 18, 2026";

export const t4aNote =
  "T4a was designed as a multi-wave study to measure each defense layer's specific contribution against one canonical attack class. Wave 1 ran with temporal enforcement in log-only mode to establish the counterfactual baseline (100% pass). Wave 2 enabled cross-modal temporal coupling enforcement (10% pass—the 90 percentage-point reduction isolates that layer's contribution). Wave 3 enabled phrase content binding on top of temporal enforcement (0% pass—the final closure of the pre-recorded-arbitrary-content attack class). Wave 4 confirmed the result at scale (1,000 attempts, 0% pass, 95% CI [0%, 0.37%]). Combined defense stack drops T4a from 100% to 0%.";

export const onChainBurstNote =
  "The Entros Anchors currently visible on devnet include internal red team artifacts from T4a Waves 1–4 (documented above) alongside legitimate team and pilot-user verifications. All state is preserved on-chain for audit traceability; the public /stats page reads the full on-chain aggregate directly.";
