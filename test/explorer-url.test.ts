import { utils } from "@coral-xyz/anchor";
import { describe, expect, it } from "vitest";
import { explorerUrl } from "../src/lib/explorer";

const ADDRESS = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const SIGNATURE =
  "5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW";
const FALLBACK = "https://explorer.solana.com/?cluster=devnet";

describe("explorer links", () => {
  it("links a valid address and a valid signature", () => {
    expect(explorerUrl(ADDRESS)).toBe(`https://explorer.solana.com/address/${ADDRESS}?cluster=devnet`);
    expect(explorerUrl(SIGNATURE, "tx")).toBe(`https://explorer.solana.com/tx/${SIGNATURE}?cluster=devnet`);
  });

  it("falls back to the explorer home for anything else", () => {
    for (const input of [
      "",
      "../../evil",
      "x?cluster=mainnet-beta#",
      `${ADDRESS}/../tx`,
      "0OIl".repeat(10),
      "1".repeat(45),
      ADDRESS.slice(0, 31),
    ]) {
      expect(explorerUrl(input), input).toBe(FALLBACK);
    }
  });

  it("matches the length to the kind of link", () => {
    expect(explorerUrl(SIGNATURE)).toBe(FALLBACK);
    expect(explorerUrl(ADDRESS, "tx")).toBe(FALLBACK);
  });

  it("agrees with a reference base58 decoder, leading zero bytes included", () => {
    for (let round = 0; round < 200; round += 1) {
      for (const [type, length] of [["address", 32], ["tx", 64]] as const) {
        const bytes = crypto.getRandomValues(new Uint8Array(length));
        bytes.fill(0, 0, round % 4);
        const encoded = utils.bytes.bs58.encode(bytes);
        expect(explorerUrl(encoded, type)).toContain(`/${type}/${encoded}?`);
        expect(explorerUrl(utils.bytes.bs58.encode(bytes.subarray(1)), type)).toBe(FALLBACK);
      }
    }
  });
});
