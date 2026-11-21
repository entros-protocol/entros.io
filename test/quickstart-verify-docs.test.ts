import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "..");

function readRepoFile(relPath: string): string {
  return readFileSync(resolve(ROOT, relPath), "utf8");
}

describe("quickstart docs for @entros/verify/solana and @entros/verify/mcp", () => {
  const quickstartMeta = JSON.parse(
    readRepoFile("content/docs/quickstart/meta.json"),
  ) as { pages: string[] };
  const readTrustScore = readRepoFile(
    "content/docs/quickstart/read-trust-score.mdx",
  );
  const mcpApproval = readRepoFile("content/docs/quickstart/mcp-approval.mdx");
  const verifyPopup = readRepoFile("content/docs/quickstart/verify-popup.mdx");
  const pkg = JSON.parse(readRepoFile("package.json")) as {
    dependencies: Record<string, string>;
  };

  it("registers mcp-approval in quickstart navigation", () => {
    expect(quickstartMeta.pages).toContain("read-trust-score");
    expect(quickstartMeta.pages).toContain("mcp-approval");
    expect(quickstartMeta.pages).toContain("verify-popup");
  });

  it("keeps published npm versions pinned in entros.io/package.json", () => {
    expect(pkg.dependencies["@entros/verify"]).toBe("0.6.0");
    expect(pkg.dependencies["@entros/pulse-sdk"]).toBe("4.18.0");
  });

  it("documents zero-GPL devnet readers and MCP single-use approvals with honest release status", () => {
    expect(readTrustScore).toContain("@entros/verify/solana");
    expect(readTrustScore).toContain("readIntegratorEvidence");
    expect(readTrustScore).toContain("verifyEntrosAttestation");
    expect(readTrustScore).toContain("zero GPL");
    expect(readTrustScore).toContain("0.6.0");
    expect(readTrustScore).toContain("0.7.0");
    expect(readTrustScore).toContain("Solana devnet");

    expect(mcpApproval).toContain("@entros/verify/mcp");
    expect(mcpApproval).toContain("createMcpApprovalChallenge");
    expect(mcpApproval).toContain("verifyMcpApprovalSettlement");
    expect(mcpApproval).toContain("mcp_approval_request");
    expect(mcpApproval).toContain("HumanLayer");
    expect(mcpApproval).toContain("verifiedAt");
    expect(mcpApproval).toContain("browser_unattested");
    expect(mcpApproval.toLowerCase()).toContain(
      "does not prove human presence",
    );

    expect(verifyPopup).toContain("/docs/quickstart/read-trust-score");
    expect(verifyPopup).toContain("/docs/quickstart/mcp-approval");
  });

  it("enforces public-copy discipline across updated quickstart docs", () => {
    for (const [name, content] of [
      ["read-trust-score.mdx", readTrustScore],
      ["mcp-approval.mdx", mcpApproval],
      ["verify-popup.mdx", verifyPopup],
    ] as const) {
      expect(content, `${name} em dash`).not.toContain("\u2014");
      expect(content, `${name} internal issue id`).not.toMatch(/#\d+\b/);
      expect(content, `${name} sprint/queue id`).not.toMatch(
        /\b(Q4\.[123]|Sprint\s*2[234])\b/i,
      );
      const lower = content.toLowerCase();
      for (const banned of [
        "unspoofable",
        "sybil-proof",
        "cannot be spoofed",
        "mainnet-ready",
        "cost of attack",
        "expensive to fake",
      ]) {
        expect(lower, `${name} banned phrase ${banned}`).not.toContain(banned);
      }
    }
  });
});
