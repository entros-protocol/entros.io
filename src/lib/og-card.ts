import { CATEGORY_LINE } from "./site";

export const OG_CARD_WIDTH = 1200;
export const OG_CARD_HEIGHT = 630;
export const OG_CARD_ROUTE = "/api/og";
export const OG_CARD_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
// Unmatched or untrusted query strings receive the neutral default card with a
// short cache lifetime matching /api/og/anchor.
export const OG_NEUTRAL_CACHE_CONTROL = "public, max-age=300, s-maxage=300";

export const OG_DEFAULT_TITLE = "Private human verification";
export const OG_DEFAULT_DESCRIPTION =
  "Three short rounds put an Entros Anchor on your wallet, and any Solana app can read it for free.";

export const MAX_TITLE_CHARS = 84;
export const MAX_DESCRIPTION_CHARS = 220;
const MAX_PATH_DISPLAY_CHARS = 48;
const SAFE_PATH_REGEX = /^\/[a-zA-Z0-9/_-]{0,96}$/;

export interface OgCardContent {
  title: string;
  description: string;
  path: string | null;
}

export function stripLeadingCategoryOrTitle(
  description: string,
  title?: string,
): string {
  let text = description.trim();
  const candidates = [CATEGORY_LINE];
  if (title) {
    const cleanTitle = title.replace(/[.]+$/, "").trim();
    if (cleanTitle) candidates.push(`${cleanTitle}.`);
  }
  for (const prefix of candidates) {
    if (text.toLowerCase().startsWith(prefix.toLowerCase())) {
      const rest = text.slice(prefix.length).trim();
      if (rest.length > 0) text = rest;
    }
  }
  return text;
}

export function sanitizeOgText(
  raw: string | null | undefined,
  fallback: string,
  maxChars: number,
): string {
  if (!raw) return fallback;
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return fallback;
  if (cleaned.length <= maxChars) return cleaned;

  const sliced = cleaned.slice(0, maxChars - 3);
  const boundary = sliced.lastIndexOf(" ");
  const clipped =
    boundary >= Math.floor(maxChars * 0.5) ? sliced.slice(0, boundary) : sliced;
  return `${clipped.trimEnd()}...`;
}

export function sanitizeOgPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "/" || trimmed.includes("..")) return null;
  if (!SAFE_PATH_REGEX.test(trimmed)) return null;
  return trimmed.replace(/\/+$/, "") || null;
}

export function normalizeOgCardContent(input: {
  title?: string | null;
  description?: string | null;
  path?: string | null;
}): OgCardContent {
  const title = sanitizeOgText(input.title, OG_DEFAULT_TITLE, MAX_TITLE_CHARS);
  const strippedDescription = input.description
    ? stripLeadingCategoryOrTitle(input.description, title)
    : OG_DEFAULT_DESCRIPTION;
  const description = sanitizeOgText(
    strippedDescription,
    OG_DEFAULT_DESCRIPTION,
    MAX_DESCRIPTION_CHARS,
  );
  const path = sanitizeOgPath(input.path);
  return { title, description, path };
}

export function formatOgPathLabel(path: string | null): string {
  const full = path ? `entros.io${path}` : "entros.io";
  if (full.length <= MAX_PATH_DISPLAY_CHARS) return full;
  return `${full.slice(0, MAX_PATH_DISPLAY_CHARS - 3)}...`;
}

export function buildOgImageUrl(path?: string): string {
  const safePath = sanitizeOgPath(path);
  if (!safePath) return OG_CARD_ROUTE;
  const params = new URLSearchParams({ path: safePath });
  return `${OG_CARD_ROUTE}?${params.toString()}`;
}
