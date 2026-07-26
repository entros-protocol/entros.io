/**
 * 5x7 bitmap font for ASCII art. Each glyph row is a string, "#" = ink.
 *
 * Shared by the ASCII art components so a wordmark rendered standalone and
 * one branded into a particle field use identical letterforms.
 */
export const GLYPHS_5X7: Record<string, string[]> = {
  $: [
    "..#..",
    ".####",
    "#.#..",
    ".###.",
    "..#.#",
    "####.",
    "..#..",
  ],
  E: [
    "#####",
    "#....",
    "#....",
    "####.",
    "#....",
    "#....",
    "#####",
  ],
  N: [
    "#...#",
    "##..#",
    "##..#",
    "#.#.#",
    "#..##",
    "#..##",
    "#...#",
  ],
  T: [
    "#####",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
    "..#..",
  ],
  R: [
    "####.",
    "#...#",
    "#...#",
    "####.",
    "#.#..",
    "#..#.",
    "#...#",
  ],
  O: [
    ".###.",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    "#...#",
    ".###.",
  ],
  S: [
    ".###.",
    "#...#",
    "#....",
    ".###.",
    "....#",
    "#...#",
    ".###.",
  ],
};

export const GLYPH_W = 5;
export const GLYPH_H = 7;

/** Row stride used to pack (row, col) into a single Set key. */
export const MASK_STRIDE = 4096;

export interface WordMask {
  /** Packed `row * MASK_STRIDE + col` keys for every ink cell. */
  cells: Set<number>;
  cols: number;
  rows: number;
}

/**
 * Rasterize `text` into a set of ink cells, scaling each bitmap pixel to
 * `scaleX` by `scaleY` cells. `gap` is measured in unscaled pixel columns.
 * Unknown characters advance the cursor and leave blank space.
 */
export function buildWordMask(
  text: string,
  scaleX = 1,
  scaleY = 1,
  gap = 1
): WordMask {
  const cells = new Set<number>();
  let cursor = 0;
  for (const ch of text) {
    const glyph = GLYPHS_5X7[ch.toUpperCase()];
    if (!glyph) {
      cursor += GLYPH_W + gap;
      continue;
    }
    for (let r = 0; r < GLYPH_H; r++) {
      const line = glyph[r]!;
      for (let c = 0; c < GLYPH_W; c++) {
        if (line[c] !== "#") continue;
        for (let sy = 0; sy < scaleY; sy++) {
          for (let sx = 0; sx < scaleX; sx++) {
            const rr = r * scaleY + sy;
            const cc = (cursor + c) * scaleX + sx;
            cells.add(rr * MASK_STRIDE + cc);
          }
        }
      }
    }
    cursor += GLYPH_W + gap;
  }
  return {
    cells,
    cols: Math.max(0, cursor - gap) * scaleX,
    rows: GLYPH_H * scaleY,
  };
}
