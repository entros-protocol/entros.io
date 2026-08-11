/**
 * Derives the deterministic SAS attestation PDA for a given wallet.
 *
 * The address is derived solely from constants and the wallet pubkey, so
 * it is well-defined whether or not the attestation has been written by
 * the executor yet. The popup emits this PDA in the verified envelope
 * so the integrator can poll for the attestation account asynchronously.
 *
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
