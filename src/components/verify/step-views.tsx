"use client";

import { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCcw,
  Share2,
} from "lucide-react";

import { type RetryableReason } from "@entros/pulse-sdk";

import type { FailureContext } from "./types";
import {
  categorizeFailure,
  failureSpend,
  requiresBaselineRecoveryChoice,
} from "./categorize-failure";
import { primaryVerificationActionClass } from "./verification-styles";

import { buildShareUrl, buildTwitterIntent } from "@/lib/share";

// Every stage string the SDK emits from `onProgress`, and what it is doing.
// Three of the seven had no entry and fell through to the "Please wait"
// default: both baseline stages and the reset submission. Baseline recovery is
// the slowest step a returning user sees, so it was the one most worth naming.
const STAGE_SUBTITLES: Record<string, string> = {
  "Extracting features...": "Analyzing voice, motion, and touch data",
  "Validating...": "Server-side feature validation",
  "Recovering baseline from chain...": "Decrypting your stored baseline",
  "Re-syncing baseline with chain...": "Your baseline advanced on another device",
  "Computing proof...": "Generating zero-knowledge proof",
  "Submitting to Solana...": "Writing verification on-chain",
  "Submitting reset to Solana...": "Rotating your on-chain baseline",
  // Everything after the cluster confirms. Named separately because the wait
  // is longest on mobile, where the wallet lives in another view, and telling
  // someone their transaction is still going out when it has already landed is
  // what makes a short wait feel like a hang.
  "Finishing up...": "Your verification is confirmed on-chain",
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
  // Type-checked on the result, for the same reason as the hint lookup below.
  // Every object inherits `toString`, so a `stage` of "toString" reads back a
  // function, and a function is truthy, so `||` would not catch it either.
  // `stage` is SDK-controlled today, which makes this a type lie rather than
  // a live crash, but the identical shape twenty lines down was reachable.
  const rawSubtitle: unknown = stage ? STAGE_SUBTITLES[stage] : undefined;
  const subtitle = typeof rawSubtitle === "string" ? rawSubtitle : "Please wait";

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
  walletPubkey,
  trustScore,
  showShare = false,
  portableBaseline,
  actionPending = false,
  secondaryActionLabel,
  onSecondaryAction,
}: {
  commitment: string;
  txSignature?: string;
  subtitle: string;
  onReset: () => void;
  /** Success headline. Pass "Baseline reset" for reset flows. */
  title?: string;
  /** Label for the action that starts a new verification cycle. */
  tryAgainLabel?: string;
  /** Connected wallet pubkey (base58). Required to render the share row. */
  walletPubkey?: string;
  /** Trust score from the latest IdentityState read. Null/undefined while
   * fetching or if the read failed; both the OG card and tweet copy
   * gracefully omit the score in that case. */
  trustScore?: number | null;
  /** Caller-controlled gate. Off for the baseline-reset flow so the share
   * row never appears there. */
  showShare?: boolean;
  actionPending?: boolean;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  /**
   * False when the verification landed but wrote no portable copy of the
   * baseline. `undefined` in walletless mode, where none is written at all.
   *
   * Worth a line on a success screen because the consequence lands on a
   * different device, weeks later, with nothing to explain it. 13 of 107
   * devnet anchors carry an on-chain baseline; the rest found out that way.
   */
  portableBaseline?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const canShare = showShare && Boolean(walletPubkey);

  function handleShareToX() {
    if (!walletPubkey) return;
    const intent = buildTwitterIntent(walletPubkey, trustScore ?? null);
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  function handleCopyLink() {
    if (!walletPubkey) return;
    const url = buildShareUrl(walletPubkey, trustScore ?? null, "copy");
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Clipboard write rejected by the browser permission model. No
        // recovery UI — the share-to-X button is still available.
      });
  }

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
        {showShare && typeof trustScore === "number" && (
          <div className="verification-surface verification-surface--accent p-5 text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan/80 mb-2">
              Your Trust Score
            </p>
            <p className="font-display text-5xl font-medium text-cyan tabular-nums leading-none">
              {trustScore}
            </p>
          </div>
        )}
        <div className="verification-surface p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">
            Commitment
          </p>
          <p className="font-mono text-xs text-foreground/70 break-all">
            {commitment}
          </p>
        </div>
        {txSignature && (
          <div className="verification-surface p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">
              Transaction
            </p>
            <p className="font-mono text-xs text-foreground/70 break-all">
              {txSignature}
            </p>
          </div>
        )}
        {portableBaseline === false && (
          <div className="verification-surface p-4 text-left">
            <p className="text-xs font-mono uppercase tracking-widest text-muted mb-1">
              This device only
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              Your wallet could not sign the message that encrypts a portable
              copy of your baseline, so this verification is stored here alone.
              Verifying from another device will need a reset. Connect a wallet
              that supports message signing to make it portable.
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onReset}
          disabled={actionPending}
          aria-busy={actionPending}
          className={primaryVerificationActionClass}
        >
          {tryAgainLabel}
        </button>
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            disabled={actionPending}
            className="text-xs text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
      {canShare && (
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={handleShareToX}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-xs text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <Share2 className="h-3.5 w-3.5" />
            Share to X
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label={copied ? "Link copied" : "Copy share link"}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-xs text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-cyan" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      )}
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
 * Typed against the SDK's retryable set rather than `Record<string, string>`,
 * so adding a retryable reason without writing its hint is a compile error.
 * Before, the table and the retry list were two hand-maintained copies and a
 * missing key fell silently through to the generic fallback.
 */

const SOFT_HINT: Record<RetryableReason, string> = {
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
  validation_timeout:
    "Your connection stalled while sending the verification. Somewhere with a stronger signal should work.",
  captcha_required:
    "Liveness pattern anomaly detected. Please complete this dynamic voice/motion challenge to verify your identity.",
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
  tryAgainLabel = "Try again",
  actionPending = false,
}: {
  reason: string;
  attemptsRemaining: number;
  onTryAgain: () => void;
  onCancel: () => void;
  tryAgainLabel?: string;
  actionPending?: boolean;
}) {
  // Widened for the lookup because `reason` arrives from the server as a
  // plain string. The exhaustiveness that matters is on the table's
  // declaration, where a missing hint for a retryable reason fails the build;
  // here an unrecognised reason should simply take the fallback.
  //
  // Typed on the result rather than nullish-coalesced. Every object inherits
  // `toString`, `constructor` and friends, so a `reason` of "toString" reads
  // back a function, and a function is not nullish, so it would have sailed
  // past `??` and into a text node.
  const rawHint: unknown = (SOFT_HINT as Record<string, unknown>)[reason];
  const hint = typeof rawHint === "string" ? rawHint : SOFT_HINT_FALLBACK;
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
          disabled={actionPending}
          aria-busy={actionPending}
          className="rounded-full border border-border px-6 py-2 text-sm text-muted hover:text-foreground hover:border-border-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onTryAgain}
          disabled={actionPending}
          aria-busy={actionPending}
          className="rounded-full border border-cyan/30 bg-cyan/10 px-6 py-2 text-sm font-medium text-cyan hover:bg-cyan/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {tryAgainLabel}
        </button>
      </div>
    </div>
  );
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

const FAUCET_URL = "https://faucet.solana.com";

/** Seconds to a short human phrase: "45 seconds", "3 minutes", "2 hours". */
function formatWait(seconds: number): string {
  const s = Math.max(1, Math.ceil(seconds));
  if (s < 90) return `${s} second${s === 1 ? "" : "s"}`;
  const m = Math.ceil(s / 60);
  if (m < 90) return `${m} minute${m === 1 ? "" : "s"}`;
  const h = Math.ceil(m / 60);
  return `${h} hour${h === 1 ? "" : "s"}`;
}

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
  reason,
  failedAt,
  opaque,
  baselineRecovery,
  onReset,
  onCancel,
  onResetBaseline,
  userPaysFees = true,
  retryAfterSec,
  retryLabel = "Try again",
  actionPending = false,
}: {
  error: string;
  /** SDK reason code, when one survived. Routes the cooldown screen. */
  reason?: string;
  /**
   * Seconds the server said to wait, sent with every 429. The executor knows
   * the exact window and puts it in the body, so the screen can name it
   * instead of guessing.
   */
  retryAfterSec?: number;
  onReset: () => void;
  onCancel?: () => void;
  retryLabel?: string;
  actionPending?: boolean;
  onResetBaseline?: () => void;
  /**
   * Whether the connected wallet is the fee payer. False on the walletless
   * path, where the relayer signs and pays, and telling the user to check
   * their wallet for a fee would point at a wallet they never connected.
   */
  userPaysFees?: boolean;
} & FailureContext) {
  const failure = categorizeFailure(
    error,
    typeof onResetBaseline === "function",
    reason,
    { failedAt, opaque, baselineRecovery },
  );

  let title: string;
  let body: string;
  let footnote: string | null = null;
  let primaryCta: { label: string; href: string } | null = null;
  let secondaryAction: { label: string; onClick: () => void; tone: "danger" } | null = null;
  let dismissLabel = retryLabel;
  let dismissAction = onReset;

  switch (failure.kind) {
    case "relayer-down":
      title = "Relayer not connected";
      body =
        "The Entros relayer service is not running. Verification requires a live relayer connected to Solana devnet.";
      footnote =
        "This is a devnet demo. End-to-end verification will be available when the relayer is deployed.";
      break;
    case "wallet-mismatch":
      title = "Wrong wallet signed";
      body =
        "A different wallet signed than the one you connected. Another wallet extension likely intercepted the signature prompt. Your on-chain baseline is intact. Sign with your connected wallet, or disable other wallet extensions (or unset their default), then try again.";
      footnote =
        "No reset needed. This is a wallet-selection issue, not a baseline problem.";
      break;
    case "no-portable-baseline":
      // The largest group by far: 13 of 107 devnet anchors carry an on-chain
      // baseline, so most people who reach a second device were minted before
      // the feature existed. They used to be told a fingerprint was "not found
      // on this device", which describes a search that could never have
      // succeeded and points at a device that was never at fault.
      title = "This anchor predates portable baselines";
      body =
        "Your Entros Anchor was created before baselines were stored on chain, so there is nothing here to restore. Reset once from this device and your baseline becomes recoverable on any device you connect the same wallet to.";
      footnote =
        "Resetting clears your verification count and trust score, and starts a 7-day cooldown before the next reset.";
      if (failure.canReset && onResetBaseline) {
        secondaryAction = {
          label: "Reset baseline",
          onClick: onResetBaseline,
          tone: "danger",
        };
      }
      break;
    case "signing-unavailable":
      title = "This wallet can't unlock your baseline";
      body =
        "Unlocking the baseline stored on chain needs a signed message, and this wallet does not offer message signing. Connect a wallet that does, or reset to re-enroll from this device.";
      footnote =
        "Some hardware wallet firmware omits message signing. Switching wallets keeps your verification history; resetting clears it.";
      if (failure.canReset && onResetBaseline) {
        secondaryAction = {
          label: "Reset baseline",
          onClick: onResetBaseline,
          tone: "danger",
        };
      }
      break;
    case "missing-baseline":
      title = "Baseline can't be recovered here";
      body =
        "Your Entros Anchor exists on chain, but the encrypted baseline couldn't be restored to this browser. Either it was never written, or it was replaced by a later reset and no longer opens. Reset the baseline to re-enroll from here.";
      if (failure.canReset && onResetBaseline) {
        secondaryAction = {
          label: "Reset baseline",
          onClick: onResetBaseline,
          tone: "danger",
        };
      }
      break;
    case "stale-baseline":
      title = "Baseline out of sync";
      body =
        "Your on-chain Entros Anchor doesn't match the recovered baseline, usually after a reset on another device. Reset here to re-enroll, or verify from the device that holds the matching baseline.";
      if (failure.canReset && onResetBaseline) {
        secondaryAction = {
          label: "Reset baseline",
          onClick: onResetBaseline,
          tone: "danger",
        };
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
    case "validation-rejected":
      title = "Verification rejected";
      body =
        "Validation rejected this attempt. Please try again, or contact support if this persists.";
      break;
    case "insufficient-sol":
      // TODO(mainnet): rewrite devnet-specific copy + CTA. Mainnet users
      // need SOL from a CEX/DEX, not the faucet—body should
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
      if (error.toLowerCase().includes("recently verified") || error.toLowerCase().includes("different wallet")) {
        title = "Device cooldown active";
        body = error;
      } else {
        title = "Too many attempts";
        // The executor sends `retry_after` with every 429 and knows the real
        // window, which differs by limiter. The copy used to say "wait an
        // hour" regardless, which was a guess and collided with the on-chain
        // conditions that also ask the user to wait.
        body = retryAfterSec
          ? `This wallet has reached its retry limit. Try again in ${formatWait(retryAfterSec)}.`
          : "This wallet has reached its retry limit for the current window. Try again shortly.";
      }
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
    case "drift-too-high":
      title = "Let's try that again";
      body =
        "This capture didn't closely match your usual pattern. That often happens after an interrupted or rushed recording. Try again with a steady, uninterrupted capture.";
      // A reset is offered here because a rushed recording is not the only way
      // to land on this screen. A change to the feature pipeline moves every
      // stored baseline into a space the next capture cannot match, and
      // nothing upstream detects that: the stored commitment still equals the
      // on-chain one, so every staleness check passes and the divergence
      // surfaces only as distance. Without a way out the user reads copy
      // blaming their recording and retries against a baseline that can never
      // match again. See master-list #215 for the versioning that would let
      // the SDK name this case instead of leaving it to be inferred here.
      if (failure.canReset && onResetBaseline) {
        footnote =
          "If this keeps happening across several clean attempts, your baseline may predate a pipeline update. Resetting re-enrolls you from scratch.";
        secondaryAction = {
          label: "Reset baseline",
          onClick: onResetBaseline,
          tone: "danger",
        };
      }
      break;
    case "generic":
      // Friendly-text passthrough. The catch-block sanitizer in
      // verify-wallet-connected.tsx has already stripped raw RPC noise,
      // base58 blobs, and `@solana/errors` decode prompts before this
      // string arrives, so anything that lands here is a state-machine
      // or SDK message that was deliberately written to be readable —
      // "Proof generation timed out. Please try again.", "Audio
      // recording too short.", etc. Display it directly. Fall back to
      // the static "something unexpected" copy only when the sanitized
      // message is empty (which means the original error had no useful
      // user-facing content).
      title = "Verification failed";
      body =
        failure.message.trim().length > 0
          ? failure.message
          : "We hit an unexpected error during verification. Please try again, or contact support if this persists.";
      break;
  }

  if (secondaryAction && requiresBaselineRecoveryChoice(failure)) {
    dismissLabel = "Cancel";
    dismissAction = onCancel ?? onReset;
  }

  // What the attempt cost, when it cost anything. Every phase up to and
  // including the wallet prompt spends nothing, so this is silent on the large
  // majority of failures. It is here because the alternative was what shipped
  // for two months: a baseline reset that was broadcast, charged and reverted
  // on every attempt, with the interface saying only that verification failed.
  //
  // Two surfaces suppress it because they already establish that no fee was
  // taken, and the phase is deliberately the more cautious of the two answers:
  // a wallet with no SOL cannot pay one, and an expired blockhash means the
  // transaction never landed.
  const spendIsKnownZero =
    failure.kind === "insufficient-sol" || failure.kind === "stale-blockhash";
  const spend =
    userPaysFees && !spendIsKnownZero ? failureSpend(failedAt) : "none";
  const spendNote =
    spend === "certain"
      ? "The network fee for this attempt was spent. Your identity did not change."
      : spend === "possible"
        ? "This attempt may have spent a network fee. Check your wallet's recent activity."
        : null;

  return (
    <div className="text-center space-y-6">
      {failure.kind === "drift-too-high" ? (
        <RefreshCcw className="mx-auto h-12 w-12 text-cyan" strokeWidth={1.5} />
      ) : (
        <AlertCircle className="mx-auto h-12 w-12 text-danger" />
      )}
      <div>
        <p className="font-sans text-xl font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted">{body}</p>
        {footnote && <p className="mt-2 text-xs text-muted">{footnote}</p>}
        {spendNote && <p className="mt-2 text-xs text-muted">{spendNote}</p>}
      </div>
      {primaryCta && (
        <a
          href={primaryCta.href}
          target={actionPending ? undefined : "_blank"}
          rel="noopener noreferrer"
          aria-disabled={actionPending}
          tabIndex={actionPending ? -1 : undefined}
          onClick={actionPending ? (event) => event.preventDefault() : undefined}
          className="inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/10 px-6 py-2 text-sm font-medium text-cyan hover:bg-cyan/20 transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          {primaryCta.label}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      )}
      <div className="flex flex-col-reverse gap-2 items-center sm:flex-row sm:justify-center">
        <button
          onClick={dismissAction}
          disabled={actionPending}
          aria-busy={actionPending}
          className="rounded-full border border-border px-6 py-2 text-sm text-muted hover:text-foreground hover:border-border-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {dismissLabel}
        </button>
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            disabled={actionPending}
            aria-busy={actionPending}
            className="rounded-full border border-danger/30 bg-danger/10 px-6 py-2 text-sm font-medium text-danger hover:bg-danger/20 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
