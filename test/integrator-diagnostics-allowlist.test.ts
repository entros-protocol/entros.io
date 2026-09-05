import { afterEach, describe, expect, it, vi } from "vitest";
import { parseEmbedParams } from "../src/lib/embed/url-params";

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe("integrator diagnostics registration", () => {
  it("requires an explicit flag and an exact registered origin", async () => {
    vi.stubEnv("ENTROS_INTEGRATORS_JSON", JSON.stringify({ enabled: { origins: ["http://127.0.0.1:5178"], diagnostics: true }, disabled: { origins: ["http://127.0.0.1:5178"] }, string: { origins: ["http://127.0.0.1:5178"], diagnostics: "true" } }));
    const { isIntegratorDiagnosticsEnabled } = await import("../src/lib/embed/integrator-allowlist");
    expect(isIntegratorDiagnosticsEnabled("enabled", "http://127.0.0.1:5178")).toBe(true);
    expect(isIntegratorDiagnosticsEnabled("enabled", "http://127.0.0.1:5179")).toBe(false);
    expect(isIntegratorDiagnosticsEnabled("disabled", "http://127.0.0.1:5178")).toBe(false);
    expect(isIntegratorDiagnosticsEnabled("string", "http://127.0.0.1:5178")).toBe(false);
  });
  it("does not enable diagnostics through the development localhost shortcut", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENTROS_INTEGRATORS_JSON", "{}");
    const { isAllowedIntegrator, isIntegratorDiagnosticsEnabled } = await import("../src/lib/embed/integrator-allowlist");
    expect(isAllowedIntegrator("fixture", "http://localhost:5178")).toBe(true);
    expect(isIntegratorDiagnosticsEnabled("fixture", "http://localhost:5178")).toBe(false);
  });
  it("ignores URL attempts to enable diagnostics", () => {
    const parsed = parseEmbedParams(new URLSearchParams({ integrator: "fixture", parent_origin: "http://localhost:5178", cluster: "devnet", request_id: "test", diagnosticsEnabled: "true", diagnostics: "true" }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.params.diagnosticsEnabled).toBeUndefined();
  });
});
