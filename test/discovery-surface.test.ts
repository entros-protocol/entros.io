import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { GET as llmsTxt } from "@/app/llms.txt/route";

/**
 * The sitemap and `/llms.txt` are the two files a crawler or an assistant reads
 * before anything else on the site. Both restate protocol status, so both can
 * carry a claim past review. These tests pin the structural half: every docs
 * page reaches the sitemap, and the brief keeps its status and limits.
 *
 * Docs content comes from the stub in `test/stubs/`, so page counts here track
 * the stub rather than `content/docs`.
 */

async function brief(): Promise<string> {
  return await llmsTxt().text();
}

describe("sitemap", () => {
  it("lists docs pages alongside the marketing routes", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://entros.io/docs");
    expect(urls).toContain("https://entros.io/docs/concepts/trust-score");
    expect(urls).toContain("https://entros.io/technology");
  });

  it("emits every url once", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(new Set(urls).size).toBe(urls.length);
  });

  it("dates every entry, because an undated entry is ignored", () => {
    for (const entry of sitemap()) {
      expect(entry.lastModified).toBeTruthy();
    }
  });
});

describe("llms.txt", () => {
  it("serves plain text", async () => {
    const response = llmsTxt();

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
});
