import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnnotatedCode } from "@/components/ui/annotated-code";
import { CodeBlock } from "@/components/ui/code-block";
import { sdkSnippet } from "@/data/developer-snippet";

const notes: Record<number, string> = {
  0: sdkSnippet.installCommand,
  2: "Opens the verification popup",
  3: "Your app's key",
  4: "Receives the verified wallet",
};

/**
 * For Developers: one centred column. The snippet sits in the middle with
 * its lines counted in the left margin, so the headline's five lines are
 * literal, and what each line does is noted in the right margin.
 */
export function ForDevelopersSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-36">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
            {sdkSnippet.title}
            <span className="text-cyan">.</span>
          </h2>
          <p className="mt-6 text-balance text-base leading-relaxed text-foreground/65 md:text-lg">
            One React component and one callback.
          </p>
        </div>

        <div className="mt-14 md:mt-20">
          <div className="hidden lg:block">
            <AnnotatedCode code={sdkSnippet.code} notes={notes} />
          </div>
          <div className="mx-auto max-w-xl lg:hidden">
            <CodeBlock code={sdkSnippet.code} />
            <div className="mt-4 font-mono text-sm text-foreground/50">
              <span className="text-foreground/30">$</span>{" "}
              {sdkSnippet.installCommand}
            </div>
          </div>
        </div>

        <div className="mt-14 flex justify-center md:mt-16">
          <Link
            href="/docs"
            className="
              group inline-flex items-center gap-2
              border border-foreground/20 px-5 py-2.5
              text-sm text-foreground
              transition-colors hover:border-foreground/40 hover:bg-foreground/5
            "
          >
            Read the docs
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
