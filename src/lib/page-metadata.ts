import type { Metadata } from "next";
import { OG_IMAGE_PATH, SITE_NAME, TWITTER_HANDLE } from "./site";

type PageMetadataOptions = {
  title: string;
  description: string;
  path: string;
};

/**
 * Build per-page metadata with canonical and openGraph.url scoped to the page.
 * Without this, Next.js shallow-inherits root openGraph fields, making every
 * page's social share card claim the homepage URL.
 *
 * Every field the root layout sets on `openGraph` and `twitter` is restated
 * here. Next.js's metadata merge for `openGraph`/`twitter` is non-uniform
 * (some primitives inherit from parent, arrays and several string fields do
 * not), so the only guarantee that per-page social cards match the root is
 * to declare each field explicitly. Title, description, and url come from
 * the caller; siteName, image, twitter card, site, and creator come from
 * the shared site constants so layout.tsx and this helper stay in lockstep.
 */
export function pageMetadata({
  title,
  description,
  path,
}: PageMetadataOptions): Metadata {
  const shareTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: OG_IMAGE_PATH,
          width: 500,
          height: 500,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: shareTitle,
      description,
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      images: [OG_IMAGE_PATH],
    },
  };
}
