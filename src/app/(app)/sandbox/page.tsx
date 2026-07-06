import { IntegrateSandboxClient } from "@/components/sections/integrate-sandbox-client";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Integration Sandbox",
  description:
    "Live configuration sandbox for the Entros verification button. Tweak threat profiles, customize styling, and copy generated React, TypeScript, and Anchor code instantly.",
  path: "/sandbox",
});

export default function SandboxPage() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-10 md:pt-40 md:pb-12">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // DEVELOPER PLAYGROUND
          </span>

          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Integration sandbox<span className="text-cyan">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-foreground/65 md:mt-8 md:text-lg">
            Customize threat profile constraints, select verification models, and copy the dynamically generated code to secure your dApp in minutes.
          </p>
        </div>
      </section>

      <IntegrateSandboxClient />
    </>
  );
}
