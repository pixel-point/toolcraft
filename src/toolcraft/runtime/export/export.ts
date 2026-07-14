import type { ResolvedToolcraftAppSchema } from "../schema/types";
import type { ToolcraftState } from "../state/types";

export type ToolcraftExportFormat = "png" | "video";

export type ToolcraftImageExportResolution = "current" | "2k" | "4k" | "8k";
export type ToolcraftVideoExportResolution = "current" | "4k";

export type ToolcraftRetinaExportSize = {
  height: number;
  pixelRatio: number;
  width: number;
};

export type ToolcraftExportBackgroundOptions = {
  format: ToolcraftExportFormat;
  schema: ResolvedToolcraftAppSchema;
};

export type ToolcraftPreviewBackgroundOptions = {
  includeBackgroundTarget?: string;
  state: ToolcraftState;
};

export type ToolcraftExportSizeOptions = {
  devicePixelRatio?: number;
  state: ToolcraftState;
};

export type ToolcraftImageExportSizeOptions = ToolcraftExportSizeOptions & {
  resolution?: ToolcraftImageExportResolution | string;
};

export type ToolcraftVideoExportSizeOptions = ToolcraftExportSizeOptions & {
  resolution?: ToolcraftVideoExportResolution | string;
};

export type ToolcraftPngRenderContext = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  cssHeight: number;
  cssWidth: number;
  includeBackground: boolean;
  pixelHeight: number;
  pixelRatio: number;
  pixelWidth: number;
};

export type ToolcraftPngExportCanvasOptions = {
  background?: string;
  canvasFactory?: () => HTMLCanvasElement;
  devicePixelRatio?: number;
  includeBackground?: boolean;
  render: (context: ToolcraftPngRenderContext) => void;
  resolution?: ToolcraftImageExportResolution | string;
  state: ToolcraftState;
};

const toolcraftImageExportLongEdges: Record<
  Exclude<ToolcraftImageExportResolution, "current">,
  number
> = {
  "2k": 2048,
  "4k": 4096,
  "8k": 8192,
};

const toolcraftVideoExportMaxSizes: Record<
  Exclude<ToolcraftVideoExportResolution, "current">,
  { height: number; width: number }
> = {
  "4k": { height: 2160, width: 3840 },
};

function roundVideoDimension(value: number): number {
  return Math.max(2, Math.round(value / 2) * 2);
}

export function getToolcraftRetinaExportPixelRatio(devicePixelRatio?: number): number {
  const globalPixelRatio = (globalThis as typeof globalThis & { devicePixelRatio?: number })
    .devicePixelRatio;
  const fallbackPixelRatio =
    typeof globalPixelRatio === "number" && Number.isFinite(globalPixelRatio)
      ? globalPixelRatio
      : 1;
  const requestedPixelRatio =
    typeof devicePixelRatio === "number" && Number.isFinite(devicePixelRatio)
      ? devicePixelRatio
      : fallbackPixelRatio;

  return Math.max(2, requestedPixelRatio);
}

export function getToolcraftRetinaExportSize({
  devicePixelRatio,
  state,
}: ToolcraftExportSizeOptions): ToolcraftRetinaExportSize {
  const pixelRatio = getToolcraftRetinaExportPixelRatio(devicePixelRatio);

  return {
    height: Math.ceil(state.canvas.size.height * pixelRatio),
    pixelRatio,
    width: Math.ceil(state.canvas.size.width * pixelRatio),
  };
}

export function getToolcraftImageExportSize({
  devicePixelRatio,
  resolution,
  state,
}: ToolcraftImageExportSizeOptions): ToolcraftRetinaExportSize {
  const normalizedResolution = String(resolution ?? "current").toLowerCase();
  const targetLongEdge =
    toolcraftImageExportLongEdges[
      normalizedResolution as Exclude<ToolcraftImageExportResolution, "current">
    ];

  if (!targetLongEdge) {
    return getToolcraftRetinaExportSize({ devicePixelRatio, state });
  }

  const cssWidth = Math.max(1, state.canvas.size.width);
  const cssHeight = Math.max(1, state.canvas.size.height);
  const dominantSize = Math.max(cssWidth, cssHeight);
  const pixelRatio = targetLongEdge / dominantSize;

  if (cssWidth >= cssHeight) {
    return {
      height: Math.max(1, Math.round(cssHeight * pixelRatio)),
      pixelRatio,
      width: targetLongEdge,
    };
  }

  return {
    height: targetLongEdge,
    pixelRatio,
    width: Math.max(1, Math.round(cssWidth * pixelRatio)),
  };
}

export function getToolcraftVideoExportSize({
  resolution,
  state,
}: ToolcraftVideoExportSizeOptions): ToolcraftRetinaExportSize {
  const normalizedResolution = String(resolution ?? "current").toLowerCase();
  const targetMaxSize =
    toolcraftVideoExportMaxSizes[
      normalizedResolution as Exclude<ToolcraftVideoExportResolution, "current">
    ];

  if (!targetMaxSize) {
    const cssWidth = Math.max(1, state.canvas.size.width);
    const cssHeight = Math.max(1, state.canvas.size.height);
    const width = roundVideoDimension(cssWidth);
    const height = roundVideoDimension(cssHeight);

    return {
      height,
      pixelRatio: Math.max(width / cssWidth, height / cssHeight),
      width,
    };
  }

  const cssWidth = Math.max(1, state.canvas.size.width);
  const cssHeight = Math.max(1, state.canvas.size.height);
  const pixelRatio = Math.min(
    targetMaxSize.width / cssWidth,
    targetMaxSize.height / cssHeight,
  );
  const width = roundVideoDimension(cssWidth * pixelRatio);
  const height = roundVideoDimension(cssHeight * pixelRatio);

  return {
    height,
    pixelRatio: Math.max(width / cssWidth, height / cssHeight),
    width,
  };
}

export function shouldIncludeToolcraftExportBackground({
  format,
  schema,
}: ToolcraftExportBackgroundOptions): boolean {
  if (format === "video") {
    return true;
  }

  return schema.export.png.background !== "transparent";
}

export function shouldIncludeToolcraftPreviewBackground({
  includeBackgroundTarget = "export.includeBackground",
  state,
}: ToolcraftPreviewBackgroundOptions): boolean {
  const includeBackgroundValue = state.values[includeBackgroundTarget];

  if (typeof includeBackgroundValue === "boolean") {
    return includeBackgroundValue;
  }

  if (typeof includeBackgroundValue === "string") {
    const normalizedValue = includeBackgroundValue.trim().toLowerCase();

    if (
      normalizedValue === "false" ||
      normalizedValue === "off" ||
      normalizedValue === "no" ||
      normalizedValue === "transparent" ||
      normalizedValue === "exclude"
    ) {
      return false;
    }

    if (
      normalizedValue === "true" ||
      normalizedValue === "on" ||
      normalizedValue === "yes" ||
      normalizedValue === "include"
    ) {
      return true;
    }
  }

  return true;
}

export function createToolcraftPngExportCanvas({
  background = "#000000",
  canvasFactory = () => document.createElement("canvas"),
  devicePixelRatio,
  includeBackground: includeBackgroundOverride,
  render,
  resolution,
  state,
}: ToolcraftPngExportCanvasOptions): HTMLCanvasElement {
  const canvas = canvasFactory();
  const { height, pixelRatio, width } = getToolcraftImageExportSize({
    devicePixelRatio,
    resolution,
    state,
  });
  const includeBackground =
    includeBackgroundOverride ??
    shouldIncludeToolcraftExportBackground({
      format: "png",
      schema: state.schema,
    });

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Toolcraft PNG export requires a 2D canvas context.");
  }

  context.save();
  context.clearRect(0, 0, width, height);

  if (includeBackground) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }

  context.scale(pixelRatio, pixelRatio);
  render({
    canvas,
    context,
    cssHeight: state.canvas.size.height,
    cssWidth: state.canvas.size.width,
    includeBackground,
    pixelHeight: height,
    pixelRatio,
    pixelWidth: width,
  });
  context.restore();

  return canvas;
}
