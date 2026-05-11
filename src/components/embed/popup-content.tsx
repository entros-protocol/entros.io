"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import type { Connection } from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";
import { Wallet } from "lucide-react";
import {
  type PulseSession,
  PROGRAM_IDS,
} from "@entros/pulse-sdk";
import { fetchChallengeViaProxy } from "@/lib/relay-challenge";

import type { ParsedEmbedParams } from "@/lib/embed/url-params";
import type { EmbedContext } from "@/lib/embed/post-message";
import {
  emitError,
  emitHeartbeat,
  emitVerified,
} from "@/lib/embed/post-message";
import type { EmbedErrorReason, VerifiedPayload } from "@/lib/embed/types";
import { deriveAttestationPda } from "@/lib/embed/attestation-pda";

import { PulseChallenge } from "@/components/verify/pulse-challenge";
import { ProvingView, SigningView } from "@/components/verify/step-views";
import { WalletConnectButton } from "@/components/ui/wallet-connect-button";
import { ConnectedWalletPill } from "@/components/ui/connected-wallet-pill";
import { usePulse } from "@/components/providers/pulse-provider";

import { PopupBaselineStale } from "./popup-baseline-stale";
import { PopupSuccess } from "./popup-success";
import { PopupFailure } from "./popup-failure";

type State =
  | { step: "idle" }
  | { step: "capturing" }
  | { step: "processing" }
  | { step: "signing" }
  | { step: "verified" }
  | { step: "failed"; reason: EmbedErrorReason }
  // Distinct from `failed`: stale on-chain commitment (entros-anchor
  // `Custom(6011) PrevCommitmentMismatch`) can't be resolved by
  // re-clicking the integrator's button — needs a baseline reset on
  // /verify. Renders an interactive recovery surface that does not
  // auto-close. The wire still emits `validation_failed`.
  | { step: "failed-baseline-stale" };

const PROOF_TIMEOUT_MS = 60_000;

/**
 * SDK-emitted reason code signaling that the validator's
 * `/validate-features` endpoint was unreachable. Distinct from the
 * validator's safe-reveal soft-reject reasons (variance_floor etc.) —
 * surfaces as `network_error` rather than `validation_failed`.
 */
const VALIDATION_UNAVAILABLE_REASON = "validation_unavailable";

/**
 * `entros-anchor` Custom error code 6011 (`PrevCommitmentMismatch`):
 * the proof's `commitment_prev` doesn't match the identity's current
 * on-chain commitment. Re-clicking the integrator's button can't fix
 * this; the user has to reset baseline on /verify first. Detected here
 * so we route to a dedicated recovery surface instead of the generic
 * "Try again from the integrator" copy.
 */
const PREV_COMMITMENT_MISMATCH_PATTERN = /"Custom":\s*6011\b/;

/**
 * Reads `trust_score` directly from the IdentityState PDA via a byte
 * parse, matching the pattern used in `verify-wallet-connected.tsx`,
 * `dashboard-anchor-view.tsx`, and pulse-sdk's own `agent/anchor.ts`.
 *
 * Account layout (canonical, mirrored across the codebase):
 *   bytes  0..7  Anchor discriminator
 *   bytes  8..39 owner pubkey (32)
 *   bytes 40..47 creation_timestamp (i64 LE)
 *   bytes 48..55 last_verification_timestamp (i64 LE)
 *   bytes 56..59 verification_count (u32 LE)
 *   bytes 60..61 trust_score (u16 LE)
 *
 * Avoids the SDK's `fetchIdentityState` because that helper performs a
 * runtime IDL fetch which (a) is unnecessary now that the on-chain
 * layout is stable and (b) silently fails on transient RPC issues,
 * collapsing the integrator-facing trust_score to 0 even when the
 * wallet's on-chain score is non-zero.
 *
 * Retries on a fresh `getAccountInfo` call to absorb the RPC's
 * read-after-write lag — a tx that just confirmed on the validator is
 * not always immediately readable from the same connection's RPC.
 */
// Linear backoff for the IdentityState read after a successful chain
// submit. Total cumulative wait across attempts: 800 + 1600 + 2400 = 4.8s,
// comfortably exceeding typical devnet RPC propagation lag (~1–2s) without
// pushing the popup's perceived close timing past the success surface.
const TRUST_SCORE_RETRY_BACKOFF_MS = 800;
const TRUST_SCORE_MAX_ATTEMPTS = 4;

async function readTrustScoreFromChain(
  walletPubkey: string,
  connection: Connection,
): Promise<number> {
  const programId = new PublicKey(PROGRAM_IDS.entrosAnchor);
  const [identityPda] = PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode("identity"),
      new PublicKey(walletPubkey).toBuffer(),
    ],
    programId,
  );

  for (let attempt = 0; attempt < TRUST_SCORE_MAX_ATTEMPTS; attempt++) {
    const account = await connection
      .getAccountInfo(identityPda)
      .catch(() => null);
    if (account && account.data.length >= 62) {
      const view = new DataView(
        account.data.buffer,
        account.data.byteOffset,
        account.data.byteLength,
      );
      return view.getUint16(60, true);
    }
    if (attempt < TRUST_SCORE_MAX_ATTEMPTS - 1) {
      await new Promise((r) =>
        setTimeout(r, TRUST_SCORE_RETRY_BACKOFF_MS * (attempt + 1)),
      );
    }
  }
  return 0;
}

/**
 * Maps a free-form error string from the SDK / wallet adapter / RPC layer
 * into one of the popup's opaque `EmbedErrorReason` buckets. The buckets
 * are deliberately coarse — integrators receive a category, never the raw
 * message, so adversarial probes can't enumerate the validator's internal
 * rejection codes through the popup boundary.
 */
function categorizeError(error: string): EmbedErrorReason {
  const e = error.toLowerCase();
  if (
    e.includes("user rejected") ||
    e.includes("rejected the request") ||
    e.includes("user denied") ||
    e.includes("rejected by user") ||
    e.includes("prior credit") ||
    e.includes("insufficient funds") ||
    e.includes("insufficient lamports")
  ) {
    return "wallet_rejected";
  }
  if (
    e.includes("doctype") ||
    e.includes("failed to fetch") ||
    e.includes("networkerror") ||
    e.includes("blockhash not found") ||
    e.includes("block height exceeded")
  ) {
    return "network_error";
  }
  if (e.includes("timed out") || e.includes("timeout")) {
    return "timeout";
  }
  // Anchor program reverts surface from pulse-sdk 1.5.0 as
  //   Transaction failed on chain: {"InstructionError":[N,{"Custom":CODE}]}
  // The Custom codes (PrevCommitmentMismatch 6011, ResetCooldownActive
  // 6012, ProofFromFuture 6014, MissingValidatorReceipt 6015, etc.) all
  // signal that the on-chain program rejected the submission — collapse
  // them into validation_failed so the integrator sees a meaningful
  // bucket rather than the catch-all unknown.
  if (e.includes('"custom"') || e.includes("instructionerror")) {
    return "validation_failed";
  }
  return "unknown";
}

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
  const [hasMotion, setHasMotion] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [processingStage, setProcessingStage] = useState(
    "Extracting features...",
  );
  const [challengePhrase, setChallengePhrase] = useState<string | null>(null);

  const sessionRef = useRef<PulseSession | null>(null);
  const startingRef = useRef(false);
  const touchRef = useRef<HTMLDivElement>(null);
  const submittingEmittedRef = useRef(false);

  const ctx = useMemo<EmbedContext>(
    () => ({
      parentOrigin: params.parentOrigin,
      requestId: params.requestId,
    }),
    [params.parentOrigin, params.requestId],
  );

  useEffect(() => {
    setHasMotion(navigator.maxTouchPoints > 0);
  }, []);

  function fail(reason: EmbedErrorReason) {
    emitError(ctx, reason);
    setState({ step: "failed", reason });
  }

  async function handleStart() {
    if (startingRef.current) return;
    startingRef.current = true;
    setRequesting(true);
    setChallengePhrase(null);
    submittingEmittedRef.current = false;

    try {
      // Fire challenge fetch in parallel with sensor permissions. The iOS
      // motion-permission gesture-token rule (documented in
      // verify-wallet-connected.tsx) prohibits awaiting network round-trips
      // before the motion prompt — we only await the challenge AFTER all
      // permissions resolve, just before transitioning to the capturing UI.
      const challengePromise: Promise<string | null> = publicKey
        ? fetchChallengeViaProxy(publicKey.toBase58())
            .then((c) => c.phrase)
            .catch(() => null)
        : Promise.resolve(null);

      const session = pulse.createSession(document.body);
      sessionRef.current = session;

      if (hasMotion) {
        try {
          await session.startMotion();
          if (!session.isMotionCapturing()) {
            fail("validation_failed");
            return;
          }
        } catch {
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
        fail("validation_failed");
        return;
      }

      session.startTouch().catch(() => session.skipTouch());

      // Fail the verification if no phrase came back. The previous
      // silent fallback to client-generated nonsense produced a broken
      // UX (gibberish syllables) and bypassed phrase content binding
      // server-side, opening a bypass for any path that blocks the
      // /challenge fetch.
      const phrase = await challengePromise;
      if (!phrase) {
        fail("network_error");
        return;
      }
      setChallengePhrase(phrase);

      emitHeartbeat(ctx, "capturing");
      setState({ step: "capturing" });
    } finally {
      startingRef.current = false;
      setRequesting(false);
    }
  }

  async function handleCaptureComplete() {
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
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error("Proof generation timed out")),
        PROOF_TIMEOUT_MS,
      ),
    );

    Promise.race([proofPromise, timeoutPromise])
      .then(async (result) => {
        if (!result.success) {
          // `validation_unavailable` is the SDK's signal for an unreachable
          // validator — surfaces as network_error. Other reason codes are
          // validator soft-rejects (variance_floor, entropy_bounds, etc.)
          // and collapse to validation_failed. Anything without a reason
          // code categorizes by error string.
          if (result.reason === VALIDATION_UNAVAILABLE_REASON) {
            fail("network_error");
            return;
          }
          if (typeof result.reason === "string") {
            fail("validation_failed");
            return;
          }
          // Stale-baseline on-chain revert: emit the same opaque
          // validation_failed bucket on the wire (integrator handles
          // the same way) but route the popup UI to the dedicated
          // recovery surface that links to /verify's reset path.
          const errorMsg = result.error ?? "";
          if (PREV_COMMITMENT_MISMATCH_PATTERN.test(errorMsg)) {
            emitError(ctx, "validation_failed");
            setState({ step: "failed-baseline-stale" });
            return;
          }
          fail(errorMsg ? categorizeError(errorMsg) : "unknown");
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

        const walletPubkey = publicKey.toBase58();
        const attestationPda = deriveAttestationPda(walletPubkey);

        const trustScore = await readTrustScoreFromChain(
          walletPubkey,
          connection,
        );

        const payload: VerifiedPayload = {
          wallet_pubkey: walletPubkey,
          attestation_pda: attestationPda,
          tx_sig: result.txSignature,
          trust_score: trustScore,
          cluster: params.cluster,
        };
        emitVerified(ctx, payload);
        setState({ step: "verified" });
      })
      .catch((err: Error) => {
        const isTimeout = err.message?.toLowerCase().includes("timed out");
        fail(isTimeout ? "timeout" : categorizeError(err.message ?? ""));
      });
  }

  if (state.step === "verified") {
    return <PopupSuccess />;
  }
  if (state.step === "failed") {
    return <PopupFailure reason={state.reason} />;
  }
  if (state.step === "failed-baseline-stale") {
    return <PopupBaselineStale />;
  }
  if (state.step === "capturing") {
    // Invariant: handleStart only transitions to "capturing" after the
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
  if (state.step === "processing") {
    return <ProvingView stage={processingStage} />;
  }
  if (state.step === "signing") {
    return <SigningView />;
  }

  if (!connected) {
    return (
      <div className="text-center space-y-6">
        <Wallet
          className="mx-auto h-10 w-10 text-foreground/50"
          strokeWidth={1.5}
        />
        <p className="font-mono text-base font-semibold text-foreground">
          Verify with Entros
        </p>
        <p className="mx-auto max-w-xs text-sm text-foreground/70">
          Connect your Solana wallet to begin a 12-second behavioral capture.
        </p>
        <WalletConnectButton className="!rounded-full !border !border-border !bg-surface !text-foreground !font-mono !text-sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 inline-flex">
          <ConnectedWalletPill size="sm" />
        </div>
        <p className="font-mono text-base font-semibold text-foreground">
          Verify with Entros
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/70">
          Speak a phrase while tracing a shape. All sensors record for 12
          seconds. Then sign with your wallet.
        </p>
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleStart}
          disabled={requesting}
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
        Raw data is never stored.
        <br />
        Only the proof and a statistical summary persist.
      </p>
    </div>
  );
}
