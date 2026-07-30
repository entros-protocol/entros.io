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
      "A person proves they are a live human and pays a small SOL fee, in the same transaction as the ZK proof.",
  },
  {
    step: "Protocol earns",
    description:
      "Fees accrue in the on-chain treasury PDA as real SOL revenue. Transparent, auditable, no off-chain billing. Unlike a memecoin, the network behind the token earns from genuine usage.",
  },
  {
    step: "Integrators build on it",
    description:
      "Sybil-sensitive apps gate on Entros for airdrops, governance, and agent checks. Each integration drives more genuine verifications.",
  },
  {
    step: "$ENTROS secures it",
    description:
      "Validators stake $ENTROS as slashable collateral, integrators stake for capacity, and holders govern the protocol. Real usage creates real demand for the token.",
  },
  {
    step: "The network compounds",
    description:
      "More stake and more adoption harden the network, which attracts more integrators and more verifications. The loop compounds on genuine human demand.",
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
      "The team's tokens are bought on the open market at launch, not granted, and locked in public Streamflow contracts anyone can inspect.",
  },
  {
    title: "Value from utility",
    description:
      "The token secures and governs the network. As real human verification grows, so does demand to stake, access, and govern with $ENTROS.",
  },
];

export const tokenUtilities: TokenUtility[] = [
  {
    title: "Validator Staking",
    description:
      "Validators stake $ENTROS as slashable collateral to run a node in the verification network. Rewards track validation accuracy against ground-truth benchmarks, never throughput, so passing borderline captures to lift volume cannot increase yield. Activates as the validator network decentralizes.",
  },
  {
    title: "Delegation",
    description:
      "Holders who do not run a node delegate stake to a validator and share both the accuracy-weighted rewards and the slashing risk. Returns track real verification volume rather than emissions. Activates alongside validator staking.",
  },
  {
    title: "Capacity Tiers",
    description:
      "Large integrators stake $ENTROS for priority access and bulk verification, replacing per-verification fees with a staking model at scale. Activates after mainnet.",
  },
  {
    title: "Economic Governance",
    description:
      "Holders direct the protocol economy: treasury allocation, the verification fee, validator admission policy, and ecosystem funding. Voting weight combines a verified Entros Anchor with staked tokens under a lock multiplier. Detection parameters are set by calibration against measured data and red-team results, published as a changelog, and are never put to a token vote.",
  },
];

export const launchDetails = {
  mechanism: "Fair launch",
  airdrop:
    "No presale and no VC round. As the protocol earns, a share of revenue rewards verified humans over bot farms. Real users, prioritized.",
  standard: "SPL Token on Solana",
  supply: "Fixed at genesis",
};
