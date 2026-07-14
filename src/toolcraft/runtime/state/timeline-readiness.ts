import type { ResolvedToolcraftAppSchema } from "../schema/types";
import type {
  ToolcraftMediaAsset,
  ToolcraftTimelineState,
} from "./types";

export function doesTimelineRequireMedia(
  schema: ResolvedToolcraftAppSchema,
): boolean {
  return Boolean(
    schema.panels.timeline?.enabled &&
      schema.canvas.enabled &&
      schema.canvas.upload &&
      schema.canvas.sizing.mode === "intrinsic-media",
  );
}

export function isTimelineReadyForPlayback(
  schema: ResolvedToolcraftAppSchema,
  mediaAssets: readonly ToolcraftMediaAsset[],
): boolean {
  return !doesTimelineRequireMedia(schema) || mediaAssets.length > 0;
}

export function getMediaReadyTimelineState(
  schema: ResolvedToolcraftAppSchema,
  timeline: ToolcraftTimelineState,
  mediaAssets: readonly ToolcraftMediaAsset[],
): ToolcraftTimelineState {
  if (isTimelineReadyForPlayback(schema, mediaAssets)) {
    return timeline;
  }

  if (!timeline.isPlaying && timeline.currentTimeSeconds === 0) {
    return timeline;
  }

  return {
    ...timeline,
    currentTimeSeconds: 0,
    isPlaying: false,
  };
}
