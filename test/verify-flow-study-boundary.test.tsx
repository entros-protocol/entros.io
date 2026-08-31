// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { StudyRecordStatus } from "@entros/pulse-sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { studyEnrolmentStorageKey } from "../src/lib/population-study";

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
let enrolmentRequestCount: number;
let laterEnrolmentFailure:
  | { code: string; status: number }
  | null;
let holdFirstEnrolment: boolean;
let releaseFirstEnrolment: ((response: Response) => void) | null;

async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function click(selector: string): Promise<void> {
  const element = container.querySelector<HTMLButtonElement>(selector);
  expect(element).not.toBeNull();
  await act(async () => element?.click());
  await settle();
}

async function joinAndRecordTrial(): Promise<void> {
  await act(async () => root.render(<VerifyFlow />));
  await settle();
  await click('[data-action="accept-study"]');
  await click('[data-action="prepare-study"]');
  await click('[data-action="record-study"]');
}

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  walletHarness.address = "wallet-one";
  walletHarness.connected = true;
  enrolmentRequestCount = 0;
  laterEnrolmentFailure = null;
  holdFirstEnrolment = false;
  releaseFirstEnrolment = null;
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
      if (url.endsWith("/api/study/enrol")) {
        enrolmentRequestCount += 1;
        if (enrolmentRequestCount === 1 && holdFirstEnrolment) {
          return new Promise<Response>((resolve) => {
            releaseFirstEnrolment = resolve;
          });
        }
        if (enrolmentRequestCount > 1 && laterEnrolmentFailure) {
          return new Response(
            JSON.stringify({ error: laterEnrolmentFailure.code }),
            {
              status: laterEnrolmentFailure.status,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        return new Response(
          JSON.stringify({
            token: "A".repeat(43),
            session_id: "01".repeat(16),
            trial_index: 1,
            trial_limit: 5,
            expires_in: 3_600,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
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

describe("VerifyFlow study wallet boundary", () => {
  it("removes a completed trial continuation when the wallet changes", async () => {
    await joinAndRecordTrial();

    const activeFlow = container.querySelector<HTMLElement>(
      '[data-testid="verify-wallet-flow"]',
    );
    expect(activeFlow?.dataset.sessionActive).toBe("true");
    expect(activeFlow?.dataset.nextTrial).toBe("true");

    walletHarness.address = "wallet-two";
    await act(async () => root.render(<VerifyFlow />));
    await settle();

    const resetFlow = container.querySelector<HTMLElement>(
      '[data-testid="verify-wallet-flow"]',
    );
    expect(resetFlow?.dataset.sessionActive).toBe("false");
    expect(resetFlow?.dataset.nextTrial).toBe("false");
  });

  it("cancels a pending first enrolment when the wallet changes", async () => {
    holdFirstEnrolment = true;
    await act(async () => root.render(<VerifyFlow />));
    await settle();
    await click('[data-action="accept-study"]');
    await click('[data-action="prepare-study"]');

    const storageKey = studyEnrolmentStorageKey(
      studyDefinition,
      walletHarness.address,
    );
    expect(window.sessionStorage.getItem(storageKey)).toMatch(/^[0-9a-f]{32}$/);

    walletHarness.address = "wallet-two";
    await act(async () => root.render(<VerifyFlow />));
    await settle();

    expect(window.sessionStorage.getItem(storageKey)).toBeNull();
    const resetFlow = container.querySelector<HTMLElement>(
      '[data-testid="verify-wallet-flow"]',
    );
    expect(resetFlow?.dataset.sessionActive).toBe("false");

    await act(async () => {
      releaseFirstEnrolment?.(
        new Response(
          JSON.stringify({
            token: "A".repeat(43),
            session_id: "01".repeat(16),
            trial_index: 1,
            trial_limit: 5,
            expires_in: 3_600,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
      );
      await Promise.resolve();
    });
  });

  it.each([
    ["study_enrolment_conflict", 409, "true"],
    ["study_enrolment_expired", 410, "true"],
    ["study_trial_limit_reached", 409, "false"],
  ])(
    "clears a pending identifier after %s",
    async (code, status, retryAvailable) => {
      await joinAndRecordTrial();
      laterEnrolmentFailure = { code, status };
      await click('[data-action="next-study"]');

      expect(
        window.sessionStorage.getItem(
          studyEnrolmentStorageKey(studyDefinition, walletHarness.address),
        ),
      ).toBeNull();
      const flow = container.querySelector<HTMLElement>(
        '[data-testid="verify-wallet-flow"]',
      );
      expect(flow?.dataset.nextTrial).toBe(retryAvailable);
    },
  );
});
