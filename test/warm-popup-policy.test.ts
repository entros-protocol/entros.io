// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { utils } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import {
  normalizePolicyRequest,
  POLICY_NETWORK,
  type PolicyEvidence,
} from "@entros/verify/policy";
import type { IdentityState } from "@entros/pulse-sdk";
import { storeLastVerification } from "../src/lib/last-verification";

const mocks = vi.hoisted(() => ({
  fetchIdentityState: vi.fn(),
  findLatestVerificationTransaction: vi.fn(),
  readIntegratorEvidence: vi.fn(),
}));

vi.mock("@entros/pulse-sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@entros/pulse-sdk")>()),
  ...mocks,
}));

import {
  checkWarmPopupPolicy,
  WARM_POLICY_TIMEOUT_MS,
} from "../src/lib/embed/warm-popup-policy";

const now = 1_800_000_000;
const wallet = Keypair.generate().publicKey.toBase58();
const identityPda = Keypair.generate().publicKey.toBase58();
const mint = Keypair.generate().publicKey.toBase58();
const attestationAddress = Keypair.generate().publicKey.toBase58();
const signature = utils.bytes.bs58.encode(new Uint8Array(64).fill(7));
const connection = new Connection("http://127.0.0.1:8899");

const baseParams = {
  integratorKey: "fixture",
  parentOrigin: "http://localhost:3000",
  requestId: "warm-request-1",
  cluster: "devnet" as const,
};

function identityState(overrides: Partial<IdentityState> = {}): IdentityState {
  return {
    owner: wallet,
    creationTimestamp: now - 86_400,
    lastVerificationTimestamp: now - 120,
    verificationCount: 3,
    trustScore: 150,
    currentCommitment: new Uint8Array(32).fill(1),
    mint,
    lastResetTimestamp: 0,
    projectionVersion: 1,
    lastRebaselineTimestamp: 0,
    ...overrides,
  };
}

function evidence(overrides: {
  trustScore?: number;
  verifiedAt?: number;
  blockTime?: number;
  attestation?: PolicyEvidence["attestation"];
} = {}): PolicyEvidence {
  const verifiedAt = overrides.verifiedAt ?? now - 120;
  return {
    cluster: "devnet",
    genesisHash: POLICY_NETWORK.genesisHash,
    programIds: { ...POLICY_NETWORK.programIds },
    assuranceTier: "browser_unattested",
    uniquenessStatus: "unmeasured",
    readContextSlot: 40,
    identity: {
      walletPubkey: wallet,
      identityPda,
      mint,
      creationTimestamp: now - 86_400,
      lastVerificationTimestamp: verifiedAt,
      verificationCount: 3,
      trustScore: overrides.trustScore ?? 150,
      currentCommitment: "01".repeat(32),
      projectionVersion: 1,
      lastResetTimestamp: 0,
      lastRebaselineTimestamp: 0,
    },
    transaction: {
      signature,
      slot: 40,
      blockTime: overrides.blockTime ?? verifiedAt,
      commitment: "01".repeat(32),
      kind: "update",
    },
    attestation: overrides.attestation ?? {
      status: "present",
      address: attestationAddress,
      readContextSlot: 40,
      expiresAt: now + 3_600,
    },
  };
}

beforeEach(() => {
  window.localStorage.clear();
  mocks.fetchIdentityState.mockReset();
  mocks.findLatestVerificationTransaction.mockReset();
  mocks.readIntegratorEvidence.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("warm popup policy reuse", () => {
  it("reuses a valid verification and preserves the original verification timestamp", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    const verifiedAt = now - 120;
    mocks.fetchIdentityState.mockResolvedValue(
      identityState({ lastVerificationTimestamp: verifiedAt, trustScore: 150 }),
    );
    mocks.findLatestVerificationTransaction.mockResolvedValue({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockResolvedValue({
      status: "available",
      evidence: evidence({ verifiedAt, trustScore: 150, attestation: { status: "missing" } }),
    });

    const policy = normalizePolicyRequest({
      id: "warm-policy",
      version: 1,
      minTrustScore: 100,
      maxVerificationAgeSeconds: 3_600,
      requiredAssurance: "browser_unattested",
      uniquenessRequirement: "allow_unmeasured",
      requireAttestation: false,
      cluster: "devnet",
    });

    const result = await checkWarmPopupPolicy(
      { ...baseParams, policy },
      wallet,
      connection,
    );

    expect(result.status).toBe("reused");
    if (result.status !== "reused") return;
    expect(result.txSignature).toBe(signature);
    expect(result.attestationPda).toBeNull();
    expect(result.policy.decision).toBe("allow");
    expect(result.policy.evidence.identity.lastVerificationTimestamp).toBe(verifiedAt);
    expect(result.policy.evidenceTimestamp).toBe(verifiedAt);
    expect(result.policy.evaluatedAt).toBe(now);
    expect(result.policy.evaluatedAgeSeconds).toBe(120);
    expect(mocks.findLatestVerificationTransaction).toHaveBeenCalledWith({
      walletPubkey: wallet,
      connection,
      verifiedAt,
    });
  });

  it("forwards a stored last-verification signature as a candidate", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    expect(storeLastVerification(wallet, signature)).toBe(true);
    const verifiedAt = now - 60;
    mocks.fetchIdentityState.mockResolvedValue(
      identityState({ lastVerificationTimestamp: verifiedAt, trustScore: 200 }),
    );
    mocks.findLatestVerificationTransaction.mockResolvedValue({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockResolvedValue({
      status: "available",
      evidence: evidence({ verifiedAt, trustScore: 200 }),
    });

    const result = await checkWarmPopupPolicy(baseParams, wallet, connection);

    expect(result.status).toBe("reused");
    if (result.status !== "reused") return;
    expect(result.attestationPda).toBe(attestationAddress);
    expect(mocks.findLatestVerificationTransaction).toHaveBeenCalledWith({
      walletPubkey: wallet,
      connection,
      verifiedAt,
      candidateSignatures: [signature],
    });
  });

  it("falls back to capture for legacy callers when the attestation is missing", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    mocks.fetchIdentityState.mockResolvedValue(identityState());
    mocks.findLatestVerificationTransaction.mockResolvedValue({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockResolvedValue({
      status: "available",
      evidence: evidence({ attestation: { status: "missing" } }),
    });

    const result = await checkWarmPopupPolicy(baseParams, wallet, connection);
    expect(result).toEqual({ status: "needs_capture" });
  });

  it("falls back to capture when an explicit policy requires an attestation that is missing or expired", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    const policy = normalizePolicyRequest({
      id: "require-sas",
      version: 1,
      minTrustScore: 50,
      maxVerificationAgeSeconds: 3_600,
      requiredAssurance: "browser_unattested",
      uniquenessRequirement: "allow_unmeasured",
      requireAttestation: true,
      cluster: "devnet",
    });

    mocks.fetchIdentityState.mockResolvedValue(identityState());
    mocks.findLatestVerificationTransaction.mockResolvedValue({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockResolvedValueOnce({
      status: "available",
      evidence: evidence({ attestation: { status: "missing" } }),
    });
    expect(
      await checkWarmPopupPolicy({ ...baseParams, policy }, wallet, connection),
    ).toEqual({ status: "needs_capture" });

    mocks.readIntegratorEvidence.mockResolvedValueOnce({
      status: "available",
      evidence: evidence({
        attestation: {
          status: "present",
          address: attestationAddress,
          readContextSlot: 40,
          expiresAt: now - 1,
        },
      }),
    });
    expect(
      await checkWarmPopupPolicy({ ...baseParams, policy }, wallet, connection),
    ).toEqual({ status: "needs_capture" });
  });

  it("skips transaction lookup when the identity state is already stale or below floor", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    const policy = normalizePolicyRequest({
      id: "strict",
      version: 1,
      minTrustScore: 200,
      maxVerificationAgeSeconds: 600,
      requiredAssurance: "browser_unattested",
      uniquenessRequirement: "allow_unmeasured",
      requireAttestation: false,
      cluster: "devnet",
    });

    mocks.fetchIdentityState.mockResolvedValueOnce(
      identityState({ trustScore: 150, lastVerificationTimestamp: now - 10 }),
    );
    expect(
      await checkWarmPopupPolicy({ ...baseParams, policy }, wallet, connection),
    ).toEqual({ status: "needs_capture" });

    mocks.fetchIdentityState.mockResolvedValueOnce(
      identityState({ trustScore: 250, lastVerificationTimestamp: now - 600 }),
    );
    expect(
      await checkWarmPopupPolicy({ ...baseParams, policy }, wallet, connection),
    ).toEqual({ status: "needs_capture" });

    expect(mocks.findLatestVerificationTransaction).not.toHaveBeenCalled();
    expect(mocks.readIntegratorEvidence).not.toHaveBeenCalled();
  });

  it("uses the post-read clock when evidence expires during the read", async () => {
    let current = now;
    vi.spyOn(Date, "now").mockImplementation(() => current * 1000);
    const verifiedAt = now - 595;
    const policy = normalizePolicyRequest({
      id: "tight-window",
      version: 1,
      minTrustScore: 50,
      maxVerificationAgeSeconds: 600,
      requiredAssurance: "browser_unattested",
      uniquenessRequirement: "allow_unmeasured",
      requireAttestation: false,
      cluster: "devnet",
    });

    mocks.fetchIdentityState.mockResolvedValue(
      identityState({ lastVerificationTimestamp: verifiedAt }),
    );
    mocks.findLatestVerificationTransaction.mockResolvedValue({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockImplementation(async ({ nowSeconds }: { nowSeconds: () => number }) => {
      nowSeconds();
      current += 10;
      nowSeconds();
      return { status: "available", evidence: evidence({ verifiedAt }) };
    });

    const result = await checkWarmPopupPolicy(
      { ...baseParams, policy },
      wallet,
      connection,
    );
    expect(result).toEqual({ status: "needs_capture" });
  });

  it("falls back to capture when post-read evidence fails the score floor or legacy minTrustScore", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    mocks.fetchIdentityState.mockResolvedValueOnce(identityState({ trustScore: 80 }));
    expect(
      await checkWarmPopupPolicy({ ...baseParams, minTrustScore: 100 }, wallet, connection),
    ).toEqual({ status: "needs_capture" });

    mocks.fetchIdentityState.mockResolvedValueOnce(identityState({ trustScore: 200 }));
    mocks.findLatestVerificationTransaction.mockResolvedValueOnce({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockResolvedValueOnce({
      status: "available",
      evidence: evidence({ trustScore: 80 }),
    });
    expect(
      await checkWarmPopupPolicy({ ...baseParams, minTrustScore: 100 }, wallet, connection),
    ).toEqual({ status: "needs_capture" });
  });

  it("falls back to capture on missing identity, transaction miss, invalid evidence, or RPC throws", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);

    mocks.fetchIdentityState.mockResolvedValueOnce(null);
    expect(await checkWarmPopupPolicy(baseParams, wallet, connection)).toEqual({
      status: "needs_capture",
    });

    mocks.fetchIdentityState.mockRejectedValueOnce(new Error("rpc offline"));
    expect(await checkWarmPopupPolicy(baseParams, wallet, connection)).toEqual({
      status: "needs_capture",
    });

    mocks.fetchIdentityState.mockResolvedValue(identityState());
    for (const status of ["none", "invalid", "unavailable"] as const) {
      mocks.findLatestVerificationTransaction.mockResolvedValueOnce({ status });
      expect(await checkWarmPopupPolicy(baseParams, wallet, connection)).toEqual({
        status: "needs_capture",
      });
    }

    mocks.findLatestVerificationTransaction.mockRejectedValueOnce(new Error("timeout"));
    expect(await checkWarmPopupPolicy(baseParams, wallet, connection)).toEqual({
      status: "needs_capture",
    });

    mocks.findLatestVerificationTransaction.mockResolvedValue({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockResolvedValueOnce({
      status: "invalid",
      reason: "transaction_invalid",
    });
    expect(await checkWarmPopupPolicy(baseParams, wallet, connection)).toEqual({
      status: "needs_capture",
    });

    mocks.readIntegratorEvidence.mockResolvedValueOnce({
      status: "unavailable",
      reason: "rpc_unavailable",
    });
    expect(await checkWarmPopupPolicy(baseParams, wallet, connection)).toEqual({
      status: "needs_capture",
    });

    mocks.readIntegratorEvidence.mockRejectedValueOnce(new Error("boom"));
    expect(await checkWarmPopupPolicy(baseParams, wallet, connection)).toEqual({
      status: "needs_capture",
    });
  });

  it("falls back cleanly when the warm check exceeds the timeout budget", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now * 1000);

    let resolveEvidence!: (value: unknown) => void;
    const report = vi.fn();
    mocks.fetchIdentityState.mockResolvedValue(identityState());
    mocks.findLatestVerificationTransaction.mockResolvedValue({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockImplementation(
      () => new Promise((resolve) => { resolveEvidence = resolve; }),
    );

    const pending = checkWarmPopupPolicy(
      { ...baseParams, diagnosticsEnabled: true },
      wallet,
      connection,
      report,
    );

    await vi.advanceTimersByTimeAsync(WARM_POLICY_TIMEOUT_MS);
    expect(await pending).toEqual({ status: "needs_capture" });

    // Late resolution after timeout must not emit diagnostics.
    resolveEvidence({ status: "available", evidence: evidence() });
    await Promise.resolve();
    await Promise.resolve();
    expect(report).not.toHaveBeenCalled();
  });

  it("cancels immediately when the abort signal fires", async () => {
    const controller = new AbortController();
    let resolveIdentity!: (value: IdentityState | null) => void;
    mocks.fetchIdentityState.mockImplementation(
      () => new Promise((resolve) => { resolveIdentity = resolve; }),
    );

    const pending = checkWarmPopupPolicy(baseParams, wallet, connection, undefined, {
      signal: controller.signal,
    });
    controller.abort();
    expect(await pending).toEqual({ status: "needs_capture" });

    resolveIdentity(identityState());
    await Promise.resolve();
    expect(mocks.findLatestVerificationTransaction).not.toHaveBeenCalled();
  });

  it("emits opt-in warm diagnostics and tolerates a throwing receiver", async () => {
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    mocks.fetchIdentityState.mockResolvedValue(identityState());
    mocks.findLatestVerificationTransaction.mockResolvedValue({
      status: "found",
      signature,
    });
    mocks.readIntegratorEvidence.mockResolvedValue({
      status: "available",
      evidence: evidence(),
    });

    const report = vi.fn();
    const result = await checkWarmPopupPolicy(
      { ...baseParams, diagnosticsEnabled: true },
      wallet,
      connection,
      report,
    );
    expect(result.status).toBe("reused");
    expect(report).toHaveBeenCalledOnce();
    expect(report.mock.calls[0][0]).toMatchObject({
      schemaVersion: 1,
      stage: "warm_policy_reuse",
      sdkVerification: "reused",
      walletPubkey: wallet,
      transactionSignature: signature,
      readStatus: "available",
      readReason: null,
      policyDecision: "allow",
      policyReason: "accepted",
      rpc: [],
    });

    // Diagnostics remain disabled without the server flag.
    report.mockClear();
    await checkWarmPopupPolicy(baseParams, wallet, connection, report);
    expect(report).not.toHaveBeenCalled();
    expect(mocks.readIntegratorEvidence.mock.calls.at(-1)?.[0].connection).toBe(connection);

    // Throwing diagnostic receivers never change the reuse outcome.
    const tolerated = await checkWarmPopupPolicy(
      { ...baseParams, diagnosticsEnabled: true },
      wallet,
      connection,
      () => {
        throw new Error("receiver unavailable");
      },
    );
    expect(tolerated.status).toBe("reused");
  });
});
