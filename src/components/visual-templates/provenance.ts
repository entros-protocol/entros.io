import { z } from "zod";

export type VisualTemplateKind =
  | "policy-flow"
  | "data-egress"
  | "permit-sequence"
  | "benchmark-card"
  | "status-card";

export interface CopyViolation {
  readonly rule: string;
  readonly match: string;
}

const BANNED_COPY_PATTERNS: ReadonlyArray<{
  readonly rule: string;
  readonly pattern: RegExp;
}> = [
  { rule: "no-em-dash", pattern: /\u2014/ },
  { rule: "no-eyebrow-slashes", pattern: /(^|\s)\/\/\s*[A-Za-z0-9]/ },
  { rule: "no-data-leaves-claim", pattern: /\bno\s+data\s+leaves\b/i },
  { rule: "no-nothing-leaves-claim", pattern: /\bnothing\s+leaves\b/i },
  {
    rule: "no-zero-personal-information",
    pattern: /\bzero\s+personal\s+information\b/i,
  },
  { rule: "no-unspoofable", pattern: /\bunspoofable\b/i },
  { rule: "no-unbeatable", pattern: /\bunbeatable\b/i },
  { rule: "no-sybil-proof", pattern: /\bsybil-proof\b/i },
  { rule: "no-mainnet-ready", pattern: /\bmainnet-ready\b/i },
  { rule: "no-ai-cant-fake", pattern: /\bai\s+can['’]?t\s+fake\b/i },
  { rule: "no-cannot-be-forged", pattern: /\bcannot\s+be\s+forged\b/i },
  { rule: "no-attack-economics-frame", pattern: /\bbot\s+farms\s+pay\b/i },
  { rule: "no-cost-of-attack", pattern: /\bcost\s+of\s+attack\b/i },
  { rule: "no-slow-and-expensive", pattern: /\bslow\s+and\s+expensive\b/i },
  {
    rule: "no-economically-punitive",
    pattern: /\beconomically\s+(punitive|unsustainable|irrational)\b/i,
  },
  {
    rule: "no-invented-entros-eer",
    pattern: /\bentros\b[^.\n]{0,40}\b(0\.27%|99\.71%|sub-1%\s+eer)\b/i,
  },
  { rule: "no-public-telemetry-wording", pattern: /\btelemetry\b/i },
];

export function validatePublicCopy(text: string): CopyViolation[] {
  const violations: CopyViolation[] = [];
  for (const entry of BANNED_COPY_PATTERNS) {
    const matched = text.match(entry.pattern);
    if (matched) {
      violations.push({
        rule: entry.rule,
        match: matched[0],
      });
    }
  }
  return violations;
}

export function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectStrings(item));
  }
  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap((entry) => collectStrings(entry));
  }
  return [];
}

export const ProvenanceMetadataSchema = z.object({
  subject: z.string().trim().min(4).max(140),
  sourceRecord: z.string().trim().min(4).max(180),
  captureVersion: z.string().trim().min(2).max(120),
  cluster: z.literal("Solana devnet"),
  sampleDenominator: z.string().trim().min(4).max(180),
  recordedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  limitsNote: z.string().trim().min(10).max(260),
});

export type ProvenanceMetadata = z.infer<typeof ProvenanceMetadataSchema>;

export interface ValidationOutcome<T> {
  readonly valid: boolean;
  readonly data?: T;
  readonly errors: readonly string[];
}

function validateWithCopyChecks<T>(
  schema: z.ZodType<T>,
  input: unknown,
  extraChecks?: (parsed: T) => string[],
): ValidationOutcome<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map(
        (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`,
      ),
    };
  }

  const errors: string[] = [];
  for (const text of collectStrings(parsed.data)) {
    for (const violation of validatePublicCopy(text)) {
      errors.push(`copy[${violation.rule}]: disallowed phrase "${violation.match}"`);
    }
  }

  if (extraChecks) {
    errors.push(...extraChecks(parsed.data));
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: parsed.data, errors: [] };
}

export function validateProvenance(
  input: unknown,
): ValidationOutcome<ProvenanceMetadata> {
  return validateWithCopyChecks(ProvenanceMetadataSchema, input);
}

export function assertValidProvenance(input: unknown): ProvenanceMetadata {
  const outcome = validateProvenance(input);
  if (!outcome.valid || !outcome.data) {
    throw new Error(`Invalid template provenance: ${outcome.errors.join("; ")}`);
  }
  return outcome.data;
}

export const PolicyBranchSchema = z.object({
  id: z.enum(["warm-reuse", "paired-step-up"]),
  label: z.string().trim().min(3).max(80),
  costLabel: z.string().trim().min(2).max(40),
  steps: z.array(z.string().trim().min(4).max(160)).min(2).max(4),
  timestampRule: z.string().trim().min(6).max(160),
});

export const PolicyFlowDataSchema = z.object({
  kind: z.literal("policy-flow"),
  title: z.string().trim().min(4).max(96),
  subtitle: z.string().trim().min(8).max(200),
  policyRules: z.array(z.string().trim().min(3).max(80)).min(3).max(6),
  branches: z.tuple([PolicyBranchSchema, PolicyBranchSchema]),
  serverSteps: z.array(z.string().trim().min(4).max(160)).min(2).max(4),
  settlementOutcomes: z.array(z.string().trim().min(3).max(60)).min(2).max(4),
  provenance: ProvenanceMetadataSchema,
});

export type PolicyFlowData = z.infer<typeof PolicyFlowDataSchema>;

export function validatePolicyFlowData(
  input: unknown,
): ValidationOutcome<PolicyFlowData> {
  return validateWithCopyChecks(PolicyFlowDataSchema, input, (data) => {
    const errors: string[] = [];
    const corpus = collectStrings(data).join(" ");
    if (!/\b0\s+SOL\b/.test(corpus)) {
      errors.push("policy-flow: must state 0 SOL warm reuse cost");
    }
    if (!corpus.includes("verifiedAt")) {
      errors.push("policy-flow: must explicitly state preserved original verifiedAt");
    }
    if (!corpus.includes("readIntegratorEvidence")) {
      errors.push("policy-flow: must name readIntegratorEvidence");
    }
    if (!corpus.includes("evaluatePolicy")) {
      errors.push("policy-flow: must name evaluatePolicy");
    }
    if (!corpus.includes("browser_unattested")) {
      errors.push("policy-flow: must state browser_unattested assurance");
    }
    if (!/settlement/i.test(corpus)) {
      errors.push("policy-flow: must include settlement-time policy recheck");
    }
    return errors;
  });
}

export const DataEgressZoneSchema = z.object({
  id: z.enum(["on-device", "validation-transient", "solana-devnet"]),
  heading: z.string().trim().min(3).max(64),
  retentionLabel: z.string().trim().min(3).max(80),
  items: z.array(z.string().trim().min(4).max(180)).min(2).max(8),
  boundaryNote: z.string().trim().min(6).max(200),
});

export const DataEgressDataSchema = z.object({
  kind: z.literal("data-egress"),
  title: z.string().trim().min(4).max(96),
  subtitle: z.string().trim().min(8).max(200),
  zones: z.tuple([
    DataEgressZoneSchema,
    DataEgressZoneSchema,
    DataEgressZoneSchema,
  ]),
  provenance: ProvenanceMetadataSchema,
});

export type DataEgressData = z.infer<typeof DataEgressDataSchema>;

export function validateDataEgressData(
  input: unknown,
): ValidationOutcome<DataEgressData> {
  return validateWithCopyChecks(DataEgressDataSchema, input, (data) => {
    const errors: string[] = [];
    const zoneIds = data.zones.map((zone) => zone.id);
    if (
      zoneIds[0] !== "on-device" ||
      zoneIds[1] !== "validation-transient" ||
      zoneIds[2] !== "solana-devnet"
    ) {
      errors.push(
        "data-egress: zones must be ordered on-device, validation-transient, solana-devnet",
      );
    }

    const validationCorpus = collectStrings(data.zones[1]).join(" ");
    const requiredDisclosures: ReadonlyArray<{ label: string; pattern: RegExp }> = [
      { label: "308 derived features", pattern: /\b308\b/ },
      { label: "F0 contour", pattern: /\bF0\b/i },
      { label: "acceleration contour", pattern: /accel/i },
      { label: "coarse path outline", pattern: /coarse\b[^.\n]{0,20}\bpath/i },
      { label: "client signals", pattern: /client\s+signals/i },
      { label: "capture timing", pattern: /capture\s+timing/i },
      { label: "wallet", pattern: /wallet/i },
      { label: "commitment", pattern: /commitment/i },
      { label: "phrase PCM transient", pattern: /PCM/i },
    ];
    for (const req of requiredDisclosures) {
      if (!req.pattern.test(validationCorpus)) {
        errors.push(`data-egress: validation zone must disclose ${req.label}`);
      }
    }

    const onChainCorpus = collectStrings(data.zones[2]).join(" ");
    for (const token of ["Poseidon", "Groth16", "IdentityState", "SAS"]) {
      if (!onChainCorpus.includes(token)) {
        errors.push(`data-egress: public devnet zone must include ${token}`);
      }
    }
    return errors;
  });
}

export const PermitStepSchema = z.object({
  stepNumber: z.string().regex(/^0[1-9]$/),
  actor: z.string().trim().min(2).max(40),
  title: z.string().trim().min(3).max(72),
  detail: z.string().trim().min(6).max(200),
  fields: z.array(z.string().trim().min(2).max(80)).min(1).max(5),
});

export const PermitSequenceDataSchema = z.object({
  kind: z.literal("permit-sequence"),
  title: z.string().trim().min(4).max(96),
  subtitle: z.string().trim().min(8).max(200),
  maxLifetimeSeconds: z.number().int().min(30).max(900),
  assuranceTier: z.literal("browser_unattested"),
  steps: z.array(PermitStepSchema).min(3).max(4),
  authorizationBoundary: z.string().trim().min(12).max(220),
  provenance: ProvenanceMetadataSchema,
});

export type PermitSequenceData = z.infer<typeof PermitSequenceDataSchema>;

export function validatePermitSequenceData(
  input: unknown,
): ValidationOutcome<PermitSequenceData> {
  return validateWithCopyChecks(PermitSequenceDataSchema, input, (data) => {
    const errors: string[] = [];
    const corpus = collectStrings(data).join(" ");
    if (!/Metaplex\s+Core/i.test(corpus)) {
      errors.push("permit-sequence: must bind to Metaplex Core asset ownership");
    }
    if (!/SHA-256/i.test(corpus)) {
      errors.push("permit-sequence: must include action SHA-256 digest");
    }
    if (!/nonce/i.test(corpus)) {
      errors.push("permit-sequence: must include single-use nonce");
    }
    if (!corpus.includes("evaluatePolicy")) {
      errors.push("permit-sequence: must name evaluatePolicy at settlement");
    }
    if (!/not\s+live\s+human\s+presence/i.test(data.authorizationBoundary)) {
      errors.push(
        "permit-sequence: authorizationBoundary must state prior wallet authorization, not live human presence",
      );
    }
    return errors;
  });
}

export const BenchmarkStratumKindSchema = z.enum([
  "human",
  "adversarial",
  "system",
  "reference",
]);

export type BenchmarkStratumKind = z.infer<typeof BenchmarkStratumKindSchema>;

export const BenchmarkRowSchema = z.object({
  id: z.string().trim().min(2).max(60),
  label: z.string().trim().min(3).max(90),
  stratum: BenchmarkStratumKindSchema,
  valueLabel: z.string().trim().min(2).max(60),
  barPercent: z.number().min(0).max(100),
  denominator: z.string().trim().min(3).max(100),
  scopeNote: z.string().trim().min(4).max(180),
});

export type BenchmarkRow = z.infer<typeof BenchmarkRowSchema>;

export const BenchmarkCardDataSchema = z.object({
  kind: z.literal("benchmark-card"),
  title: z.string().trim().min(4).max(96),
  subtitle: z.string().trim().min(8).max(200),
  metricHeading: z.string().trim().min(3).max(80),
  requiresTwoSidedHumanAndAdversarial: z.boolean(),
  rows: z.array(BenchmarkRowSchema).min(2).max(6),
  methodologyNote: z.string().trim().min(8).max(240),
  provenance: ProvenanceMetadataSchema,
});

export type BenchmarkCardData = z.infer<typeof BenchmarkCardDataSchema>;

const DENOMINATOR_COUNT_PATTERN =
  /(\bn\s*=\s*\d+|\d+\s*\/\s*\d+|\b\d[\d,]*\s+(?:[a-z0-9-]+\s+){0,3}(rows|clips|speakers|repetitions|attempts|sessions|checks|bytes|B)\b)/i;

export function validateBenchmarkCardData(
  input: unknown,
): ValidationOutcome<BenchmarkCardData> {
  return validateWithCopyChecks(BenchmarkCardDataSchema, input, (data) => {
    const errors: string[] = [];
    if (!DENOMINATOR_COUNT_PATTERN.test(data.provenance.sampleDenominator)) {
      errors.push(
        "benchmark-card: provenance.sampleDenominator must include an explicit sample count",
      );
    }
    for (const row of data.rows) {
      if (!DENOMINATOR_COUNT_PATTERN.test(row.denominator)) {
        errors.push(
          `benchmark-card: row "${row.id}" denominator must include an explicit count`,
        );
      }
    }
    if (data.requiresTwoSidedHumanAndAdversarial) {
      const hasHuman = data.rows.some((row) => row.stratum === "human");
      const hasAdversarial = data.rows.some((row) => row.stratum === "adversarial");
      if (!hasHuman || !hasAdversarial) {
        errors.push(
          "benchmark-card: two-sided detection benchmarks require both human and adversarial strata",
        );
      }
    }
    return errors;
  });
}

export const StatusEntrySchema = z.object({
  label: z.string().trim().min(3).max(80),
  detail: z.string().trim().min(6).max(180),
  tag: z.string().trim().min(2).max(40),
});

export const StatusCardDataSchema = z.object({
  kind: z.literal("status-card"),
  title: z.string().trim().min(4).max(96),
  subtitle: z.string().trim().min(8).max(200),
  liveHeading: z.string().trim().min(3).max(60),
  roadmapHeading: z.string().trim().min(3).max(60),
  liveItems: z.array(StatusEntrySchema).min(3).max(6),
  roadmapItems: z.array(StatusEntrySchema).min(3).max(6),
  tokenNote: z.string().trim().min(10).max(220),
  provenance: ProvenanceMetadataSchema,
});

export type StatusCardData = z.infer<typeof StatusCardDataSchema>;

const OPEN_GATE_TERMS: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  { label: "Phase 2 ceremony", pattern: /ceremony/i },
  { label: "external audit", pattern: /external\s+(security\s+)?audit/i },
  { label: "mainnet custody", pattern: /custody/i },
  { label: "mainnet launch", pattern: /\bmainnet\b/i },
  { label: "population uniqueness", pattern: /population\s+uniqueness/i },
];

export function validateStatusCardData(
  input: unknown,
): ValidationOutcome<StatusCardData> {
  return validateWithCopyChecks(StatusCardDataSchema, input, (data) => {
    const errors: string[] = [];
    const liveCorpus = collectStrings(data.liveItems).join(" ");
    const roadmapCorpus = collectStrings(data.roadmapItems).join(" ");

    if (!/devnet/i.test(data.liveHeading) && !/devnet/i.test(liveCorpus)) {
      errors.push("status-card: live column must explicitly state devnet");
    }
    if (/\bmainnet\s+(live|deployed|launched)\b/i.test(liveCorpus)) {
      errors.push("status-card: live column must not claim mainnet is live");
    }

    for (const gate of OPEN_GATE_TERMS) {
      if (!gate.pattern.test(roadmapCorpus)) {
        errors.push(`status-card: roadmap column must list open gate ${gate.label}`);
      }
    }
    return errors;
  });
}

export type AnyVisualTemplateData =
  | PolicyFlowData
  | DataEgressData
  | PermitSequenceData
  | BenchmarkCardData
  | StatusCardData;
