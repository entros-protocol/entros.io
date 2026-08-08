import { describe, expect, it } from "vitest";
import { createStudyContext } from "@entros/pulse-sdk";
import {
  parseStudyDefinition,
  parseStudyEnrolment,
} from "../src/lib/population-study";

const definition = {
  study_id: "devnet-population-20260808",
  consent_version: "2026-08-08",
  consent_hash_hex: "a".repeat(64),
  retention_days: 14,
  trial_limit: 3,
  feature_schema_version: 3,
  projection_version: 0,
  collects_full_vector: true,
};

const enrolment = {
  token: "A".repeat(43),
  session_id: "b".repeat(32),
  trial_index: 1,
  trial_limit: 3,
  expires_in: 3_600,
};

describe("population study response parsing", () => {
  it("uses a Pulse package that exports the study context contract", () => {
    expect(typeof createStudyContext).toBe("function");
  });

  it("accepts the bounded definition contract", () => {
    expect(parseStudyDefinition(definition)).toEqual(definition);
  });

  it("rejects malformed definitions", () => {
    expect(parseStudyDefinition({ ...definition, consent_hash_hex: "short" })).toBeNull();
    expect(parseStudyDefinition({ ...definition, trial_limit: 0 })).toBeNull();
    expect(parseStudyDefinition({ ...definition, retention_days: Number.NaN })).toBeNull();
  });

  it("accepts the bounded enrolment contract", () => {
    expect(parseStudyEnrolment(enrolment)).toEqual(enrolment);
  });

  it("rejects malformed enrolments", () => {
    expect(parseStudyEnrolment({ ...enrolment, token: "short" })).toBeNull();
    expect(parseStudyEnrolment({ ...enrolment, session_id: "z".repeat(32) })).toBeNull();
    expect(parseStudyEnrolment({ ...enrolment, trial_index: 4 })).toBeNull();
  });
});
