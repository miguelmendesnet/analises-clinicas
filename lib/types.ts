export type MetricStatus = "high" | "low" | "normal" | "unknown";

export type ParsedMetric = {
  slug: string;
  name: string;
  category: string;
  clinicalSection: string;
  valueNumeric: number | null;
  valueText: string | null;
  displayValue: string;
  unit: string | null;
  referenceText: string | null;
  status: MetricStatus;
};

export type ParsedAnalysis = {
  reportCode: string;
  patientName: string | null;
  patientAgeYears: number | null;
  collectedAt: string;
  reportedAt: string | null;
  rawText: string;
  metrics: ParsedMetric[];
};

export type AnalysisRecord = {
  id: string;
  reportCode: string;
  fileName: string;
  storedPath: string;
  patientName: string | null;
  collectedAt: string;
  reportedAt: string | null;
  importedAt: string;
  metricCount: number;
  categoryCount: number;
};

export type MetricRecord = ParsedMetric & {
  analysisId: string;
  collectedAt: string;
};

export type ComparisonMetric = {
  analysisId: string;
  slug: string;
  name: string;
  category: string;
  displayValue: string;
  unit: string | null;
  referenceText: string | null;
  valueNumeric: number | null;
  status: MetricStatus;
};

export type ComparisonValueCell = {
  valueLabel: string;
  percentLabel: string | null;
  status: MetricStatus | null;
};

export type Highlight = {
  slug: string;
  name: string;
  category: string;
  displayValue: string;
  status: MetricStatus;
};

export type ComparisonRow = {
  slug: string;
  name: string;
  category: string;
  values: ComparisonValueCell[];
  deltaLabel: string;
  label: string;
  direction: "up" | "down" | "flat";
  referenceText: string | null;
};

export type DashboardData = {
  analyses: AnalysisRecord[];
  metricsCount: number;
  latestHighlights: Highlight[];
  comparisonMetrics: ComparisonMetric[];
};
