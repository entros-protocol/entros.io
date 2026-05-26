"use client";

import { useEffect, useRef, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { type PulseSession, PROGRAM_IDS, fetchIdentityState } from "@entros/pulse-sdk";
import { fetchChallengeViaProxy } from "@/lib/relay-challenge";
import type { VerifyState, VerifyAction } from "@/components/verify/types";
import { PulseChallenge } from "@/components/verify/pulse-challenge";
import {
  ProvingView,
  SigningView,
  VerifiedView,
  FailedView,
  SoftFailedView,
} from "@/components/verify/step-views";
import { ResetBaselineDialog } from "@/components/verify/reset-baseline-dialog";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { ConnectedWalletPill } from "@/components/ui/connected-wallet-pill";
import { usePulse } from "@/components/providers/pulse-provider";
import { useWalletError } from "@/components/providers/wallet-provider";
import { Wallet } from "lucide-react";

function commitmentToHex(bytes: Uint8Array): string {
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// Mirrors `RESET_COOLDOWN_SECS` in `entros_anchor::lib.rs`. The on-chain
// program rejects a second reset within this window with Custom error
// 6012 (`ResetCooldownActive`); the pre-flight check below surfaces the
// same constraint before the user spends a capture session on a
// verification destined to revert. If the on-chain constant changes,
// update this number too — the post-submit branch in step-views still
// catches drift, but pre-flight false-negatives waste a capture cycle.
const RESET_COOLDOWN_SECS = 7 * 24 * 60 * 60;

// Soft-reject retry budget (master-list #94). When attemptsUsed < MAX_ATTEMPTS
// and the server returns a user-recoverable reason, the client routes to
// soft_failed (retry available) instead of failed (hard stop). Capped to
// bound bot retry benefit per wallet — the server-side per-wallet cap
// (master-list #94 C4) enforces this across wallet refreshes; this client
// counter just drives the UX inside a session.
const MAX_ATTEMPTS = 3;

// Set of safe-to-reveal validator reasons that route to the soft-fail
// retry UX instead of the hard-fail page. Must stay in sync with
// `entros-validation::ReasonCode::safe_label` (the server-side allowlist)
// and `SOFT_HINT` keys in `step-views.tsx` (the client-side hint
// dictionary). Drift in either direction means a soft-rejectable reason
// either escapes to hard-fail (annoying for the user) or slips into
// soft-fail without a hint (confusing). The trailing entry
// `validation_unavailable` is a client-side reason emitted by pulse-sdk
// when /validate-features is unreachable (network failure, timeout,
// abort) — treated as transient.
const RETRYABLE_REASONS: ReadonlySet<string> = new Set([
  "variance_floor",
  "entropy_bounds",
  "temporal_coupling_low",
  "phrase_content_mismatch",
  "validation_unavailable",
]);

// Defense-in-depth sanitizer for any error string about to be dispatched
// into the failure UI. The categorizer in step-views already routes the
// known leaky patterns (-32002, @solana/errors decode prompts, base58
// transaction blobs) into the validation-rejected surface that renders
// safe static copy — but if a future error class slips past the
// categorizer, this sanitizer strips the developer-facing decode hint
// and replaces long base58 sequences before the string can reach the
// generic-fallback render path. Preserves substrings the categorizer
// relies on for routing (`-32002`, `SendTransactionPreflightFailure`,
// `Custom`, `InstructionError`).
function sanitizeErrorMessage(message: string): string {
  // Strip @solana/errors developer-facing decode hints.
  let sanitized = message.replace(/Decode this error by running[^\n]*/gi, "");
  // Replace labeled transaction blobs (sig=..., Tx: ..., etc.) with a
  // placeholder while preserving the surrounding routing-relevant
  // substrings the categorizer needs.
  sanitized = sanitized.replace(
    /(?:Tx|tx|Transaction|sig)[:=]\s*[1-9A-HJ-NP-Za-km-z]{30,}/g,
    "[transaction]",
  );
  // Replace any standalone long base58 sequence (chunk hashes, transaction
  // signatures, raw account addresses serialized verbatim) with a placeholder.
  sanitized = sanitized.replace(/\b[1-9A-HJ-NP-Za-km-z]{40,}\b/g, "[blob]");
  // Strip Railway internal service URLs (and any `*.railway.internal` host)
  // that leak into reqwest-format upstream-failure messages from
  // executor-node when the validation-service is unreachable. Empirical
  // leak (2026-05-15): "error sending request for url
  // (http://serene-possibility.railway.internal:8080/validate)" surfaced
  // verbatim during a validator crash loop. Keep the leading "error
  // sending request" substring so the categorizer in step-views can
  // route it to validation-rejected; only the URL itself is the leak.
  sanitized = sanitized.replace(
    /https?:\/\/[\w.-]+\.railway\.internal(?::\d+)?(?:\/[^\s)]*)?/gi,
    "[internal]",
  );
  // Strip stack-trace frames so multi-line errors render as a single
  // user-readable sentence rather than a wall of internal call sites.
  sanitized = sanitized.replace(/^\s+at\s.*$/gm, "");
  // Collapse runs of blank lines left behind by the stack-strip pass.
  sanitized = sanitized.replace(/\n{2,}/g, "\n");
  return sanitized.trim();
}

export function VerifyWalletConnected({
  state,
  dispatch,
}: {
  state: VerifyState;
  dispatch: React.ActionDispatch<[action: VerifyAction]>;
}) {
  const { connected, wallet, publicKey } = useWallet();
  const { connection } = useConnection();
  const pulse = usePulse();
  // Wallet adapter error surface (e.g., Phantom devnet mismatch, Android MWA
  // dead-ends). Latest message is rendered as a banner above the Connect
  // button; clears automatically when the wallet successfully connects.
  const { lastError: walletError, clearError: clearWalletError } =
    useWalletError();
  const touchRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<PulseSession | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasMotion, setHasMotion] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [processingStage, setProcessingStage] = useState("Extracting features...");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  // Unix seconds of the connected wallet's most recent on-chain verification,
  // read directly from IdentityState offset 48. Used to render a cadence hint
  // explaining that Trust Score only increments after a 24-hour gap—the
  // sliding-window dedup in update_anchor's recency formula collapses
  // verifications inside the same 24h slice into one contribution, so
  // verifying twice within 24h is a UX surprise unless we flag it.
  const [lastVerificationTimestamp, setLastVerificationTimestamp] = useState<number | null>(null);
  // Trust score read from IdentityState offset 60 immediately after a
  // successful verification, used to populate the post-verify share card's
  // OG image + tweet copy. Keyed by the verification's tx signature so
  // that when the user resets and re-verifies the previous score doesn't
  // leak into the new share card during the brief refetch window. Reading
  // it as the derived `trustScore` (below) returns null whenever the
  // stored tx doesn't match the current verification.
  const [scoreForTx, setScoreForTx] = useState<{
    tx: string;
    score: number;
  } | null>(null);
  // Server-issued challenge phrase (master-list #89). Fetched from the
  // executor's /challenge endpoint during handleStart so the PulseChallenge
  // displays the authoritative phrase the validation service will
  // phoneme-match. Null when no fetch has happened yet or the executor was
  // unreachable—PulseChallenge falls back to client-generated copy in
  // that case and phrase content binding skips server-side (Tier 1 still
  // runs).
  const [challengePhrase, setChallengePhrase] = useState<string | null>(null);
  const startingRef = useRef(false);
  const voicedFramesRef = useRef(0);
  // Intent is tracked alongside the state-machine mirror so the
  // capture-completion handler can choose between verify vs reset paths
  // without reading the reducer state (which may race the handler).
  const intentRef = useRef<"verify" | "reset">("verify");
  // Per-session retry counter (incremented at the top of handleStart, reset
  // to 0 on RESET / VERIFICATION_SUCCESS). The cap and retryable-reason set
  // are hoisted to module scope at the top of this file.
  const attemptsUsedRef = useRef(0);

  // Microphone permission pre-flight. Browsers that previously denied
  // microphone access never re-prompt — the user has to manually re-enable
  // the permission in browser settings. Without this pre-flight, the user
  // would click Start, capture would fail mid-session, and they'd see the
  // post-capture FailedView with no understanding that the cause is a stale
  // browser permission state. Querying upfront lets us render an explicit
  // banner before the click so the failure is preempted, not surfaced
  // mid-flow. Browsers that don't support the Permissions API (older Safari,
  // some Firefox builds) keep state at "unknown" and fall back to the
  // post-capture failure path.
  const [micPermissionState, setMicPermissionState] = useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");
  useEffect(() => {
    setHasMotion(navigator.maxTouchPoints > 0);
  }, []);
  // Drop the surfaced wallet error once the wallet successfully connects.
  // Keeps the banner from lingering after a retry that resolved the issue
  // (e.g., user toggled Phantom to devnet and reconnected). `clearWalletError`
  // is stable across the provider's lifetime (memoized with []), so it
  // doesn't belong in the dep array.
  useEffect(() => {
    if (connected) clearWalletError();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clearWalletError is provider-stable
  }, [connected]);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return;
    }
    let cancelled = false;
    let status: PermissionStatus | null = null;
    const handleChange = () => {
      if (!cancelled && status) {
        setMicPermissionState(
          status.state as "granted" | "denied" | "prompt",
        );
      }
    };
    navigator.permissions
      // The "microphone" name is in the W3C Permissions API spec but missing
      // from some older `PermissionName` type unions; cast through unknown to
      // satisfy strict TypeScript without losing the runtime behavior.
      .query({ name: "microphone" as unknown as PermissionName })
      .then((s) => {
        if (cancelled) return;
        status = s;
        setMicPermissionState(s.state as "granted" | "denied" | "prompt");
        s.addEventListener("change", handleChange);
      })
      .catch(() => {
        // Permissions API rejected (Firefox sometimes throws on unsupported
        // names rather than returning a result). Leave state at "unknown"
        // and let the post-capture FailedView handle any actual denial.
      });
    return () => {
      cancelled = true;
      if (status) status.removeEventListener("change", handleChange);
    };
  }, []);

  // Pull `last_verification_timestamp` from IdentityState when a wallet with
  // an existing on-chain anchor is connected. Only used for the cadence hint
  // below; fails silently if the account doesn't exist or the fetch errors
  // (first-time users + network blips render the idle view without the hint).
  useEffect(() => {
    if (!publicKey || !connected) {
      setLastVerificationTimestamp(null);
      return;
    }
    let cancelled = false;
    const programId = new PublicKey(PROGRAM_IDS.entrosAnchor);
    const [identityPda] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("identity"), publicKey.toBuffer()],
      programId,
    );
    connection
      .getAccountInfo(identityPda)
      .then((account: { data: Uint8Array } | null) => {
        if (cancelled || !account || account.data.length < 56) return;
        const view = new DataView(
          account.data.buffer,
          account.data.byteOffset,
          account.data.byteLength,
        );
        const ts = Number(view.getBigInt64(48, true));
        if (ts > 0) setLastVerificationTimestamp(ts);
      })
      .catch(() => {
        /* silent—hint just doesn't render */
      });
    return () => {
      cancelled = true;
    };
  }, [publicKey, connected, connection]);

  // After a successful verification (NOT a baseline reset), read the
  // updated trust score from IdentityState so the post-verify share card
  // can render it. The effect is scoped to a derived signal that flips
  // only on the verified→txSignature transition, so it can't refire on
  // unrelated re-renders. Explicit "confirmed" commitment avoids reading
  // pre-tx state during the brief window after VERIFICATION_SUCCESS
  // dispatches but before the RPC's account cache catches up.
  const verifySuccessTx =
    state.step === "verified" && state.intent === "verify"
      ? state.txSignature ?? null
      : null;
  useEffect(() => {
    if (!verifySuccessTx || !publicKey) return;
    let cancelled = false;
    const programId = new PublicKey(PROGRAM_IDS.entrosAnchor);
    const [identityPda] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("identity"), publicKey.toBuffer()],
      programId,
    );
    connection
      .getAccountInfo(identityPda, "confirmed")
      .then((account: { data: Uint8Array } | null) => {
        if (cancelled || !account || account.data.length < 62) return;
        const view = new DataView(
          account.data.buffer,
          account.data.byteOffset,
          account.data.byteLength,
        );
        setScoreForTx({ tx: verifySuccessTx, score: view.getUint16(60, true) });
      })
      .catch(() => {
        /* silent — share card omits the score when the fetch fails */
      });
    return () => {
      cancelled = true;
    };
  }, [verifySuccessTx, publicKey, connection]);
  const trustScore =
    scoreForTx && verifySuccessTx && scoreForTx.tx === verifySuccessTx
      ? scoreForTx.score
      : null;

  async function handleStart(intent: "verify" | "reset" = "verify") {
    if (startingRef.current) return;
    startingRef.current = true;
    // Verify and reset are different operations and must not share the
    // retry budget. If the user just exhausted 3 verify attempts and now
    // clicks "Reset baseline", the reset capture starts with a fresh
    // budget—otherwise any borderline failure during reset would
    // immediately route to hard-fail (because attemptsUsedRef >= MAX).
    if (intentRef.current !== intent) {
      attemptsUsedRef.current = 0;
    }
    intentRef.current = intent;
    setRequesting(true);
    setChallengePhrase(null);
    // Reset the voiced-frame counter before any await so a synchronous
    // throw in startMotion / challenge fetch can't leak the previous
    // attempt's count into the rejection-path override evaluation in
    // handleCaptureComplete.
    voicedFramesRef.current = 0;
    // Count this attempt against the (intent-scoped) session budget.
    // Soft-fail / hard-fail routing in handleCaptureComplete reads from
    // this counter.
    attemptsUsedRef.current += 1;

    try {
      // Fire the challenge fetch in parallel with sensor setup. We do NOT
      // await this before requesting motion permission: `DeviceMotionEvent
      // .requestPermission()` on iOS consumes the active user-gesture token,
      // and awaiting a network round-trip between the click and the motion
      // prompt silently drops that token—motion permission denied.
      // Awaiting happens after audio/motion/touch permissions resolve but
      // before START_CAPTURE; null → fail the verification with a clear
      // error rather than silently fall back to nonsense.
      const challengePromise: Promise<string | null> = publicKey
        ? fetchChallengeViaProxy(publicKey.toBase58())
            .then((c) => c.phrase)
            .catch((err: unknown) => {
              if (process.env.NODE_ENV === "development") {
                const msg = err instanceof Error ? err.message : String(err);
                console.warn(`[verify] challenge fetch failed: ${msg}`);
              }
              return null;
            })
        : Promise.resolve(null);

      // Always attach touch capture to document.body. The PulseChallenge
      // curve DIV is only mounted AFTER we dispatch START_CAPTURE below, so
      // touchRef.current at this point is either null (first run) or a
      // detached node from a prior render (retained because
      // pulse-challenge.tsx assigns the ref manually in a useEffect with
      // no unmount cleanup). Using the detached node silently broke the
      // reset flow: pointer events fired on the new DIV but listeners sat
      // on the dead one, yielding 0 touch samples.
      const session = pulse.createSession(document.body);
      sessionRef.current = session;

      // Motion first—DeviceMotionEvent.requestPermission() requires an active
      // user gesture on iOS. getUserMedia does not. If audio goes first, the gesture
      // token is consumed by the mic dialog and motion is silently denied.
      if (hasMotion) {
        try {
          await session.startMotion();
          if (!session.isMotionCapturing()) {
            dispatch({
              type: "VERIFICATION_FAILED",
              error: "Motion permission denied. Please allow motion access and try again.",
            });
            return;
          }
        } catch {
          dispatch({
            type: "VERIFICATION_FAILED",
            error: "Motion permission denied. Please allow motion access and try again.",
          });
          return;
        }
      } else {
        session.skipMotion();
      }

      // Audio second—getUserMedia works without a gesture on secure origins
      try {
        let audioFrameCount = 0;
        await session.startAudio((rms) => {
          if (rms > 0.008) voicedFramesRef.current++;
          audioFrameCount++;
          if (audioFrameCount % 2 === 0) setAudioLevel(rms);
        });
      } catch {
        dispatch({
          type: "VERIFICATION_FAILED",
          error: "Microphone access denied. Please allow microphone permission and try again.",
        });
        return;
      }

      session.startTouch().catch(() => session.skipTouch());

      // Await the parallel challenge fetch now that permissions have
      // resolved. The 3-second countdown inside PulseChallenge gives
      // another buffer for slow networks before the phrase appears.
      // Fail the verification if no phrase came back: the previous
      // silent fallback to client-generated nonsense produced a broken
      // UX (users saw gibberish syllables) and bypassed phrase content
      // binding server-side.
      const phrase = await challengePromise;
      if (!phrase) {
        dispatch({
          type: "VERIFICATION_FAILED",
          error: "Verification service unavailable. Please refresh and try again.",
        });
        return;
      }
      setChallengePhrase(phrase);

      dispatch({ type: "START_CAPTURE", intent });
    } finally {
      startingRef.current = false;
      setRequesting(false);
    }
  }

  async function handleResetBaselineClick() {
    if (!publicKey) {
      setResetDialogOpen(true);
      return;
    }

    try {
      const identity = await fetchIdentityState(publicKey.toBase58(), connection);
      if (identity && identity.lastResetTimestamp > 0) {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - identity.lastResetTimestamp;
        if (elapsed < RESET_COOLDOWN_SECS) {
          // Synthesize an error string the categorizer in step-views
          // recognizes as 6012, with the unlock timestamp encoded so the
          // FailedView can render a specific date instead of generic copy.
          const unlockTs = identity.lastResetTimestamp + RESET_COOLDOWN_SECS;
          const unlockIso = new Date(unlockTs * 1000).toISOString();
          dispatch({
            type: "VERIFICATION_FAILED",
            error: `Reset on cooldown. {"InstructionError":[0,{"Custom":6012}]} unlock_at=${unlockIso}`,
          });
          return;
        }
      }
    } catch {
      // Pre-flight fetch failed (network blip, RPC hiccup). Fall through
      // to the dialog—the user will see the on-chain revert if cooldown
      // actually applies. Same UX as before this pre-flight existed.
    }
    setResetDialogOpen(true);
  }

  async function handleResetBaselineConfirm() {
    setResetDialogOpen(false);
    // The state machine allows START_CAPTURE from failed (see reducer).
    // Dispatch with reset intent; handleCaptureComplete will route to
    // session.completeReset() because intentRef is now "reset".
    await handleStart("reset");
  }

  async function handleCaptureComplete() {
    const session = sessionRef.current;
    if (!session) return;

    try { await session.stopAudio(); } catch { /* skipped */ }
    try { await session.stopMotion(); } catch { /* skipped */ }
    try { await session.stopTouch(); } catch { /* skipped */ }

    dispatch({ type: "CAPTURE_DONE" });

    const PROOF_TIMEOUT_MS = 60_000;
    const proofPromise =
      intentRef.current === "reset"
        ? session.completeReset(wallet?.adapter, connection, (stage) => {
            setProcessingStage(stage);
          })
        : session.complete(wallet?.adapter, connection, (stage) => {
            setProcessingStage(stage);
          });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Proof generation timed out. Please try again.")), PROOF_TIMEOUT_MS)
    );

    Promise.race([proofPromise, timeoutPromise])
      .then((result) => {
        dispatch({ type: "PROOF_COMPLETE" });
        if (result.success) {
          attemptsUsedRef.current = 0;
          dispatch({
            type: "VERIFICATION_SUCCESS",
            commitment: commitmentToHex(result.commitment),
            txSignature: result.txSignature,
          });
          return;
        }
        const reason = result.reason;
        const canRetry =
          typeof reason === "string" &&
          RETRYABLE_REASONS.has(reason) &&
          attemptsUsedRef.current < MAX_ATTEMPTS;
        if (canRetry) {
          dispatch({
            type: "VERIFICATION_SOFT_FAILED",
            reason: reason as string,
            attemptsRemaining: MAX_ATTEMPTS - attemptsUsedRef.current,
          });
          return;
        }
        // Override the generic failure copy ONLY when our local observation
        // is unambiguous: the audio callback never saw a single voiced frame
        // across the whole 12-second capture. That binary client-side
        // signal — "the user could not have produced audible speech" — is
        // independent of whatever reason the server actually rejected on,
        // so the override doesn't reveal whether the underlying server
        // rejection was acoustic-content (TtsDetected) or
        // identity-collision (SybilMatch). Both reasons are deliberately
        // returned without a safe label by the validator to keep the
        // detection layers opaque to attackers; mapping a "low but
        // non-zero" voicing count to a mic-specific message would leak
        // that the failure was acoustic. Strict zero keeps the override
        // honest.
        let errorMessage = result.error ?? "Verification failed";
        if (!reason && voicedFramesRef.current === 0) {
          errorMessage =
            "Microphone audio too quiet. Check that the right microphone is selected, that it isn't muted at the OS level, and that audio is reaching the page.";
        }
        dispatch({
          type: "VERIFICATION_FAILED",
          error: sanitizeErrorMessage(errorMessage),
        });
      })
      .catch((err: Error) => {
        dispatch({
          type: "VERIFICATION_FAILED",
          error: sanitizeErrorMessage(err.message ?? "Unexpected error"),
        });
      });
  }

  function handleReset() {
    sessionRef.current = null;
    (touchRef as React.MutableRefObject<HTMLDivElement | null>).current = null;
    setAudioLevel(0);
    // Wipe the retry budget when the user explicitly resets—a fresh
    // session starts at 0 attempts used.
    attemptsUsedRef.current = 0;
    dispatch({ type: "RESET" });
  }

  if (!connected) {
    return (
      <div className="text-center space-y-6">
        <Wallet className="mx-auto h-10 w-10 text-muted" strokeWidth={1.5} />
        <p className="text-foreground/70 max-w-md mx-auto">
          Connect your Solana wallet to verify with full self-custody. You sign
          the verification transaction directly.
        </p>
        {walletError && (
          <div className="mx-auto max-w-sm rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
            <div className="flex items-start gap-2">
              <p className="flex-1 text-left text-xs text-foreground/70 leading-relaxed">
                Wallet didn&apos;t connect: {walletError}
              </p>
              <button
                type="button"
                onClick={clearWalletError}
                className="text-xs text-foreground/40 hover:text-foreground transition-colors"
                aria-label="Dismiss wallet error"
              >
                &times;
              </button>
            </div>
          </div>
        )}
        <WalletConnectButton className="!rounded-full !border !border-border !bg-surface !text-foreground !font-mono !text-sm" />
      </div>
    );
  }

  if (state.step === "idle") {
    // 24-hour cadence hint: the Trust Score recency dedup in update_anchor
    // collapses verifications inside a single 24h window into one bucket, so
    // verifying sooner than 24h after the last attempt won't produce a
    // recency bump (and older entries aging can make the score slightly
    // dip). Surface a one-line explainer so users don't get surprised.
    const DAY_SEC = 86400;
    const nowSec = Math.floor(Date.now() / 1000);
    const secondsSinceLastVerif =
      lastVerificationTimestamp !== null ? nowSec - lastVerificationTimestamp : null;
    const showCadenceHint =
      secondsSinceLastVerif !== null &&
      secondsSinceLastVerif >= 0 &&
      secondsSinceLastVerif < DAY_SEC;
    const hoursAgo =
      showCadenceHint && secondsSinceLastVerif !== null
        ? Math.floor(secondsSinceLastVerif / 3600)
        : 0;
    const hoursUntilNext =
      showCadenceHint && secondsSinceLastVerif !== null
        ? Math.max(1, Math.ceil((DAY_SEC - secondsSinceLastVerif) / 3600))
        : 0;
    const hoursAgoLabel =
      hoursAgo === 0 ? "less than an hour" : `${hoursAgo} hour${hoursAgo === 1 ? "" : "s"}`;
    const hoursUntilNextLabel =
      hoursUntilNext === 1 ? "1 more hour" : `${hoursUntilNext} more hours`;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-4 inline-flex">
            <ConnectedWalletPill size="sm" />
          </div>
          <p className="font-mono text-base font-semibold text-foreground">
            Behavioral Verification
          </p>
          <p className="mt-2 text-sm text-foreground/70 max-w-sm mx-auto">
            Speak a phrase while tracing a shape. All sensors record
            simultaneously for 12 seconds. Then sign with your wallet.
          </p>
        </div>
        <div className={`grid gap-4 mx-auto max-w-sm ${hasMotion ? "grid-cols-3" : "grid-cols-2"}`}>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-cyan font-mono text-xl font-bold">1</span>
            <span className="text-sm text-foreground/70">Speak the displayed phrase</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-solana-green font-mono text-xl font-bold">2</span>
            <span className="text-sm text-foreground/70">Trace the curve on screen</span>
          </div>
          {hasMotion && (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-solana-purple font-mono text-xl font-bold">3</span>
              <span className="text-sm text-foreground/70">Move naturally throughout</span>
            </div>
          )}
        </div>
        {showCadenceHint && (
          <div className="mx-auto max-w-sm rounded-lg border border-cyan/20 bg-cyan/5 px-4 py-3">
            <p className="text-center text-xs text-foreground/70 leading-relaxed">
              You verified {hoursAgoLabel} ago. Trust Score increments fully
              when verifications are spaced 24+ hours apart—wait{" "}
              {hoursUntilNextLabel} for the next bump.
            </p>
          </div>
        )}
        {micPermissionState === "denied" && (
          <div className="mx-auto max-w-sm rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
            <p className="text-center text-xs text-foreground/70 leading-relaxed">
              Microphone access is blocked for this site. Click the lock icon
              in your address bar, set Microphone to Allow, then refresh this
              page to verify.
            </p>
          </div>
        )}
        <div className="flex justify-center">
          <button
            onClick={() => handleStart("verify")}
            disabled={requesting || micPermissionState === "denied"}
            className="
              inline-flex items-center justify-center gap-2
              rounded-full bg-foreground px-6 py-3
              text-sm font-medium text-background
              transition-colors hover:bg-foreground/90
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {requesting ? "Requesting access..." : "Start Verification"}
          </button>
        </div>
        <p className="text-center text-xs text-muted">
          Raw data is never stored. Only the ZK proof and a statistical summary persist.
        </p>
      </div>
    );
  }

  if (state.step === "capturing") {
    // Invariant: handleStart only dispatches START_CAPTURE after the
    // server-issued phrase is in state, so challengePhrase is non-null
    // here. Guard kept for type safety.
    if (!challengePhrase) {
      return null;
    }
    return (
      <PulseChallenge
        onComplete={handleCaptureComplete}
        touchRef={touchRef}
        audioLevel={audioLevel}
        hasMotion={hasMotion}
        phrase={challengePhrase}
      />
    );
  }

  if (state.step === "processing") return <ProvingView stage={processingStage} />;
  if (state.step === "signing") return <SigningView />;

  if (state.step === "soft_failed") {
    return (
      <SoftFailedView
        reason={state.reason}
        attemptsRemaining={state.attemptsRemaining}
        onTryAgain={() => handleStart(state.intent)}
        onCancel={handleReset}
      />
    );
  }

  if (state.step === "verified") {
    const wasReset = state.intent === "reset";
    return (
      <VerifiedView
        commitment={state.commitment}
        txSignature={state.txSignature}
        title={wasReset ? "Baseline reset" : "Verified"}
        subtitle={
          wasReset
            ? "Fresh baseline stored on this device. Trust Score starts at 0 and rebuilds with future verifications."
            : "Transaction confirmed on Solana devnet"
        }
        tryAgainLabel={wasReset ? "Verify now" : "Verify again"}
        onReset={handleReset}
        walletPubkey={publicKey?.toBase58()}
        trustScore={trustScore}
        showShare={!wasReset}
      />
    );
  }

  if (state.step === "failed") {
    return (
      <>
        <FailedView
          error={state.error}
          onReset={handleReset}
          onResetBaseline={handleResetBaselineClick}
        />
        <ResetBaselineDialog
          open={resetDialogOpen}
          onCancel={() => setResetDialogOpen(false)}
          onConfirm={handleResetBaselineConfirm}
        />
      </>
    );
  }

  return null;
}
