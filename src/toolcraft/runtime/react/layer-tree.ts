import type { ToolcraftLayer } from "../state/types";

export function getToolcraftLayerById(
  layers: readonly ToolcraftLayer[],
  layerId: string | undefined,
): ToolcraftLayer | undefined {
  return layerId ? layers.find((layer) => layer.id === layerId) : undefined;
}

export function getToolcraftLayerDepth(
  layers: readonly ToolcraftLayer[],
  layer: ToolcraftLayer,
): number {
  let depth = 0;
  let parentLayer = getToolcraftLayerById(layers, layer.parentGroupId);
  const visited = new Set<string>([layer.id]);

  while (parentLayer && !visited.has(parentLayer.id)) {
    depth += 1;
    visited.add(parentLayer.id);
    parentLayer = getToolcraftLayerById(layers, parentLayer.parentGroupId);
  }

  return depth;
}

export function isToolcraftLayerInsideGroup(
  layers: readonly ToolcraftLayer[],
  layer: ToolcraftLayer,
  groupLayerId: string,
): boolean {
  let parentLayer = getToolcraftLayerById(layers, layer.parentGroupId);
  const visited = new Set<string>([layer.id]);

  while (parentLayer && !visited.has(parentLayer.id)) {
    if (parentLayer.id === groupLayerId) {
      return true;
    }

    visited.add(parentLayer.id);
    parentLayer = getToolcraftLayerById(layers, parentLayer.parentGroupId);
  }

  return false;
}

export function isToolcraftLayerHiddenByCollapsedParent(
  layers: readonly ToolcraftLayer[],
  layer: ToolcraftLayer,
): boolean {
  let parentLayer = getToolcraftLayerById(layers, layer.parentGroupId);
  const visited = new Set<string>([layer.id]);

  while (parentLayer && !visited.has(parentLayer.id)) {
    if (parentLayer.collapsed) {
      return true;
    }

    visited.add(parentLayer.id);
    parentLayer = getToolcraftLayerById(layers, parentLayer.parentGroupId);
  }

  return false;
}

export function isToolcraftLayerVisibleInTree(
  layers: readonly ToolcraftLayer[],
  layerOrId: ToolcraftLayer | string,
): boolean {
  const layer =
    typeof layerOrId === "string" ? getToolcraftLayerById(layers, layerOrId) : layerOrId;

  if (!layer?.visible) {
    return false;
  }

  let parentLayer = getToolcraftLayerById(layers, layer.parentGroupId);
  const visited = new Set<string>([layer.id]);

  while (parentLayer && !visited.has(parentLayer.id)) {
    if (!parentLayer.visible) {
      return false;
    }

    visited.add(parentLayer.id);
    parentLayer = getToolcraftLayerById(layers, parentLayer.parentGroupId);
  }

  return true;
}

export function getToolcraftVisibleLayerRows(
  layers: readonly ToolcraftLayer[],
): ToolcraftLayer[] {
  return layers.filter((layer) => !isToolcraftLayerHiddenByCollapsedParent(layers, layer));
}
