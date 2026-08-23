import { SAS_CONFIG } from "@entros/pulse-sdk";

const LEGACY_DEVNET_SAS_CREDENTIAL =
  "GaPTkZC6JEGds1G5h645qyUrogx7NWghR2JgjvKQwTDo";

export const DEVNET_SAS_CREDENTIALS = [
  LEGACY_DEVNET_SAS_CREDENTIAL,
  SAS_CONFIG.entrosCredentialPda,
] as const;

export function distinctAttestationCount(
  accountGroups: readonly (readonly string[])[],
): number {
  return new Set(accountGroups.flat()).size;
}
