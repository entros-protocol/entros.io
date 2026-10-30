import type { ProtocolComponent } from "./types";

export const protocolComponents: ProtocolComponent[] = [
  {
    icon: "pulse",
    title: "Pulse SDK",
    subtitle: "Capture and proving on your device",
    description:
      "A TypeScript library that records the rounds, extracts the 308 features and builds the commitment and proof.",
    highlights: [
      "Browser and React Native",
      "Groth16 proving in the browser",
      "One-call verification through the wallet adapter",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/entros-protocol/pulse-sdk" },
      { label: "npm", href: "https://www.npmjs.com/package/@entros/pulse-sdk" },
    ],
  },
  {
    icon: "proof",
    title: "ZK Circuit",
    subtitle: "Hamming distance in zero knowledge",
    description:
      "A Groth16 circuit proves two Poseidon commitments open to fingerprints within the configured distance range. It does not prove where a capture came from.",
    highlights: [
      "Groth16 over BN254",
      "Poseidon commitments",
      "Verified on chain in under 200,000 compute units",
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
      "entros-verifier checks proofs. entros-anchor holds the non-transferable Anchor and Trust Score. entros-registry holds protocol configuration and treasury state.",
    highlights: [
      "Non-transferable Token-2022 Anchor",
      "Trust Score from active weekly bins and account age",
      "Accounts derived from your wallet",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/entros-protocol/protocol-core" },
    ],
  },
  {
    icon: "server",
    title: "Executor Node",
    subtitle: "Challenges and relay",
    description:
      "A Rust gateway that issues signed challenges, applies integrator quotas, forwards evidence to the validator and relays protocol writes.",
    highlights: [
      "Signed challenges for every session",
      "Per-integrator API keys and rate limits",
      "Best-effort SAS attestation",
    ],
    links: [
      { label: "GitHub", href: "https://github.com/entros-protocol/executor-node" },
    ],
  },
  {
    icon: "shield",
    title: "Validation Service",
    subtitle: "Private defense layer",
    description:
      "A private Rust service screens each capture for synthetic audio, unusual signal statistics and fingerprints seen on other wallets. The protocol stays open. Detection thresholds stay private because they would guide an attacker.",
    highlights: [
      "Synthetic audio detection",
      "Cross-wallet fingerprint registry",
      "Uniform public failure reasons",
    ],
    links: [],
  },
];
