import { describe, it, expect } from "vitest";
import { passesEntrosGate } from "../src/components/ui/entros-gate";

/**
 * What `EntrosGate` lets through.
 *
 * The gate reads two fields because one is not enough to answer the question
 * an integrator is asking. The Trust Score says how consistently a wallet has
 * verified. `last_verification_timestamp` says how long ago it last did. The
 * component read only the score until 2026-08-01, while the timestamp sat at
 * offset 48 of the account it had already fetched.
 */

const NOW = 1_800_000_000;
const DAY = 86_400;
const anchor = (trustScore: number, agoSeconds: number) => ({
  trustScore,
  lastVerifiedAt: NOW - agoSeconds,
});

describe("passesEntrosGate", () => {
  it("passes an Anchor that clears both thresholds", () => {
    expect(
      passesEntrosGate(anchor(500, 3_600), { minTrustScore: 250, maxVerificationAge: DAY }, NOW),
    ).toBe(true);
  });

  it("refuses a high score that verified too long ago", () => {
    // The case the score alone cannot see, and the reason recency is read.
    expect(
      passesEntrosGate(anchor(700, 30 * DAY), { minTrustScore: 250, maxVerificationAge: DAY }, NOW),
    ).toBe(false);
  });

  it("refuses a fresh verification below the score floor", () => {
    expect(
      passesEntrosGate(anchor(50, 60), { minTrustScore: 250, maxVerificationAge: DAY }, NOW),
    ).toBe(false);
  });

  it("treats the window as inclusive at its edge", () => {
    const at = { minTrustScore: 0, maxVerificationAge: DAY };
    expect(passesEntrosGate(anchor(100, DAY), at, NOW)).toBe(true);
    expect(passesEntrosGate(anchor(100, DAY + 1), at, NOW)).toBe(false);
  });

  it("gates on score alone when the window is Infinity", () => {
    // The documented way to opt out of recency, for display and for gates
    // where a live capture would cost more friction than the action is worth.
    const forever = { minTrustScore: 250, maxVerificationAge: Infinity };
    expect(passesEntrosGate(anchor(500, 365 * DAY), forever, NOW)).toBe(true);
    expect(passesEntrosGate(anchor(100, 60), forever, NOW)).toBe(false);
  });

  it("refuses an account carrying no verification timestamp", () => {
    // Every minted Anchor gets one from `mint_anchor`, so a zero means the
    // bytes are not an Anchor. No threshold, including Infinity, may pass it.
    expect(
      passesEntrosGate({ trustScore: 900, lastVerifiedAt: 0 }, { minTrustScore: 0, maxVerificationAge: Infinity }, NOW),
    ).toBe(false);
  });

  it("does not fail a user whose clock runs slow", () => {
    // A browser clock behind the chain's makes the age negative. Refusing
    // there would punish a user for their own machine, and this gate is UI
    // rather than the authoritative check, which runs against `Clock::get()`.
    expect(
      passesEntrosGate(anchor(500, -600), { minTrustScore: 250, maxVerificationAge: DAY }, NOW),
    ).toBe(true);
  });
});
