import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  COMPARISON_EXPLAINERS,
  COMPARISON_UPDATED,
  MODALITY_ROWS,
  POLICY_BOUNDARIES,
  VENDOR_SCOPE_ROWS,
  type PrimarySource,
} from "@/data/comparison";
import { pageMetadata } from "@/lib/page-metadata";
import {
  buttonArrowClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/ui/button-styles";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "Compare Modalities",
  description:
    "Compare anatomical, credential, KYC, and behavioral human verification with dated primary sources and explicit limits.",
  path: "/compare",
});

function SourceLink({ source }: { source: PrimarySource }) {
  if (source.external) {
    return (
      <a
        href={source.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-8 items-center gap-1 text-xs text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:text-cyan hover:decoration-cyan motion-reduce:transition-none"
      >
        <span>{source.label}</span>
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
      </a>
    );
  }
  return (
    <Link
      href={source.href}
      className="inline-flex min-h-8 items-center gap-1 text-xs text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:text-cyan hover:decoration-cyan motion-reduce:transition-none"
    >
      <span>{source.label}</span>
    </Link>
  );
}

export default function ComparePage() {
  return (
    <>
      {/* Hero */}
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-16 md:pt-40 md:pb-24">
          <h1 className="max-w-4xl font-display text-4xl font-normal leading-[1.03] tracking-[-0.02em] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            Compare verification modalities<span className="text-cyan">.</span>
          </h1>

          <p className="mt-7 max-w-[65ch] text-base leading-relaxed text-foreground/75 md:mt-8 md:text-lg">
            Entros supplies optional complementary behavioral evidence within an
            application policy. Teams choose anatomical, credential, KYC, or
            behavioral inputs based on the risks each action carries.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 bg-surface px-6 py-4 font-mono text-xs text-muted forced-colors:border forced-colors:border-[CanvasText]">
            <span>Updated {COMPARISON_UPDATED}</span>
            <span>Entros status: Solana devnet</span>
            <span>Primary sources dated per row</span>
            <span>No accuracy rankings</span>
          </div>

          <nav
            aria-label="Comparison sections"
            className="mt-6 flex flex-wrap gap-2"
          >
            {[
              { href: "#modalities", label: "Modalities" },
              { href: "#policy-boundaries", label: "Policy boundaries" },
              { href: "#vendors", label: "Dated vendor scope" },
              { href: "#explainers", label: "Integration notes" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center bg-surface px-4 py-2 text-xs font-medium text-foreground transition-colors duration-150 hover:bg-surface-hover motion-reduce:transition-none forced-colors:border forced-colors:border-[ButtonText]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* Modality table */}
      <section id="modalities" className="scroll-mt-24 bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              Four modalities across Integrator Policy v1 primitives
              <span className="text-cyan">.</span>
            </h2>
            <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted">
              Each row evaluates fresh result, continuity, uniqueness status,
              assurance tier, and limits in one table. Entros states its
              devnet, sensor provenance, and unmeasured population limits
              inside the same table.
            </p>
          </div>

          {/* Row anchor index */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">
              Row anchors:
            </span>
            {MODALITY_ROWS.map((row) => (
              <a
                key={row.id}
                href={`#${row.id}`}
                className="inline-flex min-h-11 items-center bg-background px-3 py-2 font-mono text-xs text-foreground/80 transition-colors duration-150 hover:bg-surface-hover hover:text-cyan motion-reduce:transition-none forced-colors:border forced-colors:border-[ButtonText]"
              >
                #{row.id}
              </a>
            ))}
          </div>

          {/* Desktop column headers */}
          <div className="mt-8 bg-background forced-colors:border forced-colors:border-[CanvasText]">
            <div
              aria-hidden="true"
              className="hidden border-b border-border bg-surface-hover/50 px-6 py-3.5 text-xs font-medium text-muted lg:grid lg:grid-cols-[1.05fr_1fr_1fr_1fr_1fr_1.35fr] lg:gap-6"
            >
              <span>Modality</span>
              <span>Fresh result</span>
              <span>Continuity</span>
              <span>Uniqueness status</span>
              <span>Assurance tier</span>
              <span>Limit</span>
            </div>

            <div className="divide-y divide-border">
              {MODALITY_ROWS.map((row) => (
                <article
                  key={row.id}
                  id={row.id}
                  className={cn(
                    "scroll-mt-24 grid grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-[1.05fr_1fr_1fr_1fr_1fr_1.35fr] lg:gap-6",
                    row.highlight && "bg-surface/75",
                  )}
                >
                  <div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-medium text-foreground">
                          {row.name}
                        </h3>
                        {row.highlight && (
                          <span className="bg-background px-2 py-0.5 font-mono text-xs font-medium text-cyan">
                            Entros
                          </span>
                        )}
                      </div>
                      <a
                        href={`#${row.id}`}
                        className="inline-flex min-h-11 w-fit items-center font-mono text-xs text-muted transition-colors duration-150 hover:text-cyan motion-reduce:transition-none"
                      >
                        #{row.id}
                      </a>
                    </div>
                    <p className="mt-1 max-w-[65ch] text-xs leading-relaxed text-muted">
                      {row.examples}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted lg:hidden">
                      Fresh result
                    </p>
                    <p className="max-w-[65ch] text-sm leading-relaxed text-foreground/85">
                      {row.freshResult}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted lg:hidden">
                      Continuity
                    </p>
                    <p className="max-w-[65ch] text-sm leading-relaxed text-foreground/85">
                      {row.continuity}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted lg:hidden">
                      Uniqueness status
                    </p>
                    <p className="max-w-[65ch] text-sm leading-relaxed text-foreground/85">
                      {row.uniquenessStatus}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted lg:hidden">
                      Assurance tier
                    </p>
                    <p className="max-w-[65ch] text-sm leading-relaxed text-foreground/85">
                      {row.assuranceTier}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4 lg:border-t-0 lg:border-l lg:border-border lg:pt-0 lg:pl-6">
                    <p className="mb-1 text-xs font-medium text-muted lg:hidden">
                      Limit
                    </p>
                    <p className="max-w-[65ch] text-sm leading-relaxed text-foreground/85">
                      {row.limit}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Distinct policy concerns */}
      <section
        id="policy-boundaries"
        className="scroll-mt-24"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              Keep five policy questions separate
              <span className="text-cyan">.</span>
            </h2>
            <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted">
              No single verification modality answers all five questions.
              Evaluate each question on its own in server and on-chain checks.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {POLICY_BOUNDARIES.map((item) => (
              <div
                key={item.id}
                id={item.id}
                className="scroll-mt-24 flex flex-col justify-between bg-surface p-6 forced-colors:border forced-colors:border-[CanvasText]"
              >
                <div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    {item.name}
                  </h3>
                  <p className="mt-2 font-mono text-xs text-cyan">
                    {item.question}
                  </p>
                </div>
                <p className="mt-4 max-w-[65ch] text-sm leading-relaxed text-foreground/80">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dated vendor scope */}
      <section id="vendors" className="scroll-mt-24 bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              Dated primary-source vendor scope
              <span className="text-cyan">.</span>
            </h2>
            <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted">
              Each row cites public primary documentation on the recorded check
              date. Vendor capabilities change over time, so recheck the linked
              source before making architecture decisions. This page publishes
              no accuracy or EER ranking.
            </p>
          </div>

          {/* Vendor anchor index */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted">
              Vendor anchors:
            </span>
            {VENDOR_SCOPE_ROWS.map((row) => (
              <a
                key={row.id}
                href={`#${row.id}`}
                className="inline-flex min-h-11 items-center bg-background px-3 py-2 font-mono text-xs text-foreground/80 transition-colors duration-150 hover:bg-surface-hover hover:text-cyan motion-reduce:transition-none forced-colors:border forced-colors:border-[ButtonText]"
              >
                #{row.id}
              </a>
            ))}
          </div>

          <div className="mt-8 bg-background forced-colors:border forced-colors:border-[CanvasText]">
            <div
              aria-hidden="true"
              className="hidden border-b border-border bg-surface-hover/50 px-6 py-3.5 text-xs font-medium text-muted lg:grid lg:grid-cols-[1.05fr_1.7fr_1.45fr_0.95fr] lg:gap-6"
            >
              <span>System and check date</span>
              <span>Documented scope</span>
              <span>Limits and comparison boundary</span>
              <span>Primary sources</span>
            </div>

            <div className="divide-y divide-border">
              {VENDOR_SCOPE_ROWS.map((row) => (
                <article
                  key={row.id}
                  id={row.id}
                  className={cn(
                    "scroll-mt-24 grid grid-cols-1 gap-5 px-6 py-6 lg:grid-cols-[1.05fr_1.7fr_1.45fr_0.95fr] lg:gap-6",
                    row.highlight && "bg-surface/75",
                  )}
                >
                  <div>
                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-medium text-foreground">
                          {row.name}
                        </h3>
                        {row.highlight && (
                          <span className="bg-background px-2 py-0.5 font-mono text-xs font-medium text-cyan">
                            This protocol
                          </span>
                        )}
                      </div>
                      <a
                        href={`#${row.id}`}
                        className="inline-flex min-h-11 w-fit items-center font-mono text-xs text-muted transition-colors duration-150 hover:text-cyan motion-reduce:transition-none"
                      >
                        #{row.id}
                      </a>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {row.modality}
                    </p>
                    <p className="mt-2 font-mono text-xs text-muted">
                      Checked {row.checked}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted lg:hidden">
                      Documented scope
                    </p>
                    <p className="max-w-[34rem] text-sm leading-relaxed text-foreground/85">
                      {row.scope}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-muted lg:hidden">
                      Limits and comparison boundary
                    </p>
                    <p className="max-w-[30rem] text-sm leading-relaxed text-foreground/85">
                      {row.boundary}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-muted lg:hidden">
                      Primary sources
                    </p>
                    <ul className="flex flex-col gap-2">
                      {row.sources.map((source) => (
                        <li key={source.href}>
                          <SourceLink source={source} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integration explainers */}
      <section id="explainers" className="scroll-mt-24">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              How Entros fits inside an application policy
              <span className="text-cyan">.</span>
            </h2>
            <p className="mt-4 max-w-[65ch] text-base leading-relaxed text-muted">
              Four architectural boundaries that govern how consuming apps read,
              reuse, and enforce behavioral evidence.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
            {COMPARISON_EXPLAINERS.map((item) => (
              <article
                key={item.id}
                id={item.id}
                className="scroll-mt-24 flex flex-col justify-between bg-surface p-6 forced-colors:border forced-colors:border-[CanvasText] md:p-8"
              >
                <div>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                    <h3 className="font-display text-xl font-normal tracking-tight text-foreground md:text-2xl">
                      {item.title}
                      <span className="text-cyan">.</span>
                    </h3>
                    <a
                      href={`#${item.id}`}
                      className="inline-flex min-h-11 w-fit shrink-0 items-center font-mono text-xs text-muted transition-colors duration-150 hover:text-cyan motion-reduce:transition-none"
                    >
                      #{item.id}
                    </a>
                  </div>
                  <div className="mt-3 max-w-[30rem] space-y-3 text-sm leading-relaxed text-foreground/80">
                    {item.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                {item.link && (
                  <div className="mt-6">
                    <Link
                      href={item.link.href}
                      className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:text-cyan hover:decoration-cyan motion-reduce:transition-none"
                    >
                      <span>{item.link.label}</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section>
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.06]">
            Combine behavioral evidence with your policy
            <span className="text-cyan">.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[60ch] text-base leading-relaxed text-muted">
            Read the Integrator Policy v1 reference or run a devnet verification
            in your browser.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/docs/integrate/verification-flow"
              className={primaryButtonClass}
            >
              <span className="[text-box:trim-both_cap_alphabetic]">
                Read policy docs
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
            <Link href="/verify" className={secondaryButtonClass}>
              <span className="[text-box:trim-both_cap_alphabetic]">
                Try the devnet demo
              </span>
              <ArrowRight className={buttonArrowClass} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
