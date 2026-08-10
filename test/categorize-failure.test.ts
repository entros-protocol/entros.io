import { describe, it, expect } from "vitest";
import {
  categorizeFailure,
  requiresBaselineRecoveryChoice,
} from "../src/components/verify/categorize-failure";

/**
 * Failure routing, pinned against the two production defects of 2026-07-31.
 *
 * The routing table used to be a flat list of substring tests over the error
 * message. That is how an on-chain revert came to be rendered as "Validation
 * rejected this attempt": the matcher for a validator rejection also matched
 * `custom program error`, which can only appear after the validator already
 * returned 200.
 */

const CAN_RESET = true;

describe("phase gating", () => {
  it("does not read an on-chain revert as a validator rejection", () => {
    // The exact production symptom. The message reaches the same surface, but
    // by way of the phase and the opacity flag rather than by matching a word
    // that belongs to a different layer.
    const revert =
      'Transaction failed on chain: {"InstructionError":[0,{"Custom":6099}]} (sig=abc)';
    const routed = categorizeFailure(revert, CAN_RESET, undefined, {
      failedAt: "confirmation",
      opaque: true,
    });
    expect(routed.kind).toBe("validation-rejected");
  });

  it("keeps the validator matchers out of the on-chain phases", () => {
    // A wallet adapter that happens to echo the words "validation failed"
    // while reporting a send error must not borrow the validator's surface.
    const routed = categorizeFailure(
      "WalletSendTransactionError: validation failed in the adapter",
      CAN_RESET,
      undefined,
      { failedAt: "submission", opaque: false },
    );
    expect(routed.kind).toBe("generic");
  });

  it("keeps the on-chain matchers out of the validation phase", () => {
    const routed = categorizeFailure(
      "custom program error reported by an unrelated service",
      CAN_RESET,
      undefined,
      { failedAt: "validation", opaque: false },
    );
    expect(routed.kind).toBe("generic");
  });

  it("routes a declined prompt only from the signing phase", () => {
    expect(
      categorizeFailure("User rejected the request.", CAN_RESET, undefined, {
        failedAt: "signing",
      }).kind,
    ).toBe("user-rejection");
    // The same words arriving from a capture failure are not a wallet prompt.
    expect(
      categorizeFailure("User rejected the request.", CAN_RESET, undefined, {
        failedAt: "capture",
      }).kind,
    ).toBe("generic");
  });

  it("keeps 6011 and 6012 on their own surfaces ahead of the opaque bucket", () => {
    // Both name protocol state the user has to act on, not the outcome of a
    // detection check, so naming them does not help an attacker calibrate.
    expect(
      categorizeFailure(
        'Transaction failed on chain: {"InstructionError":[2,{"Custom":6011}]}',
        CAN_RESET,
        undefined,
        { failedAt: "confirmation", opaque: true },
      ),
    ).toEqual({ kind: "stale-baseline", canReset: true });
    expect(
      categorizeFailure(
        'Transaction failed on chain: {"InstructionError":[1,{"Custom":6012}]}',
        CAN_RESET,
        undefined,
        { failedAt: "confirmation", opaque: true },
      ).kind,
    ).toBe("cooldown-active");
  });

  it("runs every matcher when no phase is known", () => {
    // A host raising its own failure, or one talking to an SDK older than
    // 4.1.0. This is the pre-4.1.0 behaviour exactly, so nothing regresses on
    // the way in.
    for (const [error, kind] of [
      ["Microphone access denied. Please allow microphone permission.", "permission-denied"],
      ["User rejected the request.", "user-rejection"],
      ["Blockhash not found", "stale-blockhash"],
      ['{"Custom":6012}', "cooldown-active"],
      ["Feature validation failed", "validation-rejected"],
    ] as const) {
      expect(categorizeFailure(error, CAN_RESET).kind, error).toBe(kind);
    }
  });
});

describe("opacity", () => {
  it("shows the generic rejection whenever the SDK says the cause is opaque", () => {
    // A replay-floor rejection in `proving`, an attack-signal rejection in
    // `validation` and a program revert in `confirmation` have to be
    // indistinguishable, or the difference tells an attacker which layer
    // caught them.
    for (const failedAt of ["proving", "validation", "confirmation"] as const) {
      expect(
        categorizeFailure("Verification rejected. Please try again.", CAN_RESET, undefined, {
          failedAt,
          opaque: true,
        }).kind,
      ).toBe("validation-rejected");
    }
  });

  it("shows a labelled validator rejection rather than hiding it", () => {
    // A safe-reveal reason names a capture-quality problem the user can act
    // on. The flat prose matcher used to swallow the hint and replace it with
    // "Validation rejected this attempt", because the message contains the
    // word "validation". `opaque: false` is the SDK saying the text is safe.
    const hint = "Validation failed: your voice varied less than expected.";
    expect(
      categorizeFailure(hint, CAN_RESET, "variance_floor", {
        failedAt: "validation",
        opaque: false,
      }),
    ).toEqual({ kind: "generic", message: hint });
    // Without the flag, the old behaviour: the hint disappears.
    expect(categorizeFailure(hint, CAN_RESET, "variance_floor").kind).toBe(
      "validation-rejected",
    );
  });
});

describe("baseline recovery", () => {
  it("gives an anchor that predates on-chain baselines its own surface", () => {
    // The largest group by far: 13 of 107 devnet anchors carry an on-chain
    // baseline. The rest used to be told a fingerprint was not found on their
    // device, which describes a search that could never have succeeded.
    expect(
      categorizeFailure("the local baseline is missing", CAN_RESET, undefined, {
        failedAt: "baseline",
        baselineRecovery: "no-encrypted-baseline",
      }),
    ).toEqual({ kind: "no-portable-baseline", canReset: true });
  });

  it("separates a wallet that cannot sign from a baseline that is gone", () => {
    expect(
      categorizeFailure("the local baseline is missing", CAN_RESET, undefined, {
        failedAt: "baseline",
        baselineRecovery: "signing-unavailable",
      }).kind,
    ).toBe("signing-unavailable");
  });

  it("never offers a reset when another wallet signed", () => {
    // The on-chain baseline is intact. Resetting here would destroy a
    // verification history over a wallet-selection mistake.
    const routed = categorizeFailure("A different wallet signed", CAN_RESET, undefined, {
      failedAt: "baseline",
      baselineRecovery: "wallet-mismatch",
    });
    expect(routed).toEqual({ kind: "wallet-mismatch" });
    expect(routed).not.toHaveProperty("canReset");
  });

  it("falls back to prose for the reasons that carry no dedicated surface", () => {
    expect(
      categorizeFailure(
        "Your baseline is out of sync with your on-chain identity.",
        CAN_RESET,
        undefined,
        { failedAt: "baseline", baselineRecovery: "unknown-error" },
      ).kind,
    ).toBe("stale-baseline");
  });
});

describe("reset CTA", () => {
  it("is withheld on every baseline surface when the host offers no handler", () => {
    for (const baselineRecovery of [
      "no-encrypted-baseline",
      "signing-unavailable",
      "stale-baseline",
    ] as const) {
      const routed = categorizeFailure("the local baseline is missing", false, undefined, {
        failedAt: "baseline",
        baselineRecovery,
      });
      expect(routed).toHaveProperty("canReset", false);
    }
  });

  it("uses cancel only when reset is the alternative to baseline recovery", () => {
    for (const kind of [
      "no-portable-baseline",
      "signing-unavailable",
      "missing-baseline",
      "stale-baseline",
    ] as const) {
      expect(requiresBaselineRecoveryChoice({ kind, canReset: true })).toBe(true);
    }
    expect(
      requiresBaselineRecoveryChoice({ kind: "drift-too-high", canReset: true }),
    ).toBe(false);
    expect(requiresBaselineRecoveryChoice({ kind: "validation-rejected" })).toBe(false);
  });
});
