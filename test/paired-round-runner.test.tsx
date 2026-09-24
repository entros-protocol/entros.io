// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoundRunner } from "../src/components/lab/round-runner";
import {
  challengeDigest,
  encodeCoarsePath,
  encodePathTarget,
  toHex,
  type Point,
} from "../src/lib/paired-round/transcript";

let container: HTMLDivElement;
let root: Root;

const SESSION_NONCE = "0f".repeat(32);
const ATTEMPT_BINDING = "1e".repeat(32);
const ROUND_NONCES = ["2a".repeat(32), "3b".repeat(32), "4c".repeat(32)];
const WORDS = ["balance", "garden", "silver"];
const WAYPOINTS: Point[] = [
  { x: 150, y: 150 },
  { x: 150, y: 700 },
  { x: 750, y: 700 },
];

// The factory is hoisted above module scope, so its state has to be hoisted with it.
const capture = vi.hoisted(() => ({ stopped: false, level: 0.02 }));

vi.mock("../src/lib/paired-round/capture", () => ({
  deviceClass: () => "desktop",
  startContinuousCapture: async () => {
    let cursor = 0;
    return {
      sampleRate: 16_000,
      mark: () => {
        cursor += 1_600;
        return cursor;
      },
      level: () => capture.level,
      slice: (from: number, to: number) => new Float32Array(Math.max(0, to - from)).fill(0.2),
      stop: () => {
        capture.stopped = true;
      },
    };
  },
}));

async function reveal(index: number) {
  const target = encodePathTarget("trace", WAYPOINTS);
  const digest = await challengeDigest(
    Uint8Array.from(Buffer.from(SESSION_NONCE, "hex")),
    index,
    Uint8Array.from(Buffer.from(ROUND_NONCES[index - 1]!, "hex")),
    WORDS[index - 1]!,
    target,
  );
  return {
    round_index: index,
    round_nonce: ROUND_NONCES[index - 1]!,
    word: WORDS[index - 1]!,
    path_target: toHex(target),
    challenge_digest: toHex(digest),
    expires_at: 0,
  };
}

function fetchStub() {
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  const handler = vi.fn(async (path: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    calls.push({ path, body });
    if (path.endsWith("/session")) {
      return jsonResponse({
        session_id: "session-1",
        tier: "trace",
        rounds: 3,
        session_nonce: SESSION_NONCE,
        attempt_binding: ATTEMPT_BINDING,
        session_expires_at: 1_789_000_600_000,
        reveal: await reveal(1),
      });
    }
    if (path.endsWith("/commit")) {
      const index = Number(body.round_index);
      return jsonResponse({
        state: index >= 3 ? "ready_to_finalize" : "awaiting_commit",
        reveal: index >= 3 ? null : await reveal(index + 1),
      });
    }
    return jsonResponse({ status: "recorded", rounds: 3 });
  });
  return { handler, calls };
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

async function startSession(calls: { path: string; body: Record<string, unknown> }[]) {
  await act(async () => root.render(<RoundRunner />));
  const codeInput = container.querySelector("input[type='text'], input:not([type])");
  const checkbox = container.querySelector<HTMLInputElement>("input[type='checkbox']");
  await act(async () => {
    setInputValue(codeInput as HTMLInputElement, "ABCD2345EFGH6789JKLM");
    checkbox!.click();
  });
  await act(async () => clickText("Start"));
  await settle();
  expect(calls[0]?.path).toBe("/api/lab/rounds/session");
}

/** WebCrypto and fetch each resolve on their own tick, so one flush is not enough. */
async function settle() {
  for (let tick = 0; tick < 12; tick += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function clickText(text: string) {
  const button = [...container.querySelectorAll("button")].find((node) =>
    node.textContent?.includes(text),
  );
  if (!button) throw new Error(`no button matching ${text}`);
  button.click();
}

/** Traces the waypoints on a 400 pixel surface, which maps 2.5 grid units to each pixel. */
function trace() {
  const surface = container.querySelector("svg");
  if (!surface) throw new Error("no trace surface");
  surface.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
  (surface as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture =
    () => undefined;
  const pixels = WAYPOINTS.map((point) => ({ x: point.x / 2.5, y: point.y / 2.5 }));
  const send = (type: string, x: number, y: number, buttons: number) => {
    const event = new Event(type, { bubbles: true }) as PointerEvent;
    Object.assign(event, { clientX: x, clientY: y, pointerId: 1, buttons });
    surface.dispatchEvent(event);
  };
  send("pointerdown", pixels[0]!.x, pixels[0]!.y, 1);
  for (let leg = 1; leg < pixels.length; leg += 1) {
    const from = pixels[leg - 1]!;
    const to = pixels[leg]!;
    for (let step = 1; step <= 20; step += 1) {
      // A frame per move, so the stroke spans time the way a real one does.
      vi.advanceTimersByTime(16);
      send("pointermove", from.x + ((to.x - from.x) * step) / 20, from.y + ((to.y - from.y) * step) / 20, 1);
    }
  }
  send("pointerup", pixels.at(-1)!.x, pixels.at(-1)!.y, 0);
}

/** Holds one level on the capture while the fake clock runs the level poll. */
async function hold(level: number, durationMs: number) {
  capture.level = level;
  for (let elapsed = 0; elapsed < durationMs; elapsed += 100) {
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
  }
}

/** Says the word the way the level poll hears it: quiet, a word, then quiet. */
async function speak() {
  await hold(0.02, 400);
  await hold(0.4, 400);
  await hold(0.02, 800);
  await settle();
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
  capture.stopped = false;
  capture.level = 0.02;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("RoundRunner", () => {
  it("runs three rounds without a button and finalizes once", async () => {
    const { handler, calls } = fetchStub();
    vi.stubGlobal("fetch", handler);
    await startSession(calls);

    for (let round = 1; round <= 3; round += 1) {
      expect(container.textContent).toContain(WORDS[round - 1]);
      expect(container.textContent).toContain(`Round ${round} of 3`);
      expect(container.textContent).not.toContain("Next round");
      await act(async () => trace());
      await speak();
    }

    expect(container.textContent).toContain("Session complete");
    const paths = calls.map((call) => call.path);
    expect(paths.filter((path) => path.endsWith("/commit"))).toHaveLength(3);
    expect(paths.filter((path) => path.endsWith("/finalize"))).toHaveLength(1);
    expect(capture.stopped).toBe(true);
  });

  it("chains each commitment onto the previous one", async () => {
    const { handler, calls } = fetchStub();
    vi.stubGlobal("fetch", handler);
    await startSession(calls);

    for (let round = 1; round <= 3; round += 1) {
      await act(async () => trace());
      await speak();
    }

    const commits = calls.filter((call) => call.path.endsWith("/commit"));
    expect(commits).toHaveLength(3);
    expect(commits[1]?.body.previous_commitment).toBe(commits[0]?.body.commitment);
    expect(commits[2]?.body.previous_commitment).toBe(commits[1]?.body.commitment);
    for (const commit of commits) {
      expect(commit.body.idempotency_key).toMatch(/^[0-9a-f]{32}$/);
      expect(commit.body.path_point_count).toBe(32);
    }
  });

  it("sends the committed bytes only at the end", async () => {
    const { handler, calls } = fetchStub();
    vi.stubGlobal("fetch", handler);
    await startSession(calls);

    for (let round = 1; round <= 3; round += 1) {
      await act(async () => trace());
      await speak();
    }

    for (const commit of calls.filter((call) => call.path.endsWith("/commit"))) {
      expect(Object.keys(commit.body)).not.toContain("audio_base64");
      expect(Object.keys(commit.body)).not.toContain("coarse_path");
    }
    const finalize = calls.find((call) => call.path.endsWith("/finalize"));
    const segments = finalize?.body.segments as { audio_base64: string }[];
    expect(segments).toHaveLength(3);
    expect(segments.every((segment) => segment.audio_base64.length > 0)).toBe(true);
  });

  it("does not move on before the shape is traced", async () => {
    const { handler, calls } = fetchStub();
    vi.stubGlobal("fetch", handler);
    await startSession(calls);

    await speak();
    expect(calls.filter((call) => call.path.endsWith("/commit"))).toHaveLength(0);
    expect(container.textContent).toContain("Round 1 of 3");
  });

  it("offers to continue after a long wait, and still asks for a trace", async () => {
    const { handler, calls } = fetchStub();
    vi.stubGlobal("fetch", handler);
    await startSession(calls);

    await hold(0.02, 16_000);
    expect(container.textContent).toContain("If you already did");
    await act(async () => clickText("continue"));
    await settle();
    expect(container.textContent).toContain("Trace the shape before moving on");
    expect(calls.filter((call) => call.path.endsWith("/commit"))).toHaveLength(0);
  });

  it("ignores pointer movement with no button held", async () => {
    const { handler, calls } = fetchStub();
    vi.stubGlobal("fetch", handler);
    await startSession(calls);

    const surface = container.querySelector("svg");
    if (!surface) throw new Error("no trace surface");
    surface.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 400, height: 400 }) as DOMRect;
    for (const point of WAYPOINTS) {
      const move = new Event("pointermove", { bubbles: true }) as PointerEvent;
      Object.assign(move, { clientX: point.x / 2.5, clientY: point.y / 2.5, pointerId: 1, buttons: 0 });
      surface.dispatchEvent(move);
    }
    await speak();
    expect(container.querySelectorAll("polyline")[1]?.getAttribute("points")).toBe("");
    expect(calls.filter((call) => call.path.endsWith("/commit"))).toHaveLength(0);
  });

  it("stops the session when a reveal does not match its digest", async () => {
    const { handler, calls } = fetchStub();
    const tampering = vi.fn(async (path: string, init: RequestInit) => {
      const response = await handler(path, init);
      if (!path.endsWith("/session")) return response;
      const body = (await response.json()) as Record<string, unknown>;
      const reveal = body.reveal as Record<string, unknown>;
      return jsonResponse({ ...body, reveal: { ...reveal, word: "different" } });
    });
    vi.stubGlobal("fetch", tampering);
    await startSession(calls);
    await settle();

    expect(container.textContent).toContain("Session stopped");
    expect(calls.filter((call) => call.path.endsWith("/commit"))).toHaveLength(0);
  });

  it("runs the accessible route without a trace surface", async () => {
    const { handler, calls } = fetchStub();
    const speechOnly = vi.fn(async (path: string, init: RequestInit) => {
      const response = await handler(path, init);
      if (!path.endsWith("/session")) return response;
      const body = (await response.json()) as Record<string, unknown>;
      const reveal = body.reveal as Record<string, unknown>;
      const target = encodePathTarget("speech_only", []);
      const digest = await challengeDigest(
        Uint8Array.from(Buffer.from(SESSION_NONCE, "hex")),
        1,
        Uint8Array.from(Buffer.from(ROUND_NONCES[0]!, "hex")),
        WORDS[0]!,
        target,
      );
      return jsonResponse({
        ...body,
        tier: "speech_only",
        reveal: { ...reveal, path_target: "", challenge_digest: toHex(digest) },
      });
    });
    vi.stubGlobal("fetch", speechOnly);

    await act(async () => root.render(<RoundRunner />));
    const codeInput = container.querySelector<HTMLInputElement>("input:not([type='checkbox']):not([type='radio'])");
    const speechRadio = container.querySelector<HTMLInputElement>("input[value='speech_only']");
    const checkbox = container.querySelector<HTMLInputElement>("input[type='checkbox']");
    await act(async () => {
      setInputValue(codeInput!, "ABCD2345EFGH6789JKLM");
      speechRadio!.click();
      checkbox!.click();
    });
    await act(async () => clickText("Start"));
    await settle();

    expect(container.querySelector("svg")).toBeNull();
    await speak();
    const commit = calls.find((call) => call.path.endsWith("/commit"));
    expect(commit?.body.path_point_count).toBe(0);
    expect(commit?.body.path_digest).toBe(
      toHex(
        await import("../src/lib/paired-round/transcript").then(({ pathDigest }) =>
          pathDigest(
            Uint8Array.from(Buffer.from(SESSION_NONCE, "hex")),
            1,
            Uint8Array.from(Buffer.from(String(commit?.body.challenge_digest), "hex")),
            encodeCoarsePath("speech_only", []),
          ),
        ),
      ),
    );
  });

  it("keeps the start control disabled until consent and a code are given", async () => {
    vi.stubGlobal("fetch", fetchStub().handler);
    await act(async () => root.render(<RoundRunner />));
    const start = [...container.querySelectorAll("button")].find((node) =>
      node.textContent?.includes("Start"),
    );
    expect(start?.disabled).toBe(true);

    const checkbox = container.querySelector<HTMLInputElement>("input[type='checkbox']");
    await act(async () => checkbox!.click());
    expect(
      [...container.querySelectorAll("button")].find((node) =>
        node.textContent?.includes("Start"),
      )?.disabled,
    ).toBe(true);
  });

  it("states what the prototype does not claim before anyone starts", async () => {
    vi.stubGlobal("fetch", fetchStub().handler);
    await act(async () => root.render(<RoundRunner />));
    expect(container.textContent).toContain("What this does not claim");
    expect(container.textContent).toContain("does not prove that a human is present");
    expect(container.textContent).toContain("no sensor provenance");
  });
});
