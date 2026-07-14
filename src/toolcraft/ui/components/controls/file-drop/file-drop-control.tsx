"use client";

import * as React from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CloudArrowUpIcon,
  PaperclipIcon,
  XIcon,
} from "@phosphor-icons/react";

import { cn } from "../../../lib/utils";
import {
  ActionsControl,
  type ActionControlOption,
} from "../actions/actions-control";
import { Button, Field } from "../../primitives";

export type FileDropAssetKind = "file" | "image";

export type FileDropImageTransform = {
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotationDeg?: number;
};

export type FileDropImageTransformOperation =
  | "flip-horizontal"
  | "flip-vertical"
  | "rotate-left"
  | "rotate-right";

export type FileDropPreview = {
  alt?: string;
  assetKind?: FileDropAssetKind;
  fileName?: string;
  id?: string;
  size?: {
    height: number;
    width: number;
  };
  src: string;
  transform?: FileDropImageTransform;
};

export type FileDropControlProps = {
  accept: string;
  assetKind?: FileDropAssetKind;
  multiple?: boolean;
  onClear?: () => void;
  onFileSelect?: (file: File) => void;
  onFilesSelect?: (files: File[]) => void;
  onPreviewRemove?: (preview: FileDropPreview, index: number) => void;
  onPreviewReorder?: (orderedPreviews: FileDropPreview[]) => void;
  onPreviewTransform?: (
    preview: FileDropPreview,
    operation: FileDropImageTransformOperation,
  ) => void;
  preview?: FileDropPreview;
  previews?: readonly FileDropPreview[];
};

const singleImagePreviewMaxHeight = 196;

function isDragLeavingCurrentTarget(event: React.DragEvent<HTMLElement>): boolean {
  const nextTarget = event.relatedTarget;

  return !(nextTarget instanceof Node && event.currentTarget.contains(nextTarget));
}

function getFileInputAccept(accept: string): string {
  return accept
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .flatMap((part) => {
      switch (part) {
        case "gif":
          return [".gif", "image/gif"];
        case "heic":
          return [".heic", "image/heic"];
        case "heif":
          return [".heif", "image/heif"];
        case "jpg":
        case "jpeg":
          return [".jpg", ".jpeg", "image/jpeg"];
        case "png":
          return [".png", "image/png"];
        case "svg":
          return [".svg", "image/svg+xml"];
        case "tif":
        case "tiff":
          return [".tif", ".tiff", "image/tiff"];
        case "webp":
          return [".webp", "image/webp"];
        default:
          return part.startsWith(".") || part.includes("/") ? [part] : [];
      }
    })
    .join(",");
}

function normalizeImageRotation(rotationDeg: number | undefined): 0 | 90 | 180 | 270 {
  const normalized = ((Math.round((rotationDeg ?? 0) / 90) * 90) % 360 + 360) % 360;

  return normalized === 90 || normalized === 180 || normalized === 270 ? normalized : 0;
}

function getImageTransformStyle(
  transform: FileDropImageTransform | undefined,
  options: { center?: boolean; includeRotation?: boolean } = {},
): React.CSSProperties {
  const rotationDeg = normalizeImageRotation(transform?.rotationDeg);
  const scaleX = transform?.flipHorizontal ? -1 : 1;
  const scaleY = transform?.flipVertical ? -1 : 1;
  const transformSteps: string[] = [];

  if (options.center) {
    transformSteps.push("translate(-50%, -50%)");
  }

  if (options.includeRotation !== false && rotationDeg !== 0) {
    transformSteps.push(`rotate(${rotationDeg}deg)`);
  }

  if (scaleX !== 1 || scaleY !== 1) {
    transformSteps.push(`scale(${scaleX}, ${scaleY})`);
  }

  if (transformSteps.length === 0) {
    return {};
  }

  return {
    transform: transformSteps.join(" "),
  };
}

function getPreviewFrameStyle(
  size: FileDropPreview["size"],
): React.CSSProperties {
  if (!size || size.height <= 0 || size.width <= 0) {
    return { width: "100%" };
  }

  return {
    aspectRatio: `${size.width} / ${size.height}`,
    maxHeight: `${singleImagePreviewMaxHeight}px`,
    width: "100%",
  };
}

function isPreviewQuarterTurn(transform?: FileDropImageTransform): boolean {
  const rotationDeg = normalizeImageRotation(transform?.rotationDeg);

  return rotationDeg === 90 || rotationDeg === 270;
}

function getPreviewImageStyle(
  size: FileDropPreview["size"],
  transform?: FileDropImageTransform,
): React.CSSProperties {
  const rotationDeg = normalizeImageRotation(transform?.rotationDeg);
  const rotatedQuarterTurn = rotationDeg === 90 || rotationDeg === 270;
  const rotatedWidth =
    size && size.height > 0 && size.width > 0 && rotatedQuarterTurn
      ? `${(Math.min(size.width / size.height, size.height / size.width) * 100).toFixed(4)}%`
      : "100%";

  return {
    ...getImageTransformStyle(transform, { center: true }),
    ...(rotatedQuarterTurn ? { width: rotatedWidth } : {}),
  };
}

function getPreviewKey(item: FileDropPreview, index: number): string {
  return item.id ?? `${item.src}:${index}`;
}

function FileDropPlusGlyph({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={cn("flex-none", className)}
      fill="none"
      viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 2.5V11.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1" />
      <path d="M2.5 7H11.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1" />
    </svg>
  );
}

const imageTransformActions = [
  { ariaLabel: "90° Right", icon: "rotate-cw", label: "90°", value: "rotate-right" },
  {
    ariaLabel: "Flip horizontal",
    icon: "flip-horizontal",
    label: "Flip H",
    value: "flip-horizontal",
  },
  {
    ariaLabel: "Flip vertical",
    icon: "flip-vertical",
    label: "Flip V",
    value: "flip-vertical",
  },
] satisfies readonly ActionControlOption[];

type SortablePreviewTileProps = {
  index: number;
  isSortable: boolean;
  item: FileDropPreview;
  itemKey: string;
  onPreviewRemove?: (preview: FileDropPreview, index: number) => void;
  onPreviewSelect?: (preview: FileDropPreview) => void;
  selected?: boolean;
};

function SortablePreviewTile({
  index,
  isSortable,
  item,
  itemKey,
  onPreviewRemove,
  onPreviewSelect,
  selected = false,
}: SortablePreviewTileProps): React.JSX.Element {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({
      disabled: !isSortable,
      id: itemKey,
    });
  const sortableTransform = transform
    ? {
        ...transform,
        scaleX: isDragging ? 1.035 : transform.scaleX,
        scaleY: isDragging ? 1.035 : transform.scaleY,
      }
    : null;
  const style: React.CSSProperties = {
    transform: sortableTransform ? CSS.Transform.toString(sortableTransform) : undefined,
    transition,
  };

  return (
    <div
      className={cn(
        "relative aspect-square min-w-0 overflow-hidden rounded-[calc(var(--radius-lg)-4px)] bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)] transition-[transform,box-shadow,opacity,border-color] duration-180 ease-out motion-reduce:transition-none",
        isSortable &&
          "cursor-grab touch-none select-none will-change-transform hover:shadow-[0_8px_18px_color-mix(in_oklab,var(--background)_30%,transparent)]",
        selected &&
          "ring-2 ring-[color:color-mix(in_oklab,var(--link)_72%,transparent)] ring-offset-2 ring-offset-[color:var(--background)]",
        isDragging &&
          "z-10 cursor-grabbing opacity-90 shadow-[0_12px_24px_color-mix(in_oklab,var(--background)_55%,transparent)]",
      )}
      data-file-upload-preview-key={itemKey}
      data-preview-dragging={isDragging ? "true" : undefined}
      data-selected={selected ? "true" : undefined}
      data-slot="file-upload-preview-item"
      onClick={(event) => {
        event.stopPropagation();
        onPreviewSelect?.(item);
      }}
      ref={setNodeRef}
      style={style}
      {...(isSortable ? attributes : {})}
      {...(isSortable ? listeners : {})}
    >
      <img
        alt={item.alt ?? ""}
        className="size-full object-cover"
        draggable={false}
        height={item.size?.height}
        src={item.src}
        style={getImageTransformStyle(item.transform)}
        width={item.size?.width}
      />
      {onPreviewRemove ? (
        <Button
          aria-label={`Remove ${item.alt ?? "image"}`}
          className="absolute top-0.5 right-0.5"
          onClick={(event) => {
            event.stopPropagation();
            onPreviewRemove(item, index);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon className="drop-shadow-[0_2px_1px_color-mix(in_oklab,var(--background)_80%,transparent)]" />
        </Button>
      ) : null}
    </div>
  );
}

type SortableFileRowProps = {
  index: number;
  isSortable: boolean;
  item: FileDropPreview;
  itemKey: string;
  onPreviewRemove?: (preview: FileDropPreview, index: number) => void;
};

function SortableFileRow({
  index,
  isSortable,
  item,
  itemKey,
  onPreviewRemove,
}: SortableFileRowProps): React.JSX.Element {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } =
    useSortable({
      disabled: !isSortable,
      id: itemKey,
    });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
  };
  const fileName = item.fileName ?? item.alt ?? "Untitled file";

  return (
    <div
      className={cn(
        "mx-1 flex h-8 min-w-0 items-center gap-2 pr-1 pl-[7px] text-left text-sm text-[color:color-mix(in_oklab,var(--foreground)_86%,transparent)] transition-[background-color,opacity,transform] duration-150 ease-out hover:bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)] motion-reduce:transition-none",
        isSortable && "cursor-grab touch-none select-none",
        isDragging &&
          "z-10 cursor-grabbing bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] opacity-90",
      )}
      data-file-upload-preview-key={itemKey}
      data-preview-dragging={isDragging ? "true" : undefined}
      data-slot="file-upload-file-item"
      onClick={(event) => {
        event.stopPropagation();
      }}
      ref={setNodeRef}
      style={style}
      {...(isSortable ? attributes : {})}
      {...(isSortable ? listeners : {})}
    >
      <PaperclipIcon
        aria-hidden="true"
        className="size-4 flex-none text-[color:color-mix(in_oklab,var(--foreground)_48%,transparent)]"
        weight="regular"
      />
      <span
        className="min-w-0 flex-1 overflow-hidden text-xs whitespace-nowrap [-webkit-mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)] [mask-image:linear-gradient(to_right,black_calc(100%-20px),transparent)]"
        title={fileName}
      >
        {fileName}
      </span>
      {onPreviewRemove ? (
        <Button
          aria-label={`Remove ${fileName}`}
          className="flex-none"
          onClick={(event) => {
            event.stopPropagation();
            onPreviewRemove(item, index);
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon className="drop-shadow-[0_2px_1px_color-mix(in_oklab,var(--background)_80%,transparent)]" />
        </Button>
      ) : null}
    </div>
  );
}

export function FileDropControl({
  accept,
  assetKind = "image",
  multiple = false,
  onClear,
  onFileSelect,
  onFilesSelect,
  onPreviewRemove,
  onPreviewReorder,
  onPreviewTransform,
  preview,
  previews,
}: FileDropControlProps): React.JSX.Element {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [selectedPreviewKey, setSelectedPreviewKey] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const previewItems = previews ?? (preview ? [preview] : []);
  const hasPreview = previewItems.some((item) => Boolean(item.src));
  const shouldRenderPreviewGrid = multiple && previewItems.length > 1;
  const shouldRenderFileList = assetKind === "file" && hasPreview;
  const previewEntries = previewItems.map((item, index) => ({
    item,
    key: getPreviewKey(item, index),
  }));
  const previewKeys = previewEntries.map((entry) => entry.key);
  const requiresImageSelection = assetKind === "image" && multiple && previewEntries.length > 1;
  const selectedPreviewEntry = requiresImageSelection
    ? previewEntries.find((entry) => entry.key === selectedPreviewKey)
    : previewEntries[0];
  const shouldRenderImageActions =
    assetKind === "image" &&
    hasPreview &&
    Boolean(onPreviewTransform) &&
    Boolean(selectedPreviewEntry) &&
    (!requiresImageSelection || selectedPreviewKey !== null);

  React.useEffect(() => {
    if (!selectedPreviewKey) {
      return;
    }

    if (!requiresImageSelection || !previewKeys.includes(selectedPreviewKey)) {
      setSelectedPreviewKey(null);
    }
  }, [previewKeys, requiresImageSelection, selectedPreviewKey]);

  function handleFiles(fileList: FileList | readonly File[] | undefined): void {
    const files = Array.from(fileList ?? []);

    if (files.length === 0) {
      return;
    }

    if (multiple) {
      if (onFilesSelect) {
        onFilesSelect(files);
        return;
      }

      files.forEach((file) => onFileSelect?.(file));
      return;
    }

    onFileSelect?.(files[0]);
  }

  function openFileDialog(): void {
    inputRef.current?.click();
  }

  function handleDropTargetClick(event: React.MouseEvent<HTMLDivElement>): void {
    event.preventDefault();
    openFileDialog();
  }

  function handleDropTargetKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openFileDialog();
  }

  function handlePreviewDragEnd(event: DragEndEvent): void {
    const activeKey = String(event.active.id);
    const overKey = event.over ? String(event.over.id) : null;

    if (!onPreviewReorder || !overKey || activeKey === overKey) {
      return;
    }

    const activeIndex = previewKeys.indexOf(activeKey);
    const overIndex = previewKeys.indexOf(overKey);

    if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
      return;
    }

    onPreviewReorder(
      arrayMove(previewEntries, activeIndex, overIndex).map((entry) => entry.item),
    );
  }

  function runImageTransform(operation: FileDropImageTransformOperation): void {
    if (!selectedPreviewEntry) {
      return;
    }

    onPreviewTransform?.(selectedPreviewEntry.item, operation);
  }

  return (
    <Field className="min-w-0" style={{ gap: "6px" }}>
      <input
        accept={getFileInputAccept(accept)}
        aria-hidden="true"
        className="hidden"
        onChange={(event) => {
          handleFiles(event.currentTarget.files ?? undefined);
          event.currentTarget.value = "";
        }}
        multiple={multiple}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
      <div
        aria-label={
          hasPreview
            ? multiple
              ? assetKind === "file"
                ? "Drop files"
                : "Drop image files"
              : assetKind === "file"
                ? "Replace file"
                : "Replace image file"
            : multiple
              ? assetKind === "file"
                ? "Browse files"
                : "Browse image files"
              : assetKind === "file"
                ? "Browse file"
                : "Browse image file"
        }
        className={cn(
          "group/file-upload relative flex min-h-16 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-[color:color-mix(in_oklab,var(--border)_18%,transparent)] bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)] text-center shadow-none transition-[background-color,border-color,box-shadow] duration-150 ease-out data-[drag-over=true]:border-[color:color-mix(in_oklab,var(--link)_28%,transparent)] data-[drag-over=true]:bg-[color:color-mix(in_oklab,var(--link)_13%,transparent)] data-[drag-over=true]:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
          !shouldRenderFileList &&
            "hover:border-[color:color-mix(in_oklab,var(--border)_35%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)]",
          hasPreview
            ? shouldRenderFileList
              ? "overflow-hidden p-1.5"
              : "overflow-hidden p-2"
            : "px-3 py-3",
        )}
        data-drag-over={dragOver}
        onClick={handleDropTargetClick}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          if (isDragLeavingCurrentTarget(event)) {
            setDragOver(false);
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          handleFiles(event.dataTransfer?.files ?? undefined);
        }}
        onKeyDown={handleDropTargetKeyDown}
        role="button"
        tabIndex={0}
      >
        {shouldRenderFileList ? (
          <div className="w-full" data-slot="file-upload-file-list">
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handlePreviewDragEnd}
              sensors={sensors}
            >
              <SortableContext items={previewKeys} strategy={verticalListSortingStrategy}>
                {previewEntries.map(({ item, key }, index) => (
                  <React.Fragment key={key}>
                    <SortableFileRow
                      index={index}
                      isSortable={Boolean(onPreviewReorder) && previewEntries.length > 1}
                      item={item}
                      itemKey={key}
                      onPreviewRemove={onPreviewRemove}
                    />
                    <div
                      aria-hidden="true"
                      className="mx-1 h-px bg-[color:color-mix(in_oklab,var(--border)_5%,transparent)]"
                      data-slot="file-upload-file-divider"
                    />
                  </React.Fragment>
                ))}
              </SortableContext>
            </DndContext>
            <button
              aria-label="Add a new file"
              className="mx-1 box-border flex h-8 w-[calc(100%-0.5rem)] min-w-0 shrink-0 items-center justify-center gap-1.5 px-1 text-xs text-[color:color-mix(in_oklab,var(--foreground)_65%,transparent)] transition-[background-color,color] duration-150 ease-out hover:bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)] hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
              data-slot="file-upload-add-file"
              onClick={(event) => {
                event.stopPropagation();
                openFileDialog();
              }}
              type="button"
            >
              <FileDropPlusGlyph className="size-3.5" />
              <span className="font-medium">Add a new file</span>
            </button>
          </div>
        ) : shouldRenderPreviewGrid ? (
          <div
            className="grid w-full grid-cols-4 gap-2"
            data-slot="file-upload-preview-grid"
          >
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handlePreviewDragEnd}
              sensors={sensors}
            >
              <SortableContext items={previewKeys} strategy={rectSortingStrategy}>
                {previewEntries.map(({ item, key }, index) => (
                  <SortablePreviewTile
                    index={index}
                    isSortable={Boolean(onPreviewReorder)}
                    item={item}
                    itemKey={key}
                    key={key}
                    onPreviewRemove={onPreviewRemove}
                    onPreviewSelect={(preview) => {
                      const nextKey = getPreviewKey(preview, index);
                      setSelectedPreviewKey((currentKey) =>
                        currentKey === nextKey ? null : nextKey,
                      );
                    }}
                    selected={selectedPreviewKey === key}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <button
              aria-label="Add image files"
              className="flex aspect-square min-w-0 items-center justify-center rounded-[calc(var(--radius-lg)-4px)] border border-[color:color-mix(in_oklab,var(--border)_5%,transparent)] bg-[color:color-mix(in_oklab,var(--foreground)_4%,transparent)] text-[color:color-mix(in_oklab,var(--foreground)_65%,transparent)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[color:color-mix(in_oklab,var(--border)_8%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--foreground)_9%,transparent)] hover:text-[color:var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
              data-slot="file-upload-add-preview"
              onClick={(event) => {
                event.stopPropagation();
                openFileDialog();
              }}
              type="button"
            >
              <FileDropPlusGlyph className="size-3.5" />
            </button>
          </div>
        ) : hasPreview ? (
          <>
            {previewItems[0] ? (
              <div
                className="relative w-full max-w-full overflow-hidden rounded-[calc(var(--radius-lg)-4px)]"
                data-slot="file-upload-preview-frame"
                style={getPreviewFrameStyle(previewItems[0].size)}
              >
                <img
                  alt={previewItems[0].alt ?? ""}
                  className={cn(
                    "absolute top-1/2 left-1/2 block h-auto object-contain",
                    isPreviewQuarterTurn(previewItems[0].transform)
                      ? "max-w-none"
                      : "max-h-full max-w-full",
                  )}
                  draggable={false}
                  height={previewItems[0].size?.height}
                  src={previewItems[0].src}
                  style={getPreviewImageStyle(previewItems[0].size, previewItems[0].transform)}
                  width={previewItems[0].size?.width}
                />
              </div>
            ) : null}
            {onClear ? (
              <Button
                aria-label="Remove image"
                className="absolute top-3 right-3"
                onClick={(event) => {
                  event.stopPropagation();
                  onClear();
                }}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <XIcon className="drop-shadow-[0_2px_1px_color-mix(in_oklab,var(--background)_80%,transparent)]" />
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <CloudArrowUpIcon
              className="size-6 flex-none text-[color:var(--muted-foreground)] transition-colors duration-150 ease-out group-data-[drag-over=true]/file-upload:text-[color:var(--link)]"
              weight="light"
            />
            <p className="m-0 flex max-w-full flex-col text-xs leading-tight text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] transition-colors duration-150 ease-out group-hover/file-upload:text-[color:color-mix(in_oklab,var(--foreground)_85%,transparent)] group-data-[drag-over=true]/file-upload:text-[color:var(--link)]">
              {assetKind === "file" ? (
                <>
                  <span>Click to upload a file</span>
                  <span>or drag it onto the canvas</span>
                </>
              ) : (
                <>
                  <span>Click to upload an image</span>
                  <span>or drag it onto the canvas</span>
                </>
              )}
            </p>
          </>
        )}
      </div>
      {shouldRenderImageActions ? (
        <ActionsControl
          actions={imageTransformActions}
          buttonColumns={3}
          name="Image transforms"
          onAction={(operation) =>
            runImageTransform(operation as FileDropImageTransformOperation)
          }
          showLabel={false}
        />
      ) : null}
    </Field>
  );
}
