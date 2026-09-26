import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST as openProxy } from "@/app/challenge/paired/route";
import { POST as commitProxy } from "@/app/paired/commit/route";
import { POST as finalizeProxy } from "@/app/validate-session/route";
import { pairedVerifyEnabled } from "@/lib/server/paired-verify";

const SRC = fileURLToPath(new URL("../src/", import.meta.url));

function sourceFiles(directory = SRC): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function source(path: string): string {
  return readFileSync(join(SRC, path), "utf8");
}

/** Specifiers of `import ... from` and `export ... from`, which ship with the importer. */
function staticImports(body: string): string[] {
  return [...body.matchAll(/\bfrom\s*["']([^"']+)["']/g)].map((match) => match[1]!);
}

/** Specifiers of `import("...")`, which load in a chunk of their own. */
function dynamicImports(body: string): string[] {
  return [...body.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)].map(
    (match) => match[1]!,
  );
}

const FILES = sourceFiles().map((path) => ({
  path: relative(SRC, path),
  body: readFileSync(path, "utf8"),
}));

const PAIRED_API = /\b(PairedSession|PairedProtocolError|createPairedSession|PairedRoundView|PairedPhase)\b/;
const PAIRED_MODULE = /paired-challenge|paired-capture/;

const post = (path: string, body: unknown) =>
  new Request(`http://localhost:3010${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("paired verify boundary", () => {
  it("takes the paired API from the published SDK only", () => {
    const users = FILES.filter((file) => PAIRED_API.test(file.body));
    expect(users.map((file) => file.path).sort()).toEqual([
      "components/verify/paired-capture.tsx",
      "components/verify/paired-challenge.tsx",
    ]);
    for (const file of FILES) {
      for (const specifier of [...staticImports(file.body), ...dynamicImports(file.body)]) {
        expect(specifier, file.path).not.toMatch(
          /pulse-sdk\/(src|dist)|\.\.\/pulse-sdk|paired-round/,
        );
      }
      // The site keeps no copy of the transcript. Every digest comes from the SDK.
      expect(file.body, file.path).not.toContain("entros/paired-round/v1");
    }
  });

  it("lets the SDK open sessions itself", () => {
    expect(FILES.map((file) => file.path)).not.toContain(
      "app/api/relay-paired-session/route.ts",
    );
    for (const file of FILES) {
      expect(file.body, file.path).not.toMatch(/\bopenSession\b|relay-paired-session/);
    }
  });

  it("loads the paired capture in a chunk of its own", () => {
    for (const file of FILES) {
      if (PAIRED_MODULE.test(file.path)) continue;
      for (const specifier of staticImports(file.body)) {
        expect(specifier, file.path).not.toMatch(PAIRED_MODULE);
      }
    }
    const host = source("components/sections/verify-wallet-connected.tsx");
    expect(dynamicImports(host)).toEqual(["@/components/verify/paired-capture"]);
    expect(host).toMatch(/dynamic\(\s*\(\)\s*=>\s*import\("@\/components\/verify\/paired-capture"\)/);
    expect(host).toContain("{ ssr: false }");
  });

  it("keeps the executor key out of every client module", () => {
    const clientFiles = FILES.filter((file) =>
      /^\s*["']use client["']/.test(file.body),
    );
    expect(clientFiles.length).toBeGreaterThan(10);
    for (const file of clientFiles) {
      expect(file.body, file.path).not.toMatch(/(?<!NEXT_PUBLIC_)RELAYER_API_KEY/);
    }
    for (const path of [
      "app/challenge/paired/route.ts",
      "app/paired/commit/route.ts",
      "app/validate-session/route.ts",
    ]) {
      const route = source(path);
      expect(route, path).toMatch(/^import "server-only";/);
      expect(route, path).toContain("process.env.RELAYER_API_KEY");
      expect(route, path).not.toContain("NEXT_PUBLIC_");
    }
  });

  it("keeps the embed popup and the walletless flow on the single capture", () => {
    const singleOnly = FILES.filter(
      (file) =>
        file.path.startsWith("components/embed/") ||
        file.path.startsWith("app/(app)/embed/") ||
        file.path.startsWith("lib/embed/") ||
        file.path === "components/sections/verify-walletless.tsx",
    );
    expect(singleOnly.map((file) => file.path)).toContain(
      "components/embed/popup-content.tsx",
    );
    for (const file of singleOnly) {
      expect(file.body, file.path).not.toMatch(PAIRED_API);
      expect(file.body, file.path).not.toContain("pairedVerify");
      for (const specifier of [...staticImports(file.body), ...dynamicImports(file.body)]) {
        expect(specifier, file.path).not.toMatch(
          /paired-challenge|paired-capture|server\/paired-verify|verify-wallet-connected/,
        );
      }
    }
  });

  it("defaults the flag to off", () => {
    vi.stubEnv("ENTROS_PAIRED_VERIFY", "");
    expect(pairedVerifyEnabled()).toBe(false);
    expect(pairedVerifyEnabled(undefined)).toBe(false);
    for (const value of ["0", "true", "yes", " 1", "1 "]) {
      expect(pairedVerifyEnabled(value), value).toBe(false);
    }
    expect(pairedVerifyEnabled("1")).toBe(true);

    // The server reads it, and both client layers default to the single capture.
    expect(source("app/(app)/verify/page.tsx")).toContain("pairedVerifyEnabled()");
    expect(source("components/sections/verify-flow.tsx")).toContain(
      "pairedVerify = false",
    );
    expect(source("components/sections/verify-wallet-connected.tsx")).toContain(
      "pairedVerify = false",
    );
    const example = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
    expect(example).toMatch(/^ENTROS_PAIRED_VERIFY=0$/m);
  });

  it("answers 404 on every paired route while the flag is off", async () => {
    vi.stubEnv("ENTROS_PAIRED_VERIFY", "");
    vi.stubEnv("RELAYER_URL", "https://executor.example");
    vi.stubEnv("RELAYER_API_KEY", "server-secret");
    // The local proxies stay closed even where local development opens them.
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENTROS_STUDY_LOCAL_PREVIEW", "1");
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const open = await openProxy(
      post("/challenge/paired", { wallet: "11111111111111111111111111111111" }),
    );
    const commit = await commitProxy(post("/paired/commit", {}));
    const finalize = await finalizeProxy(post("/validate-session", {}));

    expect([open.status, commit.status, finalize.status]).toEqual([404, 404, 404]);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("answers 404 outside local development with the flag on", async () => {
    vi.stubEnv("ENTROS_PAIRED_VERIFY", "1");
    vi.stubEnv("RELAYER_URL", "https://executor.example");
    vi.stubEnv("RELAYER_API_KEY", "server-secret");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ENTROS_STUDY_LOCAL_PREVIEW", "1");
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);

    const open = await openProxy(
      post("/challenge/paired", { wallet: "11111111111111111111111111111111" }),
    );

    expect(open.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  it("opens a session through the local preview proxy with the server key", async () => {
    vi.stubEnv("ENTROS_PAIRED_VERIFY", "1");
    vi.stubEnv("RELAYER_URL", "http://127.0.0.1:3001/verify");
    vi.stubEnv("RELAYER_API_KEY", "server-secret");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENTROS_STUDY_LOCAL_PREVIEW", "1");
    const upstream = vi.fn<typeof fetch>(async () =>
      Response.json({ reason: "session_active", retry_after: 42 }, { status: 409 }),
    );
    vi.stubGlobal("fetch", upstream);

    const response = await openProxy(
      post("/challenge/paired", { wallet: "11111111111111111111111111111111", tier: "trace" }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      reason: "session_active",
      retry_after: 42,
    });
    expect(upstream).toHaveBeenCalledOnce();
    const [target, init] = upstream.mock.calls[0]!;
    expect(String(target)).toBe("http://127.0.0.1:3001/challenge/paired");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "X-API-Key": "server-secret" });
    expect(JSON.parse(String(init?.body))).toEqual({
      wallet: "11111111111111111111111111111111",
      tier: "trace",
    });
  });
});
