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
    expect(readEvidence).toHaveBeenCalledWith({ walletPubkey: wallet, transactionSignature: signature, connection, nowSeconds: now });
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
