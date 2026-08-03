const disclosureItems = [
  { label: "Contact", value: "contact@entros.io", isEmail: true },
  {
    label: "Scope",
    value: "On-chain programs, SDK, executor, validation service, website",
  },
  {
    label: "Response SLA",
    value:
      "Acknowledgment within 48 hours, initial triage within 5 business days",
  },
  {
    label: "Safe harbor",
    value:
      "Good-faith research is welcome. We will not pursue legal action against researchers acting within the scope of this policy.",
  },
  {
    label: "Attribution",
    value:
      "Researchers credited in AUDIT.md and hall of fame upon fix deployment, unless anonymity requested.",
  },
  {
    label: "Bug bounty",
    value: "Planned post-mainnet. Severity tiers and amounts TBD.",
  },
];

/**
 * Responsible Disclosure—definition list pattern. Each row has a
 * label rail and a value column, with hairline dividers between rows.
 * Reads as a policy document, distinct from the grids and tables on
 * the rest of the page.
 */
export function ResponsibleDisclosure() {
  return (
    <section id="disclosure" className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // DISCLOSURE
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Reporting vulnerabilities<span className="text-cyan">.</span>
        </h2>

        <dl className="mt-16 border-t border-border">
          {disclosureItems.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-1 gap-x-12 gap-y-3 border-b border-border py-6 md:grid-cols-[12rem_1fr] md:py-8"
            >
              <dt className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
                {item.label}
              </dt>
              <dd className="text-base leading-relaxed text-foreground/75">
                {"isEmail" in item && item.isEmail ? (
                  <a
                    href={`mailto:${item.value}`}
                    className="text-cyan transition-colors hover:text-foreground"
                  >
                    {item.value}
                  </a>
                ) : (
                  item.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
