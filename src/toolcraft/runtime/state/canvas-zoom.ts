export const toolcraftCanvasZoomMin = 25;
export const toolcraftCanvasZoomMax = 400;
export const toolcraftCanvasZoomStep = 10;
export const toolcraftCanvasZoomDefault = 100;

export function clampToolcraftCanvasZoom(zoom: number): number {
  return Math.min(toolcraftCanvasZoomMax, Math.max(toolcraftCanvasZoomMin, zoom));
}
