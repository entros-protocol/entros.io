import type {
  AnyVisualTemplateData,
  BenchmarkCardData,
  DataEgressData,
  PermitSequenceData,
  PolicyFlowData,
  ProvenanceMetadata,
  StatusCardData,
} from "./provenance";

function provenanceTail(provenance: ProvenanceMetadata): string {
  return [
    `Source: ${provenance.sourceRecord}.`,
    `Capture version: ${provenance.captureVersion}.`,
    `Cluster: ${provenance.cluster}.`,
    `Denominator: ${provenance.sampleDenominator}.`,
    `Limits: ${provenance.limitsNote}`,
  ].join(" ");
}

export function generatePolicyFlowAltText(data: PolicyFlowData): string {
  const [warm, stepUp] = data.branches;
  return [
    `Entros diagram: ${data.title}.`,
    `Policy rules: ${data.policyRules.join(", ")}.`,
    `Warm path (${warm.costLabel}): ${warm.steps.join(" -> ")}. ${warm.timestampRule}.`,
    `Step-up path (${stepUp.costLabel}): ${stepUp.steps.join(" -> ")}. ${stepUp.timestampRule}.`,
    `Server settlement: ${data.serverSteps.join(" -> ")}. Outcomes: ${data.settlementOutcomes.join(", ")}.`,
    provenanceTail(data.provenance),
  ].join(" ");
}

export function generateDataEgressAltText(data: DataEgressData): string {
  const zoneSummaries = data.zones.map(
    (zone) =>
      `${zone.heading} (${zone.retentionLabel}): ${zone.items.join(", ")}. ${zone.boundaryNote}`,
  );
  return [
    `Entros diagram: ${data.title}.`,
    ...zoneSummaries,
    provenanceTail(data.provenance),
  ].join(" ");
}

export function generatePermitSequenceAltText(data: PermitSequenceData): string {
  const steps = data.steps.map(
    (step) => `${step.stepNumber} ${step.actor} (${step.title}): ${step.detail}`,
  );
  return [
    `Entros diagram: ${data.title}.`,
    `Assurance: ${data.assuranceTier}. Maximum permit lifetime: ${data.maxLifetimeSeconds} seconds.`,
    ...steps,
    data.authorizationBoundary,
    provenanceTail(data.provenance),
  ].join(" ");
}

export function generateBenchmarkCardAltText(data: BenchmarkCardData): string {
  const rows = data.rows.map(
    (row) =>
      `${row.label} [${row.stratum}]: ${row.valueLabel} (${row.denominator}). ${row.scopeNote}`,
  );
  return [
    `Entros benchmark card: ${data.title}.`,
    `Metric: ${data.metricHeading}.`,
    ...rows,
    data.methodologyNote,
    provenanceTail(data.provenance),
  ].join(" ");
}

export function generateStatusCardAltText(data: StatusCardData): string {
  const live = data.liveItems.map((item) => `${item.label} (${item.tag})`).join(", ");
  const roadmap = data.roadmapItems
    .map((item) => `${item.label} (${item.tag})`)
    .join(", ");
  return [
    `Entros status card: ${data.title}.`,
    `${data.liveHeading}: ${live}.`,
    `${data.roadmapHeading}: ${roadmap}.`,
    data.tokenNote,
    provenanceTail(data.provenance),
  ].join(" ");
}

export function generateTemplateAltText(data: AnyVisualTemplateData): string {
  switch (data.kind) {
    case "policy-flow":
      return generatePolicyFlowAltText(data);
    case "data-egress":
      return generateDataEgressAltText(data);
    case "permit-sequence":
      return generatePermitSequenceAltText(data);
    case "benchmark-card":
      return generateBenchmarkCardAltText(data);
    case "status-card":
      return generateStatusCardAltText(data);
  }
}
