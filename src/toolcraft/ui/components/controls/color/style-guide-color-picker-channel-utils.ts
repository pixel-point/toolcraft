import {
  clampNumber,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
} from "../../../lib/style-guide-color-utils";

export type ColorFormatMode = "hex" | "rgb" | "css" | "hsl" | "hsb";
export type ColorSurfaceModel = "rgb" | "hsl" | "hsb";

export type ColorChannels = {
  hex: string;
  rgb: [number, number, number];
  hsl: [number, number, number];
  hsb: [number, number, number];
};

function getRgbChannels(hex: string): [number, number, number] {
  const normalizedHex = normalizeHexColor(hex) ?? "#000000";
  const value = normalizedHex.slice(1);

  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function getHexChannel(value: number): string {
  return value.toString(16).padStart(2, "0");
}

export function rgbChannelsToHex([red, green, blue]: [number, number, number]): string {
  return `#${getHexChannel(red)}${getHexChannel(green)}${getHexChannel(blue)}`;
}

export function hslChannelsToHex([hue, saturation, lightness]: [number, number, number]): string {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const s = clampNumber(saturation, 0, 100) / 100;
  const l = clampNumber(lightness, 0, 100) / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const hueSegment = normalizedHue / 60;
  const x = chroma * (1 - Math.abs((hueSegment % 2) - 1));
  const match = l - chroma / 2;
  const [red, green, blue] = getHslRgbChannels(hueSegment, chroma, x);

  return rgbChannelsToHex([
    Math.round((red + match) * 255),
    Math.round((green + match) * 255),
    Math.round((blue + match) * 255),
  ]);
}

function getHslRgbChannels(hueSegment: number, chroma: number, x: number) {
  if (hueSegment < 1) return [chroma, x, 0] as const;
  if (hueSegment < 2) return [x, chroma, 0] as const;
  if (hueSegment < 3) return [0, chroma, x] as const;
  if (hueSegment < 4) return [0, x, chroma] as const;
  if (hueSegment < 5) return [x, 0, chroma] as const;

  return [chroma, 0, x] as const;
}

function getHslChannels([red, green, blue]: [number, number, number]): [number, number, number] {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return [
    Math.round(hexToHsv(rgbChannelsToHex([red, green, blue])).h),
    Math.round(saturation * 100),
    Math.round(lightness * 100),
  ];
}

export function getColorChannels(hex: string): ColorChannels {
  const normalizedHex = (normalizeHexColor(hex) ?? "#000000").toUpperCase();
  const rgb = getRgbChannels(normalizedHex);
  const hsv = hexToHsv(normalizedHex);

  return {
    hex: normalizedHex,
    rgb,
    hsl: getHslChannels(rgb),
    hsb: [Math.round(hsv.h), Math.round(hsv.s * 100), Math.round(hsv.v * 100)],
  };
}

export function getEditableChannelHex({
  channels,
  mode,
  channelIndex,
  rawValue,
}: {
  channels: ColorChannels;
  mode: ColorFormatMode;
  channelIndex: number;
  rawValue: string;
}): string | null {
  if (channelIndex > 2) return null;

  const parsedValue = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsedValue)) return null;

  if (mode === "rgb") return getEditableRgbHex(channels, channelIndex, parsedValue);
  if (mode === "hsl") return getEditableHslHex(channels, channelIndex, parsedValue);
  if (mode === "hsb") return getEditableHsbHex(channels, channelIndex, parsedValue);

  return null;
}

export function getColorSurfaceModel(mode: ColorFormatMode): ColorSurfaceModel {
  // Figma keeps Hex, RGB, and HSB on the hue/saturation/brightness surface.
  // HSL is the one editable format with a distinct saturation/lightness plane.
  return mode === "hsl" ? "hsl" : "hsb";
}

function getEditableRgbHex(
  channels: ColorChannels,
  channelIndex: number,
  parsedValue: number,
): string {
  const nextChannels: [number, number, number] = [...channels.rgb];
  nextChannels[channelIndex] = Math.round(clampNumber(parsedValue, 0, 255));

  return rgbChannelsToHex(nextChannels);
}

function getEditableHslHex(
  channels: ColorChannels,
  channelIndex: number,
  parsedValue: number,
): string {
  const nextChannels: [number, number, number] = [...channels.hsl];
  nextChannels[channelIndex] = Math.round(getClampedColorValue(channelIndex, parsedValue));

  return hslChannelsToHex(nextChannels);
}

function getEditableHsbHex(
  channels: ColorChannels,
  channelIndex: number,
  parsedValue: number,
): string {
  const nextChannels: [number, number, number] = [...channels.hsb];
  nextChannels[channelIndex] = Math.round(getClampedColorValue(channelIndex, parsedValue));

  return hsvToHex({
    h: nextChannels[0],
    s: nextChannels[1] / 100,
    v: nextChannels[2] / 100,
  });
}

function getClampedColorValue(channelIndex: number, parsedValue: number): number {
  return channelIndex === 0 ? clampNumber(parsedValue, 0, 360) : clampNumber(parsedValue, 0, 100);
}
