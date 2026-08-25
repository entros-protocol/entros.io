import { afterEach, describe, expect, it, vi } from "vitest";
import {
  challengeCanStartCapture,
  fetchChallengeViaProxy,
} from "../src/lib/relay-challenge";
import { bindPulseValidationChallenge } from "../src/lib/pulse-session";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("relay challenge binding", () => {
  it("derives the deadline from request start", async () => {
    vi.spyOn(performance, "now").mockReturnValueOnce(2_000);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          nonce: Array(32).fill(7),
          phrase: "amber cedar drift maple orbit",
          expires_in: 180,
          curve: {
            a: 2,
            b: 3,
            delta: 1,
            points: 200,
            anchor_x: 50,
            anchor_y: 50,
          },
        }),
      ),
    );

    const challenge = await fetchChallengeViaProxy("wallet");

    expect(challenge.expiresAtMs).toBe(182_000);
    expect(challenge.nonce).toEqual(new Uint8Array(32).fill(7));
    expect(challenge.curve).toMatchObject({
      a: 2,
      b: 3,
      delta: 1,
      anchorX: 50,
      anchorY: 50,
    });
  });

  it("rejects a challenge without enough capture lifetime", () => {
    expect(challengeCanStartCapture({ expiresAtMs: 120_999 }, 1_000)).toBe(
      false,
    );
    expect(challengeCanStartCapture({ expiresAtMs: 121_000 }, 1_000)).toBe(
      true,
    );
  });

  it("rejects nonce bytes outside the executor contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          nonce: [...Array(31).fill(7), 256],
          phrase: "amber cedar drift maple orbit",
          expires_in: 180,
          curve: {
            a: 2,
            b: 3,
            delta: 1,
            points: 200,
            anchor_x: 50,
            anchor_y: 50,
          },
        }),
      ),
    );

    await expect(fetchChallengeViaProxy("wallet")).rejects.toThrow(
      "malformed nonce",
    );
  });

  it("rejects a curve outside the executor contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          nonce: Array(32).fill(7),
          phrase: "amber cedar drift maple orbit",
          expires_in: 180,
          curve: {
            a: 2,
            b: 3,
            delta: 1,
            points: 100_000,
            anchor_x: 50,
            anchor_y: 50,
          },
        }),
      ),
    );

    await expect(fetchChallengeViaProxy("wallet")).rejects.toThrow(
      "malformed challenge curve",
    );
  });

  it("binds the exact nonce and monotonic deadline once", () => {
    const bindValidationChallenge = vi.fn();
    const challenge = {
      nonce: new Uint8Array(32).fill(9),
      phrase: "amber cedar drift maple orbit",
      expiresIn: 180,
      expiresAtMs: 181_000,
    };

    bindPulseValidationChallenge({ bindValidationChallenge }, challenge, 1_000);

    expect(bindValidationChallenge).toHaveBeenCalledOnce();
    expect(bindValidationChallenge).toHaveBeenCalledWith(
      challenge.nonce,
      181_000,
    );
  });
});
