import type { Feature } from "./types";

export const features: Feature[] = [
  {
    icon: "pulse",
    title: "Three short rounds",
    description:
      "Say one word and trace one short path. Each of the three rounds brings a new word and a new path.",
    benefit:
      "Raw motion and touch stay on your device. The service receives a summary of each signal, your spoken words for transcription and a rough outline of each path.",
  },
  {
    icon: "proof",
    title: "One private proof",
    description:
      "When you come back, your browser builds a zero-knowledge proof that the new session matches your last one, without revealing either.",
    benefit:
      "The proof also rejects a session that is an exact copy of the last one.",
  },
  {
    icon: "anchor",
    title: "Your Entros Anchor",
    description:
      "A token on your wallet that cannot be transferred. Its Trust Score grows as you verify again across separate weeks.",
    benefit:
      "The score counts active weeks, how recently you verified and how long you have held the Anchor.",
  },
];
