export function clampSliderValue(
  value: number,
  min: number,
  max: number,
): number {
  return Math.min(max, Math.max(min, value));
}

export function getDecimalPrecision(step: number): number {
  return String(step).split(".")[1]?.length ?? 0;
}

export function formatSliderValue(value: number, step: number): string {
  const decimals = getDecimalPrecision(step);
  const rounded = Number(value.toFixed(decimals));

  return String(rounded);
}

const compactSliderValueUnits = new Set([
  "%",
  "°",
  "px",
  "em",
  "rem",
  "vw",
  "vh",
  "vmin",
  "vmax",
  "s",
  "ms",
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getSliderValueUnitSeparator(unit: string): "" | " " {
  const normalizedUnit = unit.trim();

  if (
    normalizedUnit === "" ||
    compactSliderValueUnits.has(normalizedUnit) ||
    /^[^\p{Letter}\p{Number}]+$/u.test(normalizedUnit)
  ) {
    return "";
  }

  return " ";
}

export function applySliderValueLabelUnit(
  valueLabel: string,
  unit?: string,
): string {
  const normalizedUnit = unit?.trim();

  if (
    !normalizedUnit ||
    typeof parseSliderValueLabel(valueLabel) !== "number"
  ) {
    return valueLabel;
  }

  const separator = getSliderValueUnitSeparator(normalizedUnit);
  const unitPattern = new RegExp(
    `(-?\\d+(?:\\.\\d+)?)(?:\\s*${escapeRegExp(normalizedUnit)})?`,
    "g",
  );

  return valueLabel.replaceAll(
    unitPattern,
    (_match, value: string) => `${value}${separator}${normalizedUnit}`,
  );
}

export function formatSliderValueWithUnit(
  value: number,
  step: number,
  unit?: string,
): string {
  return applySliderValueLabelUnit(formatSliderValue(value, step), unit);
}

export function parseSliderValueLabel(valueLabel: string): number | undefined {
  const match = valueLabel.match(/-?\d+(?:\.\d+)?/);
  const parsedValue = match ? Number.parseFloat(match[0]) : Number.NaN;

  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function getSliderControlValue(
  nextValue: number | readonly number[],
): number | undefined {
  const resolvedValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;

  return typeof resolvedValue === "number" ? resolvedValue : undefined;
}
