import { describe, expect, it } from "vitest";

import { parseEmbedParams } from "../src/lib/embed/url-params";

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
});
