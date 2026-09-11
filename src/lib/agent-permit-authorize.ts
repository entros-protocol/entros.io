import type { Connection } from "@solana/web3.js";
import {
  findLatestVerificationTransaction,
  parseAgentWalletBindingFragment,
  readAgentState,
  readIntegratorEvidence,
  verifyAgentWalletBindingRequest,
  type AgentStateEvidence,
  type AgentWalletBindingRequest,
  type VerificationTransactionSearchResult,
} from "@entros/pulse-sdk";
import {
  agentPermitId,
  encodeAgentPermitApproval,
  parseAgentPermitFragment,
  type AgentPermitRequest,
} from "@entros/verify/agent-permit";
import { evaluatePolicy, type PolicyResult } from "@entros/verify/policy";

export type AuthorizeFragment =
  | { kind: "none" }
  | { kind: "invalid" }
  | { kind: "request"; request: AgentPermitRequest; message: string }
  | { kind: "bind"; binding: AgentWalletBindingRequest };

export type CheckStatus = "pass" | "fail";

export interface AuthorizeCheck {
  id: "expiry" | "signature" | "wallet" | "network" | "owner" | "agentWallet" | "policy";
  label: string;
  status: CheckStatus;
  detail: string;
}

export interface PermitReview {
  checks: AuthorizeCheck[];
  canSign: boolean;
  /** A new Entros verification would clear the policy check. */
  needsVerification: boolean;
  verifiedTransaction: string | null;
  policy: PolicyResult | null;
  agentState: AgentStateEvidence | null;
}

export interface BindingReview {
  checks: AuthorizeCheck[];
  canSend: boolean;
  alreadyBound: boolean;
}

type ReviewConnection = Pick<
  Connection,
  | "getGenesisHash"
  | "getMultipleAccountsInfoAndContext"
  | "getSignatureStatuses"
  | "getParsedTransaction"
  | "getAccountInfoAndContext"
  | "getSignaturesForAddress"
>;

const MAX_BINDING_WINDOW_SECONDS = 300;

/**
 * Reads a permit or binding request from the page fragment. Any other fragment, such as a
 * section anchor, is `none`.
 */
export function readAuthorizeFragment(hash: string): AuthorizeFragment {
  const body = hash.startsWith("#") ? hash.slice(1) : hash;
  if (body.startsWith("request=")) {
    const permit = parseAgentPermitFragment(body);
    return permit ? { kind: "request", ...permit } : { kind: "invalid" };
  }
  if (body.startsWith("bind=")) {
    const binding = parseAgentWalletBindingFragment(body);
    return binding ? { kind: "bind", binding } : { kind: "invalid" };
  }
  return { kind: "none" };
}

function formatTime(seconds: number): string {
  return new Date(seconds * 1000).toISOString().replace(".000Z", " UTC").replace("T", " ");
}

function short(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

async function agentState(agent: string, connection: ReviewConnection) {
  try {
    return await readAgentState({ agent, connection });
  } catch {
    return { status: "unavailable" as const, reason: "rpc_unavailable" as const };
  }
}

function ownerCheck(
  state: Awaited<ReturnType<typeof agentState>>,
  wallet: string,
): AuthorizeCheck {
  const label = "You own the agent";
  if (state.status !== "available") {
    const detail =
      state.reason === "agent_unregistered"
        ? "This asset is not an agent in the 8004 registry."
        : state.reason === "agent_missing"
          ? "This agent no longer exists."
          : "Could not read the agent. Try again.";
    return { id: "owner", label, status: "fail", detail };
  }
  return state.evidence.owner === wallet
    ? { id: "owner", label, status: "pass", detail: "The Metaplex Core asset names your wallet as its owner." }
    : {
        id: "owner",
        label,
        status: "fail",
        detail: `The agent's current owner is ${short(state.evidence.owner)}.`,
      };
}

// Reasons a new Entros verification can clear. The others come from the application's policy.
const VERIFICATION_REASONS = new Set<string>([
  "score_below_minimum",
  "verification_stale",
  "attestation_required",
  "invalid_evidence",
]);

function policyCheck(
  policy: PolicyResult | null,
  search: VerificationTransactionSearchResult["status"],
): AuthorizeCheck {
  const label = "Your Entros verification meets the policy";
  if (search === "none") {
    return {
      id: "policy",
      label,
      status: "fail",
      detail: "No recent Entros verification was found for this wallet. Verify, then reload this page.",
    };
  }
  if (search !== "found" || !policy || policy.decision === "unavailable") {
    return { id: "policy", label, status: "fail", detail: "Could not read your Entros Anchor. Try again." };
  }
  if (policy.decision === "allow") {
    return {
      id: "policy",
      label,
      status: "pass",
      detail: `Trust Score ${policy.evidence.identity.trustScore}, verified ${formatTime(policy.evidence.identity.lastVerificationTimestamp)}.`,
    };
  }
  const detail =
    policy.reason === "score_below_minimum"
      ? `This policy needs a Trust Score of ${policy.requirements.minTrustScore} or more.`
      : policy.reason === "verification_stale"
        ? "Your last verification is older than this policy allows. Verify again, then reload this page."
        : policy.reason === "attestation_required"
          ? "This policy needs a current Entros attestation for your wallet."
          : policy.reason === "invalid_evidence"
            ? "Your latest verification could not be confirmed. Verify again, then reload this page."
            : "The application's policy asks for evidence Entros does not issue yet. Ask the application to change it.";
  return { id: "policy", label, status: "fail", detail };
}

/** Runs every check the owner needs before signing a permit request. */
export async function reviewPermitRequest(input: {
  request: AgentPermitRequest;
  wallet: string;
  connection: ReviewConnection;
  /** Sampled again after each network wait. */
  nowSeconds: () => number;
}): Promise<PermitReview> {
  const { request, wallet, connection, nowSeconds } = input;
  const checks: AuthorizeCheck[] = [
    nowSeconds() < request.expiresAt
      ? { id: "expiry", label: "The request is current", status: "pass", detail: `Expires ${formatTime(request.expiresAt)}.` }
      : {
          id: "expiry",
          label: "The request is current",
          status: "fail",
          detail: `The request expired ${formatTime(request.expiresAt)}. Ask the agent for a new one.`,
        },
    wallet === request.operator
      ? { id: "wallet", label: "The connected wallet is the named owner", status: "pass", detail: short(wallet) }
      : {
          id: "wallet",
          label: "The connected wallet is the named owner",
          status: "fail",
          detail: `Connect ${short(request.operator)}, the wallet this request names.`,
        },
  ];
  let genesis: string | null = null;
  try {
    genesis = await connection.getGenesisHash();
  } catch {
    genesis = null;
  }
  checks.push(
    genesis === request.genesisHash
      ? { id: "network", label: "The site reads devnet", status: "pass", detail: "The RPC genesis matches the request." }
      : { id: "network", label: "The site reads devnet", status: "fail", detail: "The RPC connection does not match the request's cluster." },
  );
  const state = await agentState(request.agent, connection);
  checks.push(ownerCheck(state, wallet));
  const evidence = state.status === "available" ? state.evidence : null;
  const walletLabel = "The agent wallet matches the registry";
  checks.push(
    !evidence
      ? { id: "agentWallet", label: walletLabel, status: "fail", detail: "The agent could not be read." }
      : evidence.agentWalletStatus === "stale"
        ? {
            id: "agentWallet",
            label: walletLabel,
            status: "fail",
            detail: "The registry still holds an agent wallet set before the last transfer. Bind the agent wallet again.",
          }
        : evidence.agentWallet === null
          ? { id: "agentWallet", label: walletLabel, status: "fail", detail: "The agent has no agent wallet. Bind one first." }
          : evidence.agentWallet !== request.agentWallet
            ? {
                id: "agentWallet",
                label: walletLabel,
                status: "fail",
                detail: "The agent wallet changed after the request was issued. Ask the agent for a new request.",
              }
            : { id: "agentWallet", label: walletLabel, status: "pass", detail: short(evidence.agentWallet) },
  );
  let verifiedTransaction: string | null = null;
  let policy: PolicyResult | null = null;
  let needsVerification = false;
  if (wallet === request.operator) {
    const found = await findLatestVerificationTransaction({ walletPubkey: wallet, connection });
    if (found.status === "found") {
      verifiedTransaction = found.signature;
      const read = await readIntegratorEvidence({
        walletPubkey: wallet,
        transactionSignature: found.signature,
        connection,
        nowSeconds,
      });
      policy = evaluatePolicy(request.policy, read, nowSeconds());
    }
    checks.push(policyCheck(policy, found.status));
    needsVerification =
      found.status === "none" || (policy?.decision === "deny" && VERIFICATION_REASONS.has(policy.reason));
  } else {
    checks.push({ id: "policy", label: "Your Entros verification meets the policy", status: "fail", detail: "Connect the named owner first." });
  }
  const canSign = checks.every((check) => check.status === "pass") && verifiedTransaction !== null;
  return { checks, canSign, needsVerification, verifiedTransaction, policy, agentState: evidence };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** The approval JSON the owner hands back to the agent. */
export function buildApproval(input: {
  request: AgentPermitRequest;
  signature: Uint8Array;
  verifiedTransaction: string;
}): string {
  if (input.signature.length !== 64) throw new Error("The wallet returned an invalid signature");
  return encodeAgentPermitApproval({
    permitId: agentPermitId(input.request),
    operatorSignature: bytesToHex(input.signature),
    verifiedTransaction: input.verifiedTransaction,
  });
}

/** Runs every check the owner needs before sending the binding transaction. */
export async function reviewBindingRequest(input: {
  binding: AgentWalletBindingRequest;
  wallet: string;
  connection: ReviewConnection;
  nowSeconds: () => number;
}): Promise<BindingReview> {
  const { binding, wallet, connection, nowSeconds } = input;
  const remaining = binding.deadline - nowSeconds();
  const checks: AuthorizeCheck[] = [
    verifyAgentWalletBindingRequest(binding)
      ? { id: "signature", label: "The agent wallet signed this request", status: "pass", detail: short(binding.agentWallet) }
      : { id: "signature", label: "The agent wallet signed this request", status: "fail", detail: "The signature does not match the request." },
    remaining > 0 && remaining <= MAX_BINDING_WINDOW_SECONDS
      ? { id: "expiry", label: "The request is current", status: "pass", detail: `Send before ${formatTime(binding.deadline)}.` }
      : {
          id: "expiry",
          label: "The request is current",
          status: "fail",
          detail: remaining <= 0 ? "The request expired. Ask the agent for a new one." : "The deadline lies too far ahead for the registry.",
        },
    wallet === binding.owner
      ? { id: "wallet", label: "The connected wallet is the named owner", status: "pass", detail: short(wallet) }
      : {
          id: "wallet",
          label: "The connected wallet is the named owner",
          status: "fail",
          detail: `Connect ${short(binding.owner)}, the wallet this request names.`,
        },
  ];
  const state = await agentState(binding.agent, connection);
  checks.push(ownerCheck(state, wallet));
  const alreadyBound =
    state.status === "available" &&
    state.evidence.agentWalletStatus === "bound" &&
    state.evidence.agentWallet === binding.agentWallet;
  return { checks, canSend: checks.every((check) => check.status === "pass") && !alreadyBound, alreadyBound };
}
