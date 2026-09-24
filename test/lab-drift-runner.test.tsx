// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DriftRunner } from "../src/components/lab/drift-runner";

let container: HTMLDivElement;
let root: Root;

const sdk = vi.hoisted(() => ({
  /** Element the SDK was handed for touch capture. Null until `startTouch` runs. */
  touchTarget: null as HTMLElement | null | undefined,
  markedCaptureStart: false,
  /** The level callback the harness handed the SDK, so a test can play a voice into it. */
  onLevel: null as ((rms: number) => void) | null,
}));

vi.mock("@solana/web3.js", () => ({
  Connection: class {},
  clusterApiUrl: () => "https://example.invalid",
}));

vi.mock("@entros/pulse-sdk", () => ({
  CANONICAL_SAMPLE_RATE: 16_000,
  MAX_TRANSMITTED_CAPTURE_MS: 20_000,
  PulseSDK: class {
    createSession() {
      return {
        startMotion: async () => undefined,
        skipMotion: () => undefined,
        startAudio: async (onLevel?: (rms: number) => void) => {
          sdk.onLevel = onLevel ?? null;
          onLevel?.(0.3);
        },
        startTouch: async (options: { eventTarget?: HTMLElement }) => {
          sdk.touchTarget = options.eventTarget;
        },
        skipTouch: () => undefined,
        markCaptureStart: () => {
          sdk.markedCaptureStart = true;
        },
        stopAudio: async () => ({
          samples: new Float32Array(16_000),
          sampleRate: 16_000,
          duration: 1,
        }),
        stopMotion: async () => [],
        stopTouch: async () => [],
      };
    }
  },
  fetchProjectionPolicy: async () => ({ current: 1, minimum: 0 }),
  extractFeatures: async () => ({
    raw: new Array(308).fill(0.5),
    normalized: new Array(308).fill(0.5),
    f0Contour: [],
    accelMagnitude: [],
  }),
  generatePhrase: (count: number) => new Array(count).fill("word").join(" "),
  generateLissajousPoints: () => [{ x: 0, y: 0 }],
  randomLissajousParams: () => ({}),
  simhash: () => new Array(256).fill(0),
  hammingDistance: () => 0,
}));

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  sdk.touchTarget = null;
  sdk.markedCaptureStart = false;
  sdk.onLevel = null;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  // jsdom has no rAF pacing. Run the callback on the microtask queue so the awaited paint in
  // the component resolves after React commits.
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    queueMicrotask(() => callback(0));
    return 0;
  });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

/** Points in the drawn stroke, which is the second polyline on the surface. */
function drawnPoints(surface: Element): number {
  const stroke = surface.querySelectorAll("polyline")[1];
  return (stroke?.getAttribute("points") ?? "").split(" ").filter(Boolean).length;
}

function pointer(target: Element, type: string, x: number, y: number, buttons: number) {
  target.dispatchEvent(
    new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, buttons }),
  );
}

/** Resolves the chain of awaits between the end of a capture and its extracted result. */
async function flush() {
  await act(async () => {
    for (let tick = 0; tick < 20; tick += 1) await Promise.resolve();
  });
}

/** Records both current-style captures, so the paired capture is next. */
async function recordCurrentCaptures() {
  for (let capture = 0; capture < 2; capture += 1) {
    await act(async () => {
      startFirstCapture();
    });
    await act(async () => {
      vi.advanceTimersByTime(12_100);
    });
    await flush();
  }
}

/** Plays level readings at the SDK buffer cadence while the fake clock advances. */
async function play(level: number, durationMs: number) {
  for (let elapsed = 0; elapsed < durationMs; elapsed += 85) {
    await act(async () => {
      vi.advanceTimersByTime(85);
      sdk.onLevel?.(level);
    });
  }
}

function surfaceForTracing(): HTMLElement {
  const surface = container.querySelector('[aria-label="Trace surface"]');
  if (!(surface instanceof HTMLElement)) throw new Error("No trace surface rendered");
  // One pixel per grid unit, so client coordinates are path coordinates.
  surface.getBoundingClientRect = () => new DOMRect(0, 0, 1000, 1000);
  return surface;
}

function traceTarget(surface: HTMLElement) {
  const target = surface.querySelectorAll("polyline")[0]?.getAttribute("points") ?? "";
  const points = target
    .split(" ")
    .filter(Boolean)
    .map((pair) => pair.split(",").map(Number) as [number, number]);
  const [first, ...rest] = points;
  if (!first) throw new Error("No path to trace");
  pointer(surface, "pointerdown", first[0], first[1], 1);
  for (const [x, y] of rest) pointer(surface, "pointermove", x, y, 1);
  pointer(surface, "pointerup", rest.at(-1)?.[0] ?? first[0], rest.at(-1)?.[1] ?? first[1], 0);
}

function startFirstCapture() {
  const button = [...container.querySelectorAll("button")].find((element) =>
    element.textContent?.includes("Start"),
  );
  if (!button) throw new Error("No start control rendered");
  button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

describe("DriftRunner", () => {
  /**
   * The surface used to render only once capture began, so the SDK was asked for it one frame
   * too early and every run died before the microphone opened.
   */
  it("hands the SDK a mounted trace surface", async () => {
    await act(async () => {
      root.render(<DriftRunner />);
    });

    await act(async () => {
      startFirstCapture();
    });

    expect(container.textContent).not.toContain("The trace surface is not mounted");
    expect(sdk.touchTarget).toBeInstanceOf(HTMLElement);
    expect(sdk.touchTarget?.getAttribute("aria-label")).toBe("Trace surface");
    expect(sdk.markedCaptureStart).toBe(true);
  });

  it("shows the surface while the microphone is still opening", async () => {
    await act(async () => {
      root.render(<DriftRunner />);
    });

    await act(async () => {
      startFirstCapture();
    });

    expect(container.querySelector('[aria-label="Trace surface"]')).not.toBeNull();
  });

  /**
   * A capture that ends under a held button unmounts the surface before the release arrives.
   * A press flag then stayed set, and every later capture drew the pointer's path on hover.
   */
  it("draws only while a button is held, even when the release never reaches the surface", async () => {
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: () => undefined,
    });
    try {
      await act(async () => {
        root.render(<DriftRunner />);
      });
      await act(async () => {
        startFirstCapture();
      });

      const surface = container.querySelector('[aria-label="Trace surface"]');
      if (!(surface instanceof HTMLElement)) throw new Error("No trace surface rendered");
      surface.getBoundingClientRect = () => new DOMRect(0, 0, 100, 100);

      pointer(surface, "pointerdown", 10, 10, 1);
      pointer(surface, "pointermove", 20, 20, 1);
      expect(drawnPoints(surface)).toBe(2);

      pointer(surface, "pointermove", 30, 30, 0);
      pointer(surface, "pointermove", 40, 40, 0);
      expect(drawnPoints(surface)).toBe(2);
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "setPointerCapture");
    }
  });

  describe("paired rounds", () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
      Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
        configurable: true,
        value: () => undefined,
      });
    });

    afterEach(() => {
      vi.useRealTimers();
      Reflect.deleteProperty(HTMLElement.prototype, "setPointerCapture");
    });

    it("move on by themselves once the path is traced and the word is spoken", async () => {
      await act(async () => {
        root.render(<DriftRunner />);
      });
      await recordCurrentCaptures();
      await act(async () => {
        startFirstCapture();
      });
      expect(container.querySelector("button")?.textContent ?? "").not.toMatch(/Next round/);

      for (let round = 1; round <= 3; round += 1) {
        expect(container.textContent).toContain(`Round ${round} of 3`);
        await play(0.003, 400);
        await act(async () => traceTarget(surfaceForTracing()));
        await play(0.08, 400);
        expect(container.textContent).toContain(`Round ${round} of 3`);
        await play(0.003, 700);
        await flush();
      }

      expect(container.textContent).toContain("Result");
      expect(container.textContent).not.toContain("Round 3 of 3");
    });

    it("offers to continue when no speech is heard after the trace", async () => {
      await act(async () => {
        root.render(<DriftRunner />);
      });
      await recordCurrentCaptures();
      await act(async () => {
        startFirstCapture();
      });

      await play(0.003, 400);
      await act(async () => traceTarget(surfaceForTracing()));
      await play(0.003, 3_000);
      expect(container.textContent).not.toContain("If you already did");
      await play(0.003, 1_200);
      expect(container.textContent).toContain("If you already did");

      const proceed = [...container.querySelectorAll("button")].find(
        (button) => button.textContent === "continue",
      );
      await act(async () => proceed?.click());
      expect(container.textContent).toContain("Round 2 of 3");
      expect(container.textContent).not.toContain("If you already did");
    });
  });

  it("lists the three captures before any of them run", async () => {
    await act(async () => {
      root.render(<DriftRunner />);
    });

    const items = [...container.querySelectorAll("li")].map((item) => item.textContent ?? "");
    expect(items).toHaveLength(3);
    expect(items.every((text) => text.includes("not recorded"))).toBe(true);
  });
});
