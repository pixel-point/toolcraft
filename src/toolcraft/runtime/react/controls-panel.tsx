"use client";

import * as React from "react";
import { ArrowCounterClockwiseIcon, DiamondIcon } from "@phosphor-icons/react";
import {
  Actions,
  AnchorGrid,
  Button,
  ChannelMixer,
  Checkbox,
  CodeTextarea,
  CollectionActions,
  Color,
  ColorOpacity,
  ControlInlineGroup,
  ControlFieldLabelActionProvider,
  ControlFieldLabelHelpProvider,
  Curves,
  FileDrop,
  FontPicker,
  Gradient,
  ImagePicker,
  Palette,
  Panel,
  PanelActions,
  PanelSection,
  type PanelActionObjectOption,
  RangeInput,
  RangeSlider,
  Segmented,
  Select,
  Slider,
  Switch,
  TextInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Vector,
  type ChannelMixerValues,
  type ControlChangeMeta,
  type ColorControlInput,
  type ColorControlInputPair,
  type ColorOpacityValue,
  type CurveInterpolation,
  type FontPickerValue,
  type FileDropPreview,
  type GradientStop,
  type GradientType,
  type ImagePickerItem,
  type VectorPadCoordinateMode,
  type VectorPadVariant,
} from "@/toolcraft/ui";

import type {
  ToolcraftActionCommand,
  ToolcraftActionSchema,
  ToolcraftControlConditionSchema,
  ToolcraftControlLayoutGroupSchema,
  ToolcraftControlSectionSchema,
  ToolcraftControlSchema,
  ResolvedToolcraftAppSchema,
} from "../schema/types";
import {
  getToolcraftCanvasAspectRatioPreset,
  toolcraftCanvasAspectRatioPresets,
} from "../schema/canvas-aspect-ratio-presets";
import { getToolcraftControlKeyframeCapability } from "../schema/keyframe-capability";
import {
  getToolcraftCanvasSizeTargetDimension,
  isToolcraftRuntimeOwnedTarget,
  isToolcraftTimelinePanelExtendedTarget,
  isToolcraftTimelinePanelVisibleTarget,
} from "../schema/runtime-targets";
import type {
  ToolcraftCommand,
  ToolcraftPanelState,
  ToolcraftState,
} from "../state/types";
import {
  isToolcraftImageFile,
  readImportedFile,
  readImportedImageFile,
} from "./media-file";
import { PanelContainer } from "./panel-host";
import type { PanelPlacement, PanelStateChange } from "./panel-host-types";
import type { ToolcraftControlRendererMap } from "./control-renderers";
import {
  downloadToolcraftSettings,
  importToolcraftSettings,
} from "./settings-transfer";
import {
  readToolcraftLocalStorageValue,
  removeToolcraftLocalStorageValue,
} from "./storage-key-migration";
import { useToolcraft } from "./use-toolcraft";

export type ControlsPanelProps = {
  className?: string;
  controlRenderers?: ToolcraftControlRendererMap;
  framed?: boolean;
  onPanelAction?: ToolcraftPanelActionHandler;
  onPanelStateChange?: PanelStateChange;
  panelPlacement?: PanelPlacement;
  panelState?: ToolcraftPanelState;
};

export type ToolcraftPanelActionContext = {
  action: ToolcraftActionSchema;
  dispatch: React.Dispatch<ToolcraftCommand>;
  reportProgress: (progress: number) => void;
  state: ToolcraftState;
};

export type ToolcraftPanelActionHandler = (
  context: ToolcraftPanelActionContext,
) => PromiseLike<unknown> | void;

type AnyRecord = Record<string, unknown>;
type ControlEntry = [string, ToolcraftControlSchema];
type ControlRenderGroup =
  | { entries: readonly ControlEntry[]; kind: "colorGroup" }
  | { entry: ControlEntry; kind: "control" };
type RenderedControlRenderGroup = {
  ids: readonly string[];
  node: React.ReactNode;
};
type FooterActionProgressEntry = {
  id: number;
  progress: number | null;
};
type CanvasAspectRatioValue = {
  height: number;
  mode: "custom" | "preset";
  value: string;
  width: number;
};

const hiddenDiscreteMarkerCount = 2;
const controlsPanelSectionCollapseStorageVersion = 1;
const canvasAspectRatioOptions = [
  ...toolcraftCanvasAspectRatioPresets.map((preset) => ({
    label: preset.value,
    value: preset.value,
  })),
  { label: "Custom...", value: "custom" },
] as const;

const sectionedCompoundControlTypes = new Set([
  "channelMixer",
  "collectionActions",
  "fontPicker",
  "gradient",
  "palette",
]);

const defaultGradientStops = [
  { color: "#FFFFFF", position: "0%" },
  { color: "#7CFF3A", position: "46%" },
  { color: "#111111", position: "100%" },
] as const satisfies readonly GradientStop[];

const defaultChannelMixerValues = {
  B: { B: 100, G: 0, R: 0 },
  G: { B: 0, G: 100, R: 0 },
  R: { B: 0, G: 0, R: 100 },
} satisfies ChannelMixerValues;

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

function noopReportProgress(): void {}

function clampFooterActionProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.max(0, Math.min(1, progress));
}

function canCreateControlKeyframe(control: ToolcraftControlSchema): boolean {
  return getToolcraftControlKeyframeCapability(control).capable;
}

function shouldRenderCompoundControlSectionDivider(
  control: ToolcraftControlSchema,
): boolean {
  if (control.type === "curves") {
    return control.variant !== "single";
  }

  return sectionedCompoundControlTypes.has(control.type);
}

function withCompoundControlSectionDivider({
  children,
  control,
}: {
  children: React.ReactNode;
  control: ToolcraftControlSchema;
}): React.ReactNode {
  if (!shouldRenderCompoundControlSectionDivider(control)) {
    return children;
  }

  return (
    <div className="contents" data-control-section-divider="compound">
      {children}
    </div>
  );
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function valuesEqual(first: unknown, second: unknown): boolean {
  if (Object.is(first, second)) {
    return true;
  }

  if (
    (typeof first !== "object" || first === null) &&
    (typeof second !== "object" || second === null)
  ) {
    return false;
  }

  try {
    return JSON.stringify(first) === JSON.stringify(second);
  } catch {
    return false;
  }
}

function valuesInclude(value: unknown, options: readonly unknown[]): boolean {
  return options.some((option) => valuesEqual(value, option));
}

function readComparableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numberValue = Number(value.trim());

    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return null;
}

function compareConditionNumbers(
  value: unknown,
  expected: number | undefined,
  comparator: (value: number, expected: number) => boolean,
): boolean | null {
  if (typeof expected !== "number" || !Number.isFinite(expected)) {
    return null;
  }

  const numberValue = readComparableNumber(value);

  return numberValue === null ? false : comparator(numberValue, expected);
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  return typeof value === "number" && Number.isFinite(value) ? String(value) : fallback;
}

function parseCanvasAspectRatioOption(value: string): CanvasAspectRatioValue | null {
  const preset = getToolcraftCanvasAspectRatioPreset(value);

  if (preset) {
    return {
      height: preset.ratioHeight,
      mode: "preset",
      value: preset.value,
      width: preset.ratioWidth,
    };
  }

  const match = /^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/u.exec(value);

  if (!match) {
    return null;
  }

  const width = Number.parseFloat(match[1] ?? "");
  const height = Number.parseFloat(match[2] ?? "");

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return {
    height: Math.round(height),
    mode: "custom",
    value: `${Math.round(width)}:${Math.round(height)}`,
    width: Math.round(width),
  };
}

function asCanvasAspectRatioValue(
  value: unknown,
  fallback: unknown,
): CanvasAspectRatioValue {
  if (isRecord(value)) {
    const width = asNumber(value.width, NaN);
    const height = asNumber(value.height, NaN);
    const mode = value.mode === "preset" ? "preset" : "custom";

    if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
      return {
        height: Math.round(height),
        mode,
        value:
          typeof value.value === "string"
            ? value.value
            : `${Math.round(width)}:${Math.round(height)}`,
        width: Math.round(width),
      };
    }
  }

  if (typeof value === "string") {
    const parsed = parseCanvasAspectRatioOption(value);

    if (parsed) {
      return parsed;
    }
  }

  if (fallback !== value) {
    return asCanvasAspectRatioValue(fallback, {
      height: 1,
      mode: "preset",
      value: "1:1",
      width: 1,
    });
  }

  return {
    height: 1,
    mode: "preset",
    value: "1:1",
    width: 1,
  };
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getPanelActionButtonVariant(
  variant: ToolcraftActionSchema["variant"],
): PanelActionObjectOption["variant"] {
  switch (variant) {
    case "destructive":
    case "ghost":
    case "link":
    case "outline":
    case "secondary":
      return variant;
    default:
      return "default";
  }
}

function asNumberArray(value: unknown, fallback: readonly number[]): readonly number[] {
  return Array.isArray(value) && value.every((item) => typeof item === "number")
    ? value
    : fallback;
}

function asRangeInputValue(value: unknown): { end: string; start: string } {
  if (isRecord(value)) {
    return {
      end: asString(value.end, "100%"),
      start: asString(value.start, "0%"),
    };
  }

  return { end: "100%", start: "0%" };
}

function asVectorValue(value: unknown): { x: string; y: string } {
  if (isRecord(value)) {
    return {
      x: asString(value.x, "0.00"),
      y: asString(value.y, "0.00"),
    };
  }

  return { x: "0.00", y: "0.00" };
}

function asVectorPadVariant(value: string | undefined): VectorPadVariant {
  if (
    value === "whiteBalance" ||
    value === "colorBalance" ||
    value === "chromaOffset" ||
    value === "toneBias"
  ) {
    return value;
  }

  return "default";
}

function asVectorPadCoordinateMode(
  value: string | undefined,
  padVariant: VectorPadVariant,
): VectorPadCoordinateMode {
  if (value === "cartesian" || value === "screen") {
    return value;
  }

  return padVariant === "default" ? "screen" : "cartesian";
}

function asCurveInterpolation(value: string | undefined): CurveInterpolation | undefined {
  return value === "monotone" || value === "smooth" ? value : undefined;
}

function formatControlValueLabel(
  control: ToolcraftControlSchema,
  value: unknown,
): string {
  if (typeof control.valueLabel === "string") {
    return control.valueLabel;
  }

  switch (control.type) {
    case "aspectRatio":
      return asCanvasAspectRatioValue(value, control.defaultValue).value;
    case "checkbox":
    case "switch":
      return asBoolean(value) ? "On" : "Off";
    case "color":
      return asColorValue(value).hex;
    case "colorOpacity": {
      const colorOpacityValue = asColorOpacityValue(value);

      return `${colorOpacityValue.hex} ${colorOpacityValue.opacity}%`;
    }
    case "collectionActions":
      return `${asCollectionItems(value, control.defaultValue).length} items`;
    case "fontPicker":
      return asFontPickerValue(value).fontId;
    case "gradient":
      return `${asGradientValue(value).stops.length} stops`;
    case "imagePicker":
      return (
        control.items?.find((item) => item.value === value)?.alt ??
        asString(value)
      );
    case "palette": {
      if (isRecord(value)) {
        const family = asString(value.family);
        const shade = asString(value.shade);

        return [family, shade].filter(Boolean).join(" ") || "Palette";
      }

      return "Palette";
    }
    case "rangeInput": {
      const rangeValue = asRangeInputValue(value);

      return `${rangeValue.start} – ${rangeValue.end}`;
    }
    case "rangeSlider": {
      const rangeValue = asNumberArray(value, []);

      return rangeValue.length > 0
        ? rangeValue.map((item) => `${item}${control.unit ?? ""}`).join(" – ")
        : "Range";
    }
    case "select":
    case "segmented":
      return (
        control.options?.find((option) => option.value === value)?.label ??
        asString(value)
      );
    case "slider":
      return `${asNumber(value, asNumber(control.defaultValue, control.min ?? 0))}${
        control.unit ?? ""
      }`;
    case "vector": {
      const vectorValue = asVectorValue(value);

      return `${vectorValue.x}, ${vectorValue.y}`;
    }
    default:
      return typeof value === "string" || typeof value === "number"
        ? String(value)
        : control.type;
  }
}

function asColorValue(value: unknown): { hex: string } {
  if (typeof value === "string") {
    return { hex: value };
  }

  if (isRecord(value)) {
    return { hex: asString(value.hex, "#C1FF00") };
  }

  return { hex: "#C1FF00" };
}

function asColorOpacityValue(value: unknown): ColorOpacityValue {
  if (typeof value === "string") {
    return { hex: value, opacity: 100 };
  }

  if (isRecord(value)) {
    return {
      hex: asString(value.hex, "#C1FF00"),
      opacity: Math.min(100, Math.max(0, Math.round(asNumber(value.opacity, 100)))),
    };
  }

  return { hex: "#C1FF00", opacity: 100 };
}

function asCollectionItems(value: unknown, fallback: unknown): unknown[] {
  if (Array.isArray(value)) {
    return [...value];
  }

  return Array.isArray(fallback) ? [...fallback] : [];
}

function getCollectionMinItems(control: ToolcraftControlSchema): number {
  return Math.max(0, Math.floor(asNumber(control.minItems, 0)));
}

function getCollectionHardMaxItems(control: ToolcraftControlSchema): number | null {
  if (typeof control.hardMaxItems !== "number" || !Number.isFinite(control.hardMaxItems)) {
    return null;
  }

  return Math.max(0, Math.floor(control.hardMaxItems));
}

function getCollectionItemType(control: ToolcraftControlSchema): string {
  return control.itemControl?.type ?? "color";
}

function getCollectionItemBaseLabel(control: ToolcraftControlSchema): string {
  if (control.itemLabel) {
    return control.itemLabel;
  }

  const label = control.itemControl?.label;

  return typeof label === "string" ? label : "Item";
}

function getCollectionItemName(
  control: ToolcraftControlSchema,
  index: number,
): string {
  const label = control.itemControl?.label;

  if (label === false) {
    return "";
  }

  return `${getCollectionItemBaseLabel(control)} ${index + 1}`;
}

function getCollectionItemDefaultValue(control: ToolcraftControlSchema): unknown {
  if ("itemDefaultValue" in control) {
    return control.itemDefaultValue;
  }

  if (typeof control.itemControl?.defaultValue !== "undefined") {
    return control.itemControl.defaultValue;
  }

  switch (getCollectionItemType(control)) {
    case "color":
      return { hex: "#C1FF00" };
    case "colorOpacity":
      return { hex: "#C1FF00", opacity: 100 };
    case "fontPicker":
      return asFontPickerValue(control.itemControl?.defaultValue);
    case "checkbox":
    case "switch":
      return false;
    case "rangeInput":
      return { end: "100%", start: "0%" };
    case "select":
    case "segmented":
      return control.itemControl?.options?.[0]?.value ?? "";
    case "slider":
      return control.itemControl?.min ?? 0;
    case "text":
      return "";
    default:
      return "";
  }
}

function asGradientType(value: unknown): GradientType {
  return value === "linear" ||
    value === "radial" ||
    value === "angular" ||
    value === "diamond"
    ? value
    : "linear";
}

function asGradientValue(value: unknown): {
  angle: number;
  gradientType: GradientType;
  stops: readonly GradientStop[];
} {
  if (isRecord(value)) {
    return {
      angle: asNumber(value.angle, 90),
      gradientType: asGradientType(value.gradientType),
      stops: Array.isArray(value.stops)
        ? (value.stops as readonly GradientStop[])
        : defaultGradientStops,
    };
  }

  return {
    angle: 90,
    gradientType: "linear",
    stops: defaultGradientStops,
  };
}

function asFontPickerValue(value: unknown): FontPickerValue {
  if (typeof value === "string") {
    return {
      color: "#FFFFFF",
      fontId: value,
      fontSize: 16,
      fontWeight: "400",
      letterSpacing: "normal",
      lineHeight: "normal",
      opacity: 100,
      textCase: "original",
    };
  }

  if (isRecord(value)) {
    return {
      color: asString(value.color, "#FFFFFF"),
      fontId: asString(value.fontId, "inter"),
      fontSize: asNumber(value.fontSize, 16),
      fontWeight: asString(value.fontWeight, "400"),
      letterSpacing:
        value.letterSpacing === "tighter" ||
        value.letterSpacing === "tight" ||
        value.letterSpacing === "normal" ||
        value.letterSpacing === "wide" ||
        value.letterSpacing === "wider" ||
        value.letterSpacing === "widest"
          ? value.letterSpacing
          : "normal",
      lineHeight:
        value.lineHeight === "none" ||
        value.lineHeight === "tight" ||
        value.lineHeight === "snug" ||
        value.lineHeight === "normal" ||
        value.lineHeight === "relaxed" ||
        value.lineHeight === "loose"
          ? value.lineHeight
          : "normal",
      opacity: Math.min(100, Math.max(0, Math.round(asNumber(value.opacity, 100)))),
      textCase:
        value.textCase === "original" ||
        value.textCase === "uppercase" ||
        value.textCase === "lowercase" ||
        value.textCase === "capitalize" ||
        value.textCase === "titleCase"
          ? value.textCase
          : "original",
    };
  }

  return {
    color: "#FFFFFF",
    fontId: "inter",
    fontSize: 16,
    fontWeight: "400",
    letterSpacing: "normal",
    lineHeight: "normal",
    opacity: 100,
    textCase: "original",
  };
}

function CanvasAspectRatioControl({
  defaultValue,
  name,
  onValueChange,
  value,
}: {
  defaultValue: unknown;
  name: string;
  onValueChange?: (
    value: CanvasAspectRatioValue,
    meta?: ControlChangeMeta,
  ) => void;
  value: unknown;
}): React.JSX.Element {
  const ratio = asCanvasAspectRatioValue(value, defaultValue);
  const selectedValue = ratio.mode === "custom" ? "custom" : ratio.value;

  function commitRatio(
    nextRatio: CanvasAspectRatioValue,
    meta?: ControlChangeMeta,
  ): void {
    onValueChange?.(nextRatio, meta);
  }

  function updatePreset(nextValue: string): void {
    if (nextValue === "custom") {
      commitRatio({
        height: ratio.height,
        mode: "custom",
        value: `${ratio.width}:${ratio.height}`,
        width: ratio.width,
      });
      return;
    }

    const nextRatio = parseCanvasAspectRatioOption(nextValue);

    if (nextRatio) {
      commitRatio(nextRatio);
    }
  }

  function updateCustomDimension(
    dimension: "height" | "width",
    nextValue: string,
    meta?: ControlChangeMeta,
  ): void {
    const numberValue = Number.parseFloat(nextValue);

    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      return;
    }

    const width =
      dimension === "width" ? Math.max(1, Math.round(numberValue)) : ratio.width;
    const height =
      dimension === "height" ? Math.max(1, Math.round(numberValue)) : ratio.height;

    commitRatio(
      {
        height,
        mode: "custom",
        value: `${width}:${height}`,
        width,
      },
      meta,
    );
  }

  return (
    <div className="min-w-0 space-y-2" data-slot="canvas-aspect-ratio-control">
      <Select
        name={name}
        onValueChange={updatePreset}
        options={canvasAspectRatioOptions}
        value={selectedValue}
      />
      {ratio.mode === "custom" ? (
        <TextInput
          inputs={[
            {
              commitOnBlur: true,
              defaultValue: String(ratio.width),
              name: "Width",
              onValueChange: (nextValue, meta) =>
                updateCustomDimension("width", nextValue, meta),
              value: String(ratio.width),
            },
            {
              commitOnBlur: true,
              defaultValue: String(ratio.height),
              name: "Height",
              onValueChange: (nextValue, meta) =>
                updateCustomDimension("height", nextValue, meta),
              value: String(ratio.height),
            },
          ]}
          inputsPerRow={2}
        />
      ) : null}
    </div>
  );
}

function asActionSchemas(
  actions: readonly (ToolcraftActionSchema | string)[] | undefined,
): readonly ToolcraftActionSchema[] {
  return (actions ?? []).map((action) =>
    typeof action === "string"
      ? {
          label: action,
          value: action,
        }
      : action,
  );
}

function getActionCommand(action: ToolcraftActionSchema): ToolcraftActionCommand | null {
  if (action.command) {
    return action.command;
  }

  switch (action.value.toLowerCase()) {
    case "apply":
      return "controls.apply";
    case "reset":
      return "controls.reset";
    default:
      return null;
  }
}

function getActionLabel(action: ToolcraftActionSchema): string {
  return action.label ?? action.value;
}

function isExportPanelAction(action: ToolcraftActionSchema): boolean {
  const label = getActionLabel(action);
  const value = action.value;

  return (
    /\bexport\b/i.test(label) ||
    /(?:^|[._:-])export(?:[._:-]|$)/i.test(value) ||
    /^export(?:[._:-]|$)/i.test(value)
  );
}

function getPanelActionIcon(
  action: ToolcraftActionSchema,
): PanelActionObjectOption["icon"] {
  return isExportPanelAction(action) ? "upload-simple" : action.icon;
}

function getControlName(id: string, label: boolean | string | undefined): string {
  if (typeof label === "string") {
    return label;
  }

  return id;
}

function ControlKeyframeButton({
  active,
  name,
  onClick,
}: {
  active: boolean;
  name: string;
  onClick: () => void;
}): React.JSX.Element {
  const label = active ? `Disable ${name} keyframes` : `Add ${name} keyframe`;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "size-4 opacity-100 transition-opacity duration-150 ease-out hover:!bg-transparent active:!bg-transparent aria-pressed:!bg-transparent data-popup-open:!bg-transparent [&_svg:not([class*='size-'])]:!size-2.5 [&_svg:not([class*='size-'])]:!opacity-70 data-[icon-active=true]:[&_svg:not([class*='size-'])]:!opacity-100",
              active &&
                "!text-[color:var(--link)] aria-pressed:!text-[color:var(--link)] data-popup-open:!text-[color:var(--link)] [&_svg]:!text-[color:var(--link)] [&_svg]:!fill-[color:var(--link)]",
            )}
            data-icon-active={active}
            onClick={(event) => {
              event.stopPropagation();
              onClick();

              if (typeof event.currentTarget.blur === "function") {
                event.currentTarget.blur();
              }
            }}
            size="icon-sm"
            style={active ? { color: "var(--link)" } : undefined}
            type="button"
            variant="ghost-static"
          />
        }
      >
        <DiamondIcon weight={active ? "fill" : "regular"} />
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

function getControlRenderGroups(entries: readonly ControlEntry[]): ControlRenderGroup[] {
  const groups: ControlRenderGroup[] = [];
  let index = 0;

  while (index < entries.length) {
    const entry = entries[index];

    if (!entry) {
      index += 1;
      continue;
    }

    if (entry[1].type !== "color") {
      groups.push({ entry, kind: "control" });
      index += 1;
      continue;
    }

    const colorEntries: ControlEntry[] = [];

    while (entries[index]?.[1].type === "color") {
      const colorEntry = entries[index];

      if (colorEntry) {
        colorEntries.push(colorEntry);
      }

      index += 1;
    }

    for (let colorIndex = 0; colorIndex < colorEntries.length; colorIndex += 2) {
      const firstEntry = colorEntries[colorIndex];
      const secondEntry = colorEntries[colorIndex + 1];

      if (firstEntry && secondEntry) {
        groups.push({ entries: [firstEntry, secondEntry], kind: "colorGroup" });
      } else if (firstEntry) {
        groups.push({ entry: firstEntry, kind: "control" });
      }
    }
  }

  return groups;
}

function getControlRenderGroupIds(group: ControlRenderGroup): readonly string[] {
  return group.kind === "colorGroup"
    ? group.entries.map(([id]) => id)
    : [group.entry[0]];
}

function countControlsByType(
  sections: readonly ToolcraftControlSectionSchema[],
  type: string,
): number {
  return sections.reduce(
    (count, section) =>
      count +
      Object.values(section.controls).filter((control) => control.type === type)
        .length,
    0,
  );
}

function shouldCommitTextControlOnBlur(control: ToolcraftControlSchema): boolean {
  return (
    control.commitMode === "setting" ||
    Boolean(getToolcraftCanvasSizeTargetDimension(control.target))
  );
}

function isColorFieldControl(control: ToolcraftControlSchema | undefined): boolean {
  return control?.type === "color" || control?.type === "colorOpacity";
}

function isColorOnlySection(entries: readonly ControlEntry[]): boolean {
  return entries.length > 0 && entries.every(([, control]) => isColorFieldControl(control));
}

function getRenderedControlsSectionTitle(
  section: ToolcraftControlSectionSchema,
): ToolcraftControlSectionSchema["title"] {
  return isStickyFooterActionSection(section) ? undefined : section.title;
}

function isRuntimeSetupSection({
  entries,
  section,
}: {
  entries: readonly ControlEntry[];
  section: ToolcraftControlSectionSchema;
}): boolean {
  return (
    section.title === "Setup" &&
    entries.some(([, control]) => isToolcraftRuntimeOwnedTarget(control.target))
  );
}

function isStickyFooterActionSection(section: ToolcraftControlSectionSchema): boolean {
  return (
    section.actionGroup !== undefined &&
    Object.values(section.controls).some((control) => control.type === "panelActions")
  );
}

function getControlsPanelSectionCollapseKey({
  entries,
  section,
  sectionIndex,
}: {
  entries: readonly ControlEntry[];
  section: ToolcraftControlSectionSchema;
  sectionIndex: number;
}): string {
  const targets = entries.map(([id, control]) => `${id}:${control.target}`).join("|");

  return `${section.title ?? "section"}:${sectionIndex}:${targets}`;
}

function hashStorageKeyPart(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function getControlsPanelSectionCollapseStorageKey(
  schema: ResolvedToolcraftAppSchema,
): string | null {
  const controlsPanel = schema.panels.controls;

  if (!controlsPanel) {
    return null;
  }

  const appIdentity =
    schema.persistence.storage === "localStorage"
      ? `persistence:${schema.persistence.key}:v${schema.persistence.version}`
      : JSON.stringify({
          sections: controlsPanel.sections.map((section) => ({
            controls: Object.entries(section.controls).map(([id, control]) => ({
              id,
              label: control.label,
              target: control.target,
              type: control.type,
            })),
            title: section.title,
          })),
          title: controlsPanel.title,
        });

  return `toolcraft:ui:controls-panel-sections:${hashStorageKeyPart(appIdentity)}:v${controlsPanelSectionCollapseStorageVersion}`;
}

function readControlsPanelCollapsedSections(
  storageKey: string | null,
): Record<string, boolean> {
  if (!storageKey || typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = readToolcraftLocalStorageValue(storageKey);

    if (!rawValue) {
      return {};
    }

    const payload: unknown = JSON.parse(rawValue);

    if (
      !payload ||
      typeof payload !== "object" ||
      !("version" in payload) ||
      payload.version !== controlsPanelSectionCollapseStorageVersion ||
      !("collapsed" in payload) ||
      !Array.isArray(payload.collapsed)
    ) {
      return {};
    }

    return Object.fromEntries(
      payload.collapsed
        .filter((item): item is string => typeof item === "string" && item.length > 0)
        .map((item) => [item, true]),
    );
  } catch {
    return {};
  }
}

function writeControlsPanelCollapsedSections(
  storageKey: string | null,
  collapsedSectionByKey: Record<string, boolean>,
): void {
  if (!storageKey || typeof window === "undefined") {
    return;
  }

  const collapsed = Object.entries(collapsedSectionByKey)
    .filter(([, collapsedValue]) => collapsedValue)
    .map(([key]) => key);

  try {
    if (collapsed.length === 0) {
      removeToolcraftLocalStorageValue(storageKey);
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        collapsed,
        version: controlsPanelSectionCollapseStorageVersion,
      }),
    );
  } catch {
    // UI preferences are best-effort; panel interaction stays authoritative.
  }
}

function shouldShowColorFieldLabel({
  control,
  sectionHasOnlyColorFields,
}: {
  control: ToolcraftControlSchema;
  sectionHasOnlyColorFields: boolean;
}): boolean {
  return control.label !== false && !sectionHasOnlyColorFields;
}

function hasColorOpacityControl(
  controlsById: Record<string, ToolcraftControlSchema>,
  layoutGroup: ToolcraftControlLayoutGroupSchema,
): boolean {
  return layoutGroup.controls.some(
    (controlId) => controlsById[controlId]?.type === "colorOpacity",
  );
}

function hasSliderControl(
  controlsById: Record<string, ToolcraftControlSchema>,
  layoutGroup: ToolcraftControlLayoutGroupSchema,
): boolean {
  return layoutGroup.controls.some(
    (controlId) =>
      controlsById[controlId]?.type === "slider" ||
      controlsById[controlId]?.type === "rangeSlider",
  );
}

function hasSegmentedControl(
  controlsById: Record<string, ToolcraftControlSchema>,
  layoutGroup: ToolcraftControlLayoutGroupSchema,
): boolean {
  return layoutGroup.controls.some(
    (controlId) => controlsById[controlId]?.type === "segmented",
  );
}

function hasSectionedCompoundControl(
  controlsById: Record<string, ToolcraftControlSchema>,
  layoutGroup: ToolcraftControlLayoutGroupSchema,
): boolean {
  return layoutGroup.controls.some((controlId) => {
    const control = controlsById[controlId];

    return control ? shouldRenderCompoundControlSectionDivider(control) : false;
  });
}

const maxInlineSwitchLabelLength = 16;
const maxInlineSwitchLabelWordCount = 2;

function isInlineSwitchLabelSafe(
  controlId: string,
  control: ToolcraftControlSchema,
): boolean {
  const label = getControlName(controlId, control.label).trim();
  const wordCount = label.split(/\s+/u).filter(Boolean).length;

  return label.length <= maxInlineSwitchLabelLength && wordCount <= maxInlineSwitchLabelWordCount;
}

function hasUnsafeInlineSwitchLabels(
  controlsById: Record<string, ToolcraftControlSchema>,
  layoutGroup: ToolcraftControlLayoutGroupSchema,
): boolean {
  const switchEntries = layoutGroup.controls
    .map((controlId) => [controlId, controlsById[controlId]] as const)
    .filter(
      (entry): entry is readonly [string, ToolcraftControlSchema] =>
        Boolean(entry[1]) && entry[1].type === "switch",
    );

  return (
    switchEntries.length > 1 &&
    switchEntries.some(([controlId, control]) => !isInlineSwitchLabelSafe(controlId, control))
  );
}

function isBooleanControl(control: ToolcraftControlSchema | undefined): boolean {
  return control?.type === "checkbox" || control?.type === "switch";
}

function isToggleParameterLayoutGroup(
  controlsById: Record<string, ToolcraftControlSchema>,
  layoutGroup: ToolcraftControlLayoutGroupSchema,
): boolean {
  if (layoutGroup.controls.length !== 2) {
    return false;
  }

  const controls = layoutGroup.controls.map((controlId) => controlsById[controlId]);
  const booleanControlCount = controls.filter((control) => isBooleanControl(control)).length;
  const parameterControlCount = controls.filter((control) => !isBooleanControl(control)).length;

  return booleanControlCount === 1 && parameterControlCount === 1;
}

function shouldHideToggleParameterControlLabel({
  control,
  controlsById,
  layoutGroup,
}: {
  control: ToolcraftControlSchema;
  controlsById: Record<string, ToolcraftControlSchema>;
  layoutGroup: ToolcraftControlLayoutGroupSchema | undefined;
}): boolean {
  return Boolean(
    layoutGroup &&
      isToggleParameterLayoutGroup(controlsById, layoutGroup) &&
      !isBooleanControl(control),
  );
}

function getControlTargetEntityKey(control: ToolcraftControlSchema): string | null {
  const parts = control.target.split(".");

  if (parts.length < 2) {
    return null;
  }

  return parts.slice(0, -1).join(".");
}

function shouldAutoInlineBooleanPair(
  controlsById: Record<string, ToolcraftControlSchema>,
  firstId: string,
  secondId: string,
): boolean {
  const firstControl = controlsById[firstId];
  const secondControl = controlsById[secondId];

  if (!isBooleanControl(firstControl) || !isBooleanControl(secondControl)) {
    return false;
  }

  if (
    !isInlineSwitchLabelSafe(firstId, firstControl) ||
    !isInlineSwitchLabelSafe(secondId, secondControl)
  ) {
    return false;
  }

  const firstEntityKey = getControlTargetEntityKey(firstControl);
  const secondEntityKey = getControlTargetEntityKey(secondControl);

  return firstEntityKey !== null && firstEntityKey === secondEntityKey;
}

function getAutoInlineBooleanLayoutGroups({
  controlsById,
  renderedGroups,
  reservedControlIds,
}: {
  controlsById: Record<string, ToolcraftControlSchema>;
  renderedGroups: readonly RenderedControlRenderGroup[];
  reservedControlIds: ReadonlySet<string>;
}): ToolcraftControlLayoutGroupSchema[] {
  const layoutGroups: ToolcraftControlLayoutGroupSchema[] = [];
  let index = 0;

  while (index < renderedGroups.length) {
    const firstIds = renderedGroups[index]?.ids;
    const secondIds = renderedGroups[index + 1]?.ids;
    const firstId = firstIds?.length === 1 ? firstIds[0] : undefined;
    const secondId = secondIds?.length === 1 ? secondIds[0] : undefined;

    if (
      firstId &&
      secondId &&
      !reservedControlIds.has(firstId) &&
      !reservedControlIds.has(secondId) &&
      shouldAutoInlineBooleanPair(controlsById, firstId, secondId)
    ) {
      layoutGroups.push({
        columns: 2,
        controls: [firstId, secondId],
        layout: "inline",
      });
      index += 2;
      continue;
    }

    index += 1;
  }

  return layoutGroups;
}

function getControlMarkerCount(
  control: ToolcraftControlSchema,
  markerLimit?: number,
): number | undefined {
  const markerCount = control.markerCount;

  if (
    markerLimit &&
    control.variant === "discrete" &&
    typeof markerCount === "number" &&
    markerCount > markerLimit
  ) {
    return hiddenDiscreteMarkerCount;
  }

  return markerCount;
}

function renderControlLayoutGroups({
  controlsById,
  layoutGroups,
  renderedGroups,
}: {
  controlsById: Record<string, ToolcraftControlSchema>;
  layoutGroups?: readonly ToolcraftControlLayoutGroupSchema[];
  renderedGroups: readonly RenderedControlRenderGroup[];
}): React.ReactNode[] {
  if (!layoutGroups?.length) {
    const autoLayoutGroups = getAutoInlineBooleanLayoutGroups({
      controlsById,
      renderedGroups,
      reservedControlIds: new Set(),
    });

    if (autoLayoutGroups.length === 0) {
      return renderedGroups.map((group) => group.node);
    }

    return renderControlLayoutGroups({
      controlsById,
      layoutGroups: autoLayoutGroups,
      renderedGroups,
    });
  }

  const reservedControlIds = new Set(layoutGroups.flatMap((group) => group.controls));
  const resolvedLayoutGroups = [
    ...layoutGroups,
    ...getAutoInlineBooleanLayoutGroups({
      controlsById,
      renderedGroups,
      reservedControlIds,
    }),
  ];
  const layoutGroupByControlId = getInlineLayoutGroupByControlId({
    controlsById,
    layoutGroups: resolvedLayoutGroups,
  });

  const nodes: React.ReactNode[] = [];

  for (const renderedGroup of renderedGroups) {
    const layoutGroup = renderedGroup.ids
      .map((id) => layoutGroupByControlId.get(id))
      .find((group): group is ToolcraftControlLayoutGroupSchema => Boolean(group));

    if (!layoutGroup) {
      nodes.push(renderedGroup.node);
      continue;
    }

    const groupedRenderedControls = renderedGroups.filter((candidate) =>
      candidate.ids.some((id) => layoutGroup.controls.includes(id)),
    );
    const firstGroupedControl = groupedRenderedControls[0];

    if (firstGroupedControl !== renderedGroup) {
      continue;
    }

    if (groupedRenderedControls.length < 2) {
      nodes.push(renderedGroup.node);
      continue;
    }

    nodes.push(
      <ControlInlineGroup
        columns={layoutGroup.columns ?? 2}
        kind={
          isToggleParameterLayoutGroup(controlsById, layoutGroup)
            ? "toggleParameter"
            : "default"
        }
        key={`layout-group-${layoutGroup.controls.join("-")}`}
      >
        {groupedRenderedControls.map((group) => group.node)}
      </ControlInlineGroup>,
    );
  }

  return nodes;
}

function getInlineLayoutGroupByControlId({
  controlsById,
  layoutGroups,
}: {
  controlsById: Record<string, ToolcraftControlSchema>;
  layoutGroups?: readonly ToolcraftControlLayoutGroupSchema[];
}): Map<string, ToolcraftControlLayoutGroupSchema> {
  const layoutGroupByControlId = new Map<string, ToolcraftControlLayoutGroupSchema>();

  for (const layoutGroup of layoutGroups ?? []) {
    if (layoutGroup.layout !== "inline") {
      continue;
    }

    if (
      hasColorOpacityControl(controlsById, layoutGroup) ||
      hasSliderControl(controlsById, layoutGroup) ||
      hasSegmentedControl(controlsById, layoutGroup) ||
      hasSectionedCompoundControl(controlsById, layoutGroup) ||
      hasUnsafeInlineSwitchLabels(controlsById, layoutGroup)
    ) {
      continue;
    }

    for (const controlId of layoutGroup.controls) {
      layoutGroupByControlId.set(controlId, layoutGroup);
    }
  }

  return layoutGroupByControlId;
}

export function ControlsPanel({
  className,
  controlRenderers,
  framed = true,
  onPanelAction,
  onPanelStateChange,
  panelPlacement,
  panelState,
}: ControlsPanelProps): React.JSX.Element | null {
  const { dispatch, state } = useToolcraft();
  const nextFooterActionIdRef = React.useRef(0);
  const [footerActionProgressEntries, setFooterActionProgressEntries] = React.useState<
    readonly FooterActionProgressEntry[]
  >([]);
  const sectionCollapseStorageKey = React.useMemo(
    () => getControlsPanelSectionCollapseStorageKey(state.schema),
    [state.schema],
  );
  const [collapsedSectionByKey, setCollapsedSectionByKey] = React.useState<
    Record<string, boolean>
  >(() => readControlsPanelCollapsedSections(sectionCollapseStorageKey));
  const stickyFooterProgress = React.useMemo(() => {
    for (let index = footerActionProgressEntries.length - 1; index >= 0; index -= 1) {
      const progress = footerActionProgressEntries[index]?.progress;

      if (typeof progress === "number") {
        return progress;
      }
    }

    return null;
  }, [footerActionProgressEntries]);
  const controlsPanel = state.schema.panels.controls;
  const keyframedControlIds = React.useMemo(
    () => new Set(state.timeline.keyframeGroups.map((group) => group.controlId)),
    [state.timeline.keyframeGroups],
  );
  const keyframeControlsEnabled = Boolean(
    state.schema.assembly.capabilities.includes("timeline.keyframes") &&
      state.timeline.expanded,
  );

  React.useEffect(() => {
    setCollapsedSectionByKey(readControlsPanelCollapsedSections(sectionCollapseStorageKey));
  }, [sectionCollapseStorageKey]);

  if (!controlsPanel) {
    return null;
  }

  const resolvedControlsPanel = controlsPanel;
  const placement = panelPlacement ?? (framed ? "frame" : "surface");
  const lastHistoryPatch = state.history.undo.at(-1);
  const controlsResetKey =
    lastHistoryPatch?.label === "Reset controls" ? state.history.undo.length : 0;

  function dispatchCommand(command: ToolcraftCommand): void {
    dispatch(command);
  }

  function setControlValue(
    target: string,
    value: unknown,
    label?: string,
    meta?: ControlChangeMeta,
  ): void {
    dispatchCommand({
      history: meta?.history,
      historyGroup: meta?.historyGroup,
      label,
      target,
      type: "controls.setValue",
      value,
    });
  }

  function createFooterActionProgressTracker(): {
    reportProgress: (progress: number) => void;
    trackResult: (result: PromiseLike<unknown> | void) => void;
  } {
    const id = nextFooterActionIdRef.current;
    nextFooterActionIdRef.current += 1;

    let latestProgress: number | null = null;
    let isTracked = false;

    function reportProgress(progress: number): void {
      latestProgress = clampFooterActionProgress(progress);

      if (!isTracked) {
        return;
      }

      setFooterActionProgressEntries((entries) =>
        entries.map((entry) =>
          entry.id === id ? { ...entry, progress: latestProgress } : entry,
        ),
      );
    }

    function trackResult(result: PromiseLike<unknown> | void): void {
      if (!isPromiseLike(result)) {
        return;
      }

      isTracked = true;
      setFooterActionProgressEntries((entries) => [
        ...entries,
        { id, progress: latestProgress },
      ]);

      void Promise.resolve(result)
        .catch((error: unknown) => {
          console.error("Toolcraft panel action failed.", error);
        })
        .finally(() => {
          setFooterActionProgressEntries((entries) =>
            entries.filter((entry) => entry.id !== id),
          );
        });
    }

    return { reportProgress, trackResult };
  }

  function runAction(
    action: ToolcraftActionSchema,
    options: { trackFooterPending?: boolean } = {},
  ): void {
    const command = action.command ?? (onPanelAction ? null : getActionCommand(action));

    if (command) {
      dispatchCommand({ type: command });
      return;
    }

    const footerActionProgressTracker = options.trackFooterPending
      ? createFooterActionProgressTracker()
      : null;
    const result = onPanelAction?.({
      action,
      dispatch,
      reportProgress:
        footerActionProgressTracker?.reportProgress ?? noopReportProgress,
      state,
    });

    footerActionProgressTracker?.trackResult(result);
  }

  function getControlValue(control: ToolcraftControlSchema): unknown {
    const canvasSizeDimension = getToolcraftCanvasSizeTargetDimension(control.target);

    if (isToolcraftTimelinePanelExtendedTarget(control.target)) {
      return state.panels.timeline.extended === true;
    }

    if (isToolcraftTimelinePanelVisibleTarget(control.target)) {
      return state.panels.timeline.hidden !== true;
    }

    return canvasSizeDimension
      ? state.canvas.size[canvasSizeDimension]
      : (state.values[control.target] ?? control.defaultValue);
  }

  function getControlDefaultValueByTarget(target: string): unknown {
    for (const section of resolvedControlsPanel.sections) {
      for (const control of Object.values(section.controls)) {
        if (control.target === target) {
          return control.defaultValue;
        }
      }
    }

    return undefined;
  }

  function getTargetValue(target: string): unknown {
    const canvasSizeDimension = getToolcraftCanvasSizeTargetDimension(target);

    if (isToolcraftTimelinePanelExtendedTarget(target)) {
      return state.panels.timeline.extended === true;
    }

    if (isToolcraftTimelinePanelVisibleTarget(target)) {
      return state.panels.timeline.hidden !== true;
    }

    return canvasSizeDimension
      ? state.canvas.size[canvasSizeDimension]
      : (state.values[target] ?? getControlDefaultValueByTarget(target));
  }

  function conditionMatches(condition: ToolcraftControlConditionSchema): boolean {
    const value = getTargetValue(condition.target);
    const matches: boolean[] = [];

    if ("equals" in condition) {
      matches.push(valuesEqual(value, condition.equals));
    }

    if ("notEquals" in condition) {
      matches.push(!valuesEqual(value, condition.notEquals));
    }

    if (Array.isArray(condition.oneOf)) {
      matches.push(valuesInclude(value, condition.oneOf));
    }

    if (Array.isArray(condition.notOneOf)) {
      matches.push(!valuesInclude(value, condition.notOneOf));
    }

    const greaterThan = compareConditionNumbers(
      value,
      condition.greaterThan,
      (numberValue, expected) => numberValue > expected,
    );
    const greaterThanOrEqual = compareConditionNumbers(
      value,
      condition.greaterThanOrEqual,
      (numberValue, expected) => numberValue >= expected,
    );
    const lessThan = compareConditionNumbers(
      value,
      condition.lessThan,
      (numberValue, expected) => numberValue < expected,
    );
    const lessThanOrEqual = compareConditionNumbers(
      value,
      condition.lessThanOrEqual,
      (numberValue, expected) => numberValue <= expected,
    );

    for (const match of [
      greaterThan,
      greaterThanOrEqual,
      lessThan,
      lessThanOrEqual,
    ]) {
      if (match !== null) {
        matches.push(match);
      }
    }

    return matches.length > 0 && matches.every(Boolean);
  }

  function isControlDisabled(control: ToolcraftControlSchema): boolean {
    if (control.disabled) {
      return true;
    }

    return control.disabledWhen ? conditionMatches(control.disabledWhen) : false;
  }

  function isControlVisible(control: ToolcraftControlSchema): boolean {
    return control.visibleWhen ? conditionMatches(control.visibleWhen) : true;
  }

  function isSectionVisible(section: ToolcraftControlSectionSchema): boolean {
    return section.visibleWhen ? conditionMatches(section.visibleWhen) : true;
  }

  function getVisibleSectionEntries(
    section: ToolcraftControlSectionSchema,
  ): ControlEntry[] {
    return Object.entries(section.controls).filter(([, control]) =>
      isControlVisible(control),
    );
  }

  function getControlsRecord(
    entries: readonly ControlEntry[],
  ): Record<string, ToolcraftControlSchema> {
    return Object.fromEntries(entries);
  }

  function getSelectedControlKeyframeTime(controlId: string): number | undefined {
    const selectedKeyframeId = state.timeline.selectedKeyframeId;

    if (!selectedKeyframeId) {
      return undefined;
    }

    const selectedKeyframe = state.timeline.keyframeGroups
      .find((group) => group.controlId === controlId)
      ?.keyframes.find((keyframe) => keyframe.id === selectedKeyframeId);

    return selectedKeyframe?.timeSeconds;
  }

  function maybeUpsertControlKeyframe(
    control: ToolcraftControlSchema,
    name: string,
    value: unknown,
  ): void {
    if (
      !keyframeControlsEnabled ||
      !keyframedControlIds.has(control.target) ||
      !canCreateControlKeyframe(control)
    ) {
      return;
    }

    dispatchCommand({
      controlId: control.target,
      controlLabel: name,
      timeSeconds: getSelectedControlKeyframeTime(control.target),
      type: "timeline.upsertControlKeyframe",
      value,
      valueLabel: formatControlValueLabel(control, value),
    });
  }

  function getKeyframeLabelAction(
    control: ToolcraftControlSchema,
    name: string,
    value: unknown,
  ): React.ReactNode {
    if (!keyframeControlsEnabled || !canCreateControlKeyframe(control)) {
      return null;
    }

    return (
      <ControlKeyframeButton
        active={keyframedControlIds.has(control.target)}
        name={name}
        onClick={() => {
          dispatchCommand({
            controlId: control.target,
            controlLabel: name,
            type: "timeline.toggleControlKeyframes",
            value,
            valueLabel: formatControlValueLabel(control, value),
          });
        }}
      />
    );
  }

  function withKeyframeLabelAction({
    children,
    control,
    disableAction = false,
    labelActionName,
    name,
    providerKey,
    value,
  }: {
    children: React.ReactNode;
    control: ToolcraftControlSchema;
    disableAction?: boolean;
    labelActionName?: string;
    name: string;
    providerKey: string;
    value: unknown;
  }): React.ReactNode {
    if (disableAction) {
      return children;
    }

    const actionName = labelActionName ?? name;
    const action = getKeyframeLabelAction(control, actionName, value);

    if (!action) {
      return children;
    }

    return (
      <ControlFieldLabelActionProvider
        action={action}
        key={providerKey}
        label={actionName}
      >
        {children}
      </ControlFieldLabelActionProvider>
    );
  }

  function normalizeControlHelpContext(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function isColorSectionTitle(sectionTitle: string | undefined): boolean {
    return /\b(colou?rs?|palette|palettes|shades?|accents?)\b/i.test(
      sectionTitle ?? "",
    );
  }

  function isSequentialColorLabel(label: string): boolean {
    return /^colou?r\s+\d+$/i.test(label.trim());
  }

  function isSimplePaletteDistributionLabel(label: string): boolean {
    return /^(spread|mix|distribution)$/i.test(label.trim());
  }

  function isGenericControlHelpDescription(description: string): boolean {
    return /^(adjusts?|changes?|chooses?|controls?|defines?|selects?|sets?|updates?)\b/i.test(
      description.trim(),
    );
  }

  function shouldSuppressObviousControlHelp({
    control,
    description,
    label,
    sectionTitle,
  }: {
    control: ToolcraftControlSchema;
    description: string;
    label: string;
    sectionTitle: string | undefined;
  }): boolean {
    const isColorControl = control.type === "color" || control.type === "colorOpacity";

    if (isColorSectionTitle(sectionTitle)) {
      if (isColorControl && isSequentialColorLabel(label)) {
        return true;
      }

      if (
        isSimplePaletteDistributionLabel(label) &&
        isGenericControlHelpDescription(description)
      ) {
        return true;
      }
    }

    const normalizedDescription = normalizeControlHelpContext(description);
    const normalizedLabel = normalizeControlHelpContext(label);

    return (
      Boolean(normalizedLabel) &&
      isGenericControlHelpDescription(description) &&
      normalizedDescription === normalizedLabel
    );
  }

  function getControlHelpText({
    control,
    label,
    sectionTitle,
  }: {
    control: ToolcraftControlSchema;
    label: string;
    sectionTitle: string | undefined;
  }): string | null {
    const description = control.description?.trim();

    if (!description) {
      return null;
    }

    if (
      shouldSuppressObviousControlHelp({
        control,
        description,
        label,
        sectionTitle,
      })
    ) {
      return null;
    }

    return description;
  }

  function withControlLabelHelp({
    children,
    control,
    label,
    providerKey,
    sectionTitle,
  }: {
    children: React.ReactNode;
    control: ToolcraftControlSchema;
    label: string;
    providerKey: string;
    sectionTitle: string | undefined;
  }): React.ReactNode {
    if (control.label === false) {
      return children;
    }

    const help = getControlHelpText({ control, label, sectionTitle });

    if (!help) {
      return children;
    }

    return (
      <ControlFieldLabelHelpProvider
        help={help}
        key={`${providerKey}-help`}
        label={label}
      >
        {children}
      </ControlFieldLabelHelpProvider>
    );
  }

  function getSectionHeaderKeyframeEntry(
    entries: readonly ControlEntry[],
    title: React.ReactNode,
  ): ControlEntry | null {
    if (typeof title !== "string") {
      return null;
    }

    const matchingTitleEntry = entries.find(([id, control]) => {
      if (control.type === "channelMixer" || control.type === "curves") {
        return false;
      }

      const name = getControlName(id, control.label);

      return name === title && canCreateControlKeyframe(control);
    });

    if (matchingTitleEntry) {
      return matchingTitleEntry;
    }

    return null;
  }

  function getSectionHeaderKeyframeAction(entry: ControlEntry): React.ReactNode {
    const [id, control] = entry;
    const name = getControlName(id, control.label);

    return getKeyframeLabelAction(control, name, getControlValue(control));
  }

  function getSectionResetAction({
    sectionTitle,
    targets,
  }: {
    sectionTitle: string;
    targets: readonly string[];
  }): React.ReactNode {
    const label = `Reset ${sectionTitle} section`;

    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={label}
              data-control-section-reset-button=""
              onClick={() => {
                dispatchCommand({
                  label,
                  targets: Array.from(new Set(targets)),
                  type: "controls.resetTargets",
                });
              }}
              size="icon-sm"
              type="button"
              variant="ghost"
            />
          }
        >
          <ArrowCounterClockwiseIcon />
        </TooltipTrigger>
        <TooltipContent side="top">{label}</TooltipContent>
      </Tooltip>
    );
  }

  function renderColorGroup(
    entries: readonly ControlEntry[],
    headerKeyframeTarget: string | null,
    sectionHasOnlyColorFields: boolean,
  ): React.JSX.Element | null {
    const colorInputs = entries.map(([id, control]) => {
      const name = getControlName(id, control.label);
      const value = getControlValue(control);
      const colorValue = asColorValue(value);

      return {
        hex: colorValue.hex,
        name,
        onValueChange: (nextValue, meta) => {
          setControlValue(control.target, nextValue, name, meta);
          maybeUpsertControlKeyframe(control, name, nextValue);
        },
        showLabel: shouldShowColorFieldLabel({
          control,
          sectionHasOnlyColorFields,
        }),
      } satisfies ColorControlInput;
    });
    const [firstInput, secondInput] = colorInputs;

    if (!firstInput) {
      return null;
    }

    if (!secondInput) {
      const firstEntry = entries[0];
      const firstControl = firstEntry?.[1];
      const firstValue = firstControl ? getControlValue(firstControl) : undefined;

      return firstControl ? (
        withKeyframeLabelAction({
          children: (
            <Color
              hex={firstInput.hex}
              key={firstInput.name}
              name={firstInput.name}
              onValueChange={firstInput.onValueChange}
              showLabel={shouldShowColorFieldLabel({
                control: firstControl,
                sectionHasOnlyColorFields,
              })}
            />
          ),
          control: firstControl,
          disableAction: firstControl.target === headerKeyframeTarget,
          name: firstInput.name,
          providerKey: firstInput.name,
          value: firstValue,
        }) as React.JSX.Element
      ) : (
        <Color
          hex={firstInput.hex}
          key={firstInput.name}
          name={firstInput.name}
          onValueChange={firstInput.onValueChange}
          showLabel={firstInput.showLabel}
        />
      );
    }

    return (
      <Color
        inputs={[firstInput, secondInput] as ColorControlInputPair}
        key={`${firstInput.name}-${secondInput.name}`}
      />
    );
  }

  function renderCollectionActionsControl({
    control,
    name,
    value,
  }: {
    control: ToolcraftControlSchema;
    name: string;
    value: unknown;
  }): React.JSX.Element {
    const items = asCollectionItems(value, control.defaultValue);
    const minItems = getCollectionMinItems(control);
    const hardMaxItems = getCollectionHardMaxItems(control);
    const canAdd = hardMaxItems === null || items.length < hardMaxItems;
    const canRemove = items.length > minItems;
    const itemType = getCollectionItemType(control);

    function setItems(nextItems: unknown[], label: string): void {
      setControlValue(control.target, nextItems, label);
    }

    function addItem(): void {
      if (!canAdd) {
        return;
      }

      setItems([...items, getCollectionItemDefaultValue(control)], control.addLabel ?? "Add item");
    }

    function removeItem(): void {
      if (!canRemove) {
        return;
      }

      setItems(items.slice(0, -1), control.removeLabel ?? "Remove item");
    }

    function updateItem(index: number, nextValue: unknown, meta?: ControlChangeMeta): void {
      const nextItems = items.map((item, itemIndex) =>
        itemIndex === index ? nextValue : item,
      );
      const itemName = getCollectionItemName(control, index) || name;

      setControlValue(control.target, nextItems, itemName, meta);
    }

    function renderColorItems(): React.ReactNode {
      return (
        <div
          className="grid min-w-0 grid-cols-2 gap-x-2 gap-y-4"
          data-slot="collection-actions-items-grid"
        >
          {items.map((item, index) => {
            const itemName = getCollectionItemName(control, index);

            return (
              <Color
                hex={asColorValue(item).hex}
                key={itemName || index}
                name={itemName}
                onValueChange={(nextValue: { hex: string }, meta?: ControlChangeMeta) =>
                  updateItem(index, nextValue, meta)
                }
                showLabel={false}
              />
            );
          })}
        </div>
      );
    }

    function renderColorOpacityItems(): React.ReactNode {
      return items.map((item, index) => {
        const colorOpacityValue = asColorOpacityValue(item);
        const itemName = getCollectionItemName(control, index);

        return (
          <ColorOpacity
            hex={colorOpacityValue.hex}
            key={itemName || index}
            name={itemName}
            onValueChange={(nextValue, meta) => updateItem(index, nextValue, meta)}
            opacity={colorOpacityValue.opacity}
            showLabel={false}
          />
        );
      });
    }

    function renderStackedItemControl(item: unknown, index: number): React.ReactNode {
      const itemControl = control.itemControl;
      const itemName = getCollectionItemName(control, index);
      const key = `${itemName || "item"}-${index}`;
      const update = (nextValue: unknown, meta?: ControlChangeMeta) => {
        updateItem(index, nextValue, meta);
      };

      switch (itemType) {
        case "checkbox":
          return (
            <Checkbox
              checked={asBoolean(item)}
              key={key}
              name={itemName}
              onCheckedChange={update}
              showLabel={itemControl?.label !== false}
            />
          );
        case "rangeInput": {
          const rangeValue = asRangeInputValue(item);

          return (
            <RangeInput
              defaultValue={asRangeInputValue(itemControl?.defaultValue)}
              end={rangeValue.end}
              key={key}
              name={itemName}
              onValueChange={update}
              start={rangeValue.start}
            />
          );
        }
        case "segmented":
          return (
            <Segmented
              key={key}
              name={itemName}
              onValueChange={update}
              options={itemControl?.options ?? []}
              value={asString(item, itemControl?.options?.[0]?.value ?? "")}
              variant={itemControl?.variant === "dots" ? "dots" : "default"}
            />
          );
        case "select":
          return (
            <Select
              key={key}
              name={itemName}
              onValueChange={update}
              options={itemControl?.options ?? []}
              value={asString(item, itemControl?.options?.[0]?.value ?? "")}
            />
          );
        case "slider":
          return (
            <Slider
              baseValue={asNumber(
                itemControl?.defaultValue,
                itemControl?.min ?? 0,
              )}
              key={key}
              markerCount={
                typeof itemControl?.markerCount === "number"
                  ? itemControl.markerCount
                  : undefined
              }
              max={itemControl?.max ?? 100}
              min={itemControl?.min ?? 0}
              name={itemName}
              onValueChange={update}
              step={itemControl?.step ?? 1}
              unit={itemControl?.unit}
              value={asNumber(
                item,
                asNumber(itemControl?.defaultValue, itemControl?.min ?? 0),
              )}
              variant={itemControl?.variant === "discrete" ? "discrete" : "continuous"}
            />
          );
        case "switch":
          return (
            <Switch
              checked={asBoolean(item)}
              key={key}
              name={itemName}
              onCheckedChange={update}
              showLabel={itemControl?.label !== false}
            />
          );
        case "fontPicker":
          return (
            <FontPicker
              defaultValue={asFontPickerValue(itemControl?.defaultValue)}
              key={key}
              name={itemName || "Font"}
              onValueChange={update}
              value={asFontPickerValue(item)}
            />
          );
        case "text":
          return (
            <TextInput
              commitOnBlur={itemControl?.commitMode === "setting"}
              defaultValue={asString(itemControl?.defaultValue, asString(item))}
              key={key}
              name={itemName}
              onValueChange={update}
              value={asString(item)}
            />
          );
        default:
          return (
            <TextInput
              defaultValue={asString(itemControl?.defaultValue, asString(item))}
              key={key}
              name={itemName}
              onValueChange={update}
              value={asString(item)}
            />
          );
      }
    }

    function renderCollectionItems(): React.ReactNode {
      if (itemType === "color") {
        return renderColorItems();
      }

      if (itemType === "colorOpacity") {
        return renderColorOpacityItems();
      }

      return items.map(renderStackedItemControl);
    }

    return (
      <div className="min-w-0 space-y-3" data-slot="collection-actions-control">
        <CollectionActions
          addLabel={control.addLabel ?? `Add ${getCollectionItemBaseLabel(control)}`}
          canAdd={canAdd}
          canRemove={canRemove}
          name={name}
          onAdd={addItem}
          onRemove={removeItem}
          removeLabel={
            control.removeLabel ?? `Remove ${getCollectionItemBaseLabel(control)}`
          }
        />
        <div className="min-w-0 space-y-4" data-slot="collection-actions-items">
          {renderCollectionItems()}
        </div>
      </div>
    );
  }

  const visibleSections = resolvedControlsPanel.sections
    .map((section) => ({
      entries: getVisibleSectionEntries(section),
      section,
    }))
    .filter(({ entries, section }) => isSectionVisible(section) && entries.length > 0);
  const visibleControlsPanelSections = visibleSections.map(({ entries, section }) => ({
    ...section,
    controls: getControlsRecord(entries),
  }));
  const vectorControlCount = countControlsByType(visibleControlsPanelSections, "vector");
  const vectorPadShape = vectorControlCount === 1 ? "square" : "compact";

  const panel = (
    <Panel
      className={cn(
        "shrink-0",
        placement === "frame" && "max-h-none",
        className,
      )}
      collapsed={panelState?.collapsed}
      contentTransitionSuppressionKey={
        keyframeControlsEnabled ? "keyframes" : "plain"
      }
      key={controlsResetKey}
      onCollapsedChange={(collapsed) => onPanelStateChange?.({ collapsed })}
      onResetControls={() => dispatchCommand({ type: "controls.reset" })}
      stickyFooterActive={footerActionProgressEntries.length > 0}
      stickyFooterProgress={stickyFooterProgress}
      title={resolvedControlsPanel.title}
    >
      {visibleSections.map(({ entries, section }, sectionIndex) => {
        const visibleControls = getControlsRecord(entries);
        const sectionHasOnlyColorFields = isColorOnlySection(entries);
        const isRuntimeSetup = isRuntimeSetupSection({ entries, section });
        const renderedSectionTitle = isRuntimeSetup
          ? undefined
          : getRenderedControlsSectionTitle(section);
        const sectionSpacing = "default";
        const sectionCollapseKey = getControlsPanelSectionCollapseKey({
          entries,
          section,
          sectionIndex,
        });
        const isSectionCollapsible = !isRuntimeSetup && renderedSectionTitle !== undefined;
        const isSectionCollapsed =
          isSectionCollapsible && collapsedSectionByKey[sectionCollapseKey] === true;
        const headerKeyframeEntry = getSectionHeaderKeyframeEntry(entries, section.title);
        const headerKeyframeTarget = headerKeyframeEntry?.[1].target ?? null;
        const headerKeyframeAction = headerKeyframeEntry
          ? getSectionHeaderKeyframeAction(headerKeyframeEntry)
          : null;
        const sectionResetAction = isSectionCollapsible
          ? getSectionResetAction({
              sectionTitle:
                typeof renderedSectionTitle === "string" ? renderedSectionTitle : "section",
              targets: entries.map(([, control]) => control.target),
            })
          : null;
        const sectionHeaderAction =
          headerKeyframeAction || sectionResetAction ? (
            <>
              {headerKeyframeAction}
              {sectionResetAction}
            </>
          ) : undefined;
        const inlineLayoutGroupByControlId = getInlineLayoutGroupByControlId({
          controlsById: visibleControls,
          layoutGroups: section.layoutGroups,
        });

        return (
          <PanelSection
            action={sectionHeaderAction}
            actionGroup={section.actionGroup}
            allowCompoundDividers={entries.length > 1}
            collapsed={isSectionCollapsed}
            collapsible={isSectionCollapsible}
            key={`${section.title ?? "section"}-${sectionIndex}`}
            onCollapsedChange={(collapsed) => {
              setCollapsedSectionByKey((current) => {
                const next = {
                  ...current,
                  [sectionCollapseKey]: collapsed,
                };

                writeControlsPanelCollapsedSections(sectionCollapseStorageKey, next);

                return next;
              });
            }}
            spacing={sectionSpacing}
            title={renderedSectionTitle}
          >
            {renderControlLayoutGroups({
              controlsById: visibleControls,
              layoutGroups: section.layoutGroups,
              renderedGroups: getControlRenderGroups(entries).map((group) => {
                const ids = getControlRenderGroupIds(group);

                if (group.kind === "colorGroup") {
                  return {
                    ids,
                    node: renderColorGroup(
                      group.entries,
                      headerKeyframeTarget,
                      sectionHasOnlyColorFields,
                    ),
                  };
                }

                const [id, rawControl] = group.entry;
                const inlineLayoutGroup = inlineLayoutGroupByControlId.get(id);
                const isInInlineLayoutGroup = Boolean(inlineLayoutGroup);
                const disabled = isControlDisabled(rawControl);
                const resolvedControl =
                  disabled === Boolean(rawControl.disabled)
                    ? rawControl
                    : { ...rawControl, disabled };
                const shouldHideLabel = shouldHideToggleParameterControlLabel({
                  control: resolvedControl,
                  controlsById: visibleControls,
                  layoutGroup: inlineLayoutGroup,
                });
                const control =
                  shouldHideLabel && resolvedControl.label !== false
                    ? { ...resolvedControl, label: false }
                    : resolvedControl;
                const name = getControlName(id, resolvedControl.label);
                const value = getControlValue(control);
                const usesHeaderKeyframeAction = control.target === headerKeyframeTarget;
                const commitWithLabel =
                  (label: string) =>
                  (nextValue: unknown, meta?: ControlChangeMeta): void => {
                    setControlValue(control.target, nextValue, label, meta);
                    maybeUpsertControlKeyframe(control, label, nextValue);
                  };
                const commit = commitWithLabel(name);
                const node = (() => {
                  switch (control.type) {
              case "actions": {
                const actions = asActionSchemas(control.actions);

                return (
                  <Actions
                    actions={actions.map((action) => ({
                      icon: action.icon,
                      label: action.label,
                      value: action.value,
                    }))}
                    key={id}
                    name={name}
                    onAction={(actionValue) => {
                      const action = actions.find((item) => item.value === actionValue);

                      if (action) {
                        runAction(action);
                      }
                    }}
                    showLabel={control.label !== false}
                  />
                );
              }

              case "aspectRatio":
                return (
                  <CanvasAspectRatioControl
                    defaultValue={control.defaultValue}
                    key={id}
                    name={name}
                    onValueChange={commit}
                    value={value}
                  />
                );

              case "anchorGrid":
                return withKeyframeLabelAction({
                  children: (
                    <AnchorGrid
                      key={id}
                      name={name}
                      onValueChange={commit}
                      value={
                        asString(value, "center") as React.ComponentProps<
                          typeof AnchorGrid
                        >["value"]
                      }
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "channelMixer": {
                const channelMixerName = name;

                return withKeyframeLabelAction({
                  children: (
                    <ChannelMixer
                      key={id}
                      name={channelMixerName}
                      onValueChange={(nextValue) =>
                        commitWithLabel(channelMixerName)(nextValue.values)
                      }
                      values={
                        isRecord(value) ? (value as ChannelMixerValues) : defaultChannelMixerValues
                      }
                    />
                  ),
                  control,
                  disableAction: false,
                  labelActionName: channelMixerName,
                  name,
                  providerKey: id,
                  value,
                });
              }

              case "checkbox":
                return (
                  <Checkbox
                    checked={asBoolean(value)}
                    key={id}
                    name={name}
                    onCheckedChange={commit}
                    showLabel={control.label !== false}
                  />
                );

              case "code":
                return withKeyframeLabelAction({
                  children: (
                    <CodeTextarea
                      defaultValue={asString(control.defaultValue, asString(value))}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      showLabel={control.label !== false}
                      value={asString(value)}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "color": {
                const colorValue = asColorValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <Color
                      hex={colorValue.hex}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      showLabel={shouldShowColorFieldLabel({
                        control,
                        sectionHasOnlyColorFields,
                      })}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });
              }

              case "colorOpacity": {
                const colorOpacityValue = asColorOpacityValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <ColorOpacity
                      hex={colorOpacityValue.hex}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      opacity={colorOpacityValue.opacity}
                      showLabel={shouldShowColorFieldLabel({
                        control,
                        sectionHasOnlyColorFields,
                      })}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value: colorOpacityValue,
                });
              }

              case "collectionActions":
                return renderCollectionActionsControl({ control, name, value });

              case "curves": {
                const curvesName = control.label === false ? "Curves" : name;

                return withKeyframeLabelAction({
                  children: (
                    <Curves
                      interpolation={asCurveInterpolation(control.interpolation)}
                      key={id}
                      name={curvesName}
                      onValueChange={commitWithLabel(curvesName)}
                      variant={control.variant === "single" ? "single" : "rgb"}
                      {...(isRecord(value) ? value : {})}
                    />
                  ),
                  control,
                  disableAction: false,
                  labelActionName: curvesName,
                  name: curvesName,
                  providerKey: id,
                  value,
                });
              }

              case "fileDrop": {
                const assetKind = control.assetKind === "file" ? "file" : "image";
                const previewMediaAssets = state.schema.panels.layers
                  ? []
                  : state.mediaAssets.filter(
                      (asset) =>
                        asset.sourceTarget === undefined ||
                        asset.sourceTarget === control.target,
                    );
                const previewMediaAsset = previewMediaAssets[0];
                const previews = previewMediaAssets.map((asset): FileDropPreview => ({
                  alt: asset.fileName,
                  assetKind: asset.assetKind ?? "image",
                  fileName: asset.fileName,
                  id: asset.id,
                  size: asset.size,
                  src: asset.dataUrl,
                  transform: asset.transform,
                }));
                const previewMediaIds = previewMediaAssets.map((asset) => asset.id);
                const importFile = (file: File, replaceExisting: boolean): void => {
                  if (assetKind === "file") {
                    void readImportedFile(file).then((importedFile) => {
                      if (!importedFile) {
                        return;
                      }

                      dispatchCommand({
                        asset: {
                          assetKind: "file",
                          dataUrl: importedFile.dataUrl,
                          fileName: file.name,
                          mimeType: file.type || "application/octet-stream",
                          position: { x: 0, y: 0 },
                          sourceTarget: control.target,
                        },
                        replaceExisting,
                        type: "media.import",
                      });
                    });
                    return;
                  }

                  if (!isToolcraftImageFile(file)) {
                    return;
                  }

                  void readImportedImageFile(file, state.canvas.size).then((importedImage) => {
                    if (!importedImage) {
                      return;
                    }

                    dispatchCommand({
                      asset: {
                        assetKind: "image",
                        dataUrl: importedImage.dataUrl,
                        fileName: file.name,
                        mimeType: file.type || "image/*",
                        position: { x: 0, y: 0 },
                        size: importedImage.size,
                        sourceTarget: control.target,
                      },
                      replaceExisting,
                      type: "media.import",
                    });
                  });
                };

                return (
                  <FileDrop
                    accept={
                      control.accept ??
                      (assetKind === "file" ? "" : "PNG, JPEG, GIF, SVG, WebP")
                    }
                    assetKind={assetKind}
                    multiple={control.multiple}
                    key={id}
                    onClear={
                      previewMediaAsset
                        ? () => {
                            dispatchCommand({
                              mediaId: previewMediaAsset.id,
                              type: "media.delete",
                            });
                          }
                        : undefined
                    }
                    onFilesSelect={(files) => {
                      files.forEach((file) => importFile(file, false));
                    }}
                    onFileSelect={(file) => importFile(file, true)}
                    onPreviewRemove={(item) => {
                      if (!item.id) {
                        return;
                      }

                      dispatchCommand({
                        mediaId: item.id,
                        type: "media.delete",
                      });
                    }}
                    onPreviewReorder={(orderedPreviews) => {
                      const orderedPreviewIds = orderedPreviews.flatMap((item) =>
                        item.id ? [item.id] : [],
                      );

                      if (orderedPreviewIds.length !== previewMediaIds.length) {
                        return;
                      }

                      const previewIdSet = new Set(previewMediaIds);
                      let orderedPreviewIndex = 0;
                      const mediaIds = state.mediaAssets.map((asset) => {
                        if (!previewIdSet.has(asset.id)) {
                          return asset.id;
                        }

                        const nextId = orderedPreviewIds[orderedPreviewIndex];
                        orderedPreviewIndex += 1;
                        return nextId ?? asset.id;
                      });

                      dispatchCommand({
                        mediaIds,
                        type: "media.reorder",
                      });
                    }}
                    onPreviewTransform={(item, operation) => {
                      if (!item.id) {
                        return;
                      }

                      dispatchCommand({
                        mediaId: item.id,
                        operation,
                        type: "media.transform",
                      });
                    }}
                    preview={
                      previewMediaAsset
                        ? {
                            id: previewMediaAsset.id,
                            alt: previewMediaAsset.fileName,
                            size: previewMediaAsset.size,
                            src: previewMediaAsset.dataUrl,
                            transform: previewMediaAsset.transform,
                          }
                        : undefined
                    }
                    previews={previews}
                  />
                );
              }

              case "gradient": {
                const gradientValue = asGradientValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <Gradient
                      angle={gradientValue.angle}
                      gradientType={gradientValue.gradientType}
                      key={id}
                      onValueChange={commit}
                      stops={gradientValue.stops}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });
              }

              case "fontPicker": {
                const fontPickerValue = asFontPickerValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <FontPicker
                      defaultValue={asFontPickerValue(control.defaultValue)}
                      disabled={control.disabled}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      value={fontPickerValue}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value: fontPickerValue,
                });
              }

              case "imagePicker":
                return (
                  <ImagePicker
                    items={control.items as readonly ImagePickerItem[] | undefined}
                    key={id}
                    name={name}
                    onValueChange={commit}
                    value={asString(value, control.items?.[0]?.value ?? "")}
                  />
                );

              case "palette":
                return withKeyframeLabelAction({
                  children: (
                    <Palette
                      defaultValue={
                        isRecord(control.defaultValue)
                          ? (control.defaultValue as React.ComponentProps<
                              typeof Palette
                            >["defaultValue"])
                          : undefined
                      }
                      key={id}
                      onValueChange={commit}
                      value={
                        isRecord(value)
                          ? (value as React.ComponentProps<typeof Palette>["value"])
                          : undefined
                      }
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "panelActions": {
                const actions = asActionSchemas(control.actions);

                return (
                  <PanelActions
                    actions={actions.map((action) => ({
                      icon: getPanelActionIcon(action),
                      name: getActionLabel(action),
                      value: action.value,
                      variant: getPanelActionButtonVariant(action.variant),
                    }))}
                    key={id}
                    onAction={(actionValue) => {
                      const action = actions.find((item) => item.value === actionValue);

                      if (action) {
                        runAction(action, { trackFooterPending: true });
                      }
                    }}
                  />
                );
              }

              case "rangeInput": {
                const rangeValue = asRangeInputValue(value);

                return withKeyframeLabelAction({
                  children: (
                    <RangeInput
                      defaultValue={asRangeInputValue(control.defaultValue)}
                      end={rangeValue.end}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      showLabel={control.label !== false}
                      start={rangeValue.start}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });
              }

              case "rangeSlider":
                return withKeyframeLabelAction({
                  children: (
                    <RangeSlider
                      baseValue={asNumberArray(control.defaultValue, [])}
                      disabled={control.disabled}
                      markerCount={getControlMarkerCount(control)}
                      max={control.max ?? 100}
                      min={control.min ?? 0}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      step={control.step ?? 0.1}
                      unit={control.unit}
                      value={asNumberArray(value, [control.min ?? 0, control.max ?? 100])}
                      valueLabel={control.valueLabel}
                      variant={
                        control.variant === "discrete" ? "discrete" : "continuous"
                      }
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "segmented":
                return withKeyframeLabelAction({
                  children: (
                    <Segmented
                      key={id}
                      name={name}
                      onValueChange={commit}
                      options={control.options ?? []}
                      value={asString(value, control.options?.[0]?.value ?? "")}
                      variant={control.variant === "dots" ? "dots" : "default"}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "select":
                return (
                  <Select
                    key={id}
                    name={name}
                    onValueChange={commit}
                    options={control.options ?? []}
                    showLabel={control.label !== false}
                    value={asString(value, control.options?.[0]?.value ?? "")}
                  />
                );

              case "settingsTransfer":
                return (
                  <PanelActions
                    actions={[
                      {
                        icon: "upload-simple",
                        name: "Export Settings",
                        onClick: () => downloadToolcraftSettings(state),
                        variant: "outline",
                      },
                      {
                        icon: "download-simple",
                        name: "Import Settings",
                        onClick: () => {
                          void importToolcraftSettings({ dispatch, state });
                        },
                        variant: "outline",
                      },
                    ]}
                    key={id}
                    columns={2}
                  />
                );

              case "slider":
                return withKeyframeLabelAction({
                  children: (
                    <Slider
                      baseValue={asNumber(control.defaultValue, control.min ?? 0)}
                      disabled={control.disabled}
                      key={id}
                      markerCount={getControlMarkerCount(control)}
                      max={control.max ?? 100}
                      min={control.min ?? 0}
                      name={name}
                      onValueChange={commit}
                      step={control.step ?? 1}
                      unit={control.unit}
                      value={asNumber(
                        value,
                        asNumber(control.defaultValue, control.min ?? 0),
                      )}
                      valueLabel={control.valueLabel}
                      variant={
                        control.variant === "discrete" ? "discrete" : "continuous"
                      }
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "switch":
                return (
                  <Switch
                    checked={asBoolean(value)}
                    key={id}
                    name={name}
                    onCheckedChange={commit}
                    showLabel={control.label !== false}
                  />
                );

              case "text":
                return withKeyframeLabelAction({
                  children: (
                    <TextInput
                      commitOnBlur={shouldCommitTextControlOnBlur(control)}
                      defaultValue={asString(control.defaultValue, asString(value))}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      showLabel={control.label !== false}
                      value={asString(value)}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });

              case "vector": {
                const vectorValue = asVectorValue(value);
                const padVariant = asVectorPadVariant(control.variant);

                return withKeyframeLabelAction({
                  children: (
                    <Vector
                      defaultValue={asVectorValue(control.defaultValue)}
                      key={id}
                      name={name}
                      onValueChange={commit}
                      padCoordinateMode={asVectorPadCoordinateMode(
                        control.coordinateMode,
                        padVariant,
                      )}
                      padShape={vectorPadShape}
                      padVariant={padVariant}
                      x={vectorValue.x}
                      xLabel={control.xLabel}
                      y={vectorValue.y}
                      yLabel={control.yLabel}
                    />
                  ),
                  control,
                  disableAction: usesHeaderKeyframeAction,
                  name,
                  providerKey: id,
                  value,
                });
              }

                  default: {
                    const CustomControl = controlRenderers?.[control.type];

                    if (!CustomControl) {
                      return null;
                    }

                    return withKeyframeLabelAction({
                      children: (
                        <React.Fragment key={id}>
                          {CustomControl({
                            control,
                            controlId: id,
                            dispatch,
                            keyframeAction: getKeyframeLabelAction(control, name, value),
                            name,
                            setValue: commit,
                            state,
                            value,
                          })}
                        </React.Fragment>
                      ),
                      control,
                      disableAction: usesHeaderKeyframeAction,
                      name,
                      providerKey: id,
                      value,
                    });
                  }
                  }
                })();

                return {
                  ids,
                  node: withCompoundControlSectionDivider({
                    children: withControlLabelHelp({
                      children: node,
                      control,
                      label: name,
                      providerKey: id,
                      sectionTitle: section.title,
                    }),
                    control,
                  }),
                };
              }),
            })}
          </PanelSection>
        );
      })}
    </Panel>
  );

  if (placement === "surface") {
    return panel;
  }

  return (
    <PanelContainer
      onPanelStateChange={onPanelStateChange}
      panelState={panelState}
      panelType="controls"
      placement={placement}
    >
      {panel}
    </PanelContainer>
  );
}
