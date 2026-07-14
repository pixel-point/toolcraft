"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { EditableSliderValueLabel, Field, Input } from "../../primitives";
import {
  createControlHistoryGroupId,
  type ControlChangeMeta,
  type ControlValueChangeHandler,
  type CurvePoint,
} from "../control-types";
import { cn } from "../../../lib/utils";

export type VectorControlValue = {
  x: string;
  y: string;
};

type VectorPadAxisLock = "x" | "y";

type VectorPadDragStart = {
  clientX: number;
  clientY: number;
  value: VectorControlValue;
};

export type VectorPadVariant =
  | "default"
  | "whiteBalance"
  | "colorBalance"
  | "chromaOffset"
  | "toneBias";

export type VectorPadCoordinateMode = "cartesian" | "screen";

export type VectorControlProps = VectorControlValue & {
  defaultValue?: Partial<VectorControlValue>;
  name: string;
  onValueChange?: ControlValueChangeHandler<VectorControlValue>;
  padCoordinateMode?: VectorPadCoordinateMode;
  padShape?: "compact" | "square";
  padVariant?: VectorPadVariant;
  xLabel?: string;
  yLabel?: string;
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function getDefaultPadCoordinateMode(
  padVariant: VectorPadVariant,
): VectorPadCoordinateMode {
  return padVariant === "default" ? "screen" : "cartesian";
}

function pointFromEvent(
  event: React.PointerEvent<HTMLElement>,
  coordinateMode: VectorPadCoordinateMode,
): CurvePoint {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width);
  const yRatio = clamp((event.clientY - rect.top) / rect.height);
  const y = coordinateMode === "screen" ? yRatio : 1 - yRatio;

  return { x, y };
}

type VectorPadStyle = React.CSSProperties & {
  "--xy-pad-display-x": string;
  "--xy-pad-display-y": string;
  "--xy-pad-handle-margin": string;
  "--xy-pad-x": string;
  "--xy-pad-y": string;
};

const vectorPadAxisLockThresholdPx = 2;

const whiteBalancePadBackgroundImage =
  "linear-gradient(90deg,color-mix(in oklab, #2f7cff 72%, transparent),color-mix(in oklab, var(--foreground) 8%, transparent) 50%,color-mix(in oklab, #ff9a22 78%, transparent)),linear-gradient(180deg,color-mix(in oklab, #d84f9a 68%, transparent),transparent 49%,color-mix(in oklab, #42ba62 72%, transparent)),radial-gradient(circle at 50% 50%,color-mix(in oklab, var(--foreground) 7%, transparent),color-mix(in oklab, var(--background) 14%, transparent) 62%)";

const colorBalancePadBackgroundImage =
  "linear-gradient(90deg,color-mix(in oklab, #1dbdd3 70%, transparent),color-mix(in oklab, var(--foreground) 7%, transparent) 50%,color-mix(in oklab, #ff4a45 74%, transparent)),linear-gradient(180deg,color-mix(in oklab, #f2d94c 66%, transparent),transparent 50%,color-mix(in oklab, #315cff 70%, transparent)),radial-gradient(circle at 50% 50%,color-mix(in oklab, var(--foreground) 7%, transparent),color-mix(in oklab, var(--background) 14%, transparent) 62%)";

const chromaOffsetPadBackgroundImage =
  "linear-gradient(90deg,color-mix(in oklab, #ff2f55 68%, transparent),transparent 38%,transparent 62%,color-mix(in oklab, #25c7ff 70%, transparent)),linear-gradient(180deg,color-mix(in oklab, #56ff72 54%, transparent),transparent 42%,transparent 58%,color-mix(in oklab, #7b5cff 62%, transparent)),radial-gradient(circle at 50% 50%,color-mix(in oklab, var(--foreground) 8%, transparent),color-mix(in oklab, var(--background) 14%, transparent) 62%)";

const toneBiasPadBackgroundImage =
  "linear-gradient(90deg,color-mix(in oklab, #3f56ff 60%, transparent),color-mix(in oklab, var(--foreground) 7%, transparent) 50%,color-mix(in oklab, #ffb23f 68%, transparent)),linear-gradient(180deg,color-mix(in oklab, #f05bb5 55%, transparent),transparent 50%,color-mix(in oklab, #1fbf9a 60%, transparent)),radial-gradient(circle at 50% 50%,color-mix(in oklab, var(--foreground) 7%, transparent),color-mix(in oklab, var(--background) 14%, transparent) 62%)";

const vectorPadBackgroundImages: Partial<Record<VectorPadVariant, string>> = {
  chromaOffset: chromaOffsetPadBackgroundImage,
  colorBalance: colorBalancePadBackgroundImage,
  toneBias: toneBiasPadBackgroundImage,
  whiteBalance: whiteBalancePadBackgroundImage,
};

function getVectorPoint(
  x: string,
  y: string,
  coordinateMode: VectorPadCoordinateMode,
): VectorPadStyle {
  const parsedX = Number.parseFloat(x);
  const parsedY = Number.parseFloat(y);
  const clampedX = Number.isFinite(parsedX) ? clamp(parsedX, -1, 1) : 0;
  const clampedY = Number.isFinite(parsedY) ? clamp(parsedY, -1, 1) : 0;
  const xPosition = `${(clampedX + 1) * 50}%`;
  const yPosition =
    coordinateMode === "screen"
      ? `${((clampedY + 1) / 2) * 100}%`
      : `${(1 - (clampedY + 1) / 2) * 100}%`;

  return {
    "--xy-pad-display-x":
      "clamp(var(--xy-pad-handle-margin), var(--xy-pad-x), calc(100% - var(--xy-pad-handle-margin)))",
    "--xy-pad-display-y":
      "clamp(var(--xy-pad-handle-margin), var(--xy-pad-y), calc(100% - var(--xy-pad-handle-margin)))",
    "--xy-pad-handle-margin": "12px",
    "--xy-pad-x": xPosition,
    "--xy-pad-y": yPosition,
  };
}

function getVectorValueLabel(x: string, y: string): string {
  return `${formatVectorPadCoordinate(x)}, ${formatVectorPadCoordinate(y)}`;
}

function normalizeVectorCoordinate(value: string | undefined): string {
  return typeof value === "string" && value.trim() ? value : "0.00";
}

function formatVectorPadCoordinate(value: string | undefined): string {
  const parsedValue = Number.parseFloat(normalizeVectorCoordinate(value));

  if (!Number.isFinite(parsedValue)) {
    return "0.00";
  }

  const roundedValue = Math.abs(parsedValue) < 0.005 ? 0 : clamp(parsedValue, -1, 1);

  return roundedValue.toFixed(2);
}

function parseVectorValueDraft(value: string): VectorControlValue | null {
  const matches = value.match(/[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)/g);

  if (!matches || matches.length < 2) {
    return null;
  }

  const [rawX, rawY] = matches;
  const nextX = Number.parseFloat(rawX.replace(",", "."));
  const nextY = Number.parseFloat(rawY.replace(",", "."));

  if (!Number.isFinite(nextX) || !Number.isFinite(nextY)) {
    return null;
  }

  return {
    x: clamp(nextX, -1, 1).toFixed(2),
    y: clamp(nextY, -1, 1).toFixed(2),
  };
}

function VectorSizeField({
  defaultValue,
  name,
  onValueChange,
  x,
  xLabel = "X",
  y,
  yLabel = "Y",
}: VectorControlProps): React.JSX.Element {
  const [draftValue, setDraftValue] = React.useState({ x, y });
  const committedValueRef = React.useRef({ x, y });
  const defaultValueRef = React.useRef({
    x: normalizeVectorCoordinate(defaultValue?.x),
    y: normalizeVectorCoordinate(defaultValue?.y),
  });

  React.useEffect(() => {
    committedValueRef.current = { x, y };
    setDraftValue({ x, y });
  }, [x, y]);

  React.useEffect(() => {
    defaultValueRef.current = {
      x: normalizeVectorCoordinate(defaultValue?.x),
      y: normalizeVectorCoordinate(defaultValue?.y),
    };
  }, [defaultValue?.x, defaultValue?.y]);

  function commitVector(): void {
    const nextValue = {
      x: draftValue.x.trim() === "" ? defaultValueRef.current.x : draftValue.x,
      y: draftValue.y.trim() === "" ? defaultValueRef.current.y : draftValue.y,
    };

    setDraftValue(nextValue);

    if (
      nextValue.x !== committedValueRef.current.x ||
      nextValue.y !== committedValueRef.current.y
    ) {
      onValueChange?.(nextValue);
    }
  }

  function cancelDraft(): void {
    setDraftValue(committedValueRef.current);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      commitVector();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelDraft();
      event.currentTarget.blur();
    }
  }

  return (
    <Field className="min-w-0 gap-2">
      <div className="flex items-center justify-between gap-3">
        <ControlFieldLabel>{name}</ControlFieldLabel>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5">
        <Input
          aria-label={`${name} ${xLabel}`}
          className="font-mono"
          onBlur={commitVector}
          onChange={(event) =>
            setDraftValue((current) => ({ ...current, x: event.target.value }))
          }
          onKeyDown={handleKeyDown}
          size="default"
          value={draftValue.x}
        />
        <Input
          aria-label={`${name} ${yLabel}`}
          className="font-mono"
          onBlur={commitVector}
          onChange={(event) =>
            setDraftValue((current) => ({ ...current, y: event.target.value }))
          }
          onKeyDown={handleKeyDown}
          size="default"
          value={draftValue.y}
        />
      </div>
    </Field>
  );
}

function VectorPadGuides({ isDragging }: { isDragging: boolean }): React.JSX.Element {
  const motionClass = isDragging
    ? "transition-none"
    : "transition-[top] duration-[260ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]";
  const verticalMotionClass = isDragging
    ? "transition-none"
    : "transition-[left] duration-[260ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]";

  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 z-10 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--foreground)_20%,transparent),transparent)]",
          motionClass,
        )}
        style={{ top: "var(--xy-pad-display-y)" }}
      />
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--foreground)_20%,transparent),transparent)]",
          verticalMotionClass,
        )}
        style={{ left: "var(--xy-pad-display-x)" }}
      />
    </>
  );
}

function VectorPadHandle({ isDragging }: { isDragging: boolean }): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "xy-handle group/xy-handle pointer-events-auto absolute z-20 size-3 -translate-x-1/2 -translate-y-1/2 cursor-default will-change-[left,top,transform]",
        isDragging
          ? "cursor-pointer transition-transform duration-[120ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          : "transition-[left,top,transform] duration-[260ms,260ms,120ms] ease-[cubic-bezier(0.34,1.56,0.64,1),cubic-bezier(0.34,1.56,0.64,1),cubic-bezier(0.22,1,0.36,1)] hover:cursor-pointer",
      )}
      style={{ left: "var(--xy-pad-display-x)", top: "var(--xy-pad-display-y)" }}
      >
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-[-5px] rounded-full bg-[color:color-mix(in_oklab,var(--foreground)_12%,transparent)] opacity-0 blur-[8px] transition-[opacity,scale] duration-200 ease-out",
            isDragging ? "scale-[1.45] opacity-100" : "scale-95",
          )}
        />
      <span
        className={cn(
          "relative block size-full rounded-full bg-[radial-gradient(circle_at_30%_30%,color-mix(in_oklab,var(--foreground)_95%,transparent),color-mix(in_oklab,var(--foreground)_76%,transparent)),linear-gradient(180deg,color-mix(in_oklab,var(--foreground)_20%,transparent),color-mix(in_oklab,var(--foreground)_6%,transparent))] shadow-[0_4px_10px_color-mix(in_oklab,var(--background)_20%,transparent)] transition-[scale,background-color,box-shadow] duration-200 ease-out will-change-transform motion-reduce:transition-none",
          isDragging ? "scale-[1.3333]" : "group-hover/xy-handle:scale-[1.3333]",
        )}
      />
    </div>
  );
}

function VectorPadField({
  defaultValue,
  name,
  onValueChange,
  padCoordinateMode,
  padShape = "compact",
  padVariant = "default",
  x,
  y,
}: VectorControlProps): React.JSX.Element {
  const [isPointerDragging, setIsPointerDragging] = React.useState(false);
  const normalizedX = formatVectorPadCoordinate(x);
  const normalizedY = formatVectorPadCoordinate(y);
  const coordinateMode =
    padCoordinateMode ?? getDefaultPadCoordinateMode(padVariant);
  const point = getVectorPoint(normalizedX, normalizedY, coordinateMode);
  const valueLabel = getVectorValueLabel(normalizedX, normalizedY);
  const vectorPadBackgroundImage = vectorPadBackgroundImages[padVariant];
  const axisLockRef = React.useRef<VectorPadAxisLock | null>(null);
  const dragStartRef = React.useRef<VectorPadDragStart | null>(null);
  const liveHistoryGroupRef = React.useRef<string | null>(null);
  const resetX = formatVectorPadCoordinate(defaultValue?.x);
  const resetY = formatVectorPadCoordinate(defaultValue?.y);
  const updateVector = (
    nextX: string,
    nextY: string,
    meta?: ControlChangeMeta,
  ) => {
    if (meta) {
      onValueChange?.({ x: nextX, y: nextY }, meta);
      return;
    }

    onValueChange?.({ x: nextX, y: nextY });
  };
  const commitVectorValue = (nextValue: string) => {
    const nextVector = parseVectorValueDraft(nextValue);

    if (nextVector) {
      updateVector(nextVector.x, nextVector.y);
    }
  };

  function getLiveHistoryMeta(): ControlChangeMeta {
    liveHistoryGroupRef.current ??= createControlHistoryGroupId(`vector:${name}`);

    return {
      history: "merge",
      historyGroup: liveHistoryGroupRef.current,
    };
  }

  function updateFromPointer(event: React.PointerEvent<HTMLButtonElement>): void {
    const nextPoint = pointFromEvent(event, coordinateMode);
    const nextValue: VectorControlValue = {
      x: (nextPoint.x * 2 - 1).toFixed(2),
      y: (nextPoint.y * 2 - 1).toFixed(2),
    };
    const dragStart = dragStartRef.current;

    if (event.shiftKey && dragStart) {
      if (!axisLockRef.current) {
        const deltaX = event.clientX - dragStart.clientX;
        const deltaY = event.clientY - dragStart.clientY;

        if (Math.hypot(deltaX, deltaY) < vectorPadAxisLockThresholdPx) {
          updateVector(
            dragStart.value.x,
            dragStart.value.y,
            getLiveHistoryMeta(),
          );
          return;
        }

        axisLockRef.current = Math.abs(deltaX) >= Math.abs(deltaY) ? "x" : "y";
      }

      updateVector(
        axisLockRef.current === "x" ? nextValue.x : dragStart.value.x,
        axisLockRef.current === "y" ? nextValue.y : dragStart.value.y,
        getLiveHistoryMeta(),
      );
      return;
    }

    axisLockRef.current = null;

    updateVector(
      nextValue.x,
      nextValue.y,
      getLiveHistoryMeta(),
    );
  }

  function stopPointerDrag(): void {
    setIsPointerDragging(false);
    axisLockRef.current = null;
    dragStartRef.current = null;
    liveHistoryGroupRef.current = null;
  }

  return (
    <Field className="min-w-0 gap-2">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <ControlFieldLabel className="min-w-0">{name}</ControlFieldLabel>
        <EditableSliderValueLabel
          ariaLabel={`${name} value`}
          maxValueLabel="-1.00, -1.00"
          onCommit={commitVectorValue}
          valueLabel={valueLabel}
        />
      </div>
      <button
        aria-label={`${name} X/Y pad`}
        className={cn(
          "relative w-full cursor-default! touch-none overflow-hidden rounded-[calc(var(--radius)+2px)] bg-[linear-gradient(180deg,color-mix(in_oklab,var(--foreground)_4%,transparent),color-mix(in_oklab,var(--foreground)_1%,transparent))] select-none focus-visible:shadow-[0_0_0_3px_color-mix(in_oklab,var(--foreground)_12%,transparent)] focus-visible:outline-none",
          padShape === "square" ? "aspect-square" : "h-[142px]",
        )}
        data-vector-pad-coordinate-mode={coordinateMode}
        data-vector-pad-shape={padShape}
        data-vector-pad-variant={padVariant}
        onDoubleClick={(event) => {
          event.preventDefault();
          stopPointerDrag();
          updateVector(resetX, resetY);
        }}
        onLostPointerCapture={stopPointerDrag}
        onPointerCancel={stopPointerDrag}
        onPointerDown={(event) => {
          event.preventDefault();
          setIsPointerDragging(true);
          axisLockRef.current = null;
          dragStartRef.current = {
            clientX: event.clientX,
            clientY: event.clientY,
            value: { x: normalizedX, y: normalizedY },
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          updateFromPointer(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) {
            updateFromPointer(event);
          }
        }}
        onPointerUp={stopPointerDrag}
        style={point}
        type="button"
      >
        {vectorPadBackgroundImage ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-40"
            style={{ backgroundImage: vectorPadBackgroundImage }}
          />
        ) : null}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle,color-mix(in_oklab,var(--foreground)_8%,transparent)_1px,transparent_1px)] bg-[length:14px_14px]"
        />
        <VectorPadGuides isDragging={isPointerDragging} />
        <VectorPadHandle isDragging={isPointerDragging} />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] border border-[color:color-mix(in_oklab,var(--border)_10%,transparent)]"
        />
      </button>
    </Field>
  );
}

export function VectorControl(props: VectorControlProps): React.JSX.Element {
  if (props.xLabel === "Width" || props.yLabel === "Height") {
    return <VectorSizeField {...props} />;
  }

  return <VectorPadField {...props} />;
}
