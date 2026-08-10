"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  type PulseSession,
  type LissajousParams,
  type CurveTracePoint,
  PROGRAM_IDS,
  fetchIdentityState,
  reasonDisposition,
  isClientOriginReason,
  phaseChargesAttempt,
  MAX_VERIFICATION_MS,
  createStudyContext,
  type StudyRecordStatus,
} from "@entros/pulse-sdk";
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
import type { ActiveStudyGrant } from "@/lib/population-study";

function commitmentToHex(bytes: Uint8Array): string {
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

import { evaluateResetCooldown } from "@/lib/cooldown";
import { sanitizeErrorMessage } from "@/lib/sanitize-error";

// Soft-reject retry budget. When attemptsUsed < MAX_ATTEMPTS
// and the server returns a user-recoverable reason, the client routes to
// soft_failed (retry available) instead of failed (hard stop). Capped to
// bound bot retry benefit per wallet — the server-side per-wallet cap
// enforces this across wallet refreshes; this client
// counter just drives the UX inside a session.
const MAX_ATTEMPTS = 3;

const subscribeToStaticCapability = () => () => undefined;
const readMotionCapability = () => navigator.maxTouchPoints > 0;
const readServerMotionCapability = () => false;

// The retryable-reason list used to live here as a literal, alongside five
// other copies across this repo and entros-mobile. They had drifted: the same
// rejection offered a retry here and dead-ended on mobile. `reasonDisposition`
// from the SDK is now the only thing that classifies a reason, so there is
// nothing left to keep in sync.

export function VerifyWalletConnected({
  state,
  dispatch,
  studyGrant,
  studyCaptureBlocked = false,
  onStudyRecordStatus,
  onStudyNextTrial,
  onStudyLeave,
  studyNextTrialAvailable = false,
  studyNextTrialPending = false,
  studySessionActive = false,
}: {
  state: VerifyState;
  dispatch: React.ActionDispatch<[action: VerifyAction]>;
  studyGrant?: ActiveStudyGrant | null;
  studyCaptureBlocked?: boolean;
  onStudyRecordStatus?: (status: StudyRecordStatus | undefined) => void | Promise<void>;
  onStudyNextTrial?: () => void | Promise<void>;
  onStudyLeave?: () => void;
  studyNextTrialAvailable?: boolean;
  studyNextTrialPending?: boolean;
  studySessionActive?: boolean;
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
  const hasMotion = useSyncExternalStore(
    subscribeToStaticCapability,
    readMotionCapability,
    readServerMotionCapability,
  );
  const [requesting, setRequesting] = useState(false);
  const [processingStage, setProcessingStage] = useState("Extracting features...");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  // Unix seconds of the connected wallet's most recent on-chain verification,
  // read directly from IdentityState offset 48. Used to render a cadence hint
  // explaining that Trust Score only increments after a 24-hour gap—the
  // sliding-window dedup in update_anchor's recency formula collapses
  // verifications inside the same 24h slice into one contribution, so
  // verifying twice within 24h is a UX surprise unless we flag it.
  const [verificationTimestamp, setVerificationTimestamp] = useState<{
    wallet: string;
    value: number | null;
  } | null>(null);
  const connectedWallet = connected && publicKey ? publicKey.toBase58() : null;
  const lastVerificationTimestamp =
    verificationTimestamp?.wallet === connectedWallet
      ? verificationTimestamp.value
      : null;
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
  // Server-issued challenge phrase. Fetched from the
  // executor's /challenge endpoint during handleStart so the PulseChallenge
  // displays the authoritative phrase the validation service will
  // phoneme-match. Null when no fetch has happened yet or the executor was
  // unreachable—PulseChallenge falls back to client-generated copy in
  // that case and phrase content binding skips server-side (Tier 1 still
  // runs).
  const [challengePhrase, setChallengePhrase] = useState<string | null>(null);
  const [challengeCurve, setChallengeCurve] = useState<LissajousParams | undefined>(undefined);
  const startingRef = useRef(false);
  const voicedFramesRef = useRef(0);
  // Intent is tracked alongside the state-machine mirror so the
  // capture-completion handler can choose between verify vs reset paths
  // without reading the reducer state (which may race the handler).
  const intentRef = useRef<"verify" | "reset">("verify");
  // Per-session retry counter. Incremented once a server has actually
  // rendered a verdict on a capture, and reset to 0 on RESET and on
  // VERIFICATION_SUCCESS. Never charged for a failure the SDK raised on its
  // own, and never for a failure outside the `validation` phase. See
  // `phaseChargesAttempt` and `isClientOriginReason` at the increment site.
  const attemptsUsedRef = useRef(0);
  // Failures that never reached a verdict get their own budget rather than no
  // budget. Charging them to the verification cap punishes a user for a
  // dropped connection; exempting them entirely, which is what the first cut
  // of this did, leaves the soft-retry loop unbounded. `validation_unavailable`
  // and `validation_timeout` are both client-origin AND retryable, so the cap
  // test could never fail and the screen offered "3 attempts left" forever.
  const transportFailuresRef = useRef(0);

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
      return;
    }
    let cancelled = false;
    const walletAddress = publicKey.toBase58();
    const programId = new PublicKey(PROGRAM_IDS.entrosAnchor);
    const [identityPda] = PublicKey.findProgramAddressSync(
      [new TextEncoder().encode("identity"), publicKey.toBuffer()],
      programId,
    );
    connection
      .getAccountInfo(identityPda)
      .then((account: { data: Uint8Array } | null) => {
        if (cancelled) return;
        if (!account || account.data.length < 56) {
          setVerificationTimestamp({ wallet: walletAddress, value: null });
          return;
        }
        const view = new DataView(
          account.data.buffer,
          account.data.byteOffset,
          account.data.byteLength,
        );
        const ts = Number(view.getBigInt64(48, true));
        setVerificationTimestamp({
          wallet: walletAddress,
          value: ts > 0 ? ts : null,
        });
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
    fetchIdentityState(publicKey.toBase58(), connection)
      .then((identity) => {
        if (cancelled || !identity) return;
        setScoreForTx({ tx: verifySuccessTx, score: identity.trustScore });
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
    if (studyCaptureBlocked) return;
    if (startingRef.current) return;
    startingRef.current = true;
    // Verify and reset are different operations and must not share the
    // retry budget. If the user just exhausted 3 verify attempts and now
    // clicks "Reset baseline", the reset capture starts with a fresh
    // budget—otherwise any borderline failure during reset would
    // immediately route to hard-fail (because attemptsUsedRef >= MAX).
    if (intentRef.current !== intent) {
      attemptsUsedRef.current = 0;
      transportFailuresRef.current = 0;
    }
    intentRef.current = intent;
    setRequesting(true);
    setChallengePhrase(null);
    setChallengeCurve(undefined);
    // Reset the voiced-frame counter before any await so a synchronous
    // throw in startMotion / challenge fetch can't leak the previous
    // attempt's count into the rejection-path override evaluation in
    // handleCaptureComplete.
    voicedFramesRef.current = 0;
    // Fire reset cooldown pre-flight in parallel with iOS gesture-bound motion setup.
    // Awaiting RPC network I/O before startMotion() drops the iOS gesture token,
    // so we launch the fetch here and await it after motion setup completes.
    const cooldownPromise: Promise<boolean> =
      intent === "reset" && publicKey
        ? checkResetCooldown(publicKey)
        : Promise.resolve(false);

    try {
      // Fire the challenge fetch in parallel with sensor setup. We do NOT
      // await this before requesting motion permission: `DeviceMotionEvent
      // .requestPermission()` on iOS consumes the active user-gesture token,
      // and awaiting a network round-trip between the click and the motion
      // prompt silently drops that token—motion permission denied.
      // Awaiting happens after audio/motion/touch permissions resolve but
      // before START_CAPTURE; null → fail the verification with a clear
      // error rather than silently fall back to nonsense.
      const challengePromise: Promise<{ phrase: string; curve?: LissajousParams } | null> = publicKey
        ? fetchChallengeViaProxy(publicKey.toBase58())
            .then((c) => ({ phrase: c.phrase, curve: c.curve }))
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
      const studyContext = studyGrant
        ? createStudyContext(
            {
              token: studyGrant.token,
              feature_schema_version: studyGrant.definition.feature_schema_version,
              projection_version: studyGrant.definition.projection_version,
            },
            navigator.maxTouchPoints > 0 ? "web-mobile" : "web-desktop",
          )
        : undefined;
      const session = pulse.createSession(document.body, studyContext);
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
              failedAt: "capture",
            });
            return;
          }
        } catch {
          dispatch({
            type: "VERIFICATION_FAILED",
            error: "Motion permission denied. Please allow motion access and try again.",
            failedAt: "capture",
          });
          return;
        }
      } else {
        session.skipMotion();
      }

      // Check the parallel cooldown pre-flight now that motion setup has consumed
      // the gesture token. If on cooldown, stop motion and exit before mic/touch start.
      const isCooldownActive = await cooldownPromise;
      if (isCooldownActive) {
        try {
          await session.stopMotion();
        } catch {
          /* cleanup */
        }
        return;
      }

      // The attempt is counted on the verdict, not here. See the increment in
      // the result handler below.

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
          failedAt: "capture",
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
      const challenge = await challengePromise;
      if (!challenge || !challenge.phrase) {
        dispatch({
          type: "VERIFICATION_FAILED",
          error: "Verification service unavailable. Please refresh and try again.",
          // The challenge fetch is part of setting the capture up, and its
          // failure is the relayer being unreachable.
          failedAt: "capture",
        });
        return;
      }
      setChallengePhrase(challenge.phrase);
      setChallengeCurve(challenge.curve);

      dispatch({ type: "START_CAPTURE", intent });
    } finally {
      startingRef.current = false;
      setRequesting(false);
    }
  }

  async function checkResetCooldown(pubKey: PublicKey): Promise<boolean> {
    try {
      const identity = await fetchIdentityState(pubKey.toBase58(), connection);
      if (identity) {
        const result = evaluateResetCooldown(identity.lastResetTimestamp);
        if (result.isCooldownActive && result.syntheticError) {
          dispatch({
            type: "VERIFICATION_FAILED",
            error: result.syntheticError,
            // A pre-flight read of the on-chain reset cooldown, before any
            // capture. `Custom 6012` reports the same thing from
            // `confirmation` after the fact.
            failedAt: "baseline",
          });
          return true;
        }
      }
    } catch {
      // Pre-flight fetch failed (network blip, RPC hiccup). Fall through—
      // the user will see the on-chain revert if cooldown actually applies.
    }
    return false;
  }

  async function handleResetBaselineClick() {
    if (studyNextTrialPending) return;
    if (!publicKey) {
      setResetDialogOpen(true);
      return;
    }

    const isCooldownActive = await checkResetCooldown(publicKey);
    if (isCooldownActive) return;

    setResetDialogOpen(true);
  }

  async function handleResetBaselineConfirm() {
    setResetDialogOpen(false);
    // The state machine allows START_CAPTURE from failed (see reducer).
    // Dispatch with reset intent; handleCaptureComplete will route to
    // session.completeReset() because intentRef is now "reset".
    await handleStart("reset");
  }

  /**
   * The speak prompt is on screen, so the SDK can drop everything it recorded
   * beforehand. The recorder is started early on purpose, so the prompt never
   * appears during the microphone's cold start, which means the buffer opens
   * with the challenge fetch and the three-second countdown in it.
   */
  function handleCaptureWindowOpen() {
    sessionRef.current?.markCaptureStart();
  }

  async function handleCaptureComplete(outline: CurveTracePoint[]) {
    const session = sessionRef.current;
    if (!session) return;

    try { await session.stopAudio(); } catch { /* skipped */ }
    try { await session.stopMotion(); } catch { /* skipped */ }
    try { await session.stopTouch(); } catch { /* skipped */ }

    dispatch({ type: "CAPTURE_DONE" });

    // The SDK bounds each step and reports its own phase. A host backstop
    // below `MAX_VERIFICATION_MS` pre-empts those clocks and reports the
    // failure against whatever step its own message names, which is how a
    // pending wallet prompt came to be reported as a proving timeout. Read
    // from the SDK rather than written down, so raising a clock there raises
    // this in step. It should never fire.
    const backstopMs = MAX_VERIFICATION_MS + 30_000;
    const proofPromise =
      intentRef.current === "reset"
        ? session.completeReset(wallet?.adapter, connection, (stage) => {
            setProcessingStage(stage);
          })
        : session.complete(wallet?.adapter, connection, (stage) => {
            setProcessingStage(stage);
          }, outline);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Verification took too long and was stopped. Check your wallet for a pending transaction before trying again.",
            ),
          ),
        backstopMs,
      )
    );

    Promise.race([proofPromise, timeoutPromise])
      .then(async (result) => {
        if (studyGrant) {
          void Promise.resolve(onStudyRecordStatus?.(result.studyRecordStatus)).catch(() => undefined);
        }
        dispatch({ type: "PROOF_COMPLETE" });
        if (result.compositeRiskScore !== undefined) {
          console.log(`[Entros] Verification telemetry composite risk score: ${result.compositeRiskScore.toFixed(4)}`);
        }
        if (result.success) {
          attemptsUsedRef.current = 0;
          transportFailuresRef.current = 0;
          dispatch({
            type: "VERIFICATION_SUCCESS",
            commitment: commitmentToHex(result.commitment),
            txSignature: result.txSignature,
            portableBaseline: result.portableBaseline,
          });
          return;
        }
        const reason = result.reason;

        // Charge the attempt here, on a verdict, rather than at capture
        // start. The counter used to increment before the microphone even
        // opened, so a denied permission, a missing challenge phrase or a
        // dropped connection each burned one of three attempts for a
        // rejection no server ever made. Three network blips and the user was
        // hard-failed without a single capture having been judged.
        const clientOrigin = isClientOriginReason(reason);
        // Only `validation` evaluated whether a person was there, so only
        // `validation` may charge for it. The budget used to move on every
        // failure that carried no client-origin reason, which meant three
        // declined wallet prompts, three empty-wallet reverts or three
        // baseline problems hard-failed someone whose capture had passed
        // validation every time.
        const judged = phaseChargesAttempt(result.failedAt);
        if (judged && !clientOrigin) {
          attemptsUsedRef.current += 1;
        } else if (clientOrigin) {
          transportFailuresRef.current += 1;
        }

        const used = clientOrigin
          ? transportFailuresRef.current
          : attemptsUsedRef.current;
        const disposition = reasonDisposition(reason);
        if (disposition === "retry" && used < MAX_ATTEMPTS) {
          dispatch({
            type: "VERIFICATION_SOFT_FAILED",
            reason: reason as string,
            attemptsRemaining: MAX_ATTEMPTS - used,
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
          reason,
          retryAfterSec: result.retryAfterSec,
          failedAt: result.failedAt,
          opaque: result.opaque,
          baselineRecovery: result.baselineRecovery,
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
    transportFailuresRef.current = 0;
    dispatch({ type: "RESET" });
  }

  function handleResultRetry() {
    if (studyNextTrialPending) return;
    if (studyNextTrialAvailable && onStudyNextTrial) {
      void Promise.resolve(onStudyNextTrial()).catch(() => undefined);
      return;
    }
    if (studySessionActive && !studyGrant && onStudyLeave) {
      onStudyLeave();
      return;
    }
    handleReset();
  }

  function handleResultCancel() {
    if (studySessionActive && onStudyLeave) {
      onStudyLeave();
      return;
    }
    handleReset();
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
    // Cadence hint. `update_anchor` scores weekly bin activation, so a second
    // verification inside the same week does not raise the score. It costs
    // nothing either: the activity ring records one entry per bin, so
    // verifying through several integrator gates in a day leaves a wallet's
    // span intact. Say both, so nobody reads a flat score as a penalty.
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
    const hoursAgoLabel =
      hoursAgo === 0 ? "less than an hour" : `${hoursAgo} hour${hoursAgo === 1 ? "" : "s"}`;

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
              You verified {hoursAgoLabel} ago. Trust Score grows with the
              number of separate weeks you verify in, so this one will not
              raise it. Verifying again is free of any penalty, and an
              integrator can ask for a fresh check whenever it needs one.
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
            disabled={requesting || micPermissionState === "denied" || studyCaptureBlocked}
            className="
              inline-flex items-center justify-center gap-2
              rounded-full bg-foreground px-6 py-3
              text-sm font-medium text-background
              transition-colors hover:bg-foreground/90
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {studyCaptureBlocked
              ? "Preparing next research trial..."
              : requesting
                ? "Requesting access..."
                : "Start Verification"}
          </button>
        </div>
        <p className="text-center text-xs text-muted">
          Raw recordings are not retained.
          <br />
          Derived features support validation.
          <br />
          Commitments and proofs persist.
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
        onCaptureWindowOpen={handleCaptureWindowOpen}
        touchRef={touchRef}
        audioLevel={audioLevel}
        hasMotion={hasMotion}
        phrase={challengePhrase}
        curve={challengeCurve}
      />
    );
  }

  if (state.step === "processing") return <ProvingView stage={processingStage} />;
  if (state.step === "signing") return <SigningView />;

  const leaveStudyAfterResult =
    studySessionActive && !studyGrant && !studyNextTrialAvailable;
  const studyResultActionLabel = studyNextTrialAvailable
    ? "Start next study trial"
    : studyGrant
      ? "Retry study trial"
    : leaveStudyAfterResult
      ? "Continue with normal verification"
      : null;

  if (state.step === "soft_failed") {
    return (
      <SoftFailedView
        reason={state.reason}
        attemptsRemaining={state.attemptsRemaining}
        onTryAgain={
          studyNextTrialAvailable || leaveStudyAfterResult
            ? handleResultRetry
            : () => handleStart(state.intent)
        }
        onCancel={handleResultCancel}
        tryAgainLabel={studyResultActionLabel ?? "Try again"}
        actionPending={studyNextTrialPending}
      />
    );
  }

  if (state.step === "verified") {
    const wasReset = state.intent === "reset";
    return (
      <VerifiedView
        commitment={state.commitment}
        txSignature={state.txSignature}
        portableBaseline={state.portableBaseline}
        title={wasReset ? "Baseline reset" : "Verified"}
        subtitle={
          wasReset
            ? "Fresh baseline stored on this device. Trust Score starts at 0 and rebuilds with future verifications."
            : "Transaction confirmed on Solana devnet"
        }
        tryAgainLabel={
          studyResultActionLabel
            ? studyResultActionLabel
            : wasReset
              ? "Verify now"
              : "Verify again"
        }
        onReset={handleResultRetry}
        actionPending={studyNextTrialPending}
        secondaryActionLabel={studyNextTrialAvailable ? "Finish for now" : undefined}
        onSecondaryAction={studyNextTrialAvailable ? handleResultCancel : undefined}
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
          reason={state.reason}
          failedAt={state.failedAt}
          opaque={state.opaque}
          baselineRecovery={state.baselineRecovery}
          retryAfterSec={state.retryAfterSec}
          onReset={handleResultRetry}
          onCancel={handleResultCancel}
          retryLabel={studyResultActionLabel ?? "Try again"}
          actionPending={studyNextTrialPending}
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
