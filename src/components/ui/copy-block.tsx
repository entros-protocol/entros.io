"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Read-only text with a copy control. The text stays selectable when the clipboard is blocked. */
export function CopyBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => setCopied(false));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-cyan transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-all border border-border bg-background p-4 font-mono text-xs leading-relaxed text-foreground/80 select-all">
        {text}
      </pre>
    </div>
  );
}
