import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  ANTISPOOF_TWOSIDED_BENCHMARK_DATA,
  BenchmarkCardTemplate,
  contrastRatio,
  DataEgressTemplate,
  DEFAULT_DATA_EGRESS_DATA,
  DEFAULT_PERMIT_SEQUENCE_DATA,
  DEFAULT_POLICY_FLOW_DATA,
  DEFAULT_STATUS_CARD_DATA,
  ENTROS_MARK_BLOCK_COLOR,
  ENTROS_MARK_GRID_UNIT,
  generateTemplateAltText,
  isWholePixelMarkSize,
  MIN_TEXT_CONTRAST_RATIO,
  PermitSequenceTemplate,
  PolicyFlowTemplate,
  PROVER_BENCHMARK_DATA,
  StatusCardTemplate,
  validateBenchmarkCardData,
  validateDataEgressData,
  validatePermitSequenceData,
  validatePolicyFlowData,
  validateProvenance,
  validatePublicCopy,
  validateStatusCardData,
  VISUAL_THEME_PALETTES,
  type AnyVisualTemplateData,
} from "@/components/visual-templates";

const ALL_PRESETS: readonly AnyVisualTemplateData[] = [
  DEFAULT_POLICY_FLOW_DATA,
  DEFAULT_DATA_EGRESS_DATA,
  DEFAULT_PERMIT_SEQUENCE_DATA,
  PROVER_BENCHMARK_DATA,
  ANTISPOOF_TWOSIDED_BENCHMARK_DATA,
  DEFAULT_STATUS_CARD_DATA,
];

describe("visual-system tokens and pixel-grid geometry", () => {
  it("meets WCAG AA 4.5:1 contrast across every text and surface token pair", () => {
    for (const palette of Object.values(VISUAL_THEME_PALETTES)) {
      const surfaces = [palette.canvas, palette.surface, palette.surfaceAlt];
      const textColors = [
        palette.foreground,
        palette.muted,
        palette.accentText,
        palette.greenText,
        palette.purpleText,
        palette.warningText,
      ];

      for (const bg of surfaces) {
        for (const fg of textColors) {
          const ratio = contrastRatio(fg, bg);
          expect(
            ratio,
            `${palette.theme} ${fg} on ${bg} contrast ${ratio.toFixed(2)}`,
          ).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST_RATIO);
        }
      }
    }
  });

  it("enforces whole-pixel 18px grid multiples for EntrosMark", () => {
    expect(ENTROS_MARK_GRID_UNIT).toBe(18);
    expect(ENTROS_MARK_BLOCK_COLOR).toBe("#00E7FE");
    expect(isWholePixelMarkSize(18)).toBe(true);
    expect(isWholePixelMarkSize(36)).toBe(true);
    expect(isWholePixelMarkSize(54)).toBe(true);

    expect(isWholePixelMarkSize(0)).toBe(false);
    expect(isWholePixelMarkSize(-18)).toBe(false);
    expect(isWholePixelMarkSize(20)).toBe(false);
    expect(isWholePixelMarkSize(27)).toBe(false);
    expect(isWholePixelMarkSize(36.5)).toBe(false);
  });
});

describe("visual-template rendering and disclosures", () => {
  it("renders all five template families in dark and light themes with whole-pixel mark and square geometry", () => {
    const renders = [
      {
        name: "policy-flow-dark",
        html: renderToStaticMarkup(<PolicyFlowTemplate theme="dark" />),
      },
      {
        name: "policy-flow-light",
        html: renderToStaticMarkup(<PolicyFlowTemplate theme="light" markSize={18} />),
      },
      {
        name: "data-egress-dark",
        html: renderToStaticMarkup(<DataEgressTemplate theme="dark" />),
      },
      {
        name: "permit-sequence-dark",
        html: renderToStaticMarkup(<PermitSequenceTemplate theme="dark" />),
      },
      {
        name: "benchmark-prover-dark",
        html: renderToStaticMarkup(
          <BenchmarkCardTemplate data={PROVER_BENCHMARK_DATA} theme="dark" />,
        ),
      },
      {
        name: "benchmark-antispoof-light",
        html: renderToStaticMarkup(
          <BenchmarkCardTemplate
            data={ANTISPOOF_TWOSIDED_BENCHMARK_DATA}
            theme="light"
          />,
        ),
      },
      {
        name: "status-card-dark",
        html: renderToStaticMarkup(<StatusCardTemplate theme="dark" />),
      },
    ];

    for (const { name, html } of renders) {
      expect(html, `${name} mark viewBox`).toContain('viewBox="0 0 18 18"');
      expect(html, `${name} mark bars`).toContain(
        'd="M0 0h18v4H0zM0 7h12v4H0zM0 14h18v4H0z"',
      );
      expect(html, `${name} mark cyan block`).toContain('fill="#00E7FE"');
      expect(html, `${name} wordmark`).toContain(">Entros<");
      expect(html, `${name} devnet cluster`).toContain("Solana devnet");
      expect(html, `${name} no border-radius`).not.toMatch(/\brounded-/);
      expect(html, `${name} no em dash`).not.toContain("\u2014");
      expect(html, `${name} no data leaves claim`).not.toMatch(
        /\bno\s+data\s+leaves\b/i,
      );
      expect(html, `${name} figcaption present`).toContain("<figcaption");
    }
  });

  it("renders required PolicyFlowTemplate disclosures", () => {
    const html = renderToStaticMarkup(<PolicyFlowTemplate />);
    expect(html).toContain("0 SOL");
    expect(html).toContain("verifiedAt");
    expect(html).toContain("readIntegratorEvidence");
    expect(html).toContain("evaluatePolicy");
    expect(html).toContain("browser_unattested");
    expect(html).toContain("settlement");
  });

  it("renders all three DataEgressTemplate zones and full request inventory", () => {
    const html = renderToStaticMarkup(<DataEgressTemplate />);
    expect(html).toContain('data-egress-zone="on-device"');
    expect(html).toContain('data-egress-zone="validation-transient"');
    expect(html).toContain('data-egress-zone="solana-devnet"');
    expect(html).toContain("308 derived features");
    expect(html).toContain("F0 voice-pitch contour");
    expect(html).toContain("acceleration-magnitude contour");
    expect(html).toContain("Coarse 64-point path outline");
    expect(html).toContain("Client signals");
    expect(html).toContain("capture timing");
    expect(html).toContain("Poseidon(3) commitment");
    expect(html).toContain("Groth16 proof");
    expect(html).toContain("IdentityState");
    expect(html).toContain("SAS attestation");
    expect(html).toContain("redacted service logs");
    expect(html).not.toMatch(/telemetry/i);
    expect(html).not.toMatch(/no data leaves/i);
  });

  it("renders PermitSequenceTemplate ownership and authorization boundary disclosures", () => {
    const html = renderToStaticMarkup(<PermitSequenceTemplate />);
    expect(html).toContain("Metaplex Core");
    expect(html).toContain("SHA-256");
    expect(html).toContain("900 s");
    expect(html).toContain("browser_unattested");
    expect(html).toContain("evaluatePolicy");
    expect(html).toContain("not live human presence at execution time");
  });

  it("renders BenchmarkCardTemplate prover and two-sided human/adversarial presets", () => {
    const proverHtml = renderToStaticMarkup(
      <BenchmarkCardTemplate data={PROVER_BENCHMARK_DATA} />,
    );
    expect(proverHtml).toContain("n = 30 repetitions");
    expect(proverHtml).toContain("34.6 ms median");
    expect(proverHtml).toContain("224.1 ms median");
    expect(proverHtml).toContain("229.3 ms median");
    expect(proverHtml).toContain("256 B proof");
    expect(proverHtml).toContain("1,232 B");
    expect(proverHtml).toContain("145,047 CU");
    expect(proverHtml).toContain("slot 515082051");
    expect(proverHtml).not.toContain("182,978");

    const antispoofHtml = renderToStaticMarkup(
      <BenchmarkCardTemplate data={ANTISPOOF_TWOSIDED_BENCHMARK_DATA} />,
    );
    expect(antispoofHtml).toContain('data-benchmark-stratum="human"');
    expect(antispoofHtml).toContain('data-benchmark-stratum="adversarial"');
    expect(antispoofHtml).toContain("0/18,020 attempts passed");
    expect(antispoofHtml).toContain("0/12 frozen synthesis receipts");
    expect(antispoofHtml).toContain("119/148 rows");
    expect(antispoofHtml).toContain("2/12 human rows");
    expect(antispoofHtml).toContain("no measured population EER");
  });

  it("renders StatusCardTemplate separating devnet live surfaces from open mainnet gates", () => {
    const html = renderToStaticMarkup(<StatusCardTemplate />);
    expect(html).toContain('data-status-column="live"');
    expect(html).toContain('data-status-column="roadmap"');
    expect(html).toContain("Live on Solana devnet");
    expect(html).toContain("Integrator Policy v1");
    expect(html).toContain("0 SOL warm reuse staged on develop");
    expect(html).not.toContain("Integrator Policy v1 and warm reuse");
    expect(html).toContain("Phase 2 trusted-setup ceremony");
    expect(html).toContain("Independent external security audit");
    expect(html).toContain("Production key custody and mainnet launch");
    expect(html).toContain("Consented population uniqueness study");
    expect(html).toContain("standard SPL token");
  });
});

describe("provenance, copy, and template validators", () => {
  it("accepts all default presets and rejects banned copy and missing provenance", () => {
    expect(validatePolicyFlowData(DEFAULT_POLICY_FLOW_DATA).valid).toBe(true);
    expect(validateDataEgressData(DEFAULT_DATA_EGRESS_DATA).valid).toBe(true);
    expect(validatePermitSequenceData(DEFAULT_PERMIT_SEQUENCE_DATA).valid).toBe(
      true,
    );
    expect(validateBenchmarkCardData(PROVER_BENCHMARK_DATA).valid).toBe(true);
    expect(
      validateBenchmarkCardData(ANTISPOOF_TWOSIDED_BENCHMARK_DATA).valid,
    ).toBe(true);
    expect(validateStatusCardData(DEFAULT_STATUS_CARD_DATA).valid).toBe(true);

    const badCluster = validateProvenance({
      ...DEFAULT_POLICY_FLOW_DATA.provenance,
      cluster: "Solana mainnet",
    });
    expect(badCluster.valid).toBe(false);

    const missingDenominator = validateProvenance({
      ...DEFAULT_POLICY_FLOW_DATA.provenance,
      sampleDenominator: "",
    });
    expect(missingDenominator.valid).toBe(false);

    expect(validatePublicCopy("Clean copy without banned terms.")).toEqual([]);
    expect(validatePublicCopy("Has an em dash \u2014 rejected").length).toBeGreaterThan(
      0,
    );
    expect(validatePublicCopy("// EYEBROW LABEL").length).toBeGreaterThan(0);
    expect(validatePublicCopy("No data leaves your device.").length).toBeGreaterThan(
      0,
    );
    expect(validatePublicCopy("Unspoofable sybil-proof humanity.").length).toBeGreaterThan(
      0,
    );
    expect(validatePublicCopy("Bot farms pay 78 SOL in fees.").length).toBeGreaterThan(
      0,
    );
    expect(validatePublicCopy("Retains redacted telemetry for 30 days.").length).toBeGreaterThan(
      0,
    );
  });

  it("rejects single-sided spoof-only benchmarks and missing denominators", () => {
    const spoofOnly = validateBenchmarkCardData({
      ...ANTISPOOF_TWOSIDED_BENCHMARK_DATA,
      rows: ANTISPOOF_TWOSIDED_BENCHMARK_DATA.rows.filter(
        (row) => row.stratum !== "human",
      ),
    });
    expect(spoofOnly.valid).toBe(false);
    expect(spoofOnly.errors.join(" ")).toContain("both human and adversarial strata");

    const noDenominatorCount = validateBenchmarkCardData({
      ...PROVER_BENCHMARK_DATA,
      provenance: {
        ...PROVER_BENCHMARK_DATA.provenance,
        sampleDenominator: "Internal test suite",
      },
    });
    expect(noDenominatorCount.valid).toBe(false);
  });

  it("enforces permit lifetime, data-egress inventory, and status-card gate boundaries", () => {
    const expiredPermit = validatePermitSequenceData({
      ...DEFAULT_PERMIT_SEQUENCE_DATA,
      maxLifetimeSeconds: 901,
    });
    expect(expiredPermit.valid).toBe(false);

    const missingPresenceLimit = validatePermitSequenceData({
      ...DEFAULT_PERMIT_SEQUENCE_DATA,
      authorizationBoundary: "Proves prior wallet authorization on devnet.",
    });
    expect(missingPresenceLimit.valid).toBe(false);

    const missing308 = validateDataEgressData({
      ...DEFAULT_DATA_EGRESS_DATA,
      zones: [
        DEFAULT_DATA_EGRESS_DATA.zones[0],
        {
          ...DEFAULT_DATA_EGRESS_DATA.zones[1],
          items: [
            "Spoken phrase PCM decoded in RAM",
            "F0 contour and accel contour",
            "Coarse path outline, client signals, capture timing, wallet, commitment",
          ],
        },
        DEFAULT_DATA_EGRESS_DATA.zones[2],
      ],
    });
    expect(missing308.valid).toBe(false);

    const missingGate = validateStatusCardData({
      ...DEFAULT_STATUS_CARD_DATA,
      roadmapItems: DEFAULT_STATUS_CARD_DATA.roadmapItems.filter(
        (item) => !/ceremony/i.test(item.label),
      ),
    });
    expect(missingGate.valid).toBe(false);
  });

  it("generates complete, copy-clean accessible alt text for every preset", () => {
    for (const preset of ALL_PRESETS) {
      const alt = generateTemplateAltText(preset);
      expect(alt.length).toBeGreaterThan(120);
      expect(validatePublicCopy(alt)).toEqual([]);
      expect(alt).not.toContain("\u2014");
      expect(alt).not.toContain(";");
      expect(alt).toContain(preset.provenance.sourceRecord);
      expect(alt).toContain(preset.provenance.captureVersion);
      expect(alt).toContain(preset.provenance.cluster);
      expect(alt).toContain(preset.provenance.sampleDenominator);
    }
  });

  it("keeps visual-templates source free of internal tracker identifiers and banned glyphs", () => {
    const dir = path.resolve(__dirname, "../src/components/visual-templates");
    const files = readdirSync(dir).filter(
      (name) => name.endsWith(".ts") || name.endsWith(".tsx"),
    );
    expect(files.length).toBeGreaterThanOrEqual(8);

    for (const file of files) {
      const source = readFileSync(path.join(dir, file), "utf8");
      expect(source, `${file} em dash`).not.toContain("\u2014");
      expect(source, `${file} internal tracker id`).not.toMatch(
        /#(169|170|171|265|278|281|286|297|299|312)\b/,
      );
      expect(source, `${file} sprint or queue label`).not.toMatch(
        /\b(Sprint\s+\d+|Q3\.\d|master-list|HANDOFF)\b/i,
      );
    }
  });
});
