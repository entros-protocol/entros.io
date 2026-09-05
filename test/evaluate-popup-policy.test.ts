import { afterEach, describe, expect, it, vi } from "vitest";
import { Connection } from "@solana/web3.js";
import {
  normalizePolicyRequest,
  POLICY_NETWORK,
  type PolicyEvidence,
} from "@entros/verify/policy";
import { evaluatePopupPolicy } from "../src/lib/embed/evaluate-popup-policy";

const { readEvidence } = vi.hoisted(() => ({ readEvidence: vi.fn() }));
vi.mock("@entros/pulse-sdk", () => ({ readIntegratorEvidence: readEvidence }));

const now = 1_800_000_000;
const wallet = POLICY_NETWORK.programIds.anchor;
const signature = "1".repeat(64);
const connection = new Connection("http://127.0.0.1:8899");
const params = {
  integratorKey: "fixture",
  parentOrigin: "http://localhost:3000",
  requestId: "fixture-request",
  cluster: "devnet" as const,
};

function evidence(): PolicyEvidence {
  return {
    cluster: "devnet",
    genesisHash: POLICY_NETWORK.genesisHash,
    programIds: { ...POLICY_NETWORK.programIds },
    assuranceTier: "browser_unattested",
    uniquenessStatus: "unmeasured",
    readContextSlot: 20,
    identity: {
      walletPubkey: wallet,
      identityPda: wallet,
      mint: wallet,
      creationTimestamp: now - 1000,
      lastVerificationTimestamp: now - 5,
      verificationCount: 2,
      trustScore: 7,
      currentCommitment: "01".repeat(32),
      projectionVersion: 1,
      lastResetTimestamp: 0,
      lastRebaselineTimestamp: 0,
    },
    transaction: {
      signature,
      slot: 20,
      blockTime: now - 5,
      commitment: "01".repeat(32),
      kind: "update",
    },
    attestation: { status: "missing" },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  readEvidence.mockReset();
});

describe("popup policy evaluation", () => {
  it("rejects a returned score below the requested floor", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    readEvidence.mockResolvedValue({ status: "available", evidence: evidence() });
    const result = await evaluatePopupPolicy({ ...params, minTrustScore: 100 }, wallet, signature, connection);
    expect(result).toMatchObject({ decision: "deny", reason: "score_below_minimum" });
  });

  it("requires an attestation for the legacy result shape", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    readEvidence.mockResolvedValue({ status: "available", evidence: evidence() });
    const result = await evaluatePopupPolicy(params, wallet, signature, connection);
    expect(result).toMatchObject({ decision: "deny", reason: "attestation_required" });
  });

  it("allows explicit optional-attestation policy without inventing an address", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    readEvidence.mockResolvedValue({ status: "available", evidence: evidence() });
    const result = await evaluatePopupPolicy({ ...params, policy: normalizePolicyRequest(undefined, 7) }, wallet, signature, connection);
    expect(result.decision).toBe("allow");
    expect(result.evidence?.attestation).toEqual({ status: "missing" });
    expect(readEvidence).toHaveBeenCalledWith({ walletPubkey: wallet, transactionSignature: signature, connection, nowSeconds: expect.any(Function) });
  });

  it("refreshes the reader clock after elapsed RPC time", async () => {
    let current = now;
    vi.spyOn(Date, "now").mockImplementation(() => current * 1000);
    readEvidence.mockImplementation(async ({ nowSeconds }: { nowSeconds: () => number }) => {
      expect(nowSeconds()).toBe(now);
      current += 3;
      expect(nowSeconds()).toBe(now + 3);
      return { status: "available", evidence: evidence() };
    });
    const report = vi.fn();
    const result = await evaluatePopupPolicy({ ...params, diagnosticsEnabled: true, policy: normalizePolicyRequest(undefined, 7) }, wallet, signature, connection, report);
    expect(result.decision).toBe("allow");
    expect(report.mock.calls[0][0]).toMatchObject({ readStartedAtMs: now * 1000, readNowSeconds: now + 3, evaluatedAtSeconds: now + 3 });
  });

  it("preserves unavailable RPC as unavailable state", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    readEvidence.mockResolvedValue({ status: "unavailable", reason: "rpc_unavailable" });
    const result = await evaluatePopupPolicy(params, wallet, signature, connection);
    expect(result).toMatchObject({ decision: "unavailable", reason: "state_unavailable", evidence: null });
  });

  it("uses the post-read clock when evidence expires during a read", async () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(now * 1000).mockReturnValue((now + 10) * 1000);
    readEvidence.mockResolvedValue({ status: "available", evidence: evidence() });
    const policy = { ...normalizePolicyRequest(), maxVerificationAgeSeconds: 10 };
    const result = await evaluatePopupPolicy({ ...params, policy }, wallet, signature, connection);
    expect(result).toMatchObject({ decision: "deny", reason: "verification_stale" });
  });
});

describe("opt-in popup diagnostics", () => {
  it("captures the original invalid read after successful submission", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    readEvidence.mockResolvedValue({ status: "invalid", reason: "identity_invalid" });
    const report = vi.fn();
    const result = await evaluatePopupPolicy({ ...params, diagnosticsEnabled: true }, wallet, signature, connection, report);
    expect(result).toMatchObject({ decision: "deny", reason: "invalid_evidence" });
    expect(report).toHaveBeenCalledOnce();
    expect(report.mock.calls[0][0]).toMatchObject({
      schemaVersion: 1, stage: "post_submission_policy", sdkVerification: "succeeded",
      walletPubkey: wallet, transactionSignature: signature,
      readStartedAtMs: now * 1000, readCompletedAtMs: now * 1000,
      readNowSeconds: now, evaluatedAtSeconds: now,
      readStatus: "invalid", readReason: "identity_invalid",
      policyDecision: "deny", policyReason: "invalid_evidence", evidence: null, rpc: [],
    });
  });

  it("does not enable diagnostics without the server flag", async () => {
    readEvidence.mockResolvedValue({ status: "invalid", reason: "transaction_invalid" });
    const report = vi.fn();
    await evaluatePopupPolicy(params, wallet, signature, connection, report);
    expect(report).not.toHaveBeenCalled();
    expect(readEvidence.mock.calls[0][0].connection).toBe(connection);
  });

  it("preserves the result when the receiver throws", async () => {
    readEvidence.mockResolvedValue({ status: "invalid", reason: "identity_invalid" });
    const result = await evaluatePopupPolicy({ ...params, diagnosticsEnabled: true }, wallet, signature, connection, () => { throw new Error("receiver unavailable"); });
    expect(result).toMatchObject({ decision: "deny", reason: "invalid_evidence" });
  });
});
