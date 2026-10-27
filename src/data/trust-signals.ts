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
    name: "Red-Team Testing",
    description: "Adversarial testing with published, scoped results.",
    detail:
      "Published T1 through T4b campaigns report attack class, denominator and observed pass rate. T5 is open. An external audit gates mainnet.",
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
    description: "Integrations mapped across Solana.",
    detail:
      "Best-effort SAS issuance and Agent Operator Permits run on devnet. The Realms voter-weight program is a prototype, and client work remains open.",
    href: "/solutions",
  },
  {
    icon: "zap",
    name: "Devnet Live",
    description: "Programs deployed and accepting requests.",
    detail:
      "The three programs and the hosted verification flow run on Solana devnet. Mainnet waits on hardening, a trusted-setup ceremony and an external audit.",
    href: "/verify",
  },
];
