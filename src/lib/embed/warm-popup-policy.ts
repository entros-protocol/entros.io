import type { Connection } from "@solana/web3.js";
import {
  fetchIdentityState,
  findLatestVerificationTransaction,
  readIntegratorEvidence,
  type IntegratorEvidenceConnection,
} from "@entros/pulse-sdk";
import {
  evaluatePolicy,
  normalizePolicyRequest,
  type PolicyResult,
} from "@entros/verify/policy";
import { readLastVerification } from "@/lib/last-verification";
import { traceEvidenceConnection, type PolicyDiagnostic } from "./policy-diagnostics";
import type { ParsedEmbedParams } from "./url-params";

export const WARM_POLICY_TIMEOUT_MS = 6_000;

export type WarmPopupPolicyConnection = IntegratorEvidenceConnection &
  Pick<Connection, "getAccountInfo" | "getSignaturesForAddress">;

export type WarmPopupPolicyResult =
  | {
      status: "reused";
      policy: PolicyResult & { decision: "allow" };
      attestationPda: string | null;
      txSignature: string;
    }
  | { status: "needs_capture" };

export interface CheckWarmPopupPolicyOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

const NEEDS_CAPTURE: WarmPopupPolicyResult = { status: "needs_capture" };

/**
 * Checks whether the wallet's existing on-chain verification satisfies the
 * popup policy before starting capture. Preserves the original evidence age.
 * Any miss, denial, RPC failure, timeout, or cancellation falls back to capture.
 */
export async function checkWarmPopupPolicy(
  params: ParsedEmbedParams,
  walletPubkey: string,
  connection: WarmPopupPolicyConnection,
  onDiagnostic?: (diagnostic: PolicyDiagnostic) => void,
  options?: CheckWarmPopupPolicyOptions,
): Promise<WarmPopupPolicyResult> {
  const timeoutMs = options?.timeoutMs ?? WARM_POLICY_TIMEOUT_MS;
  const signal = options?.signal;
  if (signal?.aborted || timeoutMs <= 0) {
    return NEEDS_CAPTURE;
  }

  let settled = false;
  const cancelled = () => settled || Boolean(signal?.aborted);

  const work = async (): Promise<WarmPopupPolicyResult> => {
    try {
      const request =
        params.policy ??
        normalizePolicyRequest({
          ...normalizePolicyRequest(undefined, params.minTrustScore),
          requireAttestation: true,
        });

      const identity = await fetchIdentityState(walletPubkey, connection);
      if (cancelled() || !identity) return NEEDS_CAPTURE;

      const verifiedAt = identity.lastVerificationTimestamp;
      if (!Number.isSafeInteger(verifiedAt) || verifiedAt <= 0) {
        return NEEDS_CAPTURE;
      }

      // Skip transaction search when the identity state already fails the score floor or age limit.
      const precheckNowSeconds = Math.floor(Date.now() / 1000);
      if (
        identity.trustScore < request.minTrustScore ||
        precheckNowSeconds >= verifiedAt + request.maxVerificationAgeSeconds
      ) {
        return NEEDS_CAPTURE;
      }

      const candidate = readLastVerification(walletPubkey);
      const found = await findLatestVerificationTransaction({
        walletPubkey,
        connection,
        verifiedAt,
        ...(candidate ? { candidateSignatures: [candidate] } : {}),
      });
      if (cancelled() || found.status !== "found") return NEEDS_CAPTURE;

      const trace =
        params.diagnosticsEnabled && onDiagnostic
          ? traceEvidenceConnection(connection, walletPubkey)
          : null;
      const readStartedAtMs = Date.now();
      let readNowSeconds = Math.floor(readStartedAtMs / 1000);
      const observation = await readIntegratorEvidence({
        walletPubkey,
        transactionSignature: found.signature,
        connection: trace?.connection ?? connection,
        nowSeconds: () => {
          readNowSeconds = Math.floor(Date.now() / 1000);
          return readNowSeconds;
        },
      });
      if (cancelled()) return NEEDS_CAPTURE;

      const readCompletedAtMs = Date.now();
      const evaluatedAtSeconds = Math.floor(readCompletedAtMs / 1000);
      const result = evaluatePolicy(request, observation, evaluatedAtSeconds);

      if (trace && onDiagnostic) {
        try {
          const rpc = await trace.finish();
          if (!cancelled()) {
            onDiagnostic({
              schemaVersion: 1,
              stage: "warm_policy_reuse",
              sdkVerification: "reused",
              walletPubkey,
              transactionSignature: found.signature,
              readStartedAtMs,
              readCompletedAtMs,
              readNowSeconds,
              evaluatedAtSeconds,
              readStatus: observation.status,
              readReason: observation.status === "available" ? null : observation.reason,
              policyDecision: result.decision,
              policyReason: result.reason,
              requestPolicy: request,
              evidence: result.evidence,
              rpc,
            });
          }
        } catch {
          // Diagnostics must not alter the reuse outcome.
        }
      }

      if (cancelled()) return NEEDS_CAPTURE;
      if (result.decision !== "allow" || !result.evidence) {
        return NEEDS_CAPTURE;
      }

      const attestationPda =
        result.evidence.attestation.status === "present"
          ? result.evidence.attestation.address
          : null;
      // Legacy callers without an explicit policy require a real attestation.
      if (!params.policy && attestationPda === null) {
        return NEEDS_CAPTURE;
      }

      return {
        status: "reused",
        policy: result,
        attestationPda,
        txSignature: found.signature,
      };
    } catch {
      return NEEDS_CAPTURE;
    }
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;

  const fallback = new Promise<WarmPopupPolicyResult>((resolve) => {
    const done = () => {
      settled = true;
      resolve(NEEDS_CAPTURE);
    };
    timer = setTimeout(done, timeoutMs);
    if (signal) {
      onAbort = done;
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });

  try {
    const outcome = await Promise.race([work(), fallback]);
    settled = true;
    return outcome;
  } finally {
    settled = true;
    if (timer !== undefined) clearTimeout(timer);
    if (signal && onAbort) {
      signal.removeEventListener("abort", onAbort);
    }
  }
}
