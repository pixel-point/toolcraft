import {
  panelSnapMarginPx,
  panelSnapZonePx,
  panelVelocityMultiplierMs,
} from "./panel-host-config";
import type {
  PanelDimensions,
  PanelPoint,
  PanelSnapEdge,
  PanelViewport,
} from "./panel-host-types";

export function clampPanelValue(value: number, min: number, max: number): number {
  const safeMax = Math.max(min, max);

  return Math.max(min, Math.min(value, safeMax));
}

function getProjectedPanelPosition(position: PanelPoint, velocity: PanelPoint): PanelPoint {
  return {
    x: position.x + velocity.x * panelVelocityMultiplierMs,
    y: position.y + velocity.y * panelVelocityMultiplierMs,
  };
}

function getPanelEdgeDistance(
  edge: PanelSnapEdge,
  position: PanelPoint,
  dimensions: PanelDimensions,
  viewport: PanelViewport,
): number {
  if (edge === "top") {
    return position.y - viewport.offsetTop;
  }

  if (edge === "right") {
    return viewport.offsetLeft + viewport.width - (position.x + dimensions.width);
  }

  if (edge === "bottom") {
    return viewport.offsetTop + viewport.height - (position.y + dimensions.height);
  }

  return position.x - viewport.offsetLeft;
}

function getPanelSnapEdge(
  projectedPosition: PanelPoint,
  dimensions: PanelDimensions,
  viewport: PanelViewport,
  edges: readonly PanelSnapEdge[],
  zone: number,
): PanelSnapEdge | null {
  const candidates = edges
    .map((edge) => ({
      edge,
      value: getPanelEdgeDistance(edge, projectedPosition, dimensions, viewport),
    }))
    .filter((candidate) => candidate.value <= zone);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((closest, candidate) =>
    candidate.value < closest.value ? candidate : closest,
  ).edge;
}

export function resolvePanelSnapPosition({
  dimensions,
  edges,
  margin = panelSnapMarginPx,
  position,
  velocity,
  viewport,
  zone = panelSnapZonePx,
}: {
  dimensions: PanelDimensions;
  edges: readonly PanelSnapEdge[];
  margin?: number;
  position: PanelPoint;
  velocity: PanelPoint;
  viewport: PanelViewport;
  zone?: number;
}): PanelPoint | null {
  const projectedPosition = getProjectedPanelPosition(position, velocity);
  const edge = getPanelSnapEdge(projectedPosition, dimensions, viewport, edges, zone);
  const minX = viewport.offsetLeft + margin;
  const maxX = viewport.offsetLeft + viewport.width - dimensions.width - margin;
  const minY = viewport.offsetTop + margin;
  const maxY = viewport.offsetTop + viewport.height - dimensions.height - margin;

  if (!edge) {
    return null;
  }

  if (edge === "top" || edge === "bottom") {
    return {
      x: clampPanelValue(projectedPosition.x, minX, maxX),
      y: edge === "top" ? minY : maxY,
    };
  }

  return {
    x: edge === "left" ? minX : maxX,
    y: clampPanelValue(projectedPosition.y, minY, maxY),
  };
}
