import type { ResolvedToolcraftAppSchema } from "../schema/types";
import { isToolcraftTimelinePanelRuntimeTarget } from "../schema/runtime-targets";
import type {
  ToolcraftInitialState,
  ToolcraftState,
  ToolcraftTimelineKeyframeGroup,
  ToolcraftTimelineState,
} from "./types";
import { toolcraftCanvasZoomDefault } from "./canvas-zoom";
import {
  cloneToolcraftLayers,
  cloneToolcraftMediaAssets,
  createToolcraftDefaultMediaState,
  createToolcraftLayersFromMediaAssets,
} from "./media-defaults";
import { getMediaReadyTimelineState } from "./timeline-readiness";

function cloneTimelineKeyframeGroups(
  keyframeGroups: readonly ToolcraftTimelineKeyframeGroup[],
): ToolcraftTimelineKeyframeGroup[] {
  return keyframeGroups.map((group) => ({
    ...group,
    keyframes: group.keyframes.map((keyframe) => ({
      ...keyframe,
      easing:
        keyframe.easing?.type === "bezier"
          ? {
              controlPoints: [...keyframe.easing.controlPoints],
              type: "bezier",
            }
          : keyframe.easing,
    })),
  }));
}

function createDefaultTimelineState({
  defaultDurationSeconds,
  timeline,
}: {
  defaultDurationSeconds: number;
  timeline?: Partial<ToolcraftTimelineState>;
}): ToolcraftTimelineState {
  return {
    currentTimeSeconds: 0,
    durationSeconds: defaultDurationSeconds,
    expanded: false,
    isLooping: true,
    isPlaying: true,
    selectedKeyframeId: null,
    ...timeline,
    keyframeGroups: cloneTimelineKeyframeGroups(timeline?.keyframeGroups ?? []),
  };
}

export function createToolcraftState(
  schema: ResolvedToolcraftAppSchema,
  initialState: ToolcraftInitialState = {},
): ToolcraftState {
  const defaults: Record<string, unknown> = {};
  const defaultMediaState = createToolcraftDefaultMediaState(schema);
  const hasInitialMediaAssets = Object.hasOwn(initialState, "mediaAssets");
  const mediaAssets = hasInitialMediaAssets
    ? cloneToolcraftMediaAssets(initialState.mediaAssets ?? [])
    : cloneToolcraftMediaAssets(defaultMediaState.mediaAssets);
  const layers =
    initialState.layers ??
    (hasInitialMediaAssets
      ? createToolcraftLayersFromMediaAssets(mediaAssets, defaultMediaState.layers)
      : cloneToolcraftLayers(defaultMediaState.layers));
  const selectedLayerId =
    initialState.selectedLayerId ??
    (hasInitialMediaAssets ? (layers[0]?.id ?? null) : defaultMediaState.selectedLayerId);
  const timeline = getMediaReadyTimelineState(
    schema,
    createDefaultTimelineState({
      defaultDurationSeconds: schema.panels.timeline?.defaultDurationSeconds ?? 8,
      timeline: initialState.timeline,
    }),
    mediaAssets,
  );

  for (const section of schema.panels.controls?.sections ?? []) {
    for (const control of Object.values(section.controls)) {
      if (isToolcraftTimelinePanelRuntimeTarget(control.target)) {
        continue;
      }

      defaults[control.target] = control.defaultValue;
    }
  }

  const panels: ToolcraftState["panels"] = {
    controls: { offset: { x: 0, y: 0 } },
    layers: { offset: { x: 0, y: 0 } },
    timeline: { offset: { x: 0, y: 0 } },
    toolbar: { offset: { x: 0, y: 0 } },
  };
  const initialCanvas = {
    offset: { x: 0, y: 0 },
    size: schema.canvas.size,
    zoom: toolcraftCanvasZoomDefault,
    ...initialState.canvas,
  };

  return {
    canvas: initialCanvas,
    defaults,
    history: {
      redo: [],
      undo: [],
    },
    layers,
    mediaAssets,
    panels: {
      controls: { ...panels.controls, ...initialState.panels?.controls },
      layers: { ...panels.layers, ...initialState.panels?.layers },
      timeline: { ...panels.timeline, ...initialState.panels?.timeline },
      toolbar: { ...panels.toolbar, ...initialState.panels?.toolbar },
    },
    schema,
    selectedLayerId,
    timeline,
    values: { ...defaults, ...initialState.values },
  };
}
