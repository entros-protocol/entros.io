import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Roadmap, { metadata as roadmapMetadata } from "@/app/roadmap/page";
import sitemap from "@/app/sitemap";
import Token, { metadata as tokenMetadata } from "@/app/token/page";
import { STATIC_OG_ROUTES } from "@/lib/og-routes";

const TOKEN_PAGE_SOURCE = readFileSync(
  resolve(__dirname, "../src/app/token/page.tsx"),
  "utf8",
);
const TOKEN_CONTENT_SOURCE = readFileSync(
  resolve(__dirname, "../src/components/sections/token-content.tsx"),
  "utf8",
);
const TOKEN_ECONOMICS_SOURCE = readFileSync(
  resolve(__dirname, "../src/data/token-economics.ts"),
  "utf8",
);
const ROADMAP_PAGE_SOURCE = readFileSync(
  resolve(__dirname, "../src/app/roadmap/page.tsx"),
  "utf8",
);

function visibleText(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ");
}

describe("/token and /roadmap copy alignment", () => {
  it("lists /token and /roadmap in sitemap and aligns OG catalog metadata", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://entros.io/token");
    expect(urls).toContain("https://entros.io/roadmap");

    expect(tokenMetadata.description).toBe(STATIC_OG_ROUTES["/token"]!.description);
    expect(roadmapMetadata.description).toBe(
      STATIC_OG_ROUTES["/roadmap"]!.description,
    );
  });

  it("keeps /token outside the app route group with preserved hero h1", () => {
    expect(TOKEN_PAGE_SOURCE).not.toContain("@solana/wallet-adapter");
    expect(TOKEN_PAGE_SOURCE).not.toContain("useWallet");

    const text = visibleText(renderToStaticMarkup(createElement(Token)));
    expect(text).toContain("The economic layer of verified humanity.");
  });

  it("keeps restored /token copy with a single devnet line and SPL mint details", () => {
    const normalized = visibleText(renderToStaticMarkup(createElement(Token)));

    expect(normalized).toContain(
      "Protocol fees today. Validator utility after hardening.",
    );
    expect(normalized).toContain(
      "$ENTROS is planned to support staking, capacity, and governance.",
    );
    expect(normalized).toContain(
      "The roadmap connects validator security, capacity, and governance to $ENTROS.",
    );
    expect(normalized).toContain("Protocol treasury PDA");
    expect(normalized).not.toContain("Protocol treasury PDA (devnet)");
    expect(normalized).toContain(
      "Users pay the configured fee to write protocol state. Integrators read that state for free. Detection decides whether a verification passes. The fee bounds repeated attempts.",
    );
    expect(normalized).toContain("6 decimals");
    expect(normalized).toContain("mint and freeze authorities revoked");
    expect(normalized).toContain("zero Token-2022 extensions");
    expect(normalized).toContain("Token-2022 NonTransferable mint");
    expect(normalized).toContain("The treasury is on-chain");
    expect(normalized).toContain(
      "Verification runs on Solana devnet today, and $ENTROS utility stays separate from the fee until its mechanisms ship.",
    );
    expect(normalized).toContain("Built to secure human verification.");
    expect(normalized.match(/\bdevnet\b/gi)).toHaveLength(1);
    expect(TOKEN_CONTENT_SOURCE).not.toContain("Revenue Flywheel");
  });

  it("replaces token-runway mainnet funding claims on /roadmap with grant and audit framing", () => {
    const normalized = visibleText(renderToStaticMarkup(createElement(Roadmap)));
    const lower = normalized.toLowerCase();

    expect(lower).not.toContain("the token funds the path to mainnet");
    expect(lower).not.toContain("the token launched to fund the path to mainnet");
    expect(lower).not.toContain("the token funds that work");

    expect(normalized).toContain("zero on-chain verification coupling");
    expect(normalized).toContain(
      "Grants and partner work carry hardening, the ceremony, and the external audit.",
    );
    expect(normalized).toContain(
      "Public grants and open engineering milestones carry that work before mainnet.",
    );
  });

  it("keeps /token and /roadmap copy free of em dashes, banned claims, and internal IDs", () => {
    const combinedText = [
      visibleText(renderToStaticMarkup(createElement(Token))),
      visibleText(renderToStaticMarkup(createElement(Roadmap))),
    ].join("\n");
    const combinedSource = [
      TOKEN_PAGE_SOURCE,
      TOKEN_CONTENT_SOURCE,
      TOKEN_ECONOMICS_SOURCE,
      ROADMAP_PAGE_SOURCE,
    ].join("\n");

    expect(combinedText).not.toContain("\u2014");
    expect(TOKEN_ECONOMICS_SOURCE).not.toContain("\u2014");
    expect(combinedSource).not.toMatch(/#\d+\b/);
    expect(combinedSource).not.toMatch(/Q3\.\d+/);

    const lowerText = combinedText.toLowerCase();
    for (const forbidden of [
      "cost of attack",
      "expensive to fake",
      "raises the cost",
      "slow and expensive",
      "buyback",
      "price target",
      "guarantee",
      "mainnet-ready",
    ]) {
      expect(lowerText).not.toContain(forbidden);
    }
  });
});
