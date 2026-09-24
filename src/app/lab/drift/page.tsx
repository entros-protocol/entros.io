import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DriftRunner } from "@/components/lab/drift-runner";
import { prototypeEnabled } from "@/lib/server/paired-round-proxy";

export const metadata: Metadata = {
  title: "Capture drift measurement",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function CaptureDriftPage() {
  if (!prototypeEnabled()) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pt-28 pb-20 md:pt-36">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        // INTERNAL MEASUREMENT
      </p>
      <h1 className="mt-4 text-balance font-mono text-3xl text-foreground sm:text-4xl">
        How far does a segmented capture move the fingerprint?
      </h1>
      <p className="mt-4 max-w-prose text-sm text-muted">
        Three captures from one person on one device. The current style twice, then the paired
        style once. The repeat sets the drift a normal second capture produces, and the paired
        capture is read against it. Nothing is submitted and no proof is generated. Audio,
        motion and touch stay in this browser. The export holds derived feature vectors only.
      </p>
      <div className="mt-10">
        <DriftRunner />
      </div>
    </main>
  );
}
