"use client";

import { createContext, useContext, useMemo } from "react";
import { PulseSDK, type PulseConfig } from "@entros/pulse-sdk";
import { resolveRelayerTransport } from "@/lib/relay-transport";

const PulseContext = createContext<PulseSDK | null>(null);

export function PulseProvider({ children }: { children: React.ReactNode }) {
  const sdk = useMemo(() => {
    const relayer = resolveRelayerTransport({
      isDevelopment: process.env.NODE_ENV === "development",
      localProxyEnabled:
        process.env.NEXT_PUBLIC_ENTROS_LOCAL_EXECUTOR_PROXY === "1",
      browserOrigin: typeof window === "undefined" ? undefined : window.location.origin,
      publicRelayerUrl: process.env.NEXT_PUBLIC_RELAYER_URL,
      publicRelayerApiKey: process.env.NEXT_PUBLIC_RELAYER_API_KEY,
    });
    const config: PulseConfig = {
      cluster:
        (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as PulseConfig["cluster"]) ??
        "devnet",
      rpcEndpoint: process.env.NEXT_PUBLIC_SOLANA_RPC,
      relayerUrl: relayer.relayerUrl,
      relayerApiKey: relayer.relayerApiKey,
      wasmUrl: process.env.NEXT_PUBLIC_WASM_URL,
      zkeyUrl: process.env.NEXT_PUBLIC_ZKEY_URL,
      debug: process.env.NODE_ENV === "development",
      // Crypto-unavailable browsers (iOS Safari private mode, Brave shields,
      // Firefox TCP) hit this callback. `true` keeps the pre-1.3 plaintext
      // localStorage UX so baselines survive reload. Replacing this with a
      // user-prompt component is a future enhancement when we want to
      // surface the privacy choice explicitly to those users.
      onPrivacyFallback: async () => true,
    };
    return new PulseSDK(config);
  }, []);

  return (
    <PulseContext.Provider value={sdk}>{children}</PulseContext.Provider>
  );
}

export function usePulse(): PulseSDK {
  const ctx = useContext(PulseContext);
  if (!ctx) throw new Error("usePulse must be used within PulseProvider");
  return ctx;
}
