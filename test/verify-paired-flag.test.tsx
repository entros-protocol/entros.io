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
  /** How the next `start` settles once the session opens. */
  startOutcome: (): Promise<void> => Promise.resolve(),
  /** Moves the latest paired session to a phase, as the SDK does before `onPhase`. */
  setPhase: (() => undefined) as (phase: string) => void,
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

vi.mock("@/components/providers/pulse-provider", () => ({
  usePulse: () => ({
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
        complete: async () => harness.completeResults.shift(),
        completeReset: async () => harness.completeResults.shift(),
        abort: () => {
          harness.aborts += 1;
          phase = "failed";
        },
      };
    },
  }),
}));

import { VerifyWalletConnected } from "../src/components/sections/verify-wallet-connected";
import {
  initialState,
  verifyReducer,
} from "../src/components/verify/verify-state-machine";

function Harness({
  pairedVerify,
  studyGrant = null,
}: {
  pairedVerify?: boolean;
  studyGrant?: ActiveStudyGrant | null;
}) {
  const [state, dispatch] = useReducer(verifyReducer, initialState);
  return (
    <div data-step={state.step}>
      <VerifyWalletConnected
        state={state}
        dispatch={dispatch}
        pairedVerify={pairedVerify}
        studyGrant={studyGrant}
      />
    </div>
  );
}

const ROUND: PairedRoundView = {
  roundIndex: 1,
  rounds: 3,
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
  await render(<Harness pairedVerify />);
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

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  harness.publicKey = WALLET;
  harness.singleSessions = 0;
  harness.pairedOptions = [];
  harness.startCalls = [];
  harness.aborts = 0;
  harness.completeResults = [];
  harness.startOutcome = () => Promise.resolve();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.startsWith("/api/relay-challenge")) {
      return Response.json({
        nonce: Array(32).fill(7),
        phrase: "amber cedar drift maple orbit",
        expires_in: 180,
        curve: { a: 2, b: 3, delta: 1, points: 200, anchor_x: 50, anchor_y: 50 },
      });
    }
    return new Response(null, { status: 404 });
  });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("paired verify flag", () => {
  it("renders and runs the single capture while the flag is off", async () => {
    await render(<Harness />);

    expect(container.textContent).toContain(
      "All sensors record simultaneously for 12 seconds.",
    );
    expect(container.textContent).toContain("Speak the displayed phrase");
    expect(container.textContent).not.toContain("three rounds");

    await clickStart();

    expect(harness.singleSessions).toBe(1);
    expect(harness.pairedOptions).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/relay-challenge?wallet=${WALLET.toBase58()}`,
      expect.anything(),
    );
    expect(step()).toBe("capturing");
    expect(container.textContent).toContain("Recording starts in");
    expect(container.querySelector('[data-testid="paired-trace-surface"]')).toBeNull();
  });

  it("keeps a study trial on the single capture with the flag on", async () => {
    await render(<Harness pairedVerify studyGrant={STUDY_GRANT} />);

    expect(container.textContent).toContain("Speak the displayed phrase");

    await clickStart();

    expect(harness.singleSessions).toBe(1);
    expect(harness.pairedOptions).toHaveLength(0);
  });

  it("runs the paired rounds from the tap while the flag is on", async () => {
    await renderPaired();

    expect(container.textContent).toContain(
      "Say one word and trace one short path in each of three rounds.",
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
    await render(<Harness pairedVerify />);

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
    await render(<Harness pairedVerify />);

    expect(harness.aborts).toBe(1);
    expect(step()).toBe("idle");
    expect(container.textContent).toContain("Connect your Solana wallet");

    harness.publicKey = WALLET;
    await render(<Harness pairedVerify />);
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
    await render(<Harness pairedVerify />);

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
    for (let frame = 0; frame < 5; frame++) options.onLevel?.(0.01 * frame);
    expect(frames).toHaveLength(1);

    await act(async () => frames.shift()!(1_000));
    // The latest level, 0.04, fills the bar: 2 + 1 * 32 * 0.6.
    expect(firstBar()).toBe("21.2px");

    // A level inside the interval waits for a later frame.
    options.onLevel?.(0);
    await act(async () => frames.shift()!(1_050));
    expect(firstBar()).toBe("21.2px");
    expect(frames).toHaveLength(1);
    await act(async () => frames.shift()!(1_100));
    expect(firstBar()).toBe("2px");
  });
});
