import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  buildOgImageUrl,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
  OG_DEFAULT_DESCRIPTION,
  OG_DEFAULT_TITLE,
  parseOgCardParams,
  sanitizeOgPath,
} from "@/lib/og-card";
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

describe("dynamic 1200x630 OG card route", () => {
  it("sanitizes query parameters and rejects unsafe paths", () => {
    const parsed = parseOgCardParams(
      new URLSearchParams({
        title: "  Compare\n\tModalities  ",
        description: "  A\u0007clean   description. ",
        path: "/compare/",
      }),
    );

    expect(parsed).toEqual({
      title: "Compare Modalities",
      description: "A clean description.",
      path: "/compare",
    });

    expect(sanitizeOgPath("/../etc/passwd")).toBeNull();
    expect(sanitizeOgPath("https://evil.example/phish")).toBeNull();
    expect(sanitizeOgPath("/")).toBeNull();

    const defaults = parseOgCardParams(new URLSearchParams());
    expect(defaults.title).toBe(OG_DEFAULT_TITLE);
    expect(defaults.description).toBe(OG_DEFAULT_DESCRIPTION);
    expect(defaults.path).toBeNull();

    const longTitle = "word ".repeat(40);
    const truncated = parseOgCardParams(
      new URLSearchParams({ title: longTitle }),
    );
    expect(truncated.title.length).toBeLessThanOrEqual(84);
    expect(truncated.title.endsWith("...")).toBe(true);
  });

  it("renders a real 1200x630 PNG card with cache headers", async () => {
    const url = buildOgImageUrl({
      title: "Compare Modalities",
      description:
        "Private human verification. Compare anatomical, credential, KYC, and behavioral evidence.",
      path: "/compare",
    });

    const response = await GET(new Request(`https://entros.io${url}`));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/png");
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(5_000);
    expect(readPngDimensions(bytes)).toEqual({
      width: OG_CARD_WIDTH,
      height: OG_CARD_HEIGHT,
    });
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
    expect(layoutSource).toContain("buildOgImageUrl");
    expect(layoutSource).toContain("width: OG_CARD_WIDTH");
    expect(layoutSource).toContain("height: OG_CARD_HEIGHT");
  });

  it("emits 1200x630 OG and Twitter cards from pageMetadata", () => {
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
      width: 1200,
      height: 630,
    });
    const imageUrl =
      typeof ogImages[0] === "object" && "url" in ogImages[0]
        ? String(ogImages[0].url)
        : "";
    expect(imageUrl).toContain("/api/og?");
    expect(imageUrl).toContain("path=%2Fcompare");
    expect(meta.twitter?.images).toEqual([imageUrl]);
  });

  it("emits 1200x630 OG and Twitter cards for every docs page", async () => {
    const rootDocs = await generateDocsMetadata({
      params: Promise.resolve({}),
    });
    const conceptDoc = await generateDocsMetadata({
      params: Promise.resolve({ slug: ["concepts", "trust-score"] }),
    });

    for (const [docMeta, expectedPath] of [
      [rootDocs, "%2Fdocs"],
      [conceptDoc, "%2Fdocs%2Fconcepts%2Ftrust-score"],
    ] as const) {
      expect(docMeta.twitter).toMatchObject({
        card: "summary_large_image",
      });
      const images = Array.isArray(docMeta.openGraph?.images)
        ? docMeta.openGraph.images
        : [];
      expect(images).toHaveLength(1);
      expect(images[0]).toMatchObject({
        width: 1200,
        height: 630,
      });
      const url =
        typeof images[0] === "object" && "url" in images[0]
          ? String(images[0].url)
          : "";
      expect(url).toContain("/api/og?");
      expect(url).toContain(`path=${expectedPath}`);
      expect(docMeta.twitter?.images).toEqual([url]);
    }

    expect(conceptDoc.openGraph).toMatchObject({
      type: "article",
      modifiedTime: "2026-10-27T00:49:22.000Z",
    });
  });
});
