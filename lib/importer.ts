import { extractPdfText } from "@/lib/pdf";
import { parseClinicalPdf } from "@/lib/parser";
import { storePdf, upsertAnalysis } from "@/lib/persistence";
import { slugify } from "@/lib/utils";

export async function importPdfFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const rawText = await extractPdfText(buffer);
  const parsed = parseClinicalPdf(rawText);
  const storedPath = await storePdf(buffer, file.name, parsed.collectedAt, parsed.reportCode);
  const analysisId = `${parsed.reportCode}-${slugify(parsed.collectedAt)}`;

  await upsertAnalysis(analysisId, file.name, storedPath, parsed);

  return {
    reportCode: parsed.reportCode,
    collectedAt: parsed.collectedAt,
    metricCount: parsed.metrics.length,
    storedPath,
  };
}
