import type { Metadata } from "next";
import { buildOgImageUrl, OG_CARD_HEIGHT, OG_CARD_WIDTH } from "./og-card";
import { CATEGORY_LINE, SITE_NAME, TWITTER_HANDLE } from "./site";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

/**
 * Build per-page metadata with canonical, openGraph.url, and a 1200x630
 * dynamic OG card scoped to the page.
 *
 * Every field the root layout sets on `openGraph` and `twitter` is restated
 * here because Next.js merges nested metadata objects unevenly across parent
 * and child segments.
 */
export function pageMetadata({
  title,
  description,
  path,
}: PageMetadataOptions): Metadata {
  const shareTitle = `${title} | ${SITE_NAME}`;
  // Shared cards open with the category line so a link says what Entros is.
  const socialDescription = description.startsWith(CATEGORY_LINE)
    ? description
    : `${CATEGORY_LINE} ${description}`;
  const ogImageUrl = buildOgImageUrl(path);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle,
      description: socialDescription,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: OG_CARD_WIDTH,
          height: OG_CARD_HEIGHT,
          alt: shareTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: socialDescription,
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      images: [ogImageUrl],
    },
  };
}
