import { describe, expect, it } from "vitest";
import { generateAnchorCode } from "../src/components/sections/integrate-sandbox-client";

describe("Sandbox Anchor Template Schema (Item #11 / Item #200 alignment)", () => {
  it("generates Rust Anchor code using identity.last_verification_timestamp", () => {
    const code = generateAnchorCode(0.75);

    // Verify the exact Anchor on-chain field name is present
    expect(code).toContain("identity.last_verification_timestamp >= clock.unix_timestamp - 86400");
    
    // Ensure the deprecated/incorrect field name is absent
    expect(code).not.toContain("identity.last_verified");
  });

  it("correctly calculates trust_score threshold based on riskCeiling parameter", () => {
    // For riskCeiling = 0.75 -> threshold is (1 - 0.75) * 100 = 25
    const code75 = generateAnchorCode(0.75);
    expect(code75).toContain("identity.trust_score >= 25");

    // For riskCeiling = 0.50 -> threshold is (1 - 0.50) * 100 = 50
    const code50 = generateAnchorCode(0.50);
    expect(code50).toContain("identity.trust_score >= 50");
  });

  it("includes correct Account struct reference for IdentityState", () => {
    const code = generateAnchorCode(0.75);
    expect(code).toContain("pub identity_state: Account<'info, IdentityState>");
    expect(code).toContain("use entros_registry::state::IdentityState;");
  });
});
