import { buildCustomRoute } from "next/dist/lib/build-custom-route";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("fumadocs-mdx/next", () => ({
  createMDX: () => (config: unknown) => config,
}));

import nextConfig from "../next.config";

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

async function headersFor(path: string): Promise<Map<string, string>> {
  const rules = ((await nextConfig.headers?.()) ?? []) as HeaderRule[];
  const applied = new Map<string, string>();
  for (const rule of rules) {
    const { regex } = buildCustomRoute("header", rule);
    if (!new RegExp(regex).test(path)) continue;
    for (const header of rule.headers) applied.set(header.key.toLowerCase(), header.value);
  }
  return applied;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("production security headers", () => {
  it("isolates the browsing context of every page except the verify popup", async () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const path of ["/", "/agents", "/verify", "/dashboard", "/api/og/anchor", "/embed", "/docs/integrate/agent-permit"]) {
      expect((await headersFor(path)).get("cross-origin-opener-policy"), path).toBe("same-origin-allow-popups");
    }
  });

  it("leaves the verify popup its opener", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const popup = await headersFor("/embed/verify-popup");
    expect(popup.has("cross-origin-opener-policy")).toBe(false);
    expect(popup.get("content-security-policy")).toContain("frame-ancestors 'none'");
  });

  it("keeps the shared hardening headers on every route", async () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const path of ["/", "/agents", "/embed/verify-popup"]) {
      const headers = await headersFor(path);
      expect(headers.get("x-content-type-options"), path).toBe("nosniff");
      expect(headers.has("strict-transport-security"), path).toBe(true);
    }
  });
});
