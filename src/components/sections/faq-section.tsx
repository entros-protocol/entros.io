"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

const FAQS: { q: string; a: string }[] = [
  {
    q: "What data leaves my device?",
    a: "A 134-dimensional statistical feature summary (means, variances, spectral coefficients) and a ZK proof. Raw sensor recordings (audio, motion, touch) are destroyed on-device after feature extraction. The statistical summary cannot reconstruct the original signals.",
  },
  {
    q: "How accurate is the verification?",
    a: "The system uses SimHash fingerprinting with Hamming distance comparison to measure behavioral consistency across sessions. Accuracy improves with each re-verification as the protocol builds a temporal profile. Server-side validation models add a second layer of detection.",
  },
  {
    q: "Which browsers and devices work?",
    a: "Any modern browser with microphone and motion sensor access. Chrome, Firefox, and Safari on both desktop and mobile. iOS Safari requires user permission for motion sensors. No app download required.",
  },
  {
    q: "How long does verification take?",
    a: "The active capture is 12 seconds. Proof generation and on-chain submission add a few seconds. Total time is under 30 seconds.",
  },
  {
    q: "What is Trust Score?",
    a: "A number that grows with consistent re-verification over time. It rewards regular verification across different days, not repeated verifications in a single session. Higher Trust Scores signal stronger identity confidence to integrators.",
  },
  {
    q: "How much does verification cost?",
    a: "~0.005 SOL per verification, paid by the user. Integrators read on-chain verification status for free.",
  },
];

/**
 * FAQSection — single-open accordion for the /technology page.
 *
 * Animation: CSS grid-rows trick (0fr → 1fr) — no JS measurement,
 * GPU-composited. Opacity cross-fade added on the answer for polish.
 *
 * Accessibility: button → aria-expanded + aria-controls; panel → id +
 * aria-labelledby. No role="region" (would pollute the landmark tree).
 *
 * Layout: left-border is always present but transparent when closed,
 * switching to border-cyan when open — avoids the 2px horizontal
 * layout shift that toggling border-l-2 on/off causes.
 *
 * Typography:
 *   Questions — font-mono, uppercase, tracking-[0.2em] (matches other sections).
 *   Answers   — body text, relaxed leading.
 */
export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) =>
    setOpenIndex((prev) => (prev === idx ? null : idx));

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        {/* Section label — matches // SECURITY MODEL / // RESEARCH VALIDATION */}
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/40">
          // FAQ
        </span>

        <h2 className="mt-6 max-w-2xl font-display text-3xl font-medium tracking-tight text-foreground md:text-5xl md:leading-[1.05]">
          Common questions<span className="text-cyan">.</span>
        </h2>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/65 md:text-lg">
          Technical details about the verification pipeline, privacy model,
          and protocol economics.
        </p>

        {/* Accordion list */}
        <div className="mt-16 border-t border-border">
          {FAQS.map((item, idx) => {
            const isOpen = openIndex === idx;
            const panelId = `faq-panel-${idx}`;
            const triggerId = `faq-trigger-${idx}`;

            return (
              <div
                key={item.q}
                className={[
                  "border-b border-border border-l-2 pl-5 transition-colors duration-300",
                  isOpen ? "border-l-cyan" : "border-l-transparent",
                ].join(" ")}
              >
                <button
                  id={triggerId}
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span
                    className={[
                      "font-mono text-xs uppercase tracking-[0.2em] transition-colors duration-200",
                      isOpen ? "text-cyan" : "text-foreground/80",
                    ].join(" ")}
                  >
                    {item.q}
                  </span>

                  {/* Rotates 45° on open → forms an × without a DOM swap */}
                  <span
                    aria-hidden="true"
                    className={[
                      "shrink-0 transition-[color,transform] duration-300",
                      isOpen ? "rotate-45 text-cyan" : "rotate-0 text-foreground/40",
                    ].join(" ")}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </button>

                {/*
                 * grid-rows-[0fr] collapses the row to zero height.
                 * grid-rows-[1fr] expands to natural height.
                 * Inner div: min-h-0 + overflow-hidden required for the
                 * trick to work — without them the content leaks out.
                 */}
                <div
                  id={panelId}
                  aria-labelledby={triggerId}
                  className={[
                    "grid transition-[grid-template-rows] duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  ].join(" ")}
                >
                  <div className="min-h-0 overflow-hidden">
                    <p
                      className={[
                        "pb-7 text-sm leading-relaxed text-foreground/60 transition-opacity duration-300 md:text-base md:leading-relaxed",
                        isOpen ? "opacity-100" : "opacity-0",
                      ].join(" ")}
                    >
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
