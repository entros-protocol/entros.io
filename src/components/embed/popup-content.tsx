"use client";

import { useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ArrowRight, Wallet } from "lucide-react";
import {
  type PulseSession,
  type CurveTracePoint,
  MAX_VERIFICATION_MS,
  isClientOriginReason,
} from "@entros/pulse-sdk";
import {
  fetchChallengeViaProxy,
  type ChallengeResponse,
} from "@/lib/relay-challenge";

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

import { PulseChallenge } from "@/components/verify/pulse-challenge";
import { ProofPipeline } from "@/components/verify/step-views";
import {
  POPUP_RAIL_STEPS,
  PRIVACY_LINES,
  PrivacyFooter,
  StateIcon,
  VerifyConsole,
  VerifyWalletChip,
  railStepForStage,
} from "@/components/verify/console";
import { primaryVerificationActionClass } from "@/components/verify/verification-styles";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { usePulse } from "@/components/providers/pulse-provider";
import {
  bindPulseValidationChallenge,
  stopPulseCapture,
} from "@/lib/pulse-session";

import {
  PREV_COMMITMENT_MISMATCH_PATTERN,
  bucketForResult,
  categorizeError,
} from "./categorize-embed-error";
import { PopupBaselineStale } from "./popup-baseline-stale";
import { PopupSuccess } from "./popup-success";
import { PopupFailure } from "./popup-failure";

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

// The `validation_unavailable` literal used to be redeclared here. It now
// comes from the SDK's taxonomy via `isClientOriginReason`, which also covers
// `validation_timeout`, a failure this surface previously could not name.

/**
 * Client component that owns the popup's interactive verification surface.
 * Composes the pulse-sdk pipeline (sensor capture → ZK proof → on-chain
 * mint) over a popup-flavored UI and emits postMessage envelopes to the
 * opener at each phase boundary. One shot — no soft-reject retry; failure
 * surfaces auto-close so the user re-triggers from the integrator.
 */
export function PopupContent({ params }: { params: ParsedEmbedParams }) {
  const { connected, wallet, publicKey } = useWallet();
  const { connection } = useConnection();
  const pulse = usePulse();

  const [state, setState] = useState<State>({ step: "idle" });
  const [audioLevel, setAudioLevel] = useState(0);
  const hasMotion = useMotionCapability();
  const [requesting, setRequesting] = useState(false);
  const [processingStage, setProcessingStage] = useState(
    "Extracting features...",
  );
  const [validationChallenge, setValidationChallenge] =
    useState<ChallengeResponse | null>(null);

  const sessionRef = useRef<PulseSession | null>(null);
  const startingRef = useRef(false);
  const submittingEmittedRef = useRef(false);

  const ctx = useMemo<EmbedContext>(
    () => ({
      parentOrigin: params.parentOrigin,
      requestId: params.requestId,
    }),
    [params.parentOrigin, params.requestId],
  );

  function fail(
    reason: EmbedErrorReason,
    policyReason?: PolicyReason,
    railStep?: number,
  ) {
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
  }

  async function handleStart() {
    if (startingRef.current) return;
    startingRef.current = true;
    setRequesting(true);
    setValidationChallenge(null);
    submittingEmittedRef.current = false;

    try {
      // Fire challenge fetch in parallel with sensor permissions. The iOS
      // motion-permission gesture-token rule (documented in
      // verify-wallet-connected.tsx) prohibits awaiting network round-trips
      // before the motion prompt — we only await the challenge AFTER all
      // permissions resolve, just before transitioning to the capturing UI.
      const challengePromise: Promise<ChallengeResponse | null> = publicKey
        ? fetchChallengeViaProxy(publicKey.toBase58()).catch(() => null)
        : Promise.resolve(null);

      const session = pulse.createSession();
      sessionRef.current = session;

      if (hasMotion) {
        try {
          await session.startMotion();
          if (!session.isMotionCapturing()) {
            await stopPulseCapture(session);
            fail("validation_failed");
            return;
          }
        } catch {
          await stopPulseCapture(session);
          fail("validation_failed");
          return;
        }
      } else {
        session.skipMotion();
      }

      try {
        let audioFrameCount = 0;
        await session.startAudio((rms) => {
          audioFrameCount++;
          if (audioFrameCount % 2 === 0) setAudioLevel(rms);
        });
      } catch {
        await stopPulseCapture(session);
        fail("validation_failed");
        return;
      }

      // Fail the verification if no phrase came back. The previous
      // silent fallback to client-generated nonsense produced a broken
      // UX (gibberish syllables) and bypassed phrase content binding
      // server-side, opening a bypass for any path that blocks the
      // /challenge fetch.
      const challenge = await challengePromise;
      if (!challenge) {
        await stopPulseCapture(session);
        fail("network_error");
        return;
      }
      try {
        bindPulseValidationChallenge(session, challenge);
      } catch {
        await stopPulseCapture(session);
        fail("timeout");
        return;
      }
      setValidationChallenge(challenge);

      emitHeartbeat(ctx, "capturing");
      setState({ step: "capturing" });
    } finally {
      startingRef.current = false;
      setRequesting(false);
    }
  }

  /**
   * The speak prompt is on screen, so the SDK can drop everything it recorded
   * beforehand. The recorder starts early on purpose, so the prompt never
   * appears during the microphone's cold start, which means the buffer opens
   * with the challenge fetch and the countdown inside it.
   */
  async function handleCaptureWindowOpen(surface: HTMLDivElement) {
    const session = sessionRef.current;
    if (!session) throw new Error("Verification session is unavailable");
    await session.startTouch({
      eventTarget: surface,
      coordinateSurface: surface,
    });
    session.markCaptureStart();
  }

  async function handleCaptureError() {
    const session = sessionRef.current;
    if (session) await stopPulseCapture(session);
    fail("validation_failed");
  }

  async function handleCaptureComplete(outline: CurveTracePoint[]) {
    const session = sessionRef.current;
    if (!session) return;

    try {
      await session.stopAudio();
    } catch {
      /* skipped */
    }
    try {
      await session.stopMotion();
    } catch {
      /* skipped */
    }
    try {
      await session.stopTouch();
    } catch {
      /* skipped */
    }

    emitHeartbeat(ctx, "proving");
    setState({ step: "processing" });

    const proofPromise = session.complete(
      wallet?.adapter,
      connection,
      (stage) => {
        setProcessingStage(stage);
        if (
          stage.toLowerCase().includes("submitting") &&
          !submittingEmittedRef.current
        ) {
          submittingEmittedRef.current = true;
          emitHeartbeat(ctx, "submitting");
          setState({ step: "signing" });
        }
      },
      outline,
    );

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
        if (result.compositeRiskScore !== undefined) {
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

  if (state.step === "verified") {
    return (
      <VerifyConsole framed={false} steps={steps} rail={{ current: 4, status: "complete" }} announcement="Verified" viewKey="verified" footer={footer}>
        <PopupSuccess />
      </VerifyConsole>
    );
  }
  if (state.step === "failed") {
    return (
      <VerifyConsole framed={false} steps={steps} rail={{ current: state.railStep, status: "error" }} announcement="Verification stopped" viewKey="failed" footer={footer}>
        <PopupFailure reason={state.reason} policyReason={state.policyReason} />
      </VerifyConsole>
    );
  }
  if (state.step === "failed-baseline-stale") {
    return (
      <VerifyConsole framed={false} steps={steps} rail={{ current: 2, status: "error" }} announcement="Baseline out of sync" viewKey="stale" footer={footer}>
        <PopupBaselineStale />
      </VerifyConsole>
    );
  }
  if (state.step === "capturing") {
    // Invariant: handleStart only transitions to "capturing" after the
    // server-issued phrase is in state, so challengePhrase is non-null
    // here. Guard kept for type safety.
    if (!validationChallenge) {
      return null;
    }
    return (
      <VerifyConsole
        framed={false}
        steps={steps}
        rail={{ current: 1, status: "active" }}
        announcement=""
        viewKey="capturing"
        footer={<PrivacyFooter lines={["Raw motion and touch stay on this device. Audio is never stored."]} />}
      >
        <PulseChallenge
          onComplete={handleCaptureComplete}
          onCaptureWindowOpen={handleCaptureWindowOpen}
          onCaptureError={handleCaptureError}
          audioLevel={audioLevel}
          hasMotion={hasMotion}
          phrase={validationChallenge.phrase}
          curve={validationChallenge.curve}
        />
      </VerifyConsole>
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
    return (
      <VerifyConsole
        framed={false}
        steps={steps}
        rail={{ current, status: "active" }}
        announcement={signing ? "Approve the transaction in your wallet" : processingStage}
        viewKey="pipeline"
        footer={footer}
      >
        <ProofPipeline stage={processingStage} signing={signing} />
      </VerifyConsole>
    );
  }

  if (!connected) {
    return (
      <VerifyConsole
        framed={false}
        steps={steps}
        rail={{ current: 0, status: "ready" }}
        announcement="Verify with Entros"
        viewKey="connect"
        footer={<PrivacyFooter lines={PRIVACY_LINES} />}
      >
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
        </div>
      </VerifyConsole>
    );
  }

  return (
    <VerifyConsole
      framed={false}
      steps={steps}
      rail={{ current: 1, status: "ready" }}
      announcement="Verify with Entros"
      viewKey="idle"
      footer={<PrivacyFooter lines={PRIVACY_LINES} />}
    >
      <div className="space-y-8 text-center">
        <div>
          <VerifyWalletChip />
          <h1 className="mt-6 font-display text-3xl font-normal tracking-[-0.015em] text-foreground">
            Verify with Entros
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-foreground/65">
            One short capture, then one signature in your wallet.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleStart}
            disabled={requesting}
            className={primaryVerificationActionClass}
          >
            {requesting ? "Requesting access..." : "Start Verification"}
            {!requesting && <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden />}
          </button>
        </div>
      </div>
    </VerifyConsole>
  );
}
