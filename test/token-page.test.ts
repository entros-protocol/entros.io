import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Roadmap, { metadata as roadmapMetadata } from "@/app/roadmap/page";
import sitemap from "@/app/sitemap";
import Token, { metadata as tokenMetadata } from "@/app/token/page";
import {
  FOUNDER_CUSTODY_WALLET,
  FOUNDER_SALES_STATEMENT,
  STREAMFLOW_NET_LOCKED_TOTAL,
  streamflowTranches,
  TOKEN_LAUNCH_ARCHIVE_URL,
  TOKEN_MINT_ADDRESS,
  TOKEN_PROGRAM_ID,
  TOKEN_SOLSCAN_URL,
} from "@/data/token-economics";
import { STATIC_OG_ROUTES } from "@/lib/og-routes";

const TOKEN_PAGE_PATH = resolve(__dirname, "../src/app/token/page.tsx");
const TOKEN_PAGE_SOURCE = readFileSync(TOKEN_PAGE_PATH, "utf8");
const TOKEN_CONTENT_SOURCE = readFileSync(
  resolve(__dirname, "../src/components/sections/token-content.tsx"),
  "utf8",
);
const TOKEN_LAUNCH_CARD_SOURCE = readFileSync(
  resolve(__dirname, "../src/components/sections/token-launch-card.tsx"),
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
const FOOTER_SOURCE = readFileSync(
  resolve(__dirname, "../src/components/layout/footer.tsx"),
  "utf8",
);
const ROADMAP_DOCS_SOURCES = [
  "current.mdx",
  "near-term.mdx",
  "medium-term.mdx",
  "long-term.mdx",
].map((name) =>
  readFileSync(resolve(__dirname, `../content/docs/roadmap/${name}`), "utf8"),
);

function visibleText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

describe("/token factual record and /roadmap transition alignment", () => {
  it("lists /token and /roadmap in sitemap, links /token in footer, and aligns OG catalog metadata", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://entros.io/token");
    expect(urls).toContain("https://entros.io/roadmap");
    expect(FOOTER_SOURCE).toContain('href="/token"');

    expect(tokenMetadata.title).toBe(STATIC_OG_ROUTES["/token"]!.title);
    expect(tokenMetadata.description).toBe(
      STATIC_OG_ROUTES["/token"]!.description,
    );
    expect(roadmapMetadata.title).toBe(STATIC_OG_ROUTES["/roadmap"]!.title);
    expect(roadmapMetadata.description).toBe(
      STATIC_OG_ROUTES["/roadmap"]!.description,
    );
  });

  it("keeps /token outside the (app) route group with zero wallet-adapter imports", () => {
    expect(existsSync(TOKEN_PAGE_PATH)).toBe(true);
    expect(TOKEN_PAGE_PATH).not.toContain("/(app)/");

    const tokenSources = [
      TOKEN_PAGE_SOURCE,
      TOKEN_CONTENT_SOURCE,
      TOKEN_LAUNCH_CARD_SOURCE,
      TOKEN_ECONOMICS_SOURCE,
    ].join("\n");

    for (const forbiddenImport of [
      "@solana/wallet-adapter",
      "useWallet",
      "PulseProvider",
      "AsciiFlow",
    ]) {
      expect(tokenSources).not.toContain(forbiddenImport);
    }
  });

  it("publishes the verified $ENTROS mint parameters, Streamflow lockups, and product separation", () => {
    const html = renderToStaticMarkup(createElement(Token));
    const text = visibleText(html);

    expect(text).toContain("$ENTROS token record");
    expect(text).toContain(TOKEN_MINT_ADDRESS);
    expect(text).toContain(TOKEN_PROGRAM_ID);
    expect(text).toContain("6 decimals");
    expect(text).toContain("zero Token-2022 extensions");
    expect(text).toContain(
      "Mint authority and freeze authority are both revoked.",
    );
    expect(text).toContain("Token-2022 NonTransferable mint");
    expect(text).toContain(
      "zero coupling to Entros security products, API billing, or engineering roadmaps",
    );
    expect(text).toContain(
      "grants no product access, equity, revenue share, voting control over company operations, or fee rights",
    );

    expect(html).toContain(`href="${TOKEN_SOLSCAN_URL}"`);
    expect(html).toContain(`href="${TOKEN_LAUNCH_ARCHIVE_URL}"`);
    expect(text).toContain("View on Solscan");
    expect(text).toContain("Historical launch archive");

    expect(text).toContain(FOUNDER_CUSTODY_WALLET);
    expect(text).toContain(STREAMFLOW_NET_LOCKED_TOTAL);
    expect(text).toContain(FOUNDER_SALES_STATEMENT);

    expect(streamflowTranches).toHaveLength(3);
    for (const tranche of streamflowTranches) {
      expect(text).toContain(tranche.netLocked);
      expect(text).toContain(tranche.unlockDate);
      expect(text).toContain(tranche.status);
      expect(text).toContain(tranche.metadataId);
      expect(html).toContain(`href="${tranche.solscanUrl}"`);
    }

    expect(html).toContain('href="/security"');
    expect(html).toContain('href="/docs"');
    expect(html).not.toContain('href="/verify"');
  });

  it("bans SEC-risky copy, dead launchpad URLs, and unconfirmed re-lock placeholders on /token", () => {
    const tokenHtml = renderToStaticMarkup(createElement(Token));
    const tokenCombined = [
      tokenHtml,
      visibleText(tokenHtml),
      TOKEN_PAGE_SOURCE,
      TOKEN_CONTENT_SOURCE,
      TOKEN_LAUNCH_CARD_SOURCE,
      TOKEN_ECONOMICS_SOURCE,
    ]
      .join("\n")
      .toLowerCase();

    for (const forbidden of [
      "flywheel",
      "revenue distribution",
      "value from utility",
      "buyback",
      "fee share",
      "kickstart.easya.io",
      "[new_lock_url]",
      "[new_streamflow_id]",
      "[exact_relocked_net]",
      "[new_unlock_date]",
      "re-locked 100%",
      "the economic layer of verified humanity",
      "built to secure human verification",
      "utility expands with decentralization",
      "slashing and incentive design",
    ]) {
      expect(tokenCombined).not.toContain(forbidden);
    }
  });

  it("updates /roadmap and roadmap docs to active voice-defense and AgentPermit tracks with paused Solana mainnet", () => {
    const roadmapHtml = renderToStaticMarkup(createElement(Roadmap));
    const roadmapText = visibleText(roadmapHtml);
    const roadmapCombinedLower = [
      roadmapText,
      ROADMAP_PAGE_SOURCE,
      ...ROADMAP_DOCS_SOURCES,
    ]
      .join("\n")
      .toLowerCase();

    for (const removed of [
      "devnet today. mainnet next.",
      "the road to mainnet.",
      "fee share",
      "the token funds the path to mainnet",
      "the token launched to fund the path to mainnet",
      "the token funds that work",
      "mechanism map",
    ]) {
      expect(roadmapCombinedLower).not.toContain(removed);
    }

    expect(roadmapText).toContain("v2 AASIST-L");
    expect(roadmapText).toContain("131.0 ms");
    expect(roadmapText).toContain("495.5 MB");
    expect(roadmapText).toContain("61.84%");
    expect(roadmapText).toContain("@entros/verify@0.7.0");
    expect(roadmapText).toContain("@entros/pulse-sdk@4.18.1");
    expect(roadmapText).toContain("webrtc_16k");
    expect(roadmapText).toContain("telephony_8k");
    expect(roadmapText).toContain("AgentPermit v2");
    expect(roadmapText).toContain("paused");
    expect(roadmapHtml).toContain('href="/lab/paired-liveness"');
    expect(roadmapHtml).toContain('href="/token"');
  });

  it("keeps /token, /roadmap, and roadmap docs free of em dashes, banned claims, and internal IDs", () => {
    const combinedText = [
      visibleText(renderToStaticMarkup(createElement(Token))),
      visibleText(renderToStaticMarkup(createElement(Roadmap))),
      ...ROADMAP_DOCS_SOURCES,
    ].join("\n");
    const combinedSource = [
      TOKEN_PAGE_SOURCE,
      TOKEN_CONTENT_SOURCE,
      TOKEN_LAUNCH_CARD_SOURCE,
      TOKEN_ECONOMICS_SOURCE,
      ROADMAP_PAGE_SOURCE,
      ...ROADMAP_DOCS_SOURCES,
    ].join("\n");

    expect(combinedText).not.toContain("\u2014");
    expect(combinedSource).not.toContain("\u2014");
    expect(combinedSource).not.toMatch(/#\d+\b/);
    expect(combinedSource).not.toMatch(/\bSprint\s+\d+/i);
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
      "unspoofable",
      "sybil-proof",
    ]) {
      expect(lowerText).not.toContain(forbidden);
    }
  });
});
