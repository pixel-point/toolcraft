import type { GradientStop, GradientType } from "../control-types";

export type IndexedGradientStop = GradientStop & { originalIndex: number };

export const maxGradientStops = 5;
export const minGradientStops = 2;
export const gradientTypeOptions = [
  { label: "Linear", value: "linear" },
  { label: "Radial", value: "radial" },
  { label: "Angular", value: "angular" },
  { label: "Diamond", value: "diamond" },
] as const satisfies readonly { label: string; value: GradientType }[];

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

export function getGradientType(type: GradientType | undefined): GradientType {
  return type ?? "linear";
}

export function getGradientAngle(angle: number | undefined): number {
  return typeof angle === "number" && Number.isFinite(angle) ? Math.round(angle) : 90;
}

export function normalizeGradientAngle(angle: string): number {
  const parsedValue = Number.parseFloat(angle);

  return Number.isFinite(parsedValue) ? Math.round(parsedValue) : 90;
}

export function parseStopPosition(position: string): number {
  const parsedValue = Number.parseFloat(position);

  return Number.isFinite(parsedValue) ? clamp(parsedValue / 100) : 0;
}

export function formatStopPosition(position: number): string {
  return `${Math.round(clamp(position) * 100)}%`;
}

export function parseStopOpacity(opacity: number | undefined): number {
  return clamp(opacity ?? 100, 0, 100);
}

export function normalizeStopOpacity(opacity: string): number {
  const parsedValue = Number.parseFloat(opacity);

  return Number.isFinite(parsedValue) ? Math.round(clamp(parsedValue, 0, 100)) : 100;
}

export function normalizeColorInput(value: string): string {
  const trimmedValue = value.trim();

  if (/^[\da-f]{6}$/i.test(trimmedValue)) {
    return `#${trimmedValue.toUpperCase()}`;
  }

  if (/^#[\da-f]{6}$/i.test(trimmedValue)) {
    return trimmedValue.toUpperCase();
  }

  return getNativeColorPickerValue(trimmedValue).toUpperCase();
}

export function formatColorInputValue(color: string): string {
  const normalizedColor = getNativeColorPickerValue(color).toUpperCase();

  return normalizedColor.slice(1);
}

export function getNativeColorPickerValue(color: string): string {
  const trimmedColor = color.trim();

  if (/^#[\da-f]{6}$/i.test(trimmedColor)) {
    return trimmedColor.toUpperCase();
  }

  if (/^[\da-f]{6}$/i.test(trimmedColor)) {
    return `#${trimmedColor.toUpperCase()}`;
  }

  return "#000000";
}

export function sortStops(stops: readonly GradientStop[]): GradientStop[] {
  return [...stops].sort(
    (left, right) => parseStopPosition(left.position) - parseStopPosition(right.position),
  );
}

export function getIndexedStops(stops: readonly GradientStop[]): IndexedGradientStop[] {
  return stops
    .map((stop, originalIndex) => ({ ...stop, originalIndex }))
    .sort((left, right) => parseStopPosition(left.position) - parseStopPosition(right.position));
}

export function getStopCssColor(stop: GradientStop): string {
  const opacity = parseStopOpacity(stop.opacity);

  if (opacity >= 100) {
    return stop.color;
  }

  return `color-mix(in oklab, ${stop.color} ${opacity}%, transparent)`;
}

function getGradientStopList(stops: readonly GradientStop[]): string {
  return sortStops(stops)
    .map(
      (stop) => `${getStopCssColor(stop)} ${formatStopPosition(parseStopPosition(stop.position))}`,
    )
    .join(", ");
}

export function getGradientBackground(
  type: GradientType,
  stops: readonly GradientStop[],
  angle = 90,
): string {
  const stopList = getGradientStopList(stops);
  const gradientAngle = getGradientAngle(angle);

  switch (type) {
    case "angular":
      return `conic-gradient(from 90deg, ${stopList})`;
    case "diamond":
      return `radial-gradient(closest-corner at 50% 50%, ${stopList})`;
    case "radial":
      return `radial-gradient(circle at 50% 50%, ${stopList})`;
    case "linear":
      return `linear-gradient(${gradientAngle}deg, ${stopList})`;
  }
}

export function getNextGradientType(type: GradientType): GradientType {
  const typeIndex = gradientTypeOptions.findIndex((option) => option.value === type);
  const nextOption = gradientTypeOptions[(typeIndex + 1) % gradientTypeOptions.length];

  return nextOption?.value ?? "linear";
}

export function isButtonTarget(target: EventTarget): boolean {
  return target instanceof HTMLElement && target.closest("button") !== null;
}

export function getPositionFromTrack(track: HTMLDivElement | null, clientX: number): string {
  const rect = track?.getBoundingClientRect();

  if (!rect) {
    return "0%";
  }

  return formatStopPosition((clientX - rect.left) / rect.width);
}

export function updateStopAt(
  stops: readonly GradientStop[],
  index: number,
  nextStop: Partial<GradientStop>,
): GradientStop[] {
  return stops.map((stop, stopIndex) => (stopIndex === index ? { ...stop, ...nextStop } : stop));
}

export function addGradientStop(
  stops: readonly GradientStop[],
  activeStop: GradientStop | null,
  position: string,
): { nextStop: GradientStop; nextStops: GradientStop[] } {
  const nextStop = {
    color: getNativeColorPickerValue(activeStop?.color ?? "#D9D9D9"),
    opacity: parseStopOpacity(activeStop?.opacity),
    position,
  };

  return { nextStop, nextStops: sortStops([...stops, nextStop]) };
}

export function removeGradientStop(stops: readonly GradientStop[], index: number): GradientStop[] {
  return stops.filter((_, stopIndex) => stopIndex !== index);
}

export function reverseGradientStops(stops: readonly GradientStop[]): GradientStop[] {
  return sortStops(
    stops.map((stop) => ({
      ...stop,
      position: formatStopPosition(1 - parseStopPosition(stop.position)),
    })),
  );
}
