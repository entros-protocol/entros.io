// @vitest-environment jsdom

import { Profiler, act, createRef, type ProfilerOnRenderCallback } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PulseChallenge } from "../src/components/verify/pulse-challenge";
import { appendBoundedPoint } from "../src/lib/bounded-trace";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
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

describe("PulseChallenge", () => {
  it("keeps the issued curve hidden until capture starts", async () => {
    const touchRef = createRef<HTMLDivElement>();
    let openCaptureWindow: (() => void) | undefined;
    const onCaptureWindowOpen = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          openCaptureWindow = resolve;
        }),
    );

    await act(async () => {
      root.render(
        <PulseChallenge
          phrase="amber cedar drift maple orbit"
          touchRef={touchRef}
          onComplete={vi.fn()}
          onCaptureWindowOpen={onCaptureWindowOpen}
        />,
      );
    });

    expect(touchRef.current?.querySelector("svg")).toBeNull();
    expect(container.textContent).not.toContain("Trace the curve");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(onCaptureWindowOpen).toHaveBeenCalledOnce();
    expect(touchRef.current?.querySelector("svg")).toBeNull();

    await act(async () => {
      openCaptureWindow?.();
      await Promise.resolve();
    });

    expect(touchRef.current?.querySelector("svg")).not.toBeNull();
    expect(container.textContent).toContain("Trace the curve");
  });

  it("mounts one trace surface before touch capture starts", async () => {
    const touchRef = createRef<HTMLDivElement>();
    const onCaptureWindowOpen = vi.fn(async (surface: HTMLDivElement) => {
      expect(surface.isConnected).toBe(true);
      expect(surface).toBe(touchRef.current);
    });

    await act(async () => {
      root.render(
        <PulseChallenge
          phrase="amber cedar drift maple orbit"
          touchRef={touchRef}
          onComplete={vi.fn()}
          onCaptureWindowOpen={onCaptureWindowOpen}
        />,
      );
    });

    expect(touchRef.current?.isConnected).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(onCaptureWindowOpen).toHaveBeenCalledOnce();
  });

  it("bounds 1,500 pointer events without one render per event", async () => {
    let commits = 0;
    const onRender: ProfilerOnRenderCallback = () => {
      commits += 1;
    };
    const touchRef = createRef<HTMLDivElement>();

    await act(async () => {
      root.render(
        <Profiler id="challenge" onRender={onRender}>
          <PulseChallenge
            phrase="amber cedar drift maple orbit"
            touchRef={touchRef}
            onComplete={vi.fn()}
            onCaptureWindowOpen={vi.fn()}
          />
        </Profiler>,
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    await act(async () => Promise.resolve());

    const surface = touchRef.current!;
    const measureSurface = vi
      .spyOn(surface, "getBoundingClientRect")
      .mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
      });
    const commitsBefore = commits;

    await act(async () => {
      for (let index = 0; index < 1_500; index += 1) {
        surface.dispatchEvent(
          new MouseEvent(index === 0 ? "pointerdown" : "pointermove", {
            bubbles: true,
            clientX: index % 200,
            clientY: (index * 3) % 200,
          }),
        );
      }
      await vi.advanceTimersByTimeAsync(20);
    });

    expect(commits - commitsBefore).toBeLessThanOrEqual(2);
    expect(measureSurface).toHaveBeenCalledOnce();
    const displayedPath =
      surface.querySelectorAll("path")[1]?.getAttribute("d") ?? "";
    expect(displayedPath.length).toBeGreaterThan(0);
    expect(displayedPath.match(/[ML]/g)?.length).toBeLessThanOrEqual(2);
  });

  it("ignores display points outside the trace surface", async () => {
    const touchRef = createRef<HTMLDivElement>();
    await act(async () => {
      root.render(
        <PulseChallenge
          phrase="amber cedar drift maple orbit"
          touchRef={touchRef}
          onComplete={vi.fn()}
          onCaptureWindowOpen={vi.fn()}
        />,
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    await act(async () => Promise.resolve());
    const surface = touchRef.current!;
    vi.spyOn(surface, "getBoundingClientRect").mockReturnValue({
      left: 10,
      top: 20,
      right: 210,
      bottom: 220,
      width: 200,
      height: 200,
      x: 10,
      y: 20,
      toJSON: () => ({}),
    });

    await act(async () => {
      surface.dispatchEvent(
        new MouseEvent("pointermove", {
          bubbles: true,
          clientX: 250,
          clientY: 250,
        }),
      );
      await vi.advanceTimersByTimeAsync(20);
    });

    expect(surface.querySelectorAll("path")[1]?.getAttribute("d")).toBe("");
  });

  it("never rewrites a trail segment that was already displayed", async () => {
    const touchRef = createRef<HTMLDivElement>();
    await act(async () => {
      root.render(
        <PulseChallenge
          phrase="amber cedar drift maple orbit"
          touchRef={touchRef}
          onComplete={vi.fn()}
          onCaptureWindowOpen={vi.fn()}
        />,
      );
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    await act(async () => Promise.resolve());

    const surface = touchRef.current!;
    vi.spyOn(surface, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: 200,
      bottom: 200,
      width: 200,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    await act(async () => {
      for (let index = 0; index < 250; index += 1) {
        surface.dispatchEvent(
          new MouseEvent(index === 0 ? "pointerdown" : "pointermove", {
            bubbles: true,
            clientX: (index * 7) % 199,
            clientY: (index * 11) % 199,
          }),
        );
      }
      await vi.advanceTimersByTimeAsync(20);
    });

    const trace = surface.querySelectorAll("path")[1]!;
    const displayed = trace.getAttribute("d")!;
    expect(displayed.length).toBeGreaterThan(0);

    await act(async () => {
      for (let index = 250; index < 270; index += 1) {
        surface.dispatchEvent(
          new MouseEvent("pointermove", {
            bubbles: true,
            clientX: (index * 7) % 199,
            clientY: (index * 11) % 199,
          }),
        );
      }
      await vi.advanceTimersByTimeAsync(20);
    });

    const extendedPath = trace.getAttribute("d") ?? "";
    expect(extendedPath.startsWith(displayed)).toBe(true);
    expect(extendedPath.endsWith(`${(269 * 7) % 199} ${(269 * 11) % 199}`)).toBe(
      true,
    );
  });
});

describe("appendBoundedPoint", () => {
  it("keeps pressure input bounded and preserves the last endpoint", () => {
    const points: Array<{ x: number; y: number; t: number }> = [];
    for (let index = 0; index < 100_000; index += 1) {
      appendBoundedPoint(
        points,
        { x: index % 200, y: index % 200, t: index },
        512,
      );
    }
    expect(points.length).toBeLessThanOrEqual(512);
    expect(points.at(-1)?.t).toBe(99_999);
  });
});
