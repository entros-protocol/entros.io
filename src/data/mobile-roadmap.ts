import type { Feature } from "./types";

export const mobileRoadmapItems: Feature[] = [
  {
    icon: "smartphone",
    title: "Native sensor access",
    description:
      "Direct accelerometer, gyroscope, touch, and microphone capture through native APIs with an Android microphone permission gate.",
    benefit:
      "Native APIs give the client direct timing control. They do not authenticate sensor origin.",
  },
  {
    icon: "activity",
    title: "Touch and motion timing research",
    description:
      "Measure whether a physical touch produces a time-aligned response in native motion sensors across supported devices.",
    benefit:
      "Native attestation can bind app and device integrity evidence to the submitted request while this signal is evaluated.",
  },
  {
    icon: "solana",
    title: "Solana dApp Store distribution",
    description:
      "Publish a hardened Android client for Seeker and other supported Solana Mobile devices.",
    benefit:
      "Future notification support can remind users when a policy requires a fresh verification.",
  },
];
