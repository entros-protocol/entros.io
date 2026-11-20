// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import path from "node:path";
import { act, useReducer } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PublicKey } from "@solana/web3.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STATIC_OG_ROUTES } from "@/lib/og-routes";

const WALLET = new PublicKey("11111111111111111111111111111112");

const harness = vi.hoisted(() => ({
  publicKey: null as unknown,
  authorization: null as unknown,
  pairedOnPhase: null as ((phase: string) => void) | null,
  completeResult: null as unknown,
}));

vi.mock("@solana/web3.js", () => {
  class MockPublicKey {
    constructor(private readonly value: string) {}
    toBase58() {
      return this.value;
    }
    toBuffer() {
      return new Uint8Array(32);
    }
    static findProgramAddressSync() {
      return [new MockPublicKey("identity-pda"), 255];
    }
  }
  return {
    PublicKey: MockPublicKey,
    Connection: class {},
    clusterApiUrl: () => "https://example.invalid",
  };
});

const connection = vi.hoisted(() => ({ getAccountInfo: async () => null }));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    connected: harness.publicKey !== null,
    publicKey: harness.publicKey,
    wallet: { adapter: {} },
    signMessage: async () => new Uint8Array(64),
  }),
  useConnection: () => ({ connection }),
}));

vi.mock("@/components/providers/wallet-provider", () => ({
  useWalletError: () => ({ lastError: null, clearError: () => undefined }),
}));

vi.mock("@/components/ui/wallet-connect-button", () => ({
  WalletConnectButton: () => <button type="button">Select Wallet</button>,
}));

vi.mock("@/components/ui/connected-wallet-pill", () => ({
  ConnectedWalletPill: () => null,
}));

vi.mock("@/hooks/use-motion-capability", () => ({
  useMotionCapability: () => false,
}));

vi.mock("@/components/providers/pulse-provider", () => {
  const pulse = {
    pairedAuthorization: () => harness.authorization,
    preparePairedAuthorization: async () => undefined,
    authorizePairedSession: async () => {
      harness.authorization = { expiresAtMs: performance.now() + 900_000 };
      return harness.authorization;
    },
    createPairedSession: (options: { onPhase?: (phase: string) => void }) => {
      let phase = "idle";
      harness.pairedOnPhase = (next: string) => {
        phase = next;
        options.onPhase?.(next);
      };
      return {
        get currentPhase() {
          return phase;
        },
        start: async () => {
          phase = "round";
        },
        continueRound: () => false,
        complete: async () => harness.completeResult,
        completeReset: async () => harness.completeResult,
        abort: () => {
          phase = "failed";
        },
      };
    },
  };
  return { usePulse: () => pulse };
});

import { VerifyWalletConnected } from "@/components/sections/verify-wallet-connected";
import {
  initialState,
  verifyReducer,
} from "@/components/verify/verify-state-machine";

function Harness() {
  const [state, dispatch] = useReducer(verifyReducer, initialState);
  return <VerifyWalletConnected state={state} dispatch={dispatch} />;
}

describe("verify signing guidance and SAS isolation", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: () => ({
        matches: true,
        media: "",
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });
    harness.publicKey = null;
    harness.authorization = null;
    harness.pairedOnPhase = null;
    harness.completeResult = null;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders architectural, non-disparaging Backpack IDL guidance on the connect view", async () => {
    await act(async () => {
      root.render(<Harness />);
    });

    const text = container.textContent ?? "";
    expect(text).toContain(
      "Backpack fetches on-chain Anchor IDLs to display decoded Entros instruction fields on devnet.",
    );
    expect(text).toContain("Any Solana wallet works here.");

    const lower = text.toLowerCase();
    for (const forbidden of [
      "phantom",
      "reverted",
      "broken",
      "deficient",
      "one signature",
      "single signature",
      "—",
    ]) {
      expect(lower).not.toContain(forbidden);
    }
  });

  it("aligns restored /verify page metadata, hero copy, and OG route catalog", () => {
    const verifyPage = readFileSync(
      path.resolve(__dirname, "../src/app/(app)/verify/page.tsx"),
      "utf8",
    );
    const ogDescription = STATIC_OG_ROUTES["/verify"]?.description ?? "";
    const expectedDescription =
      "Verify your wallet on Solana devnet: three short rounds of voice, touch and motion, then one signature.";

    expect(verifyPage).toContain(expectedDescription);
    expect(ogDescription).toBe(expectedDescription);
    expect(verifyPage).toContain(
      "Three short rounds, then one signature on Solana devnet.",
    );
    for (const source of [verifyPage, ogDescription]) {
      expect(source).not.toContain("—");
    }
  });

  it("keeps confirmed on-chain verification successful when best-effort SAS attestation is absent", async () => {
    harness.publicKey = WALLET;
    harness.authorization = { expiresAtMs: performance.now() + 900_000 };
    harness.completeResult = {
      success: true,
      commitment: new Uint8Array(32).fill(7),
      txSignature: "5xAnchorConfirmedWithoutSas1111111111111111111111",
      attestationTx: undefined,
      isFirstVerification: false,
      portableBaseline: true,
    };

    await act(async () => {
      root.render(<Harness />);
    });
    await act(async () => {
      await vi.dynamicImportSettled();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const startButton = Array.from(container.querySelectorAll("button")).find(
      (btn) => btn.textContent?.includes("Start Verification"),
    );
    expect(startButton).toBeDefined();
    expect(startButton!.disabled).toBe(false);

    await act(async () => {
      startButton!.click();
      await Promise.resolve();
    });
    await act(async () => {
      await vi.dynamicImportSettled();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      harness.pairedOnPhase?.("ready");
      await Promise.resolve();
    });
    await act(async () => {
      await vi.dynamicImportSettled();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const text = container.textContent ?? "";
    expect(text).toContain("Verified");
    expect(text).toContain("Transaction confirmed on Solana devnet");
    expect(text).not.toContain("Verification stopped");
  });
});
