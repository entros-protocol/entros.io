import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ComparePage from "@/app/compare/page";
import sitemap from "@/app/sitemap";
import { GET as llmsTxt } from "@/app/llms.txt/route";
import {
  COMPARISON_EXPLAINERS,
  MODALITY_ROWS,
  POLICY_BOUNDARIES,
  VENDOR_SCOPE_ROWS,
} from "@/data/comparison";

const PAGE = readFileSync(
  resolve(__dirname, "../src/app/compare/page.tsx"),
  "utf8",
);
const DATA = readFileSync(
  resolve(__dirname, "../src/data/comparison.ts"),
  "utf8",
);
const SOLUTIONS = readFileSync(
  resolve(__dirname, "../src/app/solutions/page.tsx"),
  "utf8",
);
const DOCS_INDEX = readFileSync(
  resolve(__dirname, "../content/docs/index.mdx"),
  "utf8",
);
const FOOTER = readFileSync(
  resolve(__dirname, "../src/components/layout/footer.tsx"),
  "utf8",
);

describe("modality comparison page", () => {
  it("is linked from sitemap, llms.txt, solutions, docs index, and footer", async () => {
    expect(sitemap().map((entry) => entry.url)).toContain(
      "https://entros.io/compare",
    );
    const brief = await (await llmsTxt()).text();
    expect(brief).toContain("](https://entros.io/compare)");
    expect(SOLUTIONS).toContain('href="/compare"');
    expect(DOCS_INDEX).toContain("](/compare)");
    expect(FOOTER).toContain('href="/compare"');
  });

  it("stays outside the app route group with zero wallet adapter code", () => {
    expect(PAGE).not.toContain("@solana/wallet-adapter");
    expect(PAGE).not.toContain("useWallet");
  });

  it("defines unique stable row anchors for every modality, vendor, boundary, and explainer", () => {
    const ids = [
      ...MODALITY_ROWS.map((r) => r.id),
      ...POLICY_BOUNDARIES.map((b) => b.id),
      ...VENDOR_SCOPE_ROWS.map((v) => v.id),
      ...COMPARISON_EXPLAINERS.map((e) => e.id),
    ];

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(
      expect.arrayContaining([
        "modality-anatomical",
        "modality-credential",
        "modality-kyc",
        "modality-behavioral",
        "vendor-entros",
        "vendor-world",
        "vendor-alien",
        "vendor-poh",
        "vendor-civic",
        "vendor-humanity",
        "attestation-vs-authentication",
        "warm-evidence-reuse",
        "agent-operator-permits",
        "device-data-boundaries",
      ]),
    );
  });

  it("states Entros devnet, browser_unattested, and unmeasured population limits inside the table", () => {
    const behavioral = MODALITY_ROWS.find(
      (row) => row.id === "modality-behavioral",
    );
    expect(behavioral).toBeDefined();
    expect(behavioral!.limit).toContain("Solana devnet");
    expect(behavioral!.limit).toContain("browser_unattested");
    expect(behavioral!.limit).toContain("unmeasured population uniqueness");
    expect(behavioral!.uniquenessStatus).toContain("Unmeasured");
  });

  it("includes dated primary-source vendor scope and excludes unshipped walletkit PR 629", () => {
    const world = VENDOR_SCOPE_ROWS.find((row) => row.id === "vendor-world");
    expect(world?.scope).toContain("World ID 4.0");
    expect(world?.scope).toContain("session_id");
    expect(world?.scope).toContain("session_nullifier");
    expect(world?.scope).toContain("Proof of Presence");
    expect(world?.scope).toContain("sybil_score");
    expect(world?.scope).toContain("World ID for Zoom");
    expect(world?.scope).toContain("WIP-107");
    expect(world?.scope).toContain("WIP-202");
    expect(world?.scope).toContain("Governance drafts");
    expect(DATA).not.toContain("629");
    expect(DATA.toLowerCase()).not.toContain("walletkit");

    const alien = VENDOR_SCOPE_ROWS.find((row) => row.id === "vendor-alien");
    expect(alien?.checked).toBe("2026-10-31");
    expect(alien?.scope).toContain("Linking is not authentication.");
    expect(alien?.sources.some((s) => s.href.includes("docs.alien.org"))).toBe(
      true,
    );

    const poh = VENDOR_SCOPE_ROWS.find((row) => row.id === "vendor-poh");
    expect(poh?.checked).toBe("2026-11-18");
    expect(poh?.scope).toContain("100,000");
    expect(poh?.scope).toContain("$0.25");
    expect(poh?.scope).toContain("touch gestures");
    expect(poh?.boundary).toContain("FRR");
    expect(
      poh?.sources.some((s) => s.href === "https://docs.poh.org/plans.md"),
    ).toBe(true);
    expect(
      poh?.sources.some(
        (s) => s.href === "https://docs.poh.org/how-it-works.md",
      ),
    ).toBe(true);
  });

  it("omits country-specific regulatory callouts and legal frameworks from /compare", () => {
    const rendered = renderToStaticMarkup(createElement(ComparePage));
    const combined = `${PAGE}\n${DATA}\n${rendered}`.toLowerCase();

    for (const forbidden of [
      "spain",
      "aepd",
      "aepd.es",
      "gdpr",
      "ccpa",
      "context-anatomical-storage",
    ]) {
      expect(combined).not.toContain(forbidden);
    }
  });

  it("carries zero em dashes, zero accuracy claims, zero internal paths, and zero one-time-check rival framing", () => {
    const combined = `${PAGE}\n${DATA}`;
    expect(combined).not.toContain("\u2014");
    expect(combined).not.toContain("docs/master/");
    expect(combined).not.toContain("docs/research/");

    const lower = combined.toLowerCase();
    for (const banned of [
      "one-time check",
      "only verifies once",
      "0.27%",
      "99.71%",
      "sub-1%",
      "0.45%",
      "unspoofable",
      "sybil-proof",
      "cannot be spoofed",
      "mainnet-ready",
      "bot farm",
      "cost of attack",
      "expensive to fake",
      "no data leaves",
      "zero personal",
    ]) {
      expect(lower).not.toContain(banned);
    }
  });
});
