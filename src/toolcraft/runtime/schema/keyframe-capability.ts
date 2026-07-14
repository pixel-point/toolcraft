import { isToolcraftRuntimeOwnedTarget } from "./runtime-targets";
import type { ToolcraftControlSchema } from "./types";

export type ToolcraftControlKeyframeCapabilityReason =
  | "control-type"
  | "runtime-owned-target";

export type ToolcraftControlKeyframeCapability =
  | {
      capable: true;
      reason: "control-type";
    }
  | {
      capable: false;
      reason: ToolcraftControlKeyframeCapabilityReason;
    };

const keyframeCapableControlTypes = new Set([
  "anchorGrid",
  "channelMixer",
  "color",
  "curves",
  "gradient",
  "rangeInput",
  "rangeSlider",
  "slider",
  "vector",
]);

export function getToolcraftControlKeyframeCapability(
  control: ToolcraftControlSchema,
): ToolcraftControlKeyframeCapability {
  if (isToolcraftRuntimeOwnedTarget(control.target)) {
    return {
      capable: false,
      reason: "runtime-owned-target",
    };
  }

  if (keyframeCapableControlTypes.has(control.type)) {
    return {
      capable: true,
      reason: "control-type",
    };
  }

  return {
    capable: false,
    reason: "control-type",
  };
}
