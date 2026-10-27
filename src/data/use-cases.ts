import type { UseCase } from "./types";

export const useCases: UseCase[] = [
  {
    icon: "airdrop",
    title: "Sybil-Resistant Airdrops",
    problem:
      "Wallet farmers claim thousands of allocations meant for real users.",
    solution:
      "Ask for a fresh verification at the claim, then read Trust Score and recency from chain.",
  },
  {
    icon: "vote",
    title: "Verified Governance",
    problem:
      "Token-weighted governance is plutocracy by default. A wealthy attacker can ratify their own theft (Mango 2022) or spam quorum with self-funded proposals.",
    solution:
      "On devnet, an eligible Entros Anchor gets one unit of voting weight. One person, one vote waits on Realms client support and uniqueness evidence.",
  },
  {
    icon: "bot",
    title: "Bot-Resistant Platforms",
    problem:
      "Social feeds, marketplaces, and games overrun by automated accounts.",
    solution:
      "Run Entros at signup or gate agents on a verified owner wallet. No name, document, face scan or social account.",
  },
];
