"use client";

import * as React from "react";
import {
  FolderSimpleIcon,
  PlusIcon,
  StackPlusIcon,
  StackSimpleIcon,
} from "@phosphor-icons/react";
import {
  Button,
  PanelContentSurface,
  PanelIconButton,
  PanelSurface,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PrimitiveArrowIcon,
  ScrollFade,
  stopPanelHeaderButtonPointerDown,
} from "@/toolcraft/ui";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import type { ToolcraftLayer, ToolcraftPanelState } from "../state/types";
import {
  getToolcraftLayerDepth,
  getToolcraftVisibleLayerRows,
  isToolcraftLayerInsideGroup,
  isToolcraftLayerVisibleInTree,
} from "./layer-tree";
import { PanelContainer } from "./panel-host";
import type { PanelPlacement, PanelStateChange } from "./panel-host-types";
import { useToolcraft } from "./use-toolcraft";

export type LayersPanelProps = {
  className?: string;
  framed?: boolean;
  groupCreation?: boolean;
  onPanelStateChange?: PanelStateChange;
  panelPlacement?: PanelPlacement;
  panelState?: ToolcraftPanelState;
};

type LayerDropPlacement = "after" | "before";

type LayerInsertTarget = {
  indicatorDepth?: number;
  layerId: string;
  parentGroupId?: string | null;
  placement: LayerDropPlacement;
};

type LayerPointerTarget =
  | {
      element: HTMLElement;
      kind: "row";
    }
  | {
      kind: "gap";
      target: LayerInsertTarget;
    };

type LayerDragState = {
  dragging: boolean;
  layerId: string;
  pointerId: number;
  startX: number;
  startY: number;
};

const selectedLayerSurfaceClassName =
  "bg-[color:color-mix(in_oklab,var(--accent)_20%,transparent)]";
const hoveredLayerSurfaceClassName =
  "hover:bg-[color:color-mix(in_oklab,var(--foreground)_10%,transparent)]";
const layerDepthIndentPx = 20;
const layerDragStartDistance = 4;
const layerGroupDropRatioStart = 0.25;
const layerGroupDropRatioEnd = 0.75;

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function getLayerDisplayName(layer: ToolcraftLayer): string {
  const displayName = layer.displayName?.trim();

  return displayName ? displayName : layer.name;
}

function isGroupLayer(layer: ToolcraftLayer): boolean {
  return layer.kind === "group";
}

function getLayerBlockIds(
  layers: readonly ToolcraftLayer[],
  layerId: string,
): Set<string> {
  const blockIds = new Set<string>([layerId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const layer of layers) {
      if (layer.parentGroupId && blockIds.has(layer.parentGroupId) && !blockIds.has(layer.id)) {
        blockIds.add(layer.id);
        changed = true;
      }
    }
  }

  return blockIds;
}

function getReorderedLayers({
  draggingLayerId,
  layers,
  target,
}: {
  draggingLayerId: string;
  layers: readonly ToolcraftLayer[];
  target: LayerInsertTarget;
}): ToolcraftLayer[] | null {
  if (draggingLayerId === target.layerId) {
    return null;
  }

  const blockIds = getLayerBlockIds(layers, draggingLayerId);

  if (blockIds.has(target.layerId)) {
    return null;
  }

  const movingBlock = layers.filter((layer) => blockIds.has(layer.id));
  const remainingLayers = layers.filter((layer) => !blockIds.has(layer.id));
  const targetIndex = remainingLayers.findIndex((layer) => layer.id === target.layerId);

  if (targetIndex < 0) {
    return null;
  }

  const targetLayer = remainingLayers[targetIndex];
  const insertIndex =
    target.placement === "after" ? targetIndex + 1 : targetIndex;
  const parentGroupId =
    target.parentGroupId === undefined
      ? targetLayer?.parentGroupId
      : (target.parentGroupId ?? undefined);
  const updatedMovingBlock = movingBlock.map((layer) =>
    layer.id === draggingLayerId ? { ...layer, parentGroupId } : layer,
  );

  return [
    ...remainingLayers.slice(0, insertIndex),
    ...updatedMovingBlock,
    ...remainingLayers.slice(insertIndex),
  ];
}

function getLayerDropRatioFromClientY(
  element: HTMLElement,
  clientY: number,
  fallbackRatio = 0.5,
): number {
  const rect = element.getBoundingClientRect();

  if (rect.height <= 0 || !Number.isFinite(clientY)) {
    return fallbackRatio;
  }

  return Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
}

function canMoveLayerIntoGroup(
  layers: readonly ToolcraftLayer[],
  draggingLayerId: string,
  groupLayerId: string,
): boolean {
  if (draggingLayerId === groupLayerId) {
    return false;
  }

  return !getLayerBlockIds(layers, draggingLayerId).has(groupLayerId);
}

function getLayerSubtreeEndIndex(
  layers: readonly ToolcraftLayer[],
  groupLayerId: string,
): number {
  const groupIndex = layers.findIndex((layer) => layer.id === groupLayerId);

  if (groupIndex < 0) {
    return layers.length;
  }

  let endIndex = groupIndex;

  for (let index = groupIndex + 1; index < layers.length; index += 1) {
    const layer = layers[index];

    if (!layer || !isToolcraftLayerInsideGroup(layers, layer, groupLayerId)) {
      continue;
    }

    endIndex = index;
  }

  return endIndex + 1;
}

function LayerNameEditor({
  displayName,
  draftName,
  onCancel,
  onCommit,
  onDraftNameChange,
}: {
  displayName: string;
  draftName: string;
  onCancel: () => void;
  onCommit: () => void;
  onDraftNameChange: (value: string) => void;
}): React.JSX.Element {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    input.focus();
    input.select();
  }, []);

  return (
    <div className="flex w-full min-w-0 cursor-text items-center text-left select-text">
      <input
        aria-label={`Layer name for ${displayName}`}
        className="min-w-0 flex-1 cursor-text border-0 bg-transparent p-0 text-xs leading-normal font-medium text-[color:var(--foreground)] outline-none select-text"
        onBlur={onCommit}
        onChange={(event) => onDraftNameChange(event.currentTarget.value)}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onCommit();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            onCancel();
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
        ref={inputRef}
        value={draftName}
      />
    </div>
  );
}

function LayerNameContent({
  displayName,
  isVisible,
}: {
  displayName: string;
  isVisible: boolean;
}): React.JSX.Element {
  return (
    <div className="flex w-full min-w-0 cursor-default items-center text-left select-none">
      <ScrollFade
        className="no-scrollbar min-w-0"
        containerClassName="min-w-0 flex-1"
        preset="compact"
        side="right"
        watch={[displayName]}
      >
        <span
          className={cn(
            "block min-w-max pr-2 text-xs font-medium whitespace-nowrap text-[color:var(--foreground)] transition-opacity duration-150 ease-out select-none",
            !isVisible && "opacity-30",
          )}
          title={displayName}
        >
          {displayName}
        </span>
      </ScrollFade>
    </div>
  );
}

function LayerRowIcon({
  collapsed,
  displayName,
  hasMedia,
  isGroup,
  isVisible,
  onToggleCollapsed,
}: {
  collapsed?: boolean;
  displayName: string;
  hasMedia: boolean;
  isGroup: boolean;
  isVisible: boolean;
  onToggleCollapsed?: () => void;
}): React.JSX.Element {
  const iconClassName = cn(
    "size-3 shrink-0 text-[color:var(--foreground)] transition-opacity duration-150 ease-out",
    isVisible ? "opacity-60" : "opacity-30",
  );

  return (
    <span
      aria-hidden="true"
      className="group/layer-row-icon-hit flex h-8 w-3 shrink-0 cursor-default items-center justify-center"
      data-layer-row-icon-hit-area={isGroup ? "group" : undefined}
      data-layer-row-icon-label={
        isGroup ? (collapsed ? `Expand ${displayName}` : `Collapse ${displayName}`) : undefined
      }
      onClick={
        isGroup
          ? (event) => {
              event.stopPropagation();
              onToggleCollapsed?.();
            }
          : undefined
      }
      onDoubleClick={isGroup ? (event) => event.stopPropagation() : undefined}
      onPointerDown={isGroup ? (event) => event.stopPropagation() : undefined}
    >
      {isGroup ? (
        <svg
          className={cn(
            iconClassName,
            "transition-[opacity,transform] duration-150 ease-out",
            isVisible && "group-hover/layer-row-icon-hit:opacity-100",
            collapsed && "-rotate-90",
          )}
          data-layer-row-icon="group"
          fill="none"
          viewBox="0 0 256 256"
        >
          <path
            d="M58 93L125.879 160.879C127.05 162.05 128.95 162.05 130.121 160.879L198 93"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="24"
          />
        </svg>
      ) : hasMedia ? (
        <svg
          aria-hidden="true"
          className={iconClassName}
          data-layer-row-icon="image"
          fill="none"
          viewBox="0 0 256 256"
        >
          <rect
            height="196"
            rx="20"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="16"
            width="196"
            x="30"
            y="30"
          />
          <path
            d="M60 162.719L88.809 123.726C90.2597 121.762 93.1154 121.545 94.8465 123.266L168 196"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="16"
          />
          <circle cx="164" cy="92" fill="currentColor" r="22" />
        </svg>
      ) : (
        <StackSimpleIcon aria-hidden="true" className={iconClassName} data-layer-row-icon="layer" />
      )}
    </span>
  );
}

function LayerActionButtons({
  displayName,
  isEditingName,
  isDragging,
  isReorderDragging,
  isVisible,
  layer,
  onDelete,
  onToggleVisibility,
}: {
  displayName: string;
  isEditingName: boolean;
  isDragging: boolean;
  isReorderDragging: boolean;
  isVisible: boolean;
  layer: ToolcraftLayer;
  onDelete: () => void;
  onToggleVisibility: () => void;
}): React.JSX.Element | null {
  if (isEditingName) {
    return null;
  }

  const mutedIconStyle = isVisible ? undefined : { opacity: 0.3 };

  return (
    <div
      className={cn(
        "inline-flex w-0 translate-x-[7px] shrink-0 items-center self-center gap-px overflow-hidden opacity-0",
        isDragging && "pointer-events-none w-auto overflow-visible opacity-100 transition-none",
        !isDragging &&
          (isReorderDragging
            ? "pointer-events-none transition-none"
            : "transition-none group-hover/layer:w-auto group-hover/layer:overflow-visible group-hover/layer:opacity-100"),
      )}
      data-layer-actions=""
      data-visible={isVisible ? "true" : "false"}
    >
      <Button
        aria-label={layer.visible ? `Hide ${displayName}` : `Show ${displayName}`}
        className="cursor-default!"
        onClick={(event) => {
          event.stopPropagation();
          onToggleVisibility();
        }}
        onDoubleClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        {layer.visible ? <Eye style={mutedIconStyle} /> : <EyeOff style={mutedIconStyle} />}
      </Button>
      <Button
        aria-label={`Delete ${displayName}`}
        className="cursor-default!"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        onDoubleClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Trash2 style={mutedIconStyle} />
      </Button>
    </div>
  );
}

function useLayerNameEditing({
  displayName,
  onRename,
}: {
  displayName: string;
  onRename: (displayName: string) => void;
}) {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [draftName, setDraftName] = React.useState(displayName);
  const skipNextBlurCommitRef = React.useRef(false);

  const startEditingName = (): void => {
    setDraftName(displayName);
    setIsEditingName(true);
  };

  const commitEditingName = (): void => {
    if (skipNextBlurCommitRef.current) {
      skipNextBlurCommitRef.current = false;
      return;
    }

    const nextDisplayName = draftName.trim().replace(/\s+/g, " ");

    if (nextDisplayName && nextDisplayName !== displayName) {
      onRename(nextDisplayName);
    }

    setIsEditingName(false);
  };

  const cancelEditingName = (): void => {
    skipNextBlurCommitRef.current = true;
    setDraftName(displayName);
    setIsEditingName(false);
  };

  return {
    cancelEditingName,
    commitEditingName,
    draftName,
    isEditingName,
    setDraftName,
    startEditingName,
  };
}

function LayerRow({
  depth,
  hasMedia,
  insertIndicatorDepth,
  insertPlacement,
  isDragging,
  isDropTarget,
  isGroupDropAvailable,
  isGroupHighlighted,
  isReorderDragging,
  isSelected,
  isVisible,
  layer,
  onDelete,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRename,
  onSelect,
  onToggleCollapsed,
  onToggleVisibility,
}: {
  depth: number;
  hasMedia: boolean;
  insertIndicatorDepth?: number;
  insertPlacement?: LayerDropPlacement;
  isDragging: boolean;
  isDropTarget: boolean;
  isGroupDropAvailable: boolean;
  isGroupHighlighted: boolean;
  isReorderDragging: boolean;
  isSelected: boolean;
  isVisible: boolean;
  layer: ToolcraftLayer;
  onDelete: () => void;
  onPointerCancel: React.PointerEventHandler<HTMLElement>;
  onPointerDown: React.PointerEventHandler<HTMLElement>;
  onPointerMove: React.PointerEventHandler<HTMLElement>;
  onPointerUp: React.PointerEventHandler<HTMLElement>;
  onRename: (displayName: string) => void;
  onSelect: () => void;
  onToggleCollapsed: () => void;
  onToggleVisibility: () => void;
}): React.JSX.Element {
  const displayName = getLayerDisplayName(layer);
  const isGroup = isGroupLayer(layer);
  const nameEditing = useLayerNameEditing({ displayName, onRename });

  return (
    <li
      aria-label={displayName}
      aria-selected={isSelected}
      className={cn(
        "group/layer relative flex h-8 cursor-default! touch-none select-none items-center gap-px",
        isDragging && "cursor-grabbing",
      )}
      data-dragging={isDragging ? "true" : undefined}
      data-drop-indicator={insertPlacement}
      data-drop-target={isDropTarget ? "true" : undefined}
      data-layer-id={layer.id}
      data-reorder-dragging={isReorderDragging ? "true" : undefined}
      data-selected={isSelected}
      data-visible={isVisible ? "true" : "false"}
      data-template-layer-depth={depth}
      data-template-layer-kind={isGroup ? "group" : "layer"}
      data-template-layer-name={layer.id}
      data-template-layer-parent={layer.parentGroupId}
      onClick={onSelect}
      onDoubleClick={(event) => {
        event.preventDefault();
        nameEditing.startEditingName();
      }}
      onKeyDown={(event) => {
        if (
          nameEditing.isEditingName ||
          !(event.key === "Enter" || event.key === " ") ||
          (event.target instanceof Element && event.target.closest("button,input,select,textarea"))
        ) {
          return;
        }

        event.preventDefault();
        onSelect();
      }}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="option"
      tabIndex={0}
    >
      {insertPlacement ? (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-2 z-20 h-px rounded-full bg-[color:var(--foreground)]",
            insertPlacement === "before" ? "-top-px" : isGroup ? "bottom-0" : "-bottom-px",
          )}
          data-layer-drop-indicator={insertPlacement}
          style={{
            left: `${
              8 + Math.max(0, insertIndicatorDepth ?? depth) * layerDepthIndentPx
            }px`,
          }}
        />
      ) : null}
      <div
        className={cn(
          "grid h-8 min-w-0 flex-1 cursor-default! grid-cols-[minmax(0,1fr)_auto] grid-rows-[minmax(0,1fr)] items-center gap-1.5 rounded-lg border pr-2.5 pl-[7px]",
          "border-transparent transition-none",
          !isSelected && !isReorderDragging && hoveredLayerSurfaceClassName,
          isSelected && selectedLayerSurfaceClassName,
          isGroupDropAvailable && "border-[color:var(--accent)]",
          isDropTarget &&
            "bg-[color:color-mix(in_oklab,var(--accent)_10%,transparent)]",
          isGroupHighlighted &&
            "border-[color:var(--accent)] bg-[color:color-mix(in_oklab,var(--accent)_15%,transparent)]",
        )}
        data-layer-row-surface=""
      >
        <div
          className="flex min-w-0 items-center gap-2"
          style={depth > 0 ? { marginLeft: `${depth * layerDepthIndentPx}px` } : undefined}
        >
          <LayerRowIcon
            collapsed={isGroup ? layer.collapsed === true : undefined}
            displayName={displayName}
            hasMedia={hasMedia}
            isGroup={isGroup}
            isVisible={isVisible}
            onToggleCollapsed={isGroup ? onToggleCollapsed : undefined}
          />
          {nameEditing.isEditingName ? (
            <LayerNameEditor
              displayName={displayName}
              draftName={nameEditing.draftName}
              onCancel={nameEditing.cancelEditingName}
              onCommit={nameEditing.commitEditingName}
              onDraftNameChange={nameEditing.setDraftName}
            />
          ) : (
            <LayerNameContent displayName={displayName} isVisible={isVisible} />
          )}
        </div>
        <LayerActionButtons
          displayName={displayName}
          isEditingName={nameEditing.isEditingName}
          isDragging={isDragging}
          isReorderDragging={isReorderDragging}
          isVisible={isVisible}
          layer={layer}
          onDelete={onDelete}
          onToggleVisibility={onToggleVisibility}
        />
      </div>
    </li>
  );
}

function AddLayerPicker({
  groupCreation,
  onAddGroup,
  onAddLayer,
}: {
  groupCreation: boolean;
  onAddGroup: () => void;
  onAddLayer: () => void;
}): React.JSX.Element {
  const [open, setOpen] = React.useState(false);

  const addLayer = (): void => {
    onAddLayer();
    setOpen(false);
  };
  const addGroup = (): void => {
    onAddGroup();
    setOpen(false);
  };

  if (!groupCreation) {
    return (
      <Button
        aria-label="Add layer"
        data-icon-active={false}
        onClick={addLayer}
        onPointerDown={stopPanelHeaderButtonPointerDown}
        size="icon"
        type="button"
        variant="ghost"
      >
        <PlusIcon />
      </Button>
    );
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        aria-label="Add layer"
        onPointerDown={stopPanelHeaderButtonPointerDown}
        render={<Button data-icon-active={open} size="icon" type="button" variant="ghost" />}
      >
        <PlusIcon />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[148px] gap-1 p-1" side="bottom" sideOffset={4}>
        <Button
          className="h-8 justify-start gap-2 px-2 text-xs"
          onClick={addLayer}
          size="sm"
          type="button"
          variant="ghost"
        >
          <StackPlusIcon className="size-4" />
          Layer
        </Button>
        <Button
          className="h-8 justify-start gap-2 px-2 text-xs"
          onClick={addGroup}
          size="sm"
          type="button"
          variant="ghost"
        >
          <FolderSimpleIcon className="size-4" />
          Group
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function LayersPanelHeader({
  collapsed,
  groupCreation,
  onAddGroup,
  onAddLayer,
  onToggleCollapsed,
}: {
  collapsed: boolean;
  groupCreation: boolean;
  onAddGroup: () => void;
  onAddLayer: () => void;
  onToggleCollapsed: () => void;
}): React.JSX.Element {
  return (
    <div className="shrink-0" data-slot="layers-panel-header-shell">
      <div
        className="flex h-9 touch-none items-center justify-between gap-3 pr-1 pl-3 hover:cursor-grab active:cursor-grabbing"
        data-panel-drag-handle=""
        data-slot="layers-panel-header"
      >
        <p className="m-0 min-w-0 truncate text-xs-plus font-medium text-[color:var(--foreground)]">
          Layers
        </p>
        <div className="inline-flex shrink-0 items-center gap-1">
          {collapsed ? null : (
            <AddLayerPicker
              groupCreation={groupCreation}
              onAddGroup={onAddGroup}
              onAddLayer={onAddLayer}
            />
          )}
          <PanelIconButton
            label={collapsed ? "Expand layers" : "Collapse layers"}
            onClick={onToggleCollapsed}
            onPointerDown={stopPanelHeaderButtonPointerDown}
          >
            <PrimitiveArrowIcon direction={collapsed ? "down" : "up"} />
          </PanelIconButton>
        </div>
      </div>
    </div>
  );
}

export function LayersPanel({
  className,
  framed = true,
  groupCreation = true,
  onPanelStateChange,
  panelPlacement,
  panelState,
}: LayersPanelProps): React.JSX.Element | null {
  const { dispatch, state } = useToolcraft();
  const [internalCollapsed, setInternalCollapsed] = React.useState(false);
  const [dragState, setDragState] = React.useState<LayerDragState | null>(null);
  const [dropTargetGroupId, setDropTargetGroupId] = React.useState<string | null>(null);
  const [highlightedGroupId, setHighlightedGroupId] = React.useState<string | null>(null);
  const [insertTarget, setInsertTarget] = React.useState<LayerInsertTarget | null>(null);
  const dragStateRef = React.useRef<LayerDragState | null>(null);
  const dropTargetGroupIdRef = React.useRef<string | null>(null);
  const highlightedGroupIdRef = React.useRef<string | null>(null);
  const insertTargetRef = React.useRef<LayerInsertTarget | null>(null);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const collapsed = panelState?.collapsed ?? internalCollapsed;
  const placement = panelPlacement ?? (framed ? "frame" : "surface");
  const visibleLayers = React.useMemo(() => getToolcraftVisibleLayerRows(state.layers), [
    state.layers,
  ]);

  if (!state.schema.panels.layers) {
    return null;
  }

  const updateCollapsed = (nextCollapsed: boolean): void => {
    if (panelState?.collapsed === undefined) {
      setInternalCollapsed(nextCollapsed);
    }

    onPanelStateChange?.({ collapsed: nextCollapsed });
  };

  const addLayer = (): void => {
    const selectedLayer = state.layers.find((layer) => layer.id === state.selectedLayerId);
    const parentGroupId =
      selectedLayer?.kind === "group" ? selectedLayer.id : selectedLayer?.parentGroupId;
    const insertIndex = selectedLayer
      ? selectedLayer.kind === "group"
        ? getLayerSubtreeEndIndex(state.layers, selectedLayer.id)
        : state.layers.findIndex((layer) => layer.id === selectedLayer.id) + 1
      : state.layers.length;

    dispatch({
      insertIndex,
      layer: { kind: "layer", parentGroupId },
      type: "layers.add",
    });
  };

  const addGroup = (): void => {
    const selectedLayer = state.layers.find((layer) => layer.id === state.selectedLayerId);
    const parentGroupId =
      selectedLayer?.kind === "group" ? selectedLayer.id : selectedLayer?.parentGroupId;
    const insertIndex = selectedLayer
      ? selectedLayer.kind === "group"
        ? getLayerSubtreeEndIndex(state.layers, selectedLayer.id)
        : state.layers.findIndex((layer) => layer.id === selectedLayer.id) + 1
      : state.layers.length;

    dispatch({
      insertIndex,
      layer: { kind: "group", parentGroupId },
      type: "layers.add",
    });
  };

  const clearDragState = (): void => {
    dragStateRef.current = null;
    dropTargetGroupIdRef.current = null;
    highlightedGroupIdRef.current = null;
    insertTargetRef.current = null;
    setDragState(null);
    setDropTargetGroupId(null);
    setHighlightedGroupId(null);
    setInsertTarget(null);
  };

  const updateDragState = (nextDragState: LayerDragState | null): void => {
    dragStateRef.current = nextDragState;
    setDragState(nextDragState);
  };

  const updateDropTargetGroupId = (nextDropTargetGroupId: string | null): void => {
    dropTargetGroupIdRef.current = nextDropTargetGroupId;
    setDropTargetGroupId(nextDropTargetGroupId);
  };

  const updateHighlightedGroupId = (nextHighlightedGroupId: string | null): void => {
    highlightedGroupIdRef.current = nextHighlightedGroupId;
    setHighlightedGroupId(nextHighlightedGroupId);
  };

  const updateInsertTarget = (nextInsertTarget: LayerInsertTarget | null): void => {
    insertTargetRef.current = nextInsertTarget;
    setInsertTarget(nextInsertTarget);
  };

  const getCanonicalInsertTarget = (
    layer: ToolcraftLayer,
    placement: LayerDropPlacement,
  ): LayerInsertTarget => {
    if (placement === "before") {
      return { layerId: layer.id, placement };
    }

    const visibleIndex = visibleLayers.findIndex((visibleLayer) => visibleLayer.id === layer.id);
    const nextVisibleLayer = visibleIndex >= 0 ? visibleLayers[visibleIndex + 1] : undefined;

    return nextVisibleLayer
      ? { layerId: nextVisibleLayer.id, placement: "before" }
      : { layerId: layer.id, placement: "after" };
  };

  const getVisibleLayerIndex = (layerId: string): number =>
    visibleLayers.findIndex((visibleLayer) => visibleLayer.id === layerId);

  const isLastVisibleLayerInParentGroup = (layer: ToolcraftLayer): boolean => {
    if (!layer.parentGroupId) {
      return false;
    }

    const visibleIndex = getVisibleLayerIndex(layer.id);
    const nextVisibleLayer = visibleIndex >= 0 ? visibleLayers[visibleIndex + 1] : undefined;

    return (
      !nextVisibleLayer ||
      !isToolcraftLayerInsideGroup(state.layers, nextVisibleLayer, layer.parentGroupId)
    );
  };

  const isPointerAtNestedInsertDepth = (
    layer: ToolcraftLayer,
    clientX: number,
  ): boolean => {
    if (!Number.isFinite(clientX)) {
      return false;
    }

    const listLeft = listRef.current?.getBoundingClientRect().left ?? 0;
    const layerDepth = getToolcraftLayerDepth(state.layers, layer);

    return clientX >= listLeft + 8 + layerDepth * layerDepthIndentPx;
  };

  const getParentGroupLayer = (layer: ToolcraftLayer): ToolcraftLayer | undefined =>
    layer.parentGroupId
      ? state.layers.find(
          (currentLayer) => currentLayer.id === layer.parentGroupId && isGroupLayer(currentLayer),
        )
      : undefined;

  const getInsertTargetAfterLayerSubtree = (layer: ToolcraftLayer): LayerInsertTarget => {
    const layerDepth = getToolcraftLayerDepth(state.layers, layer);
    const visibleIndex = getVisibleLayerIndex(layer.id);

    if (visibleIndex < 0) {
      return getCanonicalInsertTarget(layer, "after");
    }

    let lastVisibleLayer = layer;

    for (const nextVisibleLayer of visibleLayers.slice(visibleIndex + 1)) {
      if (getToolcraftLayerDepth(state.layers, nextVisibleLayer) <= layerDepth) {
        return { layerId: nextVisibleLayer.id, placement: "before" };
      }

      lastVisibleLayer = nextVisibleLayer;
    }

    return {
      indicatorDepth: layerDepth,
      layerId: lastVisibleLayer.id,
      parentGroupId: layer.parentGroupId ?? null,
      placement: "after",
    };
  };

  const getOutsideParentGroupInsertTarget = (layer: ToolcraftLayer): LayerInsertTarget => {
    const parentGroupLayer = getParentGroupLayer(layer);

    return parentGroupLayer
      ? getInsertTargetAfterLayerSubtree(parentGroupLayer)
      : getCanonicalInsertTarget(layer, "after");
  };

  const getNestedBoundaryLayerForTarget = (
    target: LayerInsertTarget,
  ): ToolcraftLayer | undefined => {
    const targetLayer = state.layers.find((layer) => layer.id === target.layerId);

    if (!targetLayer) {
      return undefined;
    }

    if (target.placement === "after") {
      return isLastVisibleLayerInParentGroup(targetLayer) ? targetLayer : undefined;
    }

    const visibleIndex = getVisibleLayerIndex(targetLayer.id);
    const previousVisibleLayer =
      visibleIndex > 0 ? visibleLayers[visibleIndex - 1] : undefined;

    return previousVisibleLayer && isLastVisibleLayerInParentGroup(previousVisibleLayer)
      ? previousVisibleLayer
      : undefined;
  };

  const getResolvedInsertTarget = (
    target: LayerInsertTarget,
    clientX: number,
  ): LayerInsertTarget | null => {
    const boundaryLayer = getNestedBoundaryLayerForTarget(target);

    if (boundaryLayer) {
      return isPointerAtNestedInsertDepth(boundaryLayer, clientX)
        ? { layerId: boundaryLayer.id, placement: "after" }
        : getOutsideParentGroupInsertTarget(boundaryLayer);
    }

    const targetLayer = state.layers.find((layer) => layer.id === target.layerId);

    return targetLayer ? getCanonicalInsertTarget(targetLayer, target.placement) : null;
  };

  const getNearestInsertTarget = (
    layer: ToolcraftLayer,
    dropRatio: number,
    clientX: number,
  ): LayerInsertTarget | null => {
    if (dropRatio < 0.5) {
      return { layerId: layer.id, placement: "before" };
    }

    return getResolvedInsertTarget({ layerId: layer.id, placement: "after" }, clientX);
  };

  const getInsertIndicatorTarget = (target: LayerInsertTarget): LayerInsertTarget => {
    if (target.placement !== "before") {
      return target;
    }

    const visibleIndex = visibleLayers.findIndex(
      (visibleLayer) => visibleLayer.id === target.layerId,
    );
    const previousVisibleLayer =
      visibleIndex > 0 ? visibleLayers[visibleIndex - 1] : undefined;

    return previousVisibleLayer && isGroupLayer(previousVisibleLayer)
      ? { layerId: previousVisibleLayer.id, placement: "after" }
      : target;
  };

  const getPointerTarget = (clientX: number, clientY: number): LayerPointerTarget | null => {
    const targetElement = document
      .elementFromPoint(clientX, clientY)
      ?.closest<HTMLElement>("[data-layer-id]");

    if (targetElement) {
      return { element: targetElement, kind: "row" };
    }

    const listElement = listRef.current;

    if (!listElement) {
      return null;
    }

    const listRect = listElement.getBoundingClientRect();

    if (
      clientX < listRect.left ||
      clientX > listRect.right ||
      clientY < listRect.top ||
      clientY > listRect.bottom
    ) {
      return null;
    }

    const rowElements = Array.from(listElement.querySelectorAll<HTMLElement>("[data-layer-id]"));

    for (const rowElement of rowElements) {
      const rowRect = rowElement.getBoundingClientRect();
      const layerId = rowElement.dataset.layerId;

      if (!layerId) {
        continue;
      }

      if (clientY < rowRect.top) {
        return { kind: "gap", target: { layerId, placement: "before" } };
      }

      if (clientY <= rowRect.bottom) {
        return { element: rowElement, kind: "row" };
      }
    }

    const lastRowElement = rowElements.at(-1);
    const lastLayerId = lastRowElement?.dataset.layerId;

    return lastLayerId
      ? { kind: "gap", target: { layerId: lastLayerId, placement: "after" } }
      : null;
  };

  const clearDragTarget = (): void => {
    updateDropTargetGroupId(null);
    updateHighlightedGroupId(null);
    updateInsertTarget(null);
  };

  const updateDragTarget = (
    pointerTarget: LayerPointerTarget | null,
    clientX: number,
    clientY: number,
    activeLayerId: string,
  ): void => {
    if (!pointerTarget) {
      clearDragTarget();
      return;
    }

    if (pointerTarget.kind === "gap") {
      const nextInsertTarget = getResolvedInsertTarget(pointerTarget.target, clientX);

      updateDropTargetGroupId(null);
      updateHighlightedGroupId(null);
      updateInsertTarget(nextInsertTarget);
      return;
    }

    const layerId = pointerTarget.element.dataset.layerId;

    if (!layerId || layerId === activeLayerId) {
      clearDragTarget();
      return;
    }

    const targetLayer = state.layers.find((layer) => layer.id === layerId);

    if (!targetLayer) {
      clearDragTarget();
      return;
    }

    const canDropIntoGroup =
      targetLayer.kind === "group" &&
      canMoveLayerIntoGroup(state.layers, activeLayerId, targetLayer.id);
    const highlightedGroup = targetLayer.kind === "group" ? targetLayer.id : null;
    const dropRatio = getLayerDropRatioFromClientY(
      pointerTarget.element,
      clientY,
      canDropIntoGroup ? 0.5 : 0,
    );

    if (
      canDropIntoGroup &&
      dropRatio > layerGroupDropRatioStart &&
      dropRatio < layerGroupDropRatioEnd
    ) {
      updateDropTargetGroupId(targetLayer.id);
      updateHighlightedGroupId(targetLayer.id);
      updateInsertTarget(null);
      return;
    }

    updateDropTargetGroupId(null);
    updateHighlightedGroupId(highlightedGroup);
    updateInsertTarget(getNearestInsertTarget(targetLayer, dropRatio, clientX));
  };

  const commitDrag = (): void => {
    const activeDragState = dragStateRef.current ?? dragState;
    const activeDropTargetGroupId = dropTargetGroupIdRef.current ?? dropTargetGroupId;
    const activeInsertTarget = insertTargetRef.current ?? insertTarget;

    if (!activeDragState?.dragging) {
      clearDragState();
      return;
    }

    if (activeDropTargetGroupId) {
      dispatch({
        layerIds: [activeDragState.layerId],
        parentGroupId: activeDropTargetGroupId,
        type: "layers.moveToGroup",
      });
      clearDragState();
      return;
    }

    if (!activeInsertTarget) {
      clearDragState();
      return;
    }

    const layers = getReorderedLayers({
      draggingLayerId: activeDragState.layerId,
      layers: state.layers,
      target: activeInsertTarget,
    });

    if (layers) {
      dispatch({ layers, type: "layers.reorder" });
    }

    clearDragState();
  };

  const panelSurface = (
    <PanelSurface
      className={cn(
        "pointer-events-auto flex max-h-[calc(100dvh-1.25rem)] w-[240px] flex-col overflow-hidden rounded-lg p-0",
        className,
      )}
      data-toolcraft-layers-panel=""
      data-panel-id="layers"
    >
      <LayersPanelHeader
        collapsed={collapsed}
        groupCreation={groupCreation}
        onAddGroup={addGroup}
        onAddLayer={addLayer}
        onToggleCollapsed={() => updateCollapsed(!collapsed)}
      />
      {collapsed ? null : (
        <PanelContentSurface data-slot="layers-panel-content">
          <ul
            aria-label="Layers"
            className="flex min-h-0 flex-col gap-0.5 p-1"
            data-layer-list=""
            data-layer-list-dragging={dragState?.dragging ? "true" : undefined}
            ref={listRef}
            role="listbox"
          >
            {visibleLayers.map((layer) => {
              const depth = getToolcraftLayerDepth(state.layers, layer);
              const displayName = getLayerDisplayName(layer);
              const isDragging = dragState?.layerId === layer.id && dragState.dragging;
              const isReorderDragging = dragState?.dragging === true;
              const isVisible = isToolcraftLayerVisibleInTree(state.layers, layer);
              const hasMedia = state.mediaAssets.some((asset) => asset.layerId === layer.id);
              const insertIndicatorTarget = insertTarget
                ? getInsertIndicatorTarget(insertTarget)
                : null;
              const rowInsertPlacement =
                insertIndicatorTarget?.layerId === layer.id
                  ? insertIndicatorTarget.placement
                  : undefined;

              return (
                <LayerRow
                  depth={depth}
                  hasMedia={hasMedia}
                  insertIndicatorDepth={insertIndicatorTarget?.indicatorDepth ?? depth}
                  insertPlacement={rowInsertPlacement}
                  isDragging={isDragging}
                  isDropTarget={dropTargetGroupId === layer.id}
                  isGroupDropAvailable={
                    dragState?.dragging === true &&
                    layer.kind === "group" &&
                    dropTargetGroupId === layer.id &&
                    canMoveLayerIntoGroup(state.layers, dragState.layerId, layer.id)
                  }
                  isGroupHighlighted={highlightedGroupId === layer.id}
                  isReorderDragging={isReorderDragging}
                  isSelected={state.selectedLayerId === layer.id}
                  isVisible={isVisible}
                  key={layer.id}
                  layer={layer}
                  onDelete={() => dispatch({ layerId: layer.id, type: "layers.delete" })}
                  onPointerCancel={clearDragState}
                  onPointerDown={(event) => {
                    if (event.button !== 0) {
                      return;
                    }

                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    updateDragState({
                      dragging: false,
                      layerId: layer.id,
                      pointerId: event.pointerId,
                      startX: event.clientX,
                      startY: event.clientY,
                    });
                  }}
                  onPointerMove={(event) => {
                    const activeDragState = dragStateRef.current ?? dragState;

                    if (!activeDragState || activeDragState.pointerId !== event.pointerId) {
                      return;
                    }

                    const distance = Math.hypot(
                      event.clientX - activeDragState.startX,
                      event.clientY - activeDragState.startY,
                    );

                    if (!activeDragState.dragging && distance < layerDragStartDistance) {
                      return;
                    }

                    event.preventDefault();
                    const nextDragState = { ...activeDragState, dragging: true };

                    updateDragState(nextDragState);
                    updateDragTarget(
                      getPointerTarget(event.clientX, event.clientY),
                      event.clientX,
                      event.clientY,
                      activeDragState.layerId,
                    );
                  }}
                  onPointerUp={(event) => {
                    const activeDragState = dragStateRef.current ?? dragState;

                    if (activeDragState?.pointerId !== event.pointerId) {
                      return;
                    }

                    commitDrag();
                  }}
                  onRename={(name) =>
                    dispatch({
                      layerId: layer.id,
                      name,
                      type: "layers.rename",
                    })
                  }
                  onSelect={() => dispatch({ layerId: layer.id, type: "layers.select" })}
                  onToggleCollapsed={() =>
                    dispatch({ layerId: layer.id, type: "layers.toggleCollapsed" })
                  }
                  onToggleVisibility={() =>
                    dispatch({ layerId: layer.id, type: "layers.toggleVisibility" })
                  }
                />
              );
            })}
            {visibleLayers.length === 0 ? (
              <li className="px-2 py-3 text-xs text-[color:color-mix(in_oklab,var(--foreground)_55%,transparent)]">
                No layers
              </li>
            ) : null}
          </ul>
        </PanelContentSurface>
      )}
    </PanelSurface>
  );

  if (placement === "surface") {
    return panelSurface;
  }

  return (
    <PanelContainer
      onPanelStateChange={onPanelStateChange}
      panelState={panelState}
      panelType="layers"
      placement={placement}
    >
      {panelSurface}
    </PanelContainer>
  );
}
