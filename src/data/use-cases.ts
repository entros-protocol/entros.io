import type { UseCase } from "./types";

export const useCases: UseCase[] = [
  {
    icon: "airdrop",
    title: "Sybil-Resistant Airdrops",
    problem:
      "Wallet farmers claim thousands of allocations meant for real users.",
    solution:
      "Ask for a fresh verification at the claim, then read Trust Score and recency. The result shows that the wallet passed the current Entros policy and records its verification history.",
  },
  {
    icon: "vote",
    title: "Verified Governance",
    problem:
      "Token-weighted governance is plutocracy by default. A wealthy attacker can ratify their own theft (Mango 2022) or spam-clear quorum with self-funded proposals.",
    solution:
      "The devnet voter-weight program can assign one unit to an eligible Anchor. A Realms client and population-level uniqueness evidence remain planned before one-person-one-vote becomes a supported outcome.",
  },
  {
    icon: "bot",
    title: "Bot-Resistant Platforms",
    problem:
      "Social feeds, marketplaces, and games overrun by automated accounts.",
    solution:
      "Run Entros at signup, or gate agents on a wallet that completed verification. Entros requires no name, document, face scan, or social account.",
  },
];
