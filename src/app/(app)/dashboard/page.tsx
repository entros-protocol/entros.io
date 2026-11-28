import { DashboardAnchorView } from "@/components/sections/dashboard-anchor-view";
import { DashboardHistory } from "@/components/sections/dashboard-history";
import { DashboardAgents } from "@/components/sections/dashboard-agents";
import { DevnetNotice } from "@/components/ui/devnet-notice";
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
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-8 md:pt-28 md:pb-10">
          <DevnetNotice className="mb-10" />

          <h1 className="font-display text-4xl font-normal leading-[1.04] tracking-[-0.02em] text-foreground md:text-5xl lg:text-6xl">
            Your Entros Anchor<span className="text-cyan">.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
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
