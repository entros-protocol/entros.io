import type { VerificationStep } from "./types";

export const verificationSteps: VerificationStep[] = [
  {
    title: "01. Challenge",
    description:
      "A fresh word and path for every round; no round repeats.",
    detail:
      "Each round pairs one word from a curated vocabulary with one short path from random parameters. The browser locks in a round before the next appears, so the client fixes its evidence before seeing the next challenge.",
    icon: "mic",
  },
  {
    title: "02. Capture",
    description:
      "Voice, touch, and motion record in parallel through each round.",
    detail:
      "The Pulse SDK reads the microphone, accelerometer, gyroscope, and touch digitizer. Raw motion and touch stay in device memory, destroyed after extraction. Derived summaries leave for validation, with the spoken-phrase audio, which the server transcribes and discards. On desktop, mouse pointer dynamics provide the kinematic features.",
    icon: "activity",
  },
  {
    title: "03. Extract + Score",
    description:
      "308 statistical features across voice, motion, and touch. Anatomical signal (formants, MFCCs, voice quality) alongside anti-synthesis traces (jitter, shimmer, HNR).",
    detail:
      "Audio contributes 170 features: F0 statistics, MFCCs, LPC coefficients, formant trajectories, and voice quality. Motion contributes 81: jerk, jounce, band energies, tremor peaks, and cross-axis covariance. Touch contributes 57: velocity, pressure derivatives, curvature, and path efficiency.",
    icon: "scan",
  },
  {
    title: "04. Hash",
    description:
      "SimHash projects the feature summary into a 256-bit fingerprint for continuity research.",
    detail:
      "SimHash projects the feature vector across fixed hyperplanes into a 256-bit fingerprint. Current research measures how well same-person captures stay close while different people and synthetic inputs stay apart.",
    icon: "hash",
  },
  {
    title: "05. Commit",
    description:
      "Poseidon(fingerprint || salt) produces the TBH commitment. The fingerprint and salt stay on the device, with an encrypted copy written on chain when the wallet can sign messages.",
    detail:
      "The SDK generates a large random salt; Poseidon commits to fingerprint and salt over BN254 field elements.",
    icon: "lock",
  },
  {
    title: "06. Prove",
    description:
      "Groth16 ZK proof: the Hamming distance sits above the replay floor and below the configured maximum.",
    detail:
      "The circuit proves both commitments open to the supplied fingerprints and that their distance sits below the maximum and at or above the replay floor.",
    icon: "proof",
  },
  {
    title: "07. Verify",
    description:
      "Proof verified on Solana. Anchor updated. Progressive Trust Score recalculated from verification history.",
    detail:
      "The private validation service applies phrase, synthesis, capture, and cross-wallet checks to the evidence. On success, the Anchor stores the latest timestamp and recent history.",
    icon: "check-circle",
  },
];
