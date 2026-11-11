/**
 * Client-side fetch for owned agents. Calls our /api/agents proxy
 * (which forwards to the 8004 indexer server-side, bypassing CORS).
 */

export interface OwnedAgent {
  asset: string;
  agentUri: string | null;
  nftName: string | null;
}

interface IndexerAgentRow {
  asset: string;
  agent_uri: string | null;
  nft_name: string | null;
}

export interface FetchAgentsResult {
  agents: OwnedAgent[];
  error: boolean;
}

/**
 * Fetch all agents owned by a wallet via the local proxy route.
 * On failure returns `{ agents: [], error: true }` so the UI can distinguish
 * "no agents found" from "proxy or indexer unreachable".
 */
export async function fetchAgentsByOwner(
  walletPubkey: string,
): Promise<FetchAgentsResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);

  try {
    const res = await fetch(
      `/api/agents?owner=${encodeURIComponent(walletPubkey)}`,
      { signal: controller.signal },
    );
    if (!res.ok) return { agents: [], error: true };

    const rows: IndexerAgentRow[] = await res.json();
    return {
      agents: rows.map((row) => ({
        asset: row.asset,
        agentUri: row.agent_uri,
        nftName: row.nft_name,
      })),
      error: false,
    };
  } catch {
    return { agents: [], error: true };
  } finally {
    clearTimeout(timer);
  }
}
