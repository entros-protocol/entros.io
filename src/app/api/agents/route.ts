import { NextResponse } from "next/server";
import { readBoundedJsonResponse } from "@/lib/bounded-json";

const cluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as
    | "devnet"
    | "mainnet-beta"
    | "localnet"
    | undefined) ?? "devnet";

const INDEXER_BASE =
  cluster === "mainnet-beta"
    ? "https://8004-indexer-main.qnt.sh/rest/v1"
    : "https://8004-indexer-dev.qnt.sh/rest/v1";

// Solana base58 pubkey: 32-44 chars, base58 alphabet only.
const PUBKEY_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MAX_AGENTS = 100;
// Text the page shows or links. A field past its limit marks the row malformed.
const MAX_URI_LENGTH = 2_048;
const MAX_NAME_LENGTH = 128;
// The request selects these columns alone, so the cap bounds only what the page uses.
const COLUMNS = "asset,agent_uri,nft_name";
// A full page of rows with each field at its limit, with room to spare.
const MAX_RESPONSE_BYTES = MAX_AGENTS * 4_096;

interface AgentRow {
  asset: string;
  // An agent registered without a URI has none.
  agent_uri: string | null;
  nft_name: string | null;
}

const isBoundedText = (value: unknown, limit: number): value is string | null =>
  value === null || (typeof value === "string" && value.length <= limit);

function parseAgentRow(value: unknown): AgentRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const { asset, agent_uri: agentUri, nft_name: nftName } = row;
  if (typeof asset !== "string" || !PUBKEY_REGEX.test(asset)) return null;
  if (!isBoundedText(agentUri, MAX_URI_LENGTH)) return null;
  if (!isBoundedText(nftName, MAX_NAME_LENGTH)) return null;
  return { asset, agent_uri: agentUri, nft_name: nftName };
}

/**
 * Server-side proxy to the 8004 agent indexer.
 * Bypasses the indexer's missing CORS headers by fetching server-side.
 * Caches at the edge for 30 seconds.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");

  if (!owner || !PUBKEY_REGEX.test(owner)) {
    return NextResponse.json(
      { error: "Invalid or missing owner pubkey" },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const upstream = `${INDEXER_BASE}/agents?select=${COLUMNS}&owner=eq.${owner}&limit=${MAX_AGENTS}`;
    const res = await fetch(upstream, { signal: controller.signal });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Indexer returned ${res.status}` },
        { status: 502 },
      );
    }

    // The indexer is a third party. Read no more than a page can hold, and pass on only
    // well-formed rows, no more than the page asked for.
    let data: unknown;
    try {
      data = await readBoundedJsonResponse(res, MAX_RESPONSE_BYTES);
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof RangeError
              ? "Indexer response too large"
              : "Indexer returned an invalid response",
        },
        { status: 502 },
      );
    }
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Indexer returned an invalid response" },
        { status: 502 },
      );
    }
    const agents = data
      .slice(0, MAX_AGENTS)
      .map(parseAgentRow)
      .filter((row): row is AgentRow => row !== null);
    return NextResponse.json(agents, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Indexer unreachable" },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}
