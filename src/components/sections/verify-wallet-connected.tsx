"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import {
  type PulseSession,
  type VerificationResult,
  PROGRAM_IDS,
  fetchIdentityState,
  reasonDisposition,
  MAX_VERIFICATION_MS,
  type StudyRecordStatus,
} from "@entros/pulse-sdk";
import type {
  CaptureIntent,
  PairedCaptureHandle,
  PairedFinish,
  VerifyState,
  VerifyAction,
} from "@/components/verify/types";
import {
  primaryVerificationActionClass,
  secondaryVerificationActionClass,
  verificationFocusRing,
} from "@/components/verify/verification-styles";
import {
  ProofPipeline,
  VerifiedView,
  FailedView,
  SoftFailedView,
} from "@/components/verify/step-views";
import {
  PRIVACY_LINES,
  PrivacyFooter,
  StateIcon,
  ToneText,
  VerifyConsole,
  VerifyWalletChip,
  railStepForPhase,
  railStepForStage,
  type RailState,
} from "@/components/verify/console";
import { ResetBaselineDialog } from "@/components/verify/reset-baseline-dialog";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { useWalletError } from "@/components/providers/wallet-provider";
import { ArrowRight, Wallet, X } from "lucide-react";
import type { ActiveStudyGrant } from "@/lib/population-study";
import {
  createSigningDiagnosticWallet,
  signingDiagnosticEnabled,
  stringifySigningDiagnosticReport,
  type SigningDiagnosticReport,
} from "@/lib/signing-flow-diagnostic";

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
import { useMotionCapability } from "@/hooks/use-motion-capability";

// Soft-reject retry budget. When attemptsUsed < MAX_ATTEMPTS
// and the server returns a user-recoverable reason, the client routes to
// soft_failed (retry available) instead of failed (hard stop). Capped to
// bound bot retry benefit per wallet — the server-side per-wallet cap
// enforces this across wallet refreshes; this client
// counter just drives the UX inside a session.
import {
  chargeRetryBudget,
  EMPTY_RETRY_BUDGET,
  MAX_CAPTURE_ATTEMPTS as MAX_ATTEMPTS,
} from "@/components/verify/retry-budget";

const subscribeToStaticCapability = () => () => undefined;
const readSigningDiagnosticCapability = () =>
  signingDiagnosticEnabled({
    nodeEnv: process.env.NODE_ENV,
    publicFlag: process.env.NEXT_PUBLIC_SIGNING_DIAGNOSTIC,
    diagnosticRpc: process.env.NEXT_PUBLIC_SIGNING_DIAGNOSTIC_RPC,
    hostname: window.location.hostname,
    search: window.location.search,
  });
const readServerSigningDiagnosticCapability = () => false;

function FaucetLink() {
  return (
    <a
      href="https://faucet.solana.com/"
      target="_blank"
      rel="noopener noreferrer"
      className="underline decoration-current/40 underline-offset-4 transition-colors hover:decoration-current"
    >
      Solana faucet
    </a>
  );
}

function VoiceGlyph() {
  return (
    <svg viewBox="0 0 48 24" className="h-6 w-12 text-cyan" aria-hidden>
      {[3, 8, 14, 9, 18, 11, 6, 13, 4].map((h, i) => (
        <line
          key={i}
          x1={4 + i * 5}
          x2={4 + i * 5}
          y1={12 - h / 2}
          y2={12 + h / 2}
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function TraceGlyph() {
  return (
    <svg viewBox="0 0 48 24" className="h-6 w-12 text-solana-green" aria-hidden>
      <polyline
        points="6,18 18,6 30,16 42,7"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      {[
        [6, 18],
        [18, 6],
        [30, 16],
        [42, 7],
      ].map(([x, y]) => (
        <circle
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          r={2.6}
          fill="var(--color-background)"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

function MotionGlyph() {
  return (
    <svg viewBox="0 0 48 24" className="h-6 w-12 text-solana-purple" aria-hidden>
      <circle cx={24} cy={12} r={2.5} fill="currentColor" />
      <path
        d="M17 6a9 9 0 0 0 0 12M31 6a9 9 0 0 1 0 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M12 3a14 14 0 0 0 0 18M36 3a14 14 0 0 1 0 18"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  );
}

const IDLE_STEPS = [
  { label: "Say each word", Glyph: VoiceGlyph },
  { label: "Trace each path", Glyph: TraceGlyph },
  { label: "Move naturally throughout", Glyph: MotionGlyph },
] as const;

function SigningDiagnosticPanel({
  report,
  onDownload,
  onDiscard,
}: {
  report: SigningDiagnosticReport;
  onDownload: () => void;
  onDiscard: () => void;
}) {
  const errorCount = report.simulations.filter(
    (simulation) => simulation.err !== null,
  ).length;
  return (
    <section className="mx-auto w-full max-w-xl border border-cyan/30 bg-cyan/5 p-5 text-left">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-medium text-foreground">
            Local transaction diagnostic
          </p>
          <p className="mt-2 text-sm text-foreground/70">
            {report.transactionKind === "mint" ? "Mint" : "Re-verification"}
            {" simulation complete. "}
            {errorCount === 0
              ? "Every RPC returned a clean result."
              : `${errorCount} RPC result${errorCount === 1 ? " contains" : "s contain"} an error.`}
          </p>
        </div>
        <span className="text-sm font-medium text-foreground/60">
          Report v{report.reportVersion}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {report.simulations.map((simulation) => (
          <div
            key={`${simulation.endpoint}-${simulation.variant}`}
            className="border border-foreground/10 bg-background/50 p-3"
          >
            <p className="text-sm font-medium text-foreground/60">
              {simulation.endpoint} · {simulation.variant}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span
                className={
                  simulation.err === null ? "text-cyan" : "text-amber-500"
                }
              >
                {simulation.err === null ? "Clean" : "Error returned"}
              </span>
              <span className="font-mono text-foreground/65">
                {simulation.unitsConsumed === null
                  ? "CU unavailable"
                  : `${simulation.unitsConsumed.toLocaleString()} CU`}
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-foreground/55">
        The report excludes transaction bytes, wallet identifiers, proofs,
        commitments, signatures, and RPC URLs.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDownload}
          className={`border border-cyan/35 px-4 py-2 font-mono text-xs text-cyan transition-colors hover:border-cyan hover:text-foreground ${verificationFocusRing}`}
        >
          Download redacted JSON
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className={`border border-foreground/15 px-4 py-2 font-mono text-xs text-foreground/60 transition-colors hover:border-foreground/35 hover:text-foreground ${verificationFocusRing}`}
        >
          Discard report
        </button>
      </div>
    </section>
  );
}

function SigningDiagnosticNotice() {
  return (
    <div className="mx-auto max-w-sm border border-cyan/30 bg-cyan/5 px-4 py-3">
      <p className="text-center font-mono text-xs text-cyan">
        Local transaction diagnostic enabled
      </p>
      <p className="mt-2 text-center text-xs leading-relaxed text-foreground/60">
        The next verification will simulate its transaction on two devnet RPC
        endpoints before the wallet request.
      </p>
    </div>
  );
}

// Loaded in a chunk of its own, so pages that never start a capture never
// download it.
const PairedCapture = dynamic(
  () =>
    import("@/components/verify/paired-capture").then(
      (mod) => mod.PairedCapture,
    ),
  { ssr: false },
);

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
  studyPreparationRequired = false,
  studyPreparationError,
  studyPreparationRetryAllowed = true,
  onStudyPrepare,
}: {
  state: VerifyState;
  dispatch: React.ActionDispatch<[action: VerifyAction]>;
  studyGrant?: ActiveStudyGrant | null;
  studyCaptureBlocked?: boolean;
  onStudyRecordStatus?: (
    status: StudyRecordStatus | undefined,
  ) => void | Promise<void>;
  onStudyNextTrial?: () => void | Promise<void>;
  onStudyLeave?: () => void;
  studyNextTrialAvailable?: boolean;
  studyNextTrialPending?: boolean;
  studySessionActive?: boolean;
  studyPreparationRequired?: boolean;
  studyPreparationError?: string | null;
  studyPreparationRetryAllowed?: boolean;
  onStudyPrepare?: () => void | Promise<void>;
}) {
  const { connected, wallet, publicKey } = useWallet();
  const { connection } = useConnection();
  // Wallet adapter error surface (e.g., Phantom devnet mismatch, Android MWA
  // dead-ends). Latest message is rendered as a banner above the Connect
  // button; clears automatically when the wallet successfully connects.
  const { lastError: walletError, clearError: clearWalletError } =
    useWalletError();
  const sessionRef = useRef<PulseSession | null>(null);
  const hasMotion = useMotionCapability();
  const [processingStage, setProcessingStage] = useState(
    "Extracting features...",
  );
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const signingDiagnosticActive = useSyncExternalStore(
    subscribeToStaticCapability,
    readSigningDiagnosticCapability,
    readServerSigningDiagnosticCapability,
  );
  const [signingDiagnosticReport, setSigningDiagnosticReport] =
    useState<SigningDiagnosticReport | null>(null);
  // Unix seconds of the connected wallet's most recent on-chain verification,
  // read directly from IdentityState offset 48. Used to render a cadence hint
  // explaining that Trust Score only increments after a 24-hour gap—the
  // sliding-window dedup in update_anchor's recency formula collapses
  // verifications inside the same 24h slice into one contribution, so
  // verifying twice within 24h is a UX surprise unless we flag it.
  const [verificationTimestamp, setVerificationTimestamp] = useState<{
    wallet: string;
    value: number | null;
    /**
     * Unix seconds when the value was read. The hint measures against this
     * instead of reading the clock while rendering, which is impure.
     */
    readAtSec: number;
  } | null>(null);
  const connectedWallet = connected && publicKey ? publicKey.toBase58() : null;
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const walletIdentityRef = useRef(connectedWallet);
  useLayoutEffect(() => {
    if (walletIdentityRef.current !== connectedWallet) {
      walletIdentityRef.current = connectedWallet;
      attemptRef.current++;
    }
  }, [connectedWallet]);
  useEffect(() => {
    mountedRef.current=true;
    return () => {mountedRef.current=false;};
  }, []);
  const lastVerification =
    verificationTimestamp?.wallet === connectedWallet
      ? verificationTimestamp
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
  const voicedFramesRef = useRef(0);
  // Intent is tracked alongside the state-machine mirror so the
  // capture-completion handler can choose between verify vs reset paths
  // without reading the reducer state (which may race the handler).
  const intentRef = useRef<"verify" | "reset">("verify");
  const retryBudgetRef = useRef({ ...EMPTY_RETRY_BUDGET });
  const budgetWalletRef = useRef(connectedWallet);
  useEffect(() => {
    if (budgetWalletRef.current !== connectedWallet) {
      attemptRef.current++;
      intentRef.current = "verify";
      dispatch({ type: "RESET" });
    }
    retryBudgetRef.current = { ...EMPTY_RETRY_BUDGET };
    budgetWalletRef.current = connectedWallet;
  }, [connectedWallet, dispatch]);

  // Paired rounds are the only capture this page runs. The study-trial
  // binding to the single capture ended when web study intake closed
  // (2026-10-06), so the flow no longer depends on the server flag or a grant.
  // Null until the paired capture's code has loaded.
  const [pairedCapture, setPairedCapture] =
    useState<PairedCaptureHandle | null>(null);

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
        setMicPermissionState(status.state as "granted" | "denied" | "prompt");
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
        s.onchange = handleChange;
      })
      .catch(() => {
        // Permissions API rejected (Firefox sometimes throws on unsupported
        // names rather than returning a result). Leave state at "unknown"
        // and let the post-capture FailedView handle any actual denial.
      });
    return () => {
      cancelled = true;
      if (status) status.onchange = null;
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
          setVerificationTimestamp({
            wallet: walletAddress,
            value: null,
            readAtSec: Math.floor(Date.now() / 1000),
          });
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
          readAtSec: Math.floor(Date.now() / 1000),
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
      ? (state.txSignature ?? null)
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

  /**
   * Starts a paired session from the user's tap. The session asks for motion
   * permission, which needs that gesture, so nothing awaits before it starts.
   */
  function handleStartPaired(intent: CaptureIntent) {
    if (studyCaptureBlocked || !pairedCapture || !publicKey) return;
    // Verify and reset keep separate retry budgets.
    if (intentRef.current !== intent || budgetWalletRef.current !== connectedWallet) {
      retryBudgetRef.current = { ...EMPTY_RETRY_BUDGET };
    }
    budgetWalletRef.current = connectedWallet;
    intentRef.current = intent;
    if (intent === "verify") setSigningDiagnosticReport(null);
    voicedFramesRef.current = 0;
    attemptRef.current++;
    if (!pairedCapture.start(intent)) return;
    // An active reset cooldown reports its own failure, and leaving the
    // capture view ends the session.
    if (intent === "reset") void checkResetCooldown(publicKey);
  }

  /** Every round is committed. Finalize runs through the shared result path. */
  function completePairedSession(finish: PairedFinish, voicedFrames: number) {
    voicedFramesRef.current = voicedFrames;
    setProcessingStage("Extracting features...");
    dispatch({ type: "CAPTURE_DONE" });
    const attempt=attemptRef.current;
    const active=() => mountedRef.current && attemptRef.current === attempt;
    settleVerification(
      finish(resolveCompletionWallet(), connection, stage => {if (active()) setProcessingStage(stage);}),
      active,
    );
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
    // The state machine allows START_CAPTURE from failed (see reducer). The
    // paired capture finalizes as a reset because intentRef is now "reset".
    handleStartPaired("reset");
  }

  /**
   * The wallet the SDK signs with. The local transaction diagnostic wraps it
   * for a verification when that diagnostic is enabled.
   */
  function resolveCompletionWallet() {
    const diagnosticRpc = process.env.NEXT_PUBLIC_SIGNING_DIAGNOSTIC_RPC;
    return signingDiagnosticActive &&
      diagnosticRpc &&
      intentRef.current === "verify" &&
      wallet?.adapter
      ? createSigningDiagnosticWallet(wallet.adapter, {
          publicEndpoint: new Connection(clusterApiUrl("devnet"), {
            commitment: "confirmed",
            disableRetryOnRateLimit: true,
          }),
          configuredEndpoint: new Connection(diagnosticRpc, {
            commitment: "confirmed",
            disableRetryOnRateLimit: true,
          }),
          onReport: setSigningDiagnosticReport,
          onStatus: setProcessingStage,
          rpcMinimumIntervalMs: 1_100,
        })
      : wallet?.adapter;
  }

  /** Routes a finished verification to its result screen. */
  function settleVerification(proofPromise: Promise<VerificationResult>, active: () => boolean = () => true) {
    // The SDK bounds each step and reports its own phase. A host backstop
    // below `MAX_VERIFICATION_MS` pre-empts those clocks and reports the
    // failure against whatever step its own message names, which is how a
    // pending wallet prompt came to be reported as a proving timeout. Read
    // from the SDK rather than written down, so raising a clock there raises
    // this in step. It should never fire.
    const backstopMs = MAX_VERIFICATION_MS + 30_000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Verification took too long and was stopped. Check your wallet for a pending transaction before trying again.",
            ),
          ),
        backstopMs,
      ),
    );

    Promise.race([proofPromise, timeoutPromise])
      .then(async (result) => {
        if (!active()) return;
        if (studyGrant) {
          void Promise.resolve(
            onStudyRecordStatus?.(result.studyRecordStatus),
          ).catch(() => undefined);
        }
        dispatch({ type: "PROOF_COMPLETE" });
        if (result.compositeRiskScore !== undefined) {
          console.log(
            `[Entros] Verification telemetry composite risk score: ${result.compositeRiskScore.toFixed(4)}`,
          );
        }
        if (result.success) {
          retryBudgetRef.current = { ...EMPTY_RETRY_BUDGET };
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
        // Only `validation` evaluated whether a person was there, so only
        // `validation` may charge for it. The budget used to move on every
        // failure that carried no client-origin reason, which meant three
        // declined wallet prompts, three empty-wallet reverts or three
        // baseline problems hard-failed someone whose capture had passed
        // validation every time.
        const { budget, used } = chargeRetryBudget(
          retryBudgetRef.current,
          reason,
          result.failedAt,
        );
        retryBudgetRef.current = budget;
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
        // across every round. That binary client-side
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
        if (!active()) return;
        dispatch({
          type: "VERIFICATION_FAILED",
          error: sanitizeErrorMessage(err.message ?? "Unexpected error"),
        });
      });
  }

  function handleReset() {
    attemptRef.current++;
    sessionRef.current = null;
    // Wipe the retry budget when the user explicitly resets—a fresh
    // session starts at 0 attempts used.
    retryBudgetRef.current = { ...EMPTY_RETRY_BUDGET };
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

  function downloadSigningDiagnostic() {
    if (!signingDiagnosticReport) return;
    const json = stringifySigningDiagnosticReport(signingDiagnosticReport);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `entros-${signingDiagnosticReport.transactionKind}-simulation-${Date.now()}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const diagnosticPanel =
    signingDiagnosticActive && signingDiagnosticReport ? (
      <SigningDiagnosticPanel
        report={signingDiagnosticReport}
        onDownload={downloadSigningDiagnostic}
        onDiscard={() => setSigningDiagnosticReport(null)}
      />
    ) : null;

  // Mounted ahead of the capture step at one place in the tree, so the session
  // a start tap opens survives the move into the rounds.
  const pairedHost = (
    <PairedCapture
      capturing={state.step === "capturing"}
      wallet={connectedWallet}
      connection={connection}
      hasMotion={hasMotion}
      dispatch={dispatch}
      onHandle={setPairedCapture}
      onCommitted={completePairedSession}
    />
  );
  const frame = (
    rail: RailState,
    announcement: string,
    viewKey: string,
    view: React.ReactNode,
    footer?: React.ReactNode,
  ) => (
    <VerifyConsole
      rail={rail}
      announcement={announcement}
      viewKey={viewKey}
      footer={footer}
      persistent={pairedHost}
    >
      {view}
    </VerifyConsole>
  );
  const idleFooter = <PrivacyFooter lines={PRIVACY_LINES} />;

  if (!connected) {
    return frame(
      { current: 0, status: "ready" },
      "Prepare a Solana Devnet wallet",
      "connect",
      <div className="space-y-8 text-center">
        <StateIcon>
          <Wallet className="h-14 w-14" strokeWidth={1.1} />
        </StateIcon>
        <div>
          <h2 className="font-display text-3xl font-normal tracking-[-0.015em] text-foreground">
            Prepare a Solana Devnet wallet
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-balance text-sm leading-relaxed text-foreground/65 md:text-base">
            Switch your wallet to Devnet and add free SOL from the <FaucetLink />.
            {" "}Then connect the wallet to verify.
          </p>
        </div>
        {signingDiagnosticActive && <SigningDiagnosticNotice />}
        {walletError && (
          <div
            role="alert"
            className="mx-auto flex w-full max-w-sm items-center gap-3 border border-danger/30 bg-danger/[0.07] py-2.5 pl-4 pr-2 text-left"
          >
            <p className="flex-1 text-xs leading-5 text-foreground/80">
              Wallet didn&apos;t connect: {walletError}
            </p>
            <button
              type="button"
              onClick={clearWalletError}
              aria-label="Dismiss wallet error"
              className={`flex h-7 w-7 shrink-0 items-center justify-center text-foreground/50 transition-colors hover:text-foreground ${verificationFocusRing}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="vc-wallet">
          <WalletConnectButton showDesktopHint={false} />
        </div>
      </div>,
      idleFooter,
    );
  }

  if (state.step === "idle") {
    if (studyPreparationRequired) {
      return frame(
        { current: 0, status: "active" },
        "Confirm your study wallet",
        "study-wallet",
        <div className="space-y-8 text-center">
          <div>
            <VerifyWalletChip />
            <h2 className="mt-6 font-display text-3xl font-normal tracking-[-0.01em] text-foreground">
              Confirm your study wallet
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground/65">
              Sign to confirm this wallet. Nothing is sent or spent.
            </p>
          </div>

          <ToneText tone="warning">
            Switch your wallet to Devnet and add free SOL from the <FaucetLink />.
            {" "}Then confirm this wallet.
          </ToneText>

          {studyPreparationError && (
            <p className="mx-auto max-w-sm text-sm text-danger" role="alert">
              {studyPreparationError}
            </p>
          )}

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                studyPreparationRetryAllowed
                  ? void onStudyPrepare?.()
                  : onStudyLeave?.()
              }
              disabled={
                studyCaptureBlocked ||
                (studyPreparationRetryAllowed ? !onStudyPrepare : !onStudyLeave)
              }
              className={primaryVerificationActionClass}
            >
              {studyCaptureBlocked
                ? "Preparing verification..."
                : studyPreparationRetryAllowed
                  ? "Continue to verification"
                  : "Continue with normal verification"}
            </button>
            {onStudyLeave && studyPreparationRetryAllowed && (
              <button
                type="button"
                onClick={onStudyLeave}
                disabled={studyCaptureBlocked}
                className={secondaryVerificationActionClass}
              >
                Continue without study
              </button>
            )}
          </div>
        </div>,
      );
    }

    // Cadence hint. `update_anchor` scores weekly bin activation, so a second
    // verification inside the same week does not raise the score. It costs
    // nothing either: the activity ring records one entry per bin, so
    // verifying through several integrator gates in a day leaves a wallet's
    // span intact. Say both, so nobody reads a flat score as a penalty.
    const DAY_SEC = 86400;
    const secondsSinceLastVerif =
      lastVerification && lastVerification.value !== null
        ? lastVerification.readAtSec - lastVerification.value
        : null;
    const showCadenceHint =
      secondsSinceLastVerif !== null &&
      secondsSinceLastVerif >= 0 &&
      secondsSinceLastVerif < DAY_SEC;
    const hoursAgo =
      showCadenceHint && secondsSinceLastVerif !== null
        ? Math.floor(secondsSinceLastVerif / 3600)
        : 0;
    const hoursAgoLabel =
      hoursAgo === 0
        ? "less than an hour"
        : `${hoursAgo} hour${hoursAgo === 1 ? "" : "s"}`;
    const steps = hasMotion ? IDLE_STEPS : IDLE_STEPS.slice(0, 2);

    return frame(
      { current: 1, status: "ready" },
      "Behavioral Verification",
      "idle",
      <div className="space-y-9">
        <div className="text-center">
          <VerifyWalletChip />
          <h2 className="mt-7 font-display text-3xl font-normal tracking-[-0.015em] text-foreground md:text-4xl">
            Behavioral Verification
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-balance text-sm leading-relaxed text-foreground/65 md:text-base">
            Three rounds: say one word and trace one short path in each.
            Then sign with your wallet.
          </p>
        </div>
        <ol
          className={`mx-auto grid divide-x divide-foreground/[0.1] ${
            hasMotion ? "max-w-md grid-cols-3" : "max-w-xs grid-cols-2"
          }`}
        >
          {steps.map(({ label, Glyph }, index) => (
            <li key={label} className="flex flex-col items-center px-2 text-center">
              <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/40">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-3 flex h-8 w-12 items-center justify-center">
                <Glyph />
              </span>
              <span className="mt-3 max-w-[8rem] text-balance text-[13px] leading-snug text-foreground/75">
                {label}
              </span>
            </li>
          ))}
        </ol>
        {showCadenceHint && (
          <ToneText tone="accent">
            You verified {hoursAgoLabel} ago. Trust Score counts separate
            weeks, so this one will not raise it. Verifying again carries no
            penalty.
          </ToneText>
        )}
        {micPermissionState === "denied" && (
          <ToneText tone="danger" alert>
            Microphone access is blocked for this site. Click the lock icon in
            your address bar, set Microphone to Allow, then refresh.
          </ToneText>
        )}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => handleStartPaired("verify")}
            disabled={
              micPermissionState === "denied" ||
              studyCaptureBlocked ||
              !pairedCapture
            }
            className={primaryVerificationActionClass}
          >
            {studyCaptureBlocked
              ? "Preparing next research trial..."
              : "Start Verification"}
            {!studyCaptureBlocked && <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
          </button>
        </div>
        {signingDiagnosticActive && <SigningDiagnosticNotice />}
      </div>,
      idleFooter,
    );
  }

  // The paired capture draws its rounds from its own place in the frame.
  if (state.step === "capturing") {
    return frame(
      { current: 1, status: "active" },
      "",
      "capturing",
      null,
      <PrivacyFooter lines={["Raw motion and touch stay on this device. Audio is never stored."]} />,
    );
  }

  if (state.step === "processing" || state.step === "signing") {
    const signing = state.step === "signing";
    const reset = state.intent === "reset";
    return frame(
      {
        current: signing ? 3 : railStepForStage(processingStage),
        status: "active",
      },
      signing ? "Approve the transaction in your wallet" : processingStage,
      "pipeline",
      <div className="space-y-6">
        <ProofPipeline stage={processingStage} signing={signing} reset={reset} />
        {diagnosticPanel}
      </div>,
      <PrivacyFooter lines={[PRIVACY_LINES[2]]} />,
    );
  }

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
    return frame(
      { current: 1, status: "error" },
      "Let's try that again",
      "soft",
      <SoftFailedView
        reason={state.reason}
        attemptsRemaining={state.attemptsRemaining}
        onTryAgain={
          studyNextTrialAvailable || leaveStudyAfterResult
            ? handleResultRetry
            : () => handleStartPaired(state.intent)
        }
        onCancel={handleResultCancel}
        tryAgainLabel={studyResultActionLabel ?? "Try again"}
        actionPending={studyNextTrialPending}
      />,
    );
  }

  if (state.step === "verified") {
    const wasReset = state.intent === "reset";
    return frame(
      { current: 4, status: "complete" },
      wasReset ? "Baseline reset" : "Verified",
      "verified",
      <div className="space-y-6">
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
          secondaryActionLabel={
            studyNextTrialAvailable ? "Finish for now" : undefined
          }
          onSecondaryAction={
            studyNextTrialAvailable ? handleResultCancel : undefined
          }
          walletPubkey={publicKey?.toBase58()}
          trustScore={trustScore}
          showShare={!wasReset}
        />
        {diagnosticPanel}
      </div>,
    );
  }

  if (state.step === "failed") {
    return frame(
      { current: railStepForPhase(state.failedAt), status: "error" },
      "Verification stopped",
      "failed",
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
          pairedCapture
        />
        <ResetBaselineDialog
          open={resetDialogOpen}
          onCancel={() => setResetDialogOpen(false)}
          onConfirm={handleResetBaselineConfirm}
        />
        {diagnosticPanel}
      </>,
    );
  }

  return frame({ current: 1, status: "ready" }, "", "empty", null);
}
