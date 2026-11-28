import type { Metadata } from "next";
import Link from "next/link";
import { VerifyFlow } from "@/components/sections/verify-flow";
import { pageMetadata } from "@/lib/page-metadata";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const baseMetadata = pageMetadata({
  title: "Verify",
  description:
    "Verify your wallet on Solana devnet: three short rounds of voice, touch and motion, then one signature.",
  path: "/verify",
});

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const walletParam = params.w;
  const wallet =
    typeof walletParam === "string" && PUBKEY_REGEX.test(walletParam)
      ? walletParam
      : null;
  if (!wallet) return baseMetadata;

  // The image route reads the Trust Score from chain. The link supplies the wallet alone.
  const ogImageUrl = `${SITE_URL}/api/og/anchor?${new URLSearchParams({ wallet }).toString()}`;
  // Share-variant title sits below the unfurled image on Twitter / Slack /
  // Discord. Generic "Verify | Entros Protocol" would repeat the cold
  // landing-page framing; "Verified human..." is the right framing for a
  // personal share. Description stays on the baseMetadata default so the
  // surrounding copy complements the image (which carries the score).
  const shareTitle = "Entros verification complete";

  return {
    ...baseMetadata,
    title: shareTitle,
    // Share URLs are user-shared variants, not canonical destinations. The
    // canonical inherited from baseMetadata (alternates.canonical = "/verify")
    // points search engines at the parameterless URL, preventing duplicates.
    robots: { index: false, follow: true },
    openGraph: {
      ...baseMetadata.openGraph,
      title: shareTitle,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      ...baseMetadata.twitter,
      title: shareTitle,
      card: "summary_large_image",
      images: [ogImageUrl],
    },
  };
}

export default function Verify() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-6 text-center md:pt-28 md:pb-8">
          <h1 className="font-display text-4xl font-normal leading-[1.04] tracking-[-0.02em] text-foreground text-balance md:text-5xl lg:text-6xl">
            Verify your wallet
            <span className="text-[var(--verification-accent-text)]">.</span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-balance text-base leading-relaxed text-muted md:text-lg">
            Three short rounds, then one signature on Solana devnet. Your
            wallet gets an Entros Anchor and a Trust Score.
          </p>

          <div
            role="note"
            className="mx-auto mt-5 max-w-2xl bg-surface px-4 py-3 text-left text-sm leading-relaxed text-muted forced-colors:border forced-colors:border-[CanvasText]"
          >
            <p>
              This browser flow also lives in the{" "}
              <Link
                href="/lab/paired-liveness"
                className="font-medium text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 hover:text-foreground motion-reduce:transition-none"
              >
                Paired Liveness Lab
              </Link>
              .{" "}
              <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
                /verify
              </code>
              ,{" "}
              <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
                /verify?w=
              </code>
              , and{" "}
              <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
                /embed/verify-popup
              </code>{" "}
              stay live for{" "}
              <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
                @entros/verify@0.7.0
              </code>{" "}
              and{" "}
              <code className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">
                @entros/pulse-sdk@4.18.1
              </code>{" "}
              compatibility.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-24">
        <VerifyFlow />
      </section>
    </>
  );
}
