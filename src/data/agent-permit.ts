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

export interface AgentPermitRunStep {
  outcome: string;
  detail: string;
}

/** The devnet run recorded on 2026-09-12 with the reference consumer. */
export const agentPermitRun = {
  agent: "m8b6ADwZUqL3JNazingq5VKJBmFeS8Rz1w487i4must",
  bindTransaction:
    "2ibwWdAH4PVJ763r1NWBWDG88ZSGsDjLJSUL1vq7Tv7KTBuLxaPkV3CVcRSWRtCfjqjmR4aRU6Mx423s6rHmT4Y8",
  transferTransaction:
    "5nKQ1t5f9DzCjAfhTKbehTS2epqQwyv6uv6NSu1UnxqXqgfkM1FJwnz3k3g6Heh8XZsasEmDh1EaFsa1b9sGr2qp",
  steps: [
    { outcome: "Action ran once", detail: "The owner signed one permit and the agent presented it." },
    { outcome: "Same permit again", detail: "Refused. One permit covers one action." },
    { outcome: "Copy with another key", detail: "Refused before any chain read." },
    { outcome: "Held past expiry", detail: "Refused before any chain read." },
    { outcome: "Held through a sale", detail: "Refused. The agent had a new owner." },
  ] satisfies AgentPermitRunStep[],
};
