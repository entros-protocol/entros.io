import { describe, expect, it } from "vitest";
import { generateAnchorCode } from "../src/components/sections/integrate-sandbox-client";

describe("sandbox Anchor template", () => {
  it("generates Rust Anchor code using identity.last_verification_timestamp", () => {
    const code = generateAnchorCode(250, 3600);

    expect(code).toContain("let now = Clock::get()?.unix_timestamp;");
    expect(code).toContain("identity.last_verification_timestamp >= now - 3600");

    // Ensure the deprecated/incorrect field name is absent
    expect(code).not.toContain("identity.last_verified");
  });

  it("uses the window the docs recommend for a claim", () => {
    // The template is an airdrop claim, and the recommendation for a claim is
    // to run a verification at the point of the action. One hour leaves room
    // for a slow wallet round trip without accepting a stale Anchor. Anything
    // looser here quietly teaches a weaker pattern than the docs do.
    // See content/docs/concepts/trust-score.mdx "What to gate on".
    expect(generateAnchorCode(250, 3600)).toContain("now - 3600");
  });

  it("gates on recency as well as score", () => {
    // Both requires must be present. A template that checks only the score
    // teaches a gate that a wallet passes on history alone.
    const code = generateAnchorCode(250, 3600);
    expect(code).toContain("AirdropError::VerificationExpired");
    expect(code).toContain("AirdropError::InsufficientTrustScore");
  });

  it("uses the configured Trust Score floor", () => {
    expect(generateAnchorCode(250, 3600)).toContain(
      "identity.trust_score >= 250",
    );
    expect(generateAnchorCode(500, 3600)).toContain(
      "identity.trust_score >= 500",
    );
  });

  it("includes correct Account struct reference for IdentityState", () => {
    const code = generateAnchorCode(250, 3600);
    expect(code).toContain("pub identity_state: Account<'info, IdentityState>");
    expect(code).toContain("use entros_anchor::IdentityState;");
    expect(code).toContain("seeds::program = entros_anchor::ID");
  });
});
