/**
 * Fail when the served research paper PDF disagrees with the markdown rendered
 * at /paper.
 *
 * The two are separate hand-maintained copies of the same paper. The PDF is
 * built from a LaTeX source in a different, private repository, so nothing
 * makes them move together. Between 2026-08-01 and 2026-08-05 the site served
 * a PDF four days behind the markdown, because updating one is a manual step
 * that nobody owned.
 *
 * The `Updated:` line is the one field that changes whenever either is edited,
 * so comparing it catches the drift without parsing the whole document.
 *
 * Needs `pdftotext` from poppler. An earlier version inflated the PDF content
 * streams directly to avoid the dependency, but typeset text arrives as glyph
 * runs split across operators and the date was never recoverable. That version
 * passed every time, which is worse than no check at all.
 *
 * Run: node scripts/check-paper-sync.mjs
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const PDF = "public/entros-protocol-2026.pdf";
const MARKDOWN = "src/content/paper.md";

function markdownDate() {
  const match = readFileSync(MARKDOWN, "utf8").match(/\*\*Updated:\*\*\s*(.+)/);
  return match ? match[1].trim() : null;
}

function pdfDate() {
  const text = execFileSync("pdftotext", [PDF, "-"], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  const match = text.match(/Updated:\s*([A-Z][a-z]+ \d{1,2}, \d{4})/);
  return match ? match[1] : null;
}

const md = markdownDate();
if (!md) {
  console.error(`Could not find an "**Updated:**" line in ${MARKDOWN}.`);
  process.exit(1);
}

let pdf;
try {
  pdf = pdfDate();
} catch (err) {
  console.error("Could not run pdftotext. Install poppler and try again.");
  console.error("  macOS: brew install poppler");
  console.error("  Debian and Ubuntu: apt-get install -y poppler-utils");
  console.error(String(err.message ?? err));
  process.exit(1);
}

if (!pdf) {
  console.error(`No "Updated:" line found in ${PDF}.`);
  console.error("The title block should carry one. Check the LaTeX source.");
  process.exit(1);
}

if (pdf !== md) {
  console.error("The served paper and the rendered markdown disagree.");
  console.error(`  ${PDF}: ${pdf}`);
  console.error(`  ${MARKDOWN}: ${md}`);
  console.error("");
  console.error("Rebuild the PDF from the LaTeX source, then commit it here:");
  console.error("  sh scripts/build-paper.sh   (in the entros-docs checkout)");
  process.exit(1);
}

console.log(`Paper in sync: ${md}`);
