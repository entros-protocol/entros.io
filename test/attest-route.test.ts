import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../src/app/attest/route";

function attestRequest(
  body: string,
  headers: Record<string, string> = { "Content-Type": "application/json" },
): Request {
  return new Request("http://localhost:3010/attest", {
    method: "POST",
    headers,
    body,
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("/attest local executor proxy route", () => {
  it("guards the route module with server-only", () => {
    const source = readFileSync(
      resolve(__dirname, "../src/app/attest/route.ts"),
      "utf8",
    );
    expect(source).toMatch(/^import "server-only";/);
  });

  it("fails closed with 404 outside local development preview", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENTROS_STUDY_LOCAL_PREVIEW", "1");
    vi.stubEnv("RELAYER_URL", "https://executor.example");
    vi.stubEnv("RELAYER_API_KEY", "server-secret");
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await POST(attestRequest(JSON.stringify({ wallet: "abc" })));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(upstream).not.toHaveBeenCalled();
  });

  it("returns 503 when server relayer credentials are missing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENTROS_STUDY_LOCAL_PREVIEW", "1");
    vi.stubEnv("RELAYER_URL", "");
    vi.stubEnv("RELAYER_API_KEY", "");
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const response = await POST(attestRequest(JSON.stringify({ wallet: "abc" })));

    expect(response.status).toBe(503);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("rejects non-JSON requests and payloads above 8192 bytes before forwarding", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENTROS_STUDY_LOCAL_PREVIEW", "1");
    vi.stubEnv("RELAYER_URL", "http://127.0.0.1:3001");
    vi.stubEnv("RELAYER_API_KEY", "server-secret");
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const badType = await POST(
      attestRequest("plain", { "Content-Type": "text/plain" }),
    );
    expect(badType.status).toBe(415);

    const oversized = await POST(
      attestRequest(JSON.stringify({ payload: "x".repeat(8_200) })),
    );
    expect(oversized.status).toBe(413);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("forwards valid requests to executor /attest with the server API key", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENTROS_STUDY_LOCAL_PREVIEW", "1");
    vi.stubEnv("RELAYER_URL", "http://127.0.0.1:3001/verify");
    vi.stubEnv("RELAYER_API_KEY", "server-secret");
    const upstream = vi.fn<typeof fetch>(async () =>
      Response.json({ attestation: "ok" }, { status: 200 }),
    );
    vi.stubGlobal("fetch", upstream);

    const response = await POST(
      attestRequest(JSON.stringify({ wallet: "11111111111111111111111111111111" }), {
        "Content-Type": "application/json",
        Authorization: "caller-secret",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({ attestation: "ok" });
    expect(upstream).toHaveBeenCalledOnce();
    const [target, init] = upstream.mock.calls[0]!;
    expect(String(target)).toBe("http://127.0.0.1:3001/attest");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-API-Key": "server-secret",
    });
  });
});
