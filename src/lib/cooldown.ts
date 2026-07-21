/**
 * Mirrors `RESET_COOLDOWN_SECS` in `entros_anchor::lib.rs`. The on-chain
 * program rejects a second reset within this window with Custom error
 * 6012 (`ResetCooldownActive`); the pre-flight check surfaces the
 * same constraint before the user spends a capture session on a
 * verification destined to revert.
 */
export const RESET_COOLDOWN_SECS = 7 * 24 * 60 * 60;

export function evaluateResetCooldown(
  lastResetTimestamp: number,
  nowSecs: number = Math.floor(Date.now() / 1000)
): { isCooldownActive: boolean; unlockIso?: string; syntheticError?: string } {
  if (lastResetTimestamp > 0) {
    const elapsed = nowSecs - lastResetTimestamp;
    if (elapsed < RESET_COOLDOWN_SECS) {
      const unlockTs = lastResetTimestamp + RESET_COOLDOWN_SECS;
      const unlockIso = new Date(unlockTs * 1000).toISOString();
      return {
        isCooldownActive: true,
        unlockIso,
        syntheticError: `Reset on cooldown. {"InstructionError":[0,{"Custom":6012}]} unlock_at=${unlockIso}`,
      };
    }
  }
  return { isCooldownActive: false };
}
