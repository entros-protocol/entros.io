import { afterEach, describe, expect, it, vi } from "vitest";
import { createStudyContext } from "@entros/pulse-sdk";
import {
  POPULATION_STUDY_CONSENT_TEXT,
  hasStudyConsentAcknowledgement,
  parseStudyDefinition,
  parseStudyEnrolment,
  rememberStudyConsentAcknowledgement,
  resolveStudyGrant,
  resolveStudyStatusUpdate,
  studyConsentStorageKey,
  studyConsentDocument,
  studyProgressMessage,
  createStudyEnrolmentId,
  clearPendingStudyEnrolmentId,
  consumeStudyInvitationFromFragment,
  pendingStudyEnrolmentId,
  studyEnrolmentStorageKey,
} from "../src/lib/population-study";

const definition = {
  study_id: "devnet-population-20260808",
  consent_version: "2026-08-10",
  consent_hash_hex: "a".repeat(64),
  retention_days: 14,
  trial_limit: 3,
  visit_gap_secs: 14_400,
  feature_schema_version: 3,
  projection_version: 0,
  seed_generation_id: "seed-generation-test",
  projection_config_id: "projection-config-test",
  collects_full_vector: true,
};

const enrolment = {
  token: "A".repeat(43),
  session_id: "b".repeat(32),
  trial_index: 1,
  trial_limit: 3,
  expires_in: 3_600,
};

const activeGrant = {
  ...enrolment,
  invitation: "study-invitation-value",
  definition,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

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
    expect(
      parseStudyDefinition({
        ...definition,
        projection_version: 1,
        feature_schema_version: 3,
      }),
    ).toBeNull();
    expect(parseStudyDefinition({ ...definition, projection_version: 2 })).toBeNull();
  });

  it("accepts the version 1 feature schema", () => {
    expect(
      parseStudyDefinition({
        ...definition,
        projection_version: 1,
        feature_schema_version: 4,
      }),
    ).not.toBeNull();
  });

  it("accepts the bounded enrolment contract", () => {
    expect(parseStudyEnrolment(enrolment)).toEqual(enrolment);
  });

  it("rejects malformed enrolments", () => {
    expect(parseStudyEnrolment({ ...enrolment, token: "short" })).toBeNull();
    expect(parseStudyEnrolment({ ...enrolment, session_id: "z".repeat(32) })).toBeNull();
    expect(parseStudyEnrolment({ ...enrolment, trial_index: 4 })).toBeNull();
  });

  it("retains the active grant when the server returns no storage status", () => {
    expect(resolveStudyStatusUpdate(undefined)).toEqual({ confirmed: false });
  });

  it("advances the study only after an explicit storage status", () => {
    expect(resolveStudyStatusUpdate("recorded")).toEqual({
      confirmed: true,
      status: "recorded",
    });
  });

  it("names the encrypted 308-value collection directly", () => {
    expect(POPULATION_STUDY_CONSENT_TEXT.join(" ")).toContain(
      "encrypted 308-value statistical feature summary",
    );
  });

  it("binds retention and trial limits into the consent document", () => {
    const original = studyConsentDocument(definition);
    expect(original).toContain("14 days");
    expect(original).toContain("up to 3 trials");
    expect(studyConsentDocument({ ...definition, retention_days: 365 })).not.toBe(original);
    expect(studyConsentDocument({ ...definition, trial_limit: 4 })).not.toBe(original);
  });

  it("retains an active grant when storage is unconfirmed", () => {
    expect(resolveStudyGrant(activeGrant, undefined)).toEqual({
      state: "unconfirmed",
      grant: activeGrant,
    });
  });

  it("waits for the participant before issuing a later trial", () => {
    expect(resolveStudyGrant(activeGrant, "recorded")).toEqual({
      state: "awaiting_participant",
      status: "recorded",
      invitation: activeGrant.invitation,
      definition,
      completed_trial_index: 1,
    });
  });

  it("completes final and disabled study grants", () => {
    expect(
      resolveStudyGrant({ ...activeGrant, trial_index: 3 }, "recorded"),
    ).toEqual({ state: "complete", status: "recorded", reason: "exhausted" });
    expect(resolveStudyGrant(activeGrant, "disabled")).toEqual({
      state: "complete",
      status: "disabled",
      reason: "disabled",
    });
    expect(
      resolveStudyGrant(
        { ...activeGrant, definition: { ...definition, preview_only: true } },
        "disabled",
      ),
    ).toEqual({ state: "complete", status: "disabled", reason: "preview" });
  });

  it("uses exact progress copy for recorded and unsaved trials", () => {
    expect(studyProgressMessage("recorded", 1, 3, null)).toContain(
      "Research trial 1 of 3 recorded",
    );
    expect(studyProgressMessage("technical_failure", 1, 3, null)).toContain(
      "no study record was saved",
    );
    expect(studyProgressMessage("recorded", 3, 3, "exhausted")).toContain(
      "no study trials left",
    );
    expect(studyProgressMessage("disabled", 1, 3, "disabled")).toContain(
      "no longer accepting records",
    );
    expect(studyProgressMessage("disabled", 1, 3, "preview")).toBe(
      "Research preview finished. No study record was saved.",
    );
  });

  it("creates a fresh bounded enrolment identifier", () => {
    const first = createStudyEnrolmentId();
    const second = createStudyEnrolmentId();
    expect(first).toMatch(/^[0-9a-f]{32}$/);
    expect(second).toMatch(/^[0-9a-f]{32}$/);
    expect(second).not.toBe(first);
  });

  it("reuses a pending enrolment identifier until the request succeeds", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const first = pendingStudyEnrolmentId(definition, storage);
    const retry = pendingStudyEnrolmentId(definition, storage);
    expect(retry).toBe(first);
    expect(values.get(studyEnrolmentStorageKey(definition))).toBe(first);

    expect(clearPendingStudyEnrolmentId(definition, storage)).toBe(true);
    const nextTrial = pendingStudyEnrolmentId(definition, storage);
    expect(nextTrial).not.toBe(first);
  });

  it("replaces malformed pending enrolment identifiers", () => {
    const values = new Map([[studyEnrolmentStorageKey(definition), "not-an-id"]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    expect(pendingStudyEnrolmentId(definition, storage)).toMatch(/^[0-9a-f]{32}$/);
  });

  it("caches only the study identifier and normalized consent hash", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const uppercaseDefinition = {
      ...definition,
      consent_hash_hex: "A".repeat(64),
    };
    expect(rememberStudyConsentAcknowledgement(uppercaseDefinition, storage)).toBe(true);
    expect([...values.entries()]).toEqual([
      [studyConsentStorageKey(uppercaseDefinition), "1"],
    ]);
    expect(studyConsentStorageKey(uppercaseDefinition)).toBe(
      `entros:study-consent:v1:${definition.study_id}:${"a".repeat(64)}`,
    );
    expect(hasStudyConsentAcknowledgement(uppercaseDefinition, storage)).toBe(true);
    expect(
      hasStudyConsentAcknowledgement(
        { ...uppercaseDefinition, study_id: "another-study" },
        storage,
      ),
    ).toBe(false);
    expect(
      hasStudyConsentAcknowledgement(
        { ...uppercaseDefinition, consent_hash_hex: "b".repeat(64) },
        storage,
      ),
    ).toBe(false);
  });

  it("treats storage failures as cache misses", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(hasStudyConsentAcknowledgement(definition, storage)).toBe(false);
    expect(rememberStudyConsentAcknowledgement(definition, storage)).toBe(false);
  });

  it("treats blocked browser storage access as a cache miss", () => {
    const browser = Object.defineProperty({}, "localStorage", {
      get() {
        throw new DOMException("Blocked", "SecurityError");
      },
    });
    vi.stubGlobal("window", browser);

    expect(hasStudyConsentAcknowledgement(definition)).toBe(false);
    expect(rememberStudyConsentAcknowledgement(definition)).toBe(false);
  });

  it("consumes valid and malformed invitation fragments immediately", () => {
    let replaced = "";
    const browser = {
      location: {
        hash: "#study=valid-study-invitation&view=compact",
        pathname: "/verify",
        search: "?source=test",
      },
      history: {
        replaceState: (_state: null, _title: string, url: string) => {
          replaced = url;
        },
      },
    };
    vi.stubGlobal("window", browser);

    expect(consumeStudyInvitationFromFragment()).toBe("valid-study-invitation");
    expect(replaced).toBe("/verify?source=test#view=compact");

    browser.location.hash = "#study=short";
    replaced = "";
    expect(consumeStudyInvitationFromFragment()).toBeNull();
    expect(replaced).toBe("/verify?source=test");
  });
});
