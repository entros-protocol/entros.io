// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  publicKey: null as { toBase58(): string } | null,
  walletError: null as string | null,
  clearWalletError: vi.fn(),
  authorization: { expiresAtMs: Number.MAX_SAFE_INTEGER } as unknown,
  pairedOptions: [] as Array<{
    onPhase?: (phase: string) => void;
    onLevel?: (rms: number, active?: boolean) => void;
    onFailure?: (error: unknown) => void;
  }>,
  setPhase: (() => undefined) as (phase: string) => void,
  startOutcome: (): Promise<void> => Promise.resolve(),
  completeResult: null as unknown,
  emitted: [] as { type: string; value: unknown }[],
  coarsePointer: false,
  narrowViewport: false,
}));

vi.mock("@solana/web3.js", () => ({
  PublicKey: class {
    constructor(private readonly value: string) {}
    toBase58() {
      return this.value;
    }
    toBuffer() {
      return new Uint8Array(32);
    }
    static findProgramAddressSync() {
      return [{ toBase58: () => "identity-pda" }, 255];
    }
  },
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

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  WalletMultiButton: () => <button type="button">Select Wallet</button>,
  WalletModalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/providers/wallet-provider", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/components/providers/wallet-provider")
  >();
  return {
    ...actual,
    useWalletError: () => ({
      lastError: harness.walletError,
      clearError: harness.clearWalletError,
    }),
    useOptionalWalletError: () => ({
      lastError: harness.walletError,
      clearError: harness.clearWalletError,
    }),
  };
});

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

vi.mock("@/lib/embed/warm-popup-policy", () => ({
  checkWarmPopupPolicy: async () => ({ status: "needs_capture" as const }),
}));

vi.mock("@/components/providers/pulse-provider", () => {
  const pulse = {
    pairedAuthorization: () => harness.authorization,
    preparePairedAuthorization: async () => undefined,
    authorizePairedSession: async () => harness.authorization,
    createPairedSession: (options: (typeof harness.pairedOptions)[number]) => {
      harness.pairedOptions.push(options);
      let phase = "idle";
      harness.setPhase = (next: string) => {
        phase = next;
      };
      return {
        get currentPhase() {
          return phase;
        },
        start: () => {
          phase = "round";
          return harness.startOutcome();
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

import robots from "@/app/robots";
import { metadata as embedMetadata } from "@/app/(app)/embed/layout";
import { PopupContent } from "@/components/embed/popup-content";
import { PopupShell } from "@/components/embed/popup-shell";
import { NavDropdown } from "@/components/layout/nav-dropdown";
import { formatWalletConnectionError } from "@/components/providers/wallet-provider";
import { TokenLaunchCard } from "@/components/sections/token-launch-card";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { PrivacyFooter, PRIVACY_LINES } from "@/components/verify/console";
import { FailedView, softHint } from "@/components/verify/step-views";
import { pageMetadata } from "@/lib/page-metadata";

const WALLET = { toBase58: () => "11111111111111111111111111111112" };
const POPUP_PARAMS = {
  integratorKey: "partner",
  parentOrigin: "https://partner.example",
  cluster: "devnet" as const,
  requestId: "req-recovery-1",
};

let container: HTMLDivElement;
let root: Root;

async function flush() {
  await act(async () => {
    await vi.dynamicImportSettled();
    await new Promise((r) => setTimeout(r, 0));
  });
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  harness.publicKey = null;
  harness.walletError = null;
  harness.clearWalletError.mockReset();
  harness.pairedOptions = [];
  harness.startOutcome = () => Promise.resolve();
  harness.completeResult = null;
  harness.emitted = [];
  harness.coarsePointer = false;
  harness.narrowViewport = false;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches:
        query === "(max-width: 768px)"
          ? harness.narrowViewport
          : query === "(pointer: coarse)"
            ? harness.coarsePointer
            : false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("brand mark alignment across popup and token surfaces", () => {
  it("renders EntrosMark without the legacy cyan dot in PopupShell and preserves the footer", async () => {
    await act(async () => {
      root.render(
        <PopupShell>
          <div>Body</div>
        </PopupShell>,
      );
    });

    const svg = container.querySelector("header svg");
    expect(svg?.getAttribute("viewBox")).toBe("0 0 18 18");
    expect(svg?.innerHTML).toContain("#00E7FE");
    expect(container.querySelector("header .bg-cyan")).toBeNull();
    expect(container.textContent).toContain("Entros");
    expect(container.textContent).toContain("powered by entros.io");
  });

  it("renders whole-pixel EntrosMark without the legacy cyan dot in TokenLaunchCard", async () => {
    await act(async () => {
      root.render(<TokenLaunchCard />);
    });

    const svgs = [...container.querySelectorAll("svg")];
    const entrosSvg = svgs.find((s) => s.getAttribute("viewBox") === "0 0 18 18");
    expect(entrosSvg).toBeDefined();
    expect(entrosSvg?.innerHTML).toContain("#00E7FE");
    expect(container.querySelector(".bg-cyan")).toBeNull();
  });

  it("uses the EntrosMark SVG instead of a trailing dot in the anchor OG image route", () => {
    const src = readFileSync(
      resolve(__dirname, "../src/app/api/og/anchor/route.tsx"),
      "utf8",
    );
    expect(src).toContain('viewBox="0 0 18 18"');
    expect(src).toContain("#00E7FE");
    expect(src).not.toContain("width: 8,\n              height: 8");
  });
});

describe("in-flow privacy notice and keyboard focus discipline", () => {
  it("exposes a reachable /privacy link inside PrivacyFooter for /verify and /embed/verify-popup", async () => {
    await act(async () => {
      root.render(<PrivacyFooter lines={PRIVACY_LINES} />);
    });

    const link = container.querySelector<HTMLAnchorElement>('a[href="/privacy"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe("Privacy notice");
    expect(link?.getAttribute("target")).toBe("_blank");
    expect(link?.getAttribute("rel")).toContain("noopener");
  });

  it("keeps closed NavDropdown links out of the keyboard tab order until opened", async () => {
    await act(async () => {
      root.render(
        <NavDropdown
          label="Technology"
          items={[
            { label: "How It Works", href: "/technology" },
            { label: "Security", href: "/security" },
          ]}
        />,
      );
    });

    const button = container.querySelector("button")!;
    const links = [...container.querySelectorAll<HTMLAnchorElement>("a")];
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link.tabIndex).toBe(-1);
    }

    await act(async () => {
      button.click();
    });
    for (const link of links) {
      expect(link.tabIndex).toBe(0);
    }

    await act(async () => {
      button.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    for (const link of links) {
      expect(link.tabIndex).toBe(-1);
    }
  });
});

describe("desktop popup viewport hint and wallet cluster mismatch guidance", () => {
  it("shows Devnet guidance rather than mobile-only warning on a narrow 460px desktop popup", async () => {
    harness.narrowViewport = true;
    harness.coarsePointer = false;

    await act(async () => {
      root.render(<WalletConnectButton />);
    });
    await flush();

    const text = container.textContent ?? "";
    expect(text).toContain("Solana Devnet pilot.");
    expect(text).toContain("Solana faucet");
    expect(text).not.toContain("Mobile wallet connection is limited");
    expect(text).not.toContain("—");
    expect(text).not.toContain("grab");
  });

  it("shows mobile guidance on a narrow touch viewport", async () => {
    harness.narrowViewport = true;
    harness.coarsePointer = true;

    await act(async () => {
      root.render(<WalletConnectButton />);
    });
    await flush();

    expect(container.textContent).toContain(
      "Mobile wallet connection is limited during devnet.",
    );
  });

  it("translates Phantom/wallet cluster mismatch errors into direct Devnet instructions", () => {
    expect(
      formatWalletConnectionError("Requested chain solana:devnet is not supported on mainnet"),
    ).toBe(
      "Your wallet is on a different Solana network. Switch your wallet to Solana Devnet, then connect again.",
    );
  });

  it("renders wallet connection errors on the popup connect screen", async () => {
    harness.walletError = "WalletConnectionError: wrong network (mainnet-beta)";

    await act(async () => {
      root.render(<PopupContent params={POPUP_PARAMS} />);
    });
    await flush();

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain("Switch your wallet to Solana Devnet");
    expect(container.querySelector('a[href="/privacy"]')).not.toBeNull();
  });
});

describe("non-happy-state recovery copy across /verify and /embed/verify-popup", () => {
  it("renders clean recovery copy without em dashes on /verify for mic denied, quiet retry, drift, anchor_retry, and 0 SOL", async () => {
    const cases = [
      {
        props: { error: "Microphone access denied.", failedAt: "capture" as const },
        expectText: "Microphone access needed",
      },
      {
        props: { error: "Microphone audio too quiet.", failedAt: "validation" as const },
        expectText: "Check your device sound settings for the input microphone and volume",
      },
      {
        props: {
          error: "This verification did not match your stored baseline.",
          failedAt: "proving" as const,
          onResetBaseline: vi.fn(),
        },
        expectText: "7-day cooldown",
      },
      {
        props: {
          error: "anchor_retry",
          reason: "anchor_retry",
          failedAt: "validation" as const,
        },
        expectText: "Baseline not set",
      },
      {
        props: {
          error: "Insufficient funds: this wallet needs more SOL.",
          failedAt: "signing" as const,
        },
        expectText: "This wallet needs SOL",
      },
    ];

    for (const item of cases) {
      await act(async () => {
        root.render(<FailedView {...item.props} onReset={vi.fn()} pairedCapture />);
      });
      const text = container.textContent ?? "";
      expect(text).toContain(item.expectText);
      expect(text).not.toContain("—");
    }

    expect(softHint("unknown_future_reason")).not.toContain("shot");
    expect(softHint("unknown_future_reason")).not.toContain("—");
  });

  async function runPopupToFailure() {
    harness.publicKey = WALLET;
    await act(async () => {
      root.render(<PopupContent params={POPUP_PARAMS} />);
    });
    await flush();
    const startBtn = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.includes("Start Verification"),
    )!;
    await act(async () => {
      startBtn.click();
      await Promise.resolve();
    });
    await flush();
  }

  async function finishPopupRounds() {
    await act(async () => {
      harness.setPhase("ready");
      harness.pairedOptions.at(-1)?.onPhase?.("ready");
      await Promise.resolve();
    });
    await flush();
    await flush();
  }

  it("surfaces actionable microphone-denied recovery in the popup while keeping the wire bucket", async () => {
    harness.startOutcome = () =>
      Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
    await runPopupToFailure();

    expect(container.textContent).toContain("Microphone access needed");
    expect(container.textContent).not.toContain("—");
    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "validation_failed" });
  });

  it("surfaces actionable 0 SOL recovery with faucet CTA in the popup while keeping wallet_rejected on the wire", async () => {
    harness.completeResult = {
      success: false,
      commitment: new Uint8Array(32),
      isFirstVerification: true,
      error: "Insufficient funds: this wallet needs more SOL for account rent.",
      failedAt: "signing",
    };
    await runPopupToFailure();
    await finishPopupRounds();

    expect(container.textContent).toContain("This wallet needs SOL");
    expect(container.querySelector('a[href="https://faucet.solana.com"]')).not.toBeNull();
    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "wallet_rejected" });
  });

  it("surfaces honest 7-day reset guidance on non-opaque drift_too_high in the popup", async () => {
    harness.completeResult = {
      success: false,
      commitment: new Uint8Array(32),
      isFirstVerification: false,
      error: "This verification did not match your stored baseline.",
      failedAt: "proving",
      opaque: false,
    };
    await runPopupToFailure();
    await finishPopupRounds();

    expect(container.textContent).toContain("7-day cooldown");
    expect(container.querySelector('a[href="/verify"]')?.textContent).toContain(
      "Reset baseline",
    );
    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "validation_failed" });
  });

  it("surfaces quiet-audio recovery in the popup when zero voiced frames were captured", async () => {
    harness.completeResult = {
      success: false,
      commitment: new Uint8Array(32),
      isFirstVerification: false,
      error: "Verification failed",
      failedAt: "validation",
      opaque: true,
    };
    await runPopupToFailure();
    await finishPopupRounds();

    expect(container.textContent).toContain("We couldn't hear you");
    expect(container.textContent).toContain("device sound settings");
    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "validation_failed" });
  });

  it("surfaces anchor_retry recovery copy in the popup while emitting validation_failed", async () => {
    harness.completeResult = {
      success: false,
      commitment: new Uint8Array(32),
      isFirstVerification: true,
      error: "capture needs a retry",
      reason: "anchor_retry",
      failedAt: "validation",
    };
    await runPopupToFailure();
    await finishPopupRounds();

    expect(container.textContent).toContain("Baseline not set");
    expect(container.textContent).toContain("say each word once");
    expect(harness.emitted.at(-1)).toEqual({ type: "error", value: "validation_failed" });
  });
});

describe("crawler and agent metadata alignment", () => {
  it("allows /api/og in robots.txt while disallowing private /api/ routes", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    expect(rules?.allow).toContain("/");
    expect(rules?.allow).toContain("/api/og");
    expect(rules?.disallow).toContain("/api/");
  });

  it("advertises /llms.txt alternate discovery in pageMetadata and sets popup metadata noindex", () => {
    const meta = pageMetadata({
      title: "Verify",
      description: "Verify your wallet on Solana devnet.",
      path: "/verify",
    });
    expect(meta.alternates?.types).toMatchObject({ "text/plain": "/llms.txt" });
    expect(embedMetadata.title).toBe("Verify with Entros");
    expect(embedMetadata.robots).toMatchObject({ index: false, follow: false });
  });
});
