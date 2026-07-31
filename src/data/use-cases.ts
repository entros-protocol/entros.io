import type { UseCase } from "./types";

export const useCases: UseCase[] = [
  {
    icon: "airdrop",
    title: "Sybil-Resistant Airdrops",
    problem:
      "Wallet farmers claim thousands of allocations meant for real users.",
    solution:
      "Ask for a verification at the claim, then read the Trust Score. One proves the person is there. The other shows how consistently that wallet has verified.",
  },
  {
    icon: "vote",
    title: "Verified Governance",
    problem:
      "Token-weighted governance is plutocracy by default. A wealthy attacker can ratify their own theft (Mango 2022) or spam-clear quorum with self-funded proposals.",
    solution:
      "Realms voter-weight plugin gates voting on a verified-personhood Trust Score rather than a token balance. One human, one vote, on any device.",
  },
  {
    icon: "bot",
    title: "Bot-Free Platforms",
    problem:
      "Social feeds, marketplaces, and games overrun by automated accounts.",
    solution:
      "Verify at signup, or gate agents on a verified human operator and their Trust Score. No identity or hardware data collected.",
  },
];
