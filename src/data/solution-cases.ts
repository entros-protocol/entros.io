import type { SolutionCase } from "./types";

export const solutionCases: SolutionCase[] = [
  {
    icon: "airdrop",
    title: "Sybil-Resistant Airdrops",
    category: "DeFi",
    problem:
      "Jupiter filtered 750,000+ wallets as sybil before Jupuary 2025 distribution. The 2026 round was cut sharply by DAO vote and postponed. Every major Solana airdrop relitigates sybil from scratch because existing wallet filters do not carry a reusable verification history across applications.",
    solution:
      "Ask for a fresh verification at the claim, then read the Anchor. The result shows that the wallet passed the current policy. Trust Score records weekly verification span and account age.",
    example:
      "An airdrop integrator can run a twelve-second behavioral capture at the claim. It can also require Trust Score, recency, token-balance, and activity rules. Eligible wallets must pass every selected policy.",
  },
  {
    icon: "vote",
    title: "Verified Governance",
    category: "DAOs",
    problem:
      "Token-weighted governance fails at predictable moments. Mango Markets 2022: Avi Eisenberg used his MNGO position to vote a proposal keeping $47M of his own oracle-manipulation drain. Chainalysis found that across major DAOs, under 1% of holders control over 90% of voting power, with turnout typically below 10%. Token weight is not community will.",
    solution:
      "The devnet voter-weight program reads an Entros Anchor and can assign one unit to an eligible wallet. The planned Realms client can insert that check into governed actions.",
    example:
      "A future Realms integration can gate voting on Trust Score and recency. The on-chain addin prototype is deployed on devnet. Client registration, plugin chaining, and population-level uniqueness remain open.",
  },
  {
    icon: "gamepad",
    title: "Fair Mints and Competitions",
    category: "NFT / DeFi",
    problem:
      "NFT drops at launch are bot-minted at scale. Referral programs and trading competitions on perp DEXes get sybil-farmed across hundreds of accounts. Filtering wallets without collecting identity documents remains a gap.",
    solution:
      "Mint gate: require a fresh Entros result and an Anchor policy. Competition entry: require Anchor age and recency. The validation service checks each capture before the wallet transaction proceeds.",
    example:
      "An NFT marketplace can require Entros verification at mint on a per-collection basis. A perp DEX can gate referral-multiplier rewards or competition entry on a verification at entry plus a Trust Score floor. An optional eligibility tier on top of existing rules, not a KYC replacement.",
  },
  {
    icon: "palette",
    title: "Creator Verification",
    category: "Creators",
    problem:
      "Scammers mint NFT collections under stolen brands. Buyers cannot distinguish real creators from impersonators.",
    solution:
      "A planned creator integration can reference an Entros Anchor in collection metadata. Buyers could then read the wallet's verification history alongside existing provenance checks.",
    example:
      "A creator platform could include an Entros Anchor reference in Metaplex Core metadata. Marketplaces could display the linked wallet's current Entros status without treating it as legal identity verification.",
  },
  {
    icon: "bot",
    title: "Bot Prevention",
    category: "Social",
    problem:
      "Bot accounts overrun reward platforms and content distribution apps. They farm the rewards, inflate the engagement numbers, and crowd out real users.",
    solution:
      "Require Entros verification at account creation or reward claim. The private validation service applies the current capture policy before protocol settlement.",
    example:
      "A creator-rewards platform can ask for a fresh verification and read Trust Score with it. The policy can require a verification history rather than one result.",
  },
];
