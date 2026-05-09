import type { ComparisonMetric, ComparisonRow, ComparisonValueCell } from "@/lib/types";
import { formatDelta, formatPercentDelta } from "@/lib/utils";

function buildCell(metric: ComparisonMetric | undefined, baseMetric: ComparisonMetric | undefined): ComparisonValueCell {
  const valueLabel = metric ? `${metric.displayValue}${metric.unit ? ` ${metric.unit}` : ""}` : "—";

  if (!metric) {
    return {
      valueLabel,
      percentLabel: null,
      status: null,
    };
  }

  if (!baseMetric || metric.analysisId === baseMetric.analysisId) {
    return {
      valueLabel,
      percentLabel: "Base",
      status: metric.status,
    };
  }

  const delta =
    baseMetric.valueNumeric !== null && metric.valueNumeric !== null
      ? metric.valueNumeric - baseMetric.valueNumeric
      : null;

  const percent =
    delta !== null && baseMetric.valueNumeric
      ? (delta / baseMetric.valueNumeric) * 100
      : null;

  return {
    valueLabel,
    percentLabel: formatPercentDelta(percent) ?? null,
    status: metric.status,
  };
}

export function buildComparisonRows(
  metrics: ComparisonMetric[],
  selectedAnalysisIds: string[],
) {
  const selected = selectedAnalysisIds.filter(Boolean);
  const slugSet = new Set(metrics.filter((entry) => selected.includes(entry.analysisId)).map((entry) => entry.slug));
  const rows: ComparisonRow[] = [];

  for (const slug of slugSet) {
    const metricsByAnalysis = new Map(
      metrics
        .filter((entry) => entry.slug === slug && selected.includes(entry.analysisId))
        .map((entry) => [entry.analysisId, entry]),
    );

    const baseMetric = metricsByAnalysis.get(selected[0]);
    const rowMetrics = selected.map((analysisId) => metricsByAnalysis.get(analysisId));
    const firstMetric = rowMetrics.find(Boolean);
    const lastMetric = [...rowMetrics].reverse().find(Boolean);

    const firstNumeric = firstMetric?.valueNumeric ?? null;
    const lastNumeric = lastMetric?.valueNumeric ?? null;
    const delta =
      firstNumeric !== null && lastNumeric !== null
        ? lastNumeric - firstNumeric
        : null;
    const deltaPercent =
      delta !== null && firstNumeric
        ? (delta / firstNumeric) * 100
        : null;

    let direction: "up" | "down" | "flat" = "flat";
    if (delta !== null && delta > 0.0001) {
      direction = "up";
    }
    if (delta !== null && delta < -0.0001) {
      direction = "down";
    }

    rows.push({
      slug,
      name: firstMetric?.name ?? lastMetric?.name ?? slug,
      category: firstMetric?.category ?? lastMetric?.category ?? "Outros",
      values: selected.map((analysisId) => buildCell(metricsByAnalysis.get(analysisId), baseMetric)),
      deltaLabel: [formatDelta(delta, lastMetric?.unit ?? firstMetric?.unit ?? null), formatPercentDelta(deltaPercent)]
        .filter(Boolean)
        .join(" · ") || "Sem valor numérico comparável",
      label: direction === "up" ? "Subiu" : direction === "down" ? "Desceu" : "Estável",
      direction,
      referenceText: lastMetric?.referenceText ?? firstMetric?.referenceText ?? null,
    });
  }

  return rows.sort((left, right) => left.category.localeCompare(right.category) || left.name.localeCompare(right.name));
}
