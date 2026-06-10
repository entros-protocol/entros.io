"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PaperMeta {
  version?: string;
  updated?: string;
  wordCount?: string;
}

interface PaperContentProps {
  title: string;
  meta: PaperMeta;
  body: string;
}

export function PaperContent({ title, meta, body }: PaperContentProps) {
  return (
    <article className="mx-auto max-w-3xl px-6 pt-28 pb-24 md:pt-32 md:pb-32">
      {/* Compact title block—eyebrow, title + small action buttons on
          the right, mono metadata row, hairline divider. Abstract
          visible immediately below. */}
      <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
        // RESEARCH PAPER
      </span>

      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-8">
        <h1 className="font-display text-2xl font-medium leading-[1.15] tracking-[-0.01em] text-foreground md:max-w-2xl md:text-3xl lg:text-4xl">
          {title}<span className="text-cyan">.</span>
        </h1>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href="https://zenodo.org/records/20609854"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 font-mono text-xs text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            Zenodo
            <span aria-hidden="true">↗</span>
          </a>
          <a
            href="/entros-protocol-2026.pdf"
            download
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 font-mono text-xs text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            PDF
            <span aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      {(meta.version || meta.updated || meta.wordCount) && (
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[10px] uppercase tracking-[0.15em]">
          {meta.version && (
            <span className="text-foreground/40">
              <span className="text-foreground/30">v</span>
              {" "}
              <span className="text-foreground/65">{meta.version}</span>
            </span>
          )}
          {meta.updated && (
            <span className="text-foreground/40">
              <span className="text-foreground/30">Updated</span>
              {" "}
              <span className="text-foreground/65">{meta.updated}</span>
            </span>
          )}
          {meta.wordCount && (
            <span className="text-foreground/40">
              <span className="text-foreground/30">Length</span>
              {" "}
              <span className="text-foreground/65">{meta.wordCount}</span>
            </span>
          )}
        </div>
      )}

      <hr className="mt-10 border-t border-border md:mt-12" />

      <div className="mt-12 md:mt-16">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="mt-16 font-display text-3xl font-medium tracking-tight text-foreground first:mt-0 md:text-4xl">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="mt-16 font-display text-2xl font-medium tracking-tight text-foreground first:mt-0 md:text-3xl md:leading-[1.15]">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-12 font-display text-xl font-medium tracking-tight text-foreground md:text-2xl">
                {children}
              </h3>
            ),
            h4: ({ children }) => (
              <h4 className="mt-8 font-display text-base font-medium tracking-tight text-foreground md:text-lg">
                {children}
              </h4>
            ),
            p: ({ children }) => (
              <p className="mt-6 text-base leading-relaxed text-foreground/75 md:text-[17px]">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="mt-6 list-disc space-y-2 pl-6 text-base text-foreground/75 marker:text-foreground/30 md:text-[17px]">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="mt-6 list-decimal space-y-2 pl-6 text-base text-foreground/75 marker:font-mono marker:text-foreground/30 md:text-[17px]">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote className="mt-6 border-l border-cyan/60 pl-6 italic text-foreground/60">
                {children}
              </blockquote>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.startsWith("language-");
              if (isBlock) {
                return (
                  <code className="block overflow-x-auto border border-border bg-surface p-5 font-mono text-sm leading-relaxed text-foreground/80">
                    {children}
                  </code>
                );
              }
              return (
                <code className="border border-border bg-surface px-1.5 py-0.5 font-mono text-[13px] text-cyan">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <pre className="mt-6">{children}</pre>,
            table: ({ children }) => (
              <div className="mt-8 overflow-x-auto border border-border">
                <table className="w-full border-collapse text-sm">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="border-b border-border bg-surface">
                {children}
              </thead>
            ),
            th: ({ children }) => (
              <th className="px-5 py-4 text-left font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-border px-5 py-4 text-foreground/75 last:border-b-0">
                {children}
              </td>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-cyan underline underline-offset-[3px] decoration-cyan/30 transition-colors hover:text-foreground hover:decoration-foreground/40"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
            hr: () => <hr className="my-12 border-t border-border" />,
            strong: ({ children }) => (
              <strong className="font-medium text-foreground">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-foreground/85">{children}</em>
            ),
          }}
        >
          {body}
        </ReactMarkdown>
      </div>
    </article>
  );
}
