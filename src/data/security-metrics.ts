export interface CampaignWave {
  label: string;
  condition: string;
  attempts: string;
  passRate: string;
  /** Pass rate as a number from 0 to 100, for the bar. */
  percent: number;
}

export interface Campaign {
  tier: string;
  name: string;
  description: string;
  passRate: string;
  caption: string;
  date?: string;
  note?: string;
  waves?: CampaignWave[];
}

export interface PlannedCampaign {
  tier: string;
  name: string;
  status: string;
  active?: boolean;
}

export const campaigns: Campaign[] = [
  {
    tier: "T1",
    name: "Procedural synthesis",
    description: "Scripted voice, motion and touch generated from simple procedures.",
    passRate: "0%",
    caption: "0 of 2,000 passed",
    date: "Hardened March 2026",
  },
  {
    tier: "T2",
    name: "Parameter variation",
    description: "Procedural signals across several strategies and parameter ranges.",
    passRate: "0%",
    caption: "0 of 4,000 passed",
    date: "Hardened March 2026",
  },
  {
    tier: "T3a",
    name: "Unconstrained feature optimization",
    description: "Inputs tuned against the feature space with access to the source.",
    passRate: "0%",
    caption: "0 of 1,000 passed",
    date: "Hardened April 2026",
  },
  {
    tier: "T3b",
    name: "Constrained feature optimization",
    description: "The same search, held to realistic feature ranges.",
    passRate: "0%",
    caption: "0 of 9,000 passed",
    date: "Hardened April 2026",
    note: "This campaign surfaced a gap in server-side feature validation. It is fixed and listed in AUDIT.md.",
  },
  {
    tier: "T4a",
    name: "Prerecorded human voice",
    description: "A person's recorded voice with procedural motion and touch, run under four conditions.",
    passRate: "0%",
    caption: "0 of 1,000 in the final wave",
    note: "Wave 2 surfaced a cross-program binding gap, now fixed. The final wave gives a 95% confidence interval of 0% to 0.37%. It covers this attack class, not all synthesis.",
    waves: [
      { label: "Wave 1", condition: "Temporal checks logged only", attempts: "50", passRate: "100%", percent: 100 },
      { label: "Wave 2", condition: "Temporal checks enforced", attempts: "10", passRate: "10%", percent: 10 },
      { label: "Wave 3", condition: "Plus phrase binding", attempts: "20", passRate: "0%", percent: 0 },
      { label: "Wave 4", condition: "Wave 3 at scale", attempts: "1,000", passRate: "0%", percent: 0 },
    ],
  },
  {
    tier: "T4b",
    name: "Real-time synthetic voice",
    description: "Two TTS families and 58 voices speak the issued phrase, with procedural motion and touch, through the full stack.",
    passRate: "0%",
    caption: "0 of 200 passed",
    date: "June 2026",
    note: "No attempt reached the chain. The result covers the named models, voices and configuration.",
  },
];

export const plannedCampaigns: PlannedCampaign[] = [
  { tier: "T5", name: "Coupled cross-modal synthesis", status: "Testing now", active: true },
  { tier: "T6", name: "Targeted human mimicry", status: "Starts after T5" },
  { tier: "T7", name: "Replay with perturbation", status: "Next phase" },
  { tier: "T8", name: "Adaptive probing", status: "After mainnet" },
];

export const lastUpdated = "August 7, 2026";

export const onChainBurstNote =
  "Devnet Anchor counts include documented red-team artifacts alongside team and pilot captures. The public stats page reads the on-chain aggregate and does not classify wallet owners.";
