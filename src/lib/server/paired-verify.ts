import "server-only";

/**
 * The paired variant of `/verify` and its local executor proxies run only when
 * the operator sets `ENTROS_PAIRED_VERIFY` to `1`. Any other value, or none,
 * keeps the single capture.
 */
export function pairedVerifyEnabled(
  value: string | undefined = process.env.ENTROS_PAIRED_VERIFY,
): boolean {
  return value === "1";
}
