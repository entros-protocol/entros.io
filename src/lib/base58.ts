const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
// 88 characters is the longest a 64-byte value takes, so longer input is never decoded.
const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{1,88}$/;

/** Decoded byte length of a base58 string, or null when the input is not base58. */
export function base58ByteLength(value: string): number | null {
  if (!BASE58_PATTERN.test(value)) return null;
  const bytes: number[] = [];
  for (const char of value) {
    let carry = BASE58_ALPHABET.indexOf(char);
    for (let index = 0; index < bytes.length; index += 1) {
      carry += (bytes[index] ?? 0) * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let leadingZeros = 0;
  while (value[leadingZeros] === "1") leadingZeros += 1;
  return leadingZeros + bytes.length;
}
