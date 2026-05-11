import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3">
        <div>
          <p className="font-mono text-sm font-bold text-foreground">
            entros<span className="text-cyan">.</span>
          </p>
          <p className="mt-2 text-xs text-foreground/60">
            Proof of Personhood on Solana
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted">
          <Link href="/technology" className="transition-colors hover:text-foreground">
            Technology
          </Link>
          <Link href="/solutions" className="transition-colors hover:text-foreground">
            Solutions
          </Link>
          <Link href="/verify" className="transition-colors hover:text-foreground">
            Verify
          </Link>
          <Link href="/security" className="transition-colors hover:text-foreground">
            Security
          </Link>
          <Link href="/roadmap" className="transition-colors hover:text-foreground">
            Roadmap
          </Link>
          <Link href="/press" className="transition-colors hover:text-foreground">
            Press
          </Link>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted">
          <a
            href="https://github.com/entros-protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            GitHub
          </a>
          <a
            href="https://discord.gg/dWBYJ6Dc"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Discord
          </a>
          <a
            href="https://x.com/entros_protocol"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            X / Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
