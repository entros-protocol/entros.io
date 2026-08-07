import type { VerificationStep } from "./types";

export const verificationSteps: VerificationStep[] = [
  {
    title: "01—Challenge",
    description:
      "A random word phrase and Lissajous curve generated fresh for each session. No two sessions share the same challenge.",
    detail:
      "Each session generates a unique 5-word phrase from a curated English vocabulary and a unique Lissajous curve from random mathematical parameters. The user speaks the phrase while tracing the curve for 12 seconds. The challenge elicits natural behavioral data (voice prosody, hand tremor, touch pressure) rather than testing memory or speed.",
    icon: "mic",
  },
  {
    title: "02—Capture",
    description:
      "Three sensor streams record in parallel: voice, touch, and motion. 12 seconds of simultaneous behavioral data.",
    detail:
      "The Pulse SDK accesses the device microphone, accelerometer, gyroscope, and touch digitizer. All sensors record in parallel for 12 seconds. Raw motion and touch recordings stay in device memory and are destroyed after feature extraction. Derived statistical summaries leave the device for validation, along with the spoken-phrase audio, which the server transcribes and discards immediately. On desktop, motion sensors are unavailable. Mouse pointer dynamics provide equivalent kinematic features.",
    icon: "activity",
  },
  {
    title: "03—Extract + Score",
    description:
      "308 statistical features across voice, motion, and touch. Anatomical signal (formants, MFCCs, voice quality) alongside anti-synthesis traces (jitter, shimmer, HNR).",
    detail:
      "Audio contributes 170 features, including F0 statistics, MFCCs, LPC coefficients, formant trajectories, and voice quality. Motion contributes 81 features, including jerk, jounce, band energies, tremor peaks, and cross-axis covariance. Touch contributes 57 features, including velocity, pressure derivatives, curvature, and path efficiency. The private service evaluates these values under the current policy. On desktop, mouse dynamics fill the kinematic feature shape.",
    icon: "scan",
  },
  {
    title: "04 - Hash",
    description:
      "SimHash projects the feature summary into a 256-bit fingerprint for continuity research.",
    detail:
      "SimHash projects the expanded feature vector across fixed hyperplanes. The result is a comparable 256-bit fingerprint. Current research measures whether same-person captures stay close enough while different people and synthetic inputs separate reliably.",
    icon: "hash",
  },
  {
    title: "05—Commit",
    description:
      "Poseidon(fingerprint || salt) produces the TBH commitment. The fingerprint and salt stay on-device.",
    detail:
      "The SDK generates a large random salt. Poseidon commits to the fingerprint and salt over BN254 field elements. The fingerprint and salt stay in the encrypted baseline. The validation path receives the statistical summary and transient capture inputs before the wallet flow submits protocol data on-chain.",
    icon: "lock",
  },
  {
    title: "06—Prove",
    description:
      "Groth16 ZK proof: distance is within the valid range. Not too similar (replay), not too different (imposter).",
    detail:
      "The circuit proves that both commitments open to the supplied fingerprints. It also proves that their Hamming distance is below the maximum and at or above the replay floor. The circuit does not prove how the client produced either fingerprint.",
    icon: "proof",
  },
  {
    title: "07—Verify",
    description:
      "Proof verified on Solana. Anchor updated. Progressive Trust Score recalculated from verification history.",
    detail:
      "The private validation service applies phrase, synthesis, capture, and cross-wallet checks to the submitted evidence. Re-verification also requires an on-chain proof. The service processes phrase audio in memory and receives no raw motion or full-resolution touch stream. On success, the Anchor stores the latest timestamp and recent history. Trust Score recalculates from active weekly bins and account age.",
    icon: "check-circle",
  },
];
