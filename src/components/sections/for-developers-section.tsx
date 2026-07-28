import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/ui/code-block";
import { sdkSnippet } from "@/data/developer-snippet";

/**
 * For Developers—text on the left, code block on the right.
 * Two-column split parallels the hero, signaling that the developer
 * story is a first-class part of the product narrative.
 */
export function ForDevelopersSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // FOR DEVELOPERS
        </span>

        <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-5 lg:items-start lg:gap-16">
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
              {sdkSnippet.title}
              <span className="text-cyan">.</span>
            </h2>

            <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/65 md:text-lg">
              One React component, one callback. <code className="font-mono text-cyan">{`<EntrosVerify />`}</code> opens the verification popup, runs the behavioral capture, mints the on-chain Anchor, and hands you a verified payload. Any Solana program can read the result for free.
            </p>

            <a
              href="/docs"
              className="
                group mt-8 inline-flex items-center gap-2
                rounded-full border border-foreground/20 px-5 py-2.5
                text-sm text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Read the docs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          <div className="lg:col-span-3">
            {/* The snippet is sized to its longest line rather than the
                column, and the leftover width becomes a rail: a hairline
                off the block's vertical centre running out to the site's
                right-hand skeleton line. `-mr-6` cancels the container
                padding so it lands on the rail exactly. */}
            <div className="flex items-center">
              <div className="min-w-0 w-full lg:w-auto lg:shrink lg:grow-0 lg:basis-[34rem]">
                <CodeBlock code={sdkSnippet.code} />
              </div>
              <div aria-hidden className="-mr-6 hidden h-px flex-1 bg-border lg:block" />
            </div>
            <div className="mt-4 font-mono text-sm text-foreground/50">
              <span className="text-foreground/30">$</span>{" "}
              {sdkSnippet.installCommand}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
