import type { Connection } from "@solana/web3.js";
import { readIntegratorEvidence } from "@entros/pulse-sdk";
import {
  evaluatePolicy,
  normalizePolicyRequest,
  type PolicyResult,
} from "@entros/verify/policy";
import type { ParsedEmbedParams } from "./url-params";

export async function evaluatePopupPolicy(
  params: ParsedEmbedParams,
  walletPubkey: string,
  transactionSignature: string,
  connection: Connection,
): Promise<PolicyResult> {
  const request = params.policy ?? normalizePolicyRequest({
    ...normalizePolicyRequest(undefined, params.minTrustScore),
    requireAttestation: true,
  });
  const observation = await readIntegratorEvidence({
    walletPubkey,
    transactionSignature,
    connection,
    nowSeconds: Math.floor(Date.now() / 1000),
  });
  return evaluatePolicy(request, observation, Math.floor(Date.now() / 1000));
}
