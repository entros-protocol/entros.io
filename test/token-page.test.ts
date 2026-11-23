// @vitest-environment jsdom

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "dark",
    setTheme: () => undefined,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/token",
}));

vi.mock("@solana/wallet-adapter-react", () => {
  throw new Error("Wallet adapter must not be imported by marketing routes");
});

vi.mock("@/components/providers/pulse-provider", () => {
  throw new Error("PulseProvider must not be imported by marketing routes");
});

import Roadmap, { metadata as roadmapMetadata } from "@/app/roadmap/page";
import sitemap from "@/app/sitemap";
import Token, { metadata as tokenMetadata } from "@/app/token/page";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Navbar } from "@/components/layout/navbar";
import { STATIC_OG_ROUTES } from "@/lib/og-routes";

const TOKEN_PAGE_PATH = resolve(__dirname, "../src/app/token/page.tsx");
const ROADMAP_DOCS = [
  "current.mdx",
  "near-term.mdx",
  "medium-term.mdx",
  "long-term.mdx",
].map((name) => ({
  name,
  content: readFileSync(
    resolve(__dirname, `../content/docs/roadmap/${name}`),
    "utf8",
  ),
}));

function visibleText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function parseHtml(html: string): HTMLDivElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host;
}

describe("/token factual record, navigation cleanup, and /roadmap alignment", () => {
  let mountNode: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    mountNode = document.createElement("div");
    document.body.append(mountNode);
    root = createRoot(mountNode);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    mountNode.remove();
  });

  it("lists /token, /roadmap, and /lab/paired-liveness in sitemap and aligns OG catalog metadata", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain("https://entros.io/token");
    expect(urls).toContain("https://entros.io/roadmap");
    expect(urls).toContain("https://entros.io/lab/paired-liveness");

    expect(tokenMetadata.title).toBe("Token Record");
    expect(tokenMetadata.description).toBe(
      "Factual on-chain record for the $ENTROS SPL mint, Streamflow lockups, and separation from Entros security products.",
    );
    expect(STATIC_OG_ROUTES["/token"]).toEqual({
      title: "Token Record",
      description:
        "Factual on-chain record for the $ENTROS SPL mint, Streamflow lockups, and separation from Entros security products.",
    });

    expect(roadmapMetadata.title).toBe("Roadmap");
    expect(roadmapMetadata.description).toBe(
      "Active work on real-time voice liveness and Web2-first AI agent authorization, plus maintenance status for Solana devnet programs.",
    );
    expect(STATIC_OG_ROUTES["/roadmap"]).toEqual({
      title: "Roadmap",
      description:
        "Active work on real-time voice liveness and Web2-first AI agent authorization, plus maintenance status for Solana devnet programs.",
    });
  });

  it("keeps /token outside the (app) route group and executes with zero wallet-adapter runtime imports", () => {
    expect(existsSync(TOKEN_PAGE_PATH)).toBe(true);
    expect(TOKEN_PAGE_PATH).not.toContain("/(app)/");

    const html = renderToStaticMarkup(createElement(Token));
    expect(html).toContain("$ENTROS token record");
  });

  it("renders verified $ENTROS mint parameters, Streamflow lockups, and zero-coupling facts against independent oracles", () => {
    const html = renderToStaticMarkup(createElement(Token));
    const text = visibleText(html);

    expect(text).toContain("$ENTROS token record");
    expect(text).toContain("fc7hPCHtpNezg7cAp6UoUksHU6Sy98hEGswf8SSEASY");
    expect(text).toContain("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
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

    expect(html).toContain(
      'href="https://solscan.io/token/fc7hPCHtpNezg7cAp6UoUksHU6Sy98hEGswf8SSEASY"',
    );
    expect(html).toContain(
      'href="https://kickstart.markets/token/fc7hPCHtpNezg7cAp6UoUksHU6Sy98hEGswf8SSEASY"',
    );
    expect(text).toContain("View on Solscan");
    expect(text).toContain("Historical launch archive");

    expect(text).toContain("EZYvjJjFdJFCUtyce36LNg6iKcB3JPYFE8BSR2M4jeWh");
    expect(text).toContain("350,776,437 ENTROS");
    expect(text).toContain("Founder sales to date: zero $ENTROS tokens sold.");

    const expectedTranches = [
      {
        netLocked: "110,776,437 ENTROS",
        unlockDate: "Nov 30, 2026",
        metadataId: "C5SNdHSXgL7vcjMDf8D329feKhWKvEttrFtLxewkiS2b",
      },
      {
        netLocked: "120,000,000 ENTROS",
        unlockDate: "Jan 30, 2027",
        metadataId: "EE8h3JT7SoSEG1m6wHmqye1z6PorLDaiD9Fgk56TJYAx",
      },
      {
        netLocked: "120,000,000 ENTROS",
        unlockDate: "Jul 30, 2027",
        metadataId: "HMyXkyHL2qoWTWFV32bs4wECwJoTCufLauZuKSmnVJWf",
      },
    ];

    for (const tranche of expectedTranches) {
      expect(text).toContain(tranche.netLocked);
      expect(text).toContain(tranche.unlockDate);
      expect(text).toContain("Locked (immutable)");
      expect(text).toContain(tranche.metadataId);
      expect(html).toContain(
        `href="https://solscan.io/account/${tranche.metadataId}"`,
      );
    }

    expect(html).toContain('href="/security"');
    expect(html).toContain('href="/docs"');
    expect(html).not.toContain('href="/verify"');
  });

  it("renders zero SEC-risky copy, dead launchpad links, placeholders, or em dashes on /token", () => {
    const html = renderToStaticMarkup(createElement(Token));
    const combined = `${html}\n${visibleText(html)}`;
    const lower = combined.toLowerCase();

    expect(combined).not.toContain("\u2014");

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
      expect(lower).not.toContain(forbidden);
    }
  });

  it("renders Footer with Token Record under About, Paired Liveness Lab under Build, and no Verify/Dashboard/Token in Product", () => {
    const footerHtml = renderToStaticMarkup(createElement(Footer));
    const rootEl = parseHtml(footerHtml);
    const columns = [...rootEl.querySelectorAll('nav[aria-label="Footer"] > div')];

    const linksByColumn = new Map<string, Array<{ text: string; href: string }>>();
    for (const col of columns) {
      const heading = col.querySelector("p")?.textContent?.trim() ?? "";
      const links = [...col.querySelectorAll("a")].map((a) => ({
        text: a.textContent?.trim() ?? "",
        href: a.getAttribute("href") ?? "",
      }));
      linksByColumn.set(heading, links);
    }

    const productHrefs = (linksByColumn.get("Product") ?? []).map((l) => l.href);
    expect(productHrefs).not.toContain("/verify");
    expect(productHrefs).not.toContain("/dashboard");
    expect(productHrefs).not.toContain("/token");

    const buildLinks = linksByColumn.get("Build") ?? [];
    expect(buildLinks).toContainEqual({
      text: "Paired Liveness Lab",
      href: "/lab/paired-liveness",
    });

    const aboutLinks = linksByColumn.get("About") ?? [];
    expect(aboutLinks).toContainEqual({
      text: "Token Record",
      href: "/token",
    });
  });

  it("renders Navbar and interactive MobileNav with B2B routes and zero /verify, /token, or /dashboard links", async () => {
    const navbarHtml = renderToStaticMarkup(createElement(Navbar));
    const navEl = parseHtml(navbarHtml);
    const desktopHrefs = [...navEl.querySelectorAll("a")].map(
      (a) => a.getAttribute("href") ?? "",
    );

    expect(desktopHrefs).toContain("/security");
    expect(desktopHrefs).toContain("/docs");
    expect(desktopHrefs).toContain("/docs/quickstart/mcp-approval");
    expect(desktopHrefs).toContain("/roadmap");
    expect(desktopHrefs).toContain("/paper");
    expect(desktopHrefs).toContain("/lab/paired-liveness");
    expect(desktopHrefs).not.toContain("/verify");
    expect(desktopHrefs).not.toContain("/token");
    expect(desktopHrefs).not.toContain("/dashboard");

    await act(async () => {
      root.render(createElement(MobileNav));
    });

    const trigger = mountNode.querySelector<HTMLButtonElement>(
      'button[aria-label="Open menu"]',
    );
    expect(trigger).not.toBeNull();

    await act(async () => {
      trigger?.click();
    });

    const mobileHrefs = [...mountNode.querySelectorAll("a")].map(
      (a) => a.getAttribute("href") ?? "",
    );
    expect(mobileHrefs).toContain("/security");
    expect(mobileHrefs).toContain("/docs");
    expect(mobileHrefs).toContain("/docs/quickstart/mcp-approval");
    expect(mobileHrefs).toContain("/lab/paired-liveness");
    expect(mobileHrefs).not.toContain("/verify");
    expect(mobileHrefs).not.toContain("/token");
    expect(mobileHrefs).not.toContain("/dashboard");
  });

  it("renders /roadmap and keeps roadmap docs accurate on live status, paused Solana mainnet, and hygiene", () => {
    const roadmapHtml = renderToStaticMarkup(createElement(Roadmap));
    const roadmapText = visibleText(roadmapHtml);
    const docsJoined = ROADMAP_DOCS.map((doc) => doc.content).join("\n");
    const combined = `${roadmapText}\n${docsJoined}`;
    const lower = combined.toLowerCase();

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

    const currentDoc = ROADMAP_DOCS.find((doc) => doc.name === "current.mdx")!;
    expect(currentDoc.content).toContain("T1 through T4b");
    expect(currentDoc.content).toContain("T5 remains open");
    expect(currentDoc.content).not.toContain("T1 through T5");

    expect(combined).not.toContain("\u2014");
    expect(combined).not.toMatch(/#\d+\b/);
    expect(combined).not.toMatch(/\bSprint\s+\d+/i);
    expect(combined).not.toMatch(/Q3\.\d+/);

    for (const forbidden of [
      "devnet today. mainnet next.",
      "the road to mainnet.",
      "fee share",
      "the token funds the path to mainnet",
      "the token launched to fund the path to mainnet",
      "the token funds that work",
      "mechanism map",
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
      expect(lower).not.toContain(forbidden);
    }
  });
});
