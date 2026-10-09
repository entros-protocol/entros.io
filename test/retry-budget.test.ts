import { describe, expect, it } from "vitest";
import {
  chargeRetryBudget,
  EMPTY_RETRY_BUDGET,
  MAX_CAPTURE_ATTEMPTS,
} from "../src/components/verify/retry-budget";

describe("capture retry budgets", () => {
  it("stops quality retries after three verdicts without charging the other budgets", () => {
    let budget = { ...EMPTY_RETRY_BUDGET, verdict: 2, transport: 2 };
    for (let count = 1; count <= MAX_CAPTURE_ATTEMPTS; count++) {
      const charged = chargeRetryBudget(budget, "anchor_retry", "validation");
      budget = charged.budget;
      expect(charged.used).toBe(count);
      expect(budget).toEqual({ quality: count, verdict: 2, transport: 2 });
      expect(charged.used < MAX_CAPTURE_ATTEMPTS).toBe(count < 3);
    }
  });

  it("keeps transport and ordinary verdicts separate", () => {
    const transport = chargeRetryBudget(EMPTY_RETRY_BUDGET, "validation_timeout", "validation");
    expect(transport.budget).toEqual({ quality: 0, verdict: 0, transport: 1 });
    const verdict = chargeRetryBudget(transport.budget, "phrase_content_mismatch", "validation");
    expect(verdict.budget).toEqual({ quality: 0, verdict: 1, transport: 1 });
    expect(chargeRetryBudget(verdict.budget, undefined, "signing").budget).toEqual(verdict.budget);
  });

  it("does not charge a pre-validation policy refusal", () => {
    expect(chargeRetryBudget(EMPTY_RETRY_BUDGET, "paired_required", "baseline").budget)
      .toEqual(EMPTY_RETRY_BUDGET);
  });
});
