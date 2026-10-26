"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  RefreshCcw,
  Share2,
  ShieldAlert,
} from "lucide-react";

import { type RetryableReason } from "@entros/pulse-sdk";

import type { FailureContext } from "./types";
import {
  categorizeFailure,
  failureSpend,
  requiresBaselineRecoveryChoice,
} from "./categorize-failure";
import {
  STATE_ICON_CLASS,
  STATE_ICON_STROKE,
  StateIcon,
  type StateTone,
} from "./console";
import { MAX_CAPTURE_ATTEMPTS } from "./retry-budget";
import {
  accentVerificationActionClass,
  dangerVerificationActionClass,
  primaryVerificationActionClass,
  secondaryVerificationActionClass,
  verificationFocusRing,
} from "./verification-styles";

import { explorerUrl } from "@/lib/explorer";
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
  // Popup only: the app's policy is read after the transaction lands.
  "Checking app requirements...": "Reading your Entros Anchor against this app's policy",
};

/**
 * Where each SDK stage sits in the run. Stages a run may skip (baseline
 * recovery, validation authorization, a layout upgrade) join the list only
 * once the SDK reports them.
 */
const STAGE_ORDER: readonly string[] = [
  "Extracting features...",
  "Authorizing validation...",
  "Validating...",
  "Re-syncing baseline with chain...",
  "Recovering baseline from chain...",
  "Updating identity account...",
  "Computing proof...",
  "Submitting to Solana...",
  "Submitting reset to Solana...",
  "Finishing up...",
  "Checking app requirements...",
];

function baseStages(reset: boolean): string[] {
  return [
    "Extracting features...",
    "Validating...",
    "Computing proof...",
    reset ? "Submitting reset to Solana..." : "Submitting to Solana...",
    "Finishing up...",
  ];
}

function stageRank(stage: string): number {
  const rank = STAGE_ORDER.indexOf(stage);
  return rank === -1 ? STAGE_ORDER.length : rank;
}

/**
 * The proof steps as a list that checks off each stage the SDK reports.
 * `signing` covers the moment after the run settles and before the result
 * renders, when the wallet step is the last one in flight.
 */
export function ProofPipeline({
  stage,
  signing = false,
  reset = false,
}: {
  stage: string;
  signing?: boolean;
  reset?: boolean;
}) {
  const current = signing
    ? reset
      ? "Submitting reset to Solana..."
      : "Submitting to Solana..."
    : stage;
  // Stages outside the base list stay listed once seen. Adjusting state
  // during render is the documented pattern for state derived from a prop.
  const [seen, setSeen] = useState<string[]>([]);
  if (!seen.includes(current)) setSeen([...seen, current]);
  const rows = [...new Set([...baseStages(reset), ...seen, current])].sort(
    (a, b) => stageRank(a) - stageRank(b),
  );
  const currentRank = stageRank(current);

  return (
    <ol className="mx-auto w-full max-w-sm border-t border-foreground/[0.08] text-left">
      {rows.map((row) => {
        const rank = stageRank(row);
        const status = rank < currentRank ? "done" : rank === currentRank ? "active" : "pending";
        const wallet = row.startsWith("Submitting");
        const rawSubtitle: unknown = STAGE_SUBTITLES[row];
        const subtitle =
          wallet && signing
            ? "Approve the transaction in your wallet"
            : typeof rawSubtitle === "string"
              ? rawSubtitle
              : "Please wait";
        return (
          <li
            key={row}
            className="grid grid-cols-[1.25rem_1fr] items-start gap-x-4 border-b border-foreground/[0.08] py-3.5"
            aria-current={status === "active" ? "step" : undefined}
          >
            <span className="flex h-5 items-center justify-center" aria-hidden>
              {status === "done" ? (
                <Check className="h-3.5 w-3.5 text-cyan" strokeWidth={2.5} />
              ) : status === "active" ? (
                wallet ? (
                  <span className="vc-orbit block h-3.5 w-3.5 rounded-full border-[1.5px] border-solana-purple/25 border-t-solana-purple" />
                ) : (
                  <span className="vc-tumble block h-2.5 w-2.5 bg-cyan" />
                )
              ) : (
                <span className="block h-1 w-1 rounded-full bg-foreground/25" />
              )}
            </span>
            <span className="min-w-0">
              <span
                className={`block text-sm transition-colors duration-300 ${
                  status === "active"
                    ? "text-foreground"
                    : status === "done"
                      ? "text-foreground/60"
                      : "text-foreground/30"
                }`}
              >
                {row.replace(/\.\.\.$/, "")}
              </span>
              {status === "active" && (
                <span
                  className={`vc-enter mt-1 block text-xs ${
                    wallet ? "text-solana-purple" : "text-foreground/50"
                  }`}
                >
                  {subtitle}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const subscribeToReducedMotion = (notify: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};
const readReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Moves focus to a result title once, so a screen reader starts there. */
function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}

/** Counts a number up from zero by writing the text node, never re-rendering. */
function useCountUp(target: number | null) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useSyncExternalStore(subscribeToReducedMotion, readReducedMotion, () => false);
  useEffect(() => {
    const node = ref.current;
    if (!node || target === null || reduced) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      node.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    node.textContent = "0";
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      node.textContent = String(target);
    };
  }, [target, reduced]);
  return ref;
}

// Server and client can print trigonometry results with different trailing
// digits, which reads as a hydration mismatch.
const round2 = (value: number) => Math.round(value * 100) / 100;

/** The Anchor seal: the commitment printed around a ring, the score inside. */
function AnchorSeal({ commitment, score }: { commitment: string; score: number | null }) {
  const id = useId().replace(/:/g, "");
  const scoreRef = useCountUp(score);
  const r = 96;
  const arc = 2 * Math.PI * 78;
  const hex = commitment.replace(/^0x/, "");
  const ringText = `0x ${hex.match(/.{1,4}/g)?.join(" ") ?? hex}`;
  return (
    <div className="relative mx-auto h-[216px] w-[216px]">
      <svg viewBox="0 0 216 216" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <path id={`seal-${id}`} d={`M108,108 m-${r},0 a${r},${r} 0 1,1 ${r * 2},0 a${r},${r} 0 1,1 -${r * 2},0`} />
        </defs>
        <text className="vc-fade font-mono" fontSize={7.2} letterSpacing={1.1} fill="var(--color-foreground)" fillOpacity={0.4}>
          <textPath href={`#seal-${id}`} textLength={2 * Math.PI * r - 6} lengthAdjust="spacing">
            {ringText}
          </textPath>
        </text>
        {Array.from({ length: 72 }, (_, i) => {
          const a = (i / 72) * Math.PI * 2;
          const inner = i % 6 === 0 ? 82 : 84.5;
          return (
            <line
              key={i}
              x1={round2(108 + Math.cos(a) * inner)}
              y1={round2(108 + Math.sin(a) * inner)}
              x2={round2(108 + Math.cos(a) * 87)}
              y2={round2(108 + Math.sin(a) * 87)}
              stroke="var(--color-foreground)"
              strokeOpacity={i % 6 === 0 ? 0.3 : 0.12}
              strokeWidth={1}
            />
          );
        })}
        <circle cx={108} cy={108} r={78} fill="none" stroke="var(--color-foreground)" strokeOpacity={0.08} strokeWidth={1} />
        <circle
          cx={108}
          cy={108}
          r={78}
          fill="none"
          stroke="var(--color-cyan)"
          strokeWidth={2}
          strokeLinecap="round"
          transform="rotate(-90 108 108)"
          className="vc-draw"
          style={{ ["--vc-len" as string]: `${arc}` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {score !== null ? (
          <>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-foreground/50">
              Your Trust Score
            </span>
            <span
              ref={scoreRef}
              className="mt-1 font-display text-6xl font-medium leading-none tracking-[-0.03em] text-cyan tabular-nums"
            >
              {score}
            </span>
          </>
        ) : (
          <CheckCircle className="h-10 w-10 text-cyan" strokeWidth={1.5} aria-hidden />
        )}
      </div>
    </div>
  );
}

function shortValue(value: string): string {
  return value.length <= 15 ? value : `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function ResultRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      })
      .catch(() => undefined);
  }
  return (
    <div className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 border-b border-foreground/[0.08] py-2.5">
      <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/45">{label}</dt>
      <dd className="truncate font-mono text-xs text-foreground/75" title={value}>
        {shortValue(value)}
      </dd>
      <dd className="flex items-center gap-1">
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
          className={`flex h-7 w-7 items-center justify-center text-foreground/45 transition-colors hover:text-foreground ${verificationFocusRing}`}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-cyan" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${label.toLowerCase()} on Solana Explorer`}
            className={`flex h-7 w-7 items-center justify-center text-foreground/45 transition-colors hover:text-foreground ${verificationFocusRing}`}
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
      </dd>
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
  const heading = useFocusOnMount<HTMLHeadingElement>();

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
    <div className="space-y-6 text-center">
      <AnchorSeal
        commitment={commitment}
        score={showShare && typeof trustScore === "number" ? trustScore : null}
      />
      <div>
        <h2
          ref={heading}
          tabIndex={-1}
          className="font-display text-3xl font-normal tracking-[-0.015em] text-foreground outline-none"
        >
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-foreground/60">{subtitle}</p>
      </div>
      <dl className="mx-auto max-w-sm border-t border-foreground/[0.08] text-left">
        <ResultRow label="Commitment" value={commitment} />
        {txSignature && (
          <ResultRow
            label="Transaction"
            value={txSignature}
            href={explorerUrl(txSignature, "tx")}
          />
        )}
      </dl>
      {portableBaseline === false && (
        <div className="mx-auto max-w-sm text-center text-warning">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em]">
            This device only
          </p>
          <p className="mt-1.5 text-balance text-xs leading-relaxed">
            Your wallet could not sign the message that encrypts a portable
            copy of your baseline, so this verification is stored here alone.
            Verifying from another device will need a reset. Connect a wallet
            that supports message signing to make it portable.
          </p>
        </div>
      )}
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
            className={`text-xs text-foreground/45 transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${verificationFocusRing}`}
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
      {canShare && (
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={handleShareToX}
            className={`inline-flex items-center gap-2 font-mono text-xs text-foreground/55 transition-colors hover:text-foreground ${verificationFocusRing}`}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share to X
          </button>
          <span className="h-3 w-px bg-foreground/15" aria-hidden />
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label={copied ? "Link copied" : "Copy share link"}
            className={`inline-flex items-center gap-2 font-mono text-xs text-foreground/55 transition-colors hover:text-foreground ${verificationFocusRing}`}
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
    "Speak and move at the same time. They were a bit out of sync.",
  phrase_content_mismatch:
    "Say the word clearly at a normal pace, exactly as shown.",
  trace_incomplete: "Trace through every dot, in order from 1.",
  audio_evidence_insufficient:
    "The service could not assess the recorded speech. Start a new verification and speak at your normal volume.",
  anchor_retry:
    "We couldn’t set your baseline from that capture. Try again. Say each word once.",
  validation_unavailable:
    "We couldn't reach the verification service. Check your connection and try again.",
  validation_timeout:
    "Your connection stalled while sending the verification. Somewhere with a stronger signal should work.",
  captcha_required:
    "The service needs one more check. Start a new verification.",
  technical_failure:
    "The verification service could not finish this session. Start a new verification.",
  session_expired: "This session expired. Start a new verification.",
  round_expired:
    "A round expired before the service received it. Start a new verification.",
  session_superseded:
    "A newer verification for this wallet replaced this one. Start a new verification to continue here.",
  session_consumed:
    "The service already checked this session. Start a new verification.",
  session_unknown:
    "The service no longer holds this session. Start a new verification.",
  session_not_ready:
    "The service did not receive every round of this session. Start a new verification.",
  round_not_outstanding:
    "The service expected a different round. Start a new verification.",
  session_busy:
    "The verification service was busy. Start a new verification.",
};

const SOFT_HINT_FALLBACK =
  "Something didn't come through cleanly. Give it another shot with natural movement and clear speech.";

/** Retry copy for a reason, or the generic line for one the table does not know. */
export function softHint(reason: string): string {
  // Typed on the result rather than nullish-coalesced. Every object inherits
  // `toString`, `constructor` and friends, so a `reason` of "toString" reads
  // back a function, and a function is not nullish, so it would have sailed
  // past `??` and into a text node.
  const rawHint: unknown = (SOFT_HINT as Record<string, unknown>)[reason];
  return typeof rawHint === "string" ? rawHint : SOFT_HINT_FALLBACK;
}

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
  const hint = softHint(reason);
  const attemptsLabel =
    attemptsRemaining === 1 ? "1 attempt left" : `${attemptsRemaining} attempts left`;
  const heading = useFocusOnMount<HTMLHeadingElement>();

  return (
    <div className="space-y-8 text-center">
      <StateIcon tone="retry">
        <RefreshCcw className={STATE_ICON_CLASS} strokeWidth={STATE_ICON_STROKE} />
      </StateIcon>
      <div>
        <h2
          ref={heading}
          tabIndex={-1}
          className="font-display text-3xl font-normal tracking-[-0.015em] text-foreground outline-none"
        >
          Let&apos;s try that again
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-balance text-sm leading-relaxed text-foreground/65">
          {hint}
        </p>
        <div className="mt-5 flex items-center justify-center gap-2.5">
          <span className="flex gap-1" aria-hidden>
            {Array.from({ length: MAX_CAPTURE_ATTEMPTS }, (_, i) => (
              <span
                key={i}
                className={`h-1.5 w-4 ${i < attemptsRemaining ? "bg-cyan" : "bg-foreground/12"}`}
              />
            ))}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
            {attemptsLabel}
          </span>
        </div>
      </div>
      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onCancel}
          disabled={actionPending}
          aria-busy={actionPending}
          className={secondaryVerificationActionClass}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onTryAgain}
          disabled={actionPending}
          aria-busy={actionPending}
          className={primaryVerificationActionClass}
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
  pairedCapture = false,
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
  /** True when the capture ran as paired rounds rather than one 12-second window. */
  pairedCapture?: boolean;
} & FailureContext) {
  const failure = categorizeFailure(
    error,
    typeof onResetBaseline === "function",
    reason,
    { failedAt, opaque, baselineRecovery },
  );
  const heading = useFocusOnMount<HTMLHeadingElement>();

  let title: string;
  let body: string;
  let footnote: string | null = null;
  let primaryCta: { label: string; href: string } | null = null;
  let secondaryAction: { label: string; onClick: () => void; tone: "danger" } | null = null;
  let dismissLabel = retryLabel;
  let dismissAction = onReset;
  const waitLine = retryAfterSec
    ? `Try again in ${formatWait(retryAfterSec)}.`
    : "Try again shortly.";

  switch (failure.kind) {
    case "session-restart":
      title = "This session ended";
      body = softHint(failure.reason);
      break;
    case "session-wait":
      switch (failure.reason) {
        case "finalize_in_progress":
          title = "An earlier session is still finishing";
          body = `The service is still checking an earlier verification for this wallet. ${waitLine}`;
          break;
        case "session_active":
          title = "A session is already open";
          body = `This wallet has a verification open on another device or network. ${waitLine}`;
          break;
        case "session_budget_exhausted":
          title = "Too many sessions";
          body = `You started several verifications in a short time. ${waitLine}`;
          break;
        default:
          title = "Verification is busy";
          body = `The verification service is at capacity. ${waitLine}`;
      }
      break;
    case "session-broken":
      title = reason === "paired_required" ? "Paired capture required" : "This session could not continue";
      body = reason === "paired_required"
        ? "Update this page to set or replace your baseline with paired capture."
        : "This browser session could not continue. Reload the page and try again.";
      dismissLabel = "Reload page";
      dismissAction = () => window.location.reload();
      break;
    case "relayer-down":
      title = "Verification service unreachable";
      body =
        "The Entros verification service did not respond. Check your connection and try again.";
      footnote =
        "Entros runs on Solana devnet.";
      break;
    case "wallet-mismatch":
      title = "Wrong wallet signed";
      body =
        "A different wallet signed than the one you connected, likely another wallet extension. Your on-chain baseline is intact. Sign with your connected wallet, or turn off the other extension, then try again.";
      footnote =
        "No reset needed. Your baseline is fine.";
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
      // TODO: This copy and CTA are devnet-specific. On mainnet, users get
      // SOL from an exchange, not the faucet, so the body should drop the
      // "devnet" qualifier and the "Get devnet SOL" button should either
      // disappear or point to a "How to get SOL" docs page.
      title = "This wallet needs SOL";
      body =
        "Your SOL balance does not cover the protocol fees, account rent and network fees for this verification. Add devnet SOL, then try again.";
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
      } else if (failure.reason === "cross_wallet_cooldown") {
        // A paired session refused at open carries the code without the
        // server's prose.
        title = "Device cooldown active";
        body = `A different wallet verified from this device recently. ${waitLine}`;
      } else if (failure.reason === "ip_rate_limited") {
        title = "Too many attempts";
        body = `Too many attempts came from your network. ${waitLine}`;
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
        body = pairedCapture
          ? "Your browser blocked microphone access. Verification needs to hear your voice in each round."
          : "Your browser blocked microphone access. Verification needs to hear your voice during capture.";
        footnote = micRecoveryFootnote();
      } else {
        title = "Motion sensor access needed";
        body = pairedCapture
          ? "Your browser blocked motion sensor access. Verification needs your device's motion data during the rounds."
          : "Your browser blocked motion sensor access. Verification needs your device's motion data during capture.";
        footnote =
          "On iOS, allow motion access when prompted (or in Safari Settings → Privacy → Motion & Orientation Access). Then refresh this page and try again.";
      }
      break;
    case "automated-browser":
      title = "Verification unavailable";
      body = "This browser reports that automation software controls it.";
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
      // match again. Projection versioning would let the SDK name this case
      // instead of leaving it to be inferred here.
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
      title = reason === "anchor_retry" ? "Baseline not set" : "Verification failed";
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
  // A funding preflight reports signing, which spends nothing. A partly funded
  // transaction can pay its network fee before reverting for insufficient rent,
  // so funding errors after broadcast must keep their phase's spend note.
  const spendIsKnownZero = failure.kind === "stale-blockhash";
  const spend =
    userPaysFees && !spendIsKnownZero ? failureSpend(failedAt) : "none";
  const spendNote =
    spend === "certain"
      ? "The network fee for this attempt was spent. Your Entros Anchor did not change."
      : spend === "possible"
        ? "This attempt may have spent a network fee. Check your wallet's recent activity."
        : null;

  const tone: StateTone =
    failure.kind === "validation-rejected" ||
    failure.kind === "automated-browser" ||
    failure.kind === "session-broken"
      ? "stop"
      : failure.kind === "session-wait" ||
          failure.kind === "rate-limited" ||
          failure.kind === "cooldown-active"
        ? "wait"
        : failure.kind === "drift-too-high" ||
            failure.kind === "session-restart" ||
            failure.kind === "relayer-down" ||
            failure.kind === "user-rejection" ||
            failure.kind === "stale-blockhash" ||
            failure.kind === "generic"
          ? "retry"
          : "action";
  const Icon =
    tone === "wait"
      ? Clock
      : tone === "stop"
        ? ShieldAlert
        : failure.kind === "drift-too-high"
          ? RefreshCcw
          : AlertCircle;
  const details = [footnote, spendNote].filter((line): line is string => Boolean(line));

  return (
    <div className="space-y-7 text-center">
      <StateIcon tone={tone}>
        <Icon className={STATE_ICON_CLASS} strokeWidth={STATE_ICON_STROKE} />
      </StateIcon>
      <div>
        <h2
          ref={heading}
          tabIndex={-1}
          className="font-display text-[1.75rem] font-normal leading-tight tracking-[-0.015em] text-foreground outline-none md:text-3xl"
        >
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-balance text-sm leading-relaxed text-foreground/65">
          {[body, ...details].join(" ")}
        </p>
      </div>
      {primaryCta && (
        <a
          href={primaryCta.href}
          target={actionPending ? undefined : "_blank"}
          rel="noopener noreferrer"
          aria-disabled={actionPending}
          tabIndex={actionPending ? -1 : undefined}
          onClick={actionPending ? (event) => event.preventDefault() : undefined}
          className={`${accentVerificationActionClass} aria-disabled:cursor-not-allowed aria-disabled:opacity-50`}
        >
          {primaryCta.label}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      )}
      <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={dismissAction}
          disabled={actionPending}
          aria-busy={actionPending}
          className={
            secondaryAction ? secondaryVerificationActionClass : primaryVerificationActionClass
          }
        >
          {dismissLabel}
        </button>
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            disabled={actionPending}
            aria-busy={actionPending}
            className={dangerVerificationActionClass}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
