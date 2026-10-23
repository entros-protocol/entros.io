import { SAS_CONFIG } from "@entros/pulse-sdk";

/**
 * The retired devnet credential no longer issues attestations. Its final count
 * is fixed here so the statistic does not depend on that credential's accounts.
 */
export const RETIRED_DEVNET_ATTESTATION_COUNT = 75;

export const DEVNET_SAS_CREDENTIALS = [SAS_CONFIG.entrosCredentialPda] as const;

export function totalAttestationCount(
  accountGroups: readonly (readonly string[])[],
): number {
  return RETIRED_DEVNET_ATTESTATION_COUNT + new Set(accountGroups.flat()).size;
}
