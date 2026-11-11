import { base58ByteLength } from "./base58";

/**
 * Build a Solana Explorer URL for the current cluster.
 * Reads NEXT_PUBLIC_SOLANA_CLUSTER at build time; defaults to devnet.
 */
const cluster =
  (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as
    | "devnet"
    | "mainnet-beta"
    | "localnet"
    | undefined) ?? "devnet";

const BYTE_LENGTH = { address: 32, tx: 64 } as const;

/**
 * Accepts only a 32-byte address or a 64-byte signature, as its type asks.
 * Any other input links to the explorer home, so it never shapes the path.
 */
export function explorerUrl(
  address: string,
  type: "address" | "tx" = "address",
): string {
  const query =
    cluster === "localnet"
      ? "cluster=custom&customUrl=http://localhost:8899"
      : `cluster=${cluster}`;
  if (base58ByteLength(address) !== BYTE_LENGTH[type]) {
    return `https://explorer.solana.com/?${query}`;
  }
  return `https://explorer.solana.com/${type}/${address}?${query}`;
}
