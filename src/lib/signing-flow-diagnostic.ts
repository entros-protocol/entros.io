import {
  ComputeBudgetProgram,
  type SimulateTransactionConfig,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { PROGRAM_IDS } from "@entros/pulse-sdk";

const MINT_ANCHOR_DISCRIMINATOR = Uint8Array.from([
  68, 56, 113, 102, 236, 152, 146, 60,
]);
const UPDATE_ANCHOR_DISCRIMINATOR = Uint8Array.from([
  120, 192, 72, 245, 112, 246, 119, 135,
]);
const MAX_LOG_LINES = 64;
const MAX_LOG_LINE_LENGTH = 512;
const MAX_JSON_LENGTH = 150_000;
const MAX_ERROR_DEPTH = 5;
const MAX_ERROR_ITEMS = 32;
const DEFAULT_RPC_TIMEOUT_MS = 30_000;
const MAX_RPC_TIMEOUT_MS = 120_000;
const MAX_RATE_LIMIT_RETRIES = 2;
const RATE_LIMIT_RETRY_BASE_MS = 500;

export type SigningDiagnosticTransactionKind = "mint" | "reverification";
export type SigningDiagnosticEndpointLabel =
  | "public-devnet"
  | "configured-devnet";
export type SigningDiagnosticVariant = "exact" | "without-compute-budget";

type SafeJson =
  | null
  | boolean
  | number
  | string
  | SafeJson[]
  | { [key: string]: SafeJson };

export type SigningDiagnosticSimulation = {
  endpoint: SigningDiagnosticEndpointLabel;
  variant: SigningDiagnosticVariant;
  err: SafeJson;
  logs: string[];
  unitsConsumed: number | null;
  contextSlot: number;
  instructionCount: number;
  instructionShapeDigest: string;
};

export type SigningDiagnosticReport = {
  reportVersion: 1;
  generatedAt: string;
  transactionKind: SigningDiagnosticTransactionKind;
  simulations: SigningDiagnosticSimulation[];
};

export type DiagnosticRpcEndpoint = {
  readonly rpcEndpoint: string;
  getGenesisHash(): Promise<string>;
  simulateTransaction(
    transaction: VersionedTransaction,
    config: SimulateTransactionConfig,
  ): Promise<{
    context: { slot: number };
    value: {
      err: unknown;
      logs: string[] | null;
      unitsConsumed?: number;
    };
  }>;
};

export type SigningDiagnosticActivation = {
  nodeEnv: string | undefined;
  publicFlag: string | undefined;
  diagnosticRpc: string | undefined;
  hostname: string;
  search: string;
};

export type SigningDiagnosticWalletOptions = {
  publicEndpoint: DiagnosticRpcEndpoint;
  configuredEndpoint: DiagnosticRpcEndpoint;
  onReport(report: SigningDiagnosticReport): void;
  onStatus?(message: string): void;
  now?: () => Date;
  rpcTimeoutMs?: number;
  rpcMinimumIntervalMs?: number;
};

export function signingDiagnosticEnabled(
  activation: SigningDiagnosticActivation,
): boolean {
  if (activation.nodeEnv !== "development") return false;
  if (activation.publicFlag !== "1") return false;
  if (!activation.diagnosticRpc) return false;
  try {
    if (new URL(activation.diagnosticRpc).protocol !== "https:") return false;
  } catch {
    return false;
  }
  if (
    activation.hostname !== "localhost" &&
    activation.hostname !== "127.0.0.1"
  ) {
    return false;
  }
  return new URLSearchParams(activation.search).get("signing-diagnostic") === "1";
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function hasAnchorInstruction(
  transaction: Transaction,
  discriminator: Uint8Array,
): boolean {
  return transaction.instructions.some(
    (instruction) =>
      instruction.programId.toBase58() === PROGRAM_IDS.entrosAnchor &&
      instruction.data.length >= discriminator.length &&
      bytesEqual(
        instruction.data.subarray(0, discriminator.length),
        discriminator,
      ),
  );
}

function transactionKind(
  transaction: Transaction,
): SigningDiagnosticTransactionKind {
  const isMint = hasAnchorInstruction(transaction, MINT_ANCHOR_DISCRIMINATOR);
  const isReverification = hasAnchorInstruction(
    transaction,
    UPDATE_ANCHOR_DISCRIMINATOR,
  );
  if (isMint === isReverification) {
    throw new Error(
      "Transaction diagnostic supports mint and re-verification only",
    );
  }
  return isMint ? "mint" : "reverification";
}

function withoutComputeBudget(transaction: Transaction): Transaction {
  const firstInstruction = transaction.instructions[0];
  if (
    !firstInstruction ||
    !firstInstruction.programId.equals(ComputeBudgetProgram.programId)
  ) {
    throw new Error(
      "Transaction diagnostic expected a leading compute budget instruction",
    );
  }
  const clone = new Transaction();
  clone.feePayer = transaction.feePayer;
  clone.recentBlockhash = transaction.recentBlockhash;
  clone.lastValidBlockHeight = transaction.lastValidBlockHeight;
  clone.nonceInfo = transaction.nonceInfo;
  clone.instructions = transaction.instructions.slice(1);
  return clone;
}

function canonicalEndpoint(endpoint: string): string {
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error("Transaction diagnostic requires valid RPC URLs");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Transaction diagnostic requires HTTPS RPC URLs");
  }
  parsed.hash = "";
  return parsed.toString().replace(/\/+$/, "");
}

async function waitForRpcInterval(intervalMs: number): Promise<void> {
  if (intervalMs <= 0) return;
  await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
}

async function withDeadline<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("RPC deadline exceeded")),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function isRateLimitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (Reflect.get(error, "status") === 429) return true;
  const message = Reflect.get(error, "message");
  return (
    typeof message === "string" &&
    /^(?:\s*429(?:\s|:))|too many requests|rate limit/iu.test(message)
  );
}

async function withRateLimitRetry<T>(
  operation: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return withDeadline(
    (async () => {
      let delayMs = RATE_LIMIT_RETRY_BASE_MS;
      for (let attempt = 0; ; attempt += 1) {
        try {
          return await operation();
        } catch (error) {
          if (
            !isRateLimitError(error) ||
            attempt >= MAX_RATE_LIMIT_RETRIES
          ) {
            throw error;
          }
          await waitForRpcInterval(delayMs);
          delayMs *= 2;
        }
      }
    })(),
    timeoutMs,
  );
}

function redactString(value: string): string {
  return value
    .replace(/https?:\/\/[^\s"']+/giu, "[redacted-url]")
    .replace(/\b[1-9A-HJ-NP-Za-km-z]{32,88}\b/gu, "[redacted-base58]")
    .replace(/\b(?:0x)?[a-f\d]{32,}\b/giu, "[redacted-hex]")
    .replace(/\b[A-Za-z\d+/]{40,}={0,2}\b/gu, "[redacted-encoded]");
}

function safeJson(value: unknown, depth = 0): SafeJson {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    return redactString(value).slice(0, MAX_LOG_LINE_LENGTH);
  }
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }
  if (typeof value === "bigint") return "[redacted-bigint]";
  if (depth >= MAX_ERROR_DEPTH) return "[bounded]";
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ERROR_ITEMS)
      .map((item) => safeJson(item, depth + 1));
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).slice(0, MAX_ERROR_ITEMS);
    return Object.fromEntries(
      entries.map(([key, item]) => [
        redactString(key).slice(0, 128),
        safeJson(item, depth + 1),
      ]),
    );
  }
  return redactString(String(value)).slice(0, MAX_LOG_LINE_LENGTH);
}

function safeLogs(logs: string[] | null): string[] {
  return (logs ?? [])
    .slice(0, MAX_LOG_LINES)
    .map((line) => {
      if (/^Program (?:data|return):/u.test(line)) {
        return line.replace(/:.*/u, ": [redacted-encoded]");
      }
      return redactString(line).slice(0, MAX_LOG_LINE_LENGTH);
    });
}

async function instructionShapeDigest(
  transaction: Transaction,
): Promise<string> {
  const shape = transaction.instructions
    .map((instruction, index) => {
      const flags = instruction.keys
        .map((key) => `${key.isSigner ? "s" : "-"}${key.isWritable ? "w" : "-"}`)
        .join("");
      return [
        index,
        instruction.programId.toBase58(),
        instruction.keys.length,
        flags,
        instruction.data.length,
      ].join(":");
    })
    .join("|");
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(shape),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function simulate(
  endpoint: DiagnosticRpcEndpoint,
  endpointLabel: SigningDiagnosticEndpointLabel,
  variant: SigningDiagnosticVariant,
  transaction: Transaction,
): Promise<SigningDiagnosticSimulation> {
  const message = transaction.compileMessage();
  const response = await endpoint.simulateTransaction(
    new VersionedTransaction(message),
    {
      commitment: "confirmed",
      replaceRecentBlockhash: true,
      sigVerify: false,
    },
  );
  return {
    endpoint: endpointLabel,
    variant,
    err: safeJson(response.value.err),
    logs: safeLogs(response.value.logs),
    unitsConsumed: response.value.unitsConsumed ?? null,
    contextSlot: response.context.slot,
    instructionCount: transaction.instructions.length,
    instructionShapeDigest: await instructionShapeDigest(transaction),
  };
}

async function runSigningDiagnostic(
  transaction: Transaction,
  options: SigningDiagnosticWalletOptions,
): Promise<SigningDiagnosticReport> {
  if (
    canonicalEndpoint(options.publicEndpoint.rpcEndpoint) ===
    canonicalEndpoint(options.configuredEndpoint.rpcEndpoint)
  ) {
    throw new Error("Configured RPC must differ from public devnet");
  }
  const timeoutMs = Math.min(
    MAX_RPC_TIMEOUT_MS,
    Math.max(1, options.rpcTimeoutMs ?? DEFAULT_RPC_TIMEOUT_MS),
  );
  const minimumIntervalMs = Math.min(
    5_000,
    Math.max(0, options.rpcMinimumIntervalMs ?? 0),
  );

  let publicGenesis: string;
  let configuredGenesis: string;
  try {
    [publicGenesis, configuredGenesis] = await Promise.all([
      withRateLimitRetry(
        () => options.publicEndpoint.getGenesisHash(),
        timeoutMs,
      ),
      withRateLimitRetry(
        () => options.configuredEndpoint.getGenesisHash(),
        timeoutMs,
      ),
    ]);
  } catch {
    throw new Error(
      "Transaction diagnostic stopped before the wallet request because an RPC cluster check failed",
    );
  }
  if (publicGenesis !== configuredGenesis) {
    throw new Error("RPC endpoints are not on the same cluster");
  }
  await waitForRpcInterval(minimumIntervalMs);

  const kind = transactionKind(transaction);
  const variants: Array<{
    label: SigningDiagnosticVariant;
    transaction: Transaction;
  }> = [{ label: "exact", transaction }];
  if (kind === "reverification") {
    variants.push({
      label: "without-compute-budget",
      transaction: withoutComputeBudget(transaction),
    });
  }

  options.onStatus?.("Running transaction simulations...");
  let simulations: SigningDiagnosticSimulation[];
  try {
    const endpointResults = await Promise.all(
      [
        ["public-devnet", options.publicEndpoint] as const,
        ["configured-devnet", options.configuredEndpoint] as const,
      ].map(async ([endpointLabel, endpoint]) => {
        const results: SigningDiagnosticSimulation[] = [];
        for (const [index, variant] of variants.entries()) {
          if (index > 0) await waitForRpcInterval(minimumIntervalMs);
          results.push(
            await withRateLimitRetry(
              () =>
                simulate(
                endpoint,
                endpointLabel,
                variant.label,
                variant.transaction,
              ),
              timeoutMs,
            ),
          );
        }
        return results;
      }),
    );
    simulations = endpointResults.flat();
  } catch {
    throw new Error(
      "Transaction diagnostic stopped before the wallet request because an RPC simulation failed",
    );
  }

  return {
    reportVersion: 1,
    generatedAt: (options.now ?? (() => new Date()))().toISOString(),
    transactionKind: kind,
    simulations,
  };
}

export function createSigningDiagnosticWallet<T extends object>(
  wallet: T,
  options: SigningDiagnosticWalletOptions,
): T {
  const originalSend = Reflect.get(wallet, "sendTransaction");
  if (typeof originalSend !== "function") {
    throw new Error("Wallet does not support transaction submission");
  }

  return new Proxy(wallet, {
    get(target, property) {
      if (property === "sendTransaction") {
        return async (...args: unknown[]) => {
          const transaction = args[0];
          if (!(transaction instanceof Transaction)) {
            throw new Error(
              "Transaction diagnostic stopped before the wallet request because the transaction format was unsupported",
            );
          }
          const report = await runSigningDiagnostic(transaction, options);
          options.onReport(report);
          return Reflect.apply(originalSend, target, args);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export function stringifySigningDiagnosticReport(
  report: SigningDiagnosticReport,
): string {
  const json = JSON.stringify(report, null, 2);
  if (json.length > MAX_JSON_LENGTH) {
    throw new Error("Transaction diagnostic report exceeded its size limit");
  }
  return json;
}
