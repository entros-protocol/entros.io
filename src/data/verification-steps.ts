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
      "The Pulse SDK accesses the device microphone, accelerometer, gyroscope, and touch digitizer. All sensors record in parallel for 12 seconds. Raw recordings stay in device memory and are destroyed after feature extraction. Only derived statistical summaries leave the device for server-side validation. On desktop, motion sensors are unavailable. Mouse pointer dynamics provide equivalent kinematic features.",
    icon: "activity",
  },
  {
    title: "03—Extract + Score",
    description:
      "308 statistical features across voice, motion, and touch. Includes anatomical signal (formants, MFCCs, voice quality) plus anti-synthesis traces (jitter, shimmer, HNR).",
    detail:
      "Audio (170 features): F0 statistics and delta, jitter, shimmer, harmonics-to-noise ratio, MFCCs and delta-MFCCs, LPC coefficient stats, formant trajectories (F1/F2/F3) plus bandwidths, voice quality (CPP, spectral tilt, H1-H2, sub-band ratios), pitch contour DCT, and long-term average spectrum statistics. Motion (81 features): jerk and jounce analysis, FFT band energies, tremor peak in the 4-12 Hz physiological band, cross-axis IMU covariance, magnitude autocorrelation. Touch (57 features): velocity, acceleration, pressure first-derivative moments, contact aspect ratio, trajectory curvature, inter-touch gap distribution, path efficiency, per-stroke length stats. Per-feature entropy detects TTS artifacts; real human tremor fluctuates over time, synthetic data stays constant. On desktop, mouse pointer dynamics replace IMU data with the same kinematic feature shape.",
    icon: "scan",
  },
  {
    title: "04—Hash",
    description:
      "SimHash projects features into a 256-bit fingerprint. Same-user fingerprints cluster; imposters diverge.",
    detail:
      "The expanded feature vector (including entropy and jitter metrics) is passed through SimHash using random hyperplane projections. The output is a Temporal Fingerprint. Two fingerprints from the same person have small Hamming distance. The entropy features mean synthetic data produces a different fingerprint than real behavioral data.",
    icon: "hash",
  },
  {
    title: "05—Commit",
    description:
      "Poseidon(fingerprint || salt) produces the TBH commitment. The fingerprint and salt stay on-device.",
    detail:
      "A large cryptographically-secure salt is generated. The Poseidon hash function (chosen for ZK-circuit efficiency over BN254 field elements) takes the fingerprint concatenated with the salt to produce H_TBH. The commitment and ZK proof are transmitted. The fingerprint and salt remain on-device, encrypted.",
    icon: "lock",
  },
  {
    title: "06—Prove",
    description:
      "Groth16 ZK proof: distance is within the valid range. Not too similar (replay), not too different (imposter).",
    detail:
      "The proof verifies three statements: both commitments are valid Poseidon hashes of real fingerprints, the Hamming distance falls below the maximum threshold (natural human variation), and the distance exceeds a minimum threshold (blocks perfect replay where a bot submits identical data). The verifier learns nothing about the actual fingerprints.",
    icon: "proof",
  },
  {
    title: "07—Verify",
    description:
      "Proof verified on Solana. Anchor updated. Progressive Trust Score recalculated from verification history.",
    detail:
      "The statistical feature summary is validated server-side by proprietary models that detect synthetic data, then the ZK proof is verified on-chain. Both must pass. The server sees only derived statistics (means, variances, spectral coefficients)—never raw recordings. On success, the Anchor stores the verification timestamp in a rolling history. Trust Score recalculates using recency weighting and cadence analysis.",
    icon: "check-circle",
  },
];
