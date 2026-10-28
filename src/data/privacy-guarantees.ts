import type { PrivacyGuarantee } from "./types";

export const privacyGuarantees: PrivacyGuarantee[] = [
  {
    icon: "smartphone",
    title: "Done on your device",
    description:
      "Capture, measurement and the proof run in your browser. Raw motion and touch never leave it.",
  },
  {
    icon: "database",
    title: "Words never stored",
    description:
      "Your spoken words leave for transcription, stay in memory and are never written to a log or store.",
  },
  {
    icon: "file-lock",
    title: "Only what the check needs",
    description:
      "The service receives signal summaries, your words and a rough outline of each path.",
  },
  {
    icon: "eye-off",
    title: "No identity",
    description: "No name, email, document, face scan or social account.",
  },
  {
    icon: "lock",
    title: "A one-way record",
    description:
      "On chain, a salted hash stands in for your fingerprint. The salt stays with you or is encrypted under your wallet's key.",
  },
  {
    icon: "shield",
    title: "Apps read a result",
    description:
      "Apps read your Entros Anchor and Trust Score, never the data behind them.",
  },
];
