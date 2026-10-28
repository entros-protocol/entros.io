interface Fact {
  label: string;
  value: string;
}

/**
 * A row of short facts closing a page hero. It bleeds to the page rails
 * like the site's other hairline grids, and the next section's top rule
 * closes it, so it needs no bottom border of its own.
 */
export function FactStrip({ facts }: { facts: Fact[] }) {
  return (
    <dl className="-mx-6 mt-20 grid grid-cols-2 gap-px border-t border-border bg-border md:mt-24 lg:grid-cols-4">
      {facts.map((fact) => (
        <div key={fact.label} className="bg-background px-6 py-6 md:py-7">
          <dt className="text-sm text-foreground/60">{fact.label}</dt>
          <dd className="mt-2 font-display text-base tracking-tight text-foreground md:text-lg">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
