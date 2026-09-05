import {
  fetchIdentityState,
  INTEGRATOR_PROGRAM_IDS,
  type IntegratorEvidenceConnection,
  type IntegratorEvidenceReadResult,
} from "@entros/pulse-sdk";
import type { PolicyRequest, PolicyResult } from "@entros/verify/policy";

export interface PolicyDiagnostic {
  schemaVersion: 1;
  stage: "post_submission_policy";
  sdkVerification: "succeeded";
  walletPubkey: string;
  transactionSignature: string;
  readStartedAtMs: number;
  readCompletedAtMs: number;
  readNowSeconds: number;
  evaluatedAtSeconds: number;
  readStatus: IntegratorEvidenceReadResult["status"];
  readReason: string | null;
  policyDecision: PolicyResult["decision"];
  policyReason: PolicyResult["reason"];
  requestPolicy: PolicyRequest;
  evidence: PolicyResult["evidence"];
  rpc: RpcDiagnostic[];
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
interface RpcDiagnostic {
  method: keyof IntegratorEvidenceConnection;
  startedAtMs: number;
  completedAtMs: number;
  outcome: "returned" | "threw";
  snapshot?: Json;
}

type AccountSnapshot = Awaited<ReturnType<IntegratorEvidenceConnection["getAccountInfoAndContext"]>>;

function safeNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) ? value : null;
}

// Keep only public chain metadata. RPC errors and account bytes never enter the report.
export function traceEvidenceConnection(connection: IntegratorEvidenceConnection, wallet: string) {
  const rpc: RpcDiagnostic[] = [];
  const accounts: { record: RpcDiagnostic; value: AccountSnapshot }[] = [];
  let closed = false;
  async function trace<T>(method: keyof IntegratorEvidenceConnection, operation: () => Promise<T>, summarize: (value: T, record: RpcDiagnostic) => Json): Promise<T> {
    const startedAtMs = Date.now();
    let value: T;
    try {
      value = await operation();
    } catch (error) {
      if (!closed && rpc.length < 16) rpc.push({ method, startedAtMs, completedAtMs: Date.now(), outcome: "threw" });
      throw error;
    }
    if (!closed && rpc.length < 16) {
      const record: RpcDiagnostic = { method, startedAtMs, completedAtMs: Date.now(), outcome: "returned" };
      rpc.push(record);
      try { record.snapshot = summarize(value, record); } catch { /* Diagnostics cannot alter the read result. */ }
    }
    return value;
  }
  const traced: IntegratorEvidenceConnection = {
    getGenesisHash: (...args) => trace("getGenesisHash", () => connection.getGenesisHash(...args), value => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) ? value : null),
    getSignatureStatuses: (...args) => trace("getSignatureStatuses", () => connection.getSignatureStatuses(...args), value => ({
      contextSlot: safeNumber(value.context.slot),
      statuses: value.value.slice(0, 1).map(status => status ? {
        slot: safeNumber(status.slot),
        confirmationStatus: ["processed", "confirmed", "finalized"].includes(status.confirmationStatus ?? "") ? status.confirmationStatus ?? null : null,
        hasError: status.err !== null,
      } : null),
    })),
    getParsedTransaction: (...args) => trace("getParsedTransaction", () => connection.getParsedTransaction(...args), value => value ? {
      slot: safeNumber(value.slot), blockTime: safeNumber(value.blockTime),
      metaPresent: value.meta !== null, hasError: value.meta?.err !== null,
      signatureMatches: value.transaction.signatures[0] === args[0],
      signaturesCount: value.transaction.signatures.length,
      walletSigner: value.transaction.message.accountKeys.some(key => key.signer && key.pubkey.toBase58() === wallet),
      instructionCount: value.transaction.message.instructions.length,
      accountCount: value.transaction.message.accountKeys.length,
    } : null),
    getAccountInfoAndContext: (...args) => trace("getAccountInfoAndContext", () => connection.getAccountInfoAndContext(...args), (value, record) => {
      accounts.push({ record, value });
      return {
        address: args[0].toBase58(), contextSlot: safeNumber(value.context.slot),
        present: value.value !== null,
        ...(value.value ? { owner: value.value.owner.toBase58(), executable: value.value.executable, dataLength: value.value.data.length } : {}),
      };
    }),
  };
  return {
    connection: traced,
    async finish(): Promise<RpcDiagnostic[]> {
      closed = true;
      for (const { record, value } of accounts) {
        if (!value.value || typeof record.snapshot !== "object" || record.snapshot === null || Array.isArray(record.snapshot)) continue;
        try {
          const state = value.value.owner.toBase58() === INTEGRATOR_PROGRAM_IDS.anchor
            ? await fetchIdentityState(wallet, { getAccountInfo: async () => value.value })
            : null;
          if (state) record.snapshot.identity = {
            owner: state.owner, creationTimestamp: safeNumber(state.creationTimestamp),
            lastVerificationTimestamp: safeNumber(state.lastVerificationTimestamp),
            lastResetTimestamp: safeNumber(state.lastResetTimestamp),
            lastRebaselineTimestamp: safeNumber(state.lastRebaselineTimestamp),
            verificationCount: safeNumber(state.verificationCount), trustScore: safeNumber(state.trustScore),
            projectionVersion: safeNumber(state.projectionVersion), mint: state.mint,
            currentCommitment: Array.from(state.currentCommitment).map(byte => byte.toString(16).padStart(2, "0")).join(""),
          };
          const data = value.value.data;
          if (value.value.owner.toBase58() === INTEGRATOR_PROGRAM_IDS.sas && data.length >= 173 && data[0] === 2) {
            const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
            const length = view.getUint32(97, true);
            if (length === 31 && data.length === 173 + length) record.snapshot.attestation = {
              verifiedAt: safeNumber(Number(view.getBigInt64(104, true))),
              expiresAt: safeNumber(Number(view.getBigInt64(133 + length, true))),
            };
          }
        } catch { /* Decoding is optional and uses the captured account response. */ }
      }
      return rpc;
    },
  };
}
