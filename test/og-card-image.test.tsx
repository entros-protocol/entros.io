import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  buildOgImageUrl,
  MAX_DESCRIPTION_CHARS,
  normalizeOgCardContent,
  OG_CARD_CACHE_CONTROL,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
  OG_DEFAULT_DESCRIPTION,
  OG_DEFAULT_TITLE,
  OG_NEUTRAL_CACHE_CONTROL,
  sanitizeOgPath,
} from "@/lib/og-card";
import { renderOgCardElement } from "@/lib/og-card-renderer";
import { resolveCanonicalOgCard, STATIC_OG_ROUTES } from "@/lib/og-routes";
import { pageMetadata } from "@/lib/page-metadata";
import { GET } from "@/app/api/og/route";
import { generateMetadata as generateDocsMetadata } from "@/app/docs/[[...slug]]/page";

vi.mock("fumadocs-mdx/next", () => ({
  createMDX: () => (config: unknown) => config,
}));

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function readPngDimensions(buffer: Uint8Array): { width: number; height: number } {
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    expect(buffer[i]).toBe(PNG_MAGIC[i]);
  }
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return {
    width: view.getUint32(16, false),
    height: view.getUint32(20, false),
  };
}

function textOf(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function walkFiles(dir: string, suffix: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, suffix));
    } else if (entry.name.endsWith(suffix)) {
      results.push(full);
    }
  }
  return results;
}

describe("pure OG card renderer and input normalization", () => {
  it("normalizes inputs, strips leading category line, and avoids footer repetition", () => {
    const normalized = normalizeOgCardContent({
      title: "  Compare\n\tModalities  ",
      description:
        "Private human verification. Compare anatomical, credential, KYC, and behavioral human verification.",
      path: "/compare/",
    });

    expect(normalized).toEqual({
      title: "Compare Modalities",
      description:
        "Compare anatomical, credential, KYC, and behavioral human verification.",
      path: "/compare",
    });

    const compareCardText = textOf(renderOgCardElement(normalized));
    expect(compareCardText).toContain("Compare Modalities");
    expect(compareCardText).toContain("entros.io/compare");
    expect(compareCardText).toContain("PRIVATE HUMAN VERIFICATION");
    expect(compareCardText).not.toContain("Private human verification.");

    const homeCardText = textOf(
      renderOgCardElement({
        title: OG_DEFAULT_TITLE,
        description: OG_DEFAULT_DESCRIPTION,
        path: null,
      }),
    );
    expect(homeCardText).toContain(OG_DEFAULT_TITLE);
    expect(homeCardText).toContain("ENTROS PROTOCOL");
    expect(homeCardText).not.toContain("PRIVATE HUMAN VERIFICATION");

    expect(sanitizeOgPath("/../etc/passwd")).toBeNull();
    expect(sanitizeOgPath("https://evil.example/phish")).toBeNull();
    expect(sanitizeOgPath("/")).toBeNull();
  });

  it("never truncates any static site route or docs page OG description", () => {
    const appDir = path.resolve(__dirname, "../src/app");
    const pageFiles = walkFiles(appDir, "page.tsx");
    const seenPaths = new Set<string>();

    for (const file of pageFiles) {
      const content = readFileSync(file, "utf8");
      const match = content.match(
        /pageMetadata\(\{\s*title:\s*"([^"]+)",\s*description:\s*(?:"([^"]+)"|\n\s*"([^"]+)"),\s*path:\s*"([^"]+)"/m,
      );
      if (!match) continue;
      const title = match[1]!;
      const description = (match[2] ?? match[3])!;
      const routePath = match[4]!;
      seenPaths.add(routePath);

      const entry = STATIC_OG_ROUTES[routePath];
      expect(entry, `Missing STATIC_OG_ROUTES entry for ${routePath}`).toBeDefined();
      expect(entry!.title).toBe(title);
      expect(entry!.description).toBe(description);

      const normalized = normalizeOgCardContent({
        title: entry!.title,
        description: entry!.description,
        path: routePath,
      });
      expect(normalized.description.endsWith("..."), routePath).toBe(false);
      expect(normalized.description.length).toBeLessThanOrEqual(
        MAX_DESCRIPTION_CHARS,
      );
    }

    expect(seenPaths.size).toBe(Object.keys(STATIC_OG_ROUTES).length);

    // Explicitly verify /technology retains its full privacy disclosure intact.
    const tech = normalizeOgCardContent({
      ...STATIC_OG_ROUTES["/technology"]!,
      path: "/technology",
    });
    expect(tech.description).toContain(
      "phrase audio leaves for transcription, never stored.",
    );

    // Verify every real docs MDX description fits without ellipsis truncation.
    const docsDir = path.resolve(__dirname, "../content/docs");
    const docFiles = walkFiles(docsDir, ".mdx");
    expect(docFiles.length).toBeGreaterThan(20);
    for (const docFile of docFiles) {
      const raw = readFileSync(docFile, "utf8");
      const descMatch = raw.match(/^description:\s*["']?(.+?)["']?\s*$/m);
      if (!descMatch) continue;
      const normalized = normalizeOgCardContent({
        title: "Doc",
        description: descMatch[1],
        path: "/docs/test",
      });
      expect(normalized.description.endsWith("..."), docFile).toBe(false);
      expect(normalized.description.length).toBeLessThanOrEqual(
        MAX_DESCRIPTION_CHARS,
      );
    }
  });
});

describe("server-resolved /api/og anti-spoofing and PNG rendering", () => {
  it("ignores untrusted title, description, and unknown path params", () => {
    const spoofedClaim = resolveCanonicalOgCard(
      new URLSearchParams({
        title: "Claim 5000 ENTROS Airdrop",
        description: "Connect at scam.xyz",
        path: "/claim",
      }),
      () => undefined,
    );
    expect(spoofedClaim).toEqual({
      matched: false,
      card: {
        title: OG_DEFAULT_TITLE,
        description: OG_DEFAULT_DESCRIPTION,
        path: null,
      },
    });

    const spoofedKnownPath = resolveCanonicalOgCard(
      new URLSearchParams({
        title: "Claim 5000 ENTROS Airdrop",
        path: "/compare",
      }),
      () => undefined,
    );
    expect(spoofedKnownPath.matched).toBe(false);
    expect(spoofedKnownPath.card.title).toBe(OG_DEFAULT_TITLE);
    expect(spoofedKnownPath.card.path).toBeNull();

    const unknownPath = resolveCanonicalOgCard(
      new URLSearchParams({ path: "/not-a-real-route" }),
      () => undefined,
    );
    expect(unknownPath.matched).toBe(false);
    expect(unknownPath.card.path).toBeNull();
  });

  it("renders real 1200x630 PNGs for canonical routes and neutral-caches spoofed requests", async () => {
    const defaultRes = await GET(new Request("https://entros.io/api/og"));
    expect(defaultRes.status).toBe(200);
    expect(defaultRes.headers.get("content-type")).toContain("image/png");
    expect(defaultRes.headers.get("cache-control")).toBe(OG_CARD_CACHE_CONTROL);
    const defaultBytes = new Uint8Array(await defaultRes.arrayBuffer());
    expect(readPngDimensions(defaultBytes)).toEqual({
      width: OG_CARD_WIDTH,
      height: OG_CARD_HEIGHT,
    });

    for (const routePath of [
      "/compare",
      "/technology",
      "/docs/concepts/trust-score",
    ]) {
      const url = buildOgImageUrl(routePath);
      expect(url).not.toContain("title=");
      expect(url).not.toContain("description=");

      const res = await GET(new Request(`https://entros.io${url}`));
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe(OG_CARD_CACHE_CONTROL);
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(readPngDimensions(bytes)).toEqual({
        width: OG_CARD_WIDTH,
        height: OG_CARD_HEIGHT,
      });
    }

    // Spoofed query string renders identical bytes to the neutral default card
    // with the short neutral cache policy.
    const spoofedRes = await GET(
      new Request(
        "https://entros.io/api/og?title=Claim+5000+ENTROS+Airdrop&description=Connect+at+scam.xyz&path=/claim",
      ),
    );
    expect(spoofedRes.status).toBe(200);
    expect(spoofedRes.headers.get("cache-control")).toBe(
      OG_NEUTRAL_CACHE_CONTROL,
    );
    const spoofedBytes = new Uint8Array(await spoofedRes.arrayBuffer());
    expect(Buffer.compare(Buffer.from(spoofedBytes), Buffer.from(defaultBytes))).toBe(0);
  });

  it("traces both OG font assets in next.config.ts for Vercel lambdas", async () => {
    const nextConfig = (await import("../next.config")).default;
    const includes = nextConfig.outputFileTracingIncludes ?? {};

    expect(includes["/api/og"]).toEqual(
      expect.arrayContaining([
        "./public/fonts/Geist-Regular.ttf",
        "./public/fonts/JetBrainsMono-Regular.ttf",
      ]),
    );
    expect(includes["/api/og/*"]).toEqual(
      expect.arrayContaining([
        "./public/fonts/Geist-Regular.ttf",
        "./public/fonts/JetBrainsMono-Regular.ttf",
      ]),
    );
  });
});

describe("per-route summary_large_image coverage", () => {
  it("configures root layout with 1200x630 card and summary_large_image", () => {
    const layoutSource = readFileSync(
      path.resolve(__dirname, "../src/app/layout.tsx"),
      "utf8",
    );

    expect(layoutSource).toContain('card: "summary_large_image"');
    expect(layoutSource).toContain('buildOgImageUrl("/")');
    expect(layoutSource).toContain("width: OG_CARD_WIDTH");
    expect(layoutSource).toContain("height: OG_CARD_HEIGHT");
  });

  it("emits canonical path-keyed 1200x630 OG and Twitter cards from pageMetadata", () => {
    const meta = pageMetadata({
      title: "Compare Modalities",
      description:
        "Compare anatomical, credential, KYC, and behavioral verification.",
      path: "/compare",
    });

    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
    });
    const ogImages = Array.isArray(meta.openGraph?.images)
      ? meta.openGraph.images
      : [];
    expect(ogImages).toHaveLength(1);
    expect(ogImages[0]).toMatchObject({
      url: "/api/og?path=%2Fcompare",
      width: 1200,
      height: 630,
    });
    expect(meta.twitter?.images).toEqual(["/api/og?path=%2Fcompare"]);
  });

  it("emits canonical path-keyed 1200x630 OG and Twitter cards for every docs page", async () => {
    const rootDocs = await generateDocsMetadata({
      params: Promise.resolve({}),
    });
    const conceptDoc = await generateDocsMetadata({
      params: Promise.resolve({ slug: ["concepts", "trust-score"] }),
    });

    for (const [docMeta, expectedUrl] of [
      [rootDocs, "/api/og?path=%2Fdocs"],
      [conceptDoc, "/api/og?path=%2Fdocs%2Fconcepts%2Ftrust-score"],
    ] as const) {
      expect(docMeta.twitter).toMatchObject({
        card: "summary_large_image",
      });
      const images = Array.isArray(docMeta.openGraph?.images)
        ? docMeta.openGraph.images
        : [];
      expect(images).toHaveLength(1);
      expect(images[0]).toMatchObject({
        url: expectedUrl,
        width: 1200,
        height: 630,
      });
      expect(docMeta.twitter?.images).toEqual([expectedUrl]);
    }

    expect(conceptDoc.openGraph).toMatchObject({
      type: "article",
      modifiedTime: "2026-10-27T00:49:22.000Z",
    });
  });
});
