import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RoundRunner } from "@/components/lab/round-runner";
import { prototypeEnabled } from "@/lib/server/paired-round-proxy";

export const metadata: Metadata = {
  title: "Paired-round prototype",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function PairedRoundPage() {
  if (!prototypeEnabled()) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-28 pb-20 md:pt-36">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        // RESEARCH PROTOTYPE
      </p>
      <h1 className="mt-4 text-balance font-mono text-3xl text-foreground sm:text-4xl">
        One word, one shape, one round at a time.
      </h1>
      <p className="mt-4 max-w-prose text-sm text-muted">
        Entros is testing whether answering a challenge a round at a time is comfortable to
        use. The server shows the next round only after it accepts your answer to the current
        one. You are here because someone gave you a code.
      </p>
      <div className="mt-10">
        <RoundRunner />
      </div>
    </main>
  );
}
