"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";

import {
  createControlHistoryGroupId,
  type ControlChangeMeta,
  type ControlValueChangeHandler,
  type CurveChannel,
  type CurvePoint,
} from "../control-types";
import { ControlFieldLabel } from "../../control-layout";
import { ChannelTabs, CurveGraph, singleCurveChannels } from "./curve-graph";
import {
  type CurveInterpolation,
  constrainCurvePoint,
  defaultCurveInterpolation,
  getCurvePointAtX,
  insertCurvePoint,
  isPointNearCurve,
  normalizeCurvePoints,
  pointFromSvgEvent,
  removeCurvePoint,
  replaceCurvePoint,
} from "./curve-geometry";

const playControlAddSound = () => undefined;
const playControlDeleteSound = () => undefined;
const playControlDragEndSound = () => undefined;
const playControlDragStartSound = () => undefined;
const playControlSelectSound = () => undefined;

export type CurvesControlValue = {
  activeChannel: CurveChannel;
  points: Record<CurveChannel, readonly CurvePoint[]>;
  selectedPointIndex?: number;
};

export type CurvesControlVariant = "rgb" | "single";

export type CurvesControlProps = {
  activeChannel?: CurveChannel;
  interpolation?: CurveInterpolation;
  name?: string;
  onValueChange?: ControlValueChangeHandler<CurvesControlValue>;
  points?: Record<CurveChannel, readonly CurvePoint[]>;
  selectedPointIndex?: number;
  variant?: CurvesControlVariant;
};

type CurveEditorProps = {
  activeChannel: CurveChannel;
  interpolation: CurveInterpolation;
  onValueChange?: CurvesControlProps["onValueChange"];
  points: Record<CurveChannel, readonly CurvePoint[]>;
  selectedPointIndex?: number;
};

type DraggingPoint = {
  channel: CurveChannel;
  hasMoved: boolean;
  index: number;
};

function useCurveEditor({
  activeChannel,
  interpolation,
  onValueChange,
  points,
  selectedPointIndex,
}: CurveEditorProps) {
  const graphRef = useRef<SVGSVGElement>(null);
  const dragHistoryGroupRef = useRef<string | null>(null);
  const [draggingPoint, setDraggingPoint] = useState<DraggingPoint | null>(
    null,
  );
  const activePoints = normalizeCurvePoints(points[activeChannel]);

  function updateCurve(
    nextPoints: readonly CurvePoint[],
    nextSelectedIndex: number | null,
    meta?: ControlChangeMeta,
  ): void {
    onValueChange?.(
      {
        activeChannel,
        points: { ...points, [activeChannel]: normalizeCurvePoints(nextPoints) },
        selectedPointIndex: nextSelectedIndex ?? undefined,
      },
      meta,
    );
  }

  function pointFromEvent(
    event: Pick<PointerEvent, "clientX" | "clientY">,
  ): CurvePoint {
    return pointFromSvgEvent(event, graphRef.current);
  }

  function movePoint(
    index: number,
    point: CurvePoint,
    meta?: ControlChangeMeta,
  ): void {
    updateCurve(
      replaceCurvePoint(
        activePoints,
        index,
        constrainCurvePoint(activePoints, index, point),
      ),
      null,
      meta,
    );
  }

  function addPoint(event: React.PointerEvent<SVGRectElement>): void {
    event.preventDefault();
    const point = pointFromEvent(event);

    if (!isPointNearCurve(activePoints, point, undefined, interpolation)) {
      if (selectedPointIndex !== undefined) {
        updateCurve(activePoints, null);
      }
      return;
    }

    const nextCurve = insertCurvePoint(
      activePoints,
      getCurvePointAtX(activePoints, point.x, interpolation),
    );
    updateCurve(nextCurve.points, null);
    setDraggingPoint({
      channel: activeChannel,
      hasMoved: true,
      index: nextCurve.index,
    });
    playControlAddSound();
  }

  function removePoint(index: number): void {
    if (index > 0 && index < activePoints.length - 1) {
      updateCurve(removeCurvePoint(activePoints, index), null);
      playControlDeleteSound();
    }
  }

  useCurveDragging({
    activeChannel,
    dragHistoryGroupRef,
    draggingPoint,
    movePoint,
    pointFromEvent,
    setDraggingPoint,
    stopDragging: () => {
      dragHistoryGroupRef.current = null;
      setDraggingPoint(null);
    },
  });
  useClearCurveSelectionOnOutsidePointerDown({
    activePoints,
    graphRef,
    selectedPointIndex: selectedPointIndex ?? null,
    updateCurve,
  });

  function startDraggingPoint(index: number): void {
    dragHistoryGroupRef.current = createControlHistoryGroupId(
      `curves:${activeChannel}`,
    );
    setDraggingPoint({
      channel: activeChannel,
      hasMoved: false,
      index,
    });
  }

  return {
    activePoints,
    draggingPoint,
    addPoint,
    draggingPointIndex:
      draggingPoint?.channel === activeChannel ? draggingPoint.index : null,
    graphRef,
    movePoint,
    removePoint,
    selectedPointIndex: selectedPointIndex ?? null,
    startDraggingPoint,
    selectPoint: (index: number, meta?: ControlChangeMeta) =>
      updateCurve(activePoints, index, meta),
    updateCurve,
  };
}

const defaultActiveChannel = "RGB" satisfies CurveChannel;
const defaultName = "Curves";
const defaultCurvePoints = {
  B: [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 1 },
  ],
  G: [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 1 },
  ],
  R: [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 1 },
  ],
  RGB: [
    { x: 0, y: 0 },
    { x: 0.5, y: 0.5 },
    { x: 1, y: 1 },
  ],
} satisfies Record<CurveChannel, readonly CurvePoint[]>;
const defaultSelectedPointIndex = 1;

function withDefaultCurvePoints(
  points: Record<CurveChannel, readonly CurvePoint[]> | undefined,
): Record<CurveChannel, readonly CurvePoint[]> {
  return { ...defaultCurvePoints, ...points };
}

function useClearCurveSelectionOnOutsidePointerDown({
  activePoints,
  graphRef,
  selectedPointIndex,
  updateCurve,
}: {
  activePoints: readonly CurvePoint[];
  graphRef: React.RefObject<SVGSVGElement | null>;
  selectedPointIndex: number | null;
  updateCurve: (
    nextPoints: readonly CurvePoint[],
    nextSelectedIndex: number | null,
  ) => void;
}): void {
  useEffect(() => {
    if (selectedPointIndex === null) {
      return;
    }

    function handlePointerDown(event: PointerEvent): void {
      if (!graphRef.current?.contains(event.target as Node)) {
        updateCurve(activePoints, null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [activePoints, graphRef, selectedPointIndex, updateCurve]);
}

function useCurveDragging({
  activeChannel,
  dragHistoryGroupRef,
  draggingPoint,
  movePoint,
  pointFromEvent,
  setDraggingPoint,
  stopDragging,
}: {
  activeChannel: CurveChannel;
  dragHistoryGroupRef: React.MutableRefObject<string | null>;
  draggingPoint: DraggingPoint | null;
  movePoint: (
    index: number,
    point: CurvePoint,
    meta?: ControlChangeMeta,
  ) => void;
  pointFromEvent: (
    event: Pick<PointerEvent, "clientX" | "clientY">,
  ) => CurvePoint;
  setDraggingPoint: React.Dispatch<React.SetStateAction<DraggingPoint | null>>;
  stopDragging: () => void;
}): void {
  useEffect(() => {
    const currentDrag = draggingPoint;
    if (!currentDrag) {
      return;
    }

    const activeDrag: DraggingPoint = currentDrag;

    function handlePointerMove(event: PointerEvent): void {
      if (activeDrag.channel === activeChannel) {
        dragHistoryGroupRef.current ??= createControlHistoryGroupId(
          `curves:${activeChannel}`,
        );
        movePoint(activeDrag.index, pointFromEvent(event), {
          history: "merge",
          historyGroup: dragHistoryGroupRef.current,
        });
        setDraggingPoint((currentPoint) =>
          currentPoint === activeDrag
            ? { ...currentPoint, hasMoved: true }
            : currentPoint,
        );
      }
    }

    function handleStopDragging(): void {
      playControlDragEndSound();
      stopDragging();
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handleStopDragging);
    window.addEventListener("pointercancel", handleStopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handleStopDragging);
      window.removeEventListener("pointercancel", handleStopDragging);
    };
  });
}

export function CurvesControl(props: CurvesControlProps): React.JSX.Element {
  const {
    activeChannel: controlledActiveChannel,
    interpolation: controlledInterpolation,
    name = defaultName,
    onValueChange,
    points: controlledPoints,
    selectedPointIndex: controlledSelectedPointIndex,
    variant = "rgb",
  } = props;
  const singleCurve = variant === "single";
  const interpolation =
    controlledInterpolation ?? (singleCurve ? "monotone" : defaultCurveInterpolation);
  const isActiveChannelControlled = "activeChannel" in props;
  const isPointsControlled = controlledPoints !== undefined;
  const isSelectedPointIndexControlled = "selectedPointIndex" in props;
  const [uncontrolledActiveChannel, setUncontrolledActiveChannel] =
    useState<CurveChannel>(defaultActiveChannel);
  const [uncontrolledPoints, setUncontrolledPoints] =
    useState<Record<CurveChannel, readonly CurvePoint[]>>(defaultCurvePoints);
  const [uncontrolledSelectedPointIndex, setUncontrolledSelectedPointIndex] =
    useState<number | undefined>(defaultSelectedPointIndex);
  const activeChannel = singleCurve
    ? defaultActiveChannel
    : controlledActiveChannel ?? uncontrolledActiveChannel;
  const points = withDefaultCurvePoints(controlledPoints ?? uncontrolledPoints);
  const selectedPointIndex = isSelectedPointIndexControlled
    ? controlledSelectedPointIndex
    : uncontrolledSelectedPointIndex;

  function handleValueChange(
    value: CurvesControlValue,
    meta?: ControlChangeMeta,
  ): void {
    if (!isActiveChannelControlled) {
      setUncontrolledActiveChannel(value.activeChannel);
    }
    if (!isPointsControlled) {
      setUncontrolledPoints(value.points);
    }
    if (!isSelectedPointIndexControlled) {
      setUncontrolledSelectedPointIndex(value.selectedPointIndex);
    }
    onValueChange?.(value, meta);
  }

  const editor = useCurveEditor({
    activeChannel,
    interpolation,
    onValueChange: handleValueChange,
    points,
    selectedPointIndex,
  });

  return (
    <div className="flex min-w-0 flex-col gap-3" aria-label={name}>
      {singleCurve ? (
        <ControlFieldLabel>{name}</ControlFieldLabel>
      ) : (
        <div className="flex min-w-0 flex-col gap-2">
          <ChannelTabs
            name={name}
            onValueChange={(nextChannel) => {
              handleValueChange({ activeChannel: nextChannel, points });
              playControlSelectSound();
            }}
            value={activeChannel}
          />
        </div>
      )}
      <CurveGraph
        activeChannel={activeChannel}
        activePoints={editor.activePoints}
        ariaLabel={singleCurve ? `${name} curve editor` : "Color curves editor"}
        channels={singleCurve ? singleCurveChannels : undefined}
        draggingPointIndex={editor.draggingPointIndex}
        graphRef={editor.graphRef}
        interpolation={interpolation}
        onBackgroundPointerDown={editor.addPoint}
        onPointDoubleClick={(index, event) => {
          event.stopPropagation();
          editor.removePoint(index);
        }}
        onPointKeyDown={(index, event) => {
          handlePointKeyDown(index, event, editor);
        }}
        onPointPointerDown={(index, event) => {
          event.stopPropagation();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          editor.selectPoint(index, { history: "skip" });
          playControlDragStartSound();
          editor.startDraggingPoint(index);
        }}
        onPointPointerUp={() => undefined}
        points={points}
        selectedPointIndex={editor.selectedPointIndex}
      />
    </div>
  );
}

function handlePointKeyDown(
  index: number,
  event: React.KeyboardEvent<HTMLButtonElement>,
  editor: ReturnType<typeof useCurveEditor>,
): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    editor.updateCurve(editor.activePoints, index, { history: "skip" });
    playControlSelectSound();
    return;
  }

  if (
    (event.key === "Backspace" || event.key === "Delete") &&
    editor.selectedPointIndex === index
  ) {
    event.preventDefault();
    editor.removePoint(index);
  }
}
