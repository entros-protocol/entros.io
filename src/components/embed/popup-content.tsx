"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, Wallet, X } from "lucide-react";
import {
  type VerificationResult,
  MAX_VERIFICATION_MS,
  isClientOriginReason,
} from "@entros/pulse-sdk";

import type { ParsedEmbedParams } from "@/lib/embed/url-params";
import type { EmbedContext } from "@/lib/embed/post-message";
import {
  emitError,
  emitHeartbeat,
  emitVerified,
  emitPolicyDiagnostic,
} from "@/lib/embed/post-message";
import type { EmbedErrorReason, VerifiedPayload } from "@/lib/embed/types";
import { evaluatePopupPolicy } from "@/lib/embed/evaluate-popup-policy";
import { checkWarmPopupPolicy } from "@/lib/embed/warm-popup-policy";
import {
  policyResultToWire,
  type PolicyReason,
  type PolicyRequest,
} from "@entros/verify/policy";
import { useMotionCapability } from "@/hooks/use-motion-capability";
import { storeLastVerification } from "@/lib/last-verification";

import { ProofPipeline, micRecoveryFootnote } from "@/components/verify/step-views";
import {
  isDriftTooHighError,
  isInsufficientSolError,
  isMicrophonePermissionError,
} from "@/components/verify/categorize-failure";
import {
  POPUP_RAIL_STEPS,
  PRIVACY_LINES,
  PrivacyFooter,
  StateIcon,
  VerifyConsole,
  VerifyWalletChip,
  railStepForStage,
  type RailState,
} from "@/components/verify/console";
import {
  primaryVerificationActionClass,
  verificationFocusRing,
} from "@/components/verify/verification-styles";
import {
  pairedStartLabel,
  usePairedAuthorization,
} from "@/components/verify/use-paired-authorization";
import type {
  PairedCaptureHandle,
  PairedFinish,
  VerifyAction,
} from "@/components/verify/types";
import {
  formatWalletConnectionError,
  useOptionalWalletError,
} from "@/components/providers/wallet-provider";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";

import {
  PREV_COMMITMENT_MISMATCH_PATTERN,
  bucketForResult,
  bucketForCaptureFailure,
  categorizeError,
} from "./categorize-embed-error";
import { PopupBaselineStale } from "./popup-baseline-stale";
import { PopupSuccess } from "./popup-success";
import { PopupFailure, type PopupRecoveryDetail } from "./popup-failure";

// The same three rounds /verify runs, in a chunk of its own.
const PairedCapture = dynamic(
  () =>
    import("@/components/verify/paired-capture").then(
      (mod) => mod.PairedCapture,
    ),
  { ssr: false },
);

type State =
  | { step: "idle" }
  | { step: "capturing" }
  | { step: "processing" }
  | { step: "signing" }
  | { step: "verified"; reused?: boolean }
  | {
      step: "failed";
      reason: EmbedErrorReason;
      policyReason?: PolicyReason;
      recovery?: PopupRecoveryDetail;
      /** The progress step in focus when the failure landed. */
      railStep: number;
    }
  // Distinct from `failed`: stale on-chain commitment (`PrevCommitmentMismatch`)
  // requires a baseline reset on /verify and does not auto-close. The wire
  // still emits `validation_failed`.
  | { step: "failed-baseline-stale" };

const FAUCET_URL = "https://faucet.solana.com";

// A backstop, not a phase clock.
//
// The SDK bounds each step and reports its own phase. A ceiling below
// `MAX_VERIFICATION_MS` pre-empts those clocks and reports the failure against
// whatever step its own message names, which is how a pending wallet prompt
// came to be reported as a proving timeout. Read from the SDK rather than
// written down, so raising a clock there raises this in step.
const VERIFICATION_BACKSTOP_MS = MAX_VERIFICATION_MS + 30_000;

// Name carried on the backstop rejection so the handler can recognise it
// exactly. It used to be recognised by matching "timed out" in the message,
// which is a contract nobody wrote down and which broke the moment the copy
// changed: the integrator started receiving `unknown` for a plain timeout.
const BACKSTOP_ERROR_NAME = "EntrosBackstopTimeout";

/**
 * Client component that owns the popup's interactive verification surface.
 * Runs the paired rounds, then the proof and the on-chain submission, over a
 * popup-flavored UI and emits postMessage envelopes to the opener at each
 * phase boundary. One shot with no soft-reject retry: failure surfaces
 * auto-close so the user re-triggers from the integrator.
 */
export function PopupContent({ params }: { params: ParsedEmbedParams }) {
  const { connected, wallet, publicKey } = useWallet();
  const { connection } = useConnection();
  const { lastError: walletError, clearError: clearWalletError } =
    useOptionalWalletError();

  const [state, setState] = useState<State>({ step: "idle" });
  const authorization = usePairedAuthorization(state.step);
  const { reportRefusal } = authorization;
  const hasMotion = useMotionCapability();
  const [processingStage, setProcessingStage] = useState(
    "Extracting features...",
  );
  const [pairedCapture, setPairedCapture] =
    useState<PairedCaptureHandle | null>(null);

  // Bumped on every start and every reset, so a late result from an earlier
  // session changes nothing.
  const attemptRef = useRef(0);
  const submittingEmittedRef = useRef(false);
  const voicedFramesRef = useRef(0);
  const warmAbortRef = useRef<AbortController | null>(null);
  const verifiedRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (connected) clearWalletError();
  }, [connected, clearWalletError]);

  const walletAddress = connected && publicKey ? publicKey.toBase58() : null;
  const policyJson = params.policy ? JSON.stringify(params.policy) : "";
  const stableParams = useMemo<ParsedEmbedParams>(
    () => ({
      integratorKey: params.integratorKey,
      parentOrigin: params.parentOrigin,
      cluster: params.cluster,
      requestId: params.requestId,
      minTrustScore: params.minTrustScore,
      ...(policyJson ? { policy: JSON.parse(policyJson) as PolicyRequest } : {}),
      diagnosticsEnabled: params.diagnosticsEnabled,
    }),
    [
      params.integratorKey,
      params.parentOrigin,
      params.cluster,
      params.requestId,
      params.minTrustScore,
      policyJson,
      params.diagnosticsEnabled,
    ],
  );
  const warmKey =
    walletAddress && state.step === "idle"
      ? `${walletAddress}:${stableParams.requestId}:${stableParams.minTrustScore ?? ""}:${policyJson}`
      : null;
  const [warmSettledKey, setWarmSettledKey] = useState<string | null>(null);
  const checkingWarm = warmKey !== null && warmSettledKey !== warmKey;

  const ctx = useMemo<EmbedContext>(
    () => ({
      parentOrigin: params.parentOrigin,
      requestId: params.requestId,
    }),
    [params.parentOrigin, params.requestId],
  );

  useEffect(() => {
    if (!walletAddress || !warmKey || state.step !== "idle") return;
    let cancelled = false;
    const controller = new AbortController();
    warmAbortRef.current = controller;
    const attempt = attemptRef.current;

    void checkWarmPopupPolicy(
      stableParams,
      walletAddress,
      connection,
      stableParams.diagnosticsEnabled
        ? (diagnostic) => emitPolicyDiagnostic(ctx, diagnostic)
        : undefined,
      { signal: controller.signal },
    ).then((result) => {
      if (cancelled || controller.signal.aborted || attemptRef.current !== attempt) {
        return;
      }
      if (result.status === "reused") {
        if (verifiedRequestRef.current === ctx.requestId) return;
        verifiedRequestRef.current = ctx.requestId;
        const payload: VerifiedPayload = {
          wallet_pubkey: walletAddress,
          attestation_pda: result.attestationPda,
          tx_sig: result.txSignature,
          trust_score: result.policy.evidence.identity.trustScore,
          cluster: "devnet",
          policy: policyResultToWire(result.policy),
        };
        emitVerified(ctx, payload);
        setWarmSettledKey(warmKey);
        setState({ step: "verified", reused: true });
        return;
      }
      setWarmSettledKey(warmKey);
    });

    return () => {
      cancelled = true;
      controller.abort();
      if (warmAbortRef.current === controller) {
        warmAbortRef.current = null;
      }
    };
  }, [walletAddress, warmKey, state.step, stableParams, connection, ctx]);

  const fail = useCallback(
    (
      reason: EmbedErrorReason,
      policyReason?: PolicyReason,
      railStep?: number,
      recovery?: PopupRecoveryDetail,
    ) => {
      emitError(ctx, reason, params.policy ? policyReason : undefined);
      // Read from the previous state: failures land from async callbacks whose
      // closure still holds an earlier step.
      setState((previous) => ({
        step: "failed",
        reason,
        policyReason,
        recovery,
        railStep:
          railStep ??
          (previous.step === "signing" ? 3 : previous.step === "processing" ? 2 : 1),
      }));
    },
    [ctx, params.policy],
  );

  // The paired capture reports through the /verify card's actions. The popup
  // keeps its own states, so only the three the capture sends matter here.
  const dispatch = useCallback(
    (action: VerifyAction) => {
      switch (action.type) {
        case "START_CAPTURE":
          emitHeartbeat(ctx, "capturing");
          setState({ step: "capturing" });
          return;
        case "VERIFICATION_FAILED": {
          reportRefusal(action.reason);
          const recovery: PopupRecoveryDetail | undefined =
            !action.reason && isMicrophonePermissionError(action.error)
              ? {
                  title: "Microphone access needed",
                  body: `Your browser blocked microphone access. ${micRecoveryFootnote()}`,
                  stayOpen: true,
                }
              : undefined;
          fail(bucketForCaptureFailure(action.reason), undefined, 1, recovery);
          return;
        }
        case "RESET":
          attemptRef.current++;
          setState({ step: "idle" });
          return;
        default:
          return;
      }
    },
    [ctx, fail, reportRefusal],
  );

  function handleStart() {
    if (!pairedCapture || !publicKey) return;
    warmAbortRef.current?.abort();
    attemptRef.current++;
    voicedFramesRef.current = 0;
    if (warmKey) setWarmSettledKey(warmKey);
    // The wallet signs in a tap of its own. The capture starts on the next one.
    if (!authorization.ensure()) return;
    submittingEmittedRef.current = false;
    // Starts inside the tap, because motion permission needs that gesture.
    pairedCapture.start("verify");
  }

  /** Every round is committed. Validation, proof and submission follow. */
  function handleCommitted(finish: PairedFinish, voicedFrames: number) {
    const attempt = attemptRef.current;
    const active = () => attemptRef.current === attempt;
    voicedFramesRef.current = voicedFrames;
    emitHeartbeat(ctx, "proving");
    setProcessingStage("Extracting features...");
    setState({ step: "processing" });

    const proofPromise = finish(wallet?.adapter, connection, (stage) => {
      if (!active()) return;
      setProcessingStage(stage);
      if (
        stage.toLowerCase().includes("submitting") &&
        !submittingEmittedRef.current
      ) {
        submittingEmittedRef.current = true;
        emitHeartbeat(ctx, "submitting");
        setState({ step: "signing" });
      }
    });
    settle(proofPromise, active);
  }

  function settle(proofPromise: Promise<VerificationResult>, active: () => boolean) {
    let backstopTimer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      backstopTimer = setTimeout(() => {
        const err = new Error("Verification took too long and was stopped");
        err.name = BACKSTOP_ERROR_NAME;
        reject(err);
      }, VERIFICATION_BACKSTOP_MS);
    });

    Promise.race([proofPromise, timeoutPromise])
      .then(async (result) => {
        if (!active()) return;
        if (!result.success) {
          reportRefusal(result.reason);
          if (isClientOriginReason(result.reason)) {
            fail("network_error");
            return;
          }
          if (result.reason === "anchor_retry") {
            fail("validation_failed", undefined, undefined, {
              title: "Baseline not set",
              body: "We couldn't set your baseline from that capture. Return to the app to try again and say each word once.",
              stayOpen: true,
            });
            return;
          }
          if (typeof result.reason === "string") {
            fail("validation_failed");
            return;
          }
          const errorMsg = result.error ?? "";
          if (
            result.failedAt === "baseline" ||
            PREV_COMMITMENT_MISMATCH_PATTERN.test(errorMsg)
          ) {
            emitError(ctx, "validation_failed");
            setState({ step: "failed-baseline-stale" });
            return;
          }
          if (
            result.failedAt === "proving" &&
            !result.opaque &&
            isDriftTooHighError(errorMsg)
          ) {
            fail("validation_failed", undefined, 2, {
              title: "Try another capture",
              body: "This verification did not match your stored baseline. Return to the app to try again, or reset your baseline if this repeats. Baseline resets carry a 7-day cooldown.",
              cta: { label: "Reset baseline", href: "/verify" },
              stayOpen: true,
            });
            return;
          }
          if (isInsufficientSolError(errorMsg)) {
            fail("wallet_rejected", undefined, 3, {
              title: "This wallet needs SOL",
              body: "Your SOL balance does not cover the protocol fees, account rent and network fees for this verification. Add devnet SOL, then return to the app to try again.",
              cta: { label: "Get devnet SOL", href: FAUCET_URL, external: true },
              stayOpen: true,
            });
            return;
          }
          const bucket =
            bucketForResult(result) ??
            (errorMsg ? categorizeError(errorMsg) : "unknown");
          if (
            bucket === "validation_failed" &&
            !result.reason &&
            voicedFramesRef.current === 0 &&
            (result.failedAt === undefined || result.failedAt === "validation")
          ) {
            fail(bucket, undefined, 1, {
              title: "We couldn't hear you",
              body: "The microphone was active, but no voice was detected. Check your device sound settings for the input microphone and volume, then return to the app to try again.",
              stayOpen: true,
            });
            return;
          }
          fail(bucket);
          return;
        }

        // The consumer's strict envelope guard rejects empty `tx_sig`. If
        // the SDK reports success but omits a signature (it shouldn't on
        // success but the type allows it), treat as a wire-level failure
        // rather than emit something the integrator will silently drop.
        if (!publicKey || !result.txSignature) {
          fail("unknown");
          return;
        }

        const walletPubkey = publicKey.toBase58();
        storeLastVerification(walletPubkey, result.txSignature);
        emitHeartbeat(ctx, "attesting");

        setProcessingStage("Checking app requirements...");
        setState({ step: "processing" });
        const policy = await evaluatePopupPolicy(
          params,
          walletPubkey,
          result.txSignature,
          connection,
          params.diagnosticsEnabled ? diagnostic => emitPolicyDiagnostic(ctx, diagnostic) : undefined,
        );
        if (!active()) return;
        if (policy.decision !== "allow" || !policy.evidence) {
          fail(
            policy.decision === "unavailable" ? "network_error" : "validation_failed",
            policy.reason,
            4,
          );
          return;
        }
        const wire = policyResultToWire(policy);
        const attestationPda = policy.evidence.attestation.status === "present"
          ? policy.evidence.attestation.address
          : null;
        if (!params.policy && !attestationPda) {
          fail("validation_failed", "attestation_required", 4);
          return;
        }
        if (verifiedRequestRef.current === ctx.requestId) return;
        verifiedRequestRef.current = ctx.requestId;
        const payload: VerifiedPayload = {
          wallet_pubkey: walletPubkey,
          attestation_pda: attestationPda,
          tx_sig: result.txSignature,
          trust_score: policy.evidence.identity.trustScore,
          cluster: "devnet",
          policy: wire,
        };
        emitVerified(ctx, payload);
        setState({ step: "verified" });
      })
      .catch((err: Error) => {
        if (!active()) return;
        fail(
          err?.name === BACKSTOP_ERROR_NAME
            ? "timeout"
            : categorizeError(err?.message ?? ""),
        );
      })
      .finally(() => clearTimeout(backstopTimer));
  }

  const steps = POPUP_RAIL_STEPS;
  const footer = <PrivacyFooter lines={[PRIVACY_LINES[2]]} />;

  // Mounted ahead of the capture step at one place in the tree, so the session
  // a start tap opens survives the move into the rounds.
  const pairedHost = (
    <PairedCapture
      capturing={state.step === "capturing"}
      wallet={publicKey?.toBase58() ?? null}
      connection={connection}
      hasMotion={hasMotion}
      dispatch={dispatch}
      onHandle={setPairedCapture}
      onCommitted={handleCommitted}
    />
  );
  const frame = (
    rail: RailState,
    announcement: string,
    viewKey: string,
    view: React.ReactNode,
    frameFooter: React.ReactNode = footer,
  ) => (
    <VerifyConsole
      framed={false}
      steps={steps}
      rail={rail}
      announcement={announcement}
      viewKey={viewKey}
      footer={frameFooter}
      persistent={pairedHost}
    >
      {view}
    </VerifyConsole>
  );

  if (state.step === "verified") {
    return frame(
      { current: 4, status: "complete" },
      "Verified",
      "verified",
      <PopupSuccess
        detail={
          state.reused
            ? "Existing verification meets this policy. No transaction needed."
            : undefined
        }
      />,
    );
  }
  if (state.step === "failed") {
    return frame(
      { current: state.railStep, status: "error" },
      state.recovery?.title ?? "Verification stopped",
      "failed",
      <PopupFailure
        reason={state.reason}
        policyReason={state.policyReason}
        recovery={state.recovery}
      />,
    );
  }
  if (state.step === "failed-baseline-stale") {
    return frame(
      { current: 2, status: "error" },
      "Baseline out of sync",
      "stale",
      <PopupBaselineStale />,
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
    const current =
      processingStage === "Checking app requirements..."
        ? 4
        : signing
          ? 3
          : railStepForStage(processingStage);
    return frame(
      { current, status: "active" },
      signing ? "Approve the transaction in your wallet" : processingStage,
      "pipeline",
      <ProofPipeline stage={processingStage} signing={signing} />,
    );
  }

  if (!connected) {
    return frame(
      { current: 0, status: "ready" },
      "Verify with Entros",
      "connect",
      <div className="space-y-7 text-center">
        <StateIcon>
          <Wallet className="h-12 w-12" strokeWidth={1.1} />
        </StateIcon>
        <div>
          <h1 className="font-display text-3xl font-normal tracking-[-0.015em] text-foreground">
            Verify with Entros
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-foreground/65">
            Connect your Solana wallet to start.
          </p>
        </div>
        {walletError && (
          <div
            role="alert"
            className="mx-auto flex w-full max-w-sm items-center gap-3 border border-danger/30 bg-danger/[0.07] py-2.5 pl-4 pr-2 text-left"
          >
            <p className="flex-1 text-xs leading-5 text-foreground/80">
              Wallet didn&apos;t connect: {formatWalletConnectionError(walletError)}
            </p>
            <button
              type="button"
              onClick={clearWalletError}
              aria-label="Dismiss wallet error"
              className={`flex h-9 w-9 shrink-0 items-center justify-center text-foreground/50 transition-colors hover:text-foreground ${verificationFocusRing}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        <div className="vc-wallet">
          <WalletConnectButton />
        </div>
      </div>,
      <PrivacyFooter lines={PRIVACY_LINES} />,
    );
  }

  return frame(
    { current: 1, status: "ready" },
    "Verify with Entros",
    "idle",
    <div className="space-y-8 text-center">
      <div>
        <VerifyWalletChip />
        <h1 className="mt-6 font-display text-3xl font-normal tracking-[-0.015em] text-foreground">
          Verify with Entros
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground/65">
          Authorize your wallet, complete three short rounds, then approve one transaction.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={!pairedCapture || authorization.pending}
          className={primaryVerificationActionClass}
        >
          {pairedStartLabel(authorization, "Start Verification")}
          <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
        {checkingWarm && (
          <p className="font-mono text-[11px] text-foreground/45" role="status">
            Checking existing verification...
          </p>
        )}
      </div>
      {authorization.error && (
        <p className="mx-auto max-w-sm text-sm text-danger" role="alert">
          {authorization.error}
        </p>
      )}
    </div>,
    <PrivacyFooter lines={PRIVACY_LINES} />,
  );
}
