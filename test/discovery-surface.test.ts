import { describe, expect, it, vi } from "vitest";
import sitemap, { SITE_LAST_MODIFIED } from "@/app/sitemap";
import { GET as llmsTxt, dynamic } from "@/app/llms.txt/route";

/**
 * The sitemap and `/llms.txt` are the two files a crawler or an assistant reads
 * before anything else on the site. Both restate protocol status, so both can
 * carry a claim past review. These tests pin the structural half: every docs
 * page reaches the sitemap, and the brief keeps its status and its limits.
 *
 * Docs content comes from the stub in `test/stubs/`, so page counts here track
 * the stub rather than `content/docs`.
 */

async function brief(): Promise<string> {
  const response = await llmsTxt();
  return await response.text();
}

describe("sitemap", () => {
  it("lists docs pages alongside the marketing routes and comparison page", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://entros.io/docs");
    expect(urls).toContain("https://entros.io/docs/concepts/trust-score");
    expect(urls).toContain("https://entros.io/technology");
    expect(urls).toContain("https://entros.io/compare");
  });

  it("lists the privacy notice the footer links to", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://entros.io/privacy");
  });

  it("emits every url once", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(new Set(urls).size).toBe(urls.length);
  });

  it("uses per-page docs dates with deterministic static fallback and never calls new Date()", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2031-04-15T12:00:00.000Z"));
    try {
      const entries = sitemap();
      const byUrl = new Map(entries.map((entry) => [entry.url, entry.lastModified]));

      expect(byUrl.get("https://entros.io/docs/concepts/trust-score")).toBe("2026-10-27");
      expect(byUrl.get("https://entros.io/docs")).toBe(SITE_LAST_MODIFIED);
      expect(byUrl.get("https://entros.io/compare")).toBe(SITE_LAST_MODIFIED);
      expect(byUrl.get("https://entros.io")).toBe(SITE_LAST_MODIFIED);

      for (const entry of entries) {
        expect(entry.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(entry.lastModified).not.toBe("2031-04-15");
      }
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("llms.txt", () => {
  it("prerenders, so a crawler hit costs no function call", () => {
    expect(dynamic).toBe("force-static");
  });

  it("serves plain text", async () => {
    const response = await llmsTxt();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
  });

  it("states devnet and the open audit before anything else", async () => {
    const body = await brief();
    const statusIndex = body.indexOf("## Status");
    const pagesIndex = body.indexOf("## Key pages");

    expect(statusIndex).toBeGreaterThan(-1);
    expect(statusIndex).toBeLessThan(pagesIndex);
    expect(body).toContain("No Entros program runs on Solana mainnet");
    expect(body).toContain("external security audit");
  });

  it("carries the limits that qualify every other line", async () => {
    const body = await brief();

    expect(body).toContain("Population uniqueness is unmeasured");
    expect(body).toContain("no trusted sensor provenance");
    expect(body).toContain("no coupling to live verification");
  });

  it("makes docs links absolute so a quoted line stays openable", async () => {
    const body = await brief();

    expect(body).toContain("](https://entros.io/docs/concepts/trust-score)");
    expect(body).not.toContain("](/docs");
  });

  it("links the privacy notice and modality comparison page", async () => {
    const body = await brief();

    expect(body).toContain("](https://entros.io/privacy)");
    expect(body).toContain("](https://entros.io/compare)");
  });

  it("repeats no banned claim", async () => {
    const body = (await brief()).toLowerCase();

    for (const banned of [
      "unspoofable",
      "sybil-proof",
      "cannot be spoofed",
      "mainnet-ready",
      "bot farm",
      "cost of attack",
      "expensive to fake",
    ]) {
      expect(body).not.toContain(banned);
    }
  });

  /**
   * The brief restates limits the site already publishes. Anything that reads
   * as the enforcement status of a named check does not belong, because this
   * file is written to be ingested and repeated. The vocabulary below is how
   * that sentence gets written, so it never ships here.
   */
  it("describes no check by its enforcement status", async () => {
    const body = (await brief()).toLowerCase();

    for (const tell of [
      "excludes",
      "not enforced",
      "observe-only",
      "observe only",
      "disabled",
      "telemetry",
      "does not run",
      "skipped",
    ]) {
      expect(body).not.toContain(tell);
    }
  });
});
