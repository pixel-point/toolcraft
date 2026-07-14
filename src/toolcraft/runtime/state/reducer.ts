import {
  getToolcraftCanvasSizeTargetDimension,
  isToolcraftCanvasAspectRatioTarget,
  isToolcraftTimelinePanelExtendedTarget,
  isToolcraftTimelinePanelVisibleTarget,
} from "../schema/runtime-targets";
import { getToolcraftCanvasAspectRatioPreset } from "../schema/canvas-aspect-ratio-presets";
import {
  clampToolcraftCanvasZoom,
  toolcraftCanvasZoomDefault,
  toolcraftCanvasZoomStep,
} from "./canvas-zoom";
import {
  cloneToolcraftLayers,
  cloneToolcraftMediaAssets,
  createToolcraftDefaultMediaState,
} from "./media-defaults";
import { getMediaReadyTimelineState } from "./timeline-readiness";
import type {
  ToolcraftCommand,
  ToolcraftHistoryPatch,
  ToolcraftHistoryMode,
  ToolcraftLayer,
  ToolcraftLayerDraft,
  ToolcraftMediaAsset,
  ToolcraftMediaTransform,
  ToolcraftState,
  ToolcraftTimelineKeyframe,
  ToolcraftTimelineKeyframeGroup,
} from "./types";

const minTimelineDurationSeconds = 1;
const maxTimelineDurationSeconds = 60;
const canvasAspectRatioTarget = "canvas.aspectRatio";
const canvasSizeWidthTarget = "canvas.size.width";
const canvasSizeHeightTarget = "canvas.size.height";

type CanvasAspectRatioValue = {
  height: number;
  mode: "custom" | "preset";
  value: string;
  width: number;
};

function asCanvasSizeDimension(value: unknown): number | null {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseFloat(value)
        : Number.NaN;

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return Math.max(1, Math.round(numberValue));
}

function getGreatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(Math.round(left));
  let b = Math.abs(Math.round(right));

  while (b !== 0) {
    const next = b;
    b = a % b;
    a = next;
  }

  return a || 1;
}

function getCanvasAspectRatioFromSize(
  size: ToolcraftState["canvas"]["size"],
): CanvasAspectRatioValue {
  const divisor = getGreatestCommonDivisor(size.width, size.height);
  const width = Math.max(1, Math.round(size.width / divisor));
  const height = Math.max(1, Math.round(size.height / divisor));
  const value = `${width}:${height}`;

  return {
    height,
    mode: "custom",
    value,
    width,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseCanvasAspectRatioString(value: string): CanvasAspectRatioValue | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)\s*$/u.exec(value);

  if (!match) {
    return null;
  }

  const width = asCanvasSizeDimension(match[1]);
  const height = asCanvasSizeDimension(match[2]);

  if (width === null || height === null) {
    return null;
  }

  return {
    height,
    mode: getToolcraftCanvasAspectRatioPreset(`${width}:${height}`)
      ? "preset"
      : "custom",
    value: `${width}:${height}`,
    width,
  };
}

function normalizeCanvasAspectRatioValue(
  value: unknown,
  fallbackSize: ToolcraftState["canvas"]["size"],
): CanvasAspectRatioValue {
  if (typeof value === "string") {
    return parseCanvasAspectRatioString(value) ?? getCanvasAspectRatioFromSize(fallbackSize);
  }

  if (isRecord(value)) {
    const width = asCanvasSizeDimension(value.width);
    const height = asCanvasSizeDimension(value.height);

    if (width !== null && height !== null) {
      const rawValue = typeof value.value === "string" ? value.value : `${width}:${height}`;
      const mode = value.mode === "preset" ? "preset" : "custom";

      return {
        height,
        mode,
        value: mode === "preset" ? rawValue : `${width}:${height}`,
        width,
      };
    }
  }

  return getCanvasAspectRatioFromSize(fallbackSize);
}

function canvasAspectRatioValuesEqual(
  first: unknown,
  second: CanvasAspectRatioValue,
): boolean {
  if (!isRecord(first)) {
    return false;
  }

  return (
    first.height === second.height &&
    first.mode === second.mode &&
    first.value === second.value &&
    first.width === second.width
  );
}

function applyCanvasAspectRatioToSize({
  anchor,
  ratio,
  size,
  value,
}: {
  anchor: "height" | "width";
  ratio: CanvasAspectRatioValue;
  size: ToolcraftState["canvas"]["size"];
  value: number;
}): ToolcraftState["canvas"]["size"] {
  if (anchor === "width") {
    return {
      ...size,
      height: Math.max(1, Math.round((value * ratio.height) / ratio.width)),
      width: value,
    };
  }

  return {
    ...size,
    height: value,
    width: Math.max(1, Math.round((value * ratio.width) / ratio.height)),
  };
}

function getCanvasAspectRatioPresetSize(
  ratio: CanvasAspectRatioValue,
): ToolcraftState["canvas"]["size"] | null {
  if (ratio.mode !== "preset") {
    return null;
  }

  const preset = getToolcraftCanvasAspectRatioPreset(ratio.value);

  if (!preset) {
    return null;
  }

  return {
    height: preset.height,
    unit: "px",
    width: preset.width,
  };
}

function getResetCanvasSize(
  state: ToolcraftState,
): ToolcraftState["canvas"]["size"] | null {
  const width = asCanvasSizeDimension(state.defaults["canvas.size.width"]);
  const height = asCanvasSizeDimension(state.defaults["canvas.size.height"]);

  if (width === null && height === null) {
    return null;
  }

  return {
    ...state.canvas.size,
    height: height ?? state.canvas.size.height,
    width: width ?? state.canvas.size.width,
  };
}

function getFileDropResetTargets(
  state: ToolcraftState,
  targets?: ReadonlySet<string>,
): Set<string> {
  const fileDropTargets = new Set<string>();

  for (const section of state.schema.panels.controls?.sections ?? []) {
    for (const control of Object.values(section.controls)) {
      if (control.type !== "fileDrop" || (targets && !targets.has(control.target))) {
        continue;
      }

      fileDropTargets.add(control.target);
    }
  }

  return fileDropTargets;
}

function getResetMediaPatch(
  state: ToolcraftState,
  targets?: ReadonlySet<string>,
): Pick<ToolcraftHistoryPatch, "after" | "before"> | null {
  if (state.schema.panels.layers) {
    return null;
  }

  const fileDropTargets = getFileDropResetTargets(state, targets);

  if (fileDropTargets.size === 0) {
    return null;
  }

  const defaultMediaState = createToolcraftDefaultMediaState(state.schema);
  const defaultTargetMediaAssets = defaultMediaState.mediaAssets.filter((asset) =>
    asset.sourceTarget ? fileDropTargets.has(asset.sourceTarget) : false,
  );
  const defaultTargetLayerIds = new Set(defaultTargetMediaAssets.map((asset) => asset.layerId));
  const currentTargetLayerIds = new Set(
    state.mediaAssets.flatMap((asset) =>
      asset.sourceTarget && fileDropTargets.has(asset.sourceTarget) ? [asset.layerId] : [],
    ),
  );
  const mediaAssets = [
    ...state.mediaAssets.filter((asset) => {
      if (asset.sourceTarget) {
        return !fileDropTargets.has(asset.sourceTarget);
      }

      return false;
    }),
    ...cloneToolcraftMediaAssets(defaultTargetMediaAssets),
  ];
  const layers = [
    ...state.layers.filter(
      (layer) => !currentTargetLayerIds.has(layer.id) && !defaultTargetLayerIds.has(layer.id),
    ),
    ...cloneToolcraftLayers(
      defaultMediaState.layers.filter((layer) => defaultTargetLayerIds.has(layer.id)),
    ),
  ];
  const selectedLayerId =
    state.selectedLayerId && layers.some((layer) => layer.id === state.selectedLayerId)
      ? state.selectedLayerId
      : (layers[0]?.id ?? null);

  if (
    mediaAssets.length === state.mediaAssets.length &&
    mediaAssets.every((asset, index) => asset.id === state.mediaAssets[index]?.id) &&
    layers.length === state.layers.length &&
    layers.every((layer, index) => layer.id === state.layers[index]?.id) &&
    selectedLayerId === state.selectedLayerId
  ) {
    return null;
  }

  const timeline = getMediaReadyTimelineState(state.schema, state.timeline, mediaAssets);
  const shouldCommitTimeline = timeline !== state.timeline;

  return {
    after: {
      layers,
      mediaAssets,
      selectedLayerId,
      ...(shouldCommitTimeline ? { timeline } : {}),
    },
    before: {
      layers: state.layers,
      mediaAssets: state.mediaAssets,
      selectedLayerId: state.selectedLayerId,
      ...(shouldCommitTimeline ? { timeline: state.timeline } : {}),
    },
  };
}

function canvasSizesEqual(
  first: ToolcraftState["canvas"]["size"],
  second: ToolcraftState["canvas"]["size"],
): boolean {
  return (
    first.height === second.height &&
    first.unit === second.unit &&
    first.width === second.width
  );
}

function clampTimelineDuration(value: number): number {
  if (!Number.isFinite(value)) {
    return minTimelineDurationSeconds;
  }

  return Math.max(minTimelineDurationSeconds, Math.min(maxTimelineDurationSeconds, value));
}

function clampTimelineTime(value: number, durationSeconds: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(durationSeconds, value));
}

function formatTimelineSeconds(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function getRoundedTimelineKeyframeTime(value: number): number {
  return Math.round(value * 100) / 100;
}

function getTimelineKeyframeId(controlId: string, timeSeconds: number): string {
  return `${controlId}::${formatTimelineSeconds(timeSeconds)}`;
}

function createTimelineControlKeyframe({
  controlId,
  controlLabel,
  state,
  timeSeconds,
  value,
  valueLabel,
}: {
  controlId: string;
  controlLabel: string;
  state: ToolcraftState;
  timeSeconds?: number;
  value: unknown;
  valueLabel: string;
}): ToolcraftTimelineKeyframe {
  const resolvedTimeSeconds = getRoundedTimelineKeyframeTime(
    clampTimelineTime(
      timeSeconds ?? state.timeline.currentTimeSeconds,
      state.timeline.durationSeconds,
    ),
  );

  return {
    controlId,
    controlLabel,
    id: getTimelineKeyframeId(controlId, resolvedTimeSeconds),
    timeSeconds: resolvedTimeSeconds,
    value,
    valueLabel,
  };
}

function upsertTimelineControlKeyframeGroup({
  controlId,
  controlLabel,
  keyframe,
  keyframeGroups,
}: {
  controlId: string;
  controlLabel: string;
  keyframe: ToolcraftTimelineKeyframe;
  keyframeGroups: readonly ToolcraftTimelineKeyframeGroup[];
}): ToolcraftTimelineKeyframeGroup[] {
  const existingGroup = keyframeGroups.find((group) => group.controlId === controlId);
  const nextKeyframes = [
    ...(existingGroup?.keyframes.filter((item) => item.id !== keyframe.id) ?? []),
    keyframe,
  ].sort(
    (firstKeyframe, secondKeyframe) => firstKeyframe.timeSeconds - secondKeyframe.timeSeconds,
  );
  const nextGroup: ToolcraftTimelineKeyframeGroup = {
    controlId,
    keyframes: nextKeyframes,
    label: existingGroup?.label ?? controlLabel,
  };

  if (!existingGroup) {
    return [...keyframeGroups, nextGroup];
  }

  return keyframeGroups.map((group) => (group.controlId === controlId ? nextGroup : group));
}

function commitPatch(
  state: ToolcraftState,
  patch: ToolcraftHistoryPatch,
  values: Record<string, unknown>,
  historyOptions?: ToolcraftHistoryOptions,
): ToolcraftState {
  return {
    ...state,
    history: getNextHistoryState(state, patch, historyOptions),
    values,
  };
}

function commitStatePatch(
  state: ToolcraftState,
  patch: ToolcraftHistoryPatch,
  historyOptions?: ToolcraftHistoryOptions,
): ToolcraftState {
  const next = applyHistoryPatch(state, patch.after);

  return {
    ...state,
    canvas: next.canvas,
    history: getNextHistoryState(state, patch, historyOptions),
    layers: next.layers,
    mediaAssets: next.mediaAssets,
    selectedLayerId: next.selectedLayerId,
    timeline: next.timeline,
    values: next.values,
  };
}

type ToolcraftHistoryOptions = {
  group?: string;
  mode?: ToolcraftHistoryMode;
};

function getNextHistoryState(
  state: ToolcraftState,
  patch: ToolcraftHistoryPatch,
  options?: ToolcraftHistoryOptions,
): ToolcraftState["history"] {
  const mode = options?.mode ?? "record";

  if (mode === "skip") {
    return state.history;
  }

  const group = mode === "merge" ? options?.group : undefined;

  if (group) {
    const previousPatch = state.history.undo.at(-1);

    if (previousPatch?.group === group) {
      return {
        redo: [],
        undo: [
          ...state.history.undo.slice(0, -1),
          {
            ...previousPatch,
            after: patch.after,
            label: patch.label,
          },
        ],
      };
    }
  }

  return {
    redo: [],
    undo: [...state.history.undo, group ? { ...patch, group } : patch],
  };
}

function applyValuePatch(
  values: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const nextValues = { ...values };

  for (const [target, value] of Object.entries(patch)) {
    if (target in nextValues) {
      nextValues[target] = value;
    }
  }

  return nextValues;
}

function applyHistoryPatch(
  state: ToolcraftState,
  patch: Record<string, unknown>,
): Pick<
  ToolcraftState,
  "canvas" | "layers" | "mediaAssets" | "selectedLayerId" | "timeline" | "values"
> {
  const nextCanvas =
    "canvas.size" in patch
      ? {
          ...state.canvas,
          size: patch["canvas.size"] as ToolcraftState["canvas"]["size"],
        }
      : state.canvas;

  return {
    canvas: nextCanvas,
    layers: "layers" in patch ? (patch.layers as ToolcraftState["layers"]) : state.layers,
    mediaAssets:
      "mediaAssets" in patch
        ? (patch.mediaAssets as ToolcraftState["mediaAssets"])
        : state.mediaAssets,
    selectedLayerId:
      "selectedLayerId" in patch
        ? (patch.selectedLayerId as ToolcraftState["selectedLayerId"])
        : state.selectedLayerId,
    timeline:
      "timeline" in patch ? (patch.timeline as ToolcraftState["timeline"]) : state.timeline,
    values: applyValuePatch(state.values, patch),
  };
}

function getNextMediaId(state: ToolcraftState): string {
  const existingIds = new Set(state.mediaAssets.map((asset) => asset.id));
  let index = state.mediaAssets.length + 1;

  while (existingIds.has(`media-${index}`)) {
    index += 1;
  }

  return `media-${index}`;
}

function getNextLayerId(state: ToolcraftState): string {
  const existingIds = new Set(state.layers.map((layer) => layer.id));
  let index = state.layers.length + 1;

  while (existingIds.has(`layer-${index}`)) {
    index += 1;
  }

  return `layer-${index}`;
}

function getSingleLayerImportId(state: ToolcraftState): string | undefined {
  return state.schema.panels.layers ? undefined : state.layers.find((layer) => layer.kind !== "group")?.id;
}

function getSingleMediaImportId(state: ToolcraftState): string | undefined {
  return state.schema.panels.layers ? undefined : state.mediaAssets[0]?.id;
}

function getImportedLayerName(fileName: string): string {
  const name = fileName.replace(/\.[^.]+$/, "").trim();

  return name || "Material";
}

function normalizeMediaRotation(rotationDeg: number): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round(rotationDeg / 90) * 90) % 360 + 360) % 360;

  return normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0;
}

function compactMediaTransform(
  transform: ToolcraftMediaTransform,
): ToolcraftMediaTransform | undefined {
  const normalizedRotation = normalizeMediaRotation(transform.rotationDeg ?? 0);
  const nextTransform: ToolcraftMediaTransform = {};

  if (normalizedRotation !== 0) {
    nextTransform.rotationDeg = normalizedRotation;
  }

  if (transform.flipHorizontal) {
    nextTransform.flipHorizontal = true;
  }

  if (transform.flipVertical) {
    nextTransform.flipVertical = true;
  }

  return Object.keys(nextTransform).length > 0 ? nextTransform : undefined;
}

function getTransformedMediaAsset(
  mediaAsset: ToolcraftMediaAsset,
  operation: Extract<ToolcraftCommand, { type: "media.transform" }>["operation"],
): ToolcraftMediaAsset {
  const currentTransform = mediaAsset.transform ?? {};
  const rotationDeg = normalizeMediaRotation(currentTransform.rotationDeg ?? 0);
  const transform: ToolcraftMediaTransform = {
    flipHorizontal: currentTransform.flipHorizontal,
    flipVertical: currentTransform.flipVertical,
    rotationDeg,
  };

  switch (operation) {
    case "flip-horizontal":
      transform.flipHorizontal = !transform.flipHorizontal;
      break;
    case "flip-vertical":
      transform.flipVertical = !transform.flipVertical;
      break;
    case "rotate-left":
      transform.rotationDeg = normalizeMediaRotation(rotationDeg - 90);
      break;
    case "rotate-right":
      transform.rotationDeg = normalizeMediaRotation(rotationDeg + 90);
      break;
  }

  const compactTransform = compactMediaTransform(transform);

  if (!compactTransform) {
    const { transform: _transform, ...rest } = mediaAsset;

    return rest;
  }

  return {
    ...mediaAsset,
    transform: compactTransform,
  };
}

function getNextLayerName(
  layers: readonly ToolcraftLayer[],
  prefix: "Group" | "Layer",
): string {
  const nextIndex =
    layers.reduce((highestIndex, layer) => {
      const label = layer.displayName ?? layer.name;
      const match = new RegExp(`^${prefix} (\\d+)$`).exec(label);
      const currentIndex = Number(match?.[1] ?? 0);

      return Math.max(highestIndex, currentIndex);
    }, 0) + 1;

  return `${prefix} ${nextIndex}`;
}

function createLayer(
  state: ToolcraftState,
  draft: ToolcraftLayerDraft | undefined,
): ToolcraftLayer {
  const kind = draft?.kind ?? "layer";
  const name =
    draft?.name ??
    draft?.displayName ??
    getNextLayerName(state.layers, kind === "group" ? "Group" : "Layer");

  return {
    collapsed: kind === "group" ? (draft?.collapsed ?? false) : draft?.collapsed,
    displayName: draft?.displayName ?? name,
    id: draft?.id ?? getNextLayerId(state),
    kind,
    name,
    parentGroupId: draft?.parentGroupId,
    visible: draft?.visible ?? true,
  };
}

function clampInsertIndex(length: number, insertIndex: number | undefined): number {
  return Math.max(0, Math.min(length, insertIndex ?? length));
}

function getLayerBlockIds(
  layers: readonly ToolcraftLayer[],
  layerId: string,
): Set<string> {
  const blockIds = new Set<string>([layerId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const layer of layers) {
      if (layer.parentGroupId && blockIds.has(layer.parentGroupId) && !blockIds.has(layer.id)) {
        blockIds.add(layer.id);
        changed = true;
      }
    }
  }

  return blockIds;
}

function canMoveLayerToParent(
  layers: readonly ToolcraftLayer[],
  layerId: string,
  parentGroupId: string | null,
): boolean {
  if (!parentGroupId) {
    return true;
  }

  if (layerId === parentGroupId) {
    return false;
  }

  const parent = layers.find((layer) => layer.id === parentGroupId);

  if (!parent || parent.kind !== "group") {
    return false;
  }

  return !getLayerBlockIds(layers, layerId).has(parentGroupId);
}

function mapTimelineKeyframeGroups(
  keyframeGroups: readonly ToolcraftTimelineKeyframeGroup[],
  keyframeId: string,
  updateKeyframe: (
    keyframe: ToolcraftTimelineKeyframeGroup["keyframes"][number],
  ) => ToolcraftTimelineKeyframeGroup["keyframes"][number],
): ToolcraftTimelineKeyframeGroup[] {
  return keyframeGroups.map((group) => ({
    ...group,
    keyframes: group.keyframes.map((keyframe) =>
      keyframe.id === keyframeId ? updateKeyframe(keyframe) : keyframe,
    ),
  }));
}

export function toolcraftReducer(
  state: ToolcraftState,
  command: ToolcraftCommand,
): ToolcraftState {
  switch (command.type) {
    case "controls.setValue": {
      const canvasSizeDimension = getToolcraftCanvasSizeTargetDimension(command.target);

      if (isToolcraftTimelinePanelExtendedTarget(command.target)) {
        const extended = command.value === true;

        if (state.panels.timeline.extended === extended) {
          return state;
        }

        return {
          ...state,
          panels: {
            ...state.panels,
            timeline: {
              ...state.panels.timeline,
              extended,
            },
          },
        };
      }

      if (isToolcraftTimelinePanelVisibleTarget(command.target)) {
        const hidden = command.value === false;

        if (state.panels.timeline.hidden === hidden) {
          return state;
        }

        return {
          ...state,
          panels: {
            ...state.panels,
            timeline: {
              ...state.panels.timeline,
              hidden,
            },
          },
        };
      }

      if (isToolcraftCanvasAspectRatioTarget(command.target)) {
        const ratio = normalizeCanvasAspectRatioValue(command.value, state.canvas.size);
        const size =
          getCanvasAspectRatioPresetSize(ratio) ??
          applyCanvasAspectRatioToSize({
            anchor: "width",
            ratio,
            size: state.canvas.size,
            value: state.canvas.size.width,
          });

        if (
          state.canvas.size.width === size.width &&
          state.canvas.size.height === size.height &&
          canvasAspectRatioValuesEqual(state.values[command.target], ratio)
        ) {
          return state;
        }

        return commitStatePatch(state, {
          after: {
            [canvasAspectRatioTarget]: ratio,
            "canvas.size": size,
            [canvasSizeWidthTarget]: size.width,
            [canvasSizeHeightTarget]: size.height,
          },
          before: {
            [canvasAspectRatioTarget]: state.values[command.target],
            "canvas.size": state.canvas.size,
            [canvasSizeWidthTarget]: state.values[canvasSizeWidthTarget],
            [canvasSizeHeightTarget]: state.values[canvasSizeHeightTarget],
          },
          label: command.label ?? command.target,
        }, {
          group: command.historyGroup,
          mode: command.history,
        });
      }

      if (canvasSizeDimension) {
        const dimensionValue = asCanvasSizeDimension(command.value);

        if (dimensionValue === null) {
          return state;
        }

        const hasAspectRatioControl =
          canvasAspectRatioTarget in state.values ||
          canvasAspectRatioTarget in state.defaults;
        const size = {
          ...state.canvas.size,
          [canvasSizeDimension]: dimensionValue,
        };
        const aspectRatio = getCanvasAspectRatioFromSize(size);
        const targetValue = size[canvasSizeDimension];
        const otherTarget =
          canvasSizeDimension === "width" ? canvasSizeHeightTarget : canvasSizeWidthTarget;
        const otherValue = canvasSizeDimension === "width" ? size.height : size.width;

        const sizeUnchanged =
          state.canvas.size.width === size.width &&
          state.canvas.size.height === size.height &&
          state.values[command.target] === targetValue &&
          state.values[otherTarget] === otherValue;

        if (sizeUnchanged) {
          return state;
        }

        return commitStatePatch(state, {
          after: {
            ...(hasAspectRatioControl
              ? { [canvasAspectRatioTarget]: aspectRatio }
              : {}),
            "canvas.size": size,
            [command.target]: targetValue,
            [otherTarget]: otherValue,
          },
          before: {
            ...(hasAspectRatioControl
              ? { [canvasAspectRatioTarget]: state.values[canvasAspectRatioTarget] }
              : {}),
            "canvas.size": state.canvas.size,
            [command.target]: state.values[command.target],
            [otherTarget]: state.values[otherTarget],
          },
          label: command.label ?? command.target,
        }, {
          group: command.historyGroup,
          mode: command.history,
        });
      }

      if (Object.is(state.values[command.target], command.value)) {
        return state;
      }

      return commitPatch(
        state,
        {
          after: { [command.target]: command.value },
          before: { [command.target]: state.values[command.target] },
          label: command.label ?? command.target,
        },
        { ...state.values, [command.target]: command.value },
        {
          group: command.historyGroup,
          mode: command.history,
        },
      );
    }

    case "controls.apply":
      return state;

    case "controls.reset": {
      const resetCanvasSize = getResetCanvasSize(state);
      const resetMediaPatch = getResetMediaPatch(state);

      if (resetCanvasSize || resetMediaPatch) {
        return commitStatePatch(state, {
          after: {
            ...state.defaults,
            ...(resetCanvasSize ? { "canvas.size": resetCanvasSize } : {}),
            ...resetMediaPatch?.after,
          },
          before: {
            ...state.values,
            ...(resetCanvasSize ? { "canvas.size": state.canvas.size } : {}),
            ...resetMediaPatch?.before,
          },
          label: "Reset controls",
        });
      }

      return commitPatch(
        state,
        {
          after: { ...state.defaults },
          before: { ...state.values },
          label: "Reset controls",
        },
        { ...state.defaults },
      );
    }

    case "controls.resetTargets": {
      const targetSet = new Set(command.targets);
      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      const resetMediaPatch = getResetMediaPatch(state, targetSet);

      for (const target of targetSet) {
        if (!(target in state.defaults) || Object.is(state.values[target], state.defaults[target])) {
          continue;
        }

        before[target] = state.values[target];
        after[target] = state.defaults[target];
      }

      const resetCanvasSize = getResetCanvasSize(state);
      const shouldResetCanvasSize =
        resetCanvasSize !== null &&
        (targetSet.has(canvasSizeWidthTarget) || targetSet.has(canvasSizeHeightTarget)) &&
        !canvasSizesEqual(state.canvas.size, resetCanvasSize);

      if (shouldResetCanvasSize) {
        before["canvas.size"] = state.canvas.size;
        after["canvas.size"] = resetCanvasSize;
      }

      if (resetMediaPatch) {
        Object.assign(before, resetMediaPatch.before);
        Object.assign(after, resetMediaPatch.after);
      }

      if (Object.keys(after).length === 0) {
        return state;
      }

      return commitStatePatch(state, {
        after,
        before,
        label: command.label ?? "Reset section",
      });
    }

    case "layers.add": {
      const layer = createLayer(state, command.layer);
      const insertIndex = clampInsertIndex(state.layers.length, command.insertIndex);
      const layers = [
        ...state.layers.slice(0, insertIndex),
        layer,
        ...state.layers.slice(insertIndex),
      ];

      return commitStatePatch(state, {
        after: {
          layers,
          selectedLayerId: layer.id,
        },
        before: {
          layers: state.layers,
          selectedLayerId: state.selectedLayerId,
        },
        label: layer.kind === "group" ? "Add group" : "Add layer",
      });
    }

    case "layers.delete": {
      if (!state.layers.some((layer) => layer.id === command.layerId)) {
        return state;
      }

      const deletedLayerIds = getLayerBlockIds(state.layers, command.layerId);
      const layers = state.layers.filter((layer) => !deletedLayerIds.has(layer.id));
      const mediaAssets = state.mediaAssets.filter((asset) => !deletedLayerIds.has(asset.layerId));
      const selectedLayerId = deletedLayerIds.has(state.selectedLayerId ?? "")
        ? (layers[0]?.id ?? null)
        : state.selectedLayerId;

      return commitStatePatch(state, {
        after: {
          layers,
          mediaAssets,
          selectedLayerId,
        },
        before: {
          layers: state.layers,
          mediaAssets: state.mediaAssets,
          selectedLayerId: state.selectedLayerId,
        },
        label: "Delete layer",
      });
    }

    case "layers.moveToGroup": {
      const movedRootLayerIds = new Set(
        command.layerIds.filter((layerId) =>
          canMoveLayerToParent(state.layers, layerId, command.parentGroupId),
        ),
      );

      if (movedRootLayerIds.size === 0) {
        return state;
      }

      const nextParentGroupId = command.parentGroupId ?? undefined;
      const movedBlockIds = new Set<string>();

      for (const layerId of movedRootLayerIds) {
        getLayerBlockIds(state.layers, layerId).forEach((blockLayerId) => {
          movedBlockIds.add(blockLayerId);
        });
      }

      const movingBlock = state.layers.filter((layer) => movedBlockIds.has(layer.id));
      const updatedMovingBlock = movingBlock.map((layer) =>
        movedRootLayerIds.has(layer.id) ? { ...layer, parentGroupId: nextParentGroupId } : layer,
      );
      const remainingLayers = state.layers.filter((layer) => !movedBlockIds.has(layer.id));
      const targetGroupIndex = command.parentGroupId
        ? remainingLayers.findIndex((layer) => layer.id === command.parentGroupId)
        : -1;
      const movedLayers = command.parentGroupId
        ? targetGroupIndex >= 0
          ? [
              ...remainingLayers.slice(0, targetGroupIndex + 1),
              ...updatedMovingBlock,
              ...remainingLayers.slice(targetGroupIndex + 1),
            ]
          : state.layers
        : state.layers.map((layer) =>
            movedRootLayerIds.has(layer.id) ? { ...layer, parentGroupId: nextParentGroupId } : layer,
          );
      const layers = command.parentGroupId
        ? movedLayers.map((layer) =>
            layer.id === command.parentGroupId && layer.kind === "group" && layer.collapsed
              ? { ...layer, collapsed: false }
              : layer,
          )
        : movedLayers;

      if (layers === state.layers) {
        return state;
      }

      if (
        layers.every(
          (layer, index) =>
            layer.id === state.layers[index]?.id &&
            layer.parentGroupId === state.layers[index]?.parentGroupId &&
            layer.collapsed === state.layers[index]?.collapsed,
        )
      ) {
        return state;
      }

      return commitStatePatch(state, {
        after: { layers },
        before: { layers: state.layers },
        label: command.parentGroupId ? "Move layers to group" : "Move layers to root",
      });
    }

    case "layers.select":
      if (!state.layers.some((layer) => layer.id === command.layerId)) {
        return state;
      }

      return {
        ...state,
        selectedLayerId: command.layerId,
      };

    case "layers.rename": {
      const name = command.name.trim();

      if (!name || !state.layers.some((layer) => layer.id === command.layerId)) {
        return state;
      }

      const layers = state.layers.map((layer) =>
        layer.id === command.layerId ? { ...layer, displayName: name } : layer,
      );

      return commitStatePatch(state, {
        after: { layers },
        before: { layers: state.layers },
        label: "Rename layer",
      });
    }

    case "layers.toggleCollapsed": {
      const targetLayer = state.layers.find((layer) => layer.id === command.layerId);

      if (!targetLayer || targetLayer.kind !== "group") {
        return state;
      }

      const layers = state.layers.map((layer) =>
        layer.id === command.layerId ? { ...layer, collapsed: !layer.collapsed } : layer,
      );

      return commitStatePatch(state, {
        after: { layers },
        before: { layers: state.layers },
        label: "Toggle group",
      });
    }

    case "layers.toggleVisibility": {
      if (!state.layers.some((layer) => layer.id === command.layerId)) {
        return state;
      }

      const layers = state.layers.map((layer) =>
        layer.id === command.layerId ? { ...layer, visible: !layer.visible } : layer,
      );

      return commitStatePatch(state, {
        after: { layers },
        before: { layers: state.layers },
        label: "Toggle layer visibility",
      });
    }

    case "layers.reorder": {
      const nextLayerIds = new Set(command.layers.map((layer) => layer.id));

      if (nextLayerIds.size !== command.layers.length || nextLayerIds.size !== state.layers.length) {
        return state;
      }

      if (!state.layers.every((layer) => nextLayerIds.has(layer.id))) {
        return state;
      }

      return commitStatePatch(state, {
        after: {
          layers: command.layers,
          selectedLayerId: command.selectedLayerId ?? state.selectedLayerId,
        },
        before: {
          layers: state.layers,
          selectedLayerId: state.selectedLayerId,
        },
        label: "Reorder layers",
      });
    }

    case "canvas.setOffset":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          offset: command.offset,
        },
      };

    case "canvas.panBy":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          offset: {
            x: state.canvas.offset.x + command.delta.x,
            y: state.canvas.offset.y + command.delta.y,
          },
        },
      };

    case "canvas.setSize":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          size: command.size,
        },
        history: {
          redo: [],
          undo: [
            ...state.history.undo,
            {
              after: { "canvas.size": command.size },
              before: { "canvas.size": state.canvas.size },
              label: "Resize canvas",
            },
          ],
        },
      };

    case "canvas.center":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          offset: { x: 0, y: 0 },
        },
      };

    case "canvas.zoomIn":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          zoom: clampToolcraftCanvasZoom(state.canvas.zoom + toolcraftCanvasZoomStep),
        },
      };

    case "canvas.zoomOut":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          zoom: clampToolcraftCanvasZoom(state.canvas.zoom - toolcraftCanvasZoomStep),
        },
      };

    case "canvas.zoomReset":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          zoom: toolcraftCanvasZoomDefault,
        },
      };

    case "canvas.setViewport":
      return {
        ...state,
        canvas: {
          ...state.canvas,
          offset: command.offset,
          zoom: clampToolcraftCanvasZoom(command.zoom),
        },
      };

    case "panels.setOffset":
      return {
        ...state,
        panels: {
          ...state.panels,
          [command.panelId]: {
            ...state.panels[command.panelId],
            offset: command.offset,
          },
        },
      };

    case "panels.setHidden":
      if (state.panels[command.panelId].hidden === command.hidden) {
        return state;
      }

      return {
        ...state,
        panels: {
          ...state.panels,
          [command.panelId]: {
            ...state.panels[command.panelId],
            hidden: command.hidden,
          },
        },
      };

    case "panels.resetOffset":
      return {
        ...state,
        panels: {
          ...state.panels,
          [command.panelId]: {
            ...state.panels[command.panelId],
            offset: { x: 0, y: 0 },
          },
        },
      };

    case "media.import": {
      const shouldReplaceSingleLayerMedia =
        !state.schema.panels.layers && command.replaceExisting !== false;
      const assetKind = command.asset.assetKind ?? "image";
      const sourceTarget = command.asset.sourceTarget;
      const existingSourceMediaAsset =
        shouldReplaceSingleLayerMedia && sourceTarget
          ? state.mediaAssets.find((asset) => asset.sourceTarget === sourceTarget)
          : undefined;
      const shouldResizeCanvas =
        state.schema.canvas.sizing.mode === "intrinsic-media" &&
        assetKind === "image" &&
        command.asset.size !== undefined;
      const layerId =
        command.asset.layerId ??
        existingSourceMediaAsset?.layerId ??
        (shouldReplaceSingleLayerMedia && !sourceTarget
          ? getSingleLayerImportId(state)
          : undefined) ??
        getNextLayerId(state);
      const mediaId =
        command.asset.id ??
        existingSourceMediaAsset?.id ??
        (shouldReplaceSingleLayerMedia && !sourceTarget
          ? getSingleMediaImportId(state)
          : undefined) ??
        getNextMediaId(state);
      const layer = {
        displayName: command.asset.layerName ?? getImportedLayerName(command.asset.fileName),
        id: layerId,
        kind: "layer" as const,
        name: command.asset.layerName ?? getImportedLayerName(command.asset.fileName),
        visible: true,
      };
      const mediaAsset = {
        ...(command.asset.assetKind ? { assetKind: command.asset.assetKind } : {}),
        dataUrl: command.asset.dataUrl,
        fileName: command.asset.fileName,
        id: mediaId,
        layerId,
        mimeType: command.asset.mimeType,
        position: shouldResizeCanvas ? { x: 0, y: 0 } : command.asset.position,
        ...(command.asset.size ? { size: command.asset.size } : {}),
        ...(sourceTarget ? { sourceTarget } : {}),
      };
      const layers = shouldReplaceSingleLayerMedia
        ? sourceTarget
          ? state.layers.some((entry) => entry.id === layerId)
            ? state.layers.map((entry) => (entry.id === layerId ? layer : entry))
            : [...state.layers, layer]
          : [layer]
        : [...state.layers, layer];
      const mediaAssets = shouldReplaceSingleLayerMedia
        ? sourceTarget
          ? existingSourceMediaAsset
            ? state.mediaAssets.map((asset) =>
                asset.id === existingSourceMediaAsset.id ? mediaAsset : asset,
              )
            : [...state.mediaAssets, mediaAsset]
          : [mediaAsset]
        : [...state.mediaAssets, mediaAsset];
      const after = {
        ...(shouldResizeCanvas ? { "canvas.size": command.asset.size } : {}),
        layers,
        mediaAssets,
        selectedLayerId: layerId,
      };
      const before = {
        ...(shouldResizeCanvas ? { "canvas.size": state.canvas.size } : {}),
        layers: state.layers,
        mediaAssets: state.mediaAssets,
        selectedLayerId: state.selectedLayerId,
      };

      return commitStatePatch(state, {
        after,
        before,
        label: "Import media",
      });
    }

    case "media.delete": {
      if (!state.mediaAssets.some((asset) => asset.id === command.mediaId)) {
        return state;
      }

      const mediaAssets = state.mediaAssets.filter((asset) => asset.id !== command.mediaId);
      const timeline = getMediaReadyTimelineState(state.schema, state.timeline, mediaAssets);
      const shouldCommitTimeline = timeline !== state.timeline;

      return commitStatePatch(state, {
        after: {
          mediaAssets,
          ...(shouldCommitTimeline ? { timeline } : {}),
        },
        before: {
          mediaAssets: state.mediaAssets,
          ...(shouldCommitTimeline ? { timeline: state.timeline } : {}),
        },
        label: "Delete media",
      });
    }

    case "media.reorder": {
      if (state.mediaAssets.length < 2 || command.mediaIds.length === 0) {
        return state;
      }

      const mediaById = new Map(state.mediaAssets.map((asset) => [asset.id, asset]));
      const seenIds = new Set<string>();
      const reorderedMediaAssets = command.mediaIds.flatMap((mediaId) => {
        const mediaAsset = mediaById.get(mediaId);

        if (!mediaAsset || seenIds.has(mediaId)) {
          return [];
        }

        seenIds.add(mediaId);
        return [mediaAsset];
      });

      if (reorderedMediaAssets.length === 0) {
        return state;
      }

      for (const mediaAsset of state.mediaAssets) {
        if (!seenIds.has(mediaAsset.id)) {
          reorderedMediaAssets.push(mediaAsset);
        }
      }

      if (
        reorderedMediaAssets.length === state.mediaAssets.length &&
        reorderedMediaAssets.every((asset, index) => asset.id === state.mediaAssets[index]?.id)
      ) {
        return state;
      }

      return commitStatePatch(state, {
        after: { mediaAssets: reorderedMediaAssets },
        before: { mediaAssets: state.mediaAssets },
        label: "Reorder media",
      });
    }

    case "media.transform": {
      const targetMediaAsset = state.mediaAssets.find((asset) => asset.id === command.mediaId);

      if (!targetMediaAsset || (targetMediaAsset.assetKind ?? "image") !== "image") {
        return state;
      }

      const mediaAssets = state.mediaAssets.map((asset) =>
        asset.id === targetMediaAsset.id
          ? getTransformedMediaAsset(asset, command.operation)
          : asset,
      );

      return commitStatePatch(state, {
        after: { mediaAssets },
        before: { mediaAssets: state.mediaAssets },
        label: "Transform media",
      });
    }

    case "timeline.setCurrentTime": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTimeSeconds: clampTimelineTime(
            command.currentTimeSeconds,
            state.timeline.durationSeconds,
          ),
        },
      };
    }

    case "timeline.setDuration": {
      const durationSeconds = clampTimelineDuration(command.durationSeconds);
      const timeline = {
        ...state.timeline,
        currentTimeSeconds: clampTimelineTime(state.timeline.currentTimeSeconds, durationSeconds),
        durationSeconds,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Set timeline duration",
      });
    }

    case "timeline.setExpanded": {
      if (state.timeline.expanded === command.expanded) {
        return state;
      }

      return {
        ...state,
        timeline: {
          ...state.timeline,
          expanded: command.expanded,
        },
      };
    }

    case "timeline.toggleExpanded": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          expanded: !state.timeline.expanded,
        },
      };
    }

    case "timeline.setPlaying": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isPlaying: command.isPlaying,
        },
      };
    }

    case "timeline.togglePlayback": {
      const shouldRestartPlayback =
        !state.timeline.isPlaying &&
        state.timeline.currentTimeSeconds >= state.timeline.durationSeconds;

      return {
        ...state,
        timeline: {
          ...state.timeline,
          currentTimeSeconds: shouldRestartPlayback ? 0 : state.timeline.currentTimeSeconds,
          isPlaying: !state.timeline.isPlaying,
        },
      };
    }

    case "timeline.toggleLoop": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          isLooping: !state.timeline.isLooping,
        },
      };
    }

    case "timeline.selectKeyframe": {
      return {
        ...state,
        timeline: {
          ...state.timeline,
          selectedKeyframeId: command.keyframeId,
        },
      };
    }

    case "timeline.deleteKeyframe": {
      if (
        !state.timeline.keyframeGroups.some((group) =>
          group.keyframes.some((keyframe) => keyframe.id === command.keyframeId),
        )
      ) {
        return state;
      }

      const timeline = {
        ...state.timeline,
        keyframeGroups: state.timeline.keyframeGroups
          .map((group) => ({
            ...group,
            keyframes: group.keyframes.filter((keyframe) => keyframe.id !== command.keyframeId),
          }))
          .filter((group) => group.keyframes.length > 0),
        selectedKeyframeId: null,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Delete keyframe",
      });
    }

    case "timeline.deleteControlKeyframes": {
      if (!state.timeline.keyframeGroups.some((group) => group.controlId === command.controlId)) {
        return state;
      }

      const timeline = {
        ...state.timeline,
        keyframeGroups: state.timeline.keyframeGroups.filter(
          (group) => group.controlId !== command.controlId,
        ),
        selectedKeyframeId: null,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Delete control keyframes",
      });
    }

    case "timeline.toggleControlKeyframes": {
      const existingGroup = state.timeline.keyframeGroups.find(
        (group) => group.controlId === command.controlId,
      );

      if (existingGroup) {
        const timeline = {
          ...state.timeline,
          expanded: true,
          keyframeGroups: state.timeline.keyframeGroups.filter(
            (group) => group.controlId !== command.controlId,
          ),
          selectedKeyframeId: null,
        };

        return commitStatePatch(state, {
          after: { timeline },
          before: { timeline: state.timeline },
          label: "Delete control keyframes",
        });
      }

      const keyframe = createTimelineControlKeyframe({
        controlId: command.controlId,
        controlLabel: command.controlLabel,
        state,
        timeSeconds: command.timeSeconds,
        value: command.value,
        valueLabel: command.valueLabel,
      });
      const timeline = {
        ...state.timeline,
        expanded: true,
        keyframeGroups: upsertTimelineControlKeyframeGroup({
          controlId: command.controlId,
          controlLabel: command.controlLabel,
          keyframe,
          keyframeGroups: state.timeline.keyframeGroups,
        }),
        selectedKeyframeId: keyframe.id,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Add control keyframe",
      });
    }

    case "timeline.upsertControlKeyframe": {
      const keyframe = createTimelineControlKeyframe({
        controlId: command.controlId,
        controlLabel: command.controlLabel,
        state,
        timeSeconds: command.timeSeconds,
        value: command.value,
        valueLabel: command.valueLabel,
      });
      const timeline = {
        ...state.timeline,
        expanded: true,
        keyframeGroups: upsertTimelineControlKeyframeGroup({
          controlId: command.controlId,
          controlLabel: command.controlLabel,
          keyframe,
          keyframeGroups: state.timeline.keyframeGroups,
        }),
        selectedKeyframeId: keyframe.id,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Set control keyframe",
      });
    }

    case "timeline.moveKeyframe": {
      const targetKeyframe = state.timeline.keyframeGroups
        .flatMap((group) => group.keyframes)
        .find((keyframe) => keyframe.id === command.keyframeId);

      if (!targetKeyframe) {
        return state;
      }

      const timeSeconds = getRoundedTimelineKeyframeTime(
        clampTimelineTime(command.timeSeconds, state.timeline.durationSeconds),
      );
      const nextKeyframeId = getTimelineKeyframeId(targetKeyframe.controlId, timeSeconds);
      const timeline = {
        ...state.timeline,
        keyframeGroups: mapTimelineKeyframeGroups(
          state.timeline.keyframeGroups,
          command.keyframeId,
          (keyframe) => ({
            ...keyframe,
            id: nextKeyframeId,
            timeSeconds,
          }),
        ),
        selectedKeyframeId: nextKeyframeId,
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Move keyframe",
      });
    }

    case "timeline.changeKeyframeEasing": {
      if (
        !state.timeline.keyframeGroups.some((group) =>
          group.keyframes.some((keyframe) => keyframe.id === command.keyframeId),
        )
      ) {
        return state;
      }

      const timeline = {
        ...state.timeline,
        keyframeGroups: mapTimelineKeyframeGroups(
          state.timeline.keyframeGroups,
          command.keyframeId,
          (keyframe) => ({
            ...keyframe,
            easing: command.easing,
          }),
        ),
      };

      return commitStatePatch(state, {
        after: { timeline },
        before: { timeline: state.timeline },
        label: "Change keyframe easing",
      });
    }

    case "history.undo": {
      const patch = state.history.undo.at(-1);

      if (!patch) {
        return state;
      }

      const next = applyHistoryPatch(state, patch.before);

      return {
        ...state,
        canvas: next.canvas,
        history: {
          redo: [...state.history.redo, patch],
          undo: state.history.undo.slice(0, -1),
        },
        layers: next.layers,
        mediaAssets: next.mediaAssets,
        selectedLayerId: next.selectedLayerId,
        timeline: next.timeline,
        values: next.values,
      };
    }

    case "history.redo": {
      const patch = state.history.redo.at(-1);

      if (!patch) {
        return state;
      }

      const next = applyHistoryPatch(state, patch.after);

      return {
        ...state,
        canvas: next.canvas,
        history: {
          redo: state.history.redo.slice(0, -1),
          undo: [...state.history.undo, patch],
        },
        layers: next.layers,
        mediaAssets: next.mediaAssets,
        selectedLayerId: next.selectedLayerId,
        timeline: next.timeline,
        values: next.values,
      };
    }
  }
}
