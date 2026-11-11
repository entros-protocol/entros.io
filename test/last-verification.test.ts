// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  readLastVerification,
  storeLastVerification,
} from "../src/lib/last-verification";

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
const OTHER_WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
// 64 bytes in base58, at both lengths a signature takes.
const SIGNATURE = "5".repeat(87);
const LONG_SIGNATURE = "6".repeat(88);

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("last verification transaction", () => {
  it("returns the signature stored for the wallet and cluster", () => {
    expect(storeLastVerification(WALLET, SIGNATURE, "devnet")).toBe(true);
    expect(readLastVerification(WALLET, "devnet")).toBe(SIGNATURE);
    expect(storeLastVerification(WALLET, LONG_SIGNATURE, "devnet")).toBe(true);
    expect(readLastVerification(WALLET, "devnet")).toBe(LONG_SIGNATURE);
  });

  it("keeps each wallet and each cluster apart", () => {
    storeLastVerification(WALLET, SIGNATURE, "devnet");
    expect(readLastVerification(OTHER_WALLET, "devnet")).toBeNull();
    expect(readLastVerification(WALLET, "mainnet-beta")).toBeNull();
  });

  it("uses the configured cluster by default", () => {
    storeLastVerification(WALLET, SIGNATURE);
    expect(readLastVerification(WALLET)).toBe(SIGNATURE);
    expect(readLastVerification(WALLET, "devnet")).toBe(SIGNATURE);
  });

  it.each([
    ["an empty value", ""],
    ["a value outside base58", `0${"5".repeat(86)}`],
    ["a value too short for a signature", "2".repeat(86)],
    ["a value too long for a signature", "5".repeat(89)],
    ["a value that decodes past 64 bytes", "z".repeat(88)],
    ["an address", OTHER_WALLET],
  ])("refuses to store %s", (_name, value) => {
    expect(storeLastVerification(WALLET, value, "devnet")).toBe(false);
    expect(readLastVerification(WALLET, "devnet")).toBeNull();
  });

  it("refuses a wallet that is not an address", () => {
    expect(storeLastVerification("not-a-wallet", SIGNATURE, "devnet")).toBe(false);
    expect(readLastVerification("not-a-wallet", "devnet")).toBeNull();
    expect(window.localStorage.length).toBe(0);
  });

  it("ignores a stored value that is not a signature", () => {
    storeLastVerification(WALLET, SIGNATURE, "devnet");
    const key = window.localStorage.key(0)!;
    for (const value of ["z".repeat(88), "tx-signature", `${SIGNATURE}\n`]) {
      window.localStorage.setItem(key, value);
      expect(readLastVerification(WALLET, "devnet")).toBeNull();
    }
  });

  it("tolerates a full store", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    expect(storeLastVerification(WALLET, SIGNATURE, "devnet")).toBe(false);
  });

  it("tolerates a store that cannot be reached", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Access denied", "SecurityError");
    });
    expect(storeLastVerification(WALLET, SIGNATURE, "devnet")).toBe(false);
    expect(readLastVerification(WALLET, "devnet")).toBeNull();
  });
});
