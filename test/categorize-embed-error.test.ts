import { describe, it, expect } from "vitest";
import type { VerificationResult } from "@entros/pulse-sdk";
import {
  PREV_COMMITMENT_MISMATCH_PATTERN,
  bucketForResult,
  categorizeError,
} from "../src/components/embed/categorize-embed-error";

/**
 * The embed popup's wire contract with integrators.
 *
 * The opener receives one of these buckets and never the raw message, so this
 * is the only signal an integrator gets. It broke once already: the backstop
 * timer was recognised by matching "timed out" in its own message, and a copy
 * edit turned a plain timeout into `unknown` on the wire without anything
 * noticing.
 */

function failure(over: Partial<VerificationResult>): VerificationResult {
  return {
    success: false,
    commitment: new Uint8Array(32),
    isFirstVerification: false,
    ...over,
  };
}

describe("bucketForResult", () => {
  it("buckets the two failures the SDK gained in 4.1.0", () => {
    // Both carry messages `categorizeError` has never seen. Before the phase
    // was consulted they fell through to `unknown`, which tells an integrator
    // nothing about whether to retry.
    expect(
      bucketForResult(
        failure({
          failedAt: "submission",
          error:
            "Your wallet did not respond to the signature request. Open your wallet, check whether a request is still pending, then try again.",
        }),
      ),
    ).toBe("network_error");
    expect(
      bucketForResult(
        failure({
          failedAt: "submission",
          error:
            "The network did not confirm your transaction in time. It may still land.",
        }),
      ),
    ).toBe("network_error");
  });

  it("separates a declined prompt from a failed send", () => {
    expect(bucketForResult(failure({ failedAt: "signing" }))).toBe("wallet_rejected");
    expect(bucketForResult(failure({ failedAt: "submission" }))).toBe("network_error");
  });

  it("keeps an empty wallet in the wallet bucket wherever it surfaces", () => {
    // The runtime reports it at the prompt, on send, or on chain. Phase cannot
    // separate it from a network failure, and here prose can.
    for (const failedAt of ["submission", "confirmation"] as const) {
      expect(
        bucketForResult(
          failure({
            failedAt,
            error:
              "Transfer: insufficient lamports 890880, need 5000000",
          }),
        ),
      ).toBe("wallet_rejected");
    }
  });

  it("buckets an on-chain revert and a bounds rejection as validation", () => {
    expect(bucketForResult(failure({ failedAt: "confirmation" }))).toBe("validation_failed");
    expect(bucketForResult(failure({ failedAt: "proving" }))).toBe("validation_failed");
  });

  it("defers to prose for the phases that decide nothing", () => {
    // Those failures are raised in the popup itself, and the message is the
    // only thing that describes them.
    for (const failedAt of ["capture", "extraction", "validation", "baseline"] as const) {
      expect(bucketForResult(failure({ failedAt }))).toBeNull();
    }
    expect(bucketForResult(failure({}))).toBeNull();
  });
});

describe("categorizeError", () => {
  it("recognises a declined prompt through the SDK predicate", () => {
    // Shares `isUserRejection` with the SDK deliberately. A local copy could
    // recognise a phrasing the SDK's does not, and the two would then disagree
    // about the same error.
    expect(categorizeError("User rejected the request.")).toBe("wallet_rejected");
    expect(categorizeError("Transaction rejected by user")).toBe("wallet_rejected");
  });

  it("keeps an empty wallet out of the unknown bucket", () => {
    expect(categorizeError("Attempt to debit an account but found no record of a prior credit")).toBe(
      "wallet_rejected",
    );
  });

  it("buckets program reverts as validation", () => {
    expect(
      categorizeError('Transaction failed on chain: {"InstructionError":[0,{"Custom":6014}]}'),
    ).toBe("validation_failed");
  });

  it("buckets the opaque rejection and the drift ceiling as validation", () => {
    expect(categorizeError("Verification rejected. Please try again.")).toBe("validation_failed");
    expect(categorizeError("This capture didn't closely match your usual pattern.")).toBe(
      "validation_failed",
    );
  });

  it("still recognises a network failure and a timeout", () => {
    expect(categorizeError("Failed to fetch")).toBe("network_error");
    expect(categorizeError("Blockhash not found")).toBe("network_error");
    expect(categorizeError("request timed out")).toBe("timeout");
  });

  it("falls through to unknown rather than guessing", () => {
    expect(categorizeError("something nobody anticipated")).toBe("unknown");
  });
});

describe("PREV_COMMITMENT_MISMATCH_PATTERN", () => {
  it("matches 6011 and nothing adjacent to it", () => {
    // Routes the popup to its own recovery surface while the wire still emits
    // the opaque bucket. A greedy match would send a cooldown there too.
    expect(
      PREV_COMMITMENT_MISMATCH_PATTERN.test('{"InstructionError":[2,{"Custom":6011}]}'),
    ).toBe(true);
    expect(
      PREV_COMMITMENT_MISMATCH_PATTERN.test('{"InstructionError":[2,{"Custom":6012}]}'),
    ).toBe(false);
    expect(
      PREV_COMMITMENT_MISMATCH_PATTERN.test('{"InstructionError":[2,{"Custom":60110}]}'),
    ).toBe(false);
  });
});
