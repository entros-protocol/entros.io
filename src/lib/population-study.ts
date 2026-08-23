import {
  featureSchemaVersionForProjection,
  type StudyRecordStatus,
} from "@entros/pulse-sdk";

export const POPULATION_STUDY_CONSENT_VERSION = "2026-08-13";

const STUDY_ENROLMENT_FIELDS = new Set([
  "wallet_id",
  "signature_hex",
  "authorization_id",
  "signed_at",
  "consent_version",
  "consent_hash_hex",
  "enrolment_id",
  "accepted",
]);

export const POPULATION_STUDY_CONSENT_TEXT = [
  "You are invited to an Entros devnet population study.",
  "The study uses the same voice, trace, and natural device movement capture as normal verification.",
  "With your consent, Entros stores an encrypted 256-bit behavioral fingerprint and an encrypted 308-value statistical feature summary. The summary contains measurements derived from your voice, trace, and natural device movement. Entros also stores validation outcomes and timing summaries.",
  "The encrypted study record includes the Solana wallet you connect. Entros uses the wallet to group repeat trials with the Anchor and Trust Score that you control.",
  "The study does not request your legal name or other KYC data. It does not store phrase audio, raw motion, raw touch, the traced path, challenge words, transcripts, IP addresses, or browser identifiers.",
  "You can continue with normal devnet verification without joining the study.",
] as const;

export interface StudyDefinition {
  study_id: string;
  consent_version: string;
  consent_hash_hex: string;
  retention_days: number;
  trial_limit: number;
  visit_gap_secs: number;
  feature_schema_version: number;
  projection_version: number;
  seed_generation_id: string;
  projection_config_id: string;
  collects_full_vector: boolean;
  preview_only?: boolean;
}

type ConsentTerms = Pick<StudyDefinition, "retention_days" | "trial_limit">;

export function isPublicStudyDefinitionRequest(value: unknown): boolean {
  return !!value && typeof value === "object" && Object.keys(value).length === 0;
}

export function hasExactStudyEnrolmentFields(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object") return false;
  const fields = Object.keys(value);
  return (
    fields.length === STUDY_ENROLMENT_FIELDS.size &&
    fields.every((field) => STUDY_ENROLMENT_FIELDS.has(field))
  );
}

export function studyConsentParagraphs(terms: ConsentTerms): readonly string[] {
  return [
    ...POPULATION_STUDY_CONSENT_TEXT,
    `Entros retains this study record for ${terms.retention_days} days. You can submit up to ${terms.trial_limit} study trials.`,
  ];
}

export function studyConsentDocument(terms: ConsentTerms): string {
  return studyConsentParagraphs(terms).join("\n");
}

export interface StudyEnrolment {
  token: string;
  session_id: string;
  trial_index: number;
  trial_limit: number;
  expires_in: number;
}

export interface StudyAuthorization {
  wallet_address: string;
  signature_hex: string;
  authorization_id: string;
  signed_at: number;
}

export interface ActiveStudyGrant extends StudyEnrolment {
  definition: StudyDefinition;
  authorization: StudyAuthorization;
}

export type StudyEnrolmentFailure =
  | "study_trial_limit_reached"
  | "study_enrolment_expired"
  | "study_enrolment_conflict"
  | "study_enrolment_unavailable";

const STUDY_ENROLMENT_FAILURES = new Set<StudyEnrolmentFailure>([
  "study_trial_limit_reached",
  "study_enrolment_expired",
  "study_enrolment_conflict",
  "study_enrolment_unavailable",
]);

export class StudyEnrolmentRequestError extends Error {
  constructor(readonly code: StudyEnrolmentFailure | null) {
    super(studyEnrolmentFailureMessage(code));
    this.name = "StudyEnrolmentRequestError";
  }
}

export type StudyStatusUpdate =
  | { confirmed: false }
  | { confirmed: true; status: StudyRecordStatus };

export type StudyGrantResolution =
  | { state: "unconfirmed"; grant: ActiveStudyGrant }
  | {
      state: "complete";
      status: StudyRecordStatus;
      reason: "preview" | "disabled" | "exhausted";
    }
  | {
      state: "awaiting_participant";
      status: StudyRecordStatus;
      definition: StudyDefinition;
      authorization: StudyAuthorization;
      completed_trial_index: number;
    };

interface ConsentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface EnrolmentStorage extends ConsentStorage {
  removeItem(key: string): void;
}

const CONSENT_STORAGE_PREFIX = "entros:study-consent:v1";
const ENROLMENT_STORAGE_PREFIX = "entros:study-enrolment:v1";

/**
 * Advance a study only when the server confirms its storage outcome.
 *
 * A missing status means the client did not receive a study response. The
 * request may have failed before upload, so consuming the grant would turn a
 * later verification retry into an unlabelled non-study capture.
 */
export function resolveStudyStatusUpdate(
  status: StudyRecordStatus | undefined,
): StudyStatusUpdate {
  return status === undefined
    ? { confirmed: false }
    : { confirmed: true, status };
}

export function resolveStudyGrant(
  grant: ActiveStudyGrant,
  status: StudyRecordStatus | undefined,
): StudyGrantResolution {
  if (status === undefined) return { state: "unconfirmed", grant };
  if (grant.definition.preview_only) {
    return { state: "complete", status, reason: "preview" };
  }
  if (status === "disabled") {
    return { state: "complete", status, reason: "disabled" };
  }
  if (grant.trial_index >= grant.trial_limit) {
    return { state: "complete", status, reason: "exhausted" };
  }
  return {
    state: "awaiting_participant",
    status,
    definition: grant.definition,
    authorization: grant.authorization,
    completed_trial_index: grant.trial_index,
  };
}

export function studyProgressMessage(
  status: StudyRecordStatus,
  trialIndex: number,
  trialLimit: number,
  completionReason: "preview" | "disabled" | "exhausted" | null,
): string {
  const recorded = status === "recorded" || status === "replayed";
  if (completionReason === "preview") {
    return "Research preview finished. No study record was saved.";
  }
  if (completionReason === "disabled") {
    return "This research study is no longer accepting records. Normal verification remains available.";
  }
  if (completionReason === "exhausted") {
    return recorded
      ? `Research trial ${trialIndex} of ${trialLimit} recorded. This wallet has no study trials left.`
      : `Research trial ${trialIndex} of ${trialLimit} finished, but no study record was saved. This wallet has no study trials left.`;
  }
  return recorded
    ? `Research trial ${trialIndex} of ${trialLimit} recorded. You can do another now or return later while the study remains active.`
    : `Research trial ${trialIndex} of ${trialLimit} finished, but no study record was saved. You can try another now or return later while the study remains active.`;
}

export function studyConsentStorageKey(definition: StudyDefinition): string {
  return `${CONSENT_STORAGE_PREFIX}:${definition.study_id}:${definition.consent_hash_hex.toLowerCase()}`;
}

export function hasStudyConsentAcknowledgement(
  definition: StudyDefinition,
  storage: ConsentStorage | null = browserConsentStorage(),
): boolean {
  if (!storage) return false;
  try {
    return storage.getItem(studyConsentStorageKey(definition)) === "1";
  } catch {
    return false;
  }
}

export function rememberStudyConsentAcknowledgement(
  definition: StudyDefinition,
  storage: ConsentStorage | null = browserConsentStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(studyConsentStorageKey(definition), "1");
    return true;
  } catch {
    return false;
  }
}

function browserConsentStorage(): ConsentStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isUnsignedInteger(value: unknown, maximum: number): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0 && value <= maximum;
}

export function parseStudyDefinition(value: unknown): StudyDefinition | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.study_id !== "string" ||
    candidate.study_id.length < 1 ||
    candidate.study_id.length > 64 ||
    !/^[a-zA-Z0-9._-]+$/.test(candidate.study_id) ||
    typeof candidate.consent_version !== "string" ||
    candidate.consent_version.length < 1 ||
    candidate.consent_version.length > 64 ||
    typeof candidate.consent_hash_hex !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(candidate.consent_hash_hex) ||
    !isUnsignedInteger(candidate.retention_days, 3_650) ||
    candidate.retention_days < 1 ||
    !isUnsignedInteger(candidate.trial_limit, 1_000) ||
    candidate.trial_limit < 1 ||
    !isUnsignedInteger(candidate.visit_gap_secs, 604_800) ||
    candidate.visit_gap_secs < 900 ||
    !isUnsignedInteger(candidate.feature_schema_version, 65_535) ||
    !isUnsignedInteger(candidate.projection_version, 65_535) ||
    typeof candidate.seed_generation_id !== "string" ||
    !isBoundedIdentifier(candidate.seed_generation_id) ||
    typeof candidate.projection_config_id !== "string" ||
    !isBoundedIdentifier(candidate.projection_config_id) ||
    typeof candidate.collects_full_vector !== "boolean" ||
    (candidate.preview_only !== undefined && typeof candidate.preview_only !== "boolean")
  ) {
    return null;
  }
  try {
    if (
      candidate.feature_schema_version !==
      featureSchemaVersionForProjection(candidate.projection_version)
    ) {
      return null;
    }
  } catch {
    return null;
  }
  return candidate as unknown as StudyDefinition;
}

function isBoundedIdentifier(value: string): boolean {
  return value.length >= 1 && value.length <= 64 && /^[A-Za-z0-9._-]+$/.test(value);
}

export function parseStudyEnrolment(value: unknown): StudyEnrolment | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.token !== "string" ||
    !/^[A-Za-z0-9_-]{43}$/.test(candidate.token) ||
    typeof candidate.session_id !== "string" ||
    !/^[a-fA-F0-9]{32}$/.test(candidate.session_id) ||
    !isUnsignedInteger(candidate.trial_index, 1_000) ||
    candidate.trial_index < 1 ||
    !isUnsignedInteger(candidate.trial_limit, 1_000) ||
    candidate.trial_limit < candidate.trial_index ||
    !isUnsignedInteger(candidate.expires_in, 86_400) ||
    candidate.expires_in < 1
  ) {
    return null;
  }
  return candidate as unknown as StudyEnrolment;
}

export function parseStudyEnrolmentFailure(
  value: unknown,
): StudyEnrolmentFailure | null {
  if (!value || typeof value !== "object") return null;
  const error = (value as Record<string, unknown>).error;
  return typeof error === "string" &&
    STUDY_ENROLMENT_FAILURES.has(error as StudyEnrolmentFailure)
    ? (error as StudyEnrolmentFailure)
    : null;
}

function studyEnrolmentFailureMessage(code: StudyEnrolmentFailure | null): string {
  switch (code) {
    case "study_trial_limit_reached":
      return "You have completed all available study trials.";
    case "study_enrolment_expired":
    case "study_enrolment_conflict":
      return "The study authorization expired. Sign again to continue.";
    case "study_enrolment_unavailable":
      return "Study enrolment is temporarily unavailable. Try again.";
    default:
      return "Study enrolment could not be completed.";
  }
}

export function createStudyEnrolmentId(): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function studyEnrolmentStorageKey(
  definition: StudyDefinition,
  walletAddress: string,
): string {
  return `${ENROLMENT_STORAGE_PREFIX}:${definition.study_id}:${definition.consent_hash_hex.toLowerCase()}:${walletAddress}`;
}

export function pendingStudyEnrolmentId(
  definition: StudyDefinition,
  walletAddress: string,
  storage: EnrolmentStorage | null = browserEnrolmentStorage(),
): string {
  if (!storage) return createStudyEnrolmentId();
  const key = studyEnrolmentStorageKey(definition, walletAddress);
  try {
    const existing = storage.getItem(key);
    if (existing && /^[0-9a-f]{32}$/.test(existing)) return existing;
    const created = createStudyEnrolmentId();
    storage.setItem(key, created);
    return created;
  } catch {
    return createStudyEnrolmentId();
  }
}

export function clearPendingStudyEnrolmentId(
  definition: StudyDefinition,
  walletAddress: string,
  storage: EnrolmentStorage | null = browserEnrolmentStorage(),
): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(studyEnrolmentStorageKey(definition, walletAddress));
    return true;
  } catch {
    return false;
  }
}

function browserEnrolmentStorage(): EnrolmentStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function createStudyEnrolmentMessage(
  definition: StudyDefinition,
  walletAddress: string,
  authorizationId: string,
  signedAt: number,
): string {
  return [
    "Entros Protocol - Population Study Enrolment",
    `Study: ${definition.study_id}`,
    `Wallet: ${walletAddress}`,
    `Consent version: ${definition.consent_version}`,
    `Consent hash: ${definition.consent_hash_hex}`,
    `Authorization: ${authorizationId}`,
    `Signed at: ${signedAt}`,
  ].join("\n");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createStudyAuthorization(
  definition: StudyDefinition,
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>,
): Promise<StudyAuthorization> {
  const authorizationId = createStudyEnrolmentId();
  const signedAt = Math.floor(Date.now() / 1_000);
  const message = createStudyEnrolmentMessage(
    definition,
    walletAddress,
    authorizationId,
    signedAt,
  );
  const signature = await signMessage(new TextEncoder().encode(message));
  if (signature.length !== 64) {
    throw new Error("The wallet returned an invalid study signature.");
  }
  return {
    wallet_address: walletAddress,
    signature_hex: bytesToHex(signature),
    authorization_id: authorizationId,
    signed_at: signedAt,
  };
}

export function studyAuthorizationIsFresh(
  authorization: StudyAuthorization,
  walletAddress: string,
  now = Math.floor(Date.now() / 1_000),
): boolean {
  return (
    authorization.wallet_address === walletAddress &&
    authorization.signed_at <= now + 30 &&
    authorization.signed_at >= now - 840
  );
}

export async function fetchStudyDefinition(signal?: AbortSignal): Promise<StudyDefinition> {
  const response = await fetch("/api/study/definition", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error("The population study is unavailable.");
  const definition = parseStudyDefinition(await response.json());
  if (!definition) throw new Error("The population study returned an invalid response.");
  return definition;
}

export async function requestStudyEnrolment(
  authorization: StudyAuthorization,
  definition: StudyDefinition,
  enrolmentId: string,
): Promise<ActiveStudyGrant> {
  const response = await fetch("/api/study/enrol", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wallet_id: authorization.wallet_address,
      signature_hex: authorization.signature_hex,
      authorization_id: authorization.authorization_id,
      signed_at: authorization.signed_at,
      consent_version: definition.consent_version,
      consent_hash_hex: definition.consent_hash_hex,
      enrolment_id: enrolmentId,
      accepted: true,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new StudyEnrolmentRequestError(parseStudyEnrolmentFailure(body));
  }
  const enrolment = parseStudyEnrolment(await response.json());
  if (!enrolment) throw new Error("Study enrolment returned an invalid response.");
  return { ...enrolment, definition, authorization };
}
