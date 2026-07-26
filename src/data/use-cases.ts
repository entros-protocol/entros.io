import type { UseCase } from "./types";

export const useCases: UseCase[] = [
  {
    icon: "airdrop",
    title: "Sybil-Resistant Airdrops",
    problem:
      "Wallet farmers claim thousands of allocations meant for real users.",
    solution:
      "Gate claims on Trust Score. Every wallet must pass live behavioral verification, again and again, to build one.",
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
      "Filter bots at signup, or gate access to agents with a verified human operator and Trust Score. No identity or hardware data collected.",
  },
];
