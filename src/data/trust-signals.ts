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
    description: "Continuous adversarial testing with scoped results.",
    detail:
      "Published T1 through T4b campaigns report their attack class, denominator, and observed pass rate. T5 remains open. External review remains a mainnet gate.",
    href: "/security",
  },
  {
    icon: "github",
    name: "Open Protocol",
    description: "Client and on-chain protocol are public.",
    detail:
      "MIT licensed. 3 Anchor programs, 1 Circom circuit, 1 TypeScript SDK on GitHub. The server-side validation models stay proprietary.",
    href: "https://github.com/entros-protocol",
  },
  {
    icon: "globe",
    name: "Ecosystem Fit",
    description: "Integration surfaces mapped across Solana.",
    detail:
      "Best-effort SAS issuance and Agent Anchor run on devnet. The Realms voter-weight program is an on-chain prototype. Client integration work remains open.",
    href: "/solutions",
  },
  {
    icon: "zap",
    name: "Devnet Live",
    description: "Programs deployed and accepting requests.",
    detail:
      "The three protocol programs and the hosted verification flow run on Solana devnet. Mainnet remains gated on hardening, ceremony, and audit.",
    href: "/verify",
  },
];
