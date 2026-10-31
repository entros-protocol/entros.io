"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const TARGET = "Entros";
const HASH_CHARS = "0123456789abcdef";

function randomChar() {
  return HASH_CHARS[Math.floor(Math.random() * HASH_CHARS.length)];
}

/**
 * Wordmark with a one-shot hash-shuffle reveal. Plays the first time
 * the navbar lands on the home route; on every other route the display
 * derives back to the canonical target. The animation can no longer
 * get stranded mid-decrypt: cleanup clears the interval on any path
 * change, and the rendered string is computed from pathname rather
 * than imperatively reset.
 *
 * The reveal counts as played once it finishes, not when it starts. In
 * development React's Strict Mode runs each new effect, cleans it up and
 * runs it again, so a flag set when the reveal starts would skip it there.
 */
export function NavbarWordmark() {
  const pathname = usePathname();
  const [animFrame, setAnimFrame] = useState<string | null>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    if (pathname !== "/" || playedRef.current) return;

    const TOTAL_FRAMES = 36;
    const FRAME_MS = 38;
    const settleAt = (i: number) =>
      Math.floor((i + 1) * (TOTAL_FRAMES / TARGET.length));

    let frame = 0;
    const id = window.setInterval(() => {
      frame++;
      let next = "";
      for (let i = 0; i < TARGET.length; i++) {
        next += frame >= settleAt(i) ? TARGET[i] : randomChar();
      }
      setAnimFrame(next);
      if (frame >= TOTAL_FRAMES) {
        window.clearInterval(id);
        playedRef.current = true;
      }
    }, FRAME_MS);

    return () => window.clearInterval(id);
  }, [pathname]);

  const display = pathname === "/" && animFrame !== null ? animFrame : TARGET;

  return (
    <Link
      href="/"
      style={{
        fontFamily: "var(--font-wordmark), 'JetBrains Mono', ui-monospace, monospace",
      }}
      className="inline-flex items-baseline text-xl tracking-tight text-foreground"
      aria-label="Entros home"
    >
      <span aria-hidden>{display}</span>
      <span
        aria-hidden
        className="ml-1 inline-block size-[4px] bg-cyan"
      />
    </Link>
  );
}
