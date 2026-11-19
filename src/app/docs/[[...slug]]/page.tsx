import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import { source } from "@/lib/source";
import { getMDXComponents } from "@/components/mdx-components";
import {
  buildOgImageUrl,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
} from "@/lib/og-card";
import {
  CATEGORY_LINE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  TWITTER_HANDLE,
} from "@/lib/site";

type Params = { slug?: string[] };

function toValidDate(value: Date | string | number | undefined): Date | undefined {
  if (value === undefined) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug ?? []);
  if (!page) notFound();

  const MDX = page.data.body;
  const lastUpdate = toValidDate(page.data.lastModified);

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} lastUpdate={lastUpdate}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug ?? []);
  if (!page) notFound();

  const path = slug && slug.length > 0 ? `/docs/${slug.join("/")}` : "/docs";
  const canonicalUrl = `${SITE_URL}${path}`;
  const shareTitle = `${page.data.title} | ${SITE_NAME}`;
  const rawDescription = page.data.description?.trim() || SITE_DESCRIPTION;
  const socialDescription = rawDescription.startsWith(CATEGORY_LINE)
    ? rawDescription
    : `${CATEGORY_LINE} ${rawDescription}`;
  const ogImageUrl = buildOgImageUrl(path);
  const lastModified = toValidDate(page.data.lastModified);

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle,
      description: socialDescription,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "article",
      ...(lastModified ? { modifiedTime: lastModified.toISOString() } : {}),
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
