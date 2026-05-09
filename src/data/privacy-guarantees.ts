import type { PrivacyGuarantee } from "./types";

export const privacyGuarantees: PrivacyGuarantee[] = [
  {
    icon: "smartphone",
    title: "On-device processing",
    description:
      "Sensor capture, feature extraction, hashing, and proof generation all run on the user's device. No raw biometric recordings are transmitted or stored server-side.",
  },
  {
    icon: "database",
    title: "No raw biometric storage",
    description:
      "Raw audio, motion, and touch data are destroyed after the Temporal Fingerprint is computed. No server-side database holds voice samples or movement traces. Your encrypted fingerprint stays on your device for re-verification.",
  },
  {
    icon: "file-lock",
    title: "Minimal data transmission",
    description:
      "The Pulse SDK transmits a Groth16 proof, a Poseidon commitment, and a compact statistical summary (308 derived features). Raw sensor data and the behavioral fingerprint never cross the network.",
  },
  {
    icon: "eye-off",
    title: "No identity mapping",
    description:
      "The protocol proves 'you are human,' not 'you are a specific person.' The TBH is pseudonymous. It does not link to a name, email, or social account.",
  },
  {
    icon: "lock",
    title: "One-way commitment",
    description:
      "Poseidon(fingerprint || salt) is computationally irreversible. The commitment cannot be decoded back into the original behavioral fingerprint.",
  },
  {
    icon: "shield",
    title: "GDPR and EU AI Act aligned",
    description:
      "Behavioral verification (not identification) is designed to minimize regulatory exposure under the EU AI Act. Data minimization is enforced by architecture, not policy.",
  },
];
