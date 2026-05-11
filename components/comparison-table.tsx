"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisRecord, ComparisonRow } from "@/lib/types";

export function ComparisonTable({
  rows,
  selectedAnalyses,
  mode,
  className,
}: {
  rows: ComparisonRow[];
  selectedAnalyses: AnalysisRecord[];
  mode: "single" | "compare";
  className?: string;
}) {
  const [activeCategory, setActiveCategory] = useState("Tudo");
  const [showOnlyProblems, setShowOnlyProblems] = useState(false);
  const problemCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    let totalProblems = 0;

    for (const row of rows) {
      const hasProblem = row.values.some((cell) => cell.status === "high" || cell.status === "low");
      if (!hasProblem) {
        continue;
      }

      totalProblems += 1;
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }

    counts.set("Tudo", totalProblems);
    return counts;
  }, [rows]);
  const categories = useMemo(
    () => ["Tudo", ...Array.from(new Set(rows.map((row) => row.category))).sort((left, right) => left.localeCompare(right))],
    [rows],
  );
  const filteredRows = useMemo(() => {
    const categoryRows = activeCategory === "Tudo" ? rows : rows.filter((row) => row.category === activeCategory);

    if (!showOnlyProblems) {
      return categoryRows;
    }

    return categoryRows.filter((row) =>
      row.values.some((cell) => cell.status === "high" || cell.status === "low"),
    );
  }, [activeCategory, rows, showOnlyProblems]);

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("Tudo");
    }
  }, [activeCategory, categories]);

  return (
    <div className={cn("glass rounded-[28px] p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Comparação</p>
          <h3 className="mt-1 text-base font-semibold text-white">
            {mode === "single" ? "Leitura direta do relatório" : "Comparação lado a lado"}
          </h3>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              activeCategory === category
                ? "border-transparent bg-white text-slate-950"
                : "border-white/10 bg-white/[0.03] text-[var(--muted)] hover:text-white",
            )}
            type="button"
            onClick={() => setActiveCategory(category)}
          >
            {category} ({problemCountByCategory.get(category) ?? 0})
          </button>
        ))}
        <button
          className={cn(
            "rounded-full border px-4 py-2 text-sm transition",
            showOnlyProblems
              ? "border-transparent bg-rose-300 text-slate-950"
              : "border-white/10 bg-white/[0.03] text-[var(--muted)] hover:text-white",
          )}
          type="button"
          onClick={() => setShowOnlyProblems((current) => !current)}
        >
          Só problemas
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-[var(--muted)]">
            <tr className="border-b border-white/8">
              <th className="pb-3 pr-4 font-medium">Métrica</th>
              <th className="pb-3 pr-4 font-medium">Categoria</th>
              {selectedAnalyses.map((analysis, index) => (
                <th key={analysis.id} className="pb-3 pr-4 font-medium">
                  <div className="text-white">{new Date(analysis.collectedAt).toLocaleDateString("pt-PT")}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {mode === "single" ? analysis.reportCode : index === 0 ? "Base" : analysis.reportCode}
                  </div>
                </th>
              ))}
              {mode === "compare" ? <th className="pb-3 pr-4 font-medium">Diferença</th> : null}
              {mode === "compare" ? <th className="pb-3 font-medium">Tendência</th> : null}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.slug} className="border-b border-white/6 align-top">
                <td className="py-4 pr-4">
                  <div className="font-medium text-white">{row.name}</div>
                  <div className="text-xs text-[var(--muted)]">{row.referenceText ?? "Sem referência"}</div>
                </td>
                <td className="py-4 pr-4 text-[var(--muted)]">{row.category}</td>
                {row.values.map((cell, index) => {
                  const flagged = cell.status === "high" || cell.status === "low";

                  return (
                    <td key={`${row.slug}-${index}`} className="py-4 pr-4">
                      <div
                        className={cn(
                          "inline-flex min-w-28 flex-col rounded-2xl px-3 py-2",
                          flagged ? "bg-rose-500/10 text-rose-300" : "bg-white/[0.03] text-white",
                        )}
                      >
                        <span className={cn("flex items-center gap-2", flagged && "font-bold")}>
                          {flagged ? <AlertTriangle size={14} /> : null}
                          {cell.valueLabel}
                        </span>
                        <span className={cn("mt-1 text-xs", flagged ? "text-rose-200" : "text-[var(--muted)]")}>
                          {cell.percentLabel ?? "Sem %"}
                        </span>
                      </div>
                    </td>
                  );
                })}
                {mode === "compare" ? <td className="py-4 pr-4 text-white">{row.deltaLabel}</td> : null}
                {mode === "compare" ? (
                  <td className="py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
                        row.direction === "up" && "bg-emerald-400/12 text-emerald-300",
                        row.direction === "down" && "bg-rose-400/12 text-rose-300",
                        row.direction === "flat" && "bg-white/8 text-[var(--muted)]",
                      )}
                    >
                      {row.direction === "up" ? <ArrowUpRight size={14} /> : null}
                      {row.direction === "down" ? <ArrowDownRight size={14} /> : null}
                      {row.label}
                    </span>
                  </td>
                ) : null}
              </tr>
            ))}
            {!filteredRows.length ? (
              <tr>
                <td
                  className="py-8 text-sm text-[var(--muted)]"
                  colSpan={mode === "compare" ? selectedAnalyses.length + 4 : selectedAnalyses.length + 2}
                >
                  Não existem métricas para esta categoria nas datas selecionadas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
