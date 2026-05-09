"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AlertTriangle } from "lucide-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

/**
 * SSR-safe match-media hook. Initializes to `false` on the server and
 * during the first client render to avoid hydration mismatches; resolves
 * to the real value on mount and on subsequent media-query changes.
 */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Mobile-only hint. Branches by platform: Android can use the Solana Mobile
 * Wallet Adapter to connect Phantom Mobile, but only if the wallet's
 * Developer Settings → Testnet Mode is on (otherwise the dApp's
 * `chain: "solana:devnet"` request gets silently rejected and the connect
 * flow looks like a dead-end). iOS has no MWA equivalent during devnet, so
 * the original "limited during devnet" copy still holds there.
 */
function MobileWalletHint() {
  const { connected } = useWallet();
  const isMobile = useMediaQuery("(max-width: 768px)");
  // SSR mismatch guard: initialize to false on server + first client render,
  // promote to the real value in useEffect. Same pattern useMediaQuery uses.
  const [isAndroid, setIsAndroid] = useState(false);
  useEffect(() => {
    setIsAndroid(/Android/i.test(navigator.userAgent));
  }, []);

  if (!isMobile || connected) return null;

  if (isAndroid) {
    return (
      <div className="mt-3 flex max-w-xs items-start gap-2 text-xs text-foreground/60 leading-relaxed">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
        <p className="text-left">
          On Android: enable Developer Settings in Phantom (Settings →
          Developer Settings → Testnet Mode → Solana Devnet) before
          connecting, and fund the wallet from the{" "}
          <a
            href="https://faucet.solana.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan underline hover:text-foreground transition-colors"
          >
            Solana faucet
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 flex max-w-xs items-start gap-2 text-xs text-foreground/60 leading-relaxed">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <p className="text-left">
        Mobile wallet connection is limited during devnet. Use Walletless mode,
        or open on desktop for the full wallet flow. Native mobile support
        arrives with the Solana Mobile app.
      </p>
    </div>
  );
}

/**
 * Desktop-only hint. Reminds users this is a devnet pilot and points them
 * to the Solana faucet for free devnet SOL plus the wallet network switch.
 */
function DevnetHint() {
  const { connected } = useWallet();
  const isDesktop = useMediaQuery("(min-width: 769px)");

  if (!isDesktop || connected) return null;

  return (
    <div className="mt-3 flex max-w-xs items-start gap-2 text-xs text-foreground/60 leading-relaxed">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
      <p className="text-left">
        Devnet pilot—switch your wallet to Devnet and grab free SOL from the{" "}
        <a
          href="https://faucet.solana.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan underline hover:text-foreground transition-colors"
        >
          Solana faucet
        </a>
        .
      </p>
    </div>
  );
}

export function WalletConnectButton({
  className,
  align = "center",
}: {
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <div
      className={`flex flex-col ${
        align === "start" ? "items-start" : "items-center"
      }`}
    >
      <WalletMultiButton className={className} />
      <MobileWalletHint />
      <DevnetHint />
    </div>
  );
}
