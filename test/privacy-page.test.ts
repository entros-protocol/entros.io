import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";

const PAGE = readFileSync(resolve(__dirname, "../src/app/privacy/page.tsx"), "utf8");
const FOOTER = readFileSync(
  resolve(__dirname, "../src/components/layout/footer.tsx"),
  "utf8",
);

describe("privacy notice", () => {
  it("is linked from the footer and listed in the sitemap", () => {
    expect(FOOTER).toContain('href="/privacy"');
    expect(sitemap().map((entry) => entry.url)).toContain("https://entros.io/privacy");
  });

  it("names a working contact and a dated revision", () => {
    expect(PAGE).toContain('const CONTACT = "contact@entros.io"');
    expect(PAGE).toMatch(/const UPDATED = "\d{1,2} [A-Z][a-z]+ \d{4}"/);
  });

  it("states that on-chain records cannot be deleted", () => {
    expect(PAGE).toContain("Nobody can delete");
  });

  /**
   * The notice states facts about data handling. A legal classification or a
   * compliance claim needs a review this page has not had, and the absolute
   * privacy phrases overstate what the request carries.
   */
  it("makes no legal or absolute privacy claim", () => {
    const body = PAGE.toLowerCase();

    for (const banned of [
      "gdpr",
      "ccpa",
      "comply",
      "compliant",
      "lawful basis",
      "not biometric",
      "anonymous",
      "no data leaves",
      "zero personal",
      "never collect",
    ]) {
      expect(body).not.toContain(banned);
    }
  });
});
