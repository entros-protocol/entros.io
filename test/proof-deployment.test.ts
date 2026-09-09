import { describe, expect, it } from "vitest";
import { resolveProofDeployment } from "../src/lib/proof-deployment";

describe("proof deployment selection", () => {
  it("preserves the released SDK configuration when no manifest is configured", () => {
    expect(resolveProofDeployment(undefined, false)).toEqual({});
  });

  it("refuses a configured generation when the installed SDK lacks support", () => {
    expect(() => resolveProofDeployment('{"generation":"request-bound-v1"}', false)).toThrow("does not support");
  });

  it("passes an explicit generation to a capable SDK for complete validation", () => {
    const manifest = { generation: "request-bound-v1", deploymentDomain: "11".repeat(32) };
    expect(resolveProofDeployment(JSON.stringify(manifest), true)).toEqual({ requestBoundManifest: manifest });
  });

  it.each(["null", "[]", "{}", '{"generation":"unknown"}'])("rejects invalid generation %s", (value) => {
    expect(() => resolveProofDeployment(value, true)).toThrow("Invalid proof");
  });
});
