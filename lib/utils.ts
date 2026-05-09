import { clsx } from "clsx";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function slugify(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseEuropeanNumber(value: string) {
  const match = value.match(/-?\d+(?:[.,]\d+)?/);

  if (!match) {
    return null;
  }

  return Number(match[0].replace(",", "."));
}

export function formatDelta(delta: number | null, unit: string | null) {
  if (delta === null) {
    return "—";
  }

  const prefix = delta > 0 ? "+" : "";
  const rounded = Math.abs(delta) >= 10 ? delta.toFixed(1) : delta.toFixed(2);

  return `${prefix}${rounded}${unit ? ` ${unit}` : ""}`;
}

export function formatPercentDelta(percent: number | null) {
  if (percent === null || !Number.isFinite(percent)) {
    return null;
  }

  const prefix = percent > 0 ? "+" : "";
  return `${prefix}${percent.toFixed(1)}%`;
}
