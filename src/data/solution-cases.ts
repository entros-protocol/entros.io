import type { SolutionCase } from "./types";

export const solutionCases: SolutionCase[] = [
  {
    icon: "airdrop",
    title: "Sybil-Resistant Airdrops",
    category: "DeFi",
    problem:
      "Jupiter filtered 750,000+ wallets as sybil before Jupuary 2025 distribution. The 2026 round was cut sharply by DAO vote and postponed. Every major Solana airdrop relitigates sybil from scratch because existing identity checks verify a moment, not sustained human presence over time.",
    solution:
      "Ask for a verification at the claim, then read the Anchor. The claim is gated on someone present, and the Trust Score alongside it shows how consistently that wallet has verified. Scoring rewards span over frequency, so 100 verifications in one day count for one week of history.",
    example:
      "An airdrop integrator runs a twelve-second verification at the claim and requires a Trust Score floor alongside it, say 200 for at least two verifications spaced over time. The protocol stays public and open. Only verified humans pass the eligibility tier, alongside existing token-balance and activity rules.",
  },
  {
    icon: "vote",
    title: "Verified Governance",
    category: "DAOs",
    problem:
      "Token-weighted governance fails at predictable moments. Mango Markets 2022: Avi Eisenberg used his MNGO position to vote a proposal keeping $47M of his own oracle-manipulation drain. Chainalysis found that across major DAOs, under 1% of holders control over 90% of voting power, with turnout typically below 10%. Token weight is not community will.",
    solution:
      "Voters must hold an Entros Anchor with minimum Trust Score and recent verification. The Realms voter-weight plugin reads that Anchor before it reads the balance. The whale's bag becomes one vote, and clearing quorum takes verified humans.",
    example:
      "A DAO using Realms gates voting on Entros Trust Score alongside its existing token rules. One human, one vote, verified in 12 seconds on any device. Plugin shipped on devnet, spl-governance compatible.",
  },
  {
    icon: "gamepad",
    title: "Fair Mints and Competitions",
    category: "NFT / DeFi",
    problem:
      "NFT drops at launch are bot-minted at scale. Referral programs and trading competitions on perp DEXes get sybil-farmed across hundreds of accounts. Filtering wallets without collecting identity documents remains a gap.",
    solution:
      "Mint gate: one human per allocation, verified by Anchor. Competition entry: require Anchor age > 30 days and recent verification. Short-lived bot accounts with zero trust cannot qualify. Every capture is validated server-side before an Anchor is issued, and an Anchor is not free to hold.",
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
      "Creators register with an Entros Anchor. Collection metadata includes a cryptographic commitment to the creator's Anchor. Buyers verify provenance on-chain. The Anchor's Trust Score signals how long the creator has maintained their verified identity.",
    example:
      "A creator-tooling platform on Metaplex Core can include an Entros Anchor reference in collection metadata. Marketplaces displaying that metadata can render a 'Verified Creator' badge for Anchored artists. Token-2022 NonTransferable + Metaplex Core compose natively—the same primitive choices Entros's Agent Anchor uses today.",
  },
  {
    icon: "bot",
    title: "Bot Prevention",
    category: "Social",
    problem:
      "Bot accounts overrun reward platforms and content distribution apps. They farm the rewards, inflate the engagement numbers, and crowd out real users.",
    solution:
      "Require Entros verification at account creation or reward claim. The closed-source defense layer rejects synthetic inputs before they reach the chain.",
    example:
      "A creator-rewards platform can ask for a verification at the claim and read the Trust Score with it. Synthetic voice, motion and touch are rejected server-side before an Anchor is issued, and the floor can require a verification history rather than a single pass.",
  },
];
