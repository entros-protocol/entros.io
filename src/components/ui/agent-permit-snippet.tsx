/** Settlement snippet, sized to its longest line like the home page snippet. */
export function AgentPermitSnippet() {
  return (
    <div className="overflow-x-auto rounded-2xl bg-foreground/[0.06] p-6 font-mono text-sm md:p-8">
      <pre className="leading-relaxed text-foreground">
        <span className="text-cyan">{"import"}</span>
        {" { readAgentState } "}
        <span className="text-cyan">{"from"}</span>{" "}
        <span className="text-solana-green">{"'@entros/pulse-sdk'"}</span>
        {";\n"}
        <span className="text-cyan">{"import"}</span>
        {" { evaluateAgentPermit } "}
        <span className="text-cyan">{"from"}</span>{" "}
        <span className="text-solana-green">{"'@entros/verify/agent-permit'"}</span>
        {";\n\n"}
        <span className="text-cyan">{"const"}</span>
        {" agentState = "}
        <span className="text-cyan">{"await"}</span>{" "}
        <span className="text-[#C084FC]">{"readAgentState"}</span>
        {"({ agent, connection });\n"}
        <span className="text-cyan">{"const"}</span>
        {" result = "}
        <span className="text-[#C084FC]">{"evaluateAgentPermit"}</span>
        {"({\n  request, operatorSignature, presentationSignature,\n  agentState, operatorEvidence, nowSeconds,\n});\n"}
        <span className="text-foreground/40">{'// result.decision: "allow" | "deny" | "unavailable"'}</span>
      </pre>
    </div>
  );
}
