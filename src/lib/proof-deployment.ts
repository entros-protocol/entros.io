import type { RequestBoundManifest } from "@entros/pulse-sdk";

export function resolveProofDeployment(
  encoded: string | undefined,
  supportsRequestBoundProofs: boolean,
): { requestBoundManifest?: RequestBoundManifest } {
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
  // The generation check above is a fast reject for a stale or foreign manifest.
  // The SDK validates every remaining field before it loads an artifact.
  return { requestBoundManifest: manifest as RequestBoundManifest };
}
