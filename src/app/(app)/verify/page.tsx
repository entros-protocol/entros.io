import type { Metadata } from "next";
import { VerifyFlow } from "@/components/sections/verify-flow";
import { pageMetadata } from "@/lib/page-metadata";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const baseMetadata = pageMetadata({
  title: "Verify",
  description:
    "Prove you are human with Entros Protocol. Twelve seconds of voice, motion, and touch—anchored on Solana devnet, readable by every dApp.",
  path: "/verify",
});

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const walletParam = params.w;
  const scoreParam = params.s;
  const wallet =
    typeof walletParam === "string" && PUBKEY_REGEX.test(walletParam)
      ? walletParam
      : null;
  if (!wallet) return baseMetadata;

  const scoreNum =
    typeof scoreParam === "string" ? Number.parseInt(scoreParam, 10) : NaN;
  const score =
    Number.isFinite(scoreNum) && scoreNum >= 0 && scoreNum <= 65535
      ? scoreNum
      : null;

  const ogParams = new URLSearchParams({ wallet });
  if (score != null && score > 0) ogParams.set("score", String(score));
  const ogImageUrl = `${SITE_URL}/api/og/anchor?${ogParams.toString()}`;

  return {
    ...baseMetadata,
    // Share URLs are user-shared variants, not canonical destinations. The
    // canonical inherited from baseMetadata (alternates.canonical = "/verify")
    // points search engines at the parameterless URL, preventing duplicates.
    robots: { index: false, follow: true },
    openGraph: {
      ...baseMetadata.openGraph,
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
      card: "summary_large_image",
      images: [ogImageUrl],
    },
  };
}

export default function Verify() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-12 text-center md:pt-40 md:pb-16">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // VERIFY
          </span>

          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Mint your Anchor<span className="text-cyan">.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-foreground/65 md:mt-8 md:text-lg">
            Twelve seconds of voice, motion, and touch. Connect your Solana
            wallet to mint an Entros Anchor with a portable, on-chain Trust
            Score readable by every dApp.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-32">
        <VerifyFlow />
      </section>
    </>
  );
}
