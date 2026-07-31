import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The gate demo displays `EntrosGate`'s own source for integrators to copy.
 *
 * It holds that source as a template literal rather than importing it, so the
 * two are a hand-kept pair and drift in silence. They had already drifted: the
 * page still showed a gate that read only `trust_score` after the component
 * started reading `last_verification_timestamp` as well, which is the opposite
 * of what the page exists to teach.
 *
 * Copy-source is a real distribution channel. What it ships has to be what runs.
 */

const COMPONENT = resolve(__dirname, "../src/components/ui/entros-gate.tsx");
const DEMO = resolve(__dirname, "../src/app/(app)/gate-demo/page.tsx");

/** Recover the original text from a JS template literal's escaping. */
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
  expect(start, "COMPONENT_CODE is gone from the demo page").toBeGreaterThan(-1);
  const body = page.slice(start + open.length);
  // The literal ends at the first backtick that is not itself escaped.
  const end = body.search(/(?<!\\)`/);
  expect(end, "COMPONENT_CODE is unterminated").toBeGreaterThan(-1);
  return unescapeTemplate(body.slice(0, end));
}

describe("the gate demo shows the gate that actually runs", () => {
  it("displays the component source verbatim", () => {
    expect(displayedSource()).toBe(readFileSync(COMPONENT, "utf8").trimEnd());
  });

  it("shows a gate that reads recency, not only the score", () => {
    // Pinned separately from the byte comparison above so a failure says which
    // property was lost rather than only that something moved.
    const shown = displayedSource();
    expect(shown).toContain("maxVerificationAge");
    expect(shown).toContain("getBigInt64(48");
    expect(shown).toContain("getUint16(60");
  });
});
