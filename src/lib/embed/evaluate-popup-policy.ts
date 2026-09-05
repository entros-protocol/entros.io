import { readIntegratorEvidence, type IntegratorEvidenceConnection } from "@entros/pulse-sdk";
import {
  evaluatePolicy,
  normalizePolicyRequest,
  type PolicyResult,
} from "@entros/verify/policy";
import { traceEvidenceConnection, type PolicyDiagnostic } from "./policy-diagnostics";
import type { ParsedEmbedParams } from "./url-params";

export async function evaluatePopupPolicy(
  params: ParsedEmbedParams,
  walletPubkey: string,
  transactionSignature: string,
  connection: IntegratorEvidenceConnection,
  onDiagnostic?: (diagnostic: PolicyDiagnostic) => void,
): Promise<PolicyResult> {
  const request = params.policy ?? normalizePolicyRequest({
    ...normalizePolicyRequest(undefined, params.minTrustScore),
    requireAttestation: true,
  });
  const trace = params.diagnosticsEnabled && onDiagnostic
    ? traceEvidenceConnection(connection, walletPubkey)
    : null;
  const readStartedAtMs = Date.now();
  let readNowSeconds = Math.floor(readStartedAtMs / 1000);
  const observation = await readIntegratorEvidence({
    walletPubkey,
    transactionSignature,
    connection: trace?.connection ?? connection,
    nowSeconds: () => {
      readNowSeconds = Math.floor(Date.now() / 1000);
      return readNowSeconds;
    },
  });
  const readCompletedAtMs = Date.now();
  const evaluatedAtSeconds = Math.floor(readCompletedAtMs / 1000);
  const result = evaluatePolicy(request, observation, evaluatedAtSeconds);
  if (trace && onDiagnostic) {
    try {
      onDiagnostic({
        schemaVersion: 1, stage: "post_submission_policy", sdkVerification: "succeeded",
        walletPubkey, transactionSignature, readStartedAtMs, readCompletedAtMs,
        readNowSeconds, evaluatedAtSeconds,
        readStatus: observation.status,
        readReason: observation.status === "available" ? null : observation.reason,
        policyDecision: result.decision, policyReason: result.reason,
        requestPolicy: request, evidence: result.evidence, rpc: await trace.finish(),
      });
    } catch { /* Diagnostics must not change the verification result. */ }
  }
  return result;
}
