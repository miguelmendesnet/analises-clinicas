import { extractPdfText } from "@/lib/pdf";
import { parseClinicalPdf } from "@/lib/parser";
import { storePdf, upsertAnalysis } from "@/lib/persistence";
import { slugify } from "@/lib/utils";

export async function importPdfFile(file: File) {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let rawText: string;
    try {
      rawText = await extractPdfText(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : "falha ao extrair texto";
      throw new Error(`falha na extração do PDF: ${message}`);
    }

    let parsed;
    try {
      parsed = parseClinicalPdf(rawText);
    } catch (error) {
      const message = error instanceof Error ? error.message : "falha ao interpretar análise";
      throw new Error(`falha no parsing clínico: ${message}`);
    }

    let storedPath: string;
    try {
      storedPath = await storePdf(buffer, file.name, parsed.collectedAt, parsed.reportCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : "falha ao guardar PDF";
      throw new Error(`falha no armazenamento do PDF: ${message}`);
    }

    const analysisId = `${parsed.reportCode}-${slugify(parsed.collectedAt)}`;

    try {
      await upsertAnalysis(analysisId, file.name, storedPath, parsed);
    } catch (error) {
      const message = error instanceof Error ? error.message : "falha ao persistir análise";
      throw new Error(`falha na persistência da análise: ${message}`);
    }

    return {
      reportCode: parsed.reportCode,
      collectedAt: parsed.collectedAt,
      metricCount: parsed.metrics.length,
      storedPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao importar PDF.";
    throw new Error(`Import falhou para "${file.name}" (${file.type || "sem MIME"}): ${message}`);
  }
}
