export function resolveProofDeployment(
  encoded: string | undefined,
  supportsRequestBoundProofs: boolean,
): { requestBoundManifest?: Record<string, unknown> } {
  if (!encoded) return {};
  if (!supportsRequestBoundProofs) {
    throw new Error("This SDK version does not support the configured proof generation.");
  }
  const manifest: unknown = JSON.parse(encoded);
  if (
    typeof manifest !== "object" ||
    manifest === null ||
    Array.isArray(manifest) ||
    !("generation" in manifest) ||
    manifest.generation !== "request-bound-v1"
  ) {
    throw new Error("Invalid proof deployment manifest.");
  }
  return { requestBoundManifest: manifest as Record<string, unknown> };
}
