import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

/**
 * The prototype runs outside the verification pipeline. Two guarantees are structural and
 * checked here: the route sits outside the wallet route group, and nothing it imports
 * reaches identity capture. The third lives in `entros-validation`, where the production
 * router exposes no paired-round path.
 */

function source(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../src/${path}`, import.meta.url)), "utf8");
}

const PROTOTYPE_SOURCES = [
  "app/lab/rounds/page.tsx",
  "components/lab/round-runner.tsx",
  "lib/paired-round/capture.ts",
  "lib/paired-round/client.ts",
  "lib/paired-round/coarse-path.ts",
  "lib/paired-round/consent.ts",
  "lib/paired-round/transcript.ts",
];

describe("paired-round isolation", () => {
  it("keeps the route outside the wallet route group", () => {
    expect(() => source("app/(app)/lab/rounds/page.tsx")).toThrow();
    expect(() => source("app/lab/rounds/page.tsx")).not.toThrow();
  });

  it.each(PROTOTYPE_SOURCES)("imports no identity or wallet module in %s", (path) => {
    const body = source(path);
    for (const forbidden of [
      "@entros/pulse-sdk",
      "@entros/verify",
      "@solana/",
      "wallet-adapter",
      "wallet-provider",
      "pulse-provider",
      "pulse-session",
    ]) {
      expect(body).not.toContain(forbidden);
    }
  });

  it("gates the route behind an environment flag", () => {
    const body = source("app/lab/rounds/page.tsx");
    expect(body).toContain("prototypeEnabled()");
    expect(body).toContain("notFound()");
    expect(body).toContain("robots: { index: false, follow: false }");
  });

  it("keeps the prototype out of the crawl surface", () => {
    const rules = robots().rules;
    const disallow = Array.isArray(rules) ? rules[0]?.disallow : rules.disallow;
    expect(disallow).toContain("/lab/");
    expect(sitemap().some((entry) => entry.url.includes("/lab"))).toBe(false);
  });

  it("holds the service key on the server only", () => {
    const proxy = source("lib/server/paired-round-proxy.ts");
    expect(proxy).toContain("PAIRED_ROUND_SERVICE_KEY");
    expect(proxy).toContain('import "server-only"');
    for (const path of PROTOTYPE_SOURCES) {
      expect(source(path)).not.toContain("PAIRED_ROUND_SERVICE_KEY");
      expect(source(path)).not.toContain("NEXT_PUBLIC_PAIRED_ROUND");
    }
  });
});
