import { afterEach, describe, expect, it, vi } from "vitest";
import { utils } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  AGENT_PERMIT_NETWORK,
  createAgentPermitRequest,
  encodeAgentPermitFragment,
  parseAgentPermitApproval,
  renderAgentPermitMessage,
} from "@entros/verify/agent-permit";
import { normalizePolicyRequest, POLICY_NETWORK, type PolicyEvidence } from "@entros/verify/policy";
import type { AgentStateEvidence, AgentStateReadResult } from "@entros/pulse-sdk";

const mocks = vi.hoisted(() => ({
  readAgentState: vi.fn(),
  fetchIdentityState: vi.fn(),
  findLatestVerificationTransaction: vi.fn(),
  readIntegratorEvidence: vi.fn(),
  verifyAgentWalletBindingRequest: vi.fn(),
}));
vi.mock("@entros/pulse-sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@entros/pulse-sdk")>()),
  ...mocks,
}));

import {
  buildApproval,
  readAuthorizeFragment,
  reviewBindingRequest,
  reviewPermitRequest,
} from "../src/lib/agent-permit-authorize";
import { encodeAgentWalletBindingFragment, PROGRAM_IDS } from "@entros/pulse-sdk";

const now = 1_800_000_000;
const clock = () => now;
const operator = Keypair.generate().publicKey.toBase58();
const agentWallet = Keypair.generate().publicKey.toBase58();
const other = Keypair.generate().publicKey.toBase58();
const agent = Keypair.generate().publicKey.toBase58();
const transaction = utils.bytes.bs58.encode(new Uint8Array(64).fill(3));
const connection = new Connection("http://127.0.0.1:8899");
vi.spyOn(connection, "getGenesisHash").mockResolvedValue(AGENT_PERMIT_NETWORK.genesisHash);
const identityAccount = { data: new Uint8Array(8), executable: false, lamports: 1, owner: PublicKey.default };
// Never reaches a cluster. Each test that reads the identity sets its own answer.
const getAccountInfo = vi.spyOn(connection, "getAccountInfo").mockResolvedValue(identityAccount);

const request = createAgentPermitRequest({
  agent,
  agentWallet,
  operator,
  audience: "https://consumer.example/agent-actions",
  action: { label: "Grant synthetic-vault access for 60 seconds", sha256: "ab".repeat(32) },
  policy: normalizePolicyRequest({
    id: "agent-demo",
    version: 1,
    minTrustScore: 100,
    maxVerificationAgeSeconds: 3600,
    requiredAssurance: "browser_unattested",
    uniquenessRequirement: "allow_unmeasured",
    cluster: "devnet",
  }),
  issuedAt: now - 30,
  lifetimeSeconds: 600,
});

function state(overrides: Partial<AgentStateEvidence> = {}): AgentStateReadResult {
  return {
    status: "available",
    evidence: {
      cluster: "devnet",
      genesisHash: AGENT_PERMIT_NETWORK.genesisHash,
      coreProgram: AGENT_PERMIT_NETWORK.coreProgram,
      agentRegistryProgram: AGENT_PERMIT_NETWORK.agentRegistryProgram,
      agentCollection: AGENT_PERMIT_NETWORK.agentCollection,
      agent,
      agentAccount: other,
      owner: operator,
      cachedOwner: operator,
      agentWallet,
      agentWalletStatus: "bound",
      readContextSlot: 10,
      ...overrides,
    },
  };
}

function evidence(trustScore = 250, age = 10): { status: "available"; evidence: PolicyEvidence } {
  return {
    status: "available",
    evidence: {
      cluster: "devnet",
      genesisHash: POLICY_NETWORK.genesisHash,
      programIds: { ...POLICY_NETWORK.programIds },
      assuranceTier: "browser_unattested",
      uniquenessStatus: "unmeasured",
      readContextSlot: 20,
      identity: {
        walletPubkey: operator,
        identityPda: other,
        mint: other,
        creationTimestamp: now - 86_400,
        lastVerificationTimestamp: now - age,
        verificationCount: 4,
        trustScore,
        currentCommitment: "01".repeat(32),
        projectionVersion: 1,
        lastResetTimestamp: 0,
        lastRebaselineTimestamp: 0,
      },
      transaction: { signature: transaction, slot: 20, blockTime: now - age, commitment: "01".repeat(32), kind: "update" },
      attestation: { status: "missing" },
    },
  };
}

const VERIFIED_AT = now - 60;

function ready() {
  getAccountInfo.mockReset();
  getAccountInfo.mockResolvedValue(identityAccount);
  mocks.readAgentState.mockResolvedValue(state());
  mocks.fetchIdentityState.mockResolvedValue({ lastVerificationTimestamp: VERIFIED_AT });
  mocks.findLatestVerificationTransaction.mockResolvedValue({ status: "found", signature: transaction });
  mocks.readIntegratorEvidence.mockResolvedValue(evidence());
}

afterEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
});

const failing = (review: { checks: { id: string; status: string; detail: string }[] }) =>
  review.checks.filter((check) => check.status === "fail").map((check) => check.id);

describe("agent link fragment", () => {
  const message = renderAgentPermitMessage(request);
  const fragment = encodeAgentPermitFragment(request);

  it("reads a permit request with or without the leading hash", () => {
    for (const value of [`#${fragment}`, fragment]) {
      expect(readAuthorizeFragment(value)).toEqual({ kind: "request", request, message });
    }
  });

  it("reads a binding request and reports a damaged link", () => {
    const binding = { version: 1 as const, agent, agentWallet, owner: operator, deadline: now + 200, signature: "cd".repeat(64) };
    expect(readAuthorizeFragment(`#${encodeAgentWalletBindingFragment(binding)}`)).toEqual({ kind: "bind", binding });
    const truncated = `#${fragment.slice(0, fragment.length - 12)}`;
    for (const value of ["#request=abc", "#bind=abc", "#request=", truncated]) {
      expect(readAuthorizeFragment(value)).toEqual({ kind: "invalid" });
    }
  });

  it("leaves section anchors and other fragments to the page", () => {
    for (const value of ["", "#", "#check", "#requests", "#binding"]) {
      expect(readAuthorizeFragment(value)).toEqual({ kind: "none" });
    }
  });
});

describe("permit request review", () => {
  it("lets the named owner sign when every check passes", async () => {
    ready();
    const review = await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    expect(failing(review)).toEqual([]);
    expect(review.canSign).toBe(true);
    expect(review.verifiedTransaction).toBe(transaction);
    expect(review.policy?.decision).toBe("allow");
  });

  it("stops another wallet before reading its verification", async () => {
    ready();
    const review = await reviewPermitRequest({ request, wallet: other, connection, nowSeconds: clock });
    expect(failing(review)).toEqual(["wallet", "owner", "policy"]);
    expect(mocks.findLatestVerificationTransaction).not.toHaveBeenCalled();
    expect(review.canSign).toBe(false);
  });

  it("reports an expired request", async () => {
    ready();
    const review = await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: () => request.expiresAt });
    expect(failing(review)).toContain("expiry");
    expect(review.canSign).toBe(false);
  });

  it("reports a transferred agent and each agent wallet problem", async () => {
    ready();
    mocks.readAgentState.mockResolvedValueOnce(state({ owner: other, agentWalletStatus: "stale" }));
    expect(failing(await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock }))).toEqual([
      "owner",
      "agentWallet",
    ]);
    mocks.readAgentState.mockResolvedValueOnce(state({ agentWallet: null, agentWalletStatus: "unbound" }));
    expect(failing(await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock }))).toEqual([
      "agentWallet",
    ]);
    mocks.readAgentState.mockResolvedValueOnce(state({ agentWallet: other }));
    const changed = await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    expect(changed.checks.find((check) => check.id === "agentWallet")?.detail).toContain("changed");
    mocks.readAgentState.mockResolvedValueOnce({ status: "invalid", reason: "agent_unregistered" });
    const foreign = await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    expect(foreign.checks.find((check) => check.id === "owner")?.detail).toContain("not an agent");
  });

  it("explains each policy failure and offers a new verification", async () => {
    ready();
    const review = () => reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    mocks.findLatestVerificationTransaction.mockResolvedValueOnce({ status: "none" });
    let result = await review();
    expect(result.checks.at(-1)?.detail).toContain("No recent Entros verification");
    expect(result.needsVerification).toBe(true);
    mocks.readIntegratorEvidence.mockResolvedValueOnce(evidence(99));
    result = await review();
    expect(result.checks.at(-1)?.detail).toContain("Trust Score of 100");
    expect(result.needsVerification).toBe(true);
    mocks.readIntegratorEvidence.mockResolvedValueOnce(evidence(250, 7200));
    result = await review();
    expect(result.checks.at(-1)?.detail).toContain("older than this policy allows");
    expect(result.needsVerification).toBe(true);
    expect((await review()).needsVerification).toBe(false);
  });

  // Any party can send transactions that name the owner's identity account. The search
  // starts from the identity's own verification time, so they cannot bury the verification.
  it("searches from the verification time the identity account holds", async () => {
    ready();
    await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    expect(mocks.fetchIdentityState).toHaveBeenCalledTimes(1);
    expect(mocks.fetchIdentityState.mock.calls[0]?.[0]).toBe(operator);
    expect(mocks.findLatestVerificationTransaction).toHaveBeenCalledWith({
      walletPubkey: operator,
      connection,
      verifiedAt: VERIFIED_AT,
    });
  });

  it("offers the transaction this browser remembers before the search", async () => {
    ready();
    await reviewPermitRequest({
      request,
      wallet: operator,
      connection,
      nowSeconds: clock,
      candidateSignatures: [transaction],
    });
    expect(mocks.findLatestVerificationTransaction).toHaveBeenCalledWith({
      walletPubkey: operator,
      connection,
      verifiedAt: VERIFIED_AT,
      candidateSignatures: [transaction],
    });
  });

  it("offers no remembered transaction without a verification time to check it against", async () => {
    ready();
    mocks.fetchIdentityState.mockResolvedValueOnce(null);
    await reviewPermitRequest({
      request,
      wallet: operator,
      connection,
      nowSeconds: clock,
      candidateSignatures: [transaction],
    });
    expect(mocks.findLatestVerificationTransaction).toHaveBeenCalledWith({
      walletPubkey: operator,
      connection,
    });
  });

  it("reads the identity account once, at the address the SDK derives", async () => {
    ready();
    await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    const [identityPda] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("identity"), new PublicKey(operator).toBuffer()],
      new PublicKey(PROGRAM_IDS.entrosAnchor),
    );
    expect(getAccountInfo).toHaveBeenCalledTimes(1);
    expect(getAccountInfo.mock.calls[0]?.[0]).toEqual(identityPda);
    // The SDK decodes the account already read, without a second request.
    const reader = mocks.fetchIdentityState.mock.calls[0]?.[1] as Connection;
    await expect(reader.getAccountInfo(identityPda)).resolves.toBe(identityAccount);
    expect(getAccountInfo).toHaveBeenCalledTimes(1);
  });

  it("reports a failed identity read as unavailable and runs no search", async () => {
    ready();
    getAccountInfo.mockRejectedValueOnce(new Error("429 Too Many Requests"));
    const result = await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    expect(mocks.findLatestVerificationTransaction).not.toHaveBeenCalled();
    expect(mocks.fetchIdentityState).not.toHaveBeenCalled();
    expect(result.checks.at(-1)?.detail).toBe(
      "Your Entros verification could not be read from devnet. Reload the page to try again.",
    );
    expect(result.needsVerification).toBe(false);
    expect(result.canSign).toBe(false);
  });

  it("searches the newest transactions for a wallet without an identity", async () => {
    ready();
    getAccountInfo.mockResolvedValueOnce(null);
    mocks.findLatestVerificationTransaction.mockResolvedValueOnce({ status: "none" });
    const result = await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    expect(mocks.findLatestVerificationTransaction).toHaveBeenCalledWith({ walletPubkey: operator, connection });
    expect(result.checks.at(-1)?.detail).toContain("No recent Entros verification");
    expect(result.needsVerification).toBe(true);
  });

  it("searches the newest transactions when the identity account cannot be read", async () => {
    ready();
    for (const unreadable of [null, { lastVerificationTimestamp: 0 }]) {
      mocks.findLatestVerificationTransaction.mockClear();
      mocks.fetchIdentityState.mockResolvedValueOnce(unreadable);
      await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
      expect(mocks.findLatestVerificationTransaction).toHaveBeenCalledWith({
        walletPubkey: operator,
        connection,
      });
    }
  });

  it("treats a failed search as a read error, not a missing verification", async () => {
    ready();
    mocks.findLatestVerificationTransaction.mockResolvedValueOnce({ status: "unavailable" });
    const result = await reviewPermitRequest({ request, wallet: operator, connection, nowSeconds: clock });
    expect(result.checks.at(-1)?.detail).toBe("Your Entros verification could not be read from devnet. Reload the page to try again.");
    expect(result.needsVerification).toBe(false);
    expect(result.canSign).toBe(false);
  });

  it("refuses another cluster", async () => {
    ready();
    const elsewhere = new Connection("http://127.0.0.1:8899");
    vi.spyOn(elsewhere, "getGenesisHash").mockResolvedValue("5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d");
    vi.spyOn(elsewhere, "getAccountInfo").mockResolvedValue(identityAccount);
    expect(failing(await reviewPermitRequest({ request, wallet: operator, connection: elsewhere, nowSeconds: clock }))).toEqual([
      "network",
    ]);
  });
});

describe("approval", () => {
  it("encodes the owner signature for the agent", () => {
    const approval = parseAgentPermitApproval(
      buildApproval({ request, signature: new Uint8Array(64).fill(7), verifiedTransaction: transaction }),
    );
    expect(approval).toMatchObject({ operatorSignature: "07".repeat(64), verifiedTransaction: transaction });
    expect(() => buildApproval({ request, signature: new Uint8Array(63), verifiedTransaction: transaction })).toThrow();
  });
});

describe("binding review", () => {
  const binding = { version: 1 as const, agent, agentWallet, owner: operator, deadline: now + 200, signature: "cd".repeat(64) };

  it("lets the owner send a current, signed binding", async () => {
    mocks.verifyAgentWalletBindingRequest.mockReturnValue(true);
    mocks.readAgentState.mockResolvedValue(state({ agentWallet: null, agentWalletStatus: "unbound" }));
    const review = await reviewBindingRequest({ binding, wallet: operator, connection, nowSeconds: clock });
    expect(failing(review)).toEqual([]);
    expect(review.canSend).toBe(true);
  });

  it("refuses a bad signature, a lapsed or distant deadline and another wallet", async () => {
    mocks.verifyAgentWalletBindingRequest.mockReturnValue(false);
    mocks.readAgentState.mockResolvedValue(state({ owner: other }));
    const review = await reviewBindingRequest({ binding: { ...binding, deadline: now }, wallet: other, connection, nowSeconds: clock });
    expect(failing(review)).toEqual(["signature", "expiry", "wallet"]);
    mocks.verifyAgentWalletBindingRequest.mockReturnValue(true);
    const distant = await reviewBindingRequest({ binding: { ...binding, deadline: now + 301 }, wallet: operator, connection, nowSeconds: clock });
    expect(distant.checks.find((check) => check.id === "expiry")?.detail).toContain("too far");
  });

  it("does not resend a binding that already holds", async () => {
    mocks.verifyAgentWalletBindingRequest.mockReturnValue(true);
    mocks.readAgentState.mockResolvedValue(state());
    const review = await reviewBindingRequest({ binding, wallet: operator, connection, nowSeconds: clock });
    expect(review.alreadyBound).toBe(true);
    expect(review.canSend).toBe(false);
  });
});
