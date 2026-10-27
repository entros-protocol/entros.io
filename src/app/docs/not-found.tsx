import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-24">
      <h1 className="font-mono text-3xl font-normal text-foreground">
        That page isn&apos;t in the docs.
      </h1>
      <p className="text-foreground/70">
        The page moved, changed its name or never existed. Use the sidebar,
        or start from one of these pages.
      </p>
      <ul className="flex flex-col gap-2 font-mono text-sm">
        <li>
          <Link href="/docs" className="text-cyan hover:underline">
            /docs
          </Link>
          <span className="text-foreground/55">: the landing page</span>
        </li>
        <li>
          <Link
            href="/docs/quickstart/next-js"
            className="text-cyan hover:underline"
          >
            /docs/quickstart/next-js
          </Link>
          <span className="text-foreground/55">: gate a route in five lines</span>
        </li>
        <li>
          <Link href="/docs/reference/sdk" className="text-cyan hover:underline">
            /docs/reference/sdk
          </Link>
          <span className="text-foreground/55">: the full SDK API</span>
        </li>
        <li>
          <Link href="/docs/roadmap/current" className="text-cyan hover:underline">
            /docs/roadmap/current
          </Link>
          <span className="text-foreground/55">: what&apos;s live today</span>
        </li>
      </ul>
    </div>
  );
}
