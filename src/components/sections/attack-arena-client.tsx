"use client";

import { useState } from "react";
import { Bot, Check, Mic, Repeat2, Shield } from "lucide-react";

const scenarios = [
  {
    id: "automation",
    name: "Automated browser",
    description:
      "A scripted client drives the public capture flow and submits a complete request.",
    Icon: Bot,
    review: [
      "Client-integrity evidence",
      "Challenge completion",
      "Private validation policy",
      "On-chain state transition",
    ],
  },
  {
    id: "recording",
    name: "Recorded media",
    description:
      "A client replays prepared voice or motion evidence against a fresh challenge.",
    Icon: Mic,
    review: [
      "Challenge binding",
      "Capture timing",
      "Acoustic evidence",
      "Replay constraints",
    ],
  },
  {
    id: "reuse",
    name: "Cross-wallet reuse",
    description:
      "Related evidence appears across more than one wallet during repeated verification.",
    Icon: Repeat2,
    review: [
      "Fingerprint comparison",
      "Wallet history",
      "Attempt controls",
      "Research telemetry",
    ],
  },
] as const;

export function AttackArenaClient() {
  const [selectedId, setSelectedId] = useState<(typeof scenarios)[number]["id"]>(
    "automation",
  );
  const selected =
    scenarios.find((scenario) => scenario.id === selectedId) ?? scenarios[0];

  return (
    <div className="mx-auto max-w-7xl px-6 pb-24 md:pb-32">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="border border-border bg-surface p-6 md:p-8 lg:col-span-5">
          <h2 className="font-display text-xl font-medium text-foreground">
            Threat-model scenarios
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/55">
            Select a scenario to see which boundaries the protocol examines.
            This page publishes no detector weights, thresholds, or verdict
            simulation.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {scenarios.map(({ id, name, description, Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => setSelectedId(id)}
                className={`border p-4 text-left transition-colors ${
                  selectedId === id
                    ? "border-cyan/50 bg-cyan/[0.03]"
                    : "border-border hover:border-foreground/30"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-cyan" />
                  <strong className="font-display text-sm font-medium text-foreground">
                    {name}
                  </strong>
                </span>
                <span className="mt-2 block text-xs leading-relaxed text-foreground/50">
                  {description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col border border-border bg-surface p-6 md:p-8 lg:col-span-7">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/40">
            // Non-operational illustration
          </span>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan/25 bg-cyan/5 text-cyan">
              <selected.Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-medium text-foreground">
                {selected.name}
              </h3>
              <p className="mt-1 text-sm text-foreground/50">
                Reviewed across several independent boundaries
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2">
            {selected.review.map((boundary) => (
              <div
                key={boundary}
                className="flex items-center gap-3 bg-background p-5"
              >
                <Check className="h-4 w-4 text-cyan" />
                <span className="text-sm text-foreground/70">{boundary}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-3 border-t border-border pt-6">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
            <p className="text-sm leading-relaxed text-foreground/55">
              The private validation service applies the current policy. The
              public red-team record reports aggregate outcomes after fixes,
              without publishing a bypass recipe or operational threshold.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
