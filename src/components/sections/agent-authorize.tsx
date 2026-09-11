"use client";

import { useMemo, useSyncExternalStore, type ReactNode } from "react";
import { AgentBindingReview } from "@/components/sections/agent-binding-review";
import { AgentPermitReview } from "@/components/sections/agent-permit-review";
import { readAuthorizeFragment } from "@/lib/agent-permit-authorize";

// The fragment carries public request data, never a credential, so the page reads it in place
// and follows later changes to it.
function subscribe(notify: () => void) {
  window.addEventListener("hashchange", notify);
  return () => window.removeEventListener("hashchange", notify);
}
const readHash = () => window.location.hash;
const readServerHash = () => "";

const COPY = {
  request: {
    title: "Your agent asks for a permit",
    body: "Check the action below. If you asked your agent for it, sign with the wallet that owns the agent. The app checks your signature, your Entros verification and the agent's key before it runs the action.",
  },
  bind: {
    title: "Bind your agent's key",
    body: "Your agent asks to record its own key in the Solana Agent Registry as its agent wallet. Permits need this once, and again after the agent changes hands. Send the transaction from the wallet that owns the agent.",
  },
  invalid: {
    title: "This link is incomplete",
    body: "The link your agent sent is damaged or cut short. Ask your agent for a new one.",
  },
} as const;

/** Shows the signing section when the page opens from an agent's link, and `children` otherwise. */
export function AgentAuthorize({ children }: { children: ReactNode }) {
  const hash = useSyncExternalStore(subscribe, readHash, readServerHash);
  const fragment = useMemo(() => readAuthorizeFragment(hash), [hash]);
  if (fragment.kind === "none") return children;
  const copy = COPY[fragment.kind];

  return (
    <section>
      <div className="mx-auto max-w-3xl px-6 pt-32 pb-24 md:pt-40 md:pb-32">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // AGENT OPERATOR PERMIT
        </span>
        <h1 className="mt-6 font-display text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-foreground md:text-5xl">
          {copy.title}
          <span className="text-cyan">.</span>
        </h1>
        <p className="mt-6 text-base leading-relaxed text-foreground/65 md:text-lg">{copy.body}</p>
        {fragment.kind === "request" && (
          <div className="mt-12">
            <AgentPermitReview request={fragment.request} message={fragment.message} />
          </div>
        )}
        {fragment.kind === "bind" && (
          <div className="mt-12">
            <AgentBindingReview binding={fragment.binding} />
          </div>
        )}
      </div>
    </section>
  );
}
