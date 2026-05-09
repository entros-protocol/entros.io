import type { ProtocolComponent } from "./types";

export const protocolComponents: ProtocolComponent[] = [
  {
    icon: "pulse",
    title: "Pulse SDK",
    subtitle: "Client-side capture and proving",
    description:
      "A TypeScript library that runs on the user's phone or browser. It captures sensor data, extracts features, generates the TBH commitment, and produces the ZK proof. Raw biometric data never leaves this library—only derived statistical features and the proof are transmitted.",
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
      "A Groth16 circuit that proves two Poseidon-committed TBH values are within Hamming distance t of each other. The circuit runs at proving time on the user's device. The verifier learns only that the threshold check passed.",
    highlights: [
      "Groth16 over BN254 curve",
      "Poseidon hash for ZK efficiency",
      "Under 200K compute units on-chain",
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
      "The entros-verifier program checks ZK proofs. The entros-anchor program manages non-transferable identity tokens (SPL Token-2022). The entros-registry tracks Trust Scores, validator staking, and protocol configuration.",
    highlights: [
      "Anchor framework with full constraint validation",
      "Non-transferable token via Token-2022 extension",
      "Trust Score from verification count and age",
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
      "A Rust service that generates signed challenges and issues SAS attestations against verified wallets. The public protocol layer—open source for trust and auditability.",
    highlights: [
      "Server-generated signed challenges (anti-bot)",
      "SAS attestation issuance",
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
      "A private Rust crate that analyzes the 308-dimensional statistical feature summary for synthetic artifacts, cross-modality inconsistencies, and Sybil patterns. The defense layer—proprietary because the asymmetry between attackers and defenders demands it. The protocol is open so you can trust it. The validation is private so attackers can't bypass it.",
    highlights: [
      "TTS and synthetic data detection",
      "Cross-wallet fingerprint registry (Sybil detection)",
      "Cross-modality behavioral coupling enforcement",
      "Adaptive thresholds with zero information leakage",
    ],
    links: [],
  },
];
