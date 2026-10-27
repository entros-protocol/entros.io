import type { Feature } from "./types";

export const mobileRoadmapItems: Feature[] = [
  {
    icon: "smartphone",
    title: "Native sensor access",
    description:
      "Accelerometer, gyroscope, touch and microphone capture through native APIs, behind an Android microphone permission gate.",
    benefit:
      "Native APIs give the client direct timing control. They do not authenticate sensor origin.",
  },
  {
    icon: "activity",
    title: "Touch and motion timing research",
    description:
      "Measure whether a physical touch produces a time-aligned response in native motion sensors on supported devices.",
    benefit:
      "Native attestation can bind app and device integrity evidence to the request while this research runs.",
  },
  {
    icon: "solana",
    title: "Solana dApp Store distribution",
    description:
      "A hardened Android client for Seeker and other supported Solana Mobile devices.",
    benefit:
      "Future notifications can remind users when a policy asks for a fresh verification.",
  },
];
