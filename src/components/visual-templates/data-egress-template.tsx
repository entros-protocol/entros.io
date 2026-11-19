import { generateDataEgressAltText } from "./alt-text";
import {
  validateDataEgressData,
  type DataEgressData,
} from "./provenance";
import { TemplateFrame } from "./template-frame";
import {
  VISUAL_THEME_PALETTES,
  type VisualTheme,
  type WholePixelMarkSize,
} from "./tokens";

export const DEFAULT_DATA_EGRESS_DATA: DataEgressData = {
  kind: "data-egress",
  title: "Device data-egress boundaries",
  subtitle:
    "Raw motion and full-resolution touch remain local. Validation receives derived features and transient phrase PCM without disk audio storage.",
  zones: [
    {
      id: "on-device",
      heading: "1. Stays on device",
      retentionLabel: "Local memory and browser storage",
      items: [
        "Raw IMU motion samples (accelerometer and gyroscope streams)",
        "Full-resolution touch stream (dense points, pressure, and fine timing)",
        "Local extraction of the 308-value behavioral feature vector",
        "Client-side Groth16 zero-knowledge proof generation",
      ],
      boundaryNote:
        "Raw motion recordings and the full-resolution touch stream never cross the network.",
    },
    {
      id: "validation-transient",
      heading: "2. Validation request and transient memory",
      retentionLabel: "Spoken PCM discarded in RAM, redacted logs retain 30 days",
      items: [
        "Spoken phrase PCM segments (decoded in RAM for speech check, never written to storage)",
        "308 derived features (170 audio, 81 motion, 57 touch)",
        "F0 voice-pitch contour and acceleration-magnitude contour",
        "Coarse 64-point path outline (no pressure and no dense timing)",
        "Client signals, capture timing, wallet address, session digest, commitment, and wallet-signed authorization",
      ],
      boundaryNote:
        "Entros is not RAM-only. Keyed session hashes, abuse windows, and redacted service logs can persist per entros.io/privacy.",
    },
    {
      id: "solana-devnet",
      heading: "3. Public Solana devnet state",
      retentionLabel: "Public on-chain accounts",
      items: [
        "Poseidon(3) commitment to the behavioral fingerprint and private salt",
        "256-byte Groth16 proof verified on chain in under 200,000 compute units",
        "IdentityState PDA (Trust Score, verification count, timestamps)",
        "Non-transferable Token-2022 Entros Anchor and SAS attestation",
      ],
      boundaryNote:
        "Public chain state carries no raw audio, no motion samples, and no government ID.",
    },
  ],
  provenance: {
    subject: "Three-zone device data-egress and retention boundary",
    sourceRecord: "pulse-sdk/src/paired/client.ts buildFinalizeBody and entros.io/privacy",
    captureVersion: "paired-v2 / projection-1 / 308-feature vector",
    cluster: "Solana devnet",
    sampleDenominator: "Live request inventory (308 features: 170 audio, 81 motion, 57 touch)",
    recordedDate: "2026-11-19",
    limitsNote:
      "Browser validation runs without trusted sensor provenance. Derived evidence and transient phrase audio cross the network during verification.",
  },
};

export interface DataEgressTemplateProps {
  readonly data?: DataEgressData;
  readonly theme?: VisualTheme;
  readonly markSize?: WholePixelMarkSize;
  readonly showVisibleCaption?: boolean;
}

export function DataEgressTemplate({
  data = DEFAULT_DATA_EGRESS_DATA,
  theme = "dark",
  markSize = 36,
  showVisibleCaption = false,
}: DataEgressTemplateProps) {
  const check = validateDataEgressData(data);
  if (!check.valid || !check.data) {
    throw new Error(`Invalid DataEgressTemplate data: ${check.errors.join("; ")}`);
  }

  const verified = check.data;
  const palette = VISUAL_THEME_PALETTES[theme];
  const altText = generateDataEgressAltText(verified);

  const zoneAccent = (zoneId: DataEgressData["zones"][number]["id"]) => {
    switch (zoneId) {
      case "on-device":
        return { stroke: palette.greenFill, text: palette.greenText };
      case "validation-transient":
        return { stroke: palette.accentFill, text: palette.accentText };
      case "solana-devnet":
        return { stroke: palette.purpleFill, text: palette.purpleText };
    }
  };

  return (
    <TemplateFrame
      kind="data-egress"
      categoryLabel="Proof and privacy"
      title={verified.title}
      subtitle={verified.subtitle}
      provenance={verified.provenance}
      altText={altText}
      theme={theme}
      markSize={markSize}
      showVisibleCaption={showVisibleCaption}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {verified.zones.map((zone) => {
          const accent = zoneAccent(zone.id);
          return (
            <section
              key={zone.id}
              data-egress-zone={zone.id}
              className="flex flex-col justify-between border p-4"
              style={{
                backgroundColor: palette.canvas,
                borderColor: palette.border,
                borderTopWidth: 3,
                borderTopColor: accent.stroke,
                borderRadius: 0,
              }}
            >
              <div>
                <h3
                  className="font-display text-lg font-medium leading-snug"
                  style={{ color: palette.foreground }}
                >
                  {zone.heading}
                </h3>
                <p
                  className="mt-1 font-mono text-xs"
                  style={{ color: accent.text }}
                >
                  {zone.retentionLabel}
                </p>

                <ul className="mt-4 space-y-2.5 text-sm leading-relaxed">
                  {zone.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-2 inline-block h-1.5 w-1.5 shrink-0"
                        style={{ backgroundColor: accent.stroke }}
                      />
                      <span style={{ color: palette.foreground }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p
                className="mt-5 border-t pt-3 text-xs leading-relaxed"
                style={{
                  borderColor: palette.border,
                  color: palette.muted,
                }}
              >
                {zone.boundaryNote}
              </p>
            </section>
          );
        })}
      </div>
    </TemplateFrame>
  );
}
