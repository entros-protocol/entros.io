import { describe, expect, it } from "vitest";
import { generateMetadata } from "../src/app/(app)/verify/page";
import { buildShareUrl, buildTwitterIntent } from "../src/lib/share";
import { SITE_URL } from "../src/lib/site";

const WALLET = "GmaDrppBC7P5ARKV8g3djiwP89vz1jLK23V2GBjuAEGB";

describe("share links", () => {
  it("name the wallet and carry no score", () => {
    expect(buildShareUrl(WALLET, "copy")).toBe(`${SITE_URL}/verify?w=${WALLET}&utm_source=copy`);
    const intent = new URL(buildTwitterIntent(WALLET, 87));
    expect(intent.searchParams.get("url")).toBe(`${SITE_URL}/verify?w=${WALLET}`);
    // The person's own post states the score. The link does not.
    expect(intent.searchParams.get("text")).toContain("Trust Score: 87");
  });

  it("point the share image at the wallet alone, whatever score the link claims", async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ w: WALLET, s: "65535", score: "65535" }),
    });
    const expected = `${SITE_URL}/api/og/anchor?wallet=${WALLET}`;
    expect(metadata.twitter?.images).toEqual([expected]);
    expect(metadata.openGraph?.images).toEqual([
      expect.objectContaining({ url: expected }),
    ]);
  });

  it("keep the default metadata for a link without a valid wallet", async () => {
    const metadata = await generateMetadata({
      searchParams: Promise.resolve({ w: "not-a-wallet", s: "500" }),
    });
    expect(JSON.stringify(metadata)).not.toContain("/api/og/anchor");
  });
});
