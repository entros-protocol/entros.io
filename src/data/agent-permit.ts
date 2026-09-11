export interface AgentPermitStep {
  number: string;
  title: string;
  description: string;
}

export const agentPermitSteps: AgentPermitStep[] = [
  {
    number: "01",
    title: "Bind the agent key",
    description:
      "The owner records the agent's own key in the Solana Agent Registry with one devnet transaction. The key stops counting when the agent changes hands.",
  },
  {
    number: "02",
    title: "Sign one request",
    description:
      "The app writes a request for one action, and the agent sends its owner a link. The owner reviews it on entros.io and signs with the wallet that owns the agent.",
  },
  {
    number: "03",
    title: "Present and settle",
    description:
      "The agent adds its own signature and presents the permit. The app checks it against the chain and runs the action once.",
  },
];

/** What the app checks when the action runs. */
export const agentPermitChecks = [
  "The signer still owns the agent.",
  "The signer's Entros verification meets the app's rules.",
  "The agent's own key handed the permit in.",
];

// Ten characters at most, so each label holds one line in the narrowest diagram column.
export const agentPermitProperties = ["Single use", "Key bound", "Live check"];
