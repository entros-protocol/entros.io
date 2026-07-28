import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_IDS } from "@entros/pulse-sdk";

export interface VerificationHistoryEntry {
  id: string;
  timestamp: number;
  commitmentHash: string;
  isValid: boolean;
}

export function commitmentBytesToHex(bytes: Uint8Array): string {
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// Anchor discriminator for VerificationResult account, base58 encoded.
// sha256("account:VerificationResult")[0..8] = [104,111,80,172,219,191,162,38]
const VERIFICATION_RESULT_DISC_B58 = "JU9cxeSQjfT";

/**
 * Fetch VerificationResult PDAs from entros-verifier program.
 * Filters by discriminator (to exclude Challenge accounts) and verifier pubkey.
 * Current layout (182 bytes):
 *   8 disc + 32 verifier + 32 proof_hash + 8 verified_at + 1 is_valid +
 *   32 nonce + 1 bump + 32 commitment_new + 32 commitment_prev +
 *   2 threshold + 2 min_distance
 * This parser reads only the first 80 bytes (up to verified_at), so it is
 * forward-compatible with both pre- and post-patch layouts—the min-length
 * check is intentionally permissive.
 */
export async function fetchVerificationHistory(
  walletPubkey: string,
  connection: Connection,
): Promise<VerificationHistoryEntry[]> {
  const verifierProgramId = new PublicKey(PROGRAM_IDS.entrosVerifier);

  const accounts = await connection.getProgramAccounts(verifierProgramId, {
    filters: [
      { memcmp: { offset: 0, bytes: VERIFICATION_RESULT_DISC_B58 } },
      { memcmp: { offset: 8, bytes: walletPubkey } },
    ],
  });

  const entries: VerificationHistoryEntry[] = [];

  for (const { pubkey, account } of accounts) {
    const data = account.data;
    if (data.length < 81) continue;

    // Skip 8 (discriminator) + 32 (verifier) = 40
    const proofHash = data.slice(40, 72);
    // verified_at: i64 at offset 72
    const verifiedAt = Number(data.readBigInt64LE(72));
    // is_valid is always true for persisted VerificationResults (invalid proofs revert the tx)
    const isValid = true;

    entries.push({
      id: pubkey.toBase58(),
      timestamp: verifiedAt,
      commitmentHash:
        "0x" +
        Array.from(proofHash)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
          .slice(0, 16) +
        "...",
      isValid,
    });
  }

  return entries.sort((a, b) => b.timestamp - a.timestamp);
}
