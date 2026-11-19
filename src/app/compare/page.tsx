import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  COMPARISON_EXPLAINERS,
  COMPARISON_UPDATED,
  MODALITY_ROWS,
  POLICY_BOUNDARIES,
  REGULATORY_DESIGN_CONTEXT,
  VENDOR_SCOPE_ROWS,
  type PrimarySource,
} from "@/data/comparison";
import { pageMetadata } from "@/lib/page-metadata";
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
        className="inline-flex items-center gap-1 text-xs text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-cyan hover:decoration-cyan"
      >
        <span>{source.label}</span>
        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
      </a>
    );
  }
  return (
    <Link
      href={source.href}
      className="inline-flex items-center gap-1 text-xs text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-cyan hover:decoration-cyan"
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

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-foreground/75 md:mt-8 md:text-lg">
            Entros supplies optional complementary behavioral evidence within an
            application policy. Teams choose anatomical, credential, KYC, or
            behavioral inputs based on the risks each action carries.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border px-6 py-4 font-mono text-xs text-foreground/60">
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
              { href: "#context-anatomical-storage", label: "Design context" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="border border-border bg-surface px-3.5 py-2 text-xs font-medium text-foreground/80 transition-colors hover:border-cyan/50 hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </section>

      {/* Modality table */}
      <section id="modalities" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              Four modalities across Integrator Policy v1 primitives
              <span className="text-cyan">.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/70">
              Each row evaluates fresh result, continuity, uniqueness status,
              assurance tier, and limits in one table. Entros states its
              devnet, sensor provenance, and unmeasured population limits
              inside the same table.
            </p>
          </div>

          {/* Row anchor index */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-foreground/60">
              Row anchors:
            </span>
            {MODALITY_ROWS.map((row) => (
              <a
                key={row.id}
                href={`#${row.id}`}
                className="border border-border px-2.5 py-1 font-mono text-xs text-foreground/75 transition-colors hover:border-cyan/50 hover:text-cyan"
              >
                #{row.id}
              </a>
            ))}
          </div>

          {/* Desktop column headers */}
          <div className="mt-8 border-y border-border">
            <div
              aria-hidden="true"
              className="hidden border-b border-border bg-surface px-6 py-3.5 text-xs font-medium text-foreground/70 lg:grid lg:grid-cols-[1.05fr_1fr_1fr_1fr_1fr_1.35fr] lg:gap-6"
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
                    row.highlight && "border-l-2 border-l-cyan bg-surface/60",
                  )}
                >
                  <div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display text-lg font-medium text-foreground">
                        {row.name}
                      </h3>
                      <a
                        href={`#${row.id}`}
                        className="inline-block w-fit font-mono text-[11px] text-foreground/55 transition-colors hover:text-cyan"
                      >
                        #{row.id}
                      </a>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-foreground/65">
                      {row.examples}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-foreground/55 lg:hidden">
                      Fresh result
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {row.freshResult}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-foreground/55 lg:hidden">
                      Continuity
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {row.continuity}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-foreground/55 lg:hidden">
                      Uniqueness status
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {row.uniquenessStatus}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-foreground/55 lg:hidden">
                      Assurance tier
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {row.assuranceTier}
                    </p>
                  </div>

                  <div className="border-t border-border pt-4 lg:border-t-0 lg:border-l lg:border-border lg:pt-0 lg:pl-6">
                    <p className="mb-1 text-xs font-medium text-foreground/55 lg:hidden">
                      Limit
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/85">
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
        className="scroll-mt-24 border-t border-border"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              Keep five policy questions separate
              <span className="text-cyan">.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/70">
              No single verification modality answers all five questions.
              Evaluate each question on its own in server and on-chain checks.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5">
            {POLICY_BOUNDARIES.map((item, index) => (
              <div
                key={item.id}
                id={item.id}
                className={cn(
                  "scroll-mt-24 flex flex-col justify-between p-6",
                  index > 0 && "lg:border-l lg:border-border",
                  index % 2 === 1 && "sm:border-l sm:border-border lg:border-l",
                  index >= 2 && "sm:border-t sm:border-border lg:border-t-0",
                )}
              >
                <div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    {item.name}
                  </h3>
                  <p className="mt-2 font-mono text-xs text-cyan">
                    {item.question}
                  </p>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dated vendor scope */}
      <section id="vendors" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              Dated primary-source vendor scope
              <span className="text-cyan">.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/70">
              Each row cites public primary documentation on the recorded check
              date. Vendor capabilities change over time, so recheck the linked
              source before making architecture decisions. This page publishes
              no accuracy or EER ranking.
            </p>
          </div>

          {/* Vendor anchor index */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-foreground/60">
              Vendor anchors:
            </span>
            {VENDOR_SCOPE_ROWS.map((row) => (
              <a
                key={row.id}
                href={`#${row.id}`}
                className="border border-border px-2.5 py-1 font-mono text-xs text-foreground/75 transition-colors hover:border-cyan/50 hover:text-cyan"
              >
                #{row.id}
              </a>
            ))}
          </div>

          <div className="mt-8 border-y border-border">
            <div
              aria-hidden="true"
              className="hidden border-b border-border bg-surface px-6 py-3.5 text-xs font-medium text-foreground/70 lg:grid lg:grid-cols-[1.05fr_1.7fr_1.45fr_0.95fr] lg:gap-6"
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
                    row.highlight && "border-l-2 border-l-cyan bg-surface/60",
                  )}
                >
                  <div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-display text-lg font-medium text-foreground">
                        {row.name}
                      </h3>
                      <a
                        href={`#${row.id}`}
                        className="inline-block w-fit font-mono text-[11px] text-foreground/55 transition-colors hover:text-cyan"
                      >
                        #{row.id}
                      </a>
                    </div>
                    <p className="mt-2 text-xs text-foreground/70">
                      {row.modality}
                    </p>
                    <p className="mt-2 font-mono text-xs text-foreground/55">
                      Checked {row.checked}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-foreground/55 lg:hidden">
                      Documented scope
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {row.scope}
                    </p>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium text-foreground/55 lg:hidden">
                      Limits and comparison boundary
                    </p>
                    <p className="text-sm leading-relaxed text-foreground/80">
                      {row.boundary}
                    </p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium text-foreground/55 lg:hidden">
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
      <section id="explainers" className="scroll-mt-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              How Entros fits inside an application policy
              <span className="text-cyan">.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/70">
              Four architectural boundaries that govern how consuming apps read,
              reuse, and enforce behavioral evidence.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-2 md:divide-y-0">
            {COMPARISON_EXPLAINERS.map((item, index) => (
              <article
                key={item.id}
                id={item.id}
                className={cn(
                  "scroll-mt-24 flex flex-col justify-between p-6 md:p-8",
                  index % 2 === 1 && "md:border-l md:border-border",
                  index >= 2 && "md:border-t md:border-border",
                )}
              >
                <div>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                    <h3 className="font-display text-xl font-normal tracking-tight text-foreground md:text-2xl">
                      {item.title}
                      <span className="text-cyan">.</span>
                    </h3>
                    <a
                      href={`#${item.id}`}
                      className="w-fit shrink-0 font-mono text-[11px] text-foreground/50 transition-colors hover:text-cyan"
                    >
                      #{item.id}
                    </a>
                  </div>
                  <div className="mt-4 space-y-3 text-sm leading-relaxed text-foreground/75">
                    {item.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </div>

                {item.link && (
                  <div className="mt-6">
                    <Link
                      href={item.link.href}
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors hover:text-cyan hover:decoration-cyan"
                    >
                      <span>{item.link.label}</span>
                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
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

      {/* Structural design context (Spain AEPD GDPR Article 9) */}
      <section
        id={REGULATORY_DESIGN_CONTEXT.id}
        className="scroll-mt-24 border-t border-border"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="border border-border bg-surface p-6 md:p-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-normal tracking-tight text-foreground md:text-2xl">
                {REGULATORY_DESIGN_CONTEXT.title}
                <span className="text-cyan">.</span>
              </h2>
              <span className="font-mono text-xs text-foreground/55">
                Checked {REGULATORY_DESIGN_CONTEXT.checked}
              </span>
            </div>
            <p className="mt-4 max-w-4xl text-sm leading-relaxed text-foreground/80">
              {REGULATORY_DESIGN_CONTEXT.body}
            </p>
            <p className="mt-3 max-w-4xl text-xs leading-relaxed text-foreground/60">
              {REGULATORY_DESIGN_CONTEXT.disclaimer}
            </p>
            <div className="mt-4">
              <SourceLink source={REGULATORY_DESIGN_CONTEXT.source} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center md:py-32">
          <h2 className="font-display text-3xl font-normal tracking-tight text-foreground md:text-5xl md:leading-[1.06]">
            Combine behavioral evidence with your policy
            <span className="text-cyan">.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-foreground/70">
            Read the Integrator Policy v1 reference or run a devnet verification
            in your browser.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/docs/integrate/verification-flow"
              className="
                group inline-flex items-center justify-center gap-2
                bg-foreground px-6 py-3
                text-sm font-medium text-background
                transition-colors hover:bg-foreground/90
              "
            >
              Read policy docs
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/verify"
              className="
                group inline-flex items-center justify-center gap-2
                border border-foreground/20 px-6 py-3
                text-sm font-medium text-foreground
                transition-colors hover:border-foreground/40 hover:bg-foreground/5
              "
            >
              Try the devnet demo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
