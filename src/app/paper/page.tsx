import fs from "fs";
import path from "path";
import { PaperContent } from "./paper-content";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Research Paper",
  description:
    "Entros Protocol: Proof-of-Personhood through Temporal Biometric Consistency. Threat model, ZK circuit, on-chain anchoring, and security analysis.",
  path: "/paper",
});

interface PaperMeta {
  version?: string;
  original?: string;
  updated?: string;
  wordCount?: string;
}

export default function PaperPage() {
  const paperPath = path.join(process.cwd(), "src", "content", "paper.md");
  const raw = fs.readFileSync(paperPath, "utf-8");

  // Split off the title + metadata header (everything before the first
  // standalone --- separator). The rest is the paper body.
  const sepRegex = /\n---\n/;
  const sepIndex = raw.search(sepRegex);
  const headerRaw = sepIndex >= 0 ? raw.slice(0, sepIndex) : raw;
  const body = sepIndex >= 0 ? raw.slice(sepIndex + 5).trim() : raw;

  const titleMatch = headerRaw.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? "Research Paper";

  const meta: PaperMeta = {
    version: headerRaw.match(/\*\*Document Version:\*\*\s*([^\n]+)/)?.[1]?.trim(),
    original: headerRaw.match(/\*\*Original Date:\*\*\s*([^\n]+)/)?.[1]?.trim(),
    updated: headerRaw.match(/\*\*Updated:\*\*\s*([^\n]+)/)?.[1]?.trim(),
    wordCount: headerRaw.match(/\*\*Word Count:\*\*\s*([^\n]+)/)?.[1]?.trim(),
  };

  return <PaperContent title={title} meta={meta} body={body} />;
}
