/** Settlement snippet, sized to its longest line like the home page snippet. */
export function AgentPermitSnippet() {
  return (
    <div tabIndex={0} className="overflow-x-auto bg-background p-6 font-mono text-sm forced-colors:border forced-colors:border-[CanvasText] md:p-8">
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
        <span className="text-solana-purple">{"readAgentState"}</span>
        {"({ agent, connection });\n"}
        <span className="text-cyan">{"const"}</span>
        {" result = "}
        <span className="text-solana-purple">{"evaluateAgentPermit"}</span>
        {"({\n  request, operatorSignature, presentationSignature,\n  agentState, operatorEvidence, nowSeconds,\n});\n"}
        <span className="text-muted">{'// result.decision: "allow" | "deny" | "unavailable"'}</span>
      </pre>
    </div>
  );
}
