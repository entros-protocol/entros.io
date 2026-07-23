import type { PrivacyGuarantee } from "./types";

export const privacyGuarantees: PrivacyGuarantee[] = [
  {
    icon: "smartphone",
    title: "On-device processing",
    description:
      "Sensor capture, feature extraction, hashing, and proof generation all run on the user's device. The only raw signal that leaves is the spoken-phrase audio, sent to the validator for transcription and discarded immediately after — never stored. Raw motion and touch never leave the device.",
  },
  {
    icon: "database",
    title: "No raw biometric storage",
    description:
      "Raw audio, motion, and touch data are never persisted after the Temporal Fingerprint is computed. No server-side database holds voice samples or movement traces. Your encrypted fingerprint is cached locally for fast re-verification and held on chain in a wallet-keyed AES-256-GCM blob—recoverable from any device by the wallet that wrote it, opaque to everyone else. The blob holds only a one-way hash of the behavioral summary plus a random salt; raw audio, motion, and touch are never inside it.",
  },
  {
    icon: "file-lock",
    title: "Minimal data transmission",
    description:
      "The Pulse SDK transmits a Groth16 proof, a Poseidon commitment, a compact statistical summary (308 derived features), and the spoken-phrase audio used for transcription (discarded after, never stored). The behavioral fingerprint never crosses the network; raw motion and touch never leave the device.",
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
