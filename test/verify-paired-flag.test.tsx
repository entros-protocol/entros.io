// @vitest-environment jsdom

import { act, useReducer } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  PairedProtocolError,
  type PairedRoundView,
  type PairedSessionOptions,
} from "@entros/pulse-sdk";
import { PublicKey } from "@solana/web3.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ActiveStudyGrant } from "../src/lib/population-study";
import type { VerifyState } from "../src/components/verify/types";

const WALLET = new PublicKey("11111111111111111111111111111112");
const OTHER_WALLET = new PublicKey("11111111111111111111111111111113");

const harness = vi.hoisted(() => ({
  /** The connected wallet's key, or null while disconnected. */
  publicKey: null as unknown,
  singleSessions: 0,
  pairedOptions: [] as unknown[],
  startCalls: [] as { wallet: string; surface: HTMLElement }[],
  aborts: 0,
  /** What each paired `complete` resolves to, in order. */
  completeResults: [] as unknown[],
  completes: 0,
  resets: 0,
  /** How the next `start` settles once the session opens. */
  startOutcome: (): Promise<void> => Promise.resolve(),
  /** Moves the latest paired session to a phase, as the SDK does before `onPhase`. */
  setPhase: (() => undefined) as (phase: string) => void,
  /** The paired authorization the SDK holds, or null until the wallet signs. */
  authorization: null as unknown,
  authorizeCalls: 0,
  /** How the next wallet prompt settles. */
  authorizeOutcome: (): Promise<void> => Promise.resolve(),
  prepareCalls: 0,
  /** How the next grant request settles. */
  prepareOutcome: (): Promise<void> => Promise.resolve(),
}));

// jsdom's typed arrays come from another realm, which breaks the real PDA
// derivation. The flow only needs a key it can print and a PDA it can read.
vi.mock("@solana/web3.js", () => {
  class PublicKey {
    constructor(private readonly value: string) {}
    toBase58() {
      return this.value;
    }
    toBuffer() {
      return new Uint8Array(32);
    }
    static findProgramAddressSync() {
      return [new PublicKey("identity-pda"), 255];
    }
  }
  return {
    PublicKey,
    Connection: class {},
    clusterApiUrl: () => "https://example.invalid",
  };
});

// The flow keys effects on the connection, so it has to keep one identity.
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
  WalletConnectButton: () => null,
}));

vi.mock("@/components/ui/connected-wallet-pill", () => ({
  ConnectedWalletPill: () => null,
}));

vi.mock("@/hooks/use-motion-capability", () => ({
  useMotionCapability: () => false,
}));

vi.mock("@/components/providers/pulse-provider", () => {
  // One instance for every render, as the provider gives.
  const pulse = {
    pairedAuthorization: () => harness.authorization,
    preparePairedAuthorization: async () => {
      harness.prepareCalls += 1;
      await harness.prepareOutcome();
    },
    authorizePairedSession: async () => {
      harness.authorizeCalls += 1;
      await harness.authorizeOutcome();
      harness.authorization = { expiresAtMs: performance.now() + 900_000 };
      return harness.authorization;
    },
    createSession: () => {
      harness.singleSessions += 1;
      return {
        skipMotion: () => undefined,
        startAudio: async () => undefined,
        bindValidationChallenge: () => undefined,
        stopAudio: async () => null,
        stopMotion: async () => [],
        stopTouch: async () => [],
      };
    },
    createPairedSession: (options: unknown) => {
      harness.pairedOptions.push(options);
      let phase = "idle";
      harness.setPhase = (next: string) => {
        phase = next;
      };
      return {
        get currentPhase() {
          return phase;
        },
        start: (wallet: string, surface: HTMLElement) => {
          harness.startCalls.push({ wallet, surface });
          phase = "opening";
          return harness.startOutcome().then(() => {
            if (phase === "opening") phase = "round";
          });
        },
        continueRound: () => false,
        complete: async () => {
          harness.completes += 1;
          return harness.completeResults.shift();
        },
        completeReset: async () => {
          harness.resets += 1;
          return harness.completeResults.shift();
        },
        abort: () => {
          harness.aborts += 1;
          phase = "failed";
        },
      };
    },
  };
  return { usePulse: () => pulse };
});

import { VerifyWalletConnected } from "../src/components/sections/verify-wallet-connected";
import { readLastVerification } from "../src/lib/last-verification";
import {
  initialState,
  verifyReducer,
} from "../src/components/verify/verify-state-machine";

function Harness({
  studyGrant = null,
  startState = initialState,
}: {
  studyGrant?: ActiveStudyGrant | null;
  startState?: VerifyState;
}) {
  const [state, dispatch] = useReducer(verifyReducer, startState);
  return (
    <div data-step={state.step}>
      <VerifyWalletConnected
        state={state}
        dispatch={dispatch}
        studyGrant={studyGrant}
      />
    </div>
  );
}

const ROUND: PairedRoundView = {
  roundIndex: 1,
  rounds: 3,
  expiresAtMs: 12_000,
  word: "garden",
  waypoints: [
    { x: 200, y: 800 },
    { x: 200, y: 200 },
    { x: 800, y: 800 },
  ],
};

const STUDY_GRANT = {
  token: "A".repeat(43),
  session_id: "01".repeat(16),
  trial_index: 1,
  trial_limit: 5,
  expires_in: 3_600,
  definition: { feature_schema_version: 4, projection_version: 1 },
} as unknown as ActiveStudyGrant;

let container: HTMLDivElement;
let root: Root;
let fetchMock: ReturnType<typeof vi.fn>;

async function render(element: React.ReactElement) {
  await act(async () => root.render(element));
}

/** Lets pending promises, timers and the paired chunk settle. */
async function flush() {
  await act(async () => {
    await vi.dynamicImportSettled();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** Renders the paired flow and waits until its code has loaded. */
async function renderPaired() {
  await render(<Harness />);
  await flush();
}

function startButton(): HTMLButtonElement | undefined {
  return [...container.querySelectorAll("button")].find(
    (element) => element.textContent === "Start Verification",
  );
}

async function clickStart() {
  const button = startButton();
  expect(button).toBeDefined();
  expect(button!.disabled).toBe(false);
  await act(async () => {
    button!.click();
    await Promise.resolve();
  });
  await flush();
}

function step(): string | undefined {
  return container.querySelector<HTMLElement>("[data-step]")?.dataset.step;
}

function latestOptions(): PairedSessionOptions {
  return harness.pairedOptions.at(-1) as PairedSessionOptions;
}

function qualityFailure() {
  return {
    success: false,
    commitment: new Uint8Array(32),
    isFirstVerification: false,
    error: "capture needs a retry",
    reason: "anchor_retry",
    failedAt: "validation",
  };
}

async function finishLatestRounds() {
  await act(async () => {
    harness.setPhase("ready");
    latestOptions().onPhase?.("ready");
    await Promise.resolve();
  });
  await flush();
}

async function clickAction(label: string, scope: ParentNode = container) {
  const button = [...scope.querySelectorAll("button")].find(node => node.textContent === label);
  expect(button).toBeDefined();
  await act(async () => {
    button!.click();
    await Promise.resolve();
  });
  await flush();
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  harness.publicKey = WALLET;
  harness.singleSessions = 0;
  harness.pairedOptions = [];
  harness.startCalls = [];
  harness.aborts = 0;
  harness.completeResults = [];
  harness.completes = 0;
  harness.resets = 0;
  harness.startOutcome = () => Promise.resolve();
  // The wallet has signed already, as it has on every tap after the first of a visit.
  harness.authorization = { expiresAtMs: performance.now() + 900_000 };
  harness.authorizeCalls = 0;
  harness.authorizeOutcome = () => Promise.resolve();
  harness.prepareCalls = 0;
  harness.prepareOutcome = () => Promise.resolve();
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("paired-only verify flow", () => {
  it("runs the paired rounds by default and never offers the single capture", async () => {
    await renderPaired();

    expect(container.textContent).toContain(
      "Three rounds: say one word and trace one short path in each.",
    );
    expect(container.textContent).not.toContain(
      "All sensors record simultaneously",
    );

    await clickStart();

    expect(harness.singleSessions).toBe(0);
    expect(harness.pairedOptions).toHaveLength(1);
    expect(step()).toBe("capturing");
    expect(
      container.querySelector('[data-testid="paired-trace-surface"]'),
    ).not.toBeNull();
  });

  it("runs the paired rounds for a wallet with an active study grant", async () => {
    await render(<Harness studyGrant={STUDY_GRANT} />);
    await flush();

    expect(container.textContent).toContain(
      "Three rounds: say one word and trace one short path in each.",
    );

    await clickStart();

    expect(harness.singleSessions).toBe(0);
    expect(harness.pairedOptions).toHaveLength(1);
  });

  it("runs the paired rounds from the tap", async () => {
    await renderPaired();

    expect(container.textContent).toContain(
      "Three rounds: say one word and trace one short path in each.",
    );

    await clickStart();

    expect(harness.singleSessions).toBe(0);
    expect(harness.pairedOptions).toHaveLength(1);
    // The SDK opens the session itself, so the site sends nothing of its own.
    expect(latestOptions()).not.toHaveProperty("openSession");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(step()).toBe("capturing");

    // The session starts inside the tap, on the surface the capture view mounted.
    const surface = container.querySelector<HTMLElement>(
      '[data-testid="paired-trace-surface"]',
    );
    expect(harness.startCalls).toHaveLength(1);
    expect(harness.startCalls[0]!.wallet).toBe(WALLET.toBase58());
    expect(harness.startCalls[0]!.surface).toBe(surface);
    expect(surface?.isConnected).toBe(true);

    // Nothing of the challenge shows before the reveal.
    expect(container.textContent).not.toContain("garden");
    const options = latestOptions();
    await act(async () => {
      options.onPhase?.("round");
      options.onReveal?.(ROUND);
    });
    expect(container.textContent).toContain("Round 1 of 3");
    expect(container.textContent).toContain("garden");
  });

  it("shows the session failure with its cooldown", async () => {
    await renderPaired();
    await clickStart();

    await act(async () => {
      latestOptions().onFailure?.(new PairedProtocolError("capacity_reached", 429, 20));
      await Promise.resolve();
    });

    expect(step()).toBe("failed");
    expect(container.textContent).toContain("Verification is busy");
    expect(container.textContent).toContain("Try again in 20 seconds.");
  });

  it.each([
    {
      name: "a session open elsewhere",
      error: () => new PairedProtocolError("session_active", 409, 42),
      title: "A session is already open",
      body: "This wallet has a verification open on another device or network. Try again in 42 seconds.",
    },
    {
      name: "a wallet rate limit",
      error: () => new PairedProtocolError("rate_limited", 429, 30),
      title: "Too many attempts",
      body: "This wallet has reached its retry limit. Try again in 30 seconds.",
    },
    {
      name: "a network rate limit",
      error: () => new PairedProtocolError("ip_rate_limited", 429, 90),
      title: "Too many attempts",
      body: "Too many attempts came from your network. Try again in 2 minutes.",
    },
    {
      name: "a device cooldown",
      error: () => new PairedProtocolError("cross_wallet_cooldown", 429, 5),
      title: "Device cooldown active",
      body: "A different wallet verified from this device recently. Try again in 5 seconds.",
    },
    {
      name: "a busy service",
      error: () => new PairedProtocolError("session_busy", 503, 1),
      title: "This session ended",
      body: "The verification service was busy. Start a new verification.",
    },
    {
      name: "a refused microphone",
      error: () => new DOMException("Permission denied", "NotAllowedError"),
      title: "Microphone access needed",
      body: "Your browser blocked microphone access. Verification needs to hear your voice in each round.",
    },
  ])("routes $name from a start that rejects", async ({ error, title, body }) => {
    const refusal = error();
    harness.startOutcome = () => Promise.reject(refusal);
    await renderPaired();
    await clickStart();

    expect(harness.startCalls).toHaveLength(1);
    expect(step()).toBe("failed");
    expect(container.textContent).toContain(title);
    expect(container.textContent).toContain(body);
    expect(container.querySelector('[data-testid="paired-trace-surface"]')).toBeNull();

    // The failure is reported once, and a late callback changes nothing.
    await act(async () => {
      latestOptions().onFailure?.(new PairedProtocolError("technical_failure"));
      latestOptions().onReveal?.(ROUND);
    });
    expect(step()).toBe("failed");
    expect(container.textContent).toContain(title);
  });

  it("charges a session-state failure to the no-verdict budget", async () => {
    const failure = (reason: string) => ({
      success: false,
      commitment: new Uint8Array(32),
      isFirstVerification: false,
      error: "rejected",
      reason,
      failedAt: "validation",
    });
    harness.completeResults = [failure("variance_floor"), failure("session_consumed")];
    await renderPaired();

    const finishRounds = async () => {
      const options = latestOptions();
      await act(async () => {
        harness.setPhase("ready");
        options.onPhase?.("ready");
        await Promise.resolve();
      });
      await flush();
    };

    await clickStart();
    await finishRounds();
    expect(step()).toBe("soft_failed");
    expect(container.textContent).toContain("2 attempts left");

    const retry = [...container.querySelectorAll("button")].find(
      (element) => element.textContent === "Try again",
    );
    await act(async () => {
      retry!.click();
      await Promise.resolve();
    });
    expect(harness.pairedOptions).toHaveLength(2);
    await finishRounds();

    // The verdict budget is at one of three. The session-state failure starts
    // its own count, so it still offers two more tries.
    expect(step()).toBe("soft_failed");
    expect(container.textContent).toContain(
      "The service already checked this session. Start a new verification.",
    );
    expect(container.textContent).toContain("2 attempts left");
  });

  it("bounds quality retries at three and uses paired reset completion throughout", async () => {
    harness.completeResults = [qualityFailure(), qualityFailure(), qualityFailure()];
    await render(<Harness startState={{ step: "failed", error: "Your baseline is missing.", failedAt: "baseline" }} />);
    await flush();
    await clickAction("Reset baseline");
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    await clickAction("Reset baseline", dialog!);
    await finishLatestRounds();
    expect(step()).toBe("soft_failed");
    expect(container.textContent).toContain("Say each word once.");
    expect(container.textContent).toContain("2 attempts left");
    await clickAction("Try again");
    await finishLatestRounds();
    expect(container.textContent).toContain("1 attempt left");
    await clickAction("Try again");
    await finishLatestRounds();
    expect(step()).toBe("failed");
    expect(container.textContent).toContain("Baseline not set");
    expect(harness.pairedOptions).toHaveLength(3);
    expect(harness.resets).toBe(3);
    expect(harness.completes).toBe(0);
    expect(harness.singleSessions).toBe(0);
  });

  // A session starts inside one tap, because the microphone and motion permissions need
  // that gesture. The wallet prompt therefore takes a tap of its own, before it.
  it("has the wallet sign in one tap and starts the capture on the next", async () => {
    harness.authorization = null;
    await renderPaired();
    expect(startButton()).toBeUndefined();

    await clickAction("Authorize Wallet");
    expect(harness.authorizeCalls).toBe(1);
    expect(harness.pairedOptions).toHaveLength(0);
    expect(step()).not.toBe("capturing");

    await clickStart();
    expect(harness.authorizeCalls).toBe(1);
    expect(harness.pairedOptions).toHaveLength(1);
    expect(step()).toBe("capturing");
  });

  it("starts at once while the wallet's signature still holds", async () => {
    await renderPaired();
    await clickStart();
    expect(harness.authorizeCalls).toBe(0);
    expect(harness.startCalls).toHaveLength(1);
  });

  it("says why the wallet did not authorize and lets the person try again", async () => {
    harness.authorization = null;
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await renderPaired();
    await clickAction("Authorize Wallet");
    expect(container.textContent).toContain("The wallet did not sign. Try again.");
    expect(harness.pairedOptions).toHaveLength(0);

    harness.authorizeOutcome = () => Promise.resolve();
    await clickAction("Authorize Wallet");
    expect(container.textContent).not.toContain("The wallet did not sign.");
    expect(startButton()).toBeDefined();
  });

  it("keeps the reset dialog open while the wallet signs", async () => {
    harness.authorization = null;
    harness.completeResults = [qualityFailure()];
    await render(<Harness startState={{ step: "failed", error: "Your baseline is missing.", failedAt: "baseline" }} />);
    await flush();
    await clickAction("Reset baseline");
    const dialog = () => container.querySelector('[role="dialog"]');
    expect(dialog()).not.toBeNull();

    await clickAction("Authorize Wallet", dialog()!);
    expect(harness.authorizeCalls).toBe(1);
    expect(harness.pairedOptions).toHaveLength(0);
    expect(dialog()).not.toBeNull();

    await clickAction("Reset baseline", dialog()!);
    expect(dialog()).toBeNull();
    expect(harness.pairedOptions).toHaveLength(1);
  });

  it("clears the quality budget on Cancel", async () => {
    harness.completeResults = [qualityFailure(), qualityFailure()];
    await renderPaired();
    await clickStart();
    await finishLatestRounds();
    expect(container.textContent).toContain("2 attempts left");
    await clickAction("Cancel");
    await clickStart();
    await finishLatestRounds();
    expect(container.textContent).toContain("2 attempts left");
  });

  it("clears quality retries across a wallet switch even without a capture in between", async () => {
    harness.completeResults = [qualityFailure(), qualityFailure(), qualityFailure()];
    await renderPaired();
    await clickStart();
    await finishLatestRounds();
    await clickAction("Try again");
    await finishLatestRounds();
    expect(container.textContent).toContain("1 attempt left");
    harness.publicKey = OTHER_WALLET;
    await renderPaired();
    harness.publicKey = WALLET;
    await renderPaired();
    await clickStart();
    await finishLatestRounds();
    expect(container.textContent).toContain("2 attempts left");
  });

  it.each(["wallet", "disconnect", "unmount"])("cancels pending finalization on %s and ignores its late success", async change => {
    let resolve!: (value:unknown) => void;
    harness.completeResults=[new Promise(done => {resolve=done;})];
    await renderPaired();
    await clickStart();
    await act(async () => {harness.setPhase("ready");latestOptions().onPhase?.("ready");await Promise.resolve();});
    await flush();
    expect(harness.aborts).toBe(0);
    if (change === "unmount") {
      await act(async () => root.unmount());
      root=createRoot(container);
    } else {
      harness.publicKey=change === "wallet" ? OTHER_WALLET : null;
      await renderPaired();
    }
    expect(harness.aborts).toBe(1);
    await act(async () => {resolve({success:true,commitment:new Uint8Array(32),isFirstVerification:true,txSignature:"stale"});});
    await flush();
    expect(step()).not.toBe("success");
    expect(container.textContent).not.toContain("stale");
  });

  it("ends the session when the capture view goes away", async () => {
    await renderPaired();
    await clickStart();
    expect(harness.aborts).toBe(0);

    await act(async () => root.unmount());
    root = createRoot(container);

    expect(harness.aborts).toBe(1);
  });

  it("ends the session and starts over when the wallet changes", async () => {
    await renderPaired();
    await clickStart();
    await act(async () => {
      latestOptions().onPhase?.("round");
      latestOptions().onReveal?.(ROUND);
    });
    expect(container.textContent).toContain("garden");

    harness.publicKey = OTHER_WALLET;
    await render(<Harness />);

    expect(harness.aborts).toBe(1);
    expect(step()).toBe("idle");
    expect(container.textContent).not.toContain("garden");
    expect(container.textContent).toContain("Start Verification");

    // A callback from the abandoned session changes nothing.
    await act(async () => {
      latestOptions().onFailure?.(new PairedProtocolError("session_expired"));
    });
    expect(step()).toBe("idle");
  });

  it("ends the session and starts over when the wallet disconnects", async () => {
    await renderPaired();
    await clickStart();

    harness.publicKey = null;
    await render(<Harness />);

    expect(harness.aborts).toBe(1);
    expect(step()).toBe("idle");
    expect(container.textContent).toContain("Prepare a Solana Devnet wallet");

    harness.publicKey = WALLET;
    await render(<Harness />);
    await flush();
    expect(startButton()?.disabled).toBe(false);
  });

  it("aborts a session that is still opening", async () => {
    // The open never settles, as while the SDK waits on the network.
    harness.startOutcome = () => new Promise<void>(() => undefined);
    await renderPaired();
    await clickStart();
    expect(harness.startCalls).toHaveLength(1);
    expect(container.textContent).toContain("Preparing round 1");

    harness.publicKey = OTHER_WALLET;
    await render(<Harness />);

    expect(harness.aborts).toBe(1);
    expect(step()).toBe("idle");
  });

  it("redraws the meter at most once for each interval", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    await renderPaired();
    await clickStart();
    const options = latestOptions();
    await act(async () => {
      options.onPhase?.("round");
      options.onReveal?.(ROUND);
    });
    const firstBar = () =>
      container.querySelector<HTMLElement>('[class~="bg-cyan/60"]')!.style.height;
    expect(firstBar()).toBe("2px");

    // Five frames of audio in a burst ask for one redraw.
    for (let frame = 0; frame < 5; frame++) options.onLevel?.(0.01 * frame, false);
    expect(frames).toHaveLength(1);

    await act(async () => frames.shift()!(1_000));
    // The latest level, 0.04, fills the bar: 2 + 1 * 32 * 0.6.
    expect(firstBar()).toBe("21.2px");
    const word = () => [...container.querySelectorAll("p")].find((node) => node.textContent === ROUND.word)!;
    expect(word().style.textShadow).toBe("none");

    // A level inside the interval waits for a later frame.
    options.onLevel?.(0, false);
    await act(async () => frames.shift()!(1_050));
    expect(firstBar()).toBe("21.2px");
    expect(frames).toHaveLength(1);
    await act(async () => frames.shift()!(1_100));
    expect(firstBar()).toBe("2px");
    options.onLevel?.(0.004, true);
    await act(async () => frames.shift()!(1_200));
    expect(word().style.textShadow).not.toBe("none");
    await act(async () => options.onReveal?.(ROUND));
    expect(word().style.textShadow).toBe("none");
  });
});

describe("paired verify flow wallet authorization", () => {
  const SIGNATURE = "5".repeat(87);
  const unsupported = () => Promise.reject(new PairedProtocolError("unsupported_session", 404));

  // The microphone and motion permissions need the tap's gesture, so nothing may
  // be awaited between the tap and the session start.
  it("starts the capture before the tap's handler returns", async () => {
    await renderPaired();
    const button = startButton()!;
    let startedInTap = -1;
    act(() => {
      button.click();
      startedInTap = harness.startCalls.length;
    });
    expect(startedInTap).toBe(1);
    await flush();
  });

  it("starts a reset before the tap's handler returns", async () => {
    await render(<Harness startState={{ step: "failed", error: "Your baseline is missing.", failedAt: "baseline" }} />);
    await flush();
    await clickAction("Reset baseline");
    const confirm = [...container.querySelector('[role="dialog"]')!.querySelectorAll("button")].find(
      (node) => node.textContent === "Reset baseline",
    )!;
    let startedInTap = -1;
    act(() => {
      confirm.click();
      startedInTap = harness.startCalls.length;
    });
    expect(startedInTap).toBe(1);
    await flush();
  });

  it("says why the wallet did not authorize on the retry screen", async () => {
    harness.completeResults = [qualityFailure()];
    await renderPaired();
    await clickStart();
    await finishLatestRounds();
    expect(step()).toBe("soft_failed");

    harness.authorization = null;
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await clickAction("Try again");
    expect(step()).toBe("soft_failed");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "The wallet did not sign. Try again.",
    );
    expect(harness.pairedOptions).toHaveLength(1);
  });

  it("says why the wallet did not authorize in the reset dialog", async () => {
    harness.authorization = null;
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await render(<Harness startState={{ step: "failed", error: "Your baseline is missing.", failedAt: "baseline" }} />);
    await flush();
    await clickAction("Reset baseline");
    const dialog = () => container.querySelector('[role="dialog"]');
    await clickAction("Authorize Wallet", dialog()!);
    expect(dialog()?.querySelector('[role="alert"]')?.textContent).toBe(
      "The wallet did not sign. Try again.",
    );
    expect(harness.pairedOptions).toHaveLength(0);
  });

  it("asks the wallet again after a session is refused for want of an authorization", async () => {
    harness.authorization = null;
    harness.prepareOutcome = unsupported;
    await renderPaired();
    // The relayer had no authorization route, so the capture starts without one.
    await clickStart();
    const prepared = harness.prepareCalls;

    harness.prepareOutcome = () => Promise.resolve();
    await act(async () => {
      latestOptions().onFailure?.(new PairedProtocolError("authorization_required", 401));
      await Promise.resolve();
    });
    await flush();
    expect(step()).toBe("failed");
    expect(harness.prepareCalls).toBe(prepared + 1);

    await clickAction("Try again");
    expect(step()).toBe("idle");
    expect(startButton()).toBeUndefined();
    expect(container.textContent).toContain("Authorize Wallet");
  });

  it("asks the wallet again after a verification is refused for want of an authorization", async () => {
    harness.authorization = null;
    harness.prepareOutcome = unsupported;
    harness.completeResults = [
      {
        success: false,
        commitment: new Uint8Array(32),
        isFirstVerification: false,
        error: "refused",
        reason: "authorization_invalid",
        failedAt: "validation",
      },
    ];
    await renderPaired();
    await clickStart();
    harness.prepareOutcome = () => Promise.resolve();
    await finishLatestRounds();
    expect(step()).toBe("soft_failed");
    const retry = [...container.querySelectorAll("button")].map((node) => node.textContent);
    expect(retry).toContain("Authorize Wallet");
  });

  it("remembers the transaction of a successful verification for its wallet", async () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    harness.completeResults = [
      { success: true, commitment: new Uint8Array(32), isFirstVerification: false, txSignature: SIGNATURE },
    ];
    await renderPaired();
    await clickStart();
    await finishLatestRounds();
    await flush();
    expect(step()).toBe("verified");
    expect(readLastVerification(WALLET.toBase58())).toBe(SIGNATURE);
    expect(readLastVerification(OTHER_WALLET.toBase58())).toBeNull();
  });

  it("clears the reset dialog's error when the dialog closes", async () => {
    harness.authorization = null;
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await render(<Harness startState={{ step: "failed", error: "Your baseline is missing.", failedAt: "baseline" }} />);
    await flush();
    await clickAction("Reset baseline");
    const dialog = () => container.querySelector('[role="dialog"]');
    await clickAction("Authorize Wallet", dialog()!);
    expect(dialog()?.querySelector('[role="alert"]')).not.toBeNull();

    await clickAction("Cancel", dialog()!);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    await clickAction("Reset baseline");
    expect(dialog()?.querySelector('[role="alert"]')).toBeNull();
  });

  it("drops the retry screen's error once the flow leaves it", async () => {
    harness.completeResults = [qualityFailure()];
    await renderPaired();
    await clickStart();
    await finishLatestRounds();
    harness.authorization = null;
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await clickAction("Try again");
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "The wallet did not sign. Try again.",
    );

    await clickAction("Cancel");
    expect(step()).toBe("idle");
    expect(container.textContent).not.toContain("The wallet did not sign.");
  });

  it("does not carry a declined prompt from the retry screen into a later reset dialog", async () => {
    harness.completeResults = [
      qualityFailure(),
      {
        success: false,
        commitment: new Uint8Array(32),
        isFirstVerification: false,
        error: "Your baseline is missing.",
        failedAt: "baseline",
      },
    ];
    await renderPaired();
    await clickStart();
    await finishLatestRounds();
    expect(step()).toBe("soft_failed");

    const signed = harness.authorization;
    harness.authorization = null;
    harness.authorizeOutcome = () => Promise.reject(new Error("User rejected the request."));
    await clickAction("Try again");
    expect(container.textContent).toContain("The wallet did not sign. Try again.");

    // The wallet signs elsewhere, and the next tap starts a capture that ends in a baseline failure.
    harness.authorization = signed;
    await clickAction("Authorize Wallet");
    // Speech was heard, so the result keeps its own message.
    latestOptions().onLevel?.(0.1, true);
    await finishLatestRounds();
    expect(step()).toBe("failed");

    await clickAction("Reset baseline");
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).not.toContain("The wallet did not sign.");
  });
});

