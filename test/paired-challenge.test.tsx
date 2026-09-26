// @vitest-environment jsdom

import { act, createRef } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { PairedPhase, PairedRoundView } from "@entros/pulse-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PairedChallenge } from "../src/components/verify/paired-challenge";

const ROUND_ONE: PairedRoundView = {
  roundIndex: 1,
  rounds: 3,
  word: "garden",
  waypoints: [
    { x: 200, y: 800 },
    { x: 200, y: 200 },
    { x: 800, y: 800 },
    { x: 800, y: 200 },
  ],
};

const ROUND_TWO: PairedRoundView = {
  roundIndex: 2,
  rounds: 3,
  word: "harbor",
  waypoints: [
    { x: 150, y: 150 },
    { x: 500, y: 850 },
    { x: 850, y: 150 },
  ],
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

interface RenderOptions {
  round?: PairedRoundView | null;
  phase?: PairedPhase;
  stalled?: boolean;
  onContinue?: () => boolean;
}

const surfaceRef = createRef<HTMLDivElement>();

async function render({
  round = ROUND_ONE,
  phase = "round",
  stalled = false,
  onContinue = () => true,
}: RenderOptions = {}) {
  await act(async () => {
    root.render(
      <PairedChallenge
        surfaceRef={surfaceRef}
        round={round}
        phase={phase}
        stalled={stalled}
        level={0.02}
        onContinue={onContinue}
      />,
    );
  });
}

/** The element the SDK records from. jsdom lays nothing out, so give it a 300 px box. */
function surface(): HTMLDivElement {
  const element = container.querySelector<HTMLDivElement>(
    '[data-testid="paired-trace-surface"]',
  );
  if (!element) throw new Error("surface not mounted");
  element.getBoundingClientRect = () =>
    ({ left: 0, top: 0, width: 300, height: 300, right: 300, bottom: 300 }) as DOMRect;
  return element;
}

/** jsdom has no PointerEvent. React reads the type and the fields a MouseEvent carries. */
async function pointer(
  type: "pointerdown" | "pointermove" | "pointerup",
  x: number,
  y: number,
  buttons: number,
) {
  await act(async () => {
    surface().dispatchEvent(
      new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, buttons }),
    );
  });
}

function stroke(): string {
  return (
    container.querySelector('[data-testid="paired-stroke"]')?.getAttribute("d") ?? ""
  );
}

describe("PairedChallenge", () => {
  it("keeps the challenge hidden until the round is revealed", async () => {
    await render({ round: null, phase: "opening" });

    expect(surfaceRef.current).toBe(surface());
    expect(surfaceRef.current?.isConnected).toBe(true);
    expect(surface().getAttribute("aria-hidden")).toBe("true");
    expect(surface().querySelector("svg")).toBeNull();
    expect(container.textContent).toContain("Preparing round 1");
    expect(container.textContent).not.toContain("garden");
    expect(container.textContent).not.toContain("Round 1 of 3");

    await render();

    expect(surface().getAttribute("aria-hidden")).toBe("false");
    expect(surface().hasAttribute("role")).toBe(false);
    expect(container.textContent).toContain("Round 1 of 3");
    expect(container.textContent).toContain("garden");
    expect(container.textContent).toContain("Trace from 1 to 4");
    const labels = [...surface().querySelectorAll("text")].map((node) => node.textContent);
    expect(labels).toEqual(["1", "2", "3", "4"]);
  });

  it("draws only pressed points, read from each event", async () => {
    await render();

    // Hover before any press draws nothing.
    await pointer("pointermove", 60, 240, 0);
    expect(stroke()).toBe("");

    await pointer("pointerdown", 60, 240, 1);
    await pointer("pointermove", 60, 150, 1);
    expect(stroke()).toBe("M200 800l0 0L200 500");

    // The release never arrives. The next move reports no button, so nothing
    // more is drawn, however long the pointer keeps moving.
    await pointer("pointermove", 150, 150, 0);
    await pointer("pointermove", 240, 60, 0);
    expect(stroke()).toBe("M200 800l0 0L200 500");

    // A later press starts a new subpath rather than joining the old one.
    await pointer("pointermove", 240, 240, 1);
    expect(stroke()).toBe("M200 800l0 0L200 500M800 800l0 0");
  });

  it("draws nothing while the round is committing", async () => {
    await render({ phase: "committing" });

    await pointer("pointerdown", 60, 240, 1);
    await pointer("pointermove", 60, 60, 1);

    expect(stroke()).toBe("");
    expect(container.textContent).toContain("Sending round 1");
  });

  const reached = () =>
    [...surface().querySelectorAll("g")].map((node) => node.getAttribute("data-reached"));

  it("marks a waypoint once the stroke reaches it", async () => {
    await render();

    expect(reached()).toEqual(["false", "false", "false", "false"]);

    await pointer("pointerdown", 62, 238, 1);
    await pointer("pointermove", 60, 60, 1);

    expect(reached()).toEqual(["true", "true", "false", "false"]);
  });

  it("marks the dots in the issued order only", async () => {
    await render();

    // Dot 3, then dot 2, before dot 1. Neither counts yet.
    await pointer("pointerdown", 240, 240, 1);
    await pointer("pointermove", 60, 60, 1);
    expect(reached()).toEqual(["false", "false", "false", "false"]);

    // Dot 1 opens the order, and dot 2 counts once it is passed again.
    await pointer("pointermove", 60, 240, 1);
    expect(reached()).toEqual(["true", "false", "false", "false"]);
    await pointer("pointermove", 60, 60, 1);
    expect(reached()).toEqual(["true", "true", "false", "false"]);
  });

  it("announces each round in one polite live region", async () => {
    await render({ round: null, phase: "opening" });

    const regions = () =>
      container.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
    expect(regions()).toHaveLength(1);
    const region = regions()[0]!;
    expect(region.getAttribute("aria-live")).toBe("polite");
    expect(region.className).toContain("sr-only");
    expect(region.textContent).toBe("");

    await render();
    expect(regions()).toHaveLength(1);
    expect(regions()[0]).toBe(region);
    expect(region.textContent).toBe(
      "Round 1 of 3. Say the word garden. Trace the 4 dots in order.",
    );

    await render({ round: ROUND_TWO });
    expect(region.textContent).toBe(
      "Round 2 of 3. Say the word harbor. Trace the 3 dots in order.",
    );
  });

  it("starts each round with a clean stroke", async () => {
    await render();
    await pointer("pointerdown", 60, 240, 1);
    await pointer("pointermove", 60, 60, 1);
    expect(stroke()).not.toBe("");

    await render({ round: ROUND_TWO });

    expect(container.textContent).toContain("Round 2 of 3");
    expect(container.textContent).toContain("harbor");
    expect(stroke()).toBe("");
    expect(
      [...surface().querySelectorAll("g")].every(
        (node) => node.getAttribute("data-reached") === "false",
      ),
    ).toBe(true);
  });

  it("offers no Next button and no clock", async () => {
    await render();

    expect(container.querySelectorAll("button")).toHaveLength(0);
    expect(container.textContent).not.toMatch(/next|\d+\s*s\b|seconds?|hurry|quick/i);
  });

  it("offers Continue after a stall and explains a refusal", async () => {
    const onContinue = vi.fn(() => false);
    await render({ stalled: true, onContinue });

    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.map((button) => button.textContent)).toEqual(["Continue"]);
    expect(container.textContent).not.toContain("then continue");

    await act(async () => buttons[0]!.click());

    expect(onContinue).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("Trace the dots in order, then continue.");
  });

  it("drops the hint once Continue ends the round", async () => {
    const onContinue = vi.fn(() => true);
    await render({ stalled: true, onContinue });

    await act(async () => container.querySelector("button")!.click());

    expect(onContinue).toHaveBeenCalledOnce();
    expect(container.textContent).not.toContain("then continue");
  });
});
