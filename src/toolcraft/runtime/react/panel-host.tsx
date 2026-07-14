"use client";

import * as React from "react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  type MotionValue,
  type PanInfo,
} from "motion/react";

import {
  panelDragHandleSelector,
  panelDragIgnoredTargetSelector,
  panelDragTransition,
  panelHostConfig,
  panelSnapAnimation,
} from "./panel-host-config";
import { resolvePanelSnapPosition } from "./panel-host-geometry";
import type {
  ToolcraftPanelHostProps,
  PanelContainerProps,
  PanelHostProps,
  PanelPoint,
  PanelStageProps,
  PanelViewport,
} from "./panel-host-types";
import { useToolcraft } from "./use-toolcraft";

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function isPanelDragHandleTarget(target: EventTarget | null, currentTarget: HTMLElement): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const handleTarget = target.closest(panelDragHandleSelector);

  return handleTarget !== null && currentTarget.contains(handleTarget);
}

function shouldIgnorePanelTarget(target: EventTarget | null, currentTarget: HTMLElement): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const ignoredTarget = target.closest(panelDragIgnoredTargetSelector);

  return ignoredTarget !== null && currentTarget.contains(ignoredTarget);
}

function shouldIgnorePanelDrag(event: React.PointerEvent<HTMLElement>): boolean {
  return shouldIgnorePanelTarget(event.target, event.currentTarget);
}

function getPanelVisualViewport(): PanelViewport {
  const visualViewport = window.visualViewport;

  if (visualViewport) {
    return {
      height: visualViewport.height,
      offsetLeft: visualViewport.offsetLeft,
      offsetTop: visualViewport.offsetTop,
      width: visualViewport.width,
    };
  }

  return {
    height: window.innerHeight,
    offsetLeft: 0,
    offsetTop: 0,
    width: window.innerWidth,
  };
}

function animatePanelMotionValue(value: MotionValue<number>, target: number): void {
  void animate(value, target, panelSnapAnimation);
}

function usePanelSnapControls({
  onPositionChange,
  onResetPosition,
  position = { x: 0, y: 0 },
  snap,
}: Pick<PanelHostProps, "onPositionChange" | "onResetPosition" | "position" | "snap">) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(position.x);
  const y = useMotionValue(position.y);

  React.useEffect(() => {
    animatePanelMotionValue(x, position.x);
    animatePanelMotionValue(y, position.y);
  }, [position.x, position.y, x, y]);

  const publishPosition = (nextPosition: PanelPoint): void => {
    onPositionChange?.(nextPosition);
  };

  const publishCurrentPosition = (): void => {
    publishPosition({ x: x.get(), y: y.get() });
  };

  const handleDragEnd = (info: PanInfo): void => {
    if (!snap || snap.edges.length === 0) {
      publishCurrentPosition();
      return;
    }

    const panel = panelRef.current;

    if (!panel) {
      publishCurrentPosition();
      return;
    }

    const rect = panel.getBoundingClientRect();
    const offset = { x: x.get(), y: y.get() };
    const target = resolvePanelSnapPosition({
      dimensions: { height: rect.height, width: rect.width },
      edges: snap.edges,
      margin: snap.margin,
      position: { x: rect.left, y: rect.top },
      velocity: { x: info.velocity.x / 1000, y: info.velocity.y / 1000 },
      viewport: getPanelVisualViewport(),
      zone: snap.zone,
    });

    if (!target) {
      publishCurrentPosition();
      return;
    }

    const nextPosition = {
      x: target.x - (rect.left - offset.x),
      y: target.y - (rect.top - offset.y),
    };

    animatePanelMotionValue(x, nextPosition.x);
    animatePanelMotionValue(y, nextPosition.y);
    publishPosition(nextPosition);
  };

  const resetPosition = (): void => {
    animatePanelMotionValue(x, 0);
    animatePanelMotionValue(y, 0);
    publishPosition({ x: 0, y: 0 });
    onResetPosition?.();
  };

  return { handleDragEnd, panelRef, resetPosition, x, y };
}

export function PanelHost({
  children,
  className,
  dragMode,
  innerClassName,
  onPositionChange,
  onResetPosition,
  panelId,
  panelType,
  position,
  snap,
  style,
}: PanelHostProps): React.JSX.Element {
  const config = panelHostConfig[panelType];
  const resolvedDragMode = dragMode ?? config.dragMode;
  const resolvedSnap = snap ?? { edges: config.snapEdges };
  const resolvedPanelId = panelId ?? config.panelId;
  const dragControls = useDragControls();
  const {
    handleDragEnd: handleSnapDragEnd,
    panelRef,
    resetPosition,
    x,
    y,
  } = usePanelSnapControls({
    onPositionChange,
    onResetPosition,
    position,
    snap: resolvedSnap,
  });
  const [isDragging, setIsDragging] = React.useState(false);

  const handlePointerDown: React.PointerEventHandler<HTMLElement> = (event) => {
    if (event.button !== 0) {
      return;
    }

    if (
      resolvedDragMode === "handle" &&
      !isPanelDragHandleTarget(event.target, event.currentTarget)
    ) {
      return;
    }

    if (event.defaultPrevented || shouldIgnorePanelDrag(event)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    dragControls.start(event);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void => {
    setIsDragging(false);
    handleSnapDragEnd(info);
  };

  const handleDoubleClick: React.MouseEventHandler<HTMLElement> = (event) => {
    if (
      !resolvedSnap ||
      event.defaultPrevented ||
      (resolvedDragMode === "handle" &&
        !isPanelDragHandleTarget(event.target, event.currentTarget)) ||
      shouldIgnorePanelTarget(event.target, event.currentTarget)
    ) {
      return;
    }

    resetPosition();
  };

  return (
    <div className={cn("pointer-events-none", config.wrapperClassName, className)} style={style}>
      <motion.div
        className={cn("pointer-events-auto", isDragging && "cursor-grabbing", innerClassName)}
        data-dragging={isDragging ? "true" : "false"}
        data-drag-mode={resolvedDragMode}
        data-panel-id={resolvedPanelId}
        data-panel-type={panelType}
        data-slot="toolcraft-runtime-panel-host"
        data-snap-edges={resolvedSnap?.edges.join(" ")}
        drag
        dragControls={dragControls}
        dragElastic={0}
        dragListener={false}
        dragMomentum={false}
        dragTransition={panelDragTransition}
        onDoubleClick={handleDoubleClick}
        onDragEnd={handleDragEnd}
        onDragStart={() => setIsDragging(true)}
        onPointerDown={handlePointerDown}
        ref={panelRef}
        style={{ x, y }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ToolcraftPanelHost({
  onPositionChange,
  onResetPosition,
  panelType,
  position,
  ...props
}: ToolcraftPanelHostProps): React.JSX.Element {
  const { dispatch, state } = useToolcraft();
  const panelState = state.panels[panelType];

  return (
    <PanelHost
      {...props}
      onPositionChange={(offset) => {
        onPositionChange?.(offset);
        dispatch({ offset, panelId: panelType, type: "panels.setOffset" });
      }}
      onResetPosition={() => {
        onResetPosition?.();
        dispatch({ panelId: panelType, type: "panels.resetOffset" });
      }}
      panelType={panelType}
      position={position ?? panelState.offset}
    />
  );
}

export function PanelStage({
  children,
  className,
  ...props
}: PanelStageProps): React.JSX.Element {
  return (
    <div
      {...props}
      className={cn(
        "relative w-full min-w-0 overflow-hidden rounded-lg bg-[color:var(--background)]",
        className,
      )}
      data-toolcraft-panel-stage=""
    >
      {children}
    </div>
  );
}

export function PanelContainer({
  children,
  className,
  dragMode,
  onPanelStateChange,
  panelClassName,
  panelState,
  panelType,
  placement,
  ...props
}: PanelContainerProps): React.JSX.Element {
  const config = panelHostConfig[panelType];

  if (placement === "surface") {
    return <>{children}</>;
  }

  if (placement === "floating") {
    return (
      <PanelHost
        className={panelClassName}
        dragMode={dragMode}
        onPositionChange={(offset) => onPanelStateChange?.({ offset })}
        panelType={panelType}
        position={panelState?.offset}
        snap={{ edges: config.snapEdges }}
      >
        {children}
      </PanelHost>
    );
  }

  return (
    <PanelStage
      {...props}
      className={cn(config.stageClassName, className)}
      data-panel-type={panelType}
    >
      <PanelHost
        className={panelClassName}
        dragMode={dragMode}
        onPositionChange={(offset) => onPanelStateChange?.({ offset })}
        panelType={panelType}
        position={panelState?.offset}
        snap={{ edges: config.snapEdges }}
      >
        {children}
      </PanelHost>
    </PanelStage>
  );
}
