import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as definitionPOST } from "../src/app/api/study/definition/route";
import { POST as enrolPOST } from "../src/app/api/study/enrol/route";

const enrolment = {
  wallet_id: "11111111111111111111111111111112",
  signature_hex: "ab".repeat(64),
  authorization_id: "00112233445566778899aabbccddeeff",
  signed_at: 1_775_000_000,
  consent_version: "2026-08-13",
  consent_hash_hex: "cd".repeat(32),
  enrolment_id: "ffeeddccbbaa99887766554433221100",
  accepted: true,
};

function post(path: string, body: unknown): Request {
  return new Request(`https://entros.test${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let upstream: ReturnType<typeof vi.fn<typeof fetch>>;

beforeEach(() => {
  vi.stubEnv("RELAYER_URL", "https://executor.example");
  vi.stubEnv("RELAYER_API_KEY", "server-key");
  upstream = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", upstream);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("study routes while intake is closed", () => {
  it("answers 404 for the study definition and never calls the executor", async () => {
    const response = await definitionPOST(post("/api/study/definition", {}));
    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("answers 404 for enrolment and never calls the executor", async () => {
    const response = await enrolPOST(post("/api/study/enrol", enrolment));
    expect(response.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });
});
