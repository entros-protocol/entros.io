import type { Feature } from "./types";

export const features: Feature[] = [
  {
    icon: "pulse",
    title: "The Pulse",
    description:
      "Voice, motion, and touch are captured during one session. The flow generates a fresh random challenge each time.",
    benefit:
      "Raw motion and full-resolution touch stay on the device. The validation path receives derived features, phrase audio, timing summaries, and a coarse curve outline.",
  },
  {
    icon: "proof",
    title: "The Proof",
    description:
      "A ZK proof that two committed fingerprints satisfy the configured Hamming-distance bounds.",
    benefit:
      "Groth16 proof with minimum distance constraint blocks perfect replay attacks.",
  },
  {
    icon: "anchor",
    title: "The Anchor",
    description:
      "A non-transferable Solana token tied to your wallet. Trust Score grows with consistent re-verification over time.",
    benefit:
      "Weekly verification span and account age contribute to the on-chain score.",
  },
];
