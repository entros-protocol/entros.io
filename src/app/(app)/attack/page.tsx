import { AttackArenaClient } from "@/components/sections/attack-arena-client";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Red Team Attack Arena",
  description:
    "Public threat-model illustrations for the Entros validation boundary, without operational detector thresholds.",
  path: "/attack",
});

export default function AttackArenaPage() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-10 md:pt-40 md:pb-12">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // RED TEAM ARENA
          </span>

          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Red team arena<span className="text-cyan">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-foreground/65 md:mt-8 md:text-lg">
            Explore the classes of evidence Entros examines during adversarial
            testing. Operational detector policy stays private.
          </p>
        </div>
      </section>

      <AttackArenaClient />
    </>
  );
}
