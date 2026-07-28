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
 * Source: each word is verified to exist in
 * `executor-node/src/challenge/word_dict.rs` (which is a verbatim copy of
 * `entros-validation/src/word_dict.rs`). The full dict has 1,357 entries;
 * this 80-word subset gives 80^5 ≈ 3.3 billion phrase combinations —
 * astronomically more than enough for cosmetic non-repetition. Keeping the
 * subset small avoids bloating the client bundle and avoids the drift-
 * detection cost that would come with shipping the full dict client-side.
 *
 * Words selected for: short (4-6 letters), unambiguous, neutral or
 * positive valence, alphabetically distributed across the dict for
 * variety.
 */
export const WALLETLESS_PHRASE_WORDS: readonly string[] = Object.freeze([
  "able", "active", "added", "advance", "agree", "alive",
  "amount", "answer", "appear", "arrived", "aware",
  "balance", "battle", "begin", "better", "blue", "brief",
  "bright", "bring", "broad", "build", "calm", "career",
  "center", "choose", "clean", "clear", "coast", "common",
  "create", "data", "decide", "depth", "design", "details",
  "earned", "eight", "energy", "engine", "enough", "exact",
  "famous", "field", "final", "first", "forward", "future",
  "garden", "gather", "global", "grand", "grant", "growth",
  "honest", "human", "ideas", "image", "include", "issue",
  "joined", "kind", "labor", "learn", "level", "light",
  "local", "logic", "lucky", "magic", "major", "model",
  "moment", "music", "nature", "neutral", "ocean", "offer",
  "open", "order", "peace", "perfect",
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
