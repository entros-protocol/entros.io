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
      "A person proves they are a live human and pays a small SOL fee, in the same transaction as the ZK proof. One signature, one prompt.",
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
    title: "No insider unlocks",
    description:
      "No team cliff hanging over the market. Any team-held tokens are bought on the same terms as everyone else and locked in public.",
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
    title: "Governance",
    description:
      "Holders vote on protocol parameters: the verification fee, Trust Score weights, threshold policy, and how protocol revenue is used. One token, one vote.",
  },
  {
    title: "Capacity Tiers",
    description:
      "Large integrators stake $ENTROS for priority access and bulk verification, replacing per-verification fees with a staking model at scale.",
  },
];

export const launchDetails = {
  mechanism: "Fair launch",
  airdrop:
    "No presale and no VC round. As the protocol earns, a share of revenue rewards verified humans over bot farms. Real users, prioritized.",
  standard: "SPL Token-2022 with Confidential Balances",
  supply: "Fixed at genesis",
};
