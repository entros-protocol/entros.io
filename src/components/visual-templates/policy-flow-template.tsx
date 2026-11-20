import { generatePolicyFlowAltText } from "./alt-text";
import {
  validatePolicyFlowData,
  type PolicyFlowData,
} from "./provenance";
import { TemplateFrame } from "./template-frame";
import {
  VISUAL_THEME_PALETTES,
  type VisualTheme,
  type WholePixelMarkSize,
} from "./tokens";

export const DEFAULT_POLICY_FLOW_DATA: PolicyFlowData = {
  kind: "policy-flow",
  title: "Integrator Policy v1 decision flow",
  subtitle:
    "Applications reuse existing devnet evidence at 0 SOL when it meets policy, or step up to three paired capture rounds before settlement.",
  policyRules: [
    "version: 1",
    "minTrustScore >= 100",
    "maxVerificationAgeSeconds: 86400",
    "requiredAssurance: browser_unattested",
    "uniquenessRequirement: allow_unmeasured",
    "cluster: devnet",
  ],
  branches: [
    {
      id: "warm-reuse",
      label: "Warm reuse path",
      costLabel: "0 SOL / 0 rounds",
      steps: [
        "Popup checks existing IdentityState and SAS attestation on trusted RPC",
        "Evidence satisfies minTrustScore and maxVerificationAgeSeconds",
        "Returns warm verification envelope without opening capture sensors",
      ],
      timestampRule:
        "Preserves original verifiedAt from chain state. Renewal never resets evidence age.",
    },
    {
      id: "paired-step-up",
      label: "Step-up capture path",
      costLabel: "~0.005 SOL / 3 rounds",
      steps: [
        "Missing, stale, or below-floor evidence triggers three paired speech-and-trace rounds",
        "Browser extracts 308 features and generates a 256-byte Groth16 proof on the device",
        "Wallet submits validator receipt and proof to update IdentityState on devnet",
      ],
      timestampRule:
        "Records a new on-chain verifiedAt timestamp only after validation and settlement succeed.",
    },
  ],
  serverSteps: [
    "Consuming server calls readIntegratorEvidence on trusted Solana devnet RPC",
    "Consuming server runs evaluatePolicy against its own configured policy object",
    "Protected action rechecks policy and consumes one-use action nonce at settlement",
  ],
  settlementOutcomes: [
    "allow (accepted)",
    "deny (stale / below floor / invalid)",
    "unavailable (RPC fault)",
  ],
  provenance: {
    subject: "Integrator Policy v1 warm reuse and step-up flow",
    sourceRecord: "@entros/verify policy.ts and warm-policy.ts (develop)",
    captureVersion: "integrator-policy-v1 / paired-v2",
    cluster: "Solana devnet",
    sampleDenominator: "Protocol contract specification (no population sample)",
    recordedDate: "2026-11-19",
    limitsNote:
      "Runs on Solana devnet under browser_unattested assurance without trusted sensor provenance. Warm 0 SOL reuse sits on develop pending release. Population uniqueness remains unmeasured.",
  },
};

export interface PolicyFlowTemplateProps {
  readonly data?: PolicyFlowData;
  readonly theme?: VisualTheme;
  readonly markSize?: WholePixelMarkSize;
  readonly showVisibleCaption?: boolean;
}

export function PolicyFlowTemplate({
  data = DEFAULT_POLICY_FLOW_DATA,
  theme = "dark",
  markSize = 36,
  showVisibleCaption = false,
}: PolicyFlowTemplateProps) {
  const check = validatePolicyFlowData(data);
  if (!check.valid || !check.data) {
    throw new Error(`Invalid PolicyFlowTemplate data: ${check.errors.join("; ")}`);
  }

  const verified = check.data;
  const palette = VISUAL_THEME_PALETTES[theme];
  const altText = generatePolicyFlowAltText(verified);
  const [warmBranch, stepUpBranch] = verified.branches;

  return (
    <TemplateFrame
      kind="policy-flow"
      categoryLabel="Application policy"
      title={verified.title}
      subtitle={verified.subtitle}
      provenance={verified.provenance}
      altText={altText}
      theme={theme}
      markSize={markSize}
      showVisibleCaption={showVisibleCaption}
    >
      <div className="space-y-4">
        {/* Stage 01: Policy request contract */}
        <div
          className="border p-4"
          style={{
            backgroundColor: palette.canvas,
            borderColor: palette.border,
            borderRadius: 0,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="font-mono text-xs uppercase tracking-[0.1em]"
              style={{ color: palette.accentText }}
            >
              01 Application policy contract
            </span>
            <span className="font-mono text-xs" style={{ color: palette.muted }}>
              Declared before wallet capture
            </span>
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {verified.policyRules.map((rule) => (
              <li
                key={rule}
                className="border px-3 py-1.5 font-mono text-xs"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  color: palette.foreground,
                  borderRadius: 0,
                }}
              >
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* Stage 02: Two decision branches */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[warmBranch, stepUpBranch].map((branch, index) => {
            const isWarm = branch.id === "warm-reuse";
            const accentStroke = isWarm ? palette.greenFill : palette.accentFill;
            const accentInk = isWarm ? palette.greenText : palette.accentText;
            return (
              <div
                key={branch.id}
                className="flex flex-col justify-between border p-4"
                style={{
                  backgroundColor: palette.surfaceAlt,
                  borderColor: palette.border,
                  borderLeftWidth: 3,
                  borderLeftColor: accentStroke,
                  borderRadius: 0,
                }}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="font-mono text-xs uppercase tracking-[0.08em]"
                      style={{ color: accentInk }}
                    >
                      {index === 0 ? "02A" : "02B"} {branch.label}
                    </span>
                    <span
                      className="border px-2 py-0.5 font-mono text-xs"
                      style={{
                        backgroundColor: palette.canvas,
                        borderColor: palette.border,
                        color: accentInk,
                        borderRadius: 0,
                      }}
                    >
                      {branch.costLabel}
                    </span>
                  </div>

                  <ol className="mt-3 space-y-2 text-sm leading-relaxed">
                    {branch.steps.map((step, stepIndex) => (
                      <li key={step} className="flex gap-2.5">
                        <span
                          className="shrink-0 font-mono text-xs leading-6"
                          style={{ color: palette.muted }}
                        >
                          {stepIndex + 1}.
                        </span>
                        <span style={{ color: palette.foreground }}>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <p
                  className="mt-4 border-t pt-3 text-xs leading-relaxed"
                  style={{
                    borderColor: palette.border,
                    color: palette.muted,
                  }}
                >
                  {branch.timestampRule}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stage 03: Server settlement recheck */}
        <div
          className="border p-4"
          style={{
            backgroundColor: palette.canvas,
            borderColor: palette.borderStrong,
            borderRadius: 0,
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="font-mono text-xs uppercase tracking-[0.1em]"
              style={{ color: palette.accentText }}
            >
              03 Server verification and settlement recheck
            </span>
            <span className="font-mono text-xs" style={{ color: palette.muted }}>
              Never trust client envelope alone
            </span>
          </div>

          <ol className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {verified.serverSteps.map((step, index) => (
              <li
                key={step}
                className="border p-3 text-xs leading-relaxed"
                style={{
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                  color: palette.foreground,
                  borderRadius: 0,
                }}
              >
                <span
                  className="block font-mono text-[11px] uppercase tracking-[0.08em]"
                  style={{ color: palette.accentText }}
                >
                  Check {index + 1}
                </span>
                <span className="mt-1 block">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-3 flex flex-wrap gap-2">
            {verified.settlementOutcomes.map((outcome) => (
              <span
                key={outcome}
                className="border px-2.5 py-1 font-mono text-xs"
                style={{
                  backgroundColor: palette.surfaceAlt,
                  borderColor: palette.border,
                  color: palette.foreground,
                  borderRadius: 0,
                }}
              >
                {outcome}
              </span>
            ))}
          </div>
        </div>
      </div>
    </TemplateFrame>
  );
}
