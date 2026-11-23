"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { EntrosMark } from "@/components/layout/entros-mark";
import { verificationFocusRing } from "@/components/verify/verification-styles";
import {
  TOKEN_LAUNCH_ARCHIVE_URL,
  TOKEN_MINT_ADDRESS,
  TOKEN_SOLSCAN_URL,
} from "@/data/token-economics";

type CopyState = "idle" | "copied" | "error";

export function TokenLaunchCard() {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!navigator.clipboard?.writeText) {
      setCopyState("error");
      return;
    }

    navigator.clipboard
      .writeText(TOKEN_MINT_ADDRESS)
      .then(() => {
        setCopyState("copied");
        timerRef.current = setTimeout(() => {
          setCopyState("idle");
          timerRef.current = null;
        }, 2500);
      })
      .catch(() => {
        setCopyState("error");
      });
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-xl">
      <div className="flex items-center justify-center gap-3">
        <span
          style={{
            fontFamily:
              "var(--font-wordmark), 'JetBrains Mono', ui-monospace, monospace",
          }}
          className="inline-flex items-center text-2xl leading-none tracking-tight text-foreground"
        >
          <EntrosMark className="mr-1.5 size-[18px] shrink-0" />
          <span className="[text-box:trim-both_cap_alphabetic]">Entros</span>
        </span>
        <span className="font-mono text-sm leading-none text-muted [text-box:trim-both_cap_alphabetic]">
          $ENTROS
        </span>
      </div>

      {/* Surface-stepped contract address plate with flush solid copy control. */}
      <div className="mt-6 flex min-h-[68px] items-stretch bg-surface forced-colors:border forced-colors:border-[CanvasText]">
        <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3 text-left sm:px-5">
          <span className="text-sm font-medium text-muted">
            Contract address
          </span>
          <span className="mt-1 select-all break-all font-mono text-[13px] leading-snug text-foreground sm:text-sm">
            {TOKEN_MINT_ADDRESS}
          </span>
        </div>

        <button
          type="button"
          onClick={copy}
          aria-label={
            copyState === "copied"
              ? "Contract address copied"
              : "Copy contract address"
          }
          className={`flex w-[68px] shrink-0 items-center justify-center self-stretch bg-foreground text-background transition-[background-color,transform] duration-150 ease-out hover:bg-foreground/90 active:scale-[0.96] motion-reduce:transform-none motion-reduce:transition-none forced-colors:border forced-colors:border-[ButtonText] ${verificationFocusRing}`}
        >
          {copyState === "copied" ? (
            <Check className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-2 min-h-[1rem] text-center text-xs text-muted"
      >
        {copyState === "copied"
          ? "Copied contract address."
          : copyState === "error"
            ? "Clipboard unavailable. Select the address above to copy manually."
            : ""}
      </p>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <a
          href={TOKEN_SOLSCAN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-[var(--verification-accent-text)] underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground forced-colors:border forced-colors:border-[ButtonText] ${verificationFocusRing}`}
        >
          <span className="[text-box:trim-both_cap_alphabetic]">
            View on Solscan
          </span>
          <ArrowUpRight
            className="h-4 w-4 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        </a>

        <a
          href={TOKEN_LAUNCH_ARCHIVE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 px-2 py-1 text-sm text-muted underline underline-offset-4 transition-colors duration-150 ease-out hover:text-foreground forced-colors:border forced-colors:border-[ButtonText] ${verificationFocusRing}`}
        >
          <span className="[text-box:trim-both_cap_alphabetic]">
            Historical launch archive
          </span>
          <ArrowUpRight
            className="h-4 w-4 shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        Verify the contract address on Solscan before interacting with any pool.
      </p>
    </div>
  );
}
