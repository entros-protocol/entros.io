"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";

/**
 * Contract address for $ENTROS. Empty until the token mints on EasyA
 * Kickstart—the card renders a pre-launch state rather than a fake
 * address, so nothing copyable is ever wrong.
 */
const CONTRACT_ADDRESS = "";

/**
 * Public launch page for the token, e.g. the kickstart.easya.io token URL.
 * Empty until it exists; the label then renders muted and non-interactive.
 */
const TOKEN_URL = "";

const EXPLORER_BASE = "https://solscan.io/token/";

export function TokenLaunchCard() {
  const [copied, setCopied] = useState(false);
  const live = CONTRACT_ADDRESS.length > 0;

  const copy = () => {
    if (!live) return;
    navigator.clipboard.writeText(CONTRACT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto mt-10 w-full max-w-xl">
      {/* Collaboration lockup. EasyA's mark and wordmark treatment match
          their own header (#52FFA1 tile, bold tracking-tight); the entros
          side mirrors the navbar wordmark, cyan square included. */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-5">
        <span className="flex items-center gap-2.5">
          <svg
            viewBox="0 0 1024 1024"
            fill="none"
            aria-hidden="true"
            className="h-6 w-6 shrink-0 rounded-[5px] sm:h-7 sm:w-7"
          >
            <rect width="1024" height="1024" fill="#52FFA1" />
            <path
              d="M704 512C748.804 512 771.206 512 788.319 503.281C803.372 495.611 815.611 483.372 823.281 468.319C832 451.206 832 428.804 832 384V320C832 275.196 832 252.794 823.281 235.681C815.611 220.628 803.372 208.389 788.319 200.719C771.206 192 748.804 192 704 192H640C595.196 192 572.794 192 555.681 200.719C540.628 208.389 528.389 220.628 520.719 235.681C512 252.794 512 275.196 512 320V385.467C511.999 429.295 511.904 451.394 503.281 468.319C495.611 483.372 483.372 495.611 468.319 503.281C451.206 512 428.805 512 384 512H320C275.196 512 252.794 512 235.681 520.719C220.628 528.389 208.389 540.628 200.719 555.681C192 572.794 192 595.196 192 640V704C192 748.804 192 771.206 200.719 788.319C208.389 803.372 220.628 815.611 235.681 823.281C252.794 832 275.196 832 320 832H384C428.804 832 451.206 832 468.319 823.281C483.372 815.611 495.611 803.372 503.281 788.319C512 771.206 512 748.804 512 704V640C512 595.196 512 572.794 520.719 555.681C528.389 540.628 540.628 528.389 555.681 520.719C572.794 512 595.196 512 640 512H704Z"
              fill="black"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            EasyA Kickstart
          </span>
        </span>

        <span aria-hidden className="text-sm font-light text-foreground/25">
          &times;
        </span>

        <span
          style={{
            fontFamily:
              "var(--font-wordmark), 'JetBrains Mono', ui-monospace, monospace",
          }}
          className="inline-flex items-baseline text-lg tracking-tight text-foreground sm:text-xl"
        >
          entros
          <span aria-hidden className="ml-1 inline-block size-[4px] bg-cyan" />
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        {TOKEN_URL ? (
          <a
            href={TOKEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="
              group inline-flex items-center gap-1.5
              font-mono text-xs uppercase tracking-[0.14em] text-cyan
              transition-colors hover:text-foreground
            "
          >
            Token URL
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={2}
            />
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.14em] text-cyan">
            Token URL
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
      </div>

      {/* Address plate. The copy button is flush to the body, sharing the
          hairline, and inverts with the theme via bg-foreground. */}
      <div className="mt-6 flex h-[68px] items-stretch overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3 text-left sm:px-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            Contract address
          </span>
          <span
            className={
              live
                ? "mt-1.5 truncate font-mono text-[13px] text-foreground sm:text-sm"
                : "mt-1.5 truncate font-mono text-[13px] text-foreground/35 sm:text-sm"
            }
          >
            {live ? CONTRACT_ADDRESS : "Published at launch"}
          </span>
        </div>

        <button
          type="button"
          onClick={copy}
          disabled={!live}
          aria-label={copied ? "Contract address copied" : "Copy contract address"}
          className="
            flex w-[68px] shrink-0 items-center justify-center self-stretch
            border-l border-border bg-foreground text-background
            transition-colors hover:bg-foreground/90
            disabled:cursor-not-allowed disabled:bg-foreground/25
          "
        >
          {copied ? (
            <Check className="h-4 w-4" strokeWidth={2} />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-foreground/45">
        {live ? (
          <>
            Verify the address before you transact.{" "}
            <a
              href={`${EXPLORER_BASE}${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/70 underline decoration-foreground/25 underline-offset-4 transition-colors hover:text-foreground"
            >
              View on Solscan
            </a>
          </>
        ) : (
          "The address will be published here and on @entros_protocol at launch."
        )}
      </p>
    </div>
  );
}
