import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  COORDINATE_MAX,
  PATH_COUNT,
  randomPath,
  realWords,
  WORD_COUNT,
} from "@/lib/lab/challenge-material";

/**
 * Both lists are copies. These tests are the drift detector: if the executor's dictionary or the
 * prototype's shapes move, the harness stops measuring the challenge material a real capture
 * uses, and nothing else would say so.
 */
function repoFile(path: string): string {
  return readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), "utf8");
}

/**
 * The upstream sources live in sibling checkouts of the workspace. Hosted CI checks out this
 * repository alone, and one upstream is private, so each comparison runs only where its sibling
 * checkout exists. A checkout that exists without the file still fails, so a moved source cannot
 * pass silently.
 */
function hasCheckout(name: string): boolean {
  return existsSync(fileURLToPath(new URL(`../../${name}/`, import.meta.url)));
}

describe("challenge material", () => {
  it.skipIf(!hasCheckout("executor-node"))("carries the same words the executor issues", () => {
    const source = repoFile("executor-node/src/challenge/word_dict.rs");
    const body = source.split("pub const WORDS: &[&str] = &[")[1]?.split("];")[0] ?? "";
    const upstream = [...body.matchAll(/"([a-z]+)"/g)].map((match) => match[1]);

    expect(upstream.length).toBeGreaterThan(0);
    expect(WORD_COUNT).toBe(upstream.length);

    // Every word the harness can issue has to exist upstream. Sampling the generator would
    // leave a silent gap, so compare the whole list.
    const ours = new Set<string>();
    for (let attempt = 0; attempt < 20_000 && ours.size < WORD_COUNT; attempt += 1) {
      for (const word of realWords(1)) ours.add(word);
    }
    for (const word of ours) expect(upstream).toContain(word);
  });

  it("issues real words rather than syllables", () => {
    const words = realWords(5);
    expect(words).toHaveLength(5);
    expect(new Set(words).size).toBe(5);
    for (const word of words) expect(word).toMatch(/^[a-z]{3,}$/);
  });

  it.skipIf(!hasCheckout("entros-validation"))(
    "carries the same shapes and reflections the prototype issues",
    () => {
      const source = repoFile("entros-validation/src/paired_round/challenge.rs");
      const shapeBody = source.split("const SHAPES: &[Shape] = &[")[1]?.split("\n];")[0] ?? "";
      const upstreamShapes = [...shapeBody.matchAll(/waypoints: &\[([^\]]+)\]/g)].map((match) =>
        [...match[1]!.matchAll(/\((\d+), (\d+)\)/g)].map(([, x, y]) => `${x},${y}`).join(" "),
      );

      expect(upstreamShapes.length).toBe(5);
      expect(source).toContain("const ORIENTATIONS: usize = 4;");
      expect(PATH_COUNT).toBe(upstreamShapes.length * 4);

      // Fold each generated path back to its unreflected form and require it upstream.
      for (let attempt = 0; attempt < 400; attempt += 1) {
        const path = randomPath();
        const candidates = [
          path.map((point) => `${point.x},${point.y}`).join(" "),
          path.map((point) => `${COORDINATE_MAX - point.x},${point.y}`).join(" "),
          path.map((point) => `${point.x},${COORDINATE_MAX - point.y}`).join(" "),
          path
            .map((point) => `${COORDINATE_MAX - point.x},${COORDINATE_MAX - point.y}`)
            .join(" "),
        ];
        expect(candidates.some((candidate) => upstreamShapes.includes(candidate))).toBe(true);
      }
    },
  );

  it("keeps every waypoint inside the grid", () => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const path = randomPath();
      expect(path.length).toBeGreaterThanOrEqual(3);
      expect(path.length).toBeLessThanOrEqual(5);
      for (const point of path) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(COORDINATE_MAX);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(COORDINATE_MAX);
      }
    }
  });

  it("reaches more than one orientation", () => {
    const seen = new Set<string>();
    for (let attempt = 0; attempt < 300; attempt += 1) {
      seen.add(randomPath().map((point) => `${point.x},${point.y}`).join(" "));
    }
    expect(seen.size).toBe(PATH_COUNT);
  });
});
