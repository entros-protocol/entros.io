// @vitest-environment jsdom

// Web study intake closed on 2026-10-06 (owner decision): /verify runs paired
// rounds only, so the consent card and every study control must stay
// unrendered even when a study definition loads. The earlier wallet-boundary
// cases (continuation removal, pending-enrolment cancellation, conflict /
// expiry / trial-limit cleanup) exercised study state that only the consent
// card could create; they return with it if intake ever reopens. The study
// machinery itself stays in the component, inert behind STUDY_INTAKE_OPEN.

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { StudyRecordStatus } from "@entros/pulse-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const walletHarness = vi.hoisted(() => ({
  address: "wallet-one",
  connected: true,
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    connected: walletHarness.connected,
    publicKey:
      walletHarness.connected && walletHarness.address
        ? { toBase58: () => walletHarness.address }
        : null,
    signMessage: async () => new Uint8Array(64),
  }),
}));

vi.mock("@/components/verify/study-consent", () => ({
  StudyConsent: ({ onAccept }: { onAccept: () => void }) => (
    <button data-action="accept-study" onClick={onAccept}>
      Accept study
    </button>
  ),
}));

vi.mock("../src/components/sections/verify-wallet-connected", () => ({
  VerifyWalletConnected: ({
    studyGrant,
    studySessionActive,
    studyPreparationRequired,
    studyNextTrialAvailable,
    onStudyPrepare,
    onStudyRecordStatus,
    onStudyNextTrial,
  }: {
    studyGrant: unknown | null;
    studySessionActive: boolean;
    studyPreparationRequired: boolean;
    studyNextTrialAvailable: boolean;
    onStudyPrepare: () => void;
    onStudyRecordStatus: (status: StudyRecordStatus | undefined) => void;
    onStudyNextTrial: () => void;
  }) => (
    <div
      data-testid="verify-wallet-flow"
      data-session-active={String(studySessionActive)}
      data-next-trial={String(studyNextTrialAvailable)}
    >
      {studyPreparationRequired && (
        <button data-action="prepare-study" onClick={onStudyPrepare}>
          Prepare study
        </button>
      )}
      {studyGrant && (
        <button
          data-action="record-study"
          onClick={() => onStudyRecordStatus("recorded")}
        >
          Record study
        </button>
      )}
      {studyNextTrialAvailable && (
        <button data-action="next-study" onClick={onStudyNextTrial}>
          Next study
        </button>
      )}
    </div>
  ),
}));

import { VerifyFlow } from "../src/components/sections/verify-flow";

const studyDefinition = {
  study_id: "population-study",
  consent_version: "2026-08-13",
  consent_hash_hex: "ab".repeat(32),
  retention_days: 30,
  trial_limit: 5,
  visit_gap_secs: 14_400,
  feature_schema_version: 4,
  projection_version: 1,
  seed_generation_id: "seed-generation",
  projection_config_id: "projection-config",
  collects_full_vector: true,
};

let container: HTMLDivElement;
let root: Root;

async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  walletHarness.address = "wallet-one";
  walletHarness.connected = true;
  window.sessionStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  vi.stubGlobal(
    "fetch",
    vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url.endsWith("/api/study/definition")) {
        return new Response(JSON.stringify(studyDefinition), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(null, { status: 404 });
    }),
  );
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("VerifyFlow with study intake closed", () => {
  it("never renders the consent card when a study definition loads", async () => {
    await act(async () => root.render(<VerifyFlow />));
    await settle();

    expect(container.querySelector('[data-action="accept-study"]')).toBeNull();
    expect(
      container.querySelector('[data-testid="verify-wallet-flow"]'),
    ).not.toBeNull();
  });

  it("hands the verification flow neutral study props", async () => {
    await act(async () => root.render(<VerifyFlow />));
    await settle();

    const flow = container.querySelector<HTMLElement>(
      '[data-testid="verify-wallet-flow"]',
    );
    expect(flow?.dataset.sessionActive).toBe("false");
    expect(flow?.dataset.nextTrial).toBe("false");
    expect(container.querySelector('[data-action="prepare-study"]')).toBeNull();
    expect(container.querySelector('[data-action="record-study"]')).toBeNull();
    expect(container.querySelector('[data-action="next-study"]')).toBeNull();
  });

  it("keeps the study surface closed when the wallet changes", async () => {
    await act(async () => root.render(<VerifyFlow />));
    await settle();

    walletHarness.address = "wallet-two";
    await act(async () => root.render(<VerifyFlow />));
    await settle();

    expect(container.querySelector('[data-action="accept-study"]')).toBeNull();
    const flow = container.querySelector<HTMLElement>(
      '[data-testid="verify-wallet-flow"]',
    );
    expect(flow?.dataset.sessionActive).toBe("false");
    expect(flow?.dataset.nextTrial).toBe("false");
  });
});
