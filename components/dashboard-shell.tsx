"use client";

import { useMemo, useState, useTransition } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  FileStack,
  MoonStar,
  Upload,
} from "lucide-react";
import { buildComparisonRows } from "@/lib/comparison";
import { ComparisonTable } from "@/components/comparison-table";
import { cn } from "@/lib/utils";
import type { AnalysisRecord, DashboardData } from "@/lib/types";

function UploadPanel() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  async function handleUpload(formData: FormData) {
    setMessage(null);

    startTransition(async () => {
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Falha no upload." }));
        setMessage(payload.error ?? "Falha no upload.");
        return;
      }

      const payload = await response.json();
      setMessage(`${payload.imported.length} ficheiro(s) importado(s) com sucesso.`);
      window.location.reload();
    });
  }

  return (
    <form
      action={handleUpload}
      className="glass relative overflow-hidden rounded-[24px] p-5"
    >
      <div className="relative space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/7 p-3 text-[var(--accent)]">
            <Upload size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Importar PDFs</p>
            <h3 className="text-base font-semibold text-white">Entrada de novos relatórios</h3>
          </div>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Adiciona PDFs e atualiza o histórico sem sair desta vista.
        </p>
        <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-[20px] border border-dashed border-white/14 bg-white/[0.03] px-5 text-center transition hover:border-[var(--accent)] hover:bg-white/[0.05]">
          <input className="hidden" name="files" type="file" accept="application/pdf" multiple />
          <span className="text-sm font-medium text-white">Escolher PDFs de análises</span>
          <span className="mt-2 text-xs tracking-[0.18em] text-[var(--muted)]">Múltiplo · PDF texto · armazenamento local</span>
        </label>
        <div className="flex flex-col items-start gap-3">
          <button
            className="rounded-2xl bg-[linear-gradient(135deg,#7ce2c3,#76a9ff)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "A importar..." : "Importar e processar"}
          </button>
          {message ? <p className="text-sm text-[var(--muted)]">{message}</p> : null}
        </div>
      </div>
    </form>
  );
}

function ComparisonControlPanel({
  data,
  viewMode,
  setViewMode,
  singleAnalysisId,
  setSingleAnalysisId,
  comparisonAnalysisIds,
  updateComparisonId,
}: {
  data: DashboardData;
  viewMode: "single" | "compare";
  setViewMode: (mode: "single" | "compare") => void;
  singleAnalysisId: string;
  setSingleAnalysisId: (value: string) => void;
  comparisonAnalysisIds: string[];
  updateComparisonId: (index: number, nextValue: string) => void;
}) {
  return (
    <div className="glass relative overflow-hidden rounded-[24px] p-5">
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-white/7 p-3 text-[var(--accent-2)]">
            <CalendarDays size={18} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Comparar datas</p>
            <h3 className="text-base font-semibold text-white">Controlos da análise</h3>
          </div>
        </div>
        <div className="mt-4 grid gap-4">
          <div className="inline-flex w-full rounded-2xl border border-white/10 bg-white/5 p-1">
            <button
              className={cn(
                "flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition",
                viewMode === "single" ? "bg-white text-slate-950" : "text-[var(--muted)] hover:text-white",
              )}
              type="button"
              onClick={() => setViewMode("single")}
            >
              Ver 1 relatório
            </button>
            <button
              className={cn(
                "flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition",
                viewMode === "compare" ? "bg-white text-slate-950" : "text-[var(--muted)] hover:text-white",
              )}
              type="button"
              onClick={() => setViewMode("compare")}
            >
              Comparar 3
            </button>
          </div>
          {viewMode === "single" ? (
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Relatório</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                value={singleAnalysisId}
                onChange={(event) => setSingleAnalysisId(event.target.value)}
              >
                {data.analyses.map((analysis) => (
                  <option key={analysis.id} value={analysis.id}>
                    {format(new Date(analysis.collectedAt), "dd/MM/yyyy")} · {analysis.reportCode}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {viewMode === "compare" ? (
            <>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Exame base</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  value={comparisonAnalysisIds[0]}
                  onChange={(event) => updateComparisonId(0, event.target.value)}
                >
                  {data.analyses.map((analysis) => (
                    <option key={analysis.id} value={analysis.id}>
                      {format(new Date(analysis.collectedAt), "dd/MM/yyyy")} · {analysis.reportCode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Exame comparado 2</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  value={comparisonAnalysisIds[1]}
                  onChange={(event) => updateComparisonId(1, event.target.value)}
                >
                  {data.analyses.map((analysis) => (
                    <option key={analysis.id} value={analysis.id}>
                      {format(new Date(analysis.collectedAt), "dd/MM/yyyy")} · {analysis.reportCode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Exame comparado 3</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  value={comparisonAnalysisIds[2]}
                  onChange={(event) => updateComparisonId(2, event.target.value)}
                >
                  {data.analyses.map((analysis) => (
                    <option key={analysis.id} value={analysis.id}>
                      {format(new Date(analysis.collectedAt), "dd/MM/yyyy")} · {analysis.reportCode}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({ data }: { data: DashboardData }) {
  const [viewMode, setViewMode] = useState<"single" | "compare">("compare");
  const [singleAnalysisId, setSingleAnalysisId] = useState(data.analyses[0]?.id ?? "");
  const [comparisonAnalysisIds, setComparisonAnalysisIds] = useState([
    data.analyses[2]?.id ?? data.analyses[0]?.id ?? "",
    data.analyses[1]?.id ?? data.analyses[0]?.id ?? "",
    data.analyses[0]?.id ?? "",
  ]);
  const activeAnalysisIds = viewMode === "single" ? [singleAnalysisId] : comparisonAnalysisIds;

  const comparisonRows = useMemo(
    () => buildComparisonRows(data.comparisonMetrics, activeAnalysisIds),
    [activeAnalysisIds, data.comparisonMetrics],
  );
  const selectedAnalyses = activeAnalysisIds
    .map((analysisId) => data.analyses.find((analysis) => analysis.id === analysisId))
    .filter((analysis): analysis is AnalysisRecord => Boolean(analysis));

  function updateComparisonId(index: number, nextValue: string) {
    setComparisonAnalysisIds((current) => current.map((value, currentIndex) => (currentIndex === index ? nextValue : value)));
  }

  return (
    <main className="min-h-screen px-3 py-3 lg:px-4">
      <div className="grid gap-3 xl:grid-cols-[240px_360px_minmax(0,1fr)]">
        <aside className="glass relative overflow-hidden rounded-[28px] p-4 xl:sticky xl:top-3 xl:self-start">
          <div className="grid-sheen absolute inset-0 opacity-30" />
          <div className="relative space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2">
              <MoonStar size={14} className="text-[var(--accent)]" />
              <span className="text-xs uppercase tracking-[0.26em] text-[var(--muted)]">Pulse Archive</span>
            </div>

            <div>
              <h1 className="text-2xl font-semibold leading-tight text-white">
                Histórico clínico pessoal
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Menos ruído, mais leitura direta e comparação imediata.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Relatórios</p>
                <p className="mt-2 text-2xl font-semibold text-white">{data.analyses.length}</p>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Métricas</p>
                <p className="mt-2 text-2xl font-semibold text-white">{data.metricsCount}</p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Última colheita</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {data.analyses[0] ? format(new Date(data.analyses[0].collectedAt), "dd/MM/yyyy") : "—"}
                </p>
              </div>
              <div className="rounded-[20px] border border-white/8 bg-white/[0.04] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">Sinais destacados</p>
                <p className="mt-2 text-base font-semibold text-white">{data.latestHighlights.length}</p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                <FileStack size={16} className="text-[var(--accent-2)]" />
                Relatórios
              </div>
              <div className="space-y-2">
                {data.analyses.map((analysis) => (
                  <div key={analysis.id} className="rounded-[18px] border border-white/8 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-white/8 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                        {analysis.reportCode}
                      </span>
                      <span className="text-xs text-[var(--muted)]">{format(new Date(analysis.collectedAt), "dd/MM/yyyy")}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-white">{analysis.fileName}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{analysis.metricCount} métricas</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-3 xl:sticky xl:top-3 xl:self-start">
          <div className="glass rounded-[24px] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--muted)]">Workspace</p>
            <h2 className="mt-1 text-lg font-semibold text-white">Controla datas e importações</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              A tabela fica sempre visível à direita; aqui só ajustas o que queres ver.
            </p>
          </div>

          <ComparisonControlPanel
            data={data}
            viewMode={viewMode}
            setViewMode={setViewMode}
            singleAnalysisId={singleAnalysisId}
            setSingleAnalysisId={setSingleAnalysisId}
            comparisonAnalysisIds={comparisonAnalysisIds}
            updateComparisonId={updateComparisonId}
          />
          <UploadPanel />
        </section>

        <section className="min-w-0">
          <ComparisonTable
            rows={comparisonRows}
            selectedAnalyses={selectedAnalyses}
            mode={viewMode}
            className="xl:min-h-[calc(100vh-1.5rem)]"
          />
        </section>
      </div>
    </main>
  );
}
