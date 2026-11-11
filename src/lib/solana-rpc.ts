import { clusterApiUrl } from "@solana/web3.js";

/** The RPC endpoint the site reads Solana through, on the client and the server. */
export function solanaRpcEndpoint(): string {
  return process.env.NEXT_PUBLIC_SOLANA_RPC ?? clusterApiUrl("devnet");
}
