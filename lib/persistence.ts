import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { get, list, put } from "@vercel/blob";
import type { AnalysisRecord, ComparisonMetric, DashboardData, Highlight, ParsedAnalysis, ParsedMetric } from "@/lib/types";

type StoredAnalysis = AnalysisRecord & {
  metrics: ParsedMetric[];
};

type PersistedData = {
  version: number;
  analyses: StoredAnalysis[];
};

const STORAGE_ROOT = path.join(process.cwd(), "storage");
const LOCAL_DATA_PATH = path.join(STORAGE_ROOT, "data.json");
const LOCAL_UPLOADS_ROOT = path.join(STORAGE_ROOT, "uploads");
const BLOB_DATA_PATH = "pulse-archive/data.json";
const BLOB_UPLOAD_ROOT = "pulse-archive/uploads";

function createEmptyData(): PersistedData {
  return {
    version: 1,
    analyses: [],
  };
}

function isBlobEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function isVercelProductionLike() {
  return Boolean(process.env.VERCEL);
}

function assertPersistentStorageReady() {
  if (isVercelProductionLike() && !isBlobEnabled()) {
    throw new Error(
      "Vercel Blob não está configurado. Adiciona a integração Vercel Blob ao projeto e define BLOB_READ_WRITE_TOKEN para ativar uploads persistentes em produção.",
    );
  }
}

async function localFileExists(target: string) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function readLocalData() {
  if (!(await localFileExists(LOCAL_DATA_PATH))) {
    return null;
  }

  const file = await readFile(LOCAL_DATA_PATH, "utf8");
  return JSON.parse(file) as PersistedData;
}

async function writeLocalData(data: PersistedData) {
  await mkdir(STORAGE_ROOT, { recursive: true });
  await writeFile(LOCAL_DATA_PATH, JSON.stringify(data, null, 2), "utf8");
}

async function readBlobData() {
  const blob = await get(BLOB_DATA_PATH, { access: "public" });
  if (!blob || blob.statusCode !== 200) {
    return null;
  }

  return JSON.parse(await new Response(blob.stream).text()) as PersistedData;
}

async function writeBlobData(data: PersistedData) {
  await put(BLOB_DATA_PATH, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function migrateLegacySqliteIfNeeded() {
  if (await localFileExists(LOCAL_DATA_PATH)) {
    return;
  }

  const sqlitePath = path.join(STORAGE_ROOT, "analyses.sqlite");
  if (!(await localFileExists(sqlitePath))) {
    return;
  }

  const Database = (await import("better-sqlite3")).default;
  const db = new Database(sqlitePath, { readonly: true });

  try {
    const analyses = db
      .prepare(`
        SELECT
          analyses.*,
          COUNT(metrics.id) AS metric_count,
          COUNT(DISTINCT metrics.category) AS category_count
        FROM analyses
        LEFT JOIN metrics ON metrics.analysis_id = analyses.id
        GROUP BY analyses.id
        ORDER BY analyses.collected_at DESC
      `)
      .all() as Array<Record<string, string | number | null>>;

    const metrics = db
      .prepare(`
        SELECT *
        FROM metrics
        ORDER BY analysis_id, name
      `)
      .all() as Array<Record<string, string | number | null>>;

    const metricMap = new Map<string, ParsedMetric[]>();
    for (const row of metrics) {
      const analysisId = String(row.analysis_id);
      const current = metricMap.get(analysisId) ?? [];
      current.push({
        slug: String(row.slug),
        name: String(row.name),
        category: String(row.category),
        clinicalSection: String(row.clinical_section),
        valueNumeric: row.value_numeric === null ? null : Number(row.value_numeric),
        valueText: row.value_text ? String(row.value_text) : null,
        displayValue: String(row.display_value),
        unit: row.unit ? String(row.unit) : null,
        referenceText: row.reference_text ? String(row.reference_text) : null,
        status: String(row.status) as ParsedMetric["status"],
      });
      metricMap.set(analysisId, current);
    }

    const data: PersistedData = {
      version: 1,
      analyses: analyses.map((row) => ({
        id: String(row.id),
        reportCode: String(row.report_code),
        fileName: String(row.file_name),
        storedPath: String(row.stored_path),
        patientName: row.patient_name ? String(row.patient_name) : null,
        collectedAt: String(row.collected_at),
        reportedAt: row.reported_at ? String(row.reported_at) : null,
        importedAt: String(row.imported_at),
        metricCount: Number(row.metric_count),
        categoryCount: Number(row.category_count),
        metrics: metricMap.get(String(row.id)) ?? [],
      })),
    };

    await writeLocalData(data);
  } finally {
    db.close();
  }
}

export async function loadPersistedData() {
  if (isBlobEnabled()) {
    return (await readBlobData()) ?? createEmptyData();
  }

  await migrateLegacySqliteIfNeeded();
  return (await readLocalData()) ?? createEmptyData();
}

async function savePersistedData(data: PersistedData) {
  assertPersistentStorageReady();

  if (isBlobEnabled()) {
    await writeBlobData(data);
    return;
  }

  await writeLocalData(data);
}

export async function storePdf(buffer: Buffer, fileName: string, collectedAt: string, reportCode: string) {
  assertPersistentStorageReady();

  const date = new Date(collectedAt);
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const relativePath = `${year}/${month}/${reportCode}-${safeName}`;

  if (isBlobEnabled()) {
    const blob = await put(`${BLOB_UPLOAD_ROOT}/${relativePath}`, buffer, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/pdf",
    });
    return blob.url;
  }

  const folder = path.join(LOCAL_UPLOADS_ROOT, year, month);
  await mkdir(folder, { recursive: true });
  const target = path.join(folder, `${reportCode}-${safeName}`);
  await writeFile(target, buffer);
  return target;
}

export async function upsertAnalysis(
  analysisId: string,
  fileName: string,
  storedPath: string,
  parsed: ParsedAnalysis,
) {
  const data = await loadPersistedData();
  const importedAt = new Date().toISOString();

  const nextAnalysis: StoredAnalysis = {
    id: analysisId,
    reportCode: parsed.reportCode,
    fileName,
    storedPath,
    patientName: parsed.patientName,
    collectedAt: parsed.collectedAt,
    reportedAt: parsed.reportedAt,
    importedAt,
    metricCount: parsed.metrics.length,
    categoryCount: new Set(parsed.metrics.map((metric) => metric.category)).size,
    metrics: parsed.metrics,
  };

  const existingIndex = data.analyses.findIndex((analysis) => analysis.reportCode === parsed.reportCode);
  if (existingIndex >= 0) {
    data.analyses[existingIndex] = {
      ...data.analyses[existingIndex],
      ...nextAnalysis,
      importedAt: data.analyses[existingIndex].importedAt ?? importedAt,
    };
  } else {
    data.analyses.push(nextAnalysis);
  }

  data.analyses.sort((left, right) => right.collectedAt.localeCompare(left.collectedAt));
  await savePersistedData(data);
}

function buildHighlights(analyses: StoredAnalysis[]): Highlight[] {
  const latest = analyses[0];
  if (!latest) {
    return [];
  }

  return latest.metrics.slice(0, 6).map((metric) => ({
    slug: metric.slug,
    name: metric.name,
    category: metric.category,
    displayValue: metric.unit ? `${metric.displayValue} ${metric.unit}` : metric.displayValue,
    status: metric.status,
  }));
}

export async function getDashboardData(): Promise<DashboardData> {
  const data = await loadPersistedData();
  const analyses: AnalysisRecord[] = data.analyses.map((analysis) => ({
    id: analysis.id,
    reportCode: analysis.reportCode,
    fileName: analysis.fileName,
    storedPath: analysis.storedPath,
    patientName: analysis.patientName,
    collectedAt: analysis.collectedAt,
    reportedAt: analysis.reportedAt,
    importedAt: analysis.importedAt,
    metricCount: analysis.metricCount,
    categoryCount: analysis.categoryCount,
  }));

  const comparisonMetrics: ComparisonMetric[] = data.analyses.flatMap((analysis) =>
    analysis.metrics.map((metric) => ({
      analysisId: analysis.id,
      slug: metric.slug,
      name: metric.name,
      category: metric.category,
      displayValue: metric.displayValue,
      unit: metric.unit,
      referenceText: metric.referenceText,
      valueNumeric: metric.valueNumeric,
      status: metric.status,
    })),
  );

  return {
    analyses,
    metricsCount: comparisonMetrics.length,
    latestHighlights: buildHighlights(data.analyses),
    comparisonMetrics,
  };
}

export async function verifyBlobConnection() {
  if (!isBlobEnabled()) {
    return { enabled: false as const };
  }

  const existing = await list({ prefix: BLOB_UPLOAD_ROOT, limit: 1 });
  return { enabled: true as const, blobCount: existing.blobs.length };
}
