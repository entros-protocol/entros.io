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
    invitation: "study-invitation",
    definition: {
      study_id: "population-study",
      consent_version: "2026-08-10",
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
  it("replaces an active study atomically when a new invitation arrives", () => {
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
      { type: "LOAD_INVITATION", invitation: "replacement" },
    );

    expect(pending).toEqual({
      ...initialStudyFlowState,
      invitation: "replacement",
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
        invitation: firstGrant.invitation,
        definition: firstGrant.definition,
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
