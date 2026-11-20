"use client";

import dynamic from "next/dynamic";
import { useCallback, useSyncExternalStore } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { AlertTriangle } from "lucide-react";
import { ConnectedWalletPill } from "@/components/ui/connected-wallet-pill";

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
  const subscribe = useCallback((notify: () => void) => {
    const mq = window.matchMedia(query);
    const handler = () => notify();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [query]);
  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

const subscribeToStaticBrowserValue = () => () => undefined;
const readAndroidPlatform = () => /Android/i.test(navigator.userAgent);
const readServerAndroidPlatform = () => false;
const readMobileUserAgent = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
const readServerMobileUserAgent = () => false;

/**
 * True only for mobile devices (mobile user agent, or narrow touch viewport).
 * Desktop popups such as the 460px embed window have a fine pointer and desktop
 * UA, so they must not show the "Open on desktop" mobile warning.
 */
function useIsMobileDevice(): boolean {
  const isNarrow = useMediaQuery("(max-width: 768px)");
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");
  const isMobileUa = useSyncExternalStore(
    subscribeToStaticBrowserValue,
    readMobileUserAgent,
    readServerMobileUserAgent,
  );
  return isMobileUa || (isNarrow && isCoarsePointer);
}

/**
 * Mobile-only hint. Branches by platform: Android can use the Solana Mobile
 * Wallet Adapter to connect Phantom Mobile when Testnet Mode is on; iOS has
 * no MWA equivalent during devnet.
 */
function MobileWalletHint() {
  const { connected } = useWallet();
  const isMobile = useIsMobileDevice();
  const isAndroid = useSyncExternalStore(
    subscribeToStaticBrowserValue,
    readAndroidPlatform,
    readServerAndroidPlatform,
  );

  if (!isMobile || connected) return null;

  if (isAndroid) {
    return (
      <div className="mt-3 flex max-w-xs items-start gap-2 text-xs text-foreground/60 leading-relaxed">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
        <p className="text-left">
          On Android: turn on Developer Settings in Phantom (Settings,
          Developer Settings, Testnet Mode, Solana Devnet) before
          connecting, and add free SOL from the{" "}
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
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
      <p className="text-left">
        Mobile wallet connection is limited during devnet. Open on desktop for
        the full wallet flow. Native mobile support arrives with the Solana
        Mobile app.
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
  const isMobile = useIsMobileDevice();

  if (isMobile || connected) return null;

  return (
    <div className="mt-3 flex max-w-xs items-start gap-2 text-xs text-foreground/60 leading-relaxed">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
      <p className="text-left">
        Solana Devnet pilot. Switch your wallet to Devnet and add free SOL from
        the{" "}
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
  showDesktopHint = true,
}: {
  className?: string;
  align?: "start" | "center";
  showDesktopHint?: boolean;
}) {
  const { connected } = useWallet();

  return (
    <div
      className={`flex flex-col ${
        align === "start" ? "items-start" : "items-center"
      }`}
    >
      {connected ? (
        <ConnectedWalletPill />
      ) : (
        <WalletMultiButton className={className} />
      )}
      <MobileWalletHint />
      {showDesktopHint && <DevnetHint />}
    </div>
  );
}
