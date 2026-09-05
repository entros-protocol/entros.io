import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { INTEGRATOR_PROGRAM_IDS } from "@entros/pulse-sdk";
import { Connection, PublicKey } from "@solana/web3.js";
import { traceEvidenceConnection } from "../src/lib/embed/policy-diagnostics";

const address = new PublicKey("11111111111111111111111111111111");
const secret = "DO_NOT_SERIALIZE_AUDIO_OR_RPC_URL";

function fixture() {
  const connection = new Connection("http://127.0.0.1:8899");
  const genesis = vi.spyOn(connection, "getGenesisHash").mockResolvedValue(address.toBase58());
  const statuses = vi.spyOn(connection, "getSignatureStatuses").mockResolvedValue({ context: { slot: 12 }, value: [{ slot: 11, confirmations: 1, confirmationStatus: "confirmed", err: { InstructionError: [0, secret] } }] });
  const transaction = vi.spyOn(connection, "getParsedTransaction").mockResolvedValue({
    slot: 11, blockTime: 1_800_000_001,
    meta: { err: null, fee: 1, preBalances: [], postBalances: [], logMessages: [secret] },
    transaction: { signatures: ["signature"], message: { recentBlockhash: secret, accountKeys: [], instructions: [{ programId: address, accounts: [], data: secret }] } },
  });
  const account = vi.spyOn(connection, "getAccountInfoAndContext").mockResolvedValue({ context: { slot: 12 }, value: { data: Buffer.from(secret), owner: address, executable: false, lamports: 1, rentEpoch: 0 } });
  return { connection, genesis, statuses, transaction, account };
}

describe("evidence diagnostic collector", () => {
  it("uses each original RPC response without extra reads or private data", async () => {
    const f = fixture();
    const trace = traceEvidenceConnection(f.connection, address.toBase58());
    expect(await trace.connection.getGenesisHash()).toBe(address.toBase58());
    await trace.connection.getSignatureStatuses(["signature"]);
    const tx = await trace.connection.getParsedTransaction("signature");
    expect(tx?.meta?.logMessages).toEqual([secret]);
    const response = await trace.connection.getAccountInfoAndContext(address);
    expect(response.value?.data.toString()).toBe(secret);
    const result = await trace.finish();
    for (const spy of [f.genesis, f.statuses, f.transaction, f.account]) expect(spy).toHaveBeenCalledOnce();
    expect(result).toHaveLength(4);
    expect(JSON.stringify(result)).not.toContain(secret);
    expect(JSON.stringify(result)).not.toContain("8899");
    expect(result[2].snapshot).toMatchObject({ blockTime: 1_800_000_001, hasError: false, signatureMatches: true });
    expect(result[3].snapshot).toMatchObject({ contextSlot: 12, dataLength: secret.length, present: true });
  });

  it("records a thrown RPC without serializing the error or changing rejection", async () => {
    const f = fixture();
    const error = new Error(secret);
    f.genesis.mockRejectedValue(error);
    const trace = traceEvidenceConnection(f.connection, address.toBase58());
    await expect(trace.connection.getGenesisHash()).rejects.toBe(error);
    expect(await trace.finish()).toMatchObject([{ method: "getGenesisHash", outcome: "threw" }]);
    expect(JSON.stringify(await trace.finish())).not.toContain(secret);
  });

  it("bounds records and stops collecting after the reader finishes", async () => {
    const f = fixture();
    const trace = traceEvidenceConnection(f.connection, address.toBase58());
    for (let i = 0; i < 20; i += 1) await trace.connection.getGenesisHash();
    const records = await trace.finish();
    expect(records).toHaveLength(16);
    await trace.connection.getGenesisHash();
    expect(records).toHaveLength(16);
    expect(f.genesis).toHaveBeenCalledTimes(21);
  });
  it("decodes the captured identity timestamps without a later account read", async () => {
    const f = fixture();
    const data = Buffer.alloc(593);
    createHash("sha256").update("account:IdentityState").digest().copy(data, 0, 0, 8);
    address.toBuffer().copy(data, 8);
    data.writeBigInt64LE(BigInt(1_799_999_000), 40);
    data.writeBigInt64LE(BigInt(1_800_000_002), 48);
    data.writeUInt32LE(7, 56);
    data.writeUInt16LE(100, 60);
    data.fill(3, 62, 94);
    address.toBuffer().copy(data, 94);
    f.account.mockResolvedValue({ context: { slot: 12 }, value: { data, owner: new PublicKey(INTEGRATOR_PROGRAM_IDS.anchor), executable: false, lamports: 1 } });
    const trace = traceEvidenceConnection(f.connection, address.toBase58());
    await trace.connection.getAccountInfoAndContext(address);
    const records = await trace.finish();
    expect(records[0].snapshot).toMatchObject({ identity: {
      creationTimestamp: 1_799_999_000, lastVerificationTimestamp: 1_800_000_002,
      verificationCount: 7, trustScore: 100, currentCommitment: "03".repeat(32),
    } });
    expect(f.account).toHaveBeenCalledOnce();
    expect(JSON.stringify(records)).not.toContain('"data":');
  });

  it("extracts only timestamps from a known attestation layout", async () => {
    const f = fixture();
    const data = Buffer.alloc(204, 9);
    data[0] = 2;
    data.writeUInt32LE(31, 97);
    data.writeBigInt64LE(BigInt(1_800_000_002), 104);
    data.writeBigInt64LE(BigInt(1_800_000_300), 164);
    f.account.mockResolvedValue({ context: { slot: 12 }, value: { data, owner: new PublicKey(INTEGRATOR_PROGRAM_IDS.sas), executable: false, lamports: 1 } });
    const trace = traceEvidenceConnection(f.connection, address.toBase58());
    await trace.connection.getAccountInfoAndContext(address);
    const records = await trace.finish();
    expect(records[0].snapshot).toMatchObject({ attestation: { verifiedAt: 1_800_000_002, expiresAt: 1_800_000_300 } });
    expect(JSON.stringify(records)).not.toContain('"data":');
    expect(f.account).toHaveBeenCalledOnce();
  });

});
