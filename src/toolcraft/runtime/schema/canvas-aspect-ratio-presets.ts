import type { ToolcraftCanvasSize } from "./types";

export type ToolcraftCanvasAspectRatioPresetValue =
  | "1:1"
  | "3:2"
  | "16:9"
  | "3:4"
  | "9:16"
  | "2:3"
  | "4:3";

export type ToolcraftCanvasAspectRatioPreset = {
  height: number;
  ratioHeight: number;
  ratioWidth: number;
  value: ToolcraftCanvasAspectRatioPresetValue;
  width: number;
};

export const toolcraftCanvasAspectRatioPresets = [
  { height: 1080, ratioHeight: 1, ratioWidth: 1, value: "1:1", width: 1080 },
  { height: 1080, ratioHeight: 2, ratioWidth: 3, value: "3:2", width: 1620 },
  { height: 1080, ratioHeight: 9, ratioWidth: 16, value: "16:9", width: 1920 },
  { height: 1440, ratioHeight: 4, ratioWidth: 3, value: "3:4", width: 1080 },
  { height: 1920, ratioHeight: 16, ratioWidth: 9, value: "9:16", width: 1080 },
  { height: 1620, ratioHeight: 3, ratioWidth: 2, value: "2:3", width: 1080 },
  { height: 1080, ratioHeight: 3, ratioWidth: 4, value: "4:3", width: 1440 },
] as const satisfies readonly ToolcraftCanvasAspectRatioPreset[];

export const toolcraftCanvasAspectRatioPresetValues = new Set<string>(
  toolcraftCanvasAspectRatioPresets.map((preset) => preset.value),
);

export function getToolcraftCanvasAspectRatioPreset(
  value: string,
): ToolcraftCanvasAspectRatioPreset | null {
  return (
    toolcraftCanvasAspectRatioPresets.find((preset) => preset.value === value) ?? null
  );
}

export function getToolcraftCanvasAspectRatioPresetBySize(
  size: ToolcraftCanvasSize,
): ToolcraftCanvasAspectRatioPreset | null {
  return (
    toolcraftCanvasAspectRatioPresets.find(
      (preset) => preset.width === size.width && preset.height === size.height,
    ) ?? null
  );
}
