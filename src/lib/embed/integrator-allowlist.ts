/**
 * Integrator allowlist for the embed/verify-popup route.
 *
 * Validates that a given (integratorKey, parentOrigin) tuple is registered
 * with Entros. Sourced from the `ENTROS_INTEGRATORS_JSON` environment
 * variable at module load time.
 *
 * Server-only. The env var has no `NEXT_PUBLIC_` prefix and must not be
 * imported into a client component bundle. The server component for
 * /embed/verify-popup performs the allowlist check, then dispatches to
 * client UI based on the result.
 *
 * Format:
 *
 *   ENTROS_INTEGRATORS_JSON='{
 *     "jupiter":   { "origins": ["https://jup.ag", "https://www.jup.ag"] },
 *     "drift":     { "origins": ["https://app.drift.trade"] },
 *     "tensor":    { "origins": ["https://www.tensor.trade"] },
 *     "magiceden": { "origins": ["https://magiceden.io", "https://magiceden.us"] }
 *   }'
 *
 * Development mode shortcut: any integrator key is allowed when the
 * parent origin matches `http://localhost(:port)`. This lets local E2E
 * against the @entros/verify package work without setting the env var.
 * Production mode (`NODE_ENV === "production"`) strictly requires the
 * env config; missing config causes every check to return `false`.
 */

interface IntegratorEntry {
  origins: string[];
  diagnostics?: boolean;
}

interface AllowlistConfig {
  [integratorKey: string]: IntegratorEntry;
}

const DEV_LOCALHOST_PATTERN = /^http:\/\/localhost(:\d+)?$/;

let configCache: AllowlistConfig | null = null;

function loadConfig(): AllowlistConfig {
  if (configCache !== null) return configCache;

  const raw = process.env.ENTROS_INTEGRATORS_JSON;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[embed] ENTROS_INTEGRATORS_JSON not set; allowlist is empty",
      );
    }
    configCache = {};
    return configCache;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("expected JSON object");
    }
    configCache = parsed as AllowlistConfig;
    return configCache;
  } catch (err) {
    console.error(
      "[embed] Failed to parse ENTROS_INTEGRATORS_JSON:",
      err,
    );
    configCache = {};
    return configCache;
  }
}

/**
 * Returns true if `parentOrigin` is on the allowlist for `integratorKey`.
 *
 * In development mode, returns true unconditionally for any localhost
 * parent origin so local testing of the @entros/verify package works
 * without environment configuration.
 *
 * In production, requires both (a) `integratorKey` to be a registered
 * key in `ENTROS_INTEGRATORS_JSON` and (b) `parentOrigin` to be on that
 * integrator's `origins` array. Strict equality match.
 */
export function isAllowedIntegrator(
  integratorKey: string,
  parentOrigin: string,
): boolean {
  if (
    process.env.NODE_ENV !== "production" &&
    DEV_LOCALHOST_PATTERN.test(parentOrigin)
  ) {
    return true;
  }

  const config = loadConfig();
  const entry = config[integratorKey];
  if (!entry || !Array.isArray(entry.origins)) return false;
  return entry.origins.includes(parentOrigin);
}

export function isIntegratorDiagnosticsEnabled(integratorKey: string, parentOrigin: string): boolean {
  const entry = loadConfig()[integratorKey];
  return entry?.diagnostics === true && Array.isArray(entry.origins) && entry.origins.includes(parentOrigin);
}
