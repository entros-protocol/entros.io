import type { SolutionCase } from "./types";

export const solutionCases: SolutionCase[] = [
  {
    icon: "airdrop",
    title: "Sybil-Resistant Airdrops",
    category: "DeFi",
    problem:
      "Jupiter filtered 750,000+ wallets as sybil before Jupuary 2025, and the 2026 round was cut by DAO vote. Every major Solana airdrop relitigates sybil from scratch; no filter carries a reusable verification history.",
    solution:
      "Ask for a fresh verification at the claim, then read the Anchor. Trust Score adds weekly verification span and account age.",
    example:
      "An airdrop integrator can require the paired-round verification at the claim (three rounds, each one word and one short path) plus Trust Score, recency, token-balance, and activity rules. Eligible wallets must pass every selected policy.",
  },
  {
    icon: "vote",
    title: "Verified Governance",
    category: "DAOs",
    problem:
      "Token-weighted governance fails at predictable moments. Mango Markets 2022: Avi Eisenberg voted his MNGO position to protect his own $47M oracle-manipulation drain. Chainalysis found under 1% of holders control over 90% of voting power across major DAOs. Token weight is not community will.",
    solution:
      "The devnet voter-weight program reads an Entros Anchor and writes weight 1 for an eligible wallet. A planned Realms client inserts that check into governed actions.",
    example:
      "A future Realms integration can gate voting on Trust Score and recency. Client registration, chaining, and population-level uniqueness remain open.",
  },
  {
    icon: "gamepad",
    title: "Fair Mints and Competitions",
    category: "NFT / DeFi",
    problem:
      "NFT drops get bot-minted at launch; referral programs and perp-DEX competitions get sybil-farmed across hundreds of accounts. Filtering wallets without ID documents remains a gap.",
    solution:
      "Mint gate: a fresh Entros result and an Anchor policy. Competition entry: Anchor age and recency. The validation service checks each capture before the transaction proceeds.",
    example:
      "An NFT marketplace can require verification at mint per collection; a perp DEX can gate referral rewards or competition entry on a verification plus a Trust Score floor. An optional eligibility tier; it does not replace KYC.",
  },
  {
    icon: "palette",
    title: "Creator Verification",
    category: "Creators",
    problem:
      "Scammers mint NFT collections under stolen brands. Buyers cannot distinguish real creators from impersonators.",
    solution:
      "A planned creator integration can reference an Entros Anchor in collection metadata.",
    example:
      "A creator platform could include an Entros Anchor in Metaplex Core metadata; marketplaces could display the linked wallet's Entros status without treating it as legal identity verification.",
  },
  {
    icon: "bot",
    title: "Bot Prevention",
    category: "Social",
    problem:
      "Bot accounts overrun reward platforms and content apps: they farm rewards, inflate engagement, and crowd out real users.",
    solution:
      "Require Entros verification at account creation or reward claim. The validation service applies the capture policy before settlement.",
    example:
      "A creator-rewards platform can pair a fresh verification with a Trust Score read, and require a history rather than one result.",
  },
];
