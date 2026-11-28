import { generatePermitSequenceAltText } from "./alt-text";
import {
  validatePermitSequenceData,
  type PermitSequenceData,
} from "./provenance";
import { TemplateFrame } from "./template-frame";
import {
  VISUAL_THEME_PALETTES,
  type VisualTheme,
  type WholePixelMarkSize,
} from "./tokens";

export const DEFAULT_PERMIT_SEQUENCE_DATA: PermitSequenceData = {
  kind: "permit-sequence",
  title: "Agent Operator Permit settlement sequence",
  subtitle:
    "An agent pauses before a protected action until the owner signs a single-use permit checked against live Metaplex Core ownership at settlement.",
  maxLifetimeSeconds: 900,
  assuranceTier: "browser_unattested",
  steps: [
    {
      stepNumber: "01",
      actor: "Agent",
      title: "Pause before protected action",
      detail:
        "Agent halts execution and builds an Entros-Agent-Permit-v1 request for one consumer audience and action digest.",
      fields: ["Metaplex Core asset", "action SHA-256 digest", "integrator audience"],
    },
    {
      stepNumber: "02",
      actor: "Owner wallet",
      title: "Sign single-use AgentPermit",
      detail:
        "Owner wallet signs the human-readable notice binding the agent asset, action SHA-256, expiry <= 900 s, single-use nonce, and browser_unattested policy.",
      fields: ["expiresAt <= 900 s", "one-use nonce", "browser_unattested policy"],
    },
    {
      stepNumber: "03",
      actor: "Agent key",
      title: "Present bound permit",
      detail:
        "The bound agent wallet signs the presentation wrapper and submits the permit to the consuming application.",
      fields: ["bound agentWallet", "presentation signature", "prior wallet authorization"],
    },
    {
      stepNumber: "04",
      actor: "Consuming app",
      title: "Verify live state at settlement",
      detail:
        "Consumer calls readAgentState for live Metaplex Core asset ownership, runs readIntegratorEvidence and evaluatePolicy, and consumes the nonce once.",
      fields: ["live Core asset owner", "evaluatePolicy", "single-use nonce burn"],
    },
  ],
  authorizationBoundary:
    "An AgentPermit proves prior owner wallet authorization under browser_unattested assurance, not live human presence at execution time. Asset transfer invalidates prior permits.",
  provenance: {
    subject: "Agent Operator Permit v1 authorization and settlement sequence",
    sourceRecord: "@entros/verify agent-permit.ts (devnet run refused replay, copy, expiry, transfer)",
    captureVersion: "Entros-Agent-Permit-v1 / browser_unattested",
    cluster: "Solana devnet",
    sampleDenominator: "4 negative settlement classes refused on devnet (replay, copy, expiry, transfer)",
    recordedDate: "2026-11-19",
    limitsNote:
      "Confirms prior wallet authorization and current Metaplex Core ownership on devnet. Does not prove live human presence at execution or one human per agent set.",
  },
};

export interface PermitSequenceTemplateProps {
  readonly data?: PermitSequenceData;
  readonly theme?: VisualTheme;
  readonly markSize?: WholePixelMarkSize;
  readonly showVisibleCaption?: boolean;
}

export function PermitSequenceTemplate({
  data = DEFAULT_PERMIT_SEQUENCE_DATA,
  theme = "dark",
  markSize = 36,
  showVisibleCaption = false,
}: PermitSequenceTemplateProps) {
  const check = validatePermitSequenceData(data);
  if (!check.valid || !check.data) {
    throw new Error(
      `Invalid PermitSequenceTemplate data: ${check.errors.join("; ")}`,
    );
  }

  const verified = check.data;
  const palette = VISUAL_THEME_PALETTES[theme];
  const altText = generatePermitSequenceAltText(verified);

  return (
    <TemplateFrame
      kind="permit-sequence"
      categoryLabel="Agent permissions"
      title={verified.title}
      subtitle={verified.subtitle}
      provenance={verified.provenance}
      altText={altText}
      theme={theme}
      markSize={markSize}
      showVisibleCaption={showVisibleCaption}
    >
      <div className="space-y-4">
        {/* Bound limits strip */}
        <div
          className="flex flex-wrap items-center gap-3 border px-4 py-2.5 font-mono text-xs"
          style={{
            backgroundColor: palette.canvas,
            borderColor: palette.border,
            color: palette.foreground,
            borderRadius: 0,
          }}
        >
          <span style={{ color: palette.accentText }}>
            Max lifetime: &lt;= {verified.maxLifetimeSeconds} s
          </span>
          <span aria-hidden="true" style={{ color: palette.border }}>
            |
          </span>
          <span>Assurance: {verified.assuranceTier}</span>
          <span aria-hidden="true" style={{ color: palette.border }}>
            |
          </span>
          <span>Replay defense: single-use nonce + action SHA-256</span>
        </div>

        {/* Sequence grid */}
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {verified.steps.map((step, index) => {
            const isSettlement = index === verified.steps.length - 1;
            const accentStroke = isSettlement
              ? palette.greenFill
              : palette.accentFill;
            const accentText = isSettlement
              ? palette.greenText
              : palette.accentText;

            return (
              <li
                key={step.stepNumber}
                className="flex flex-col justify-between border p-4"
                style={{
                  backgroundColor: palette.canvas,
                  borderColor: isSettlement ? palette.borderStrong : palette.border,
                  borderTopWidth: 2,
                  borderTopColor: accentStroke,
                  borderRadius: 0,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="font-mono text-xs font-medium"
                      style={{ color: accentText }}
                    >
                      STEP {step.stepNumber}
                    </span>
                    <span
                      className="border px-2 py-0.5 font-mono text-[11px]"
                      style={{
                        backgroundColor: palette.surfaceAlt,
                        borderColor: palette.border,
                        color: palette.foreground,
                        borderRadius: 0,
                      }}
                    >
                      {step.actor}
                    </span>
                  </div>

                  <h3
                    className="mt-3 font-display text-base font-medium leading-snug"
                    style={{ color: palette.foreground }}
                  >
                    {step.title}
                  </h3>
                  <p
                    className="mt-2 text-xs leading-relaxed"
                    style={{ color: palette.muted }}
                  >
                    {step.detail}
                  </p>
                </div>

                <ul
                  className="mt-4 space-y-1.5 border-t pt-3"
                  style={{ borderColor: palette.border }}
                >
                  {step.fields.map((field) => (
                    <li
                      key={field}
                      className="font-mono text-[11px]"
                      style={{ color: palette.foreground }}
                    >
                      + {field}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>

        {/* Explicit authorization boundary callout */}
        <div
          className="border p-3.5 text-xs leading-relaxed"
          style={{
            backgroundColor: palette.surfaceAlt,
            borderColor: palette.border,
            color: palette.foreground,
            borderRadius: 0,
          }}
        >
          <span
            className="font-mono text-xs font-medium"
            style={{ color: palette.warningText }}
          >
            Authorization boundary:{" "}
          </span>
          <span>{verified.authorizationBoundary}</span>
        </div>
      </div>
    </TemplateFrame>
  );
}
