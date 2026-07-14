"use client";

import * as React from "react";

import { clampToolcraftCanvasZoom } from "../state/canvas-zoom";
import type {
  ToolcraftMediaAsset,
  ToolcraftMediaTransform,
  ToolcraftPoint,
  ToolcraftState,
} from "../state/types";
import type { ToolcraftControlSchema } from "../schema/types";
import {
  isToolcraftControlVisible,
  isToolcraftSectionVisible,
} from "./control-conditions";
import { isToolcraftLayerVisibleInTree } from "./layer-tree";
import {
  isToolcraftImageFile,
  readImportedFile,
  readImportedImageFile,
} from "./media-file";
import { useToolcraft } from "./use-toolcraft";

export type CanvasShellProps = {
  children?: React.ReactNode;
  renderDefaultMedia?: boolean;
};

type CanvasDragState = {
  originX: number;
  originY: number;
  pointerId: number;
  startX: number;
  startY: number;
};
type ToolcraftCanvasImageAsset = ToolcraftMediaAsset & {
  size: NonNullable<ToolcraftMediaAsset["size"]>;
};

const wheelZoomSensitivity = 0.12;
const wheelPinchZoomSensitivity = 0.5;

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function isDragLeavingCurrentTarget(
  event: React.DragEvent<HTMLElement>,
): boolean {
  const nextTarget = event.relatedTarget;

  return !(
    nextTarget instanceof Node && event.currentTarget.contains(nextTarget)
  );
}

function getCanvasPositionFromEvent(
  event: React.DragEvent<HTMLElement>,
  offset: ToolcraftPoint,
  zoom: number,
): ToolcraftPoint {
  const rect = event.currentTarget.getBoundingClientRect();
  const scale = zoom / 100;

  return {
    x: (event.clientX - rect.left - rect.width / 2 - offset.x) / scale,
    y: (event.clientY - rect.top - rect.height / 2 - offset.y) / scale,
  };
}

function isEventTargetInsideElement(
  target: EventTarget | null,
  element: HTMLElement,
): boolean {
  return target instanceof Node && element.contains(target);
}

function getNextWheelZoom(
  currentZoom: number,
  event: Pick<WheelEvent, "ctrlKey" | "deltaY">,
): number {
  const sensitivity = event.ctrlKey
    ? wheelPinchZoomSensitivity
    : wheelZoomSensitivity;
  const rawDelta = -event.deltaY * sensitivity;
  const zoomDelta = Math.trunc(rawDelta) || Math.sign(rawDelta);

  return clampToolcraftCanvasZoom(currentZoom + zoomDelta);
}

function getFileExtension(file: File): string {
  const match = /\.([a-z0-9]+)$/iu.exec(file.name);

  return match?.[1]?.toLowerCase() ?? "";
}

function controlAcceptsFile(control: ToolcraftControlSchema, file: File): boolean {
  const accept = control.accept?.trim();

  if (!accept) {
    return control.assetKind === "file" || isToolcraftImageFile(file);
  }

  const fileExtension = getFileExtension(file);
  const mimeType = file.type.toLowerCase();

  return accept.split(",").some((rawToken) => {
    const token = rawToken.trim().toLowerCase();

    if (!token) {
      return false;
    }

    if (token.startsWith(".")) {
      return token.slice(1) === fileExtension;
    }

    if (token.endsWith("/*")) {
      const prefix = token.slice(0, -1);

      return mimeType.startsWith(prefix);
    }

    if (token.includes("/")) {
      return mimeType === token;
    }

    return token === fileExtension;
  });
}

function getVisibleFileDropControls(state: ToolcraftState): ToolcraftControlSchema[] {
  return (state.schema.panels.controls?.sections ?? []).flatMap((section) => {
    if (!isToolcraftSectionVisible(state, section)) {
      return [];
    }

    return Object.values(section.controls).filter(
      (control) =>
        control.type === "fileDrop" && isToolcraftControlVisible(state, control),
    );
  });
}

function getCanvasDropTarget(
  state: ToolcraftState,
  file: File,
): ToolcraftControlSchema | null {
  const isImage = isToolcraftImageFile(file);
  const controls = getVisibleFileDropControls(state).filter((control) =>
    controlAcceptsFile(control, file),
  );
  const preferredAssetKind = isImage ? "image" : "file";
  const exactMatch = controls.find(
    (control) =>
      (control.assetKind === "file" ? "file" : "image") === preferredAssetKind,
  );

  if (exactMatch) {
    return exactMatch;
  }

  return isImage
    ? (controls.find((control) => control.assetKind === "file") ?? null)
    : null;
}

function isDefaultCanvasImageAsset(
  state: ToolcraftState,
  mediaAsset: ToolcraftMediaAsset,
): mediaAsset is ToolcraftCanvasImageAsset {
  return (
    (mediaAsset.assetKind ?? "image") === "image" &&
    mediaAsset.size !== undefined &&
    isToolcraftLayerVisibleInTree(state.layers, mediaAsset.layerId)
  );
}

function normalizeMediaRotation(rotationDeg: number | undefined): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round((rotationDeg ?? 0) / 90) * 90) % 360 + 360) % 360;

  return normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0;
}

function getCanvasMediaTransformStyle(
  transform: ToolcraftMediaTransform | undefined,
  canvasSize: ToolcraftState["canvas"]["size"],
): React.CSSProperties {
  const rotationDeg = normalizeMediaRotation(transform?.rotationDeg);
  const coverScale =
    rotationDeg === 90 || rotationDeg === 270
      ? Math.max(canvasSize.width / canvasSize.height, canvasSize.height / canvasSize.width)
      : 1;
  const scaleX = (transform?.flipHorizontal ? -1 : 1) * coverScale;
  const scaleY = (transform?.flipVertical ? -1 : 1) * coverScale;

  if (rotationDeg === 0 && scaleX === 1 && scaleY === 1) {
    return {};
  }

  return {
    transform: `rotate(${rotationDeg}deg) scale(${scaleX}, ${scaleY})`,
  };
}

function getZoomedCanvasOffset({
  clientX,
  clientY,
  currentZoom,
  nextZoom,
  offset,
  viewportElement,
}: {
  clientX: number;
  clientY: number;
  currentZoom: number;
  nextZoom: number;
  offset: ToolcraftPoint;
  viewportElement: HTMLElement;
}): ToolcraftPoint {
  const rect = viewportElement.getBoundingClientRect();
  const currentScale = currentZoom / 100;
  const nextScale = nextZoom / 100;
  const pointerX = clientX - rect.left - rect.width / 2;
  const pointerY = clientY - rect.top - rect.height / 2;
  const worldX = (pointerX - offset.x) / currentScale;
  const worldY = (pointerY - offset.y) / currentScale;

  return {
    x: pointerX - worldX * nextScale,
    y: pointerY - worldY * nextScale,
  };
}

export function CanvasShell({
  children,
  renderDefaultMedia = true,
}: CanvasShellProps): React.JSX.Element {
  const { dispatch, state } = useToolcraft();
  const [dragOver, setDragOver] = React.useState(false);
  const dragRef = React.useRef<CanvasDragState | null>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const uploadEnabled = state.schema.canvas.upload;
  const { offset, size, zoom } = state.canvas;
  const scale = zoom / 100;
  const visibleMediaAssets = React.useMemo(
    () =>
      state.mediaAssets.filter((mediaAsset) =>
        isDefaultCanvasImageAsset(state, mediaAsset),
      ),
    [state.layers, state.mediaAssets],
  );
  const hasCanvasContent = visibleMediaAssets.length > 0;
  const hasCanvasSlot = React.Children.count(children) > 0;
  const renderEditableCanvas =
    state.schema.canvas.sizing.mode !== "intrinsic-media" ||
    state.schema.canvas.sizeSource === "app" ||
    hasCanvasContent ||
    hasCanvasSlot;

  React.useEffect(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return undefined;
    }

    const workspaceElement =
      viewportElement.closest<HTMLElement>(
        '[data-slot="toolcraft-runtime-app"]',
      ) ?? viewportElement;
    const listenerOptions = { capture: true, passive: false };
    const handleWheel = (event: WheelEvent): void => {
      const targetIsInsideCanvas = isEventTargetInsideElement(
        event.target,
        viewportElement,
      );
      if (!targetIsInsideCanvas) {
        if (event.ctrlKey) {
          event.preventDefault();
          event.stopPropagation();
        }

        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (!event.ctrlKey) {
        dispatch({
          offset: {
            x: offset.x - event.deltaX,
            y: offset.y - event.deltaY,
          },
          type: "canvas.setOffset",
        });
        return;
      }

      const nextZoom = getNextWheelZoom(zoom, event);

      if (nextZoom === zoom) {
        return;
      }

      dispatch({
        offset: getZoomedCanvasOffset({
          clientX: event.clientX,
          clientY: event.clientY,
          currentZoom: zoom,
          nextZoom,
          offset,
          viewportElement,
        }),
        type: "canvas.setViewport",
        zoom: nextZoom,
      });
    };

    workspaceElement.addEventListener("wheel", handleWheel, listenerOptions);

    return () => {
      workspaceElement.removeEventListener(
        "wheel",
        handleWheel,
        listenerOptions,
      );
    };
  }, [dispatch, offset, zoom]);

  const beginDragOver = (event: React.DragEvent<HTMLDivElement>): void => {
    if (!uploadEnabled) {
      return;
    }

    event.preventDefault();
    setDragOver(true);
  };

  const handlePointerDown: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (!state.schema.canvas.draggable || event.button !== 0) {
      return;
    }

    event.preventDefault();

    if (typeof event.currentTarget.setPointerCapture === "function") {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    dragRef.current = {
      originX: offset.x,
      originY: offset.y,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  };

  const handlePointerMove: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    const drag = dragRef.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    dispatch({
      offset: {
        x: drag.originX + event.clientX - drag.startX,
        y: drag.originY + event.clientY - drag.startY,
      },
      type: "canvas.setOffset",
    });
  };

  const handlePointerUp: React.PointerEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return;
    }

    if (
      typeof event.currentTarget.hasPointerCapture === "function" &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    dragRef.current = null;
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    if (!uploadEnabled) {
      return;
    }

    event.preventDefault();
    setDragOver(false);

    const uploadedFiles = Array.from(event.dataTransfer?.files ?? []);

    if (uploadedFiles.length === 0) {
      return;
    }

    const position = getCanvasPositionFromEvent(event, offset, zoom);
    const hasFileDropControls = getVisibleFileDropControls(state).length > 0;

    uploadedFiles.forEach((uploadedFile) => {
      const targetControl = getCanvasDropTarget(state, uploadedFile);

      if (!targetControl) {
        if (hasFileDropControls || !isToolcraftImageFile(uploadedFile)) {
          return;
        }

        void readImportedImageFile(uploadedFile, size).then((importedImage) => {
          if (!importedImage) {
            return;
          }

          dispatch({
            asset: {
              assetKind: "image",
              dataUrl: importedImage.dataUrl,
              fileName: uploadedFile.name,
              mimeType: uploadedFile.type || "image/*",
              position,
              size: importedImage.size,
            },
            type: "media.import",
          });
        });
        return;
      }

      const assetKind = targetControl.assetKind === "file" ? "file" : "image";
      const replaceExisting = targetControl.multiple !== true;

      if (assetKind === "file") {
        void readImportedFile(uploadedFile).then((importedFile) => {
          if (!importedFile) {
            return;
          }

          dispatch({
            asset: {
              assetKind: "file",
              dataUrl: importedFile.dataUrl,
              fileName: uploadedFile.name,
              mimeType: uploadedFile.type || "application/octet-stream",
              position: { x: 0, y: 0 },
              sourceTarget: targetControl.target,
            },
            replaceExisting,
            type: "media.import",
          });
        });
        return;
      }

      void readImportedImageFile(uploadedFile, size).then((importedImage) => {
        if (!importedImage) {
          return;
        }

        dispatch({
          asset: {
            assetKind: "image",
            dataUrl: importedImage.dataUrl,
            fileName: uploadedFile.name,
            mimeType: uploadedFile.type || "image/*",
            position,
            size: importedImage.size,
            sourceTarget: targetControl.target,
          },
          replaceExisting,
          type: "media.import",
        });
      });
    });
  };

  return (
    <div
      aria-label="Canvas viewport"
      className="group/canvas absolute inset-0 cursor-grab touch-none overflow-hidden bg-[color:var(--background)] active:cursor-grabbing"
      data-drag-over={dragOver}
      data-slot="toolcraft-runtime-canvas"
      onDragEnter={beginDragOver}
      onDragLeave={(event) => {
        if (isDragLeavingCurrentTarget(event)) {
          setDragOver(false);
        }
      }}
      onDragOver={beginDragOver}
      onDrop={handleDrop}
      onPointerCancel={handlePointerUp}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={viewportRef}
      role="application"
    >
      <div
        className="absolute top-1/2 left-1/2"
        data-toolcraft-canvas-world=""
        style={{
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "center",
        }}
      >
        {renderEditableCanvas ? (
          <div
            className="relative z-10 overflow-hidden"
            data-toolcraft-canvas-content=""
            data-toolcraft-editable-canvas=""
            style={{
              height: size.height,
              width: size.width,
            }}
          >
            {renderDefaultMedia
              ? visibleMediaAssets.map((mediaAsset) => {
                  const selected = state.selectedLayerId === mediaAsset.layerId;

                  return (
                    <button
                      aria-label={`Select ${mediaAsset.fileName}`}
                      className={cn(
                        "absolute inset-0 block cursor-pointer overflow-hidden rounded-none border bg-[color:color-mix(in_oklab,var(--background)_84%,transparent)] p-0 shadow-sm transition-[border-color,box-shadow] duration-150 ease-out",
                        selected
                          ? "border-[color:var(--link)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--link)_48%,transparent)]"
                          : "border-[color:color-mix(in_oklab,var(--border)_10%,transparent)] hover:border-[color:color-mix(in_oklab,var(--border)_24%,transparent)]",
                      )}
                      data-canvas-media-layer={mediaAsset.layerId}
                      key={mediaAsset.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        dispatch({
                          layerId: mediaAsset.layerId,
                          type: "layers.select",
                        });
                      }}
                      onPointerDown={(event) => event.stopPropagation()}
                      type="button"
                    >
                      <img
                        alt={mediaAsset.fileName}
                        className="block size-full select-none object-cover"
                        data-toolcraft-generated-output=""
                        draggable={false}
                        src={mediaAsset.dataUrl}
                        style={getCanvasMediaTransformStyle(mediaAsset.transform, size)}
                      />
                    </button>
                  );
                })
              : null}
            {children ? (
              <div
                className="absolute inset-0 z-20"
                data-toolcraft-canvas-slot=""
              >
                {children}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-[color:color-mix(in_oklab,var(--link)_8%,transparent)] opacity-0 transition-opacity duration-150 ease-out group-data-[drag-over=true]/canvas:opacity-100"
        data-canvas-drag-highlight=""
      />
    </div>
  );
}
