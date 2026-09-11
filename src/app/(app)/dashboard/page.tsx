import { DashboardAnchorView } from "@/components/sections/dashboard-anchor-view";
import { DashboardHistory } from "@/components/sections/dashboard-history";
import { DashboardAgents } from "@/components/sections/dashboard-agents";
import { pageMetadata } from "@/lib/page-metadata";

export const metadata = pageMetadata({
  title: "Dashboard",
  description:
    "Your Entros Anchor details, Trust Score, verification history, and the agents registered to your wallet.",
  path: "/dashboard",
});

export default function Dashboard() {
  return (
    <>
      <section>
        <div className="mx-auto max-w-7xl px-6 pt-32 pb-12 md:pt-40 md:pb-16">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
            // DASHBOARD
          </span>

          <h1 className="mt-6 font-display text-5xl font-medium leading-[1.02] tracking-[-0.02em] text-foreground md:text-6xl lg:text-7xl">
            Your Entros Anchor<span className="text-cyan">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-foreground/65 md:mt-8 md:text-lg">
            Trust Score, verification history, and the agents registered to
            your wallet.
          </p>
        </div>
      </section>

      <DashboardAnchorView />
      <DashboardHistory />
      <DashboardAgents />
    </>
  );
}
