import { ImageResponse } from "next/og";

// Node runtime, not Edge: this route bundles next/og's rendering WASM (~1 MB)
// plus the fonts, which exceeds Vercel's 1 MB Edge Function size cap (deploy
// fails with "Edge Function size is 1.17 MB"). Node functions have a far larger
// limit and next/og renders identically there. Fonts live in /public and are
// fetched over HTTP from the request's own origin at runtime: on Node,
// fetch(file://) of a bundled asset 500s and fileURLToPath of it throws at
// build, so the public HTTP asset is the reliable cross-runtime path.
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;
const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

function truncateWallet(pubkey: string): string {
  if (pubkey.length <= 12) return pubkey;
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

function parseScore(raw: string | null): number | null {
  if (raw == null) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 65535) return null;
  return n;
}

function parseWallet(raw: string | null): string | null {
  if (raw == null) return null;
  if (!PUBKEY_REGEX.test(raw)) return null;
  return raw;
}

// Fetched once and cached so warm instances don't refetch. Loaded lazily
// inside the handler (not at module scope) so nothing runs during build-time
// page-data collection.
let cachedFonts: [ArrayBuffer, ArrayBuffer] | null = null;
async function loadFonts(origin: string): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (cachedFonts) return cachedFonts;
  const [geist, mono] = await Promise.all([
    fetch(`${origin}/fonts/Geist-Regular.ttf`).then((r) => r.arrayBuffer()),
    fetch(`${origin}/fonts/JetBrainsMono-Regular.ttf`).then((r) => r.arrayBuffer()),
  ]);
  cachedFonts = [geist, mono];
  return cachedFonts;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const wallet = parseWallet(url.searchParams.get("wallet"));
  const score = parseScore(url.searchParams.get("score"));

  const [geistRegular, jetbrainsMono] = await loadFonts(url.origin);

  const showScore = score != null && score > 0;
  const walletDisplay = wallet ? truncateWallet(wallet) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#000",
          color: "#E8E6E0",
          fontFamily: "Geist",
          padding: "72px 80px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            fontFamily: "JetBrainsMono",
            fontSize: 36,
            letterSpacing: "-0.02em",
            color: "#E8E6E0",
          }}
        >
          <span>entros</span>
          <span
            style={{
              display: "flex",
              width: 8,
              height: 8,
              backgroundColor: "#22D3E6",
              marginLeft: 6,
              alignSelf: "flex-end",
              marginBottom: 6,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            marginTop: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontFamily: "JetBrainsMono",
                fontSize: 18,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(232,230,224,0.4)",
              }}
            >
              Verified human
            </div>
            <div
              style={{
                fontFamily: "Geist",
                fontSize: 80,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "#E8E6E0",
              }}
            >
              {walletDisplay ?? "On-chain identity"}
            </div>
            {walletDisplay && (
              <div
                style={{
                  fontFamily: "JetBrainsMono",
                  fontSize: 22,
                  color: "rgba(232,230,224,0.55)",
                }}
              >
                {wallet}
              </div>
            )}
          </div>

          {showScore && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: "JetBrainsMono",
                  fontSize: 18,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(232,230,224,0.4)",
                }}
              >
                Trust Score
              </div>
              <div
                style={{
                  fontFamily: "Geist",
                  fontSize: 180,
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                  color: "#22D3E6",
                }}
              >
                {String(score)}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: "JetBrainsMono",
            fontSize: 18,
            color: "rgba(232,230,224,0.4)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>Solana devnet · on-chain</span>
          <span>entros.io</span>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
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
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
