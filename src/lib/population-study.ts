export const POPULATION_STUDY_CONSENT_VERSION = "2026-08-08";

export const POPULATION_STUDY_CONSENT_TEXT = [
  "You are invited to an Entros devnet population study.",
  "The study uses the same voice, trace, and natural device movement capture as normal verification.",
  "With your consent, Entros stores an encrypted behavioral fingerprint, validation outcomes, timing summaries, and the declared feature summary when this study enables it.",
  "The study does not store phrase audio, raw motion, raw touch, the traced path, challenge words, transcripts, wallet addresses, IP addresses, or browser identifiers.",
  "The study groups repeat trials with a random study-only participant tag. It does not use your wallet for study grouping.",
  "You can continue with normal devnet verification without joining the study.",
] as const;

export interface StudyDefinition {
  study_id: string;
  consent_version: string;
  consent_hash_hex: string;
  retention_days: number;
  trial_limit: number;
  feature_schema_version: number;
  projection_version: number;
  collects_full_vector: boolean;
  preview_only?: boolean;
}

export interface StudyEnrolment {
  token: string;
  session_id: string;
  trial_index: number;
  trial_limit: number;
  expires_in: number;
}

export interface ActiveStudyGrant extends StudyEnrolment {
  invitation: string;
  definition: StudyDefinition;
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
    !isUnsignedInteger(candidate.feature_schema_version, 65_535) ||
    !isUnsignedInteger(candidate.projection_version, 65_535) ||
    typeof candidate.collects_full_vector !== "boolean" ||
    (candidate.preview_only !== undefined && typeof candidate.preview_only !== "boolean")
  ) {
    return null;
  }
  return candidate as unknown as StudyDefinition;
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

export function readStudyInvitationFromFragment(): string | null {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  const invitation = fragment.get("study");
  if (!invitation || invitation.length < 16 || invitation.length > 256) return null;
  return /^[\x21-\x7e]+$/.test(invitation) ? invitation : null;
}

export function clearStudyInvitationFragment(): void {
  const fragment = new URLSearchParams(window.location.hash.slice(1));
  fragment.delete("study");
  const remaining = fragment.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${window.location.search}${remaining ? `#${remaining}` : ""}`,
  );
}

export async function requestStudyEnrolment(
  invitation: string,
  definition: StudyDefinition,
): Promise<ActiveStudyGrant> {
  const response = await fetch("/api/study/enrol", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      invitation,
      consent_version: definition.consent_version,
      consent_hash_hex: definition.consent_hash_hex,
      accepted: true,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Study enrolment could not be completed.");
  const enrolment = parseStudyEnrolment(await response.json());
  if (!enrolment) throw new Error("Study enrolment returned an invalid response.");
  return { ...enrolment, invitation, definition };
}
