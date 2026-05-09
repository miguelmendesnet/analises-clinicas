import { ANALYTE_CATALOG, CONTEXT_TITLES, SECTION_TITLES, findAnalyte } from "@/lib/analyte-catalog";
import type { MetricStatus, ParsedAnalysis, ParsedMetric } from "@/lib/types";
import { normalizeText, parseEuropeanNumber, slugify } from "@/lib/utils";

type Block = {
  analyte: ReturnType<typeof findAnalyte>;
  clinicalSection: string;
  lines: string[];
};

function cleanLines(text: string, patientName: string | null) {
  return text
    .split("\n")
    .map((line) => line.replace(/\t/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter((line) => line !== patientName)
    .filter((line) => !line.startsWith("-- "))
    .filter((line) => !line.includes("RurkMulok"))
    .filter((line) => !line.includes("VrokGuurk"))
    .filter((line) => !line.startsWith("DIRECCAO TÉCNICA"))
    .filter((line) => !line.startsWith("Análise Resultado"))
    .filter((line) => !line.startsWith("• PÁG"))
    .filter((line) => !/^\d{6,}\s+NI:/.test(line))
    .filter((line) => !/^\d{6,}\s*$/.test(line));
}

function extractMeta(text: string) {
  const reportCode = text.match(/\*(BLC\d+)\*/)?.[1] ?? `BLC-${Date.now()}`;
  const patientName = text.match(/Luís Miguel Timóteo Mendes|[A-ZÁÂÃÉÊÍÓÔÕÚÇ][\p{L} ]+\n• PÁG/u)?.[0]?.replace("\n• PÁG", "").trim() ?? null;
  const patientAgeYears = text.match(/Idade:\s*(\d+)\s*A/i)?.[1] ? Number(text.match(/Idade:\s*(\d+)\s*A/i)?.[1]) : null;
  const collection = text.match(/Colheita:\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}H\d{2})?/);
  const reported = text.match(/RELATÓRIO FINAL\s*(\d{2}\/\d{2}\/\d{4})/);

  const collectedAt = collection ? toIsoDate(collection[1], collection[2] ?? "00H00") : new Date().toISOString();
  const reportedAt = reported ? toIsoDate(reported[1], "00H00") : null;

  return { reportCode, patientName, patientAgeYears, collectedAt, reportedAt };
}

function toIsoDate(date: string, time: string) {
  const [day, month, year] = date.split("/");
  const [hours, minutes] = time.replace("H", ":").split(":");
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes))).toISOString();
}

function isSkippableLine(line: string) {
  const normalized = normalizeText(line);
  return (
    normalized.startsWith("resultados anteriores") ||
    /^\d{2}\/\d{2}\/\d{4}( \/ \d{2}\/\d{2}\/\d{4})*$/.test(line) ||
    /^\([^)]*\)$/.test(line) ||
    normalizeText(line) === "hemograma" ||
    normalizeText(line) === "eritrograma" ||
    normalizeText(line) === "leucograma" ||
    normalizeText(line) === "trombocitograma" ||
    normalizeText(line) === "bilibirrubinas"
  );
}

function isMeasurementCandidate(line: string) {
  if (/^(Não reativo|Reativo|Positivo|Negativo|Análise substituída)/i.test(line)) {
    return true;
  }

  return /^(?:[<>]?\s*\d|\d)/.test(line);
}

function isReferenceOnlyLine(line: string) {
  const normalized = normalizeText(line);

  return (
    /^\d+\s*º?\s*m[eê]s:/i.test(line) ||
    /^\d+\s*meses?\s*a\s*\d+\s*ano/i.test(line) ||
    /^\d+\s*a\s*\d+\s*anos:/i.test(line) ||
    /^>\s*\d+\s*anos:/i.test(line) ||
    normalized.startsWith("adultos:") ||
    normalized.startsWith("adulto:") ||
    normalized.startsWith("criancas:") ||
    normalized.startsWith("crianca") ||
    normalized.startsWith("valores recomendados") ||
    normalized.startsWith("valor de referencia")
  );
}

function resolveReferenceForAge(referenceText: string | null, patientAgeYears: number | null) {
  if (!referenceText) {
    return null;
  }

  const compact = referenceText.replace(/\s+/g, " ").trim();

  if (patientAgeYears !== null) {
    const ageRangePatterns = [
      { regex: /(\d+)\s*a\s*(\d+)\s*anos:\s*([<>]?\s*\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)/gi, type: "range" as const },
      { regex: />\s*(\d+)\s*anos:\s*([<>]?\s*\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)/gi, type: "greater" as const },
      { regex: /(\d+)\s*meses?\s*a\s*(\d+)\s*ano:\s*([<>]?\s*\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)/gi, type: "monthsToYear" as const },
    ];

    for (const pattern of ageRangePatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.regex.exec(compact)) !== null) {
        if (pattern.type === "range") {
          const minAge = Number(match[1]);
          const maxAge = Number(match[2]);
          if (patientAgeYears >= minAge && patientAgeYears <= maxAge) {
            return `${match[1]} a ${match[2]} anos: ${match[3]}`;
          }
        }

        if (pattern.type === "greater") {
          const minAge = Number(match[1]);
          if (patientAgeYears > minAge) {
            return `> ${match[1]} anos: ${match[2]}`;
          }
        }

        if (pattern.type === "monthsToYear") {
          const minMonths = Number(match[1]);
          const maxYears = Number(match[2]);
          if (patientAgeYears >= minMonths / 12 && patientAgeYears <= maxYears) {
            return `${match[1]} meses a ${match[2]} ano: ${match[3]}`;
          }
        }
      }
    }

    const adultMatch = compact.match(/Adultos?:\s*([<>]?\s*\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)/i);
    if (adultMatch && patientAgeYears >= 18) {
      return `Adultos: ${adultMatch[1]}`;
    }

    const childMatch = compact.match(/Crianç[aa]s?:\s*([<>]?\s*\d+(?:[.,]\d+)?(?:\s*-\s*\d+(?:[.,]\d+)?)?)/i);
    if (childMatch && patientAgeYears < 18) {
      return `Crianças: ${childMatch[1]}`;
    }
  }

  return compact;
}

function splitMeasurementLine(line: string) {
  const cleaned = line.replace(/\s*[▲▼]\s*/g, " ").replace(/\s+/g, " ").trim();

  if (/^(Não reativo|Reativo|Positivo|Negativo)/i.test(cleaned)) {
    return {
      displayValue: cleaned,
      unit: null,
      referenceText: null,
      valueText: cleaned,
      valueNumeric: null,
    };
  }

  const match = cleaned.match(/^(?<value>(?:[<>]\s*)?\d+(?:[.,]\d+)?(?:\s*\[[^\]]+\])?(?:\s*\{[^}]+\})?)(?:\s+(?<rest>.+))?$/);

  if (!match?.groups) {
    return null;
  }

  const rest = match.groups.rest ?? "";
  if (/^(?:<|>|Até|\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?)/i.test(rest)) {
    return {
      displayValue: match.groups.value.trim(),
      unit: null,
      referenceText: rest.trim() || null,
      valueText: null,
      valueNumeric: parseEuropeanNumber(match.groups.value),
    };
  }

  const splitter =
    rest.match(
      /\s(?=(?:<|>|Até|Indivíduos|Adulto:|Adultos:|Criança|Crianças:|Valor de referência|Valores|Risco|\d+\s*º?\s*m[eê]s:|\d+\s*meses?\s*a\s*\d+\s*ano|\d+\s*a\s*\d+\s*anos:|>\s*\d+\s*anos:|\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?))/,
    )?.index ?? -1;
  const unit = splitter >= 0 ? rest.slice(0, splitter).trim() : rest.trim() || null;
  const referenceText = splitter >= 0 ? rest.slice(splitter).trim() : null;

  return {
    displayValue: match.groups.value.trim(),
    unit,
    referenceText,
    valueText: null,
    valueNumeric: parseEuropeanNumber(match.groups.value),
  };
}

function deriveStatus(
  metric: { displayValue: string; referenceText: string | null },
  rawLine: string,
  patientAgeYears: number | null,
  analyte?: ReturnType<typeof findAnalyte> | null,
): MetricStatus {
  if (rawLine.includes("▲")) {
    return "high";
  }

  if (rawLine.includes("▼")) {
    return "low";
  }

  const value = parseEuropeanNumber(metric.displayValue);
  if (value === null || !metric.referenceText) {
    return "unknown";
  }

  const reference = resolveReferenceForAge(metric.referenceText, patientAgeYears);
  if (!reference) {
    return "unknown";
  }

  const range = reference.match(/(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)/);
  if (range) {
    const min = Number(range[1].replace(",", "."));
    const max = Number(range[2].replace(",", "."));
    if (value < min) {
      return "low";
    }
    if (value > max) {
      return "high";
    }
    return "normal";
  }

  const lessThan = reference.match(/(?:<|Até)\s*(\d+(?:[.,]\d+)?)/i);
  if (lessThan) {
    const max = Number(lessThan[1].replace(",", "."));
    if (analyte?.statusStrategy === "below-threshold-bad") {
      return value < max ? "low" : "normal";
    }
    return value > max ? "high" : "normal";
  }

  const greaterThan = reference.match(/>\s*(\d+(?:[.,]\d+)?)/);
  if (greaterThan) {
    const min = Number(greaterThan[1].replace(",", "."));
    return value < min ? "low" : "normal";
  }

  return "unknown";
}

function finalizeBlock(block: Block | null, patientAgeYears: number | null) {
  if (!block) {
    return null;
  }

  const candidateLines = block.lines
    .map((line) => line.replace(/^\([^)]*\)\s*/, "").trim())
    .filter(Boolean)
    .filter((line) => !isSkippableLine(line));

  const measurementCandidates = candidateLines
    .map((line, index) => ({ line, index, parsed: splitMeasurementLine(line) }))
    .filter((entry) => isMeasurementCandidate(entry.line) && !isReferenceOnlyLine(entry.line));

  const candidateWithStructuredResult = [...measurementCandidates]
    .reverse()
    .find((entry) => entry.parsed && (entry.parsed.unit || entry.parsed.referenceText));

  const fallbackCandidate = measurementCandidates[0];
  const chosenCandidate = candidateWithStructuredResult ?? fallbackCandidate;
  const candidateIndex = chosenCandidate?.index ?? -1;

  if (candidateIndex === -1) {
    return null;
  }

  const candidate = candidateLines[candidateIndex];
  const referenceContinuation = candidateLines
    .slice(candidateIndex + 1)
    .filter((line) => !isMeasurementCandidate(line) || isReferenceOnlyLine(line))
    .join(" ");

  const parsed = chosenCandidate?.parsed ?? splitMeasurementLine(candidate);
  if (!parsed) {
    return null;
  }

  const effectiveReferenceText = resolveReferenceForAge(
    [parsed.referenceText, referenceContinuation].filter(Boolean).join(" ").trim() || null,
    patientAgeYears,
  );

  const metric: ParsedMetric = {
    slug: block.analyte?.slug ?? slugify(block.analyte?.name ?? "metric"),
    name: block.analyte?.name ?? "Métrica",
    category: block.analyte?.category ?? "Outros",
    clinicalSection: block.clinicalSection,
    valueNumeric: parsed.valueNumeric,
    valueText: parsed.valueText,
    displayValue: parsed.displayValue,
    unit: parsed.unit,
    referenceText: effectiveReferenceText,
    status: deriveStatus(
      {
        ...parsed,
        referenceText: effectiveReferenceText,
      },
      candidate,
      patientAgeYears,
      block.analyte,
    ),
  };

  return metric;
}

export function parseClinicalPdf(text: string): ParsedAnalysis {
  const meta = extractMeta(text);
  const lines = cleanLines(text, meta.patientName);
  const metrics: ParsedMetric[] = [];
  let currentSection = "Outros";
  let currentContext: string | null = null;
  let currentBlock: Block | null = null;

  for (const line of lines) {
    if (SECTION_TITLES.has(line)) {
      currentSection = line;
      continue;
    }

    if (CONTEXT_TITLES.has(line)) {
      currentContext = line;
      continue;
    }

    const analyte = findAnalyte(line, currentContext);
    if (analyte) {
      const metric = finalizeBlock(currentBlock, meta.patientAgeYears);
      if (metric) {
        metrics.push(metric);
      }

      const remainder = line.slice(analyte.alias.length).trim();
      currentBlock = {
        analyte,
        clinicalSection: currentSection,
        lines: remainder ? [remainder] : [],
      };
      continue;
    }

    if (currentBlock) {
      currentBlock.lines.push(line);
    }
  }

  const finalMetric = finalizeBlock(currentBlock, meta.patientAgeYears);
  if (finalMetric) {
    metrics.push(finalMetric);
  }

  const uniqueMetrics = new Map<string, ParsedMetric>();
  for (const entry of metrics) {
    uniqueMetrics.set(entry.slug, entry);
  }

  return {
    ...meta,
    rawText: text,
    metrics: Array.from(uniqueMetrics.values()).filter((metric) =>
      ANALYTE_CATALOG.some((catalog) => catalog.name === metric.name),
    ),
  };
}
