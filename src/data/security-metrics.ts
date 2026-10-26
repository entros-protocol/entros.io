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
    note: "Campaign surfaced a gap in server-side feature validation. Hardened. See AUDIT.md.",
  },
  {
    tier: "T4a - Wave 1",
    description: "Pre-recorded human voice + procedural motion/touch (temporal enforcement OFF, log-only)",
    attempts: "50",
    passRate: "100%",
    status: "campaign counterfactual",
  },
  {
    tier: "T4a - Wave 2",
    description: "Pre-recorded human voice + procedural motion/touch (temporal enforcement ON)",
    attempts: "10",
    passRate: "10%",
    status: "campaign enforcement condition",
    note: "A cross-program binding gap surfaced and was fixed; the public audit records the resolved issue without operational details.",
  },
  {
    tier: "T4a - Wave 3",
    description: "Pre-recorded human voice + procedural motion/touch (temporal enforcement ON + phrase content binding ON)",
    attempts: "20",
    passRate: "0%",
    status: "0% observed for this attack class",
    note: "Phrase matching rejected all 20 attempts in this wave, covering the tested prerecorded, arbitrary-content class.",
  },
  {
    tier: "T4a - Wave 4",
    description: "Wave 3 methodology at scale (N=1000) to tighten the statistical bound on the closed attack class",
    attempts: "1,000",
    passRate: "0%",
    status: "0% observed at N=1,000",
    note: "The validator rejected 1,000 of 1,000 attempts (95% confidence interval [0%, 0.37%] for the pass rate). This bounds the tested class, not all synthesis.",
  },
  {
    tier: "T4b",
    description: "Real-time synthesized voice speaking the issued phrase across two TTS families and 58 voices, with procedural motion and touch, in a full-stack campaign",
    attempts: "200",
    passRate: "0%",
    status: "0% observed · 2026-06",
    note: "No attempt in this 200-run campaign reached the chain; the result covers the named models, voices, and configuration.",
  },
  {
    tier: "T5",
    description: "Coupled cross-modal synthesis",
    attempts: "None yet",
    passRate: "in progress",
    status: "open",
  },
  {
    tier: "T6",
    description: "Targeted human-mimicry / identity theft",
    attempts: "None yet",
    passRate: "blocked",
    status: "waits for T5 closure",
  },
  {
    tier: "T7",
    description: "Replay-perturbed",
    attempts: "None yet",
    passRate: "queued",
    status: "next-phase",
  },
  {
    tier: "T8",
    description: "Adaptive probing",
    attempts: "None yet",
    passRate: "queued",
    status: "post-mainnet",
  },
];

export const lastUpdated = "August 7, 2026";

export const t4aNote =
  "T4a measured one prerecorded, arbitrary-content attack class across four campaign conditions; pass rates moved from 100% to 10% to 0%. The final 1,000-run wave observed 0 passes (95% confidence interval [0%, 0.37%]). This does not establish a universal synthesis rate.";

export const onChainBurstNote =
  "Devnet Anchor counts include documented red-team artifacts alongside team and pilot captures. The public stats page reads the on-chain aggregate and does not classify wallet owners.";
