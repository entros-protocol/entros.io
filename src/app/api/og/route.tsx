import { ImageResponse } from "next/og";
import {
  OG_CARD_CACHE_CONTROL,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
  OG_NEUTRAL_CACHE_CONTROL,
} from "@/lib/og-card";
import { renderOgCardElement } from "@/lib/og-card-renderer";
import { resolveCanonicalOgCard } from "@/lib/og-routes";
import { loadOgFonts } from "@/lib/server/og-fonts";
import { source } from "@/lib/source";

// Node runtime keeps next/og's rendering WASM and bundled TTF fonts within
// deployment limits and loads traced font assets directly from disk.
export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { matched, card } = resolveCanonicalOgCard(url.searchParams, (slug) =>
    source.getPage(slug),
  );
  const [geistRegular, jetbrainsMono] = await loadOgFonts();

  return new ImageResponse(renderOgCardElement(card), {
    width: OG_CARD_WIDTH,
    height: OG_CARD_HEIGHT,
    fonts: [
      {
        name: "Geist",
        data: geistRegular,
        style: "normal",
        weight: 400,
      },
      {
        name: "JetBrainsMono",
        data: jetbrainsMono,
        style: "normal",
        weight: 400,
      },
    ],
    headers: {
      "Cache-Control": matched
        ? OG_CARD_CACHE_CONTROL
        : OG_NEUTRAL_CACHE_CONTROL,
    },
  });
}
