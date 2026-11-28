import { ImageResponse } from "next/og";
import { Connection } from "@solana/web3.js";
import { fetchIdentityState } from "@entros/pulse-sdk";
import { loadOgFonts } from "@/lib/server/og-fonts";
import { solanaRpcEndpoint } from "@/lib/solana-rpc";

// Node runtime keeps next/og's rendering WASM and bundled TTF fonts within
// deployment limits and loads traced font assets directly from disk.
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;
const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const IDENTITY_READ_TIMEOUT_MS = 4_000;
const VERIFIED_CACHE_CONTROL = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";
// A missing identity and a failed read look the same, so the neutral image expires soon.
const NEUTRAL_CACHE_CONTROL = "public, max-age=300, s-maxage=300";

function truncateWallet(pubkey: string): string {
  if (pubkey.length <= 12) return pubkey;
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

function parseWallet(raw: string | null): string | null {
  if (raw == null) return null;
  if (!PUBKEY_REGEX.test(raw)) return null;
  return raw;
}

/**
 * The wallet's on-chain Trust Score, or null when the wallet has no identity
 * account or the read fails. The image claims nothing it did not read from chain.
 */
async function readTrustScore(wallet: string): Promise<number | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), IDENTITY_READ_TIMEOUT_MS);
  });
  try {
    const identity = await Promise.race([
      fetchIdentityState(wallet, new Connection(solanaRpcEndpoint(), "confirmed")),
      timeout,
    ]);
    return identity && identity.owner === wallet ? identity.trustScore : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = parseWallet(url.searchParams.get("wallet"));

  const [[geistRegular, jetbrainsMono], score] = await Promise.all([
    loadOgFonts(),
    requested ? readTrustScore(requested) : null,
  ]);

  const wallet = score === null ? null : requested;
  const showScore = score !== null && score > 0;
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
              fontSize: 36,
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
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
            marginTop: 40,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {walletDisplay && (
              <div
                style={{
                  fontFamily: "JetBrainsMono",
                  fontSize: 18,
                  color: "rgba(232,230,224,0.65)",
                }}
              >
                Verified human
              </div>
            )}
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
                  color: "rgba(232,230,224,0.65)",
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
            color: "rgba(232,230,224,0.65)",
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
        "Cache-Control": wallet ? VERIFIED_CACHE_CONTROL : NEUTRAL_CACHE_CONTROL,
      },
    }
  );
}
