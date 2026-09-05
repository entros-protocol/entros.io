import { describe, expect, it } from "vitest";

import { parseEmbedParams } from "../src/lib/embed/url-params";
import { normalizePolicyRequest } from "@entros/verify/policy";

function params(cluster: string): URLSearchParams {
  return new URLSearchParams({
    integrator: "demo-integrator",
    parent_origin: "https://example.com",
    cluster,
    request_id: "request-1",
  });
}

describe("parseEmbedParams", () => {
  it("accepts the active devnet cluster", () => {
    expect(parseEmbedParams(params("devnet"))).toEqual({
      ok: true,
      params: {
        integratorKey: "demo-integrator",
        parentOrigin: "https://example.com",
        cluster: "devnet",
        requestId: "request-1",
      },
    });
  });

  it("rejects a mainnet label while providers remain devnet-only", () => {
    expect(parseEmbedParams(params("mainnet-beta"))).toEqual({
      ok: false,
      reason: "unknown",
    });
  });

  it("accepts a canonical versioned policy and preserves its score floor", () => {
    const input = params("devnet");
    const policy = normalizePolicyRequest(undefined, 100);
    input.set("min_trust_score", "100");
    input.set("policy_version", "1");
    input.set("policy", JSON.stringify(policy));
    const parsed = parseEmbedParams(input);
    expect(parsed.ok && parsed.params.policy).toEqual(policy);
  });

  it.each(["policy", "policy_version", "min_trust_score", "request_id"])(
    "rejects duplicated %s parameters",
    (name) => {
      const input = params("devnet");
      input.append(name, "1");
      input.append(name, "2");
      expect(parseEmbedParams(input).ok).toBe(false);
    },
  );

  it.each(["", " 100", "1e2", "0x64", "100.0", "0100"])(
    "rejects a noncanonical legacy floor: %s",
    (floor) => {
      const input = params("devnet");
      input.set("min_trust_score", floor);
      expect(parseEmbedParams(input).ok).toBe(false);
    },
  );

  it("rejects an unknown policy version before capture", () => {
    const input = params("devnet");
    input.set("policy_version", "2");
    input.set("policy", JSON.stringify(normalizePolicyRequest()));
    expect(parseEmbedParams(input).ok).toBe(false);
  });

  it("rejects a policy body without its negotiation marker", () => {
    const input = params("devnet");
    input.set("policy", JSON.stringify(normalizePolicyRequest()));
    expect(parseEmbedParams(input).ok).toBe(false);
  });

  it("rejects conflicting legacy and versioned requirements", () => {
    const input = params("devnet");
    input.set("min_trust_score", "99");
    input.set("policy_version", "1");
    input.set("policy", JSON.stringify(normalizePolicyRequest(undefined, 100)));
    expect(parseEmbedParams(input).ok).toBe(false);
  });

  it("rejects unsupported assurance and omitted statuses", () => {
    for (const requiredAssurance of [undefined, "native_attested"]) {
      const input = params("devnet");
      input.set("policy_version", "1");
      input.set("policy", JSON.stringify({ ...normalizePolicyRequest(), requiredAssurance }));
      expect(parseEmbedParams(input).ok).toBe(false);
    }
  });
});
