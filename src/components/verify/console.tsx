"use client";

import type { ReactNode } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { X } from "lucide-react";
import type { VerificationPhase } from "@entros/pulse-sdk";

import { verificationFocusRing } from "./verification-styles";

export const RAIL_STEPS = ["Connect", "Rounds", "Proof", "Sign", "Anchor"] as const;
/** The popup hands back to the app instead of showing the Anchor, so its last step differs. */
export const POPUP_RAIL_STEPS = ["Connect", "Rounds", "Proof", "Sign", "Done"] as const;

export interface RailState {
  /** Index into RAIL_STEPS of the step in focus. */
  current: number;
  status: "ready" | "active" | "error" | "complete";
}

/** The rail step a failure belongs to, from the phase the SDK reported. */
export function railStepForPhase(failedAt: VerificationPhase | undefined): number {
  switch (failedAt) {
    case "extraction":
    case "validation":
    case "baseline":
    case "proving":
      return 2;
    case "signing":
    case "submission":
      return 3;
    case "confirmation":
      return 4;
    default:
      return 1;
  }
}

/** The rail step an SDK progress stage belongs to. */
export function railStepForStage(stage: string): number {
  if (stage.startsWith("Submitting")) return 3;
  if (stage === "Finishing up...") return 4;
  return 2;
}

function StepRail({ rail, steps }: { rail: RailState; steps: readonly string[] }) {
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Verification progress">
      {steps.map((step, index) => {
        const done = rail.status === "complete" || index < rail.current;
        const here = index === rail.current && rail.status !== "complete";
        const bar = done
          ? "bg-foreground/55"
          : here && rail.status === "error"
            ? "bg-danger"
            : here && rail.status === "active"
              ? "bg-cyan/30"
              : here
                ? "bg-cyan"
                : "bg-foreground/10";
        const label = done
          ? "text-foreground/60"
          : here && rail.status === "error"
            ? "text-danger"
            : here
              ? "text-foreground"
              : "text-foreground/30";
        return (
          <li key={step} className="min-w-0" aria-current={here ? "step" : undefined}>
            <span className={`relative block h-[2px] overflow-hidden ${bar}`}>
              {here && rail.status === "active" && <span className="vc-shimmer" />}
            </span>
            <span
              className={`mt-2 block truncate font-mono text-[9px] uppercase tracking-[0.06em] transition-colors duration-300 sm:tracking-[0.18em] md:text-[10px] ${label}`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The verification console: progress rail, one view and an optional footer,
 * at a fixed minimum height sized for the capture view so moving between
 * states does not move the page.
 *
 * `persistent` renders ahead of the view and outside its keyed wrapper. The
 * paired capture host goes there: it has to keep one place in the tree from
 * the start tap into the rounds, and the view wrapper remounts on each state
 * change to play its entrance.
 *
 * `framed={false}` drops the border and the minimum height, for the popup,
 * where the window itself is the frame.
 */
export function VerifyConsole({
  rail,
  announcement,
  viewKey,
  footer,
  persistent,
  steps = RAIL_STEPS,
  framed = true,
  children,
}: {
  rail: RailState;
  steps?: readonly string[];
  framed?: boolean;
  announcement: string;
  viewKey: string;
  footer?: ReactNode;
  persistent?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={framed ? "relative mx-auto w-full max-w-xl" : "relative flex w-full flex-1 flex-col"}>
      <div
        className={
          framed
            ? "relative flex min-h-[720px] flex-col border border-foreground/[0.07] bg-background md:min-h-[760px]"
            : "relative flex flex-1 flex-col bg-background"
        }
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(var(--color-foreground)_0.5px,transparent_0.5px)] [background-size:18px_18px] opacity-[0.07] [mask-image:radial-gradient(ellipse_at_50%_45%,black_20%,transparent_72%)]"
        />
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
        <div className="relative px-6 pt-6 md:px-8">
          <StepRail rail={rail} steps={steps} />
        </div>
        <div
          className={`relative flex min-h-0 flex-1 flex-col justify-center px-6 md:px-10 ${
            framed ? "py-8" : "py-6"
          }`}
        >
          {persistent}
          {children !== null && children !== undefined && (
            <div key={viewKey} className="vc-enter">
              {children}
            </div>
          )}
        </div>
        {footer && (
          <div className="relative border-t border-foreground/[0.07] px-6 py-4 md:px-8">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const PRIVACY_LINES = [
  "Raw motion and touch stay on this device.",
  "Your spoken words are transcribed, never stored.",
  "Commitments and proofs go on chain.",
] as const;

export function PrivacyFooter({ lines }: { lines: readonly string[] }) {
  return (
    <ul className="flex flex-col items-center gap-1 text-center">
      {lines.map((line) => (
        <li key={line} className="text-[11px] leading-relaxed text-foreground/50">
          {line}
        </li>
      ))}
    </ul>
  );
}

export type StateTone = "neutral" | "retry" | "wait" | "action" | "stop";

/** The state icon: bare, large and coloured by tone. */
export function StateIcon({ tone = "neutral", children }: { tone?: StateTone; children: ReactNode }) {
  const color =
    tone === "stop"
      ? "text-danger"
      : tone === "wait" || tone === "action"
        ? "text-warning"
        : tone === "retry"
          ? "text-cyan"
          : "text-foreground/75";
  return <div className={`mx-auto flex justify-center ${color}`}>{children}</div>;
}

export const STATE_ICON_CLASS = "h-11 w-11";
export const STATE_ICON_STROKE = 1.25;

const TEXT_TONE = {
  warning: "text-warning",
  danger: "text-danger",
  accent: "text-cyan",
} as const;

/** A highlighted note. The text carries the tone colour, with no box around it. */
export function ToneText({
  tone,
  alert = false,
  children,
}: {
  tone: keyof typeof TEXT_TONE;
  alert?: boolean;
  children: ReactNode;
}) {
  return (
    <p
      role={alert ? "alert" : undefined}
      className={`mx-auto max-w-sm text-balance text-center text-xs leading-relaxed ${TEXT_TONE[tone]}`}
    >
      {children}
    </p>
  );
}

/** The connected wallet, with a square disconnect control. */
export function VerifyWalletChip() {
  const { publicKey, disconnect } = useWallet();
  if (!publicKey) return null;
  const address = publicKey.toBase58();
  return (
    <div className="inline-flex h-8 items-stretch border border-foreground/12 font-mono text-xs" title={address}>
      <span className="inline-flex items-center gap-2 pl-3 pr-2.5 text-foreground/80">
        <span className="h-1.5 w-1.5 rounded-full bg-solana-green" aria-hidden />
        {address.length > 10 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address}
      </span>
      <button
        type="button"
        onClick={() => void disconnect?.()}
        aria-label="Disconnect wallet"
        className={`inline-flex w-8 items-center justify-center border-l border-foreground/12 text-foreground/45 transition-colors hover:text-danger ${verificationFocusRing}`}
      >
        <X className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
    </div>
  );
}
