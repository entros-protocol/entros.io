import "server-only";

/**
 * The local executor proxies for the paired rounds run only when the operator
 * sets `ENTROS_PAIRED_VERIFY` to `1`. Any other value, or none, closes them.
 */
export function pairedVerifyEnabled(
  value: string | undefined = process.env.ENTROS_PAIRED_VERIFY,
): boolean {
  return value === "1";
}
