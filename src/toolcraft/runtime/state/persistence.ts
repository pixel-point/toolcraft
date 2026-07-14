import type {
  ToolcraftLocalStoragePersistenceSchema,
  ResolvedToolcraftAppSchema,
} from "../schema/types";
import { isToolcraftTimelinePanelRuntimeTarget } from "../schema/runtime-targets";
import type {
  ToolcraftCanvasState,
  ToolcraftInitialState,
  ToolcraftLayer,
  ToolcraftMediaAsset,
  ToolcraftPanelId,
  ToolcraftPanelState,
  ToolcraftState,
  ToolcraftTimelineBezierControlPoints,
  ToolcraftTimelineKeyframe,
  ToolcraftTimelineKeyframeEasing,
  ToolcraftTimelineKeyframeGroup,
  ToolcraftTimelineState,
} from "./types";

export type ToolcraftPersistencePayload = {
  state: ToolcraftInitialState;
  version: number;
};

const panelIds = ["controls", "layers", "timeline", "toolbar"] as const satisfies readonly ToolcraftPanelId[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readPoint(value: unknown): { x: number; y: number } | undefined {
  if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
    return undefined;
  }

  return { x: value.x, y: value.y };
}

function readCanvasSize(value: unknown): ToolcraftCanvasState["size"] | undefined {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.width) ||
    !isFiniteNumber(value.height) ||
    value.unit !== "px"
  ) {
    return undefined;
  }

  return { height: value.height, unit: "px", width: value.width };
}

function readCanvas(value: unknown): Partial<ToolcraftCanvasState> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const canvas: Partial<ToolcraftCanvasState> = {};
  const offset = readPoint(value.offset);
  const size = readCanvasSize(value.size);

  if (offset) {
    canvas.offset = offset;
  }

  if (size) {
    canvas.size = size;
  }

  if (isFiniteNumber(value.zoom)) {
    canvas.zoom = value.zoom;
  }

  return Object.keys(canvas).length > 0 ? canvas : undefined;
}

function readPanel(value: unknown): Partial<ToolcraftPanelState> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const panel: Partial<ToolcraftPanelState> = {};
  const offset = readPoint(value.offset);

  if (offset) {
    panel.offset = offset;
  }

  if (typeof value.collapsed === "boolean") {
    panel.collapsed = value.collapsed;
  }

  if (typeof value.extended === "boolean") {
    panel.extended = value.extended;
  }

  if (typeof value.hidden === "boolean") {
    panel.hidden = value.hidden;
  }

  return Object.keys(panel).length > 0 ? panel : undefined;
}

function readPanels(
  value: unknown,
): Partial<Record<ToolcraftPanelId, Partial<ToolcraftPanelState>>> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const panels: Partial<Record<ToolcraftPanelId, Partial<ToolcraftPanelState>>> = {};

  for (const panelId of panelIds) {
    const panel = readPanel(value[panelId]);

    if (panel) {
      panels[panelId] = panel;
    }
  }

  return Object.keys(panels).length > 0 ? panels : undefined;
}

function readLayer(value: unknown): ToolcraftLayer | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.visible !== "boolean"
  ) {
    return undefined;
  }

  const layer: ToolcraftLayer = {
    id: value.id,
    name: value.name,
    visible: value.visible,
  };

  if (value.kind === "group" || value.kind === "layer") {
    layer.kind = value.kind;
  }

  if (typeof value.collapsed === "boolean") {
    layer.collapsed = value.collapsed;
  }

  if (typeof value.displayName === "string") {
    layer.displayName = value.displayName;
  }

  if (typeof value.parentGroupId === "string") {
    layer.parentGroupId = value.parentGroupId;
  }

  return layer;
}

function readLayers(value: unknown): ToolcraftLayer[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.flatMap((item) => {
    const layer = readLayer(item);
    return layer ? [layer] : [];
  });
}

function readMediaAsset(value: unknown): ToolcraftMediaAsset | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.layerId !== "string" ||
    typeof value.dataUrl !== "string" ||
    typeof value.fileName !== "string" ||
    typeof value.mimeType !== "string"
  ) {
    return undefined;
  }

  const position = readPoint(value.position);

  if (!position) {
    return undefined;
  }

  const mediaAsset: ToolcraftMediaAsset = {
    dataUrl: value.dataUrl,
    fileName: value.fileName,
    id: value.id,
    layerId: value.layerId,
    mimeType: value.mimeType,
    position,
  };
  const size = readCanvasSize(value.size);

  if (value.assetKind === "file" || value.assetKind === "image") {
    mediaAsset.assetKind = value.assetKind;
  }

  if (size) {
    mediaAsset.size = size;
  }

  if (typeof value.sourceTarget === "string") {
    mediaAsset.sourceTarget = value.sourceTarget;
  }

  if (isRecord(value.transform)) {
    mediaAsset.transform = {};

    if (typeof value.transform.flipHorizontal === "boolean") {
      mediaAsset.transform.flipHorizontal = value.transform.flipHorizontal;
    }

    if (typeof value.transform.flipVertical === "boolean") {
      mediaAsset.transform.flipVertical = value.transform.flipVertical;
    }

    if (
      value.transform.rotationDeg === 0 ||
      value.transform.rotationDeg === 90 ||
      value.transform.rotationDeg === 180 ||
      value.transform.rotationDeg === 270
    ) {
      mediaAsset.transform.rotationDeg = value.transform.rotationDeg;
    }

    if (Object.keys(mediaAsset.transform).length === 0) {
      delete mediaAsset.transform;
    }
  }

  return mediaAsset;
}

function readMediaAssets(value: unknown): ToolcraftMediaAsset[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.flatMap((item) => {
    const mediaAsset = readMediaAsset(item);
    return mediaAsset ? [mediaAsset] : [];
  });
}

function readBezierControlPoints(
  value: unknown,
): ToolcraftTimelineBezierControlPoints | undefined {
  if (
    !Array.isArray(value) ||
    value.length !== 4 ||
    !value.every((item) => isFiniteNumber(item))
  ) {
    return undefined;
  }

  return [
    value[0] as number,
    value[1] as number,
    value[2] as number,
    value[3] as number,
  ];
}

function readKeyframeEasing(value: unknown): ToolcraftTimelineKeyframeEasing | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  if (value.type === "step") {
    return { type: "step" };
  }

  if (value.type !== "bezier") {
    return undefined;
  }

  const controlPoints = readBezierControlPoints(value.controlPoints);

  return controlPoints ? { controlPoints, type: "bezier" } : undefined;
}

function readKeyframe(value: unknown): ToolcraftTimelineKeyframe | undefined {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.controlId !== "string" ||
    typeof value.controlLabel !== "string" ||
    typeof value.valueLabel !== "string" ||
    !isFiniteNumber(value.timeSeconds)
  ) {
    return undefined;
  }

  const keyframe: ToolcraftTimelineKeyframe = {
    controlId: value.controlId,
    controlLabel: value.controlLabel,
    id: value.id,
    timeSeconds: value.timeSeconds,
    valueLabel: value.valueLabel,
  };
  const easing = readKeyframeEasing(value.easing);

  if ("value" in value) {
    keyframe.value = value.value;
  }

  if (easing) {
    keyframe.easing = easing;
  }

  return keyframe;
}

function readKeyframeGroup(value: unknown): ToolcraftTimelineKeyframeGroup | undefined {
  if (
    !isRecord(value) ||
    typeof value.controlId !== "string" ||
    typeof value.label !== "string" ||
    !Array.isArray(value.keyframes)
  ) {
    return undefined;
  }

  return {
    controlId: value.controlId,
    keyframes: value.keyframes.flatMap((item) => {
      const keyframe = readKeyframe(item);
      return keyframe ? [keyframe] : [];
    }),
    label: value.label,
  };
}

function readTimeline(value: unknown): Partial<ToolcraftTimelineState> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const timeline: Partial<ToolcraftTimelineState> = {};

  if (isFiniteNumber(value.currentTimeSeconds)) {
    timeline.currentTimeSeconds = value.currentTimeSeconds;
  }

  if (isFiniteNumber(value.durationSeconds)) {
    timeline.durationSeconds = value.durationSeconds;
  }

  if (typeof value.expanded === "boolean") {
    timeline.expanded = value.expanded;
  }

  if (typeof value.isLooping === "boolean") {
    timeline.isLooping = value.isLooping;
  }

  if (typeof value.isPlaying === "boolean") {
    timeline.isPlaying = value.isPlaying;
  }

  if (typeof value.selectedKeyframeId === "string" || value.selectedKeyframeId === null) {
    timeline.selectedKeyframeId = value.selectedKeyframeId;
  }

  if (Array.isArray(value.keyframeGroups)) {
    timeline.keyframeGroups = value.keyframeGroups.flatMap((item) => {
      const group = readKeyframeGroup(item);
      return group ? [group] : [];
    });
  }

  return Object.keys(timeline).length > 0 ? timeline : undefined;
}

function getKnownValueTargets(schema: ResolvedToolcraftAppSchema): Set<string> {
  const targets = new Set<string>();

  for (const section of schema.panels.controls?.sections ?? []) {
    for (const control of Object.values(section.controls)) {
      if (
        control.type !== "panelActions" &&
        !isToolcraftTimelinePanelRuntimeTarget(control.target)
      ) {
        targets.add(control.target);
      }
    }
  }

  return targets;
}

function readValues(
  schema: ResolvedToolcraftAppSchema,
  value: unknown,
): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const targets = getKnownValueTargets(schema);
  const values: Record<string, unknown> = {};

  for (const target of targets) {
    if (Object.hasOwn(value, target)) {
      values[target] = value[target];
    }
  }

  return Object.keys(values).length > 0 ? values : undefined;
}

function pickPersistedValues(state: ToolcraftState): Record<string, unknown> | undefined {
  const values: Record<string, unknown> = {};

  for (const target of Object.keys(state.defaults)) {
    if (Object.hasOwn(state.values, target)) {
      values[target] = state.values[target];
    }
  }

  return Object.keys(values).length > 0 ? values : undefined;
}

export function createToolcraftPersistenceSnapshot(
  state: ToolcraftState,
  persistence: ResolvedToolcraftAppSchema["persistence"],
): ToolcraftPersistencePayload | undefined {
  if (persistence.storage !== "localStorage") {
    return undefined;
  }

  const included = new Set(persistence.include);
  const initialState: ToolcraftInitialState = {};

  if (included.has("values")) {
    initialState.values = pickPersistedValues(state);
  }

  if (included.has("canvas")) {
    initialState.canvas = state.canvas;
  }

  if (included.has("panels")) {
    initialState.panels = state.panels;
  }

  if (included.has("timeline")) {
    initialState.timeline = state.timeline;
  }

  if (included.has("layers")) {
    initialState.layers = state.layers;
    initialState.selectedLayerId = state.selectedLayerId;
  }

  if (included.has("media")) {
    initialState.mediaAssets = state.mediaAssets;
  }

  return {
    state: initialState,
    version: persistence.version,
  };
}

export function parseToolcraftPersistenceSnapshot(
  schema: ResolvedToolcraftAppSchema,
  rawValue: string | null,
): ToolcraftInitialState | undefined {
  const persistence = schema.persistence;

  if (persistence.storage !== "localStorage" || !rawValue) {
    return undefined;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(rawValue);
  } catch {
    return undefined;
  }

  if (!isRecord(payload) || payload.version !== persistence.version || !isRecord(payload.state)) {
    return undefined;
  }

  const persistedState = payload.state;
  const included = new Set(persistence.include);
  const initialState: ToolcraftInitialState = {};

  if (included.has("values")) {
    const values = readValues(schema, persistedState.values);

    if (values) {
      initialState.values = values;
    }
  }

  if (included.has("canvas")) {
    const canvas = readCanvas(persistedState.canvas);

    if (canvas) {
      initialState.canvas = canvas;
    }
  }

  if (included.has("panels")) {
    const panels = readPanels(persistedState.panels);

    if (panels) {
      initialState.panels = panels;
    }
  }

  if (included.has("timeline")) {
    const timeline = readTimeline(persistedState.timeline);

    if (timeline) {
      initialState.timeline = timeline;
    }
  }

  if (included.has("layers")) {
    const layers = readLayers(persistedState.layers);

    if (layers) {
      initialState.layers = layers;

      if (
        typeof persistedState.selectedLayerId === "string" &&
        layers.some((layer) => layer.id === persistedState.selectedLayerId)
      ) {
        initialState.selectedLayerId = persistedState.selectedLayerId;
      } else if (persistedState.selectedLayerId === null) {
        initialState.selectedLayerId = null;
      }
    }
  }

  if (included.has("media")) {
    const mediaAssets = readMediaAssets(persistedState.mediaAssets);

    if (mediaAssets) {
      initialState.mediaAssets = mediaAssets;
    }
  }

  return Object.keys(initialState).length > 0 ? initialState : undefined;
}

export function mergeToolcraftInitialState(
  persistedState?: ToolcraftInitialState,
  explicitState?: ToolcraftInitialState,
): ToolcraftInitialState {
  const merged: ToolcraftInitialState = {};

  for (const state of [persistedState, explicitState]) {
    if (!state) {
      continue;
    }

    if (state.canvas) {
      merged.canvas = { ...merged.canvas, ...state.canvas };
    }

    if (state.panels) {
      merged.panels = { ...merged.panels };

      for (const panelId of panelIds) {
        const panel = state.panels[panelId];

        if (panel) {
          merged.panels[panelId] = { ...merged.panels[panelId], ...panel };
        }
      }
    }

    if (state.timeline) {
      merged.timeline = { ...merged.timeline, ...state.timeline };
    }

    if (state.values) {
      merged.values = { ...merged.values, ...state.values };
    }

    if (state.layers) {
      merged.layers = state.layers;
    }

    if (Object.hasOwn(state, "mediaAssets")) {
      merged.mediaAssets = state.mediaAssets;
    }

    if (Object.hasOwn(state, "selectedLayerId")) {
      merged.selectedLayerId = state.selectedLayerId;
    }
  }

  return merged;
}

export function getToolcraftPersistenceKey(
  persistence: ResolvedToolcraftAppSchema["persistence"],
): ToolcraftLocalStoragePersistenceSchema["key"] | undefined {
  return persistence.storage === "localStorage" ? persistence.key : undefined;
}
