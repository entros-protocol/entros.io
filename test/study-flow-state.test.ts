import { describe, expect, it } from "vitest";
import type { ActiveStudyGrant } from "../src/lib/population-study";
import {
  initialStudyFlowState,
  studyFlowReducer,
} from "../src/components/verify/study-flow-state";

function grant(trialIndex = 1): ActiveStudyGrant {
  return {
    token: "study-token",
    session_id: "00112233445566778899aabbccddeeff",
    trial_index: trialIndex,
    trial_limit: 5,
    expires_in: 3_600,
    authorization: {
      wallet_address: "wallet-address",
      signature_hex: "ab".repeat(64),
      authorization_id: "cd".repeat(16),
      signed_at: 1_775_000_000,
    },
    definition: {
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
    },
  };
}

describe("study flow state", () => {
  it("keeps normal verification available when the study is unavailable or declined", () => {
    expect(
      studyFlowReducer(initialStudyFlowState, { type: "STUDY_UNAVAILABLE" }),
    ).toEqual({
      ...initialStudyFlowState,
      decision: "normal",
    });

    const offered = studyFlowReducer(initialStudyFlowState, {
      type: "DEFINITION_READY",
      definition: grant().definition,
    });
    expect(studyFlowReducer(offered, { type: "READY", grant: null })).toEqual({
      ...initialStudyFlowState,
      decision: "normal",
    });
  });

  it("records consent before requesting wallet authorization", () => {
    const offered = studyFlowReducer(initialStudyFlowState, {
      type: "DEFINITION_READY",
      definition: grant().definition,
    });

    expect(studyFlowReducer(offered, { type: "CONSENT_ACCEPTED" })).toEqual({
      ...initialStudyFlowState,
      definition: grant().definition,
      decision: "consented",
    });
  });

  it("keeps consented onboarding visible while preparing the first trial", () => {
    const consented = {
      ...initialStudyFlowState,
      definition: grant().definition,
      decision: "consented" as const,
    };
    const pending = studyFlowReducer(consented, { type: "PREPARE_PENDING" });
    const failed = studyFlowReducer(pending, {
      type: "PREPARE_FAILED",
      message: "Try again",
    });
    const ready = studyFlowReducer(failed, {
      type: "PREPARE_READY",
      grant: grant(),
    });

    expect(pending).toEqual({
      ...consented,
      tokenPending: true,
    });
    expect(failed).toEqual({
      ...consented,
      tokenError: "Try again",
    });
    expect(ready).toEqual({
      ...initialStudyFlowState,
      decision: "joined",
      grant: grant(),
    });
  });

  it("routes terminal enrolment failures to normal verification", () => {
    const consented = {
      ...initialStudyFlowState,
      definition: grant().definition,
      decision: "consented" as const,
    };

    expect(
      studyFlowReducer(consented, {
        type: "PREPARE_FAILED",
        message: "All trials are complete.",
        retryAllowed: false,
      }),
    ).toEqual({
      ...consented,
      tokenError: "All trials are complete.",
      tokenRetryAllowed: false,
    });
  });

  it("replaces active state when the public definition changes", () => {
    const joined = studyFlowReducer(initialStudyFlowState, {
      type: "READY",
      grant: grant(),
    });
    const pending = studyFlowReducer(
      {
        ...joined,
        tokenPending: true,
        tokenError: "old error",
      },
      { type: "DEFINITION_READY", definition: grant().definition },
    );

    expect(pending).toEqual({
      ...initialStudyFlowState,
      definition: grant().definition,
      decision: "pending",
    });
  });

  it("keeps the previous trial visible while preparing the next grant", () => {
    const firstGrant = grant();
    const joined = studyFlowReducer(initialStudyFlowState, {
      type: "READY",
      grant: firstGrant,
    });
    const recorded = studyFlowReducer(joined, {
      type: "RECORD_STATUS",
      progress: {
        status: "recorded",
        trialIndex: 1,
        trialLimit: 5,
        completionReason: null,
      },
      continuation: {
        definition: firstGrant.definition,
        authorization: firstGrant.authorization,
      },
    });
    const pending = studyFlowReducer(recorded, { type: "NEXT_PENDING" });
    const ready = studyFlowReducer(pending, {
      type: "NEXT_READY",
      grant: grant(2),
    });

    expect(pending.tokenPending).toBe(true);
    expect(ready.progress).toEqual(recorded.progress);
    expect(ready.grant?.trial_index).toBe(2);
    expect(ready.continuation).toBeNull();
    expect(ready.tokenPending).toBe(false);
  });

  it("ends the study without retaining stale request state", () => {
    const failed = studyFlowReducer(
      {
        ...initialStudyFlowState,
        decision: "joined",
        tokenPending: true,
      },
      { type: "NEXT_FAILED", message: "retry later" },
    );
    expect(failed.tokenError).toBe("retry later");

    expect(studyFlowReducer(failed, { type: "LEAVE" })).toEqual({
      ...initialStudyFlowState,
      decision: "normal",
    });
  });
});
