import { generateStatusCardAltText } from "./alt-text";
import {
  validateStatusCardData,
  type StatusCardData,
} from "./provenance";
import { TemplateFrame } from "./template-frame";
import {
  VISUAL_THEME_PALETTES,
  type VisualTheme,
  type WholePixelMarkSize,
} from "./tokens";

export const DEFAULT_STATUS_CARD_DATA: StatusCardData = {
  kind: "status-card",
  title: "Live Solana devnet capabilities versus open mainnet gates",
  subtitle:
    "Public status separates deployed devnet verification contracts from open ceremony, audit, custody, population, and mainnet milestones.",
  liveHeading: "Live on Solana devnet",
  roadmapHeading: "Open gates (not live)",
  liveItems: [
    {
      label: "Three-round paired browser verification",
      detail:
        "Server-gated speech and trace rounds with wallet-signed session authorization and enforced v2 audio screening.",
      tag: "Devnet live",
    },
    {
      label: "Entros Anchor and free SAS reads",
      detail:
        "Non-transferable Token-2022 Anchor and Solana Attestation Service records readable in one free RPC batch.",
      tag: "Devnet live",
    },
    {
      label: "Integrator Policy v1",
      detail:
        "Versioned server evaluation checking score floor, verification age, assurance tier, and attestation on devnet (0 SOL warm reuse staged on develop).",
      tag: "Devnet live",
    },
    {
      label: "Agent Operator Permits and Realms plugin",
      detail:
        "Single-use owner permits bound to Metaplex Core ownership and action-bound Realms voter-weight checks.",
      tag: "Devnet live",
    },
  ],
  roadmapItems: [
    {
      label: "Multi-party Phase 2 trusted-setup ceremony",
      detail:
        "Replaces the single-contributor devnet proving key before mainnet deployment.",
      tag: "Pre-mainnet gate",
    },
    {
      label: "Independent external security audit",
      detail:
        "External review scoped to the Anchor programs and the Groth16 Circom circuit.",
      tag: "Pre-mainnet gate",
    },
    {
      label: "Production key custody and mainnet launch",
      detail:
        "Hardware upgrade authority, operational custody controls, and Solana mainnet program deployment.",
      tag: "Pre-mainnet gate",
    },
    {
      label: "Consented population uniqueness study",
      detail:
        "Labelled human cohort to measure population uniqueness, ROC/EER, and deployment FRR/FAR.",
      tag: "Open research gate",
    },
    {
      label: "Native hardware attestation and post-launch adapters",
      detail:
        "Stronger mobile app attestation tiers, MCP human-approval tooling, and cross-chain read adapters.",
      tag: "Post-launch roadmap",
    },
  ],
  tokenNote:
    "$ENTROS is a standard SPL token with no live on-chain coupling to verification today. Devnet SOL fees are test activity, not protocol revenue.",
  provenance: {
    subject: "Current Solana devnet posture versus open pre-mainnet and post-launch gates",
    sourceRecord: "Entros Claims Discipline Register and devnet program state",
    captureVersion: "paired-v2 / projection-1 / devnet programs",
    cluster: "Solana devnet",
    sampleDenominator: "4 live devnet surfaces paired with 5 open pre-mainnet and post-launch gates",
    recordedDate: "2026-11-19",
    limitsNote:
      "Research-grade on Solana devnet. Mainnet launch requires the Phase 2 ceremony, external audit, and custody gates to close.",
  },
};

export interface StatusCardTemplateProps {
  readonly data?: StatusCardData;
  readonly theme?: VisualTheme;
  readonly markSize?: WholePixelMarkSize;
  readonly showVisibleCaption?: boolean;
}

export function StatusCardTemplate({
  data = DEFAULT_STATUS_CARD_DATA,
  theme = "dark",
  markSize = 36,
  showVisibleCaption = false,
}: StatusCardTemplateProps) {
  const check = validateStatusCardData(data);
  if (!check.valid || !check.data) {
    throw new Error(`Invalid StatusCardTemplate data: ${check.errors.join("; ")}`);
  }

  const verified = check.data;
  const palette = VISUAL_THEME_PALETTES[theme];
  const altText = generateStatusCardAltText(verified);

  return (
    <TemplateFrame
      kind="status-card"
      categoryLabel="Mainnet path"
      title={verified.title}
      subtitle={verified.subtitle}
      provenance={verified.provenance}
      altText={altText}
      theme={theme}
      markSize={markSize}
      showVisibleCaption={showVisibleCaption}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Live column */}
          <section
            data-status-column="live"
            className="border p-4"
            style={{
              backgroundColor: palette.canvas,
              borderColor: palette.border,
              borderTopWidth: 3,
              borderTopColor: palette.greenFill,
              borderRadius: 0,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3
                className="font-display text-lg font-medium"
                style={{ color: palette.foreground }}
              >
                {verified.liveHeading}
              </h3>
              <span
                className="font-mono text-xs"
                style={{ color: palette.greenText }}
              >
                Present tense
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {verified.liveItems.map((item) => (
                <li
                  key={item.label}
                  className="border p-3"
                  style={{
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    borderRadius: 0,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: palette.foreground }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="font-mono text-xs"
                      style={{ color: palette.greenText }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-xs leading-relaxed"
                    style={{ color: palette.muted }}
                  >
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Roadmap / open gates column */}
          <section
            data-status-column="roadmap"
            className="border p-4"
            style={{
              backgroundColor: palette.canvas,
              borderColor: palette.border,
              borderTopWidth: 3,
              borderTopColor: palette.warningFill,
              borderRadius: 0,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3
                className="font-display text-lg font-medium"
                style={{ color: palette.foreground }}
              >
                {verified.roadmapHeading}
              </h3>
              <span
                className="font-mono text-xs"
                style={{ color: palette.warningText }}
              >
                Roadmap only
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {verified.roadmapItems.map((item) => (
                <li
                  key={item.label}
                  className="border p-3"
                  style={{
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    borderRadius: 0,
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className="text-sm font-medium"
                      style={{ color: palette.foreground }}
                    >
                      {item.label}
                    </span>
                    <span
                      className="font-mono text-xs"
                      style={{ color: palette.warningText }}
                    >
                      {item.tag}
                    </span>
                  </div>
                  <p
                    className="mt-1.5 text-xs leading-relaxed"
                    style={{ color: palette.muted }}
                  >
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p
          className="border p-3.5 text-xs leading-relaxed"
          style={{
            backgroundColor: palette.surfaceAlt,
            borderColor: palette.border,
            color: palette.muted,
            borderRadius: 0,
          }}
        >
          <strong style={{ color: palette.foreground }}>Token and fee posture: </strong>
          {verified.tokenNote}
        </p>
      </div>
    </TemplateFrame>
  );
}
