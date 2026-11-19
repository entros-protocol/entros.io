import { generateBenchmarkCardAltText } from "./alt-text";
import {
  validateBenchmarkCardData,
  type BenchmarkCardData,
  type BenchmarkStratumKind,
} from "./provenance";
import { TemplateFrame } from "./template-frame";
import {
  VISUAL_THEME_PALETTES,
  type VisualTheme,
  type WholePixelMarkSize,
} from "./tokens";

export const PROVER_BENCHMARK_DATA: BenchmarkCardData = {
  kind: "benchmark-card",
  title: "Client Groth16 prover benchmark",
  subtitle:
    "Measured client proving latency and Solana single-transaction wire fit across 30 deterministic repetitions per configuration.",
  metricHeading: "Warm median prove latency and wire fit (lower latency is faster)",
  requiresTwoSidedHumanAndAdversarial: false,
  rows: [
    {
      id: "mopro-hamming-v1",
      label: "entros_hamming_v1 (entros-mopro native Rust)",
      stratum: "system",
      valueLabel: "34.6 ms median (47.2 ms p95)",
      barPercent: 15,
      denominator: "n = 30 repetitions (7/7 equivalence checks)",
      scopeNote: "2,030 R1CS constraints, 17.2 MiB peak RSS, 256 B proof.",
    },
    {
      id: "snarkjs-request-bound-v1",
      label: "entros_request_bound_v1 (snarkjs WASM)",
      stratum: "system",
      valueLabel: "224.1 ms median (266.0 ms p95)",
      barPercent: 98,
      denominator: "n = 30 repetitions (8/8 equivalence checks)",
      scopeNote: "2,290 R1CS constraints, 6 public inputs, 256 B proof.",
    },
    {
      id: "snarkjs-hamming-v1",
      label: "entros_hamming_v1 (snarkjs WASM)",
      stratum: "system",
      valueLabel: "229.3 ms median (297.4 ms p95)",
      barPercent: 100,
      denominator: "n = 30 repetitions (7/7 equivalence checks)",
      scopeNote: "2,030 R1CS constraints, 4 public inputs, 256 B proof.",
    },
    {
      id: "solana-tx-fit",
      label: "Solana single-transaction settlement budget",
      stratum: "reference",
      valueLabel: "1,153 to 1,211 B (<= 1,232 B cap)",
      barPercent: 98,
      denominator: "256 B proof / 1,232 B Solana packet cap",
      scopeNote:
        "145,047 CU on live devnet 5-ix update (slot 515082051), under 200,000 CU. Multi-KiB proofs exceed 1,232 B.",
    },
  ],
  methodologyNote:
    "Measured on one Apple M1 Max host (Node 24.15.0, snarkjs 0.7.6, circom 2.2.3) using synthetic vectors. Physical mobile device timing and population accuracy are separate measurements.",
  provenance: {
    subject: "Client Groth16 proving latency and Solana transaction wire fit",
    sourceRecord: "circuits/benchmarks/run_prover_benchmark.ts (2026-10-21 ratified run)",
    captureVersion: "entros_hamming_v1 (2,030 R1CS) and entros_request_bound_v1 (2,290 R1CS)",
    cluster: "Solana devnet",
    sampleDenominator: "n = 30 repetitions per backend (synthetic fixtures)",
    recordedDate: "2026-10-21",
    limitsNote:
      "Single-host synthetic timing only. Proving speed does not measure sensor provenance, spoof resistance, or population uniqueness.",
  },
};

export const ANTISPOOF_TWOSIDED_BENCHMARK_DATA: BenchmarkCardData = {
  kind: "benchmark-card",
  title: "Two-sided verification strata (human and spoof together)",
  subtitle:
    "Every detection benchmark reports human false-reject strata alongside adversarial rejection counts with explicit denominators.",
  metricHeading: "Observed detection and human false-reject rates by scoped stratum",
  requiresTwoSidedHumanAndAdversarial: true,
  rows: [
    {
      id: "procedural-t1-t3",
      label: "Procedural synthesis suites (T1 to T3)",
      stratum: "adversarial",
      valueLabel: "100.0% rejected (0 passed)",
      barPercent: 100,
      denominator: "0/18,020 attempts passed",
      scopeNote: "Covers tested procedural scripts and feature optimization classes only.",
    },
    {
      id: "frozen-synth-gate",
      label: "Pinned v2 audio stage (frozen synthesis regression)",
      stratum: "adversarial",
      valueLabel: "100.0% rejected (0 receipts)",
      barPercent: 100,
      denominator: "0/12 frozen synthesis receipts",
      scopeNote: "Bounded frozen corpus only. Later regenerated audio produced a contrary receipt.",
    },
    {
      id: "holdout-spoof-v2",
      label: "Pinned v2 audio stage (held-out spoof generators)",
      stratum: "adversarial",
      valueLabel: "80.41% spoof rows caught",
      barPercent: 80.4,
      denominator: "119/148 rows (47/76 or 61.84% unseen neural TTS)",
      scopeNote: "Shows real detection ceiling on unseen neural TTS families. No general claim.",
    },
    {
      id: "human-librivox-v2",
      label: "Pinned v2 audio stage (retained LibriVox human slice)",
      stratum: "human",
      valueLabel: "16.67% false rejects (2 rejected)",
      barPercent: 16.7,
      denominator: "2/12 human rows (6 speakers)",
      scopeNote: "Small retained slice only. Does not estimate deployment-population FRR.",
    },
  ],
  methodologyNote:
    "Frozen-PCM regressions and fresh neural generators stay separate. Entros has no measured population EER or ROC curve today.",
  provenance: {
    subject: "Two-sided human and adversarial speech and procedural evaluation strata",
    sourceRecord: "Entros Security Program and Claims Register (2026-10-26 evidence record)",
    captureVersion: "paired-v2 / pinned v2 learned audio stage",
    cluster: "Solana devnet",
    sampleDenominator: "18,020 procedural attempts, 148 holdout spoof rows, 12 LibriVox human rows",
    recordedDate: "2026-10-26",
    limitsNote:
      "Population FRR, FAR, and EER remain unmeasured until a consented human cohort completes. Never rank Entros against external systems without matched benchmarks.",
  },
};

export interface BenchmarkCardTemplateProps {
  readonly data?: BenchmarkCardData;
  readonly theme?: VisualTheme;
  readonly markSize?: WholePixelMarkSize;
  readonly showVisibleCaption?: boolean;
}

export function BenchmarkCardTemplate({
  data = PROVER_BENCHMARK_DATA,
  theme = "dark",
  markSize = 36,
  showVisibleCaption = false,
}: BenchmarkCardTemplateProps) {
  const check = validateBenchmarkCardData(data);
  if (!check.valid || !check.data) {
    throw new Error(
      `Invalid BenchmarkCardTemplate data: ${check.errors.join("; ")}`,
    );
  }

  const verified = check.data;
  const palette = VISUAL_THEME_PALETTES[theme];
  const altText = generateBenchmarkCardAltText(verified);

  const stratumStyle = (stratum: BenchmarkStratumKind) => {
    switch (stratum) {
      case "human":
        return {
          label: "Human stratum",
          bar: palette.warningFill,
          text: palette.warningText,
        };
      case "adversarial":
        return {
          label: "Adversarial stratum",
          bar: palette.accentFill,
          text: palette.accentText,
        };
      case "system":
        return {
          label: "System benchmark",
          bar: palette.greenFill,
          text: palette.greenText,
        };
      case "reference":
        return {
          label: "Reference bound",
          bar: palette.purpleFill,
          text: palette.purpleText,
        };
    }
  };

  return (
    <TemplateFrame
      kind="benchmark-card"
      categoryLabel="Measured evidence"
      title={verified.title}
      subtitle={verified.subtitle}
      provenance={verified.provenance}
      altText={altText}
      theme={theme}
      markSize={markSize}
      showVisibleCaption={showVisibleCaption}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className="font-mono text-xs uppercase tracking-[0.08em]"
            style={{ color: palette.muted }}
          >
            {verified.metricHeading}
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: palette.accentText }}
          >
            {verified.requiresTwoSidedHumanAndAdversarial
              ? "Two-sided reporting enforced"
              : "Explicit denominator per row"}
          </span>
        </div>

        <div className="space-y-3">
          {verified.rows.map((row) => {
            const style = stratumStyle(row.stratum);
            const widthPercent = Math.max(2, Math.min(100, row.barPercent));
            return (
              <div
                key={row.id}
                data-benchmark-stratum={row.stratum}
                className="border p-4"
                style={{
                  backgroundColor: palette.canvas,
                  borderColor: palette.border,
                  borderRadius: 0,
                }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="border px-2 py-0.5 font-mono text-[11px] uppercase tracking-[0.06em]"
                      style={{
                        backgroundColor: palette.surfaceAlt,
                        borderColor: palette.border,
                        color: style.text,
                        borderRadius: 0,
                      }}
                    >
                      {style.label}
                    </span>
                    <span
                      className="text-sm font-medium"
                      style={{ color: palette.foreground }}
                    >
                      {row.label}
                    </span>
                  </div>
                  <span
                    className="font-mono text-sm font-medium"
                    style={{ color: style.text }}
                  >
                    {row.valueLabel}
                  </span>
                </div>

                {/* Square-corner geometric proportion bar */}
                <div
                  aria-hidden="true"
                  className="mt-3 h-2 w-full"
                  style={{ backgroundColor: palette.surfaceAlt }}
                >
                  <div
                    style={{
                      width: `${widthPercent}%`,
                      height: "100%",
                      backgroundColor: style.bar,
                    }}
                  />
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono" style={{ color: palette.foreground }}>
                    Denominator: {row.denominator}
                  </span>
                  <span style={{ color: palette.muted }}>{row.scopeNote}</span>
                </div>
              </div>
            );
          })}
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
          <strong style={{ color: palette.foreground }}>Methodology: </strong>
          {verified.methodologyNote}
        </p>
      </div>
    </TemplateFrame>
  );
}
