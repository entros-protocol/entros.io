/**
 * Fail when the served paper and rendered markdown have different update dates.
 *
 * The release artifacts have separate source files. The `Updated:` field binds
 * them without parsing the full document. Poppler supplies `pdftotext`.
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
  console.error("Rebuild the PDF from its LaTeX source, then commit the result.");
  process.exit(1);
}

console.log(`Paper in sync: ${md}`);
