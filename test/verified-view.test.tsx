import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { primaryVerificationActionClass } from "../src/components/verify/verification-styles";

const STEP_VIEWS = resolve(
  __dirname,
  "../src/components/verify/step-views.tsx",
);
const WALLET_CONNECTED = resolve(
  __dirname,
  "../src/components/sections/verify-wallet-connected.tsx",
);

describe("VerifiedView", () => {
  it("shares one theme-aware primary action contract", () => {
    expect(primaryVerificationActionClass).toContain("bg-foreground");
    expect(primaryVerificationActionClass).toContain("text-background");
    expect(primaryVerificationActionClass).toContain("active:scale-[0.96]");
    expect(primaryVerificationActionClass).toContain(
      "focus-visible:ring-[var(--verification-focus-ring)]",
    );
    expect(primaryVerificationActionClass).toContain(
      "motion-reduce:transition-none",
    );

    const stepViews = readFileSync(STEP_VIEWS, "utf8");
    const walletConnected = readFileSync(WALLET_CONNECTED, "utf8");
    expect(stepViews).toContain("className={primaryVerificationActionClass}");
    expect(walletConnected).toContain(
      "className={primaryVerificationActionClass}",
    );
  });

  it("draws results as square controls and plain toned text, without cards", () => {
    const stepViews = readFileSync(STEP_VIEWS, "utf8");
    const walletConnected = readFileSync(WALLET_CONNECTED, "utf8");
    for (const source of [stepViews, walletConnected]) {
      expect(source).not.toContain("verification-surface");
      expect(source).not.toMatch(/rounded-full (border border-|bg-foreground px-)/);
    }
    expect(walletConnected).toContain('<ToneText tone="accent">');
    expect(walletConnected).toContain('<ToneText tone="danger" alert>');
  });
});
