import type { Feature } from "./types";

export const features: Feature[] = [
  {
    icon: "pulse",
    title: "The Pulse",
    description:
      "Voice, motion, and touch is captured simultaneously on your device. A unique random challenge each session.",
    benefit:
      "Behavioral entropy scoring detects synthetic data patterns. Raw data is never persisted—only derived statistical features are validated server-side.",
  },
  {
    icon: "proof",
    title: "The Proof",
    description:
      "A ZK proof that your behavioral fingerprint is consistent with your previous verification. No raw biometric data persists or is exposed.",
    benefit:
      "Groth16 proof with minimum distance constraint blocks perfect replay attacks.",
  },
  {
    icon: "anchor",
    title: "The Anchor",
    description:
      "A non-transferable Solana token tied to your wallet. Trust Score grows with consistent re-verification over time.",
    benefit:
      "Progressive scoring rewards months of genuine use. Bot farms can't fast-track trust.",
  },
];
