import { describe, expect, it, vi } from "vitest";
import {
  ComputeBudgetProgram,
  Ed25519Program,
  PublicKey,
  Transaction,
  TransactionInstruction,
  type SendOptions,
  type TransactionSignature,
  type VersionedTransaction,
} from "@solana/web3.js";
import { PROGRAM_IDS } from "@entros/pulse-sdk";
import {
  createSigningDiagnosticWallet,
  signingDiagnosticEnabled,
  stringifySigningDiagnosticReport,
  type DiagnosticRpcEndpoint,
  type SigningDiagnosticReport,
} from "../src/lib/signing-flow-diagnostic";

const MINT_ANCHOR_DISCRIMINATOR = Uint8Array.from([
  68, 56, 113, 102, 236, 152, 146, 60,
]);
const UPDATE_ANCHOR_DISCRIMINATOR = Uint8Array.from([
  120, 192, 72, 245, 112, 246, 119, 135,
]);

const walletKey = new PublicKey(new Uint8Array(32).fill(7));
const recentBlockhash = new PublicKey(new Uint8Array(32).fill(8)).toBase58();

function anchorInstruction(discriminator: Uint8Array): TransactionInstruction {
  return new TransactionInstruction({
    programId: new PublicKey(PROGRAM_IDS.entrosAnchor),
    keys: [{ pubkey: walletKey, isSigner: true, isWritable: true }],
    data: Buffer.from(discriminator),
  });
}

function reverifyTransaction(): Transaction {
  return new Transaction({ feePayer: walletKey, recentBlockhash })
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 300_000 }))
    .add(
      new TransactionInstruction({
        programId: new PublicKey(PROGRAM_IDS.entrosVerifier),
        keys: [],
        data: Buffer.from([1, 2, 3]),
      }),
    )
    .add(anchorInstruction(UPDATE_ANCHOR_DISCRIMINATOR));
}

function mintTransaction(): Transaction {
  return new Transaction({ feePayer: walletKey, recentBlockhash })
    .add(ComputeBudgetProgram.setComputeUnitLimit({ units: 250_000 }))
    .add(
      Ed25519Program.createInstructionWithPublicKey({
        publicKey: new Uint8Array(32).fill(3),
        message: new Uint8Array(103).fill(4),
        signature: new Uint8Array(64).fill(5),
      }),
    )
    .add(anchorInstruction(MINT_ANCHOR_DISCRIMINATOR));
}

type SimulationCall = {
  instructionCount: number;
  sigVerify: boolean | undefined;
  replaceRecentBlockhash: boolean | undefined;
};

type ConcurrencyState = {
  active: number;
  maximum: number;
};

function endpoint(
  rpcEndpoint: string,
  calls: SimulationCall[],
  options: {
    genesisHash?: string;
    logs?: string[];
    err?: unknown;
    reject?: Error;
  } = {},
): DiagnosticRpcEndpoint {
  return {
    rpcEndpoint,
    async getGenesisHash() {
      return options.genesisHash ?? "devnet-genesis";
    },
    async simulateTransaction(transaction, config) {
      if (options.reject) throw options.reject;
      calls.push({
        instructionCount: transaction.message.compiledInstructions.length,
        sigVerify: config.sigVerify,
        replaceRecentBlockhash: config.replaceRecentBlockhash,
      });
      return {
        context: { slot: 123 },
        value: {
          err: options.err ?? null,
          logs: options.logs ?? ["Program log: complete"],
          unitsConsumed: 204_123,
        },
      };
    },
  };
}

function guardedEndpoint(
  rpcEndpoint: string,
  state: ConcurrencyState,
): DiagnosticRpcEndpoint {
  return {
    rpcEndpoint,
    async getGenesisHash() {
      return "devnet-genesis";
    },
    async simulateTransaction() {
      state.active += 1;
      state.maximum = Math.max(state.maximum, state.active);
      await new Promise<void>((resolve) => setTimeout(resolve, 1));
      state.active -= 1;
      return {
        context: { slot: 123 },
        value: { err: null, logs: [], unitsConsumed: 1 },
      };
    },
  };
}

function walletSender(
  order: string[],
  forwarded: Array<{
    transaction: Transaction | VersionedTransaction;
    connection: unknown;
    options: SendOptions | undefined;
  }> = [],
) {
  return {
    async sendTransaction(
      _transaction: Transaction | VersionedTransaction,
      _connection: unknown,
      _options?: SendOptions,
    ): Promise<TransactionSignature> {
      forwarded.push({
        transaction: _transaction,
        connection: _connection,
        options: _options,
      });
      order.push("wallet");
      return "signature";
    },
  };
}

describe("signing diagnostic activation", () => {
  it("requires development, localhost, the flag, and the query parameter", () => {
    const enabled = {
      nodeEnv: "development",
      publicFlag: "1",
      diagnosticRpc: "https://dedicated.example/rpc",
      hostname: "127.0.0.1",
      search: "?signing-diagnostic=1",
    } as const;

    expect(signingDiagnosticEnabled(enabled)).toBe(true);
    expect(signingDiagnosticEnabled({ ...enabled, nodeEnv: "production" })).toBe(false);
    expect(signingDiagnosticEnabled({ ...enabled, publicFlag: undefined })).toBe(false);
    expect(signingDiagnosticEnabled({ ...enabled, diagnosticRpc: undefined })).toBe(false);
    expect(signingDiagnosticEnabled({ ...enabled, diagnosticRpc: "http://rpc.example" })).toBe(false);
    expect(signingDiagnosticEnabled({ ...enabled, hostname: "entros.io" })).toBe(false);
    expect(signingDiagnosticEnabled({ ...enabled, search: "" })).toBe(false);
  });
});

describe("signing transaction diagnostic", () => {
  it("simulates both re-verification variants on both endpoints before forwarding the original transaction", async () => {
    const order: string[] = [];
    const publicCalls: SimulationCall[] = [];
    const configuredCalls: SimulationCall[] = [];
    const reports: SigningDiagnosticReport[] = [];
    const forwarded: Array<{
      transaction: Transaction | VersionedTransaction;
      connection: unknown;
      options: SendOptions | undefined;
    }> = [];
    const original = reverifyTransaction();
    const originalInstructions = [...original.instructions];
    const sender = walletSender(order, forwarded);
    const wrapped = createSigningDiagnosticWallet(sender, {
      publicEndpoint: endpoint("https://api.devnet.solana.com", publicCalls),
      configuredEndpoint: endpoint("https://dedicated.example/rpc", configuredCalls),
      onReport: (report) => {
        order.push("report");
        reports.push(report);
      },
    });

    const signature = await wrapped.sendTransaction(
      original,
      {} as never,
      { skipPreflight: true },
    );

    expect(signature).toBe("signature");
    expect(order).toEqual(["report", "wallet"]);
    expect(forwarded).toEqual([
      {
        transaction: original,
        connection: {},
        options: { skipPreflight: true },
      },
    ]);
    expect(original.instructions).toEqual(originalInstructions);
    expect(publicCalls.map((call) => call.instructionCount)).toEqual([3, 2]);
    expect(configuredCalls.map((call) => call.instructionCount)).toEqual([3, 2]);
    expect([...publicCalls, ...configuredCalls]).toSatisfy((calls: SimulationCall[]) =>
      calls.every((call) => call.sigVerify === false && call.replaceRecentBlockhash === true),
    );
    expect(reports[0]?.transactionKind).toBe("reverification");
    expect(reports[0]?.simulations).toHaveLength(4);
    expect(reports[0]?.simulations.map((result) => result.variant)).toEqual([
      "exact",
      "without-compute-budget",
      "exact",
      "without-compute-budget",
    ]);
  });

  it("simulates the receipt-bound mint on both endpoints", async () => {
    const publicCalls: SimulationCall[] = [];
    const configuredCalls: SimulationCall[] = [];
    const reports: SigningDiagnosticReport[] = [];
    const sender = walletSender([]);
    const wrapped = createSigningDiagnosticWallet(sender, {
      publicEndpoint: endpoint("https://api.devnet.solana.com", publicCalls),
      configuredEndpoint: endpoint("https://dedicated.example/rpc", configuredCalls),
      onReport: (report) => reports.push(report),
    });

    await wrapped.sendTransaction(mintTransaction(), {} as never);

    expect(publicCalls.map((call) => call.instructionCount)).toEqual([3]);
    expect(configuredCalls.map((call) => call.instructionCount)).toEqual([3]);
    expect(reports[0]?.transactionKind).toBe("mint");
    expect(reports[0]?.simulations).toHaveLength(2);
  });

  it("serializes variants on each RPC endpoint", async () => {
    const publicState = { active: 0, maximum: 0 };
    const configuredState = { active: 0, maximum: 0 };
    const wrapped = createSigningDiagnosticWallet(walletSender([]), {
      publicEndpoint: guardedEndpoint(
        "https://api.devnet.solana.com",
        publicState,
      ),
      configuredEndpoint: guardedEndpoint(
        "https://dedicated.example/rpc",
        configuredState,
      ),
      onReport: vi.fn(),
    });

    await wrapped.sendTransaction(reverifyTransaction(), {} as never);

    expect(publicState.maximum).toBe(1);
    expect(configuredState.maximum).toBe(1);
  });

  it("retries a rate-limited diagnostic without forwarding early", async () => {
    vi.useFakeTimers();
    try {
      const order: string[] = [];
      let attempts = 0;
      const rateLimitedEndpoint: DiagnosticRpcEndpoint = {
        rpcEndpoint: "https://dedicated.example/rpc",
        async getGenesisHash() {
          return "devnet-genesis";
        },
        async simulateTransaction() {
          attempts += 1;
          if (attempts <= 2) throw new Error("429 Too Many Requests");
          return {
            context: { slot: 123 },
            value: { err: null, logs: [], unitsConsumed: 1 },
          };
        },
      };
      const wrapped = createSigningDiagnosticWallet(walletSender(order), {
        publicEndpoint: endpoint("https://api.devnet.solana.com", []),
        configuredEndpoint: rateLimitedEndpoint,
        onReport: () => order.push("report"),
      });

      const result = wrapped.sendTransaction(mintTransaction(), {} as never);
      const assertion = expect(result).resolves.toBe("signature");
      await vi.advanceTimersByTimeAsync(1_500);
      await assertion;

      expect(attempts).toBe(3);
      expect(order).toEqual(["report", "wallet"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("stops after the bounded rate-limit retry count", async () => {
    vi.useFakeTimers();
    try {
      const order: string[] = [];
      let attempts = 0;
      const rateLimitedEndpoint: DiagnosticRpcEndpoint = {
        rpcEndpoint: "https://dedicated.example/rpc",
        async getGenesisHash() {
          return "devnet-genesis";
        },
        async simulateTransaction() {
          attempts += 1;
          throw new Error("429 Too Many Requests");
        },
      };
      const wrapped = createSigningDiagnosticWallet(walletSender(order), {
        publicEndpoint: endpoint("https://api.devnet.solana.com", []),
        configuredEndpoint: rateLimitedEndpoint,
        onReport: vi.fn(),
      });

      const result = wrapped.sendTransaction(mintTransaction(), {} as never);
      const assertion = expect(result).rejects.toThrow(
        "Transaction diagnostic stopped before the wallet request",
      );
      await vi.advanceTimersByTimeAsync(1_500);
      await assertion;

      expect(attempts).toBe(3);
      expect(order).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("records structured simulation errors and still forwards the real transaction", async () => {
    const order: string[] = [];
    const reports: SigningDiagnosticReport[] = [];
    const sender = walletSender(order);
    const wrapped = createSigningDiagnosticWallet(sender, {
      publicEndpoint: endpoint("https://api.devnet.solana.com", [], {
        err: { InstructionError: [2, "Custom"] },
      }),
      configuredEndpoint: endpoint("https://dedicated.example/rpc", []),
      onReport: (report) => reports.push(report),
    });

    await wrapped.sendTransaction(reverifyTransaction(), {} as never);

    expect(order).toEqual(["wallet"]);
    expect(reports[0]?.simulations[0]?.err).toEqual({
      InstructionError: [2, "Custom"],
    });
  });

  it("stops before the wallet when an endpoint fails to return a simulation", async () => {
    const order: string[] = [];
    const sender = walletSender(order);
    const wrapped = createSigningDiagnosticWallet(sender, {
      publicEndpoint: endpoint("https://api.devnet.solana.com", [], {
        reject: new Error("transport unavailable"),
      }),
      configuredEndpoint: endpoint("https://dedicated.example/rpc", []),
      onReport: vi.fn(),
    });

    await expect(
      wrapped.sendTransaction(reverifyTransaction(), {} as never),
    ).rejects.toThrow("Transaction diagnostic stopped before the wallet request");
    expect(order).toEqual([]);
  });

  it("stops before the wallet when an RPC simulation exceeds its deadline", async () => {
    const order: string[] = [];
    const hangingEndpoint: DiagnosticRpcEndpoint = {
      rpcEndpoint: "https://api.devnet.solana.com",
      async getGenesisHash() {
        return "devnet-genesis";
      },
      async simulateTransaction() {
        return await new Promise<never>(() => undefined);
      },
    };
    const wrapped = createSigningDiagnosticWallet(walletSender(order), {
      publicEndpoint: hangingEndpoint,
      configuredEndpoint: endpoint("https://dedicated.example/rpc", []),
      onReport: vi.fn(),
      rpcTimeoutMs: 5,
    });

    await expect(
      wrapped.sendTransaction(reverifyTransaction(), {} as never),
    ).rejects.toThrow("Transaction diagnostic stopped before the wallet request");
    expect(order).toEqual([]);
  });

  it("rejects duplicate endpoints and cluster mismatches before simulation", async () => {
    const sender = walletSender([]);
    const duplicate = createSigningDiagnosticWallet(sender, {
      publicEndpoint: endpoint("https://api.devnet.solana.com/", []),
      configuredEndpoint: endpoint("https://api.devnet.solana.com", []),
      onReport: vi.fn(),
    });
    await expect(
      duplicate.sendTransaction(reverifyTransaction(), {} as never),
    ).rejects.toThrow("Configured RPC must differ from public devnet");

    const mismatch = createSigningDiagnosticWallet(sender, {
      publicEndpoint: endpoint("https://api.devnet.solana.com", [], {
        genesisHash: "devnet",
      }),
      configuredEndpoint: endpoint("https://dedicated.example/rpc", [], {
        genesisHash: "another-cluster",
      }),
      onReport: vi.fn(),
    });
    await expect(
      mismatch.sendTransaction(reverifyTransaction(), {} as never),
    ).rejects.toThrow("RPC endpoints are not on the same cluster");
  });

  it("redacts identifiers and bounds logs in the downloadable report", async () => {
    const reports: SigningDiagnosticReport[] = [];
    const secretUrl = "https://user:secret@rpc.example/path?api-key=secret";
    const longLine = `wallet=${walletKey.toBase58()} endpoint=${secretUrl} ${"x".repeat(800)}`;
    const programData =
      "Program data: cEnStzlUZzvNk6Nh/1t5D9lJ7QfJY+uzk/private/payload==";
    const programReturn =
      "Program return: private-program cEnStzlUZzvNk6Nh/private/payload==";
    const wrapped = createSigningDiagnosticWallet(walletSender([]), {
      publicEndpoint: endpoint("https://api.devnet.solana.com", [], {
        logs: [
          programData,
          programReturn,
          ...Array.from({ length: 98 }, () => longLine),
        ],
      }),
      configuredEndpoint: endpoint("https://dedicated.example/rpc", []),
      onReport: (report) => reports.push(report),
    });

    await wrapped.sendTransaction(mintTransaction(), {} as never);
    const json = stringifySigningDiagnosticReport(reports[0]!);

    expect(json).not.toContain(walletKey.toBase58());
    expect(json).not.toContain("api-key");
    expect(json).not.toContain("user:secret");
    expect(json).not.toContain("private/payload");
    expect(reports[0]?.simulations[0]?.logs[0]).toBe(
      "Program data: [redacted-encoded]",
    );
    expect(reports[0]?.simulations[0]?.logs[1]).toBe(
      "Program return: [redacted-encoded]",
    );
    expect(reports[0]?.simulations[0]?.logs).toHaveLength(64);
    expect(reports[0]?.simulations[0]?.logs[0]?.length).toBeLessThanOrEqual(512);
    expect(json.length).toBeLessThan(150_000);
  });
});
