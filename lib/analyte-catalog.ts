import { normalizeText, slugify } from "@/lib/utils";

type CatalogEntry = {
  name: string;
  aliases: string[];
  category: string;
  statusStrategy?: "default" | "below-threshold-bad";
};

export const ANALYTE_CATALOG: CatalogEntry[] = [
  { name: "Eritrócitos", aliases: ["Eritrócitos"], category: "Hemograma" },
  { name: "Hemoglobina", aliases: ["Hemoglobina"], category: "Hemograma" },
  { name: "Hematócrito", aliases: ["Hematócrito"], category: "Hemograma" },
  { name: "Volume Globular Médio", aliases: ["Volume Globular Médio"], category: "Hemograma" },
  { name: "Hemoglobina Globular Média", aliases: ["Hemoglobina Globular Média"], category: "Hemograma" },
  { name: "Concentração de Hemoglobina Globular Média", aliases: ["Concentração de Hemoglobina Globular Média"], category: "Hemograma" },
  { name: "Índice de Dispersão Eritrocitária", aliases: ["Índice de Dispersão Eritrocitária"], category: "Hemograma" },
  { name: "Leucócitos", aliases: ["Leucócitos"], category: "Hemograma" },
  { name: "Neutrófilos", aliases: ["Neutrófilos"], category: "Hemograma" },
  { name: "Eosinófilos", aliases: ["Eosinófilos"], category: "Hemograma" },
  { name: "Basófilos", aliases: ["Basófilos"], category: "Hemograma" },
  { name: "Linfócitos", aliases: ["Linfócitos"], category: "Hemograma" },
  { name: "Monócitos", aliases: ["Monócitos"], category: "Hemograma" },
  { name: "NLR (Rel.Neutrófilos/Linfócitos)", aliases: ["NLR (Rel.Neutrófilos/Linfócitos)"], category: "Inflamação" },
  { name: "MLR (Rel.Monócitos/Linfócitos)", aliases: ["MLR (Rel.Monócitos/Linfócitos)"], category: "Inflamação" },
  { name: "Plaquetas", aliases: ["Plaquetas"], category: "Hemograma" },
  { name: "Plaquetócrito", aliases: ["Plaquetócrito"], category: "Hemograma" },
  { name: "Volume Plaquetário Médio", aliases: ["Volume Plaquetário Médio"], category: "Hemograma" },
  { name: "Índice de Dispersão Plaquetária", aliases: ["Índice de Dispersão Plaquetária"], category: "Hemograma" },
  { name: "Ferro Sérico", aliases: ["Ferro Sérico"], category: "Vitaminas & Minerais" },
  { name: "Ferritina", aliases: ["Ferritina"], category: "Vitaminas & Minerais" },
  { name: "Ácido Fólico", aliases: ["Ácido Fólico"], category: "Vitaminas & Minerais" },
  { name: "Vitamina B12", aliases: ["Vitamina B12"], category: "Vitaminas & Minerais" },
  { name: "Vitamina D3 - 25-Hidroxicolecalciferol", aliases: ["Vitamina D3 - 25-Hidroxicolecalciferol"], category: "Vitaminas & Minerais" },
  { name: "Magnésio", aliases: ["Magnésio"], category: "Vitaminas & Minerais" },
  { name: "Glicose", aliases: ["Glicose"], category: "Glicose" },
  { name: "Ureia", aliases: ["Ureia"], category: "Rim" },
  { name: "Creatinina", aliases: ["Creatinina"], category: "Rim" },
  { name: "eGFR-MDRD (18-70 anos)", aliases: ["eGFR-MDRD (18-70 anos)", "eGFR-MDRD"], category: "Rim" },
  { name: "eGFR-CKD-EPI 2009 (18-70 anos)", aliases: ["eGFR-CKD-EPI 2009 (18-70 anos)", "eGFR-CKD-EPI 2009"], category: "Rim" },
  { name: "Bilirrubina Total", aliases: ["Total"], category: "Fígado" },
  { name: "Bilirrubina Directa/Conjugada", aliases: ["Directa/Conjugada"], category: "Fígado" },
  { name: "Bilirrubina Indirecta / Não conjugada", aliases: ["Indirecta / Não conjugada"], category: "Fígado" },
  { name: "Aspartato Aminotransferase - ASAT / TGO", aliases: ["Aspartato Aminotransferase - ASAT / TGO"], category: "Fígado" },
  { name: "Alanina Aminotransferase - ALAT / TGP", aliases: ["Alanina Aminotransferase - ALAT / TGP"], category: "Fígado" },
  { name: "Gama-Glutamiltransferase - GGT", aliases: ["Gama-Glutamiltransferase - GGT"], category: "Fígado" },
  { name: "Fosfatase Alcalina", aliases: ["Fosfatase Alcalina"], category: "Fígado" },
  { name: "Colesterol Total", aliases: ["Colesterol Total"], category: "Colesterol" },
  { name: "Colesterol não HDL", aliases: ["Colesterol não HDL"], category: "Colesterol" },
  { name: "Trigliceridos", aliases: ["Trigliceridos"], category: "Colesterol" },
  { name: "Indice Aterogénico do plasma", aliases: ["Indice Aterogénico do plasma"], category: "Colesterol" },
  { name: "Lipoproteína HDLc", aliases: ["Lipoproteína HDLc"], category: "Colesterol" },
  { name: "Lipoproteína LDLc", aliases: ["Lipoproteína LDLc"], category: "Colesterol" },
  { name: "Proteínas Totais", aliases: ["Proteínas Totais"], category: "Proteínas" },
  { name: "Albumina", aliases: ["Albumina"], category: "Proteínas" },
  { name: "Alfa-1-Globulina", aliases: ["Alfa-1-Globulina"], category: "Proteínas" },
  { name: "Alfa-2-Globulina", aliases: ["Alfa-2-Globulina"], category: "Proteínas" },
  { name: "Beta-Globulina", aliases: ["Beta-Globulina"], category: "Proteínas" },
  { name: "Gama-Globulina", aliases: ["Gama-Globulina"], category: "Proteínas" },
  { name: "Relação Albumina/Globulina", aliases: ["Relação Albumina/Globulina"], category: "Proteínas" },
  { name: "Imunoglobulina A", aliases: ["Imunoglobulina A"], category: "Imunologia" },
  { name: "Imunoglobulina G", aliases: ["Imunoglobulina G"], category: "Imunologia" },
  { name: "Imunoglobulina M", aliases: ["Imunoglobulina M"], category: "Imunologia" },
  { name: "Imunoglobulina E, IgE Total", aliases: ["Imunoglobulina E, IgE Total"], category: "Imunologia" },
  { name: "Dermatophagoides pteronyssinus, IgE Específica", aliases: ["Dermatophagoides pteronyssinus, IgE Específica"], category: "Imunologia" },
  { name: "Dermatophagoides farinae, IgE Específica", aliases: ["Dermatophagoides farinae, IgE Específica"], category: "Imunologia" },
  { name: "Blomia tropicalis, IgE Específica", aliases: ["Blomia tropicalis, IgE Específica"], category: "Imunologia" },
  { name: "Lepidoglyphus destructor, IgE Específica", aliases: ["Lepidoglyphus destructor, IgE Específica"], category: "Imunologia" },
  { name: "Pêlo de cão, IgE Específica", aliases: ["Pêlo de cão, IgE Específica"], category: "Imunologia" },
  { name: "Alergeno Recombinante do Dermatophagoides pteronyssinus (Der p 1), IgE Específica", aliases: ["Alergeno Recombinante do Dermatophagoides pteronyssinus (Der p 1), IgE Específica"], category: "Imunologia" },
  { name: "Alergeno Recombinante do Dermatophagoides pteronyssinus (Der p 2), IgE Específica", aliases: ["Alergeno Recombinante do Dermatophagoides pteronyssinus (Der p 2), IgE Específica"], category: "Imunologia" },
  { name: "Alergeno Recombinante da Alternaria alternata (Alt a 1), IgE Específica", aliases: ["Alergeno Recombinante da Alternaria alternata (Alt a 1), IgE Específica"], category: "Imunologia" },
  { name: "Alternaria alternata - A.tenuis, IgE Específica", aliases: ["Alternaria alternata - A.tenuis, IgE Específica"], category: "Imunologia" },
  { name: "Hepatite B - VHB, AgHBs", aliases: ["Hepatite B - VHB, AgHBs"], category: "Imunologia" },
  {
    name: "Hepatite B - VHB, AcHBs",
    aliases: ["Hepatite B - VHB, AcHBs"],
    category: "Imunologia",
    statusStrategy: "below-threshold-bad",
  },
  { name: "Hepatite B - VHB, AcHBc Total", aliases: ["Hepatite B - VHB, AcHBc Total"], category: "Imunologia" },
  { name: "Hepatite B - VHB, AgHBe", aliases: ["Hepatite B - VHB, AgHBe"], category: "Imunologia" },
  { name: "Hepatite B - VHB, AcHBe", aliases: ["Hepatite B - VHB, AcHBe"], category: "Imunologia" },
  { name: "Hepatite C - AcVHC", aliases: ["Hepatite C - AcVHC"], category: "Imunologia" },
];

export const SECTION_TITLES = new Set(["Hematologia", "Bioquímica", "Imunologia"]);
export const CONTEXT_TITLES = new Set(["Bilirrubinas", "Proteínas, Electroforese", "Imunoglobulinas"]);

const aliasIndex = ANALYTE_CATALOG.flatMap((entry) =>
  entry.aliases.map((alias) => ({
    alias,
    normalizedAlias: normalizeText(alias),
    name: entry.name,
    slug: slugify(entry.name),
    category: entry.category,
    statusStrategy: entry.statusStrategy ?? "default",
  })),
).sort((left, right) => right.normalizedAlias.length - left.normalizedAlias.length);

export function findAnalyte(line: string, context: string | null) {
  const normalized = normalizeText(line);

  for (const entry of aliasIndex) {
    if (normalized.startsWith(entry.normalizedAlias)) {
      if (entry.alias === "Total" && context !== "Bilirrubinas") {
        continue;
      }

      if (entry.alias === "Directa/Conjugada" && context !== "Bilirrubinas") {
        continue;
      }

      if (entry.alias === "Indirecta / Não conjugada" && context !== "Bilirrubinas") {
        continue;
      }

      return entry;
    }
  }

  return null;
}
