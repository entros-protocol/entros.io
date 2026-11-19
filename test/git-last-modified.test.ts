import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatSitemapDate, SITE_LAST_MODIFIED } from "@/app/sitemap";
import {
  clearGitLastModifiedCache,
  resolveGitLastModified,
} from "@/lib/git-last-modified";

const REPO_ROOT = path.resolve(__dirname, "..");

afterEach(() => {
  clearGitLastModifiedCache();
});

describe("git last-modified resolution", () => {
  it("returns distinct per-file commit dates in a full repository checkout", async () => {
    const trustScoreDate = await resolveGitLastModified(
      path.join(REPO_ROOT, "content/docs/concepts/trust-score.mdx"),
      REPO_ROOT,
    );
    const roadmapDate = await resolveGitLastModified(
      path.join(REPO_ROOT, "content/docs/roadmap/current.mdx"),
      REPO_ROOT,
    );

    expect(trustScoreDate).toBeInstanceOf(Date);
    expect(roadmapDate).toBeInstanceOf(Date);
    expect(formatSitemapDate(trustScoreDate)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatSitemapDate(roadmapDate)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(formatSitemapDate(trustScoreDate)).not.toBe(
      formatSitemapDate(roadmapDate),
    );
  });

  it("returns null on a --depth 1 shallow clone so callers fall back deterministically", async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "entros-shallow-test-"));
    try {
      execFileSync(
        "git",
        ["clone", "--depth", "1", "--no-local", `file://${REPO_ROOT}`, tempDir],
        { stdio: "ignore" },
      );

      const shallowDate = await resolveGitLastModified(
        path.join(tempDir, "content/docs/concepts/trust-score.mdx"),
        tempDir,
      );

      expect(shallowDate).toBeNull();
      expect(formatSitemapDate(shallowDate)).toBe(SITE_LAST_MODIFIED);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("returns null outside a git repository and formats fallbacks cleanly", async () => {
    const nonGitDir = mkdtempSync(path.join(os.tmpdir(), "entros-nongit-test-"));
    try {
      const result = await resolveGitLastModified(
        path.join(nonGitDir, "index.mdx"),
        nonGitDir,
      );
      expect(result).toBeNull();
      expect(formatSitemapDate(undefined)).toBe(SITE_LAST_MODIFIED);
      expect(formatSitemapDate(null)).toBe(SITE_LAST_MODIFIED);
      expect(formatSitemapDate("not-a-date")).toBe(SITE_LAST_MODIFIED);
      expect(formatSitemapDate(new Date("2026-09-11T02:07:51.000Z"))).toBe(
        "2026-09-11",
      );
    } finally {
      rmSync(nonGitDir, { recursive: true, force: true });
    }
  });
});
