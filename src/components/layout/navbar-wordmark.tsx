import Link from "next/link";
import { EntrosMark } from "./entros-mark";

export function NavbarWordmark() {
  return (
    <Link
      href="/"
      style={{
        fontFamily: "var(--font-wordmark), 'JetBrains Mono', ui-monospace, monospace",
      }}
      className="inline-flex min-h-11 items-center text-xl tracking-tight text-foreground"
    >
      {/* 0.75em is 18 px at the navbar's type size, matching the mark's integer grid. */}
      <EntrosMark className="mr-1.5 size-[0.75em] shrink-0" />
      <span className="[text-box:trim-both_cap_alphabetic]">Entros</span>
      <span className="sr-only"> home</span>
    </Link>
  );
}
