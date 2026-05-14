"use client";

import { CheckCircle, AlertCircle, ExternalLink, Loader2, RefreshCcw } from "lucide-react";

const STAGE_SUBTITLES: Record<string, string> = {
  "Extracting features...": "Analyzing voice, motion, and touch data",
  "Validating...": "Server-side feature validation",
  "Computing proof...": "Generating zero-knowledge proof",
  "Submitting to Solana...": "Writing verification on-chain",
};

/**
 * Solid cyan block that tumbles clockwise — holds on a side, rotates
 * 90° to the next, repeats four times per cycle. Replaces the lucide
 * `Loader2` circular spinner on Entros-owned proving stages
 * (Extracting features → Validating → Computing proof → Submitting).
 * The wallet-owned signing stage keeps its purple `Loader2` to
 * distinguish wallet-side wait from protocol-side work.
 *
 * Rotation pivot is the geometric centre, so the block stays put on
 * screen. The eye reads rotation during the eased 90° glide; the
 * resting holds in between let each side land as a deliberate tick,
 * giving it a calm cartoon-block rhythm rather than a continuous spin.
 */
function TumblingSquare() {
  return (
    <div
      className="mx-auto h-6 w-6 bg-cyan"
      style={{ animation: "entros-tumble 3s ease-in-out infinite" }}
      aria-hidden
    />
  );
}

export function ProvingView({ stage }: { stage?: string }) {
  const label = stage || "Processing...";
  const subtitle = (stage && STAGE_SUBTITLES[stage]) || "Please wait";

  return (
    <div className="text-center space-y-4">
      <TumblingSquare />
      <p className="font-mono text-sm text-foreground">
        {label}
      </p>
      <p className="text-xs text-muted">
        {subtitle}
      </p>
    </div>
  );
}

export function SigningView() {
  return (
    <div className="text-center space-y-4">
      <Loader2 className="mx-auto h-8 w-8 text-solana-purple animate-spin" />
      <p className="font-mono text-sm text-foreground">
        Waiting for wallet signature...
      </p>
      <p className="text-xs text-muted">
        Approve the transaction in your wallet
      </p>
    </div>
  );
}

export function VerifiedView({
  commitment,
  txSignature,
  subtitle,
  onReset,
  title = "Verified",
  tryAgainLabel = "Verify again",
}: {
  commitment: string;
  txSignature?: string;
  subtitle: string;
  onReset: () => void;
  /** Success headline. Pass "Baseline reset" for reset flows. */
  title?: string;
  /** Label for the action that starts a new verification cycle. */
  tryAgainLabel?: string;
}) {
  return (
    <div className="text-center space-y-6">
      <CheckCircle className="mx-auto h-12 w-12 text-cyan" />
      <div>
        <p className="font-sans text-xl font-semibold text-foreground">
          {title}
        </p>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
      </div>
      <div className="mx-auto max-w-sm space-y-3">
        <div className="rounded-lg border border-border bg-surface/50 p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">
            Commitment
          </p>
          <p className="font-mono text-xs text-foreground/70 break-all">
            {commitment}
          </p>
        </div>
        {txSignature && (
          <div className="rounded-lg border border-border bg-surface/50 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">
              Transaction
            </p>
            <p className="font-mono text-xs text-foreground/70 break-all">
              {txSignature}
            </p>
          </div>
        )}
      </div>
      <button
        onClick={onReset}
        className="text-sm text-muted hover:text-foreground transition-colors"
      >
        {tryAgainLabel}
      </button>
    </div>
  );
}

/**
 * Per-category hint for soft-rejected verifications. Keyed by the validator's
 * safe reason label (`pulse-sdk` `VerificationResult.reason`). Hint copy
 * intentionally avoids technique names ("phrase content binding", "temporal
 * coupling", "Whisper", "SimHash", etc.) per the public-copy specificity
 * rule—we describe what the user can DO, not what we measured.
 *
 * Keys must stay in sync with `entros-validation::ReasonCode::safe_label`.
 */
const SOFT_HINT: Record<string, string> = {
  variance_floor:
    "Your signals were a bit flat. Try moving more and speaking with normal volume.",
  entropy_bounds:
    "Your gestures and speech were a bit too uniform. Try varying both naturally.",
  temporal_coupling_low:
    "Speak and move at the same time—they were a bit out of sync.",
  phrase_content_mismatch:
    "Read the phrase clearly at a normal pace, exactly as shown.",
  validation_unavailable:
    "We couldn't reach the verification service. Check your connection and try again.",
};

const SOFT_HINT_FALLBACK =
  "Something didn't come through cleanly. Give it another shot with natural movement and clear speech.";

/**
 * Soft-rejected verification—the validator returned a user-recoverable
 * reason and the parent's retry budget is non-zero. Distinct from
 * `FailedView` so the visual treatment signals "retry" rather than
 * "stop." Cyan accent + RefreshCcw icon match the soft tone.
 */
export function SoftFailedView({
  reason,
  attemptsRemaining,
  onTryAgain,
  onCancel,
}: {
  reason: string;
  attemptsRemaining: number;
  onTryAgain: () => void;
  onCancel: () => void;
}) {
  const hint = SOFT_HINT[reason] ?? SOFT_HINT_FALLBACK;
  const attemptsLabel =
    attemptsRemaining === 1 ? "1 attempt left" : `${attemptsRemaining} attempts left`;

  return (
    <div className="text-center space-y-6">
      <RefreshCcw className="mx-auto h-12 w-12 text-cyan" strokeWidth={1.5} />
      <div>
        <p className="font-sans text-xl font-semibold text-foreground">
          Let&apos;s try that again
        </p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
        <p className="mt-2 text-xs text-muted">{attemptsLabel}</p>
      </div>
      <div className="flex flex-col-reverse gap-2 items-center sm:flex-row sm:justify-center">
        <button
          onClick={onCancel}
          className="rounded-full border border-border px-6 py-2 text-sm text-muted hover:text-foreground hover:border-border-hover transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onTryAgain}
          className="rounded-full border border-cyan/30 bg-cyan/10 px-6 py-2 text-sm font-medium text-cyan hover:bg-cyan/20 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

function isRelayerError(error: string): boolean {
  return (
    error.includes("DOCTYPE") ||
    error.includes("Failed to fetch") ||
    error.includes("NetworkError") ||
    error.includes("localhost")
  );
}

/**
 * Detects the "on-chain anchor exists, local baseline is gone" failure
 * surfaced from `pulse-sdk/src/pulse.ts:278-285`. The stable substring is
 * "baseline is missing"—guarded by a reset.test.ts assertion in the SDK
 * to prevent silent copy drift.
 */
function isMissingBaselineError(error: string): boolean {
  return error.includes("baseline is missing");
}

// Wallet has zero (or insufficient) SOL. Phantom/Solflare/Backpack all
// surface variants of the runtime simulation error verbatim. Match the
// stable substrings the runtime uses, not the wrapper text.
function isInsufficientSolError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("prior credit") ||
    e.includes("insufficient funds") ||
    e.includes("insufficient lamports")
  );
}

// User dismissed or rejected the wallet's signature prompt. Wallet
// adapters use slightly different wording—match the common ones.
function isUserRejectionError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("user rejected") ||
    e.includes("rejected the request") ||
    e.includes("user denied") ||
    e.includes("rejected by user")
  );
}

// Transaction's recent blockhash expired before landing on chain.
// Recoverable by retrying—the SDK requests a fresh blockhash on each
// attempt.
function isStaleBlockhashError(error: string): boolean {
  return (
    error.includes("Blockhash not found") ||
    error.includes("block height exceeded") ||
    error.includes("TransactionExpiredBlockheightExceeded")
  );
}

// Server returns a 429 with `{reason: "rate_limited"}` (per-wallet cap,
// master-list #94) or `{reason: "ip_rate_limited"}` (per-IP cap, #155).
// Both surface a friendly `error` body string starting with "Too many".
// Surfacing a distinct title prevents the "Verification failed" generic
// page when the user is just being told to wait.
function isRateLimitedError(error: string): boolean {
  return error.toLowerCase().includes("too many");
}

// pulse-sdk 1.5.0+ surfaces on-chain Anchor reverts as:
//   Transaction failed on chain: {"InstructionError":[N,{"Custom":CODE}]}
// Code 6011 is `PrevCommitmentMismatch` from entros-anchor — the local
// baseline produces a `commitment_prev` that doesn't match the on-chain
// identity. The user-actionable fix is the same as missing-baseline:
// rotate the on-chain commitment via reset.
function isPrevCommitmentMismatchError(error: string): boolean {
  return /"Custom":\s*6011\b/.test(error);
}

// Code 6012 is `ResetCooldownActive` from entros-anchor. The 7-day
// cooldown after a successful baseline reset has not elapsed. Until it
// does, no further reset can land. Distinct from program-revert because
// the user-actionable answer is "wait" — re-attempting today, even with
// a perfect capture, produces the same revert.
function isResetCooldownError(error: string): boolean {
  return /"Custom":\s*6012\b/.test(error);
}

// Pre-flight cooldown checks (verify-wallet-connected.tsx) embed the
// computed unlock timestamp in the synthetic error string so this UI
// can show the user a specific "try again on $DATE" message. On the
// post-submit path (chain reverts with a real 6012) the field is
// absent and the case falls back to the generic 7-day-cooldown copy.
function extractCooldownUnlockDate(error: string): Date | null {
  const m = /unlock_at=(\S+)/.exec(error);
  if (!m || !m[1]) return null;
  const d = new Date(m[1]);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Catch-all for any other on-chain Anchor program revert (proof-from-
// future, missing receipt, malformed accounts, etc.). Routes to a
// friendly "verification failed" surface instead of leaking the raw
// `{"InstructionError":[N,{"Custom":N}]}` JSON.
function isProgramRevertError(error: string): boolean {
  return error.includes("InstructionError") || /"Custom":\s*\d+/.test(error);
}

// Microphone permission denied. Surface paths:
// - verify-wallet-connected.tsx synthesizes "Microphone access denied. ..."
//   when session.startAudio() throws (browser permissions API rejected).
// - pulse-sdk/pulse.ts wraps captureAudio failures as
//   "Audio capture failed: ${msg}. Ensure microphone permission is granted ..."
// - Some browsers throw native NotAllowedError / PermissionDeniedError —
//   message text varies by browser/OS so match the canonical substrings.
function isMicrophonePermissionError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("microphone access denied") ||
    e.includes("microphone permission") ||
    e.includes("audio capture failed") ||
    e.includes("microphone unavailable") ||
    (e.includes("notallowederror") && e.includes("audio")) ||
    (e.includes("permission denied") && e.includes("audio"))
  );
}

// Microphone reached the page but the audio coming through was effectively
// silent — input device muted at the OS level, wrong default device selected,
// gain too low, or browser-quirk processing returning a near-zero stream.
// verify-wallet-connected.tsx synthesizes "Microphone audio too quiet. ..."
// when the local voiced-frame counter stays below the validator's voicing-
// ratio floor on a server-rejected attempt with no specific safe reason.
// Routed before isMicrophonePermissionError so the more specific condition
// wins; the substrings are disjoint anyway.
function isMicrophoneTooQuietError(error: string): boolean {
  return error.toLowerCase().includes("microphone audio too quiet");
}

// Motion sensor permission denied. iOS 13+ requires explicit consent via
// DeviceMotionEvent.requestPermission() — denial surfaces as our synthetic
// "Motion permission denied" string from verify-wallet-connected.tsx.
function isMotionPermissionError(error: string): boolean {
  const e = error.toLowerCase();
  return (
    e.includes("motion permission denied") || e.includes("motion access")
  );
}

type FailureKind =
  | { kind: "relayer-down" }
  | { kind: "missing-baseline"; canReset: boolean }
  | { kind: "stale-baseline"; canReset: boolean }
  | { kind: "cooldown-active" }
  | { kind: "program-revert" }
  | { kind: "insufficient-sol" }
  | { kind: "user-rejection" }
  | { kind: "stale-blockhash" }
  | { kind: "rate-limited" }
  | { kind: "permission-denied"; device: "microphone" | "motion" }
  | { kind: "microphone-too-quiet" }
  | { kind: "generic"; message: string };

function categorizeFailure(error: string, canResetBaseline: boolean): FailureKind {
  if (isRelayerError(error)) return { kind: "relayer-down" };
  // Quiet-mic detection routes BEFORE permission-denied so a captured-but-
  // silent stream surfaces its own actionable copy ("check input device + OS
  // mute") rather than the permission-recovery instructions, which don't
  // apply when the browser already granted access.
  if (isMicrophoneTooQuietError(error)) {
    return { kind: "microphone-too-quiet" };
  }
  // Permission denials route before generic categories. Both surfaces are
  // browser-state issues the user can fix directly; the generic "Verification
  // failed" copy would misrepresent the cause and bury the actionable fix.
  if (isMicrophonePermissionError(error)) {
    return { kind: "permission-denied", device: "microphone" };
  }
  if (isMotionPermissionError(error)) {
    return { kind: "permission-denied", device: "motion" };
  }
  if (isMissingBaselineError(error)) {
    return { kind: "missing-baseline", canReset: canResetBaseline };
  }
  if (isInsufficientSolError(error)) return { kind: "insufficient-sol" };
  if (isUserRejectionError(error)) return { kind: "user-rejection" };
  if (isStaleBlockhashError(error)) return { kind: "stale-blockhash" };
  if (isRateLimitedError(error)) return { kind: "rate-limited" };
  // Specific Custom codes route before the generic program-revert bucket
  // so each gets its own user-actionable surface.
  if (isPrevCommitmentMismatchError(error)) {
    return { kind: "stale-baseline", canReset: canResetBaseline };
  }
  if (isResetCooldownError(error)) return { kind: "cooldown-active" };
  if (isProgramRevertError(error)) return { kind: "program-revert" };
  return { kind: "generic", message: error };
}

const FAUCET_URL = "https://faucet.solana.com";

// Browser-aware recovery copy for the microphone permission-denied surface.
// Each major browser hides the per-site mic permission control in a different
// place: Chrome/Edge/Brave (lock icon → site settings), Firefox (shield icon →
// edit settings), Safari (Settings → Websites → Microphone). UA sniff is
// fragile in general but acceptable here — only used to render instruction
// copy, not to gate behavior. Brave/Vivaldi/Opera all UA as Chrome and the
// Chrome-style instructions match their UIs closely enough.
function micRecoveryFootnote(): string {
  if (typeof navigator === "undefined") {
    return "Allow microphone access in your browser, then refresh and try again.";
  }
  const ua = navigator.userAgent.toLowerCase();
  // Firefox iOS uses "FxiOS" rather than "firefox" in its UA token; treat
  // both as the Firefox surface so iOS Firefox users see Firefox-shaped
  // recovery copy instead of the Chrome fallback.
  if (ua.includes("firefox") || ua.includes("fxios")) {
    return "In Firefox, click the shield icon in the address bar → Edit settings → set Microphone to Allow. Then refresh this page.";
  }
  if (ua.includes("safari") && !ua.includes("chrome")) {
    return "In Safari, open Settings → Websites → Microphone → entros.io → set to Allow. Then refresh this page.";
  }
  return "Click the lock icon in your address bar, set Microphone to Allow, then refresh this page and try again.";
}

export function FailedView({
  error,
  onReset,
  onResetBaseline,
}: {
  error: string;
  onReset: () => void;
  onResetBaseline?: () => void;
}) {
  const failure = categorizeFailure(error, typeof onResetBaseline === "function");

  let title: string;
  let body: string;
  let footnote: string | null = null;
  let primaryCta: { label: string; href: string } | null = null;
  let secondaryAction: { label: string; onClick: () => void; tone: "danger" } | null = null;
  let dismissLabel = "Try again";

  switch (failure.kind) {
    case "relayer-down":
      title = "Relayer not connected";
      body =
        "The Entros relayer service is not running. Verification requires a live relayer connected to Solana devnet.";
      footnote =
        "This is a devnet demo. End-to-end verification will be available when the relayer is deployed.";
      break;
    case "missing-baseline":
      title = "Baseline can't be recovered here";
      body =
        "Your Entros Anchor exists on chain, but the encrypted baseline couldn't be restored to this browser—either it was never written (older anchor) or your wallet can't decrypt it. Reset the baseline to re-enroll from here.";
      if (failure.canReset && onResetBaseline) {
        secondaryAction = {
          label: "Reset baseline",
          onClick: onResetBaseline,
          tone: "danger",
        };
        dismissLabel = "Cancel";
      }
      break;
    case "stale-baseline":
      title = "Baseline out of sync";
      body =
        "Your on-chain Entros Anchor doesn't match the recovered baseline—usually after a reset on another device. Reset here to re-enroll, or verify from the device that holds the matching baseline.";
      if (failure.canReset && onResetBaseline) {
        secondaryAction = {
          label: "Reset baseline",
          onClick: onResetBaseline,
          tone: "danger",
        };
        dismissLabel = "Cancel";
      }
      break;
    case "cooldown-active": {
      title = "Reset on cooldown";
      const unlockDate = extractCooldownUnlockDate(error);
      if (unlockDate) {
        const formatted = unlockDate.toLocaleString(undefined, {
          dateStyle: "long",
          timeStyle: "short",
        });
        body = `This wallet was reset within the last 7 days. The protocol enforces a cooldown between baseline resets. You can reset again on ${formatted}.`;
      } else {
        body =
          "This wallet was reset within the last 7 days. The protocol enforces a cooldown between baseline resets. Try again after the cooldown expires.";
      }
      footnote =
        "Or verify from the device that holds the original baseline.";
      break;
    }
    case "program-revert":
      title = "Verification failed";
      body =
        "The on-chain program rejected this verification. Please try again.";
      break;
    case "insufficient-sol":
      // MAINNET TODO (master-list #124): rewrite devnet-specific copy + CTA.
      // Mainnet users need SOL from a CEX/DEX, not the faucet—body should
      // drop the "devnet" qualifier and the "Get devnet SOL" button should
      // either disappear or repoint to a "How to get SOL" docs page.
      title = "This wallet needs SOL";
      body =
        "Verifying on devnet requires a small amount of SOL to write the on-chain anchor. Your wallet currently has none.";
      primaryCta = { label: "Get devnet SOL", href: FAUCET_URL };
      footnote = "Once the airdrop confirms in your wallet, click Try again.";
      break;
    case "user-rejection":
      title = "Signature canceled";
      body = "You canceled the signature in your wallet.";
      break;
    case "stale-blockhash":
      title = "Network was slow";
      body =
        "Your transaction expired before reaching Solana. The network was slow—try again.";
      break;
    case "rate-limited":
      title = "Too many attempts";
      body =
        "This wallet has reached its retry limit for the current window. Please wait an hour before trying again.";
      break;
    case "permission-denied":
      if (failure.device === "microphone") {
        title = "Microphone access needed";
        body =
          "Your browser blocked microphone access. Verification needs to hear your voice for the 12-second capture.";
        footnote = micRecoveryFootnote();
      } else {
        title = "Motion sensor access needed";
        body =
          "Your browser blocked motion sensor access. Verification needs your device's motion data during the 12-second capture.";
        footnote =
          "On iOS, allow motion access when prompted (or in Safari Settings → Privacy → Motion & Orientation Access). Then refresh this page and try again.";
      }
      break;
    case "microphone-too-quiet":
      title = "We couldn't hear you";
      body =
        "The microphone was active but no voice was detected during the recording. Your mic might be muted, set to the wrong device, or the input volume is too low.";
      footnote =
        "Check your OS sound settings — input device and input volume — then try again.";
      break;
    case "generic":
      title = "Verification failed";
      body = failure.message;
      break;
  }

  return (
    <div className="text-center space-y-6">
      <AlertCircle className="mx-auto h-12 w-12 text-danger" />
      <div>
        <p className="font-sans text-xl font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted">{body}</p>
        {footnote && <p className="mt-2 text-xs text-muted">{footnote}</p>}
      </div>
      {primaryCta && (
        <a
          href={primaryCta.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-6 py-2 text-sm font-medium text-cyan hover:bg-cyan/20 transition-colors"
        >
          {primaryCta.label}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      )}
      <div className="flex flex-col-reverse gap-2 items-center sm:flex-row sm:justify-center">
        <button
          onClick={onReset}
          className="rounded-full border border-border px-6 py-2 text-sm text-muted hover:text-foreground hover:border-border-hover transition-colors"
        >
          {dismissLabel}
        </button>
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="rounded-full border border-danger/30 bg-danger/10 px-6 py-2 text-sm font-medium text-danger hover:bg-danger/20 transition-colors"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
