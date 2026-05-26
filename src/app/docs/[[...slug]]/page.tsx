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
import { SITE_NAME, SITE_URL } from "@/lib/site";

type Params = { slug?: string[] };

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const page = source.getPage(slug ?? []);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
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

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: path },
    openGraph: {
      title: shareTitle,
      description: page.data.description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: shareTitle,
      description: page.data.description,
    },
  };
}
