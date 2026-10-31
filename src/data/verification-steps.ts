import type { VerificationStep } from "./types";

export const verificationSteps: VerificationStep[] = [
  {
    title: "Prompt",
    description: "A fresh word and path every round.",
    detail:
      "The server draws each word from a curated vocabulary and each path from random parameters. Your browser locks in a round before the next one appears.",
    icon: "mic",
  },
  {
    title: "Capture",
    description: "Voice, touch and motion, recorded together.",
    detail:
      "The SDK reads the microphone, touch or pointer, and motion sensors where present. Raw motion and touch stay in memory and are discarded after measurement. Phrase audio leaves for transcription and is never stored.",
    icon: "activity",
  },
  {
    title: "Measure",
    description: "308 features across three signals.",
    detail:
      "Voice gives 170 (pitch, formants, voice quality), motion 81 (jerk, tremor, band energy) and touch 57 (velocity, pressure, curvature).",
    icon: "scan",
  },
  {
    title: "Hash",
    description: "A 256-bit fingerprint.",
    detail:
      "SimHash maps similar feature sets to nearby fingerprints. Current research measures how well one person's captures stay close while other people and synthetic inputs land apart.",
    icon: "hash",
  },
  {
    title: "Commit",
    description: "Only a salted hash goes on chain.",
    detail:
      "Poseidon hashes the fingerprint with a large random salt. Both stay on your device, with an encrypted copy on chain when your wallet can sign messages.",
    icon: "lock",
  },
  {
    title: "Prove",
    description: "A zero-knowledge proof of distance.",
    detail:
      "A Groth16 proof shows both commitments open to fingerprints whose Hamming distance sits at or above the replay floor and below the maximum. The fingerprints stay private.",
    icon: "proof",
  },
  {
    title: "Verify",
    description: "Checked by the service, settled on Solana.",
    detail:
      "The validation service checks the spoken phrase, signs of synthetic audio, the capture and fingerprints on other wallets. Solana verifies the proof, updates your Anchor and recalculates your Trust Score.",
    icon: "check-circle",
  },
];
