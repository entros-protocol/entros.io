// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  RETRYABLE_REASONS,
  isVerificationReason,
  reasonDisposition,
} from "@entros/pulse-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  categorizeFailure,
  surfaceOf,
  type ReasonSurface,
} from "../src/components/verify/categorize-failure";
import {
  FailedView,
  SoftFailedView,
  softHint,
} from "../src/components/verify/step-views";

/**
 * Every reason the installed SDK can report, read from its type declarations.
 * The surface table's type already fails the build on a missing or extra key.
 * This reads the union the build checked against, so a stale local copy cannot
 * pass either.
 */
function sdkReasons(): string[] {
  const entry = createRequire(import.meta.url).resolve("@entros/pulse-sdk");
  const declarations = readFileSync(join(dirname(entry), "index.d.ts"), "utf8");
  const union = /type VerificationReason = ([^;]+);/.exec(declarations)?.[1] ?? "";
  return [...union.matchAll(/"([a-z_]+)"/g)].map((match) => match[1]!);
}

/** Reasons that decide their own surface in every phase. */
const CODED_REASONS = sdkReasons().filter((reason) => surfaceOf(reason) !== "matched");

/** What each coded surface lets the user do, as the SDK classifies its reasons. */
const DISPOSITION_OF: Record<Exclude<ReasonSurface, "matched">, string> = {
  cooldown: "wait",
  "session-wait": "wait",
  "session-restart": "retry",
  "session-broken": "fatal",
  "automated-browser": "fatal",
};

/** The failure kind each coded surface renders as. */
const KIND_OF: Record<Exclude<ReasonSurface, "matched">, string> = {
  cooldown: "rate-limited",
  "session-wait": "session-wait",
  "session-restart": "session-restart",
  "session-broken": "session-broken",
  "automated-browser": "automated-browser",
};

const coded = (reason: string) => surfaceOf(reason) as Exclude<ReasonSurface, "matched">;

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

describe("paired failure copy", () => {
  it("routes every reason the SDK knows", () => {
    const known = sdkReasons();
    expect(known.length).toBeGreaterThan(30);
    for (const reason of known) expect(isVerificationReason(reason)).toBe(true);
    expect(known).not.toContain("audio_bounds_exceeded");
    // Unknown and absent reasons are left to the matchers.
    expect(surfaceOf("reason_from_a_newer_server")).toBe("matched");
    expect(surfaceOf("toString")).toBe("matched");
    expect(surfaceOf(undefined)).toBe("matched");
  });

  it("agrees with the SDK about what each coded reason allows", () => {
    expect(CODED_REASONS.length).toBeGreaterThan(20);
    for (const reason of CODED_REASONS) {
      expect(reasonDisposition(reason), reason).toBe(DISPOSITION_OF[coded(reason)]);
    }
    // Every cooldown the SDK names routes by code.
    for (const reason of sdkReasons()) {
      if (reasonDisposition(reason) === "wait") {
        expect(surfaceOf(reason), reason).not.toBe("matched");
      }
    }
  });

  it("gives every retryable reason its own hint", () => {
    const generic = softHint("no_such_reason");
    for (const reason of RETRYABLE_REASONS) {
      expect(softHint(reason), reason).not.toBe(generic);
    }
    for (const reason of CODED_REASONS) {
      if (reasonDisposition(reason) === "retry") {
        expect(softHint(reason), reason).toMatch(/Start a new verification/);
      }
    }
  });

  it("gives each new reason its copy", () => {
    expect(softHint("trace_incomplete")).toBe("Trace through every dot, in order from 1.");
    expect(softHint("session_busy")).toBe(
      "The verification service was busy. Start a new verification.",
    );
    expect(surfaceOf("session_active")).toBe("session-wait");
    expect(surfaceOf("invalid_request")).toBe("session-broken");
    expect(surfaceOf("trace_incomplete")).toBe("matched");
  });

  it("keeps the existing phrase copy", () => {
    expect(softHint("phrase_content_mismatch")).toBe(
      "Read the phrase clearly at a normal pace, exactly as shown.",
    );
  });

  it.each(CODED_REASONS)("routes %s by code in every phase", (reason) => {
    for (const failedAt of [
      undefined,
      "capture",
      "validation",
      "baseline",
      "proving",
      "signing",
      "submission",
      "confirmation",
    ] as const) {
      const routed = categorizeFailure("anything", true, reason, { failedAt });
      expect(routed.kind, String(failedAt)).toBe(KIND_OF[coded(reason)]);
    }
  });

  it.each(CODED_REASONS)("leaves %s with a way forward", async (reason) => {
    const onReset = vi.fn();
    await act(async () => {
      root.render(
        <FailedView
          error="This verification could not continue. Start a new verification."
          reason={reason}
          retryAfterSec={reasonDisposition(reason) === "wait" ? 45 : undefined}
          failedAt="capture"
          onReset={onReset}
        />,
      );
    });

    const text = container.textContent ?? "";
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.length).toBeGreaterThan(0);
    expect(text).not.toContain("Verification failed");
    expect(text).not.toMatch(/—|;/);

    switch (coded(reason)) {
      case "session-restart":
        expect(text).toContain("Start a new verification");
        expect(buttons.map((button) => button.textContent)).toContain("Try again");
        break;
      case "cooldown":
      case "session-wait":
        expect(text).toContain("Try again in 45 seconds.");
        break;
      case "session-broken":
        expect(text).toContain(
          "This browser session could not continue. Reload the page and try again.",
        );
        expect(buttons.map((button) => button.textContent)).toContain("Reload page");
        break;
      case "automated-browser":
        expect(text).toContain("This browser reports that automation software controls it.");
        break;
    }
  });

  it("names the cooldown the server sent and never blames the wallet's budget", async () => {
    await act(async () => {
      root.render(
        <FailedView
          error="busy"
          reason="capacity_reached"
          retryAfterSec={120}
          failedAt="capture"
          onReset={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain("Verification is busy");
    expect(container.textContent).toContain("Try again in 2 minutes.");
    expect(container.textContent).not.toContain("retry limit");
  });

  it("offers a retry for a session that ended at finalize", async () => {
    await act(async () => {
      root.render(
        <SoftFailedView
          reason="session_consumed"
          attemptsRemaining={2}
          onTryAgain={vi.fn()}
          onCancel={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain(
      "The service already checked this session. Start a new verification.",
    );
    expect(container.textContent).toContain("2 attempts left");
  });

  it("keeps an unknown reason off the dead-end path", async () => {
    await act(async () => {
      root.render(
        <FailedView
          error="This verification could not continue. Start a new verification."
          reason="reason_from_a_newer_server"
          failedAt="capture"
          onReset={vi.fn()}
        />,
      );
    });

    expect(container.textContent).toContain("Start a new verification");
    expect(container.querySelector("button")?.textContent).toBe("Try again");
  });
});
