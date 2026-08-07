export interface FlyWheelStep {
  step: string;
  description: string;
}

export interface SupplyPrinciple {
  title: string;
  description: string;
}

export interface TokenUtility {
  title: string;
  description: string;
}

export const protocolFee = {
  amount: "~0.005 SOL",
  destination: "Protocol treasury PDA",
  description:
    "Every verification deposits a small protocol fee into an on-chain treasury PDA. The fee is configurable by the protocol admin and auditable by anyone on Solana Explorer.",
};

export const flywheel: FlyWheelStep[] = [
  {
    step: "Humans verify",
    description:
      "A wallet completes Entros verification and pays the configured SOL fee in its protocol transaction.",
  },
  {
    step: "Protocol earns",
    description:
      "Fees accrue in the on-chain treasury PDA as auditable SOL revenue, without an integrator billing relationship.",
  },
  {
    step: "Integrators build on it",
    description:
      "Sybil-sensitive apps gate on Entros for airdrops, governance, and agent checks. Each integration drives more genuine verifications.",
  },
  {
    step: "$ENTROS utility expands",
    description:
      "The roadmap adds validator staking, capacity tiers, and economic governance after those mechanisms pass specification, audit, and deployment gates.",
  },
  {
    step: "The network compounds",
    description:
      "The intended model links protocol use to validator security and future token utility as the network decentralizes.",
  },
];

export const supplyPrinciples: SupplyPrinciple[] = [
  {
    title: "Fair launch",
    description:
      "A fixed supply on an open launch. No presale, no private round, no VC allocation.",
  },
  {
    title: "Bought and locked",
    description:
      "The team's tokens were bought on the open market at launch and are locked in public Streamflow contracts anyone can inspect.",
  },
  {
    title: "Value from utility",
    description:
      "Planned staking, capacity, and governance mechanisms connect $ENTROS to protocol operation after mainnet hardening.",
  },
];

export const tokenUtilities: TokenUtility[] = [
  {
    title: "Validator Staking",
    description:
      "Planned validators will stake $ENTROS as collateral. The reward and slashing design must define measurable accuracy, appeal, and failure handling before implementation.",
  },
  {
    title: "Delegation",
    description:
      "Planned delegation will let holders support a validator and share its rewards and penalties. Delegation activates only after validator economics ship.",
  },
  {
    title: "Capacity Tiers",
    description:
      "Planned capacity tiers can let large integrators stake $ENTROS for reserved throughput after mainnet. Current integrations use the configured per-verification fee.",
  },
  {
    title: "Economic Governance",
    description:
      "Planned governance covers treasury allocation, fees, validator policy, and ecosystem funding. Private detector parameters will remain outside token voting.",
  },
];

export const launchDetails = {
  mechanism: "Fair launch",
  airdrop:
    "No presale and no VC round. Any future revenue distribution requires a public mechanism, security review, and governance approval.",
  standard: "SPL Token on Solana",
  supply: "Fixed at genesis",
};
