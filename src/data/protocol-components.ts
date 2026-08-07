import type { ProtocolComponent } from "./types";

export const protocolComponents: ProtocolComponent[] = [
  {
    icon: "pulse",
    title: "Pulse SDK",
    subtitle: "Client-side capture and proving",
    description:
      "A TypeScript library that captures sensor data, extracts 308 features, creates commitments, and produces ZK proofs. Raw motion and full-resolution touch stay on the device. Phrase audio and derived evidence go to the validation path.",
    highlights: [
      "Browser and React Native support",
      "Audio, IMU, and touch capture in parallel",
      "On-device Groth16 proof generation",
      "Wallet-adapter integration for one-call verification",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/entros-protocol/pulse-sdk" },
      { label: "npm", href: "https://www.npmjs.com/package/@entros/pulse-sdk" },
    ],
  },
  {
    icon: "proof",
    title: "ZK Circuit",
    subtitle: "Hamming distance verification",
    description:
      "A Groth16 circuit that proves two Poseidon commitments open correctly and their Hamming distance falls inside the configured range. It does not prove capture provenance.",
    highlights: [
      "Groth16 over BN254 curve",
      "Poseidon hash for ZK efficiency",
      "On-chain Groth16 verification",
      "Proof generation targets under 5 seconds on mobile",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/entros-protocol/circuits" },
    ],
  },
  {
    icon: "anchor",
    title: "On-Chain Programs",
    subtitle: "Three Solana programs",
    description:
      "The entros-verifier program checks ZK proofs. The entros-anchor program stores Trust Score and manages non-transferable Token-2022 Anchors. The entros-registry stores protocol configuration, treasury state, and validator-registration scaffolding.",
    highlights: [
      "Anchor framework with full constraint validation",
      "Non-transferable token via Token-2022 extension",
      "Trust Score from active weekly bins and account age",
      "PDA-derived identity (one per wallet)",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/entros-protocol/protocol-core" },
    ],
  },
  {
    icon: "server",
    title: "Executor Node",
    subtitle: "Off-chain relay and challenge service",
    description:
      "A Rust gateway that issues challenges, authenticates integrators, applies quotas, forwards evidence to the private validator, relays protocol writes, and attempts SAS issuance.",
    highlights: [
      "Server-generated signed challenges (anti-bot)",
      "Best-effort SAS attestation issuance",
      "Per-integrator API-key rate limiting",
      "Configurable CORS and per-IP throttles",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/entros-protocol/executor-node" },
    ],
  },
  {
    icon: "shield",
    title: "Validation Service",
    subtitle: "Proprietary defense layer",
    description:
      "A private Rust crate that analyzes the 308-dimensional statistical feature summary for synthetic artifacts, submitted-signal statistics, and Sybil patterns. Protocol behavior remains open and auditable. Detection thresholds and model internals stay private because they provide calibration data to an attacker.",
    highlights: [
      "TTS and synthetic data detection",
      "Cross-wallet fingerprint registry (Sybil detection)",
      "Cross-signal research telemetry (devnet)",
      "Uniform public failure classes",
    ],
    links: [],
  },
];
