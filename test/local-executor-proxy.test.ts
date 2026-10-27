import { describe, expect, it, vi } from "vitest";
import { proxyExecutorRequest } from "../src/lib/executor-proxy";
import {
  isLocalExecutorProxyEnabled,
  resolveRelayerTransport,
} from "../src/lib/relay-transport";

const runtime = {
  enabled: true,
  relayerUrl: "https://executor.example/path",
  relayerApiKey: "server-secret",
};

describe("local relayer transport", () => {
  it("requires development and the explicit local preview flag", () => {
    expect(isLocalExecutorProxyEnabled("development", "1")).toBe(true);
    expect(isLocalExecutorProxyEnabled("development", undefined)).toBe(false);
    expect(isLocalExecutorProxyEnabled("production", "1")).toBe(false);
  });

  it("uses same-origin routes during local development", () => {
    expect(
      resolveRelayerTransport({
        isDevelopment: true,
        localProxyEnabled: true,
        browserOrigin: "http://localhost:3010",
        publicRelayerUrl: "https://executor.example",
        publicRelayerApiKey: "public-key",
      }),
    ).toEqual({ relayerUrl: "http://localhost:3010" });
  });

  it("preserves direct transport during ordinary development", () => {
    expect(
      resolveRelayerTransport({
        isDevelopment: true,
        localProxyEnabled: false,
        browserOrigin: "http://localhost:3000",
        publicRelayerUrl: "https://executor.example",
        publicRelayerApiKey: "public-key",
      }),
    ).toEqual({
      relayerUrl: "https://executor.example",
      relayerApiKey: "public-key",
    });
  });

  it("preserves direct executor transport outside development", () => {
    expect(
      resolveRelayerTransport({
        isDevelopment: false,
        localProxyEnabled: true,
        browserOrigin: "https://entros.io",
        publicRelayerUrl: "https://executor.example",
        publicRelayerApiKey: "public-key",
      }),
    ).toEqual({
      relayerUrl: "https://executor.example",
      relayerApiKey: "public-key",
    });
  });
});

describe("development-only executor proxy", () => {
  const openSession = (url: string, init: RequestInit = {}) =>
    new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: "11111111111111111111111111111111", tier: "trace" }),
      ...init,
    });

  it("fails closed outside development", async () => {
    const response = await proxyExecutorRequest(
      openSession("https://entros.io/challenge/paired"),
      { path: "/challenge/paired", method: "POST", timeoutMs: 100, maxRequestBytes: 1_024 },
      { ...runtime, enabled: false },
    );
    expect(response.status).toBe(404);
  });

  it("rejects missing server configuration", async () => {
    const response = await proxyExecutorRequest(
      openSession("http://localhost:3010/challenge/paired"),
      { path: "/challenge/paired", method: "POST", timeoutMs: 100, maxRequestBytes: 1_024 },
      { enabled: true },
    );
    expect(response.status).toBe(503);
  });

  it("rejects the wrong method", async () => {
    const fetchImpl = vi.fn();
    const response = await proxyExecutorRequest(
      new Request("http://localhost:3010/challenge/paired"),
      { path: "/challenge/paired", method: "POST", timeoutMs: 100, maxRequestBytes: 1_024 },
      { ...runtime, fetchImpl },
    );
    expect(response.status).toBe(405);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("forwards the body with the server key and no caller headers", async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      expect(String(input)).toBe("https://executor.example/challenge/paired");
      expect(init?.headers).toEqual({
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-API-Key": "server-secret",
      });
      expect(JSON.parse(String(init?.body))).toEqual({
        wallet: "11111111111111111111111111111111",
        tier: "trace",
      });
      return Response.json({ session_id: "s" });
    });
    const response = await proxyExecutorRequest(
      openSession("http://localhost:3010/challenge/paired", {
        headers: { "Content-Type": "application/json", Authorization: "must-not-forward" },
      }),
      { path: "/challenge/paired", method: "POST", timeoutMs: 100, maxRequestBytes: 1_024 },
      { ...runtime, fetchImpl },
    );
    expect(response.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("rejects an oversized body before forwarding it", async () => {
    const fetchImpl = vi.fn();
    const response = await proxyExecutorRequest(
      new Request("http://localhost:3010/validate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: "x".repeat(128) }),
      }),
      {
        path: "/validate-session",
        method: "POST",
        timeoutMs: 100,
        maxRequestBytes: 32,
      },
      { ...runtime, fetchImpl },
    );
    expect(response.status).toBe(413);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("rejects a non-JSON request", async () => {
    const fetchImpl = vi.fn();
    const response = await proxyExecutorRequest(
      new Request("http://localhost:3010/attest", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "test",
      }),
      { path: "/attest", method: "POST", timeoutMs: 100, maxRequestBytes: 32 },
      { ...runtime, fetchImpl },
    );
    expect(response.status).toBe(415);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("preserves a non-JSON executor rejection without exposing its body", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("internal upstream details", {
        status: 422,
        headers: { "Content-Type": "text/plain" },
      }),
    );
    const response = await proxyExecutorRequest(
      new Request("http://localhost:3010/validate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }),
      {
        path: "/validate-session",
        method: "POST",
        timeoutMs: 100,
        maxRequestBytes: 32,
      },
      { ...runtime, fetchImpl },
    );
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({ error: "Executor returned 422" });
  });
});
