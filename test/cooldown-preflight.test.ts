import { describe, expect, it } from "vitest";
import { evaluateResetCooldown, RESET_COOLDOWN_SECS } from "../src/lib/cooldown";

describe("Reset Cooldown Preflight Evaluation (Item #186)", () => {
  it("returns isCooldownActive = false for a fresh identity with lastResetTimestamp = 0", () => {
    const now = 1700000000;
    const result = evaluateResetCooldown(0, now);
    expect(result.isCooldownActive).toBe(false);
    expect(result.syntheticError).toBeUndefined();
  });

  it("returns isCooldownActive = true when reset occurred within the 7-day cooldown window", () => {
    const now = 1700000000;
    // Reset happened 2 days ago (2 * 86400 seconds ago)
    const lastReset = now - (2 * 86400);
    const result = evaluateResetCooldown(lastReset, now);
    
    expect(result.isCooldownActive).toBe(true);
    expect(result.syntheticError).toBeDefined();
    expect(result.syntheticError).toContain(`"Custom":6012`);
    expect(result.syntheticError).toContain(`unlock_at=`);

    // Verify unlock timestamp calculation
    const expectedUnlockTs = lastReset + RESET_COOLDOWN_SECS;
    const expectedUnlockIso = new Date(expectedUnlockTs * 1000).toISOString();
    expect(result.unlockIso).toBe(expectedUnlockIso);
    expect(result.syntheticError).toContain(expectedUnlockIso);
  });

  it("returns isCooldownActive = false when the 7-day cooldown window has elapsed", () => {
    const now = 1700000000;
    // Reset happened 8 days ago (8 * 86400 seconds ago)
    const lastReset = now - (8 * 86400);
    const result = evaluateResetCooldown(lastReset, now);
    
    expect(result.isCooldownActive).toBe(false);
    expect(result.syntheticError).toBeUndefined();
  });
});
