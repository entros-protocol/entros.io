import type { PrivacyGuarantee } from "./types";

export const privacyGuarantees: PrivacyGuarantee[] = [
  {
    icon: "smartphone",
    title: "What stays on your device",
    description:
      "Sensor capture, feature extraction, hashing, and proof generation run locally. Raw motion and full-resolution touch never leave the device; the spoken phrase leaves for transcription, never stored.",
  },
  {
    icon: "database",
    title: "No raw biometric storage",
    description:
      "The validation service processes phrase audio in memory and writes it to no log or store. The SDK keeps fingerprint, salt, commitment, and timestamp locally; wallet-connected flows can also hold that baseline in a wallet-keyed AES-256-GCM blob on-chain.",
  },
  {
    icon: "file-lock",
    title: "Minimal data transmission",
    description:
      "The Pulse SDK sends the 308-feature summary, selected F0 and acceleration series, phrase audio, capture timing, client signals, a coarse curve outline, commitment data, and receipt intent to the validation path. The wallet flow submits commitments, proofs, public inputs, and encrypted baseline material on-chain when available.",
  },
  {
    icon: "eye-off",
    title: "No identity mapping",
    description:
      "The protocol is designed to prove humanness without identifying the person. It requires no name, email, document, face scan, or social account.",
  },
  {
    icon: "lock",
    title: "One-way commitment",
    description:
      "Poseidon commits to the fingerprint and a large random salt. Preimage resistance and the hidden salt prevent direct recovery under the protocol's threat model.",
  },
  {
    icon: "shield",
    title: "Data minimization by design",
    description:
      "The architecture limits raw-data movement and separates transient validation inputs from persistent state. Each deployer must still assess its own legal and regulatory obligations.",
  },
];
