import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  POPULATION_STUDY_CONSENT_VERSION,
  isPublicStudyDefinitionRequest,
  parseStudyDefinition,
  studyConsentDocument,
  type StudyDefinition,
} from "@/lib/population-study";
import { readBoundedJson } from "@/lib/server/read-bounded-json";

const MAX_BODY_BYTES = 1_024;
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
  if (!isPublicStudyDefinitionRequest(body)) {
    return noStoreJson({ error: "Invalid request" }, 400);
  }
  const upstream = await proxyStudy("/study/definition", {});
  if (!upstream.ok) return upstream.response;

  const definition = parseStudyDefinition(upstream.body);
  if (!definition) return noStoreJson({ error: "Study service returned an invalid response" }, 502);
  const localHash = createHash("sha256")
    .update(studyConsentDocument(definition), "utf8")
    .digest("hex");
  if (
    definition.consent_version !== POPULATION_STUDY_CONSENT_VERSION ||
    definition.consent_hash_hex !== localHash
  ) {
    return noStoreJson({ error: "The active consent document is unavailable" }, 503);
  }
  return noStoreJson(definition);
}

async function proxyStudy(path: string, body: unknown) {
  if (process.env.NODE_ENV === "development" && process.env.ENTROS_STUDY_LOCAL_PREVIEW === "1") {
    return localPreview(path, body);
  }
  const relayerUrl = process.env.RELAYER_URL;
  const relayerApiKey = process.env.RELAYER_API_KEY;
  if (!relayerUrl || !relayerApiKey) {
    return {
      ok: false as const,
      response: noStoreJson({ error: "Study service unavailable" }, 503),
    };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(new URL(path, new URL(relayerUrl).origin), {
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
      const responseBody = await response
        .json()
        .catch(() => ({ error: "Invalid study response" }));
      return {
        ok: false as const,
        response: noStoreJson(responseBody, response.status),
      };
    }
    const responseBody = await response
      .json()
      .catch(() => ({ error: "Invalid study response" }));
    return { ok: true as const, body: responseBody };
  } catch {
    return {
      ok: false as const,
      response: noStoreJson({ error: "Study service unavailable" }, 502),
    };
  } finally {
    clearTimeout(timer);
  }
}

function localPreview(path: string, body: unknown) {
  if (
    path !== "/study/definition" ||
    !body ||
    typeof body !== "object" ||
    Object.keys(body).length !== 0
  ) {
    return {
      ok: false as const,
      response: noStoreJson({ error: "Study unavailable" }, 404),
    };
  }
  const consentHash = createHash("sha256")
    .update(studyConsentDocument({ retention_days: 14, trial_limit: 3 }), "utf8")
    .digest("hex");
  return {
    ok: true as const,
    body: {
      study_id: "local-wallet-study-preview",
      consent_version: POPULATION_STUDY_CONSENT_VERSION,
      consent_hash_hex: consentHash,
      retention_days: 14,
      trial_limit: 3,
      visit_gap_secs: 14_400,
      feature_schema_version: 4,
      projection_version: 1,
      seed_generation_id: "local-preview-seed-v1",
      projection_config_id: "local-preview-projection-v1",
      collects_full_vector: true,
      preview_only: true,
    } satisfies StudyDefinition,
  };
}
