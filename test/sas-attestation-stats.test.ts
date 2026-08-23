import { describe, expect, it } from "vitest";
import {
  DEVNET_SAS_CREDENTIALS,
  distinctAttestationCount,
} from "../src/lib/sas-attestation-stats";

describe("SAS attestation statistics", () => {
  it("queries the legacy and current devnet credentials once", () => {
    expect(DEVNET_SAS_CREDENTIALS).toEqual([
      "GaPTkZC6JEGds1G5h645qyUrogx7NWghR2JgjvKQwTDo",
      "AMBtabCgRFwGLjoZ21Z2LhSKJ6c47NckxUkMogJ3Lpuw",
    ]);
  });

  it("counts distinct accounts across credential generations", () => {
    expect(
      distinctAttestationCount([
        ["legacy-one", "legacy-two"],
        ["current-one", "legacy-two"],
      ]),
    ).toBe(3);
  });
});
