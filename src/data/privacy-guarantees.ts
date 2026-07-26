import type { PrivacyGuarantee } from "./types";

export const privacyGuarantees: PrivacyGuarantee[] = [
  {
    icon: "smartphone",
    title: "On-device processing",
    description:
      "Sensor capture, feature extraction, hashing, and proof generation run on the user's device. Raw motion and touch recordings stay in device memory and are destroyed once features are computed. The only recording that leaves is the spoken phrase, transcribed on arrival and discarded.",
  },
  {
    icon: "database",
    title: "No raw biometric storage",
    description:
      "Raw audio, motion, and touch are never persisted after the Temporal Fingerprint is computed. No server-side database holds voice samples or movement traces. The fingerprint is cached locally for fast re-verification and held on chain in a wallet-keyed AES-256-GCM blob, recoverable from any device by the wallet that wrote it and opaque to everyone else. That blob holds a one-way hash of the behavioral summary and a random salt, nothing more.",
  },
  {
    icon: "file-lock",
    title: "Minimal data transmission",
    description:
      "The Pulse SDK transmits a Groth16 proof, a Poseidon commitment, a 308-feature statistical summary, a coarse outline of the traced curve for the liveness check, and the spoken phrase audio used for transcription. Nothing else.",
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
