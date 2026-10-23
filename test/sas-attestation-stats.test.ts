import { describe, expect, it } from "vitest";
import {
  DEVNET_SAS_CREDENTIALS,
  RETIRED_DEVNET_ATTESTATION_COUNT,
  totalAttestationCount,
} from "../src/lib/sas-attestation-stats";

describe("SAS attestation statistics", () => {
  it("queries only the current devnet credential", () => {
    expect(DEVNET_SAS_CREDENTIALS).toEqual([
      "AMBtabCgRFwGLjoZ21Z2LhSKJ6c47NckxUkMogJ3Lpuw",
    ]);
  });

  it("adds distinct current accounts to the fixed retired count", () => {
    expect(
      totalAttestationCount([["current-one", "current-two", "current-one"]]),
    ).toBe(RETIRED_DEVNET_ATTESTATION_COUNT + 2);
  });

  it("reports the retired count when the current credential has no accounts", () => {
    expect(totalAttestationCount([[]])).toBe(RETIRED_DEVNET_ATTESTATION_COUNT);
  });
});
