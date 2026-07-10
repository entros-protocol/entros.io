export interface TrustSignal {
  icon: string;
  name: string;
  description: string;
  detail: string;
  href: string;
}

export const trustSignals: TrustSignal[] = [
  {
    icon: "shield",
    name: "Security Audit",
    description: "Continuously red-teamed, 0% production pass.",
    detail:
      "17,000+ adversarial attempts across four tiers, 0% got through. Anchor constraints, PDA validation, and compute budget tested. External firm review ahead of mainnet.",
    href: "/security",
  },
  {
    icon: "github",
    name: "Open Protocol",
    description: "Protocol layer is fully public.",
    detail:
      "MIT licensed. 3 Anchor programs, 1 Circom circuit, 1 TypeScript SDK on GitHub. Server-side validation models are proprietary—open protocol for trust, private defense for security.",
    href: "https://github.com/entros-protocol",
  },
  {
    icon: "globe",
    name: "Ecosystem Fit",
    description: "Integration surfaces mapped across Solana.",
    detail:
      "SAS attestation issuer (live), Agent Anchor on 8004 registry (live on devnet), Realms voter-weight plugin (shipped on devnet). Integration surfaces mapped for Jupiter, Drift, Metaplex, Marinade, Tensor, Magic Eden, and Phantom.",
    href: "/solutions",
  },
  {
    icon: "zap",
    name: "Devnet Live",
    description: "Programs deployed and accepting requests.",
    detail:
      "Full test suite passing across all repos. Verification pipeline operational on Solana devnet.",
    href: "/verify",
  },
];
