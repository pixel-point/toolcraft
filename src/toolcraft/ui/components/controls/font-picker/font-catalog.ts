import catalogJson from "./font-catalog.json";

export type FontPickerFontCategory =
  | "display"
  | "handwriting"
  | "monospace"
  | "sans-serif"
  | "serif";

export type FontPickerFontFilterValue = "all" | FontPickerFontCategory;

export type FontPickerFontCatalogEntry = {
  category: FontPickerFontCategory;
  family: string;
  id: string;
  nextImport: string;
  subsets: string[];
  weights: string[];
};

const defaultFontId = "inter";

export const FONT_PICKER_FILTER_OPTIONS: Array<{
  label: string;
  value: FontPickerFontFilterValue;
}> = [
  { label: "All", value: "all" },
  { label: "Sans", value: "sans-serif" },
  { label: "Serif", value: "serif" },
  { label: "Display", value: "display" },
  { label: "Mono", value: "monospace" },
  { label: "Script", value: "handwriting" },
];

const fontCatalog: FontPickerFontCatalogEntry[] = (
  catalogJson as FontPickerFontCatalogEntry[]
).map((entry) => ({
  ...entry,
  subsets: Array.from(
    new Set(entry.subsets.map((value) => value.trim()).filter(Boolean)),
  ),
  weights: Array.from(
    new Set(entry.weights.map((value) => value.trim()).filter(Boolean)),
  ),
}));

const fontById = new Map(fontCatalog.map((entry) => [entry.id, entry]));

export function getFontPickerCatalog(): readonly FontPickerFontCatalogEntry[] {
  return fontCatalog;
}

export function getDefaultFontPickerFontId(): string {
  return fontById.has(defaultFontId)
    ? defaultFontId
    : (fontCatalog[0]?.id ?? defaultFontId);
}

export function getFontPickerFontById(
  fontId: string | null | undefined,
): FontPickerFontCatalogEntry | null {
  if (typeof fontId !== "string") {
    return null;
  }

  const normalized = fontId.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  return fontById.get(normalized) ?? null;
}

export function resolveFontPickerFontId(fontId: string | null | undefined): string {
  return getFontPickerFontById(fontId)?.id ?? getDefaultFontPickerFontId();
}

export function filterFontPickerFonts(
  searchText: string,
  category: FontPickerFontFilterValue = "all",
): readonly FontPickerFontCatalogEntry[] {
  const query = searchText.trim().toLowerCase();

  return fontCatalog.filter((entry) => {
    if (category !== "all" && entry.category !== category) {
      return false;
    }

    if (!query) {
      return true;
    }

    return entry.family.toLowerCase().includes(query) || entry.id.includes(query);
  });
}

function toCssFamilyToken(value: string): string {
  return value.trim().replace(/\s+/g, "+");
}

function resolveWeightAxis(entry: FontPickerFontCatalogEntry): string {
  if (!entry.weights.length) {
    return "400";
  }

  return Array.from(new Set(entry.weights)).join(";");
}

export function buildFontPickerGoogleStylesheetHref(
  entry: FontPickerFontCatalogEntry,
): string {
  const family = toCssFamilyToken(entry.family);
  const weightAxis = resolveWeightAxis(entry);

  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weightAxis}&display=swap`;
}
