import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import {
  formatOgPathLabel,
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
  parseOgCardParams,
} from "@/lib/og-card";

// Node runtime keeps next/og's rendering WASM and bundled TTF fonts within
// deployment limits and loads traced font assets directly from disk.
export const runtime = "nodejs";

const CARD_CACHE_CONTROL =
  "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

let cachedFonts: [ArrayBuffer, ArrayBuffer] | null = null;

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const copy = new Uint8Array(buffer.byteLength);
  copy.set(buffer);
  return copy.buffer;
}

async function loadFonts(): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (cachedFonts) return cachedFonts;
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  const [geist, mono] = await Promise.all([
    readFile(path.join(fontsDir, "Geist-Regular.ttf")),
    readFile(path.join(fontsDir, "JetBrainsMono-Regular.ttf")),
  ]);
  cachedFonts = [toArrayBuffer(geist), toArrayBuffer(mono)];
  return cachedFonts;
}

function titleFontSize(title: string): number {
  if (title.length <= 28) return 60;
  if (title.length <= 48) return 52;
  return 44;
}

function cardDescription(title: string, description: string): string {
  const prefix = `${title.replace(/[.]+$/, "")}.`;
  if (description.toLowerCase().startsWith(prefix.toLowerCase())) {
    const rest = description.slice(prefix.length).trim();
    if (rest.length > 0) return rest;
  }
  return description;
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const { title, description, path: routePath } = parseOgCardParams(url.searchParams);
  const renderedDescription = cardDescription(title, description);
  const pathLabel = formatOgPathLabel(routePath);
  const [geistRegular, jetbrainsMono] = await loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#000000",
          padding: "32px",
          fontFamily: "Geist",
          color: "#E8E6E0",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#0A0A0F",
            border: "1px solid rgba(232, 230, 224, 0.14)",
            padding: "52px 60px",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -1,
              left: -1,
              width: 120,
              height: 3,
              backgroundColor: "#00E7FE",
              display: "flex",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <svg width="36" height="36" viewBox="0 0 18 18">
                <path fill="#E8E6E0" d="M0 0h18v4H0zM0 7h12v4H0zM0 14h18v4H0z" />
                <path fill="#00E7FE" d="M14 7h4v4h-4z" />
              </svg>
              <span
                style={{
                  fontFamily: "JetBrainsMono",
                  fontSize: 32,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                  color: "#E8E6E0",
                  marginLeft: 14,
                }}
              >
                Entros
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid rgba(232, 230, 224, 0.14)",
                backgroundColor: "#000000",
                padding: "8px 16px",
                fontFamily: "JetBrainsMono",
                fontSize: 16,
                letterSpacing: "0.02em",
                color: "#858595",
              }}
            >
              {pathLabel}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              paddingTop: 28,
              paddingBottom: 28,
            }}
          >
            <div
              style={{
                fontFamily: "Geist",
                fontSize: titleFontSize(title),
                lineHeight: 1.08,
                letterSpacing: "-0.025em",
                color: "#E8E6E0",
                maxWidth: 980,
              }}
            >
              {title}
            </div>

            <div
              style={{
                width: 48,
                height: 2,
                backgroundColor: "#00E7FE",
                marginTop: 26,
                marginBottom: 24,
                display: "flex",
              }}
            />

            <div
              style={{
                fontFamily: "Geist",
                fontSize: 25,
                lineHeight: 1.45,
                color: "rgba(232, 230, 224, 0.76)",
                maxWidth: 960,
              }}
            >
              {renderedDescription}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(232, 230, 224, 0.12)",
              paddingTop: 22,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: "#00E7FE",
                  marginRight: 12,
                  display: "flex",
                }}
              />
              <span
                style={{
                  fontFamily: "JetBrainsMono",
                  fontSize: 15,
                  letterSpacing: "0.14em",
                  color: "rgba(232, 230, 224, 0.72)",
                }}
              >
                SOLANA DEVNET
              </span>
            </div>

            <span
              style={{
                fontFamily: "JetBrainsMono",
                fontSize: 15,
                letterSpacing: "0.12em",
                color: "#858595",
              }}
            >
              PRIVATE HUMAN VERIFICATION
            </span>
          </div>
        </div>
      </div>
    ),
    {
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
        "Cache-Control": CARD_CACHE_CONTROL,
      },
    },
  );
}
