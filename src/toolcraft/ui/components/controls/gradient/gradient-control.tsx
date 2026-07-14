"use client";

import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from "react";

import { Field } from "../../primitives";
import { selectedItemBorderClassName } from "../../primitives/selection-state";
import {
  createControlHistoryGroupId,
  type ControlChangeMeta,
  type ControlValueChangeHandler,
  type GradientStop,
  type GradientType,
} from "../control-types";
import { cn } from "../../../lib/utils";
import {
  addGradientStop,
  formatStopPosition,
  getGradientAngle,
  getGradientBackground,
  getGradientType,
  getIndexedStops,
  getPositionFromTrack,
  getStopCssColor,
  isButtonTarget,
  maxGradientStops,
  minGradientStops,
  parseStopPosition,
  removeGradientStop,
  updateStopAt,
  type IndexedGradientStop,
} from "./gradient-control-utils";
import { GradientStopsList } from "./gradient-stop-list";
import { GradientToolbar } from "./gradient-toolbar";

const playControlDragEndSound = () => undefined;
const playControlDragStartSound = () => undefined;
const playGradientAngleSound = (_previousAngle: number, _nextAngle: number) =>
  undefined;
const playGradientStopUpdateSound = (
  _previousStop: GradientStop | undefined,
  _nextStop: Partial<GradientStop>,
) => undefined;

function useGradientStopSelectionSound(
  _selectedIndex: number | null,
  setSelectedIndex: Dispatch<SetStateAction<number | null>>,
) {
  return (nextIndex: number) => setSelectedIndex(nextIndex);
}

export type GradientControlProps = {
  angle?: number;
  gradientType?: GradientType;
  name?: string;
  onValueChange?: ControlValueChangeHandler<{
    angle: number;
    gradientType: GradientType;
    stops: readonly GradientStop[];
  }>;
  stops: readonly GradientStop[];
};

type GradientStopsControllerOptions = {
  angle: number;
  gradientType: GradientType;
  name: string;
  onValueChange?: ControlValueChangeHandler<{
    angle: number;
    gradientType: GradientType;
    stops: readonly GradientStop[];
  }>;
  stops: readonly GradientStop[];
  trackRef: RefObject<HTMLDivElement | null>;
};

type GradientStopActionsOptions = GradientStopsControllerOptions & {
  activeStop: GradientStop | null;
  setSelectedIndex: Dispatch<SetStateAction<number | null>>;
};

function useGradientStopActions({
  activeStop,
  angle,
  gradientType,
  onValueChange,
  setSelectedIndex,
  stops,
}: GradientStopActionsOptions) {
  function updateGradient(
    nextGradient: {
      angle?: number;
      gradientType?: GradientType;
      stops?: readonly GradientStop[];
    },
    meta?: ControlChangeMeta,
  ): void {
    const nextValue = {
      angle: nextGradient.angle ?? angle,
      gradientType: nextGradient.gradientType ?? gradientType,
      stops: nextGradient.stops ?? stops,
    };

    if (meta) {
      onValueChange?.(nextValue, meta);
      return;
    }

    onValueChange?.(nextValue);
  }

  function updateStop(
    index: number,
    nextStop: Partial<GradientStop>,
    meta?: ControlChangeMeta,
  ): void {
    playGradientStopUpdateSound(stops[index], nextStop);
    updateGradient({ stops: updateStopAt(stops, index, nextStop) }, meta);
  }

  function addStop(position = "50%"): void {
    if (stops.length >= maxGradientStops) {
      return;
    }

    const { nextStop, nextStops } = addGradientStop(
      stops,
      activeStop,
      position,
    );

    updateGradient({ stops: nextStops });
    setSelectedIndex(nextStops.indexOf(nextStop));
  }

  function removeStop(index: number): void {
    if (stops.length <= minGradientStops) {
      return;
    }

    const nextStops = removeGradientStop(stops, index);

    updateGradient({ stops: nextStops });
    setSelectedIndex(
      nextStops.length > 0 ? Math.min(index, nextStops.length - 1) : null,
    );
  }

  return {
    addStop,
    removeStop,
    updateAngle: (nextAngle: number, meta?: ControlChangeMeta) => {
      playGradientAngleSound(angle, nextAngle);
      updateGradient({ angle: nextAngle }, meta);
    },
    updateGradientType: (nextType: GradientType) =>
      updateGradient({ gradientType: nextType }),
    updateStop,
  };
}

type GradientStopActions = ReturnType<typeof useGradientStopActions>;

function getGradientDragHistoryMeta(
  name: string,
  dragHistoryGroupRef: MutableRefObject<string | null>,
): ControlChangeMeta {
  dragHistoryGroupRef.current ??= createControlHistoryGroupId(`gradient:${name}`);

  return {
    history: "merge",
    historyGroup: dragHistoryGroupRef.current,
  };
}

function useGradientStopDragWindowEvents({
  actions,
  dragHistoryGroupRef,
  draggingIndex,
  name,
  setDraggingIndex,
  trackRef,
}: {
  actions: GradientStopActions;
  dragHistoryGroupRef: MutableRefObject<string | null>;
  draggingIndex: number | null;
  name: string;
  setDraggingIndex: Dispatch<SetStateAction<number | null>>;
  trackRef: RefObject<HTMLDivElement | null>;
}): void {
  useEffect(() => {
    const activeDraggingIndex = draggingIndex;

    if (activeDraggingIndex === null) {
      return;
    }

    const stopIndex = activeDraggingIndex;

    function handlePointerMove(event: PointerEvent): void {
      actions.updateStop(
        stopIndex,
        {
          position: getPositionFromTrack(trackRef.current, event.clientX),
        },
        getGradientDragHistoryMeta(name, dragHistoryGroupRef),
      );
    }

    function stopDragging(): void {
      playControlDragEndSound();
      setDraggingIndex(null);
      dragHistoryGroupRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  });
}

function useGradientStopsController(options: GradientStopsControllerOptions) {
  const { stops, trackRef } = options;
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const dragHistoryGroupRef = useRef<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const activeStop =
    selectedIndex === null ? null : (stops[selectedIndex] ?? null);
  const actions = useGradientStopActions({
    ...options,
    activeStop,
    setSelectedIndex,
  });
  const selectStop = useGradientStopSelectionSound(
    selectedIndex,
    setSelectedIndex,
  );

  useGradientStopDragWindowEvents({
    actions,
    dragHistoryGroupRef,
    draggingIndex,
    name: options.name,
    setDraggingIndex,
    trackRef,
  });

  function handleTrackPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ): void {
    if (
      draggingIndex !== null ||
      stops.length >= maxGradientStops ||
      isButtonTarget(event.target)
    ) {
      return;
    }

    actions.addStop(getPositionFromTrack(trackRef.current, event.clientX));
  }

  function handleTrackPointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ): void {
    if (draggingIndex === null) {
      return;
    }

    actions.updateStop(
      draggingIndex,
      {
        position: getPositionFromTrack(trackRef.current, event.clientX),
      },
      getGradientDragHistoryMeta(options.name, dragHistoryGroupRef),
    );
  }

  function handleStartDrag(
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    playControlDragStartSound();
    dragHistoryGroupRef.current = createControlHistoryGroupId(`gradient:${options.name}`);
    setDraggingIndex(index);
    selectStop(index);
  }

  function handleStopDoubleClick(
    index: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ): void {
    event.stopPropagation();
    actions.removeStop(index);
  }

  function handleStopKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ): void {
    if (event.key !== "Delete" && event.key !== "Backspace") {
      return;
    }

    if (selectedIndex !== index) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    actions.removeStop(index);
  }

  return {
    ...actions,
    draggingIndex,
    handleStopDoubleClick,
    handleStopKeyDown,
    handleStartDrag,
    handleTrackPointerDown,
    handleTrackPointerMove,
    indexedStops: getIndexedStops(stops),
    selectStop,
    selectedIndex,
    setDraggingIndex: (nextIndex: number | null) => {
      setDraggingIndex(nextIndex);
      if (nextIndex === null) {
        dragHistoryGroupRef.current = null;
      }
    },
    setSelectedIndex,
  };
}

const gradientStopPinEdgeInset = 2;

function getGradientStopPinLeftPosition(position: number): string {
  const stopPosition = formatStopPosition(position);
  const pixelOffset = gradientStopPinEdgeInset * (1 - position * 2);

  if (Math.abs(pixelOffset) < 0.01) {
    return stopPosition;
  }

  const offsetOperator = pixelOffset > 0 ? "+" : "-";
  const offsetValue = Number(Math.abs(pixelOffset).toFixed(2));

  return `calc(${stopPosition} ${offsetOperator} ${offsetValue}px)`;
}

function GradientStopPin({
  isDragging,
  isSelected,
  onDoubleClick,
  onKeyDown,
  onPointerDown,
  stop,
}: {
  isDragging: boolean;
  isSelected: boolean;
  onDoubleClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
  stop: IndexedGradientStop;
}): React.JSX.Element {
  const stopPosition = parseStopPosition(stop.position);

  return (
    <button
      aria-label={`Gradient stop ${stop.originalIndex + 1}`}
      aria-pressed={isSelected}
      className={cn(
        "absolute top-1 z-10 flex touch-none -translate-x-1/2 cursor-grab flex-col items-center rounded-lg outline-none",
        "active:cursor-grabbing",
        isDragging && "cursor-grabbing",
      )}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      style={{ left: getGradientStopPinLeftPosition(stopPosition) }}
      type="button"
    >
      <span
        className={cn(
          "flex size-[22px] items-center justify-center rounded-md bg-[color:var(--muted)] shadow-[0_4px_7px_color-mix(in_oklab,var(--background)_30%,transparent)] transition-colors",
          isSelected && "bg-[color:var(--accent)]",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-3.5 max-h-3.5 min-h-3.5 w-3.5 max-w-3.5 min-w-3.5 flex-none rounded-[4px] border border-[color:color-mix(in_oklab,var(--border)_10%,transparent)]",
            isSelected && selectedItemBorderClassName,
          )}
          style={{ backgroundColor: getStopCssColor(stop) }}
        />
      </span>
      <svg
        aria-hidden="true"
        className={cn(
          "h-1 w-2.5 text-[color:var(--muted)] transition-colors",
          isSelected && "text-[color:var(--accent)]",
        )}
        fill="none"
        viewBox="0 0 10 4"
      >
        <path d="M0 0H10L5.72 3.42Q5 4.08 4.28 3.42L0 0Z" fill="currentColor" />
      </svg>
    </button>
  );
}

function GradientStopsTrack({
  gradient,
  onDragEnd,
  onPointerDown,
  onPointerMove,
  onRemoveStop,
  onRemoveStopByKey,
  onStartDrag,
  selectedIndex,
  stops,
  trackRef,
  draggingIndex,
}: {
  gradient: string;
  draggingIndex: number | null;
  onDragEnd: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onRemoveStop: (
    index: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  onRemoveStopByKey: (
    index: number,
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) => void;
  onStartDrag: (
    index: number,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  selectedIndex: number | null;
  stops: readonly IndexedGradientStop[];
  trackRef: React.RefObject<HTMLDivElement | null>;
}): React.JSX.Element {
  return (
    <div
      aria-label="Gradient stops track"
      className="app-no-drag relative mt-1 h-12 w-full touch-none cursor-crosshair"
      onPointerCancel={onDragEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onDragEnd}
      ref={trackRef}
    >
      <div className="absolute inset-x-0 top-4 h-6 overflow-hidden rounded-md border border-[color:color-mix(in_oklab,var(--border)_10%,transparent)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[inherit]"
          style={{ background: gradient }}
        />
      </div>
      {stops.map((stop) => (
        <GradientStopPin
          isDragging={draggingIndex === stop.originalIndex}
          isSelected={selectedIndex === stop.originalIndex}
          key={stop.originalIndex}
          onDoubleClick={(event) => onRemoveStop(stop.originalIndex, event)}
          onKeyDown={(event) => onRemoveStopByKey(stop.originalIndex, event)}
          onPointerDown={(event) => onStartDrag(stop.originalIndex, event)}
          stop={stop}
        />
      ))}
    </div>
  );
}

export function GradientControl({
  angle: angleProp,
  gradientType: gradientTypeProp,
  name = "Gradient",
  onValueChange,
  stops,
}: GradientControlProps): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [uncontrolledAngle, setUncontrolledAngle] = useState(() =>
    getGradientAngle(angleProp),
  );
  const [uncontrolledGradientType, setUncontrolledGradientType] = useState(() =>
    getGradientType(gradientTypeProp),
  );
  const angle =
    typeof angleProp === "undefined"
      ? uncontrolledAngle
      : getGradientAngle(angleProp);
  const gradientType =
    typeof gradientTypeProp === "undefined"
      ? uncontrolledGradientType
      : getGradientType(gradientTypeProp);

  useEffect(() => {
    if (typeof angleProp !== "undefined") {
      setUncontrolledAngle(getGradientAngle(angleProp));
    }
  }, [angleProp]);

  useEffect(() => {
    if (typeof gradientTypeProp !== "undefined") {
      setUncontrolledGradientType(getGradientType(gradientTypeProp));
    }
  }, [gradientTypeProp]);

  function handleValueChange(
    value: {
      angle: number;
      gradientType: GradientType;
      stops: readonly GradientStop[];
    },
    meta?: ControlChangeMeta,
  ): void {
    if (typeof angleProp === "undefined") {
      setUncontrolledAngle(value.angle);
    }

    if (typeof gradientTypeProp === "undefined") {
      setUncontrolledGradientType(value.gradientType);
    }

    if (meta) {
      onValueChange?.(value, meta);
      return;
    }

    onValueChange?.(value);
  }

  const controller = useGradientStopsController({
    angle,
    gradientType,
    name,
    onValueChange: handleValueChange,
    stops,
    trackRef,
  });

  return (
    <Field className="min-w-0 !gap-[3px]">
      <div
        className="flex min-w-0 flex-col gap-3"
        data-slot="gradient-stops-control-main"
      >
        <div className="flex h-fit min-w-0 items-center justify-start">
          <GradientToolbar
            angle={angle}
            name={name}
            onAngleChange={controller.updateAngle}
            onTypeChange={controller.updateGradientType}
            type={gradientType}
          />
        </div>
        <div className="min-w-0">
          <GradientStopsTrack
            draggingIndex={controller.draggingIndex}
            gradient={getGradientBackground(gradientType, stops, angle)}
            onDragEnd={() => controller.setDraggingIndex(null)}
            onPointerDown={controller.handleTrackPointerDown}
            onPointerMove={controller.handleTrackPointerMove}
            onRemoveStop={controller.handleStopDoubleClick}
            onRemoveStopByKey={controller.handleStopKeyDown}
            onStartDrag={controller.handleStartDrag}
            selectedIndex={controller.selectedIndex}
            stops={controller.indexedStops}
            trackRef={trackRef}
          />
        </div>
      </div>
      <GradientStopsList
        onAdd={controller.addStop}
        onColorChange={(index, nextColor) =>
          controller.updateStop(index, { color: nextColor })
        }
        onOpacityChange={(index, nextOpacity) =>
          controller.updateStop(index, { opacity: nextOpacity })
        }
        onPositionChange={(index, nextPosition) =>
          controller.updateStop(index, { position: nextPosition })
        }
        onRemove={controller.removeStop}
        onSelect={controller.selectStop}
        selectedIndex={controller.selectedIndex}
        stops={controller.indexedStops}
      />
    </Field>
  );
}
