import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  POPULATION_STUDY_CONSENT_VERSION,
  parseStudyEnrolment,
  studyConsentDocument,
} from "@/lib/population-study";
import { readBoundedJson } from "@/lib/server/read-bounded-json";

const MAX_BODY_BYTES = 2_048;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE_HEADERS });
}

export async function POST(request: Request) {
  let body: Record<string, unknown> | null;
  try {
    body = (await readBoundedJson(request, MAX_BODY_BYTES)) as Record<string, unknown>;
  } catch (error) {
    const status = error instanceof RangeError ? 413 : 400;
    return noStoreJson({ error: status === 413 ? "Request too large" : "Invalid request" }, status);
  }
  if (
    !body ||
    typeof body.invitation !== "string" ||
    typeof body.consent_version !== "string" ||
    typeof body.consent_hash_hex !== "string" ||
    typeof body.enrolment_id !== "string" ||
    !/^[0-9a-f]{32}$/.test(body.enrolment_id) ||
    body.accepted !== true
  ) {
    return noStoreJson({ error: "Invalid consent response" }, 400);
  }

  const relayerUrl = process.env.RELAYER_URL;
  const relayerApiKey = process.env.RELAYER_API_KEY;
  const isLocalPreview =
    process.env.NODE_ENV === "development" &&
    process.env.ENTROS_STUDY_LOCAL_PREVIEW === "1" &&
    body.invitation === "local-preview-20260808";
  if (isLocalPreview) {
    const consentHash = createHash("sha256")
      .update(studyConsentDocument({ retention_days: 14, trial_limit: 3 }), "utf8")
      .digest("hex");
    if (
      body.consent_version !== POPULATION_STUDY_CONSENT_VERSION ||
      body.consent_hash_hex !== consentHash
    ) {
      return noStoreJson({ error: "Invalid consent response" }, 400);
    }
    const previewToken = createHash("sha256")
      .update(`local-preview-token:${body.enrolment_id}`, "utf8")
      .digest();
    const previewSession = createHash("sha256")
      .update(`local-preview-session:${body.enrolment_id}`, "utf8")
      .digest("hex")
      .slice(0, 32);
    return noStoreJson({
      token: previewToken.toString("base64url"),
      session_id: previewSession,
      trial_index: 1,
      trial_limit: 3,
      expires_in: 3_600,
    });
  }
  if (!relayerUrl || !relayerApiKey) {
    return noStoreJson({ error: "Study service unavailable" }, 503);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(new URL("/study/enrol", new URL(relayerUrl).origin), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": relayerApiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      const responseBody = await response.json().catch(() => null);
      return noStoreJson(responseBody ?? { error: "Invalid study response" }, response.status);
    }
    const responseBody = await response.json().catch(() => null);
    const enrolment = parseStudyEnrolment(responseBody);
    return enrolment
      ? noStoreJson(enrolment)
      : noStoreJson({ error: "Study service returned an invalid response" }, 502);
  } catch {
    return noStoreJson({ error: "Study service unavailable" }, 502);
  } finally {
    clearTimeout(timer);
  }
}
