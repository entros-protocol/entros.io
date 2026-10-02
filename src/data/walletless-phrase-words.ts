/**
 * Curated subset of the validator's word dictionary for the WALLETLESS
 * verification preview.
 *
 * Walletless mode is cosmetic—it doesn't go through `/validate-features`,
 * so the displayed phrase isn't bound to anything server-side. The only
 * reason this list exists is style parity with the wallet-connected flow,
 * which shows real curated words ("trading duty assembly wins command"),
 * so nonsense syllables in walletless would be jarring by comparison.
 *
 * Source: every word must appear in the validator's dictionary, which the
 * executor mirrors at `executor-node/src/challenge/word_dict.rs`. When that
 * dictionary drops a word, drop it here too. This 81-word subset gives
 * 81^5 ≈ 3.5 billion phrase combinations, far more than cosmetic
 * non-repetition needs. Keeping the subset small avoids bloating the client
 * bundle and avoids the drift-detection cost that would come with shipping
 * the full dictionary client-side.
 *
 * Words selected for: short (4-6 letters), unambiguous, neutral or
 * positive valence, alphabetically distributed across the dict for
 * variety.
 */
export const WALLETLESS_PHRASE_WORDS: readonly string[] = Object.freeze([
  "able", "active", "added", "advance", "agree", "alive",
  "amount", "answer", "appear", "arrived", "aware",
  "balance", "begin", "better", "blue", "bridge", "brief",
  "bright", "bring", "broad", "build", "center", "choose",
  "circle", "clean", "clear", "coast", "color", "common",
  "create", "daily", "data", "decide", "design", "detail",
  "earned", "eight", "energy", "engine", "enough", "exact",
  "famous", "field", "final", "first", "forward", "future",
  "garden", "gift", "global", "grant", "great", "green",
  "honest", "human", "idea", "image", "include", "issue",
  "join", "kind", "labor", "lake", "learn", "letter",
  "level", "local", "luck", "magic", "major", "moment",
  "moon", "music", "nature", "novel", "ocean", "offer",
  "open", "order", "paper", "perfect",
]);

/**
 * Pick `count` random words from the curated subset and join with spaces.
 * Uses `crypto.getRandomValues` for selection—overkill for cosmetic
 * output, but matches the pattern in pulse-sdk's challenge generator and
 * avoids any hot-loop bias that `Math.random` modulo selection would have.
 */
export function generateWalletlessPhrase(count: number = 5): string {
  if (count <= 0) return "";
  const dict = WALLETLESS_PHRASE_WORDS;
  const buf = new Uint32Array(count);
  crypto.getRandomValues(buf);
  const picks: string[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(dict[buf[i]! % dict.length]!);
  }
  return picks.join(" ");
}
