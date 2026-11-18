// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PairedProtocolError, type PairedSessionOptions } from "@entros/pulse-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The partner popup runs the same paired rounds as /verify and reports them to
 * the integrator through the existing wire contract. These tests pin both
 * halves: the capture it starts, and the envelopes the opener receives.
 */

const harness = vi.hoisted(() => ({
  publicKey: null as unknown,
  singleSessions: 0,
  pairedOptions: [] as unknown[],
  starts: 0,
  completes: 0,
  completeResult: undefined as unknown,
  setPhase: (() => undefined) as (phase: string) => void,
  emitted: [] as { type: string; value: unknown }[],
  /** The paired authorization the SDK holds, or null until the wallet signs. */
  authorization: null as unknown,
  authorizeCalls: 0,
  /** How the next wallet prompt settles. */
  authorizeOutcome: (): Promise<void> => Promise.resolve(),
  prepareCalls: 0,
  /** How the next grant request settles. */
  prepareOutcome: (): Promise<void> => Promise.resolve(),
  /** Optional warm-policy check override; null exercises the real module. */
  warmCheck: null as ((...args: unknown[]) => Promise<unknown>) | null,
  /** When true, forward to the real policyResultToWire encoder. */
  realPolicyWire: false,
}));

vi.mock("@solana/web3.js", () => ({
  PublicKey: class {},
  Connection: class {},
  clusterApiUrl: () => "https://example.invalid",
}));

const connection = vi.hoisted(() => ({ getAccountInfo: async () => null }));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    connected: harness.publicKey !== null,
    publicKey: harness.publicKey,
    wallet: { adapter: {} },
    signMessage: async () => new Uint8Array(64),
    disconnect: async () => undefined,
  }),
  useConnection: () => ({ connection }),
}));

vi.mock("@/components/ui/wallet-connect-button", () => ({
  WalletConnectButton: () => null,
}));

vi.mock("@/hooks/use-motion-capability", () => ({
  useMotionCapability: () => false,
}));

vi.mock("@/lib/embed/post-message", () => ({
  emitHeartbeat: (_ctx: unknown, status: string) =>
    harness.emitted.push({ type: "heartbeat", value: status }),
  emitError: (_ctx: unknown, reason: string) =>
    harness.emitted.push({ type: "error", value: reason }),
  emitVerified: (_ctx: unknown, payload: unknown) =>
    harness.emitted.push({ type: "verified", value: payload }),
  emitPolicyDiagnostic: () => undefined,
}));

vi.mock("@/lib/embed/evaluate-popup-policy", () => ({
  evaluatePopupPolicy: async () => ({
    decision: "allow",
    reason: null,
    evidence: {
      attestation: { status: "present", address: "attestation-pda" },
      identity: { trustScore: 42 },
    },
  }),
}));

vi.mock("@/lib/embed/warm-popup-policy", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/embed/warm-popup-policy")>();
  return {
    ...actual,
    checkWarmPopupPolicy: (...args: Parameters<typeof actual.checkWarmPopupPolicy>) =>
      harness.warmCheck
        ? (harness.warmCheck(...args) as ReturnType<typeof actual.checkWarmPopupPolicy>)
        : actual.checkWarmPopupPolicy(...args),
  };
});

vi.mock("@entros/verify/policy", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@entros/verify/policy")>();
  return {
    ...actual,
    policyResultToWire: (result: Parameters<typeof actual.policyResultToWire>[0]) =>
      harness.realPolicyWire ? actual.policyResultToWire(result) : { decision: "allow" },
  };
});

vi.mock("@/components/providers/pulse-provider", () => {
  // One instance for every render, as the provider gives.
  const pulse = {
    pairedAuthorization: () => harness.authorization,
    preparePairedAuthorization: async () => {
      harness.prepareCalls += 1;
      await harness.prepareOutcome();
    },
    authorizePairedSession: async () => {
      harness.authorizeCalls += 1;
      await harness.authorizeOutcome();
      harness.authorization = { expiresAtMs: performance.now() + 900_000 };
      return harness.authorization;
    },
    createSession: () => {
      harness.singleSessions += 1;
      return {};
    },
    createPairedSession: (options: unknown) => {
      harness.pairedOptions.push(options);
      let phase = "idle";
      harness.setPhase = (next: string) => {
        phase = next;
      };
      return {
        get currentPhase() {
          return phase;
        },
        start: async () => {
          harness.starts += 1;
          phase = "round";
        },
        continueRound: () => false,
        complete: async () => {
          harness.completes += 1;
          return harness.completeResult;
        },
        completeReset: async () => harness.completeResult,
        abort: () => {
          phase = "failed";
        },
      };
    },
  };
  return { usePulse: () => pulse };
});

import {
  evaluatePolicy,
  normalizePolicyRequest,
  POLICY_NETWORK,
  type PolicyEvidence,
} from "@entros/verify/policy";
import { PopupContent } from "../src/components/embed/popup-content";
import { readLastVerification } from "../src/lib/last-verification";
import type { CheckWarmPopupPolicyOptions, WarmPopupPolicyResult } from "../src/lib/embed/warm-popup-policy";

const WALLET = { toBase58: () => "11111111111111111111111111111112" };
const PARAMS = {
  integratorKey: "partner",
  parentOrigin: "https://partner.example",
  cluster: "devnet" as const,
  requestId: "request-1",
};

let container: HTMLDivElement;
let root: Root;

async function flush() {
  await act(async () => {
    await vi.dynamicImportSettled();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function renderPopup() {
  await act(async () => root.render(<PopupContent params={PARAMS} />));
  await flush();
}

async function clickStart(label = "Start Verification") {
  const button = [...container.querySelectorAll("button")].find(
    (node) => node.textContent === label,
  );
  expect(button).toBeDefined();
  expect(button!.disabled).toBe(false);
  await act(async () => {
    button!.click();
    await Promise.resolve();
  });
  await flush();
}

function latestOptions(): PairedSessionOptions {
  return harness.pairedOptions.at(-1) as PairedSessionOptions;
}

async function commitRounds() {
  await act(async () => {
    harness.setPhase("ready");
    latestOptions().onPhase?.("ready");
    await Promise.resolve();
  });
  await flush();
  await flush();
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  harness.publicKey = WALLET;
  harness.singleSessions = 0;
  harness.pairedOptions = [];
  harness.starts = 0;
  harness.completes = 0;
  harness.completeResult = undefined;
  harness.emitted = [];
  // The wallet has signed already, as it has on every tap after the first of a visit.
  harness.authorization = { expiresAtMs: performance.now() + 900_000 };
  harness.authorizeCalls = 0;
  harness.authorizeOutcome = () => Promise.resolve();
  harness.prepareCalls = 0;
  harness.prepareOutcome = () => Promise.resolve();
  harness.warmCheck = null;
  harness.realPolicyWire = false;
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("embed popup wallet authorization", () => {
  // A session starts inside one tap, because the microphone and motion permissions need
  // that gesture. The wallet prompt therefore takes a tap of its own, before it.
  it("has the wallet sign in one tap and starts the capture on the next", async () => {
    harness.authorization = null;
    await renderPopup();

    await clickStart("Authorize Wallet");
    expect(harness.authorizeCalls).toBe(1);
    expect(harness.pairedOptions).toHaveLength(0);
    expect(harness.emitted).toEqual([]);

    await clickStart();
    expect(harness.authorizeCalls).toBe(1);
    expect(harness.starts).toBe(1);
  });

  it("says why the wallet did not authorize and starts nothing", async () => {
    harness.authorization = null;
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await renderPopup();
    await clickStart("Authorize Wallet");
    expect(container.textContent).toContain("The wallet did not sign. Try again.");
    expect(harness.pairedOptions).toHaveLength(0);
    // The opener hears nothing until a capture starts.
    expect(harness.emitted).toEqual([]);
  });
});

describe("embed popup paired rounds", () => {
  it("starts the paired rounds from the tap and never the single capture", async () => {
    await renderPopup();
    expect(container.textContent).toContain(
      "Authorize your wallet, complete three short rounds, then approve one transaction.",
    );

    await clickStart();

    expect(harness.singleSessions).toBe(0);
    expect(harness.pairedOptions).toHaveLength(1);
    expect(harness.starts).toBe(1);
    expect(harness.emitted).toEqual([{ type: "heartbeat", value: "capturing" }]);
    expect(
      container.querySelector('[data-testid="paired-trace-surface"]'),
    ).not.toBeNull();
  });

  it("reports an unreachable service as network_error", async () => {
    await renderPopup();
    await clickStart();

    await act(async () => {
      latestOptions().onFailure?.(new PairedProtocolError("validation_unavailable"));
      await Promise.resolve();
    });
    await flush();

    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "network_error" });
  });

  it("reports an expired round as timeout", async () => {
    await renderPopup();
    await clickStart();

    await act(async () => {
      latestOptions().onFailure?.(new PairedProtocolError("round_expired"));
      await Promise.resolve();
    });
    await flush();

    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "timeout" });
  });

  it("collapses a rejected verification into validation_failed", async () => {
    harness.completeResult = {
      success: false,
      commitment: new Uint8Array(32),
      isFirstVerification: false,
      error: "capture needs a retry",
      reason: "anchor_retry",
      failedAt: "validation",
    };
    await renderPopup();
    await clickStart();
    await commitRounds();

    expect(harness.completes).toBe(1);
    expect(harness.emitted.map((event) => event.value)).toContain("proving");
    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "validation_failed" });
  });

  it("hands the verified result to the opener after all three rounds", async () => {
    harness.completeResult = {
      success: true,
      commitment: new Uint8Array(32),
      isFirstVerification: true,
      txSignature: "tx-signature",
    };
    await renderPopup();
    await clickStart();
    await commitRounds();

    expect(harness.emitted.filter((event) => event.type === "heartbeat")).toEqual([
      { type: "heartbeat", value: "capturing" },
      { type: "heartbeat", value: "proving" },
      { type: "heartbeat", value: "attesting" },
    ]);
    expect(harness.emitted.at(-1)).toEqual({
      type: "verified",
      value: {
        wallet_pubkey: "11111111111111111111111111111112",
        attestation_pda: "attestation-pda",
        tx_sig: "tx-signature",
        trust_score: 42,
        cluster: "devnet",
        policy: { decision: "allow" },
      },
    });
  });
});

describe("embed popup capture start and authorization refusals", () => {
  const SIGNATURE = "6".repeat(88);
  const unsupported = () => Promise.reject(new PairedProtocolError("unsupported_session", 404));

  // The microphone and motion permissions need the tap's gesture, so nothing may
  // be awaited between the tap and the session start.
  it("starts the capture before the tap's handler returns", async () => {
    await renderPopup();
    const button = [...container.querySelectorAll("button")].find(
      (node) => node.textContent === "Start Verification",
    )!;
    let startedInTap = -1;
    act(() => {
      button.click();
      startedInTap = harness.starts;
    });
    expect(startedInTap).toBe(1);
    await flush();
  });

  it("prepares a new authorization after a session is refused for want of one", async () => {
    harness.authorization = null;
    harness.prepareOutcome = unsupported;
    await renderPopup();
    await clickStart();
    expect(harness.starts).toBe(1);
    const prepared = harness.prepareCalls;

    harness.prepareOutcome = () => Promise.resolve();
    await act(async () => {
      latestOptions().onFailure?.(new PairedProtocolError("authorization_required", 401));
      await Promise.resolve();
    });
    await flush();
    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "network_error" });
    expect(harness.prepareCalls).toBe(prepared + 1);
  });

  it("prepares a new authorization after a verification is refused for want of one", async () => {
    harness.authorization = null;
    harness.prepareOutcome = unsupported;
    harness.completeResult = {
      success: false,
      commitment: new Uint8Array(32),
      isFirstVerification: false,
      error: "refused",
      reason: "authorization_invalid",
      failedAt: "validation",
    };
    await renderPopup();
    await clickStart();
    const prepared = harness.prepareCalls;
    harness.prepareOutcome = () => Promise.resolve();
    await commitRounds();
    expect(harness.prepareCalls).toBe(prepared + 1);
  });

  it("remembers the transaction of a successful verification for its wallet", async () => {
    harness.completeResult = {
      success: true,
      commitment: new Uint8Array(32),
      isFirstVerification: true,
      txSignature: SIGNATURE,
    };
    await renderPopup();
    await clickStart();
    await commitRounds();
    expect(readLastVerification(WALLET.toBase58())).toBe(SIGNATURE);
  });
});

describe("embed popup warm policy reuse", () => {
  const WALLET_2 = { toBase58: () => "11111111111111111111111111111113" };
  const WARM_NOW = 1_800_000_000;
  const ORIGINAL_VERIFIED_AT = WARM_NOW - 300;
  const WARM_TX = "1".repeat(64);
  const ATTESTATION_PDA = POLICY_NETWORK.programIds.sas;

  function makeWarmReuseResult(
    walletPubkey: string,
    includeAttestation: boolean,
  ): Extract<WarmPopupPolicyResult, { status: "reused" }> {
    const request = normalizePolicyRequest({
      id: "warm-test",
      version: 1,
      minTrustScore: 50,
      maxVerificationAgeSeconds: 3_600,
      requiredAssurance: "browser_unattested",
      uniquenessRequirement: "allow_unmeasured",
      requireAttestation: includeAttestation,
      cluster: "devnet",
    });
    const evidence: PolicyEvidence = {
      cluster: "devnet",
      genesisHash: POLICY_NETWORK.genesisHash,
      programIds: { ...POLICY_NETWORK.programIds },
      assuranceTier: "browser_unattested",
      uniquenessStatus: "unmeasured",
      readContextSlot: 42,
      identity: {
        walletPubkey,
        identityPda: POLICY_NETWORK.programIds.anchor,
        mint: POLICY_NETWORK.programIds.verifier,
        creationTimestamp: ORIGINAL_VERIFIED_AT - 86_400,
        lastVerificationTimestamp: ORIGINAL_VERIFIED_AT,
        verificationCount: 5,
        trustScore: 185,
        currentCommitment: "02".repeat(32),
        projectionVersion: 1,
        lastResetTimestamp: 0,
        lastRebaselineTimestamp: 0,
      },
      transaction: {
        signature: WARM_TX,
        slot: 42,
        blockTime: ORIGINAL_VERIFIED_AT,
        commitment: "02".repeat(32),
        kind: "update",
      },
      attestation: includeAttestation
        ? {
            status: "present",
            address: ATTESTATION_PDA,
            readContextSlot: 42,
            expiresAt: WARM_NOW + 3_600,
          }
        : { status: "missing" },
    };
    const evaluated = evaluatePolicy(
      request,
      { status: "available", evidence },
      WARM_NOW,
    );
    if (evaluated.decision !== "allow") {
      throw new Error(`Expected allow policy fixture, got ${evaluated.reason}`);
    }
    return {
      status: "reused",
      policy: evaluated,
      attestationPda: includeAttestation ? ATTESTATION_PDA : null,
      txSignature: WARM_TX,
    };
  }

  it("skips authorization and capture on a warm hit and emits the original verifiedAt", async () => {
    harness.authorization = null;
    harness.realPolicyWire = true;
    harness.warmCheck = async () => makeWarmReuseResult(WALLET.toBase58(), false);

    const policy = normalizePolicyRequest({
      id: "warm-test",
      version: 1,
      minTrustScore: 50,
      maxVerificationAgeSeconds: 3_600,
      requiredAssurance: "browser_unattested",
      uniquenessRequirement: "allow_unmeasured",
      requireAttestation: false,
      cluster: "devnet",
    });

    await act(async () => root.render(<PopupContent params={{ ...PARAMS, policy }} />));
    await flush();

    expect(harness.authorizeCalls).toBe(0);
    expect(harness.starts).toBe(0);
    expect(harness.completes).toBe(0);
    expect(harness.pairedOptions).toHaveLength(0);
    expect(harness.emitted).toHaveLength(1);
    expect(harness.emitted[0]).toMatchObject({
      type: "verified",
      value: {
        wallet_pubkey: WALLET.toBase58(),
        attestation_pda: null,
        tx_sig: WARM_TX,
        trust_score: 185,
        cluster: "devnet",
        policy: {
          decision: "allow",
          reason: "accepted",
          verification_timestamp: ORIGINAL_VERIFIED_AT,
          evidence_timestamp: ORIGINAL_VERIFIED_AT,
          evaluated_at: WARM_NOW,
          evaluated_age_seconds: 300,
        },
      },
    });
    expect(container.textContent).toContain("Verified.");
    expect(container.textContent).toContain(
      "Existing verification meets this policy. No transaction needed.",
    );
  });

  it("falls back to capture when warm reuse declines", async () => {
    harness.warmCheck = async () => ({ status: "needs_capture" });
    await renderPopup();

    expect(harness.emitted).toEqual([]);
    expect(container.textContent).toContain("Start Verification");
    await clickStart();
    expect(harness.starts).toBe(1);
    expect(harness.emitted).toEqual([{ type: "heartbeat", value: "capturing" }]);
  });

  it("cancels an in-flight warm check when the user starts capture immediately", async () => {
    let resolveWarm!: (value: WarmPopupPolicyResult) => void;
    let capturedSignal: AbortSignal | undefined;
    harness.warmCheck = (
      _params,
      _wallet,
      _connection,
      _onDiagnostic,
      options,
    ) => {
      capturedSignal = (options as CheckWarmPopupPolicyOptions | undefined)?.signal;
      return new Promise<WarmPopupPolicyResult>((resolve) => {
        resolveWarm = resolve;
      });
    };

    await renderPopup();
    expect(container.textContent).toContain("Checking existing verification...");

    const button = [...container.querySelectorAll("button")].find(
      (node) => node.textContent === "Start Verification",
    )!;
    let startedInTap = -1;
    act(() => {
      button.click();
      startedInTap = harness.starts;
    });
    expect(startedInTap).toBe(1);
    expect(capturedSignal?.aborted).toBe(true);

    // A late warm resolution must neither emit verified nor leave capturing.
    resolveWarm(makeWarmReuseResult(WALLET.toBase58(), true));
    await flush();
    expect(harness.emitted).toEqual([{ type: "heartbeat", value: "capturing" }]);
    expect(container.querySelector('[data-testid="paired-trace-surface"]')).not.toBeNull();
  });

  it("cancels a pending warm check on wallet switch and checks the new wallet", async () => {
    const calls: {
      wallet: string;
      signal: AbortSignal | undefined;
      resolve: (value: WarmPopupPolicyResult) => void;
    }[] = [];
    harness.warmCheck = (_params, wallet, _connection, _onDiagnostic, options) =>
      new Promise<WarmPopupPolicyResult>((resolve) => {
        calls.push({
          wallet: wallet as string,
          signal: (options as CheckWarmPopupPolicyOptions | undefined)?.signal,
          resolve,
        });
      });

    await renderPopup();
    expect(calls).toHaveLength(1);
    expect(calls[0].wallet).toBe(WALLET.toBase58());

    harness.publicKey = WALLET_2;
    await renderPopup();
    expect(calls[0].signal?.aborted).toBe(true);
    expect(calls).toHaveLength(2);
    expect(calls[1].wallet).toBe(WALLET_2.toBase58());

    // Late resolution for the first wallet must be ignored.
    calls[0].resolve(makeWarmReuseResult(WALLET.toBase58(), true));
    await flush();
    expect(harness.emitted).toEqual([]);

    // Resolution for the active second wallet succeeds once.
    harness.realPolicyWire = true;
    calls[1].resolve(makeWarmReuseResult(WALLET_2.toBase58(), true));
    await flush();
    expect(harness.emitted).toHaveLength(1);
    expect(harness.emitted[0]).toMatchObject({
      type: "verified",
      value: {
        wallet_pubkey: WALLET_2.toBase58(),
        attestation_pda: ATTESTATION_PDA,
        tx_sig: WARM_TX,
      },
    });
  });

  it("cancels a pending warm check safely on disconnect", async () => {
    let resolveWarm!: (value: WarmPopupPolicyResult) => void;
    let capturedSignal: AbortSignal | undefined;
    harness.warmCheck = (_params, _wallet, _connection, _onDiagnostic, options) => {
      capturedSignal = (options as CheckWarmPopupPolicyOptions | undefined)?.signal;
      return new Promise<WarmPopupPolicyResult>((resolve) => {
        resolveWarm = resolve;
      });
    };

    await renderPopup();
    harness.publicKey = null;
    await renderPopup();

    expect(capturedSignal?.aborted).toBe(true);
    expect(container.textContent).toContain("Connect your Solana wallet to start.");

    resolveWarm(makeWarmReuseResult(WALLET.toBase58(), true));
    await flush();
    expect(harness.emitted).toEqual([]);
  });

  it("cancels a pending warm check safely on unmount", async () => {
    let resolveWarm!: (value: WarmPopupPolicyResult) => void;
    let capturedSignal: AbortSignal | undefined;
    harness.warmCheck = (_params, _wallet, _connection, _onDiagnostic, options) => {
      capturedSignal = (options as CheckWarmPopupPolicyOptions | undefined)?.signal;
      return new Promise<WarmPopupPolicyResult>((resolve) => {
        resolveWarm = resolve;
      });
    };

    await renderPopup();
    await act(async () => root.unmount());
    expect(capturedSignal?.aborted).toBe(true);

    resolveWarm(makeWarmReuseResult(WALLET.toBase58(), true));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(harness.emitted).toEqual([]);
  });
});
