import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStudyContext } from "@entros/pulse-sdk";
import {
  POPULATION_STUDY_CONSENT_TEXT,
  hasStudyConsentAcknowledgement,
  hasExactStudyEnrolmentFields,
  isPublicStudyDefinitionRequest,
  parseStudyDefinition,
  parseStudyEnrolment,
  parseStudyEnrolmentFailure,
  rememberStudyConsentAcknowledgement,
  requestStudyEnrolment,
  resolveStudyGrant,
  resolveStudyStatusUpdate,
  studyConsentStorageKey,
  studyConsentDocument,
  studyProgressMessage,
  createStudyEnrolmentId,
  createStudyEnrolmentMessage,
  clearPendingStudyEnrolmentId,
  pendingStudyEnrolmentId,
  studyAuthorizationIsFresh,
  studyEnrolmentStorageKey,
  StudyEnrolmentRequestError,
} from "../src/lib/population-study";

const definition = {
  study_id: "devnet-population-20260808",
  consent_version: "2026-08-13",
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
  definition,
  authorization: {
    wallet_address: "wallet-address",
    signature_hex: "ab".repeat(64),
    authorization_id: "cd".repeat(16),
    signed_at: 1_775_000_000,
  },
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
    expect(
      parseStudyDefinition({ ...definition, consent_hash_hex: "short" }),
    ).toBeNull();
    expect(parseStudyDefinition({ ...definition, trial_limit: 0 })).toBeNull();
    expect(
      parseStudyDefinition({ ...definition, retention_days: Number.NaN }),
    ).toBeNull();
    expect(
      parseStudyDefinition({
        ...definition,
        projection_version: 1,
        feature_schema_version: 3,
      }),
    ).toBeNull();
    expect(
      parseStudyDefinition({
        ...definition,
        projection_version: 2,
        feature_schema_version: 4,
      }),
    ).toBeNull();
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

  it("accepts the version 2 feature schema", () => {
    expect(
      parseStudyDefinition({
        ...definition,
        projection_version: 2,
        feature_schema_version: 5,
      }),
    ).not.toBeNull();
  });

  it("accepts the bounded enrolment contract", () => {
    expect(parseStudyEnrolment(enrolment)).toEqual(enrolment);
  });

  it("rejects malformed enrolments", () => {
    expect(parseStudyEnrolment({ ...enrolment, token: "short" })).toBeNull();
    expect(
      parseStudyEnrolment({ ...enrolment, session_id: "z".repeat(32) }),
    ).toBeNull();
    expect(parseStudyEnrolment({ ...enrolment, trial_index: 4 })).toBeNull();
  });

  it("accepts only bounded study enrolment failure codes", () => {
    expect(
      parseStudyEnrolmentFailure({ error: "study_trial_limit_reached" }),
    ).toBe("study_trial_limit_reached");
    expect(
      parseStudyEnrolmentFailure({ error: "study_enrolment_expired" }),
    ).toBe("study_enrolment_expired");
    expect(
      parseStudyEnrolmentFailure({ error: "study_enrolment_conflict" }),
    ).toBe("study_enrolment_conflict");
    expect(
      parseStudyEnrolmentFailure({ error: "study_enrolment_unavailable" }),
    ).toBe("study_enrolment_unavailable");
    expect(parseStudyEnrolmentFailure({ error: "internal detail" })).toBeNull();
    expect(parseStudyEnrolmentFailure(null)).toBeNull();
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

  it("names encrypted wallet grouping and excludes KYC data", () => {
    const text = POPULATION_STUDY_CONSENT_TEXT.join(" ");
    expect(text).toContain("encrypted study record includes the Solana wallet");
    expect(text).toContain(
      "does not request your legal name or other KYC data",
    );
  });

  it("builds the canonical wallet enrolment message", () => {
    expect(
      createStudyEnrolmentMessage(
        definition,
        "wallet-address",
        "00112233445566778899aabbccddeeff",
        1_775_000_000,
      ),
    ).toBe(
      `Entros Protocol - Population Study Enrolment\nStudy: ${definition.study_id}\nWallet: wallet-address\nConsent version: ${definition.consent_version}\nConsent hash: ${definition.consent_hash_hex}\nAuthorization: 00112233445566778899aabbccddeeff\nSigned at: 1775000000`,
    );
  });

  it("binds retention and trial limits into the consent document", () => {
    const original = studyConsentDocument(definition);
    expect(original).toContain("14 days");
    expect(original).toContain("up to 3 study trials");
    expect(
      studyConsentDocument({ ...definition, retention_days: 365 }),
    ).not.toBe(original);
    expect(studyConsentDocument({ ...definition, trial_limit: 4 })).not.toBe(
      original,
    );
  });

  it("pins the wallet-bound production consent hash", () => {
    const document = studyConsentDocument({
      retention_days: 30,
      trial_limit: 5,
    });
    expect(createHash("sha256").update(document, "utf8").digest("hex")).toBe(
      "917a46836ff71db393e93aecca9e068722a908c6c0bf0cba6cee498de0a7bcdd",
    );
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
      definition,
      authorization: activeGrant.authorization,
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
    const wallet = "wallet-one";
    const first = pendingStudyEnrolmentId(definition, wallet, storage);
    const retry = pendingStudyEnrolmentId(definition, wallet, storage);
    expect(retry).toBe(first);
    expect(values.get(studyEnrolmentStorageKey(definition, wallet))).toBe(
      first,
    );
    expect(pendingStudyEnrolmentId(definition, "wallet-two", storage)).not.toBe(
      first,
    );

    expect(clearPendingStudyEnrolmentId(definition, wallet, storage)).toBe(
      true,
    );
    const nextTrial = pendingStudyEnrolmentId(definition, wallet, storage);
    expect(nextTrial).not.toBe(first);
  });

  it("replaces malformed pending enrolment identifiers", () => {
    const wallet = "wallet-one";
    const values = new Map([
      [studyEnrolmentStorageKey(definition, wallet), "not-an-id"],
    ]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    expect(pendingStudyEnrolmentId(definition, wallet, storage)).toMatch(
      /^[0-9a-f]{32}$/,
    );
  });

  it("reuses only fresh wallet-bound authorizations", () => {
    expect(
      studyAuthorizationIsFresh(
        activeGrant.authorization,
        "wallet-address",
        1_775_000_800,
      ),
    ).toBe(true);
    expect(
      studyAuthorizationIsFresh(
        activeGrant.authorization,
        "another-wallet",
        1_775_000_800,
      ),
    ).toBe(false);
    expect(
      studyAuthorizationIsFresh(
        activeGrant.authorization,
        "wallet-address",
        1_775_000_841,
      ),
    ).toBe(false);
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
    expect(
      rememberStudyConsentAcknowledgement(uppercaseDefinition, storage),
    ).toBe(true);
    expect([...values.entries()]).toEqual([
      [studyConsentStorageKey(uppercaseDefinition), "1"],
    ]);
    expect(studyConsentStorageKey(uppercaseDefinition)).toBe(
      `entros:study-consent:v1:${definition.study_id}:${"a".repeat(64)}`,
    );
    expect(hasStudyConsentAcknowledgement(uppercaseDefinition, storage)).toBe(
      true,
    );
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
    expect(rememberStudyConsentAcknowledgement(definition, storage)).toBe(
      false,
    );
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
});

describe("population study request boundaries", () => {
  it("preserves the bounded server action for failed enrolment", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "study_trial_limit_reached" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(
      requestStudyEnrolment(
        activeGrant.authorization,
        definition,
        "0123456789abcdef0123456789abcdef",
      ),
    ).rejects.toMatchObject<Partial<StudyEnrolmentRequestError>>({
      name: "StudyEnrolmentRequestError",
      code: "study_trial_limit_reached",
      message: "You have completed all available study trials.",
    });
  });

  it("accepts only the empty public definition request", () => {
    expect(isPublicStudyDefinitionRequest({})).toBe(true);
    expect(
      isPublicStudyDefinitionRequest({
        invitation: "legacy-participant-capability",
      }),
    ).toBe(false);
  });

  it("rejects legacy enrolment request fields", () => {
    const enrolmentRequest = {
      wallet_id: "11111111111111111111111111111111",
      signature_hex: "ab".repeat(64),
      authorization_id: "cd".repeat(16),
      signed_at: 1_775_000_000,
      consent_version: "2026-08-13",
      consent_hash_hex: "a".repeat(64),
      enrolment_id: "0123456789abcdef0123456789abcdef",
      accepted: true,
    };
    expect(hasExactStudyEnrolmentFields(enrolmentRequest)).toBe(true);
    expect(
      hasExactStudyEnrolmentFields({
        ...enrolmentRequest,
        invitation: "legacy-participant-capability",
      }),
    ).toBe(false);
  });
});
