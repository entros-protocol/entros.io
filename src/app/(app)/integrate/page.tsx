import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IntegrateGuide } from "@/components/sections/integrate-guide";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Integrate",
  description:
    "Drop the EntrosVerify component into any Solana app in five lines, or wire the Pulse SDK directly for custom UX. Reading on-chain attestations is free and needs no account with us.",
  path: "/integrate",
});

export default function Integrate() {
  return (
    <>
      {/* Hero—centered, terminal install callout below the copy. */}
      <section>
        <div className="mx-auto max-w-5xl px-6 pt-32 pb-12 text-center md:pt-40">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // INTEGRATE
          </span>

          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Five lines<span className="text-cyan">.</span>
            <br />
            Every dApp on Solana<span className="text-cyan">.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-foreground/70 md:mt-8 md:text-lg">
            Drop in <code className="font-mono text-cyan">{`<EntrosVerify />`}</code> for the five-line path, or wire the Pulse SDK directly for custom UX. Reading on-chain attestations is free and needs no account with us.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://github.com/entros-protocol/entros-verify"
              target="_blank"
              rel="noopener noreferrer"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              View on GitHub
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Try the demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Install callout */}
        <div className="mx-auto max-w-3xl px-6 pb-20 md:pb-28">
          <div className="relative border border-border bg-surface px-6 py-5 font-mono text-sm md:px-8 md:py-6 md:text-base">
            <span className="absolute left-0 top-0 h-3 w-3 border-l border-t border-cyan/70" aria-hidden />
            <span className="absolute right-0 top-0 h-3 w-3 border-r border-t border-cyan/70" aria-hidden />
            <span className="absolute bottom-0 left-0 h-3 w-3 border-b border-l border-cyan/70" aria-hidden />
            <span className="absolute bottom-0 right-0 h-3 w-3 border-b border-r border-cyan/70" aria-hidden />

            <span className="text-foreground/40">$</span>
            <span className="ml-3 text-foreground/85">npm install </span>
            <span className="text-cyan">@entros/verify</span>
            <span className="text-foreground/40"> # or @entros/pulse-sdk for programmatic UX</span>
          </div>
        </div>
      </section>

      <IntegrateGuide />

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center md:py-40">
          <h2 className="font-display text-4xl font-medium tracking-tight text-foreground md:text-6xl md:leading-[1.05]">
            Verified humans<span className="text-cyan">.</span>
            <br />
            Free for integrators<span className="text-cyan">.</span>
          </h2>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Try the demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/solutions"
              className="
                group inline-flex items-center justify-center gap-2
                rounded-full border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              See use cases
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
