// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Keypair } from "@solana/web3.js";
import type { AgentWalletBindingRequest } from "@entros/pulse-sdk";
import {
  createAgentPermitRequest,
  renderAgentPermitMessage,
  type AgentPermitRequest,
} from "@entros/verify/agent-permit";
import { normalizePolicyRequest } from "@entros/verify/policy";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BindingReview, PermitReview } from "../src/lib/agent-permit-authorize";

const harness = vi.hoisted(() => ({
  signMessage: vi.fn<(message: Uint8Array) => Promise<Uint8Array>>(),
  sendTransaction: vi.fn(),
  wallet: "OwnerWallet111111111111111111111111111111111",
  permitReviews: [] as {
    request: unknown;
    candidateSignatures: readonly string[] | undefined;
    resolve: (value: PermitReview) => void;
  }[],
  bindingReviews: [] as { binding: unknown; resolve: (value: BindingReview) => void }[],
  buildApproval: vi.fn((input: { request: { action: { label: string } } }) => input.request.action.label),
  buildInstructions: vi.fn<(binding: unknown) => Promise<never>>(async () => {
    throw new Error("stop after recording the binding");
  }),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    connected: true,
    publicKey: { toBase58: () => harness.wallet },
    signMessage: harness.signMessage,
    sendTransaction: harness.sendTransaction,
  }),
  useConnection: () => ({ connection: { rpcEndpoint: "https://rpc.example" } }),
}));

vi.mock("@entros/pulse-sdk", () => ({
  buildSetAgentWalletInstructions: harness.buildInstructions,
  isUserRejection: () => false,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/ui/wallet-connect-button", () => ({ WalletConnectButton: () => null }));
vi.mock("@/components/ui/authorize-check-list", () => ({ AuthorizeCheckList: () => null }));
vi.mock("@/components/sections/agent-permit-summary", () => ({ AgentPermitSummary: () => null }));
vi.mock("@/components/ui/copy-block", () => ({
  CopyBlock: ({ text }: { text: string }) => <output data-testid="approval">{text}</output>,
}));

vi.mock("@/lib/agent-permit-authorize", () => ({
  reviewPermitRequest: ({
    request,
    candidateSignatures,
  }: {
    request: unknown;
    candidateSignatures?: readonly string[];
  }) =>
    new Promise<PermitReview>((resolve) =>
      harness.permitReviews.push({ request, candidateSignatures, resolve }),
    ),
  reviewBindingRequest: ({ binding }: { binding: unknown }) =>
    new Promise<BindingReview>((resolve) => harness.bindingReviews.push({ binding, resolve })),
  buildApproval: harness.buildApproval,
}));

import { AgentPermitReview } from "../src/components/sections/agent-permit-review";
import { storeLastVerification } from "../src/lib/last-verification";
import { AgentBindingReview } from "../src/components/sections/agent-binding-review";

const passingPermit: PermitReview = {
  checks: [],
  canSign: true,
  needsVerification: false,
  verifiedTransaction: "verified-transaction",
  policy: null,
  agentState: null,
};

const passingBinding: BindingReview = { checks: [], canSend: true, alreadyBound: false };

const key = () => Keypair.generate().publicKey.toBase58();

function permitRequest(label: string): AgentPermitRequest {
  return createAgentPermitRequest({
    agent: key(),
    agentWallet: key(),
    operator: key(),
    audience: "https://consumer.example/agent-actions",
    action: { label, sha256: "ab".repeat(32) },
    policy: normalizePolicyRequest({
      id: "agent-demo",
      version: 1,
      minTrustScore: 100,
      maxVerificationAgeSeconds: 3600,
      requiredAssurance: "browser_unattested",
      uniquenessRequirement: "allow_unmeasured",
      cluster: "devnet",
    }),
    issuedAt: Math.floor(Date.now() / 1000) - 30,
    lifetimeSeconds: 600,
  });
}

function binding(agent: string): AgentWalletBindingRequest {
  return {
    version: 1,
    agent,
    agentWallet: key(),
    owner: key(),
    deadline: Math.floor(Date.now() / 1000) + 120,
    signature: "00".repeat(64),
  };
}

let container: HTMLDivElement;
let root: Root;

function button(label: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll("button")).find((element) =>
    element.textContent?.includes(label),
  );
  if (!found) throw new Error(`No button labelled ${label}`);
  return found;
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.click();
    await Promise.resolve();
  });
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  harness.wallet = "OwnerWallet111111111111111111111111111111111";
  window.localStorage.clear();
  harness.permitReviews.length = 0;
  harness.bindingReviews.length = 0;
  harness.signMessage.mockReset();
  harness.signMessage.mockResolvedValue(new Uint8Array(64));
  harness.buildApproval.mockClear();
  harness.buildInstructions.mockClear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("permit review", () => {
  it("offers the review the transaction this browser remembers for the wallet", async () => {
    const wallet = key();
    const signature = "5".repeat(87);
    harness.wallet = wallet;
    storeLastVerification(key(), "6".repeat(88));
    const first = permitRequest("Grant vault access");

    await act(async () => root.render(<AgentPermitReview request={first} message={renderAgentPermitMessage(first)} />));
    expect(harness.permitReviews.at(-1)?.candidateSignatures).toBeUndefined();

    storeLastVerification(wallet, signature);
    const second = permitRequest("Grant vault access again");
    await act(async () => root.render(<AgentPermitReview request={second} message={renderAgentPermitMessage(second)} />));
    expect(harness.permitReviews.at(-1)?.candidateSignatures).toEqual([signature]);
  });

  it("keeps signing disabled until the request on screen has passed its own review", async () => {
    const first = permitRequest("Grant vault access");
    // Same nonce, different action: the request a page could swap in after the first review.
    const swapped: AgentPermitRequest = { ...first, action: { label: "Drain the vault", sha256: "cd".repeat(32) } };

    await act(async () => root.render(<AgentPermitReview request={first} message={renderAgentPermitMessage(first)} />));
    await act(async () => harness.permitReviews[0]?.resolve(passingPermit));
    expect(button("Sign permit").disabled).toBe(false);

    await act(async () =>
      root.render(<AgentPermitReview request={swapped} message={renderAgentPermitMessage(swapped)} />),
    );
    expect(button("Sign permit").disabled).toBe(true);
    await click(button("Sign permit"));
    expect(harness.signMessage).not.toHaveBeenCalled();

    const pending = harness.permitReviews.at(-1);
    expect(pending?.request).toBe(swapped);
    await act(async () => pending?.resolve(passingPermit));
    await click(button("Sign permit"));

    expect(harness.signMessage).toHaveBeenCalledTimes(1);
    const signed = new TextDecoder().decode(harness.signMessage.mock.calls[0]?.[0]);
    expect(signed).toBe(renderAgentPermitMessage(swapped));
    expect(container.querySelector('[data-testid="approval"]')?.textContent).toBe("Drain the vault");
  });

  it("ignores a review that resolves for a request no longer on screen", async () => {
    const first = permitRequest("Grant vault access");
    const swapped: AgentPermitRequest = { ...first, action: { label: "Drain the vault", sha256: "cd".repeat(32) } };

    await act(async () => root.render(<AgentPermitReview request={first} message={renderAgentPermitMessage(first)} />));
    await act(async () =>
      root.render(<AgentPermitReview request={swapped} message={renderAgentPermitMessage(swapped)} />),
    );
    await act(async () => harness.permitReviews[0]?.resolve(passingPermit));

    expect(button("Sign permit").disabled).toBe(true);
  });
});

describe("binding review", () => {
  it("keeps sending disabled until the binding on screen has passed its own review", async () => {
    const first = binding(key());
    const swapped = binding(key());

    await act(async () => root.render(<AgentBindingReview binding={first} />));
    await act(async () => harness.bindingReviews[0]?.resolve(passingBinding));
    expect(button("Bind agent wallet").disabled).toBe(false);

    await act(async () => root.render(<AgentBindingReview binding={swapped} />));
    expect(button("Bind agent wallet").disabled).toBe(true);
    await click(button("Bind agent wallet"));
    expect(harness.buildInstructions).not.toHaveBeenCalled();

    const pending = harness.bindingReviews.at(-1);
    expect(pending?.binding).toBe(swapped);
    await act(async () => pending?.resolve(passingBinding));
    await click(button("Bind agent wallet"));

    expect(harness.buildInstructions).toHaveBeenCalledTimes(1);
    expect(harness.buildInstructions.mock.calls[0]?.[0]).toBe(swapped);
  });
});
