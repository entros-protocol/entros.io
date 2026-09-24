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
        startAudio: async (onLevel?: (rms: number) => void) => onLevel?.(0.3),
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

  it("lists the three captures before any of them run", async () => {
    await act(async () => {
      root.render(<DriftRunner />);
    });

    const items = [...container.querySelectorAll("li")].map((item) => item.textContent ?? "");
    expect(items).toHaveLength(3);
    expect(items.every((text) => text.includes("not recorded"))).toBe(true);
  });
});
