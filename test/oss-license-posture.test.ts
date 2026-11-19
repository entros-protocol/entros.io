import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OpenSourcePosture } from "@/app/security/sections/OpenSourcePosture";
import { trustSignals } from "@/data/trust-signals";

const COMPONENT_SOURCE = readFileSync(
  resolve(__dirname, "../src/app/security/sections/OpenSourcePosture.tsx"),
  "utf8",
);
const TRUST_SIGNALS_SOURCE = readFileSync(
  resolve(__dirname, "../src/data/trust-signals.ts"),
  "utf8",
);
const README_SOURCE = readFileSync(
  resolve(__dirname, "../README.md"),
  "utf8",
);

describe("open-source and dependency license posture", () => {
  it("names third-party GPL-3.0 dependencies explicitly in OpenSourcePosture", () => {
    const html = renderToStaticMarkup(createElement(OpenSourcePosture));

    expect(html).toContain("circomlib (GPL-3.0)");
    expect(html).toContain("snarkjs");
    expect(html).toContain("pitchfinder (GPL-3.0)");
    expect(html).toContain("runtime dynamic import()");
    expect(html).toContain("without bundling them");
    expect(html).toContain("protocol-core");
    expect(html).toContain("entros-governance-plugin");
    expect(html).toContain("executor-node");
    expect(html).toContain("entros.io");
    expect(html).toContain("@entros/pulse-sdk");
  });

  it("identifies @entros/verify as pure MIT with zero GPL-3.0 dependencies", () => {
    const html = renderToStaticMarkup(createElement(OpenSourcePosture));

    expect(html).toContain("@entros/verify");
    expect(html).toContain("MIT");
    expect(html).toContain("@noble/curves");
    expect(html).toContain("@noble/hashes");
    expect(html).toContain("zero GPL-3.0 dependencies");
  });

  it("avoids unconditional pure-MIT transitive or generated-key claims across /security and /", () => {
    const html = renderToStaticMarkup(createElement(OpenSourcePosture));
    const lowerHtml = html.toLowerCase();

    expect(html).not.toContain("Open source, MIT licensed");
    expect(html).not.toContain("The client and on-chain protocol are MIT licensed");
    expect(html).not.toContain("keys are MIT");
    expect(html).not.toContain("exported keys");
    expect(html).not.toContain("runtime SDK dependencies carry GPL-3.0");
    expect(lowerHtml).not.toContain("pure-mit transitive");
    expect(lowerHtml).not.toContain("pure mit transitive");
    expect(html).toContain("Open source (MIT first-party source)");

    const openProtocol = trustSignals.find((s) => s.name === "Open Protocol");
    expect(openProtocol).toBeDefined();
    expect(openProtocol!.detail).toContain("First-party source");
    expect(openProtocol!.detail).toContain("MIT");
    expect(openProtocol!.detail).toContain("GPL-3.0");
    expect(openProtocol!.detail).toContain("circuits");
    expect(openProtocol!.detail).toContain("pulse-sdk");
    expect(openProtocol!.detail).toContain("@entros/verify");
    expect(openProtocol!.detail).not.toMatch(/^MIT licensed\./);
  });

  it("keeps OpenSourcePosture, trust-signals, and README license copy free of em dashes, internal IDs, and legal advice", () => {
    expect(COMPONENT_SOURCE).not.toContain("\u2014");
    expect(COMPONENT_SOURCE).not.toMatch(/#\d+\b/);
    expect(TRUST_SIGNALS_SOURCE).not.toContain("\u2014");
    expect(TRUST_SIGNALS_SOURCE).not.toMatch(/#\d+\b/);

    const readmeLicense = README_SOURCE.slice(
      README_SOURCE.indexOf("## License"),
    );
    expect(readmeLicense).toContain("circomlib");
    expect(readmeLicense).toContain("snarkjs");
    expect(readmeLicense).toContain("pitchfinder");
    expect(readmeLicense).toContain("GPL-3.0");
    expect(readmeLicense).toContain("@entros/verify");
    expect(readmeLicense).not.toContain("\u2014");
    expect(readmeLicense).not.toMatch(/#\d+\b/);

    const lowerSource = `${COMPONENT_SOURCE}\n${TRUST_SIGNALS_SOURCE}`.toLowerCase();
    for (const forbidden of [
      "legal advice",
      "legally compliant",
      "gpl-exempt",
      "no gpl obligation",
    ]) {
      expect(lowerSource).not.toContain(forbidden);
    }
  });
});
