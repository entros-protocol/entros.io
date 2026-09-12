import { Bot, ShieldCheck } from "lucide-react";
import { agentPermitProperties } from "@/data/agent-permit";

/** Owner-to-agent permit diagram on the matte panel the site's diagrams share. */
export function AgentPermitDiagram() {
  return (
    <div className="relative rounded-2xl bg-foreground/[0.06] p-8 md:p-12">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">
          // AGENT PERMIT
        </p>
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-solana-green/60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-solana-green" />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/40">Devnet</span>
        </div>
      </div>

      {/* The label sits above the diagram, because the connector is only as wide as the gap
          between the nodes and would overflow both circles on a narrow card. */}
      <p className="mt-10 text-center font-mono text-[11px] tracking-[0.15em] text-cyan">
        signed permit
      </p>

      <div className="mt-6 flex items-center px-2">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
          <span className="absolute inset-0 animate-ripple rounded-full border border-cyan/35" aria-hidden />
          <span className="absolute inset-0 animate-ripple rounded-full border border-cyan/35 [animation-delay:1.8s]" aria-hidden />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-cyan/50 bg-cyan/[0.04]">
            <ShieldCheck className="h-5 w-5 text-cyan" strokeWidth={1.5} />
          </div>
        </div>

        <div className="relative mx-3 flex-1">
          <div className="relative h-px bg-gradient-to-r from-cyan/15 via-cyan/55 to-cyan/15">
            <span className="absolute left-[20%] top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/60" aria-hidden />
            <span className="absolute left-1/2 top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_8px_rgba(34,211,230,0.6)]" aria-hidden />
            <span className="absolute left-[80%] top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan/60" aria-hidden />
          </div>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[1px] text-cyan">
            <svg width="6" height="6" viewBox="0 0 6 6" fill="none" aria-hidden>
              <path d="M0 0L6 3L0 6V0Z" fill="currentColor" />
            </svg>
          </span>
        </div>

        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
          <span className="absolute inset-0 animate-ripple rounded-full border border-foreground/25 [animation-delay:0.9s]" aria-hidden />
          <span className="absolute inset-0 animate-ripple rounded-full border border-foreground/25 [animation-delay:2.7s]" aria-hidden />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-foreground/30 bg-foreground/[0.03]">
            <Bot className="h-5 w-5 text-foreground/60" strokeWidth={1.5} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between px-2">
        <span className="w-16 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-cyan/80 sm:w-20">Owner</span>
        <span className="w-16 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55 sm:w-20">Agent</span>
      </div>

      {/* Three columns leave a phone about 70px per label, so the strip stacks below `sm`. */}
      <div className="mt-12 grid grid-cols-1 border-t border-border sm:grid-cols-3">
        {agentPermitProperties.map((label, index) => (
          <div
            key={label}
            className={`flex items-center justify-center gap-2 px-2 py-4 sm:py-5 ${
              index > 0 ? "border-t border-border sm:border-l sm:border-t-0" : ""
            }`}
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-cyan" aria-hidden />
            <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/55">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
