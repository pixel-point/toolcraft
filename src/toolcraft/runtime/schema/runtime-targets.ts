export const toolcraftTimelinePanelVisibleTarget = "panels.timeline.visible";
export const toolcraftTimelinePanelExtendedTarget = "panels.timeline.extended";

export const toolcraftRuntimeOwnedTargets = [
  "canvas.aspectRatio",
  "canvas.renderScale",
  "canvas.size.width",
  "canvas.size.height",
  "runtime.settingsTransfer",
  toolcraftTimelinePanelExtendedTarget,
  toolcraftTimelinePanelVisibleTarget,
] as const;

export const toolcraftReservedTargets = [
  ...toolcraftRuntimeOwnedTargets,
  "selectedLayer.opacity",
  "selectedLayer.visible",
] as const;

export type ToolcraftRuntimeOwnedTarget =
  (typeof toolcraftRuntimeOwnedTargets)[number];

export type ToolcraftReservedTarget = (typeof toolcraftReservedTargets)[number];

export function getToolcraftCanvasSizeTargetDimension(
  target: string,
): "height" | "width" | null {
  switch (target) {
    case "canvas.size.height":
      return "height";
    case "canvas.size.width":
      return "width";
    default:
      return null;
  }
}

export function isToolcraftCanvasAspectRatioTarget(target: string): boolean {
  return target === "canvas.aspectRatio";
}

export function isToolcraftTimelinePanelVisibleTarget(target: string): boolean {
  return target === toolcraftTimelinePanelVisibleTarget;
}

export function isToolcraftTimelinePanelExtendedTarget(target: string): boolean {
  return target === toolcraftTimelinePanelExtendedTarget;
}

export function isToolcraftTimelinePanelRuntimeTarget(target: string): boolean {
  return (
    isToolcraftTimelinePanelExtendedTarget(target) ||
    isToolcraftTimelinePanelVisibleTarget(target)
  );
}

export function isToolcraftReservedTarget(
  target: string,
): target is ToolcraftReservedTarget {
  return toolcraftReservedTargets.includes(target as ToolcraftReservedTarget);
}

export function isToolcraftRuntimeOwnedTarget(
  target: string,
): target is ToolcraftRuntimeOwnedTarget {
  return toolcraftRuntimeOwnedTargets.includes(target as ToolcraftRuntimeOwnedTarget);
}
