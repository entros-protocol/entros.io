/**
 * Last-line scrubber for any error string about to be rendered in the
 * verification UI.
 *
 * The categorizer in `step-views.tsx` already routes the known leaky patterns
 * (`-32002`, `@solana/errors` decode prompts, base58 transaction blobs) into a
 * surface that renders safe static copy. This exists for the error class
 * nobody anticipated: it strips developer-facing decode hints, transaction
 * blobs and internal hostnames before an unrecognised string can reach the
 * generic fallback render path.
 *
 * Substrings the categorizer routes on are preserved deliberately:
 * `-32002`, `SendTransactionPreflightFailure`, `Custom`, `InstructionError`
 * and the leading `error sending request`.
 *
 * Lifted out of `verify-wallet-connected.tsx` because `verify-walletless.tsx`
 * rendered raw adapter and SDK strings without it. Two failure surfaces, one
 * scrubber.
 */

function safeStringify(value: unknown): string {
  try {
    const json = JSON.stringify(value);
    return json && json !== "{}" ? json : String(value);
  } catch {
    return String(value);
  }
}

export function sanitizeErrorMessage(message: unknown): string {
  // Callers pass a string today, but coerce anything else (e.g. a wallet
  // adapter throwing a bare {InstructionError:[...]} object) into a
  // categorizer-readable string rather than throwing on `.replace` or
  // rendering "[object Object]". JSON preserves the `"Custom":<code>`
  // substring the step-views categorizer routes on.
  let sanitized =
    typeof message === "string"
      ? message
      : message instanceof Error && typeof message.message === "string"
        ? message.message
        : safeStringify(message);
  // Strip @solana/errors developer-facing decode hints.
  sanitized = sanitized.replace(/Decode this error by running[^\n]*/gi, "");
  // Replace labeled transaction blobs (sig=..., Tx: ..., etc.) with a
  // placeholder while preserving the surrounding routing-relevant
  // substrings the categorizer needs.
  sanitized = sanitized.replace(
    /(?:Tx|tx|Transaction|sig)[:=]\s*[1-9A-HJ-NP-Za-km-z]{30,}/g,
    "[transaction]",
  );
  // Replace any standalone long base58 sequence (chunk hashes, transaction
  // signatures, raw account addresses serialized verbatim) with a placeholder.
  sanitized = sanitized.replace(/\b[1-9A-HJ-NP-Za-km-z]{40,}\b/g, "[blob]");
  // Strip Railway internal service URLs (and any `*.railway.internal` host)
  // that leak into reqwest-format upstream-failure messages from
  // executor-node when the validation-service is unreachable, e.g.
  // "error sending request for url (http://<host>/validate)". Keep the
  // leading "error sending request" substring so the categorizer in
  // step-views can route it to validation-rejected; only the URL is
  // the leak.
  sanitized = sanitized.replace(
    /https?:\/\/[\w.-]+\.railway\.internal(?::\d+)?(?:\/[^\s)]*)?/gi,
    "[internal]",
  );
  // Strip stack-trace frames so multi-line errors render as a single
  // user-readable sentence rather than a wall of internal call sites.
  sanitized = sanitized.replace(/^\s+at\s.*$/gm, "");
  // Collapse runs of blank lines left behind by the stack-strip pass.
  sanitized = sanitized.replace(/\n{2,}/g, "\n");
  return sanitized.trim();
}
