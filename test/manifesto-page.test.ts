import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";

const PAGE = readFileSync(resolve(__dirname, "../src/app/manifesto/page.tsx"), "utf8");
const FOOTER = readFileSync(
  resolve(__dirname, "../src/components/layout/footer.tsx"),
  "utf8",
);

describe("manifesto", () => {
  it("is linked from the footer and listed in the sitemap", () => {
    expect(FOOTER).toContain('href="/manifesto"');
    expect(sitemap().map((entry) => entry.url)).toContain("https://entros.io/manifesto");
  });

  it("states the devnet status and the path to mainnet", () => {
    expect(PAGE).toContain("Entros is live on Solana devnet");
    expect(PAGE).toContain("a trusted-setup ceremony and an external audit");
  });

  /**
   * A manifesto states intent. Present-tense security, accuracy or uniqueness
   * claims belong to the claims register, and none of these phrases has a row.
   */
  it("makes no claim the register bans", () => {
    const body = PAGE.toLowerCase();

    for (const banned of [
      "unspoofable",
      "sybil-proof",
      "cannot be spoofed",
      "can't fake",
      "mainnet-ready",
      "live on mainnet",
      "one person per wallet",
      "nothing leaves",
      "no data leaves",
      "guarantee",
      "cost of attack",
      "expensive to fake",
      "in seconds",
      "\u2014",
    ]) {
      expect(body).not.toContain(banned);
    }
  });
});
