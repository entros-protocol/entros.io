"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, Wallet } from "lucide-react";
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
import { policyResultToWire, type PolicyReason } from "@entros/verify/policy";
import { useMotionCapability } from "@/hooks/use-motion-capability";

import { ProofPipeline } from "@/components/verify/step-views";
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
import { primaryVerificationActionClass } from "@/components/verify/verification-styles";
import type {
  PairedCaptureHandle,
  PairedFinish,
  VerifyAction,
} from "@/components/verify/types";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";

import {
  PREV_COMMITMENT_MISMATCH_PATTERN,
  bucketForResult,
  bucketForCaptureFailure,
  categorizeError,
} from "./categorize-embed-error";
import { PopupBaselineStale } from "./popup-baseline-stale";
import { PopupSuccess } from "./popup-success";
import { PopupFailure } from "./popup-failure";

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
  | { step: "verified" }
  | {
      step: "failed";
      reason: EmbedErrorReason;
      policyReason?: PolicyReason;
      /** The progress step in focus when the failure landed. */
      railStep: number;
    }
  // Distinct from `failed`: stale on-chain commitment (entros-anchor
  // `Custom(6011) PrevCommitmentMismatch`) can't be resolved by
  // re-clicking the integrator's button — needs a baseline reset on
  // /verify. Renders an interactive recovery surface that does not
  // auto-close. The wire still emits `validation_failed`.
  | { step: "failed-baseline-stale" };

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

  const [state, setState] = useState<State>({ step: "idle" });
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

  const ctx = useMemo<EmbedContext>(
    () => ({
      parentOrigin: params.parentOrigin,
      requestId: params.requestId,
    }),
    [params.parentOrigin, params.requestId],
  );

  const fail = useCallback(
    (reason: EmbedErrorReason, policyReason?: PolicyReason, railStep?: number) => {
      emitError(ctx, reason, params.policy ? policyReason : undefined);
      // Read from the previous state: failures land from async callbacks whose
      // closure still holds an earlier step.
      setState((previous) => ({
        step: "failed",
        reason,
        policyReason,
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
        case "VERIFICATION_FAILED":
          fail(bucketForCaptureFailure(action.reason), undefined, 1);
          return;
        case "RESET":
          attemptRef.current++;
          setState({ step: "idle" });
          return;
        default:
          return;
      }
    },
    [ctx, fail],
  );

  function handleStart() {
    if (!pairedCapture || !publicKey) return;
    attemptRef.current++;
    submittingEmittedRef.current = false;
    // Starts inside the tap, because motion permission needs that gesture.
    pairedCapture.start("verify");
  }

  /** Every round is committed. Validation, proof and submission follow. */
  function handleCommitted(finish: PairedFinish) {
    const attempt = attemptRef.current;
    const active = () => attemptRef.current === attempt;
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
        if (!active()) return;        if (result.compositeRiskScore !== undefined) {
          console.log(
            `[Entros] Embed popup verification telemetry composite risk score: ${result.compositeRiskScore.toFixed(4)}`,
          );
        }
        if (!result.success) {
          // `validation_unavailable` is the SDK's signal for an unreachable
          // validator — surfaces as network_error. Other reason codes are
          // validator soft-rejects (variance_floor, entropy_bounds, etc.)
          // and collapse to validation_failed. Anything without a reason
          // code categorizes by error string.
          if (isClientOriginReason(result.reason)) {
            fail("network_error");
            return;
          }
          if (typeof result.reason === "string") {
            fail("validation_failed");
            return;
          }
          // Anything a baseline reset fixes: emit the same opaque
          // validation_failed bucket on the wire (the integrator handles it the
          // same way either way) but route the popup UI to the dedicated
          // recovery surface that links to /verify's reset path.
          //
          // Two ways in. `Custom 6011` is the on-chain revert. `failedAt ===
          // "baseline"` is the pre-flight case the SDK gained in 4.1.0: an
          // anchor with no on-chain baseline to recover, which is 94 of the 107
          // on devnet and used to dead-end here as `unknown` with nothing for
          // the user to do.
          const errorMsg = result.error ?? "";
          if (
            result.failedAt === "baseline" ||
            PREV_COMMITMENT_MISMATCH_PATTERN.test(errorMsg)
          ) {
            emitError(ctx, "validation_failed");
            setState({ step: "failed-baseline-stale" });
            return;
          }
          fail(
            bucketForResult(result) ??
              (errorMsg ? categorizeError(errorMsg) : "unknown"),
          );
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

        emitHeartbeat(ctx, "attesting");

        setProcessingStage("Checking app requirements...");
        setState({ step: "processing" });
        const walletPubkey = publicKey.toBase58();
        const policy = await evaluatePopupPolicy(
          params,
          walletPubkey,
          result.txSignature,
          connection,
          params.diagnosticsEnabled ? diagnostic => emitPolicyDiagnostic(ctx, diagnostic) : undefined,
        );
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
    return frame({ current: 4, status: "complete" }, "Verified", "verified", <PopupSuccess />);
  }
  if (state.step === "failed") {
    return frame(
      { current: state.railStep, status: "error" },
      "Verification stopped",
      "failed",
      <PopupFailure reason={state.reason} policyReason={state.policyReason} />,
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
          Three short rounds, then one signature in your wallet.
        </p>
      </div>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleStart}
          disabled={!pairedCapture}
          className={primaryVerificationActionClass}
        >
          Start Verification
          <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>,
    <PrivacyFooter lines={PRIVACY_LINES} />,
  );
}
