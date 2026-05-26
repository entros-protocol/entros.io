import { SITE_URL, TWITTER_HANDLE } from "./site";

export type ShareSource = "share" | "twitter" | "copy";

const TWITTER_HANDLE_PLAIN = TWITTER_HANDLE.replace(/^@/, "");

export function buildShareUrl(
  wallet: string,
  score: number | null | undefined,
  source: ShareSource = "share"
): string {
  const params = new URLSearchParams({ w: wallet });
  if (typeof score === "number" && score > 0) {
    params.set("s", String(score));
  }
  // utm_source is only useful for attribution we can't get otherwise. X
  // already exposes referrer = twitter.com so adding utm_source there is
  // both redundant and noisy in the visible tweet URL. Keep it for the
  // copy-link path (paste destinations are unknowable without the tag).
  if (source !== "twitter") {
    params.set("utm_source", source);
  }
  return `${SITE_URL}/verify?${params.toString()}`;
}

export function buildTweetText(
  score: number | null | undefined
): string {
  const handle = `@${TWITTER_HANDLE_PLAIN}`;
  if (typeof score === "number" && score > 0) {
    return `I just verified my humanity on ${handle}. Trust Score: ${score}. Verify yours →`;
  }
  return `I just verified my humanity on ${handle}. Verify yours →`;
}

export function buildTwitterIntent(
  wallet: string,
  score: number | null | undefined
): string {
  const shareUrl = buildShareUrl(wallet, score, "twitter");
  const params = new URLSearchParams({
    text: buildTweetText(score),
    url: shareUrl,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
