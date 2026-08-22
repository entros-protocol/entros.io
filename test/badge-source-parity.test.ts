import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const COMPONENT = resolve(__dirname, "../src/components/ui/entros-badge.tsx");
const DEMO = resolve(__dirname, "../src/app/(app)/badge-demo/page.tsx");

function unescapeTemplate(literal: string): string {
  return literal
    .replace(/\\\$\{/g, "${")
    .replace(/\\`/g, "`")
    .replace(/\\\\/g, "\\");
}

function displayedSource(): string {
  const page = readFileSync(DEMO, "utf8");
  const open = "const COMPONENT_CODE = `";
  const start = page.indexOf(open);
  expect(start, "COMPONENT_CODE is missing").toBeGreaterThan(-1);
  const body = page.slice(start + open.length);
  const end = body.search(/(?<!\\)`/);
  expect(end, "COMPONENT_CODE is unterminated").toBeGreaterThan(-1);
  return unescapeTemplate(body.slice(0, end));
}

describe("the badge demo", () => {
  it("displays the component source verbatim", () => {
    expect(displayedSource()).toBe(readFileSync(COMPONENT, "utf8").trimEnd());
  });

  it("shows verification recency with the score", () => {
    const shown = displayedSource();
    expect(shown).toContain("lastVerifiedAt");
    expect(shown).toContain("getBigInt64(48");
    expect(shown).toContain("getUint16(60");
  });
});
