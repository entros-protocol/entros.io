/**
 * Derives the deterministic SAS attestation PDA for a given wallet.
 *
 * This candidate address does not establish account existence or issuance.
 * Policy evaluation uses the SDK's strict evidence reader before returning an address.
 */
import { PublicKey } from "@solana/web3.js";
import { SAS_CONFIG } from "@entros/pulse-sdk";

export function deriveAttestationPda(walletPubkey: string): string {
  const sasProgram = new PublicKey(SAS_CONFIG.programId);
  const credential = new PublicKey(SAS_CONFIG.entrosCredentialPda);
  const schema = new PublicKey(SAS_CONFIG.entrosSchemaPda);
  const wallet = new PublicKey(walletPubkey);

  const [pda] = PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode("attestation"),
      credential.toBuffer(),
      schema.toBuffer(),
      wallet.toBuffer(),
    ],
    sasProgram,
  );
  return pda.toBase58();
}
