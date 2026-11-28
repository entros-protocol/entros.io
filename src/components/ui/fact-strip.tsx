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
    <dl className="mt-16 grid grid-cols-2 gap-3 md:mt-20 lg:grid-cols-4">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="bg-surface px-6 py-6 forced-colors:border forced-colors:border-[CanvasText] md:py-7"
        >
          <dt className="text-sm text-muted">{fact.label}</dt>
          <dd className="mt-2 font-display text-base tracking-tight text-foreground md:text-lg">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
