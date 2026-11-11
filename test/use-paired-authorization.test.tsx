// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PairedProtocolError } from "@entros/pulse-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The start control of a paired capture reads the wallet's authorization from
 * the SDK. These tests pin when it reads again, when it fetches a grant ahead
 * of the tap, and what one tap does.
 */

const WALLET_A = "11111111111111111111111111111111";
const WALLET_B = "11111111111111111111111111111112";

const harness = vi.hoisted(() => ({
  address: "11111111111111111111111111111111" as string | null,
  canSign: true,
  /** Addresses whose authorization the SDK holds and can use. */
  usable: new Set<string>(),
  /** One object per address, as the SDK returns the one it holds. */
  held: new Map<string, { wallet: string }>(),
  authorizeCalls: [] as string[],
  authorizeOutcome: (): Promise<void> => Promise.resolve(),
  /** Whether a prompt that resolves leaves a usable authorization behind. */
  usableAfterSign: true,
  prepareCalls: [] as string[],
  prepareOutcome: (): Promise<void> => Promise.resolve(),
  visibility: "visible" as DocumentVisibilityState,
  /** The view the control sits in. */
  view: "idle",
  /** The reason the card reports for a failed session. */
  refusalReason: "authorization_required" as string | undefined,
  ensured: [] as boolean[],
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: harness.address ? { toBase58: () => harness.address } : null,
    signMessage: harness.canSign ? async () => new Uint8Array(64) : undefined,
  }),
}));

vi.mock("@/components/providers/pulse-provider", () => {
  // One instance for every render, as the provider gives.
  const pulse = {
    pairedAuthorization: (address: string) => {
      if (!harness.usable.has(address)) return null;
      const existing = harness.held.get(address);
      if (existing) return existing;
      const created = { wallet: address };
      harness.held.set(address, created);
      return created;
    },
    authorizePairedSession: async (wallet: { publicKey: { toBase58(): string } }) => {
      const address = wallet.publicKey.toBase58();
      harness.authorizeCalls.push(address);
      await harness.authorizeOutcome();
      if (harness.usableAfterSign) harness.usable.add(address);
      return { wallet: address };
    },
    preparePairedAuthorization: async (address: string) => {
      harness.prepareCalls.push(address);
      await harness.prepareOutcome();
    },
  };
  return { usePulse: () => pulse };
});

import {
  pairedStartLabel,
  usePairedAuthorization,
} from "../src/components/verify/use-paired-authorization";

function Control() {
  const authorization = usePairedAuthorization(harness.view);
  return (
    <div>
      <button
        type="button"
        data-testid="start"
        onClick={() => harness.ensured.push(authorization.ensure())}
      >
        {pairedStartLabel(authorization, "Start Verification")}
      </button>
      <button
        type="button"
        data-testid="refused"
        onClick={() => authorization.reportRefusal(harness.refusalReason)}
      >
        Refused
      </button>
      {authorization.error && <p role="alert">{authorization.error}</p>}
    </div>
  );
}

let container: HTMLDivElement;
let root: Root;

async function render() {
  await act(async () => {
    root.render(<Control />);
  });
}

async function settle() {
  await act(async () => {
    for (let turn = 0; turn < 5; turn++) await Promise.resolve();
  });
}

async function press(testId: "start" | "refused") {
  await act(async () => {
    container.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)!.click();
    await Promise.resolve();
  });
  await settle();
}

const tap = () => press("start");
const label = () => container.querySelector('[data-testid="start"]')!.textContent;
const alertText = () => container.querySelector('[role="alert"]')?.textContent ?? null;

async function switchWallet(address: string | null) {
  harness.address = address;
  await render();
  await settle();
}

async function setVisibility(next: DocumentVisibilityState) {
  harness.visibility = next;
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
  });
  await settle();
}

async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  });
  await settle();
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  harness.address = WALLET_A;
  harness.canSign = true;
  harness.usable = new Set();
  harness.held = new Map();
  harness.authorizeCalls = [];
  harness.authorizeOutcome = () => Promise.resolve();
  harness.usableAfterSign = true;
  harness.prepareCalls = [];
  harness.prepareOutcome = () => Promise.resolve();
  harness.visibility = "visible";
  harness.refusalReason = "authorization_required";
  harness.view = "idle";
  harness.ensured = [];
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => harness.visibility,
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});

describe("paired authorization control", () => {
  it("asks the wallet in one tap and lets the next tap start", async () => {
    await render();
    expect(label()).toBe("Authorize Wallet");

    await tap();
    expect(harness.ensured).toEqual([false]);
    expect(harness.authorizeCalls).toEqual([WALLET_A]);
    expect(label()).toBe("Start Verification");

    await tap();
    expect(harness.ensured).toEqual([false, true]);
    expect(harness.authorizeCalls).toHaveLength(1);
  });

  it("shows the wallet prompt as pending and asks once", async () => {
    let finish = () => {};
    harness.authorizeOutcome = () => new Promise<void>((resolve) => (finish = resolve));
    await render();

    await tap();
    expect(label()).toBe("Waiting for wallet...");
    await tap();
    expect(harness.authorizeCalls).toHaveLength(1);
    expect(harness.ensured).toEqual([false, false]);

    await act(async () => {
      finish();
      await Promise.resolve();
    });
    await settle();
    expect(label()).toBe("Start Verification");
  });

  it("reads the authorization again until it stops being usable", async () => {
    vi.useFakeTimers();
    harness.usable.add(WALLET_A);
    await render();
    expect(label()).toBe("Start Verification");

    // The SDK stops returning it once too little of its lifetime is left.
    harness.usable.delete(WALLET_A);
    await advance(10_000);
    expect(label()).toBe("Authorize Wallet");
  });

  it("reads the authorization again when the page becomes visible", async () => {
    harness.usable.add(WALLET_A);
    await render();
    harness.usable.delete(WALLET_A);
    await setVisibility("hidden");
    await setVisibility("visible");
    expect(label()).toBe("Authorize Wallet");
  });

  it("checks the authorization at the tap, not at the last render", async () => {
    harness.usable.add(WALLET_A);
    await render();
    expect(label()).toBe("Start Verification");

    // The SDK drops an authorization the relayer refused. Nothing renders in between.
    harness.usable.delete(WALLET_A);
    await tap();
    expect(harness.ensured).toEqual([false]);
    expect(harness.authorizeCalls).toHaveLength(1);
  });

  it("releases the control when the wallet changes during a prompt", async () => {
    // The prompt for the first wallet never settles.
    harness.authorizeOutcome = () => new Promise<void>(() => undefined);
    await render();
    await tap();
    expect(label()).toBe("Waiting for wallet...");

    await switchWallet(WALLET_B);
    expect(label()).toBe("Authorize Wallet");

    await tap();
    expect(harness.authorizeCalls).toEqual([WALLET_A, WALLET_B]);
  });
});

describe("paired authorization messages", () => {
  async function failWith(cause: unknown): Promise<string | null> {
    harness.authorizeOutcome = () => Promise.reject(cause);
    await render();
    await tap();
    return alertText();
  }

  it("says the person declined", async () => {
    expect(await failWith(new Error("User rejected the request."))).toBe(
      "The wallet did not sign. Try again.",
    );
    expect(label()).toBe("Authorize Wallet");
  });

  it("says the wallet did not respond in time", async () => {
    const timeout = new Error("Your wallet did not respond to the authorization request.");
    timeout.name = "EntrosTimeoutError";
    expect(await failWith(timeout)).toBe("The wallet did not respond. Open it and try again.");
  });

  it("says the prompt stayed open too long when the SDK refuses the late signature", async () => {
    expect(await failWith(new PairedProtocolError("authorization_required"))).toBe(
      "The wallet prompt stayed open too long. Authorize again.",
    );
  });

  it("says the prompt stayed open too long when a signed prompt leaves nothing usable", async () => {
    harness.usableAfterSign = false;
    await render();
    await tap();
    expect(alertText()).toBe("The wallet prompt stayed open too long. Authorize again.");
    expect(label()).toBe("Authorize Wallet");
  });

  it("says the wallet cannot sign messages when its signing fails", async () => {
    const failure = new Error("Signing is not supported by this account.");
    failure.name = "WalletSignMessageError";
    expect(await failWith(failure)).toBe(
      "This wallet cannot sign messages. Connect a wallet that can.",
    );
  });

  it("says the wallet cannot sign messages when its signature does not verify", async () => {
    expect(await failWith(new PairedProtocolError("invalid_request"))).toBe(
      "This wallet cannot sign messages. Connect a wallet that can.",
    );
  });

  it("says the wallet cannot sign messages when it offers no signing", async () => {
    harness.canSign = false;
    await render();
    await tap();
    expect(harness.authorizeCalls).toHaveLength(0);
    expect(alertText()).toBe("This wallet cannot sign messages. Connect a wallet that can.");
  });

  it("asks for patience on a throttled request", async () => {
    expect(await failWith(new PairedProtocolError("rate_limited", 429, 30))).toBe(
      "Too many requests. Wait a moment, then try again.",
    );
  });

  it.each([
    ["an unreachable service", new PairedProtocolError("validation_unavailable")],
    ["a refused request", new PairedProtocolError("invalid_request", 400)],
    ["a failing service", new PairedProtocolError("technical_failure", 503)],
  ])("names the service for %s", async (_name, cause) => {
    expect(await failWith(cause)).toBe("The verification service is unavailable. Try again.");
  });
});

describe("relayer without the authorization route", () => {
  it("asks for nothing once a tap learns the route is missing", async () => {
    harness.prepareOutcome = () => Promise.reject(new PairedProtocolError("validation_unavailable"));
    harness.authorizeOutcome = () => Promise.reject(new PairedProtocolError("unsupported_session", 404));
    await render();
    await tap();
    expect(label()).toBe("Start Verification");
    expect(alertText()).toBeNull();

    await tap();
    expect(harness.ensured).toEqual([false, true]);
    expect(harness.authorizeCalls).toHaveLength(1);
  });

  it("asks for nothing once a prepared grant learns the route is missing", async () => {
    harness.prepareOutcome = () => Promise.reject(new PairedProtocolError("unsupported_session", 404));
    await render();
    await settle();
    expect(label()).toBe("Start Verification");
    await tap();
    expect(harness.ensured).toEqual([true]);
    expect(harness.authorizeCalls).toHaveLength(0);
  });

  it("asks again after a wallet change", async () => {
    harness.prepareOutcome = () => Promise.reject(new PairedProtocolError("unsupported_session", 404));
    await render();
    await settle();
    expect(label()).toBe("Start Verification");

    harness.prepareOutcome = () => Promise.resolve();
    await switchWallet(WALLET_B);
    expect(label()).toBe("Authorize Wallet");
    await switchWallet(WALLET_A);
    expect(label()).toBe("Authorize Wallet");
  });

  it("asks again and prepares a grant once a session is refused for want of one", async () => {
    harness.prepareOutcome = () => Promise.reject(new PairedProtocolError("unsupported_session", 404));
    await render();
    await settle();
    expect(label()).toBe("Start Verification");
    const prepared = harness.prepareCalls.length;

    harness.prepareOutcome = () => Promise.resolve();
    await press("refused");
    expect(label()).toBe("Authorize Wallet");
    expect(harness.prepareCalls.length).toBe(prepared + 1);
  });
});

describe("grant prepared ahead of the tap", () => {
  it("prepares on mount for a wallet without a usable authorization", async () => {
    await render();
    await settle();
    expect(harness.prepareCalls).toEqual([WALLET_A]);
  });

  it("prepares nothing while an authorization is usable", async () => {
    vi.useFakeTimers();
    harness.usable.add(WALLET_A);
    await render();
    await advance(180_000);
    expect(harness.prepareCalls).toEqual([]);
  });

  it("prepares nothing without a wallet", async () => {
    harness.address = null;
    await render();
    await settle();
    expect(harness.prepareCalls).toEqual([]);
  });

  it("prepares for the new wallet when the wallet changes", async () => {
    await render();
    await settle();
    await switchWallet(WALLET_B);
    expect(harness.prepareCalls).toEqual([WALLET_A, WALLET_B]);
  });

  it("prepares again every minute while the page is visible", async () => {
    vi.useFakeTimers();
    await render();
    await settle();
    expect(harness.prepareCalls).toHaveLength(1);
    await advance(59_000);
    expect(harness.prepareCalls).toHaveLength(1);
    await advance(1_000);
    expect(harness.prepareCalls).toHaveLength(2);
    await advance(60_000);
    expect(harness.prepareCalls).toHaveLength(3);
  });

  it("stops while the page is hidden and prepares when it is visible again", async () => {
    vi.useFakeTimers();
    await render();
    await settle();
    await setVisibility("hidden");
    await advance(300_000);
    expect(harness.prepareCalls).toHaveLength(1);

    await setVisibility("visible");
    expect(harness.prepareCalls).toHaveLength(2);
    await advance(60_000);
    expect(harness.prepareCalls).toHaveLength(3);
  });

  it("stops once the wallet has authorized", async () => {
    vi.useFakeTimers();
    await render();
    await settle();
    await tap();
    expect(label()).toBe("Start Verification");
    const prepared = harness.prepareCalls.length;
    await advance(180_000);
    expect(harness.prepareCalls).toHaveLength(prepared);
  });

  it("prepares nothing while the wallet prompt is open", async () => {
    vi.useFakeTimers();
    harness.authorizeOutcome = () => new Promise<void>(() => undefined);
    await render();
    await settle();
    await tap();
    const prepared = harness.prepareCalls.length;
    await advance(180_000);
    expect(harness.prepareCalls).toHaveLength(prepared);
  });

  it("keeps a failed preparation out of sight", async () => {
    harness.prepareOutcome = () => Promise.reject(new PairedProtocolError("rate_limited", 429));
    await render();
    await settle();
    expect(alertText()).toBeNull();
    expect(label()).toBe("Authorize Wallet");
  });

  it("prepares again after a session is refused for want of an authorization", async () => {
    await render();
    await settle();
    await press("refused");
    expect(harness.prepareCalls).toEqual([WALLET_A, WALLET_A]);
  });

  it("ignores a failure for any other reason", async () => {
    harness.prepareOutcome = () => Promise.reject(new PairedProtocolError("unsupported_session", 404));
    await render();
    await settle();
    for (const reason of ["variance_floor", "session_expired", undefined]) {
      harness.refusalReason = reason;
      await press("refused");
    }
    expect(harness.prepareCalls).toEqual([WALLET_A]);
    expect(label()).toBe("Start Verification");
  });

  it("asks again after an invalid authorization", async () => {
    harness.prepareOutcome = () => Promise.reject(new PairedProtocolError("unsupported_session", 404));
    await render();
    await settle();
    harness.prepareOutcome = () => Promise.resolve();
    harness.refusalReason = "authorization_invalid";
    await press("refused");
    expect(label()).toBe("Authorize Wallet");
    expect(harness.prepareCalls).toEqual([WALLET_A, WALLET_A]);
  });
});

describe("authorization error lifetime", () => {
  async function showView(view: string) {
    harness.view = view;
    await render();
    await settle();
  }

  it("clears the error once the view changes", async () => {
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await showView("soft_failed");
    await tap();
    expect(alertText()).toBe("The wallet did not sign. Try again.");

    await showView("idle");
    expect(alertText()).toBeNull();
    await showView("soft_failed");
    expect(alertText()).toBeNull();
  });

  it("shows nothing for a prompt that fails after its view is gone", async () => {
    let decline = () => {};
    harness.authorizeOutcome = () =>
      new Promise<void>((_, reject) => (decline = () => reject(new Error("User rejected the request."))));
    await showView("reset-dialog");
    await tap();
    await showView("failed");

    await act(async () => {
      decline();
      await Promise.resolve();
    });
    await settle();
    expect(alertText()).toBeNull();
    await showView("reset-dialog");
    expect(alertText()).toBeNull();
  });

  it("keeps the error while the view stays", async () => {
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await showView("idle");
    await tap();
    await render();
    await settle();
    expect(alertText()).toBe("The wallet did not sign. Try again.");
  });
});

