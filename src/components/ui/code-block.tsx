import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  className?: string;
}

const KEYWORDS = new Set([
  "import",
  "from",
  "const",
  "let",
  "var",
  "await",
  "async",
  "if",
  "else",
  "return",
  "new",
  "export",
  "function",
  "type",
  "interface",
]);

function tokenizeLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let i = 0;

  while (i < line.length) {
    // Comments
    if (line.slice(i, i + 2) === "//") {
      tokens.push(
        <span key={i} className="text-[#9090A0]">
          {line.slice(i)}
        </span>
      );
      return tokens;
    }

    // Strings (single or double quotes, backticks)
    if (line[i] === "'" || line[i] === '"' || line[i] === "`") {
      const quote = line[i]!;
      let end = i + 1;
      while (end < line.length && line[end] !== quote) {
        if (line[end] === "\\") end++;
        end++;
      }
      end++;
      tokens.push(
        <span key={i} className="text-solana-green">
          {line.slice(i, end)}
        </span>
      );
      i = end;
      continue;
    }

    // Words (keywords, identifiers)
    if (/[a-zA-Z_$]/.test(line[i] ?? "")) {
      let end = i;
      while (end < line.length && /[a-zA-Z0-9_$]/.test(line[end] ?? "")) {
        end++;
      }
      const word = line.slice(i, end);

      // Check for function call (word followed by open paren)
      const nextNonSpace = line.slice(end).match(/^(\s*)\(/);
      if (nextNonSpace) {
        tokens.push(
          <span key={i} className="text-[#C084FC]">
            {word}
          </span>
        );
      } else if (KEYWORDS.has(word)) {
        tokens.push(
          <span key={i} className="text-cyan">
            {word}
          </span>
        );
      } else {
        tokens.push(<span key={i}>{word}</span>);
      }
      i = end;
      continue;
    }

    // Default character
    tokens.push(<span key={i}>{line[i]}</span>);
    i++;
  }

  return tokens;
}

export function CodeBlock({ code, className }: CodeBlockProps) {
  const lines = code.split("\n");

  return (
    <pre
      className={cn(
        "overflow-x-auto rounded-2xl bg-foreground/[0.06] p-6 font-mono text-sm leading-relaxed text-foreground/80",
        className
      )}
    >
      <code>
        {lines.map((line, idx) => (
          <div key={idx}>{tokenizeLine(line)}</div>
        ))}
      </code>
    </pre>
  );
}
