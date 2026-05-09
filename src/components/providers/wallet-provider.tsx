"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  SolanaMobileWalletAdapter,
  createDefaultAddressSelector,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler,
} from "@solana-mobile/wallet-adapter-mobile";
import type { WalletError } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

const NETWORK = "devnet" as const;

// Storage key written by `@solana-mobile/wallet-standard-mobile`'s default
// authorization cache (verified against
// node_modules/@solana-mobile/wallet-standard-mobile/lib/cjs/index.js:1874).
// Cleared by handleWalletError on connection-class failures so a partial-
// or stale-grant authorization doesn't pin the next attempt to the same bad
// state — the adapter writes a fresh entry on the next successful connect.
const MWA_AUTH_CACHE_KEY = "SolanaMobileWalletAdapterDefaultAuthorizationCache";

interface WalletErrorContextValue {
  /** Latest user-visible message from the wallet adapter, or null. */
  lastError: string | null;
  /** Drops the surfaced error. Wired to the Verify page's auto-clear on
   *  successful connect and to the dismiss button on the error banner. */
  clearError: () => void;
}

const WalletErrorContext = createContext<WalletErrorContextValue | null>(null);

/**
 * Subscribe to wallet-adapter errors surfaced by the top-level WalletProvider.
 * Mirrors the shape of `usePulse()` in pulse-provider.tsx — context-or-throw
 * so consumers don't silently get a stale `null` if rendered outside the
 * provider tree.
 */
export function useWalletError(): WalletErrorContextValue {
  const ctx = useContext(WalletErrorContext);
  if (!ctx) {
    throw new Error("useWalletError must be used within WalletProvider");
  }
  return ctx;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_SOLANA_RPC ?? clusterApiUrl(NETWORK),
    [],
  );

  // Wallet error surface. SolanaWalletProvider's onError prop fires on every
  // adapter error (autoconnect failure, user dismissed wallet popup, devnet/
  // mainnet chain mismatch, network unavailable, etc.). The Verify page reads
  // `lastError` and renders a banner so failures don't silently disappear —
  // previously a Phantom-on-mainnet rejection or an Android MWA dead-end left
  // the user staring at an unchanged Connect button with no signal.
  const [lastError, setLastError] = useState<string | null>(null);
  const clearError = useCallback(() => setLastError(null), []);

  const errorContextValue = useMemo<WalletErrorContextValue>(
    () => ({ lastError, clearError }),
    [lastError, clearError],
  );

  const handleWalletError = useCallback((error: WalletError) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[wallet] error:", error.name, error.message);
    }
    setLastError(error.message || error.name);
    // Connection-attempt failures get the MWA authorization cache cleared so
    // a half-completed grant doesn't stick across retries. Operational
    // errors raised AFTER a successful connect (WalletNotConnectedError,
    // WalletPublicKeyError, WalletDisconnectedError) leave the cache alone —
    // they don't indicate an authorization problem and clearing the cache
    // would invalidate a working grant.
    if (
      error.name === "WalletConnectionError" ||
      error.name === "WalletNotReadyError" ||
      error.name === "WalletTimeoutError" ||
      error.name === "WalletWindowClosedError"
    ) {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(MWA_AUTH_CACHE_KEY);
        }
      } catch {
        // localStorage unavailable (private mode, quota exceeded, sandboxed
        // iframe). The adapter creates a fresh cache entry on the next
        // successful connect anyway; nothing to recover here.
      }
    }
  }, []);

  // Wallet Standard auto-detects every browser-extension wallet that implements
  // the standard (Phantom, Backpack, Solflare, Glow, MetaMask Snap, …) at
  // runtime via the `wallet-standard:register-wallet` event. The legacy
  // PhantomWalletAdapter previously listed here was redundant on Chrome and
  // actively broken on Firefox (stale `window.phantom.solana` detection
  // before the content script injected). Empty array + Wallet Standard is
  // the current Anza-recommended pattern; the only adapter we register
  // explicitly is the Mobile Wallet Adapter for Android, which Wallet
  // Standard cannot auto-detect because mobile browsers have no extensions.
  const wallets = useMemo(
    () => [
      new SolanaMobileWalletAdapter({
        addressSelector: createDefaultAddressSelector(),
        appIdentity: {
          name: "Entros Protocol",
          uri: "https://entros.io",
          icon: "/logos/Entros.png",
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        chain: "solana:devnet",
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      }),
    ],
    [],
  );

  return (
    <WalletErrorContext.Provider value={errorContextValue}>
      <ConnectionProvider endpoint={endpoint}>
        <SolanaWalletProvider
          wallets={wallets}
          autoConnect
          onError={handleWalletError}
        >
          <WalletModalProvider>{children}</WalletModalProvider>
        </SolanaWalletProvider>
      </ConnectionProvider>
    </WalletErrorContext.Provider>
  );
}
