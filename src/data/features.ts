import type { Feature } from "./types";

export const features: Feature[] = [
  {
    icon: "pulse",
    title: "The Pulse",
    description:
      "Say one word and trace one short path, three rounds in a row, each with a fresh challenge.",
    benefit:
      "Raw motion and touch stay on your device. The service receives derived features, your spoken words for transcription and a coarse path outline.",
  },
  {
    icon: "proof",
    title: "The Proof",
    description:
      "A ZK proof that two committed fingerprints sit within the Hamming-distance bounds.",
    benefit:
      "A minimum-distance floor in the Groth16 circuit rejects an exact replay.",
  },
  {
    icon: "anchor",
    title: "The Anchor",
    description:
      "A non-transferable token on your wallet. Its Trust Score grows as you re-verify across separate weeks.",
    benefit:
      "Active weeks, recency and account age set the on-chain score.",
  },
];
