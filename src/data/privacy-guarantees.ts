import type { PrivacyGuarantee } from "./types";

export const privacyGuarantees: PrivacyGuarantee[] = [
  {
    icon: "smartphone",
    title: "On-device processing",
    description:
      "Sensor capture, feature extraction, hashing, and proof generation run on the user's device. Raw motion and full-resolution touch recordings stay in device memory. The spoken phrase leaves the device for validation and transcription.",
  },
  {
    icon: "database",
    title: "No raw biometric storage",
    description:
      "The validation service processes phrase audio in memory and does not write it to logs or persistent storage. The SDK stores the fingerprint, salt, commitment, and timestamp locally for re-verification. Wallet-connected flows can also store that baseline in a wallet-keyed AES-256-GCM blob on-chain.",
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
      "The protocol is designed to prove humanness without identifying the person. The protocol does not require a name, email, document, face scan, or social account.",
  },
  {
    icon: "lock",
    title: "One-way commitment",
    description:
      "Poseidon commits to the fingerprint and a large random salt. Its preimage resistance and the hidden salt prevent direct recovery from the commitment under the protocol's threat model.",
  },
  {
    icon: "shield",
    title: "Data minimization by design",
    description:
      "The architecture limits raw-data movement and separates transient validation inputs from persistent protocol state. Each deployer must still assess its own legal and regulatory obligations.",
  },
];
