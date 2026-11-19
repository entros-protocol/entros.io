import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatSitemapDate, SITE_LAST_MODIFIED } from "@/app/sitemap";
import {
  clearGitLastModifiedCache,
  resolveGitLastModified,
} from "@/lib/git-last-modified";

const REPO_ROOT = path.resolve(__dirname, "..");

function gitInTempRepo(
  cwd: string,
  args: string[],
  dateIso?: string,
): void {
  const env = dateIso
    ? {
        ...process.env,
        GIT_AUTHOR_DATE: dateIso,
        GIT_COMMITTER_DATE: dateIso,
      }
    : process.env;
  execFileSync(
    "git",
    [
      "-c",
      "user.name=Entros Test",
      "-c",
      "user.email=test@entros.invalid",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { cwd, env, stdio: "ignore" },
  );
}

afterEach(() => {
  clearGitLastModifiedCache();
});

describe("git last-modified resolution", () => {
  it("returns distinct per-file commit dates across commits and validates repo checkout depth", async () => {
    const tempRepo = mkdtempSync(path.join(os.tmpdir(), "entros-history-test-"));
    try {
      gitInTempRepo(tempRepo, ["init"]);
      mkdirSync(path.join(tempRepo, "content/docs"), { recursive: true });

      const firstFile = path.join(tempRepo, "content/docs/first.mdx");
      writeFileSync(firstFile, "# First\n");
      gitInTempRepo(tempRepo, ["add", "content/docs/first.mdx"]);
      gitInTempRepo(
        tempRepo,
        ["commit", "-m", "Add first doc"],
        "2026-08-15T12:00:00Z",
      );

      const secondFile = path.join(tempRepo, "content/docs/second.mdx");
      writeFileSync(secondFile, "# Second\n");
      gitInTempRepo(tempRepo, ["add", "content/docs/second.mdx"]);
      gitInTempRepo(
        tempRepo,
        ["commit", "-m", "Add second doc"],
        "2026-10-20T12:00:00Z",
      );

      const firstDate = await resolveGitLastModified(firstFile, tempRepo);
      const secondDate = await resolveGitLastModified(secondFile, tempRepo);

      expect(firstDate).toBeInstanceOf(Date);
      expect(secondDate).toBeInstanceOf(Date);
      expect(formatSitemapDate(firstDate)).toBe("2026-08-15");
      expect(formatSitemapDate(secondDate)).toBe("2026-10-20");
    } finally {
      rmSync(tempRepo, { recursive: true, force: true });
    }

    const trustScoreDate = await resolveGitLastModified(
      path.join(REPO_ROOT, "content/docs/concepts/trust-score.mdx"),
      REPO_ROOT,
    );
    const roadmapDate = await resolveGitLastModified(
      path.join(REPO_ROOT, "content/docs/roadmap/current.mdx"),
      REPO_ROOT,
    );

    const isShallowRaw = execFileSync(
      "git",
      ["rev-parse", "--is-shallow-repository"],
      { cwd: REPO_ROOT, encoding: "utf8" },
    ).trim();

    if (isShallowRaw === "false") {
      expect(trustScoreDate).toBeInstanceOf(Date);
      expect(roadmapDate).toBeInstanceOf(Date);
      expect(formatSitemapDate(trustScoreDate)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formatSitemapDate(roadmapDate)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(formatSitemapDate(trustScoreDate)).not.toBe(
        formatSitemapDate(roadmapDate),
      );
    } else {
      const headSha = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: REPO_ROOT,
        encoding: "utf8",
      }).trim();
      const boundaries = new Set(
        execFileSync("git", ["rev-list", "--max-parents=0", "HEAD"], {
          cwd: REPO_ROOT,
          encoding: "utf8",
        })
          .trim()
          .split(/\r?\n/)
          .filter(Boolean),
      );
      if (boundaries.has(headSha)) {
        expect(trustScoreDate).toBeNull();
        expect(roadmapDate).toBeNull();
        expect(formatSitemapDate(trustScoreDate)).toBe(SITE_LAST_MODIFIED);
      }
    }
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
