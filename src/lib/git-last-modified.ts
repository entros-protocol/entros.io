import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface RepoGitState {
  isShallow: boolean;
  shallowBoundaries: Set<string>;
}

const repoStateCache = new Map<string, Promise<RepoGitState | null>>();
const fileTimestampCache = new Map<string, Promise<Date | null>>();

async function runGit(args: string[], cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function getRepoGitState(cwd: string): Promise<RepoGitState | null> {
  const key = path.resolve(cwd);
  const cached = repoStateCache.get(key);
  if (cached) return cached;

  const promise = (async (): Promise<RepoGitState | null> => {
    const shallowRaw = await runGit(
      ["rev-parse", "--is-shallow-repository"],
      key,
    );
    if (shallowRaw === null) return null;

    const isShallow = shallowRaw === "true";
    const shallowBoundaries = new Set<string>();
    if (isShallow) {
      const rootsRaw = await runGit(
        ["rev-list", "--max-parents=0", "HEAD"],
        key,
      );
      if (rootsRaw) {
        for (const line of rootsRaw.split(/\r?\n/)) {
          const sha = line.trim();
          if (sha) shallowBoundaries.add(sha);
        }
      }
    }
    return { isShallow, shallowBoundaries };
  })();

  repoStateCache.set(key, promise);
  return promise;
}

/**
 * Resolve the last Git commit timestamp for a tracked content file.
 *
 * On shallow clones (for example GitHub Actions `--depth 1` or default Vercel
 * shallow checkouts), Git attributes untouched files to the shallow boundary
 * commit, which shifts on unrelated deploys. When a file's latest visible
 * commit is a shallow boundary, return `null` so callers fall back to a
 * deterministic static date instead of a moving build-time timestamp.
 */
export async function resolveGitLastModified(
  filePath: string,
  cwd: string = process.cwd(),
): Promise<Date | null> {
  const resolvedCwd = path.resolve(cwd);
  const resolvedFile = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(resolvedCwd, filePath);
  const cacheKey = `${resolvedCwd}\0${resolvedFile}`;
  const cached = fileTimestampCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async (): Promise<Date | null> => {
    const state = await getRepoGitState(resolvedCwd);
    if (!state) return null;

    const relativePath = path.relative(resolvedCwd, resolvedFile);
    if (!relativePath || relativePath.startsWith("..")) return null;

    const output = await runGit(
      ["log", "-1", "--format=%H%x09%cI", "--", relativePath],
      resolvedCwd,
    );
    if (!output) return null;

    const [sha, isoDate] = output.split("\t");
    if (!sha || !isoDate) return null;

    if (state.isShallow && state.shallowBoundaries.has(sha)) {
      return null;
    }

    const parsed = new Date(isoDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  })();

  fileTimestampCache.set(cacheKey, promise);
  return promise;
}

export function clearGitLastModifiedCache(): void {
  repoStateCache.clear();
  fileTimestampCache.clear();
}
