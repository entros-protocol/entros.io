"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { isUserRejection } from "@entros/pulse-sdk";
import { usePulse } from "@/components/providers/pulse-provider";

export interface PairedAuthorizationControl {
  /** The next tap can start a capture. */
  ready: boolean;
  /** The wallet prompt is open. */
  pending: boolean;
  /** Why the last request failed, in words for the person. */
  error: string | null;
  /**
   * Call it first in the tap that starts a capture. It returns true when the
   * capture can start in that tap. Otherwise it asks the wallet to sign, and
   * the capture starts on the next tap.
   */
  ensure: () => boolean;
  /**
   * Reports why a paired session failed. A relayer that refused it for want of
   * a usable authorization needs a new one, so the next tap asks the wallet.
   * Any other reason changes nothing.
   */
  reportRefusal: (reason: string | undefined) => void;
}

/** What the start control says while the wallet has not signed. */
export function pairedStartLabel(
  control: PairedAuthorizationControl,
  startLabel: string,
): string {
  if (control.ready) return startLabel;
  return control.pending ? "Waiting for wallet..." : "Authorize Wallet";
}

/** True for a refusal that a new authorization can clear. */
export function isPairedAuthorizationRefusal(reason: string | undefined): boolean {
  return reason === "authorization_required" || reason === "authorization_invalid";
}

// A grant fetched ahead of the tap lets the tap open the wallet prompt at once.
// It is fetched again on this interval, so one with enough lifetime is held.
const PREPARE_INTERVAL_MS = 60_000;

// The SDK decides when an authorization stops being usable and announces
// nothing, so a held one is read again on this interval.
const RECHECK_INTERVAL_MS = 10_000;

// The SDK names the error it raises when the wallet prompt does not settle in time.
const SDK_TIMEOUT_ERROR = "EntrosTimeoutError";

// The wallet adapter raises this for a signing failure, a declined prompt included.
const WALLET_SIGN_ERROR = "WalletSignMessageError";

const MESSAGES = {
  declined: "The wallet did not sign. Try again.",
  cannotSign: "This wallet cannot sign messages. Connect a wallet that can.",
  noResponse: "The wallet did not respond. Open it and try again.",
  tooLate: "The wallet prompt stayed open too long. Authorize again.",
  throttled: "Too many requests. Wait a moment, then try again.",
  service: "The verification service is unavailable. Try again.",
} as const;

/** The reason and status a refused request carries. */
function refusal(cause: unknown): { reason?: unknown; status?: unknown; name?: unknown } {
  return cause !== null && typeof cause === "object" ? cause : {};
}

function describeFailure(cause: unknown): string {
  if (isUserRejection(cause)) return MESSAGES.declined;
  const { reason, status, name } = refusal(cause);
  if (name === SDK_TIMEOUT_ERROR) return MESSAGES.noResponse;
  if (name === WALLET_SIGN_ERROR) return MESSAGES.cannotSign;
  if (status === 429) return MESSAGES.throttled;
  // Without a status the SDK refused the signature itself, before any request.
  if (status === undefined) {
    if (reason === "authorization_required") return MESSAGES.tooLate;
    if (reason === "invalid_request") return MESSAGES.cannotSign;
  }
  return MESSAGES.service;
}

// The SDK holds the authorization and announces no change to it. The hook
// announces each change it causes or can predict, so every control reads again.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function announce(): void {
  for (const listener of listeners) listener();
}

const pageHidden = () => document.visibilityState === "hidden";

/**
 * The wallet's authorization for paired sessions.
 *
 * A paired session starts inside one tap, because the microphone and motion
 * permissions need that gesture, so the wallet cannot be asked in the same tap.
 * The start control therefore asks the wallet first and starts the capture on
 * the next tap. One signature serves the visit until it expires.
 *
 * While no authorization is usable, the hook keeps a grant from the relayer in
 * the SDK, so the tap that asks the wallet opens its prompt at once. Some
 * browsers drop the gesture of a tap that waits on the network first.
 *
 * `view` names the screen the start control sits on. An error belongs to the
 * view where it arose and clears once the view changes.
 */
export function usePairedAuthorization(view: string): PairedAuthorizationControl {
  const pulse = usePulse();
  const { publicKey, signMessage } = useWallet();
  const address = publicKey?.toBase58() ?? null;
  // Each keyed to the wallet it concerns, so a wallet change leaves it behind.
  const [pendingFor, setPendingFor] = useState<string | null>(null);
  const [failure, setFailure] = useState<{
    address: string;
    view: string;
    message: string;
  } | null>(null);
  // A relayer without the authorization route asks for none.
  const [unsupportedFor, setUnsupportedFor] = useState<string | null>(null);
  const [prepareRound, setPrepareRound] = useState(0);

  // A wallet change also clears what the relayer said about the route, so a
  // later return to the earlier wallet asks again.
  const [seenAddress, setSeenAddress] = useState(address);
  if (seenAddress !== address) {
    setSeenAddress(address);
    setUnsupportedFor(null);
  }
  const [seenView, setSeenView] = useState(view);
  if (seenView !== view) {
    setSeenView(view);
    setFailure(null);
  }

  const pending = address !== null && pendingFor === address;
  const unsupported = address !== null && unsupportedFor === address;

  const held = useSyncExternalStore(
    subscribe,
    () => (address ? pulse.pairedAuthorization(address) : null),
    () => null,
  );

  // Read again while one is held, so the control changes once the SDK stops
  // returning it. A device that slept moves the wall clock without a timer.
  useEffect(() => {
    if (!held) return;
    const timer = setInterval(announce, RECHECK_INTERVAL_MS);
    const onVisibility = () => {
      if (!pageHidden()) announce();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [held]);

  const preparing = address !== null && held === null && !unsupported && !pending;
  useEffect(() => {
    if (!preparing || !address) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const prepare = () => {
      clearTimeout(timer);
      if (pageHidden()) return;
      pulse.preparePairedAuthorization(address).catch((cause: unknown) => {
        if (!cancelled && refusal(cause).reason === "unsupported_session") {
          setUnsupportedFor(address);
        }
        // Any other failure stays silent. The tap requests a grant itself.
      });
      timer = setTimeout(prepare, PREPARE_INTERVAL_MS);
    };
    const onVisibility = () => {
      if (pageHidden()) clearTimeout(timer);
      else prepare();
    };
    prepare();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [preparing, address, pulse, prepareRound]);

  function ensure(): boolean {
    if (!publicKey || !address) return false;
    // Read at the tap. A timer that ran late leaves the last render out of date.
    if (unsupported || pulse.pairedAuthorization(address)) return true;
    if (pending) return false;
    if (!signMessage) {
      setFailure({ address, view, message: MESSAGES.cannotSign });
      return false;
    }
    setPendingFor(address);
    setFailure(null);
    // With a prepared grant the SDK opens the prompt before it awaits anything.
    pulse
      .authorizePairedSession({ publicKey, signMessage })
      .then(
        () => {
          if (!pulse.pairedAuthorization(address)) {
            setFailure({ address, view, message: MESSAGES.tooLate });
          }
        },
        (cause: unknown) => {
          if (refusal(cause).reason === "unsupported_session") {
            setUnsupportedFor(address);
            return;
          }
          setFailure({ address, view, message: describeFailure(cause) });
        },
      )
      .finally(() => {
        setPendingFor((current) => (current === address ? null : current));
        announce();
      });
    return false;
  }

  function reportRefusal(reason: string | undefined): void {
    if (!isPairedAuthorizationRefusal(reason)) return;
    setUnsupportedFor(null);
    setPrepareRound((round) => round + 1);
    // The SDK drops the authorization the relayer refused.
    announce();
  }

  return {
    ready: held !== null || unsupported,
    pending,
    // A prompt that settles after its view is gone reports nothing.
    error: failure && failure.address === address && failure.view === view ? failure.message : null,
    ensure,
    reportRefusal,
  };
}
