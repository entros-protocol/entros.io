import type { Feature } from "./types";

export const mobileRoadmapItems: Pick<Feature, "icon" | "title" | "description">[] = [
  {
    icon: "smartphone",
    title: "Native sensors",
    description: "Microphone, motion and touch through Android's native APIs.",
  },
  {
    icon: "activity",
    title: "Touch and motion research",
    description: "Testing whether a real touch shows up in the phone's motion sensors.",
  },
  {
    icon: "solana",
    title: "Solana dApp Store",
    description: "Built for Seeker and other Solana Mobile devices.",
  },
];
