"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "../../../lib/utils";
import type { SliderThumbDoubleClickHandler } from "./slider-reset";

type SliderOrientation = "horizontal" | "vertical";

type SliderControlContentProps = {
  count: number;
  disabled?: boolean;
  getAriaLabel?: (index: number) => string;
  isDiscrete: boolean;
  isPointerDragging: boolean;
  markerCount: number;
  markerValues?: readonly number[];
  max: number;
  min: number;
  onThumbDoubleClick?: SliderThumbDoubleClickHandler;
  orientation: SliderOrientation;
  showFill: boolean;
};

type SliderThumbPointerSnapshot = {
  clientX: number;
  clientY: number;
  index: number;
  pointerType: string;
  timeStamp: number;
};

const sliderThumbDoubleClickDelayMs = 340;
const sliderThumbDoubleClickDistancePx = 6;

function useActiveSliderThumbDrag(disabled: boolean): {
  activeDragIndex: number | null;
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>, index: number) => void;
} {
  const [activeDragIndex, setActiveDragIndex] = React.useState<number | null>(null);
  const clearActiveDragIndex = React.useCallback(() => {
    setActiveDragIndex(null);
  }, []);
  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, index: number) => {
      if (event.defaultPrevented || disabled || event.button !== 0) {
        return;
      }

      setActiveDragIndex(index);
    },
    [disabled],
  );

  React.useEffect(() => {
    if (activeDragIndex === null) {
      return undefined;
    }

    window.addEventListener("pointerup", clearActiveDragIndex);
    window.addEventListener("pointercancel", clearActiveDragIndex);
    window.addEventListener("blur", clearActiveDragIndex);

    return () => {
      window.removeEventListener("pointerup", clearActiveDragIndex);
      window.removeEventListener("pointercancel", clearActiveDragIndex);
      window.removeEventListener("blur", clearActiveDragIndex);
    };
  }, [activeDragIndex, clearActiveDragIndex]);

  return { activeDragIndex, handlePointerDown };
}

function SliderMarkers({
  disabled = false,
  isPointerDragging,
  markerCount,
  markerValues,
  max,
  min,
  orientation,
}: {
  disabled?: boolean;
  isPointerDragging: boolean;
  markerCount: number;
  markerValues?: readonly number[];
  max: number;
  min: number;
  orientation: SliderOrientation;
}): React.JSX.Element | null {
  const markerOffsets = markerValues?.length
    ? markerValues
        .filter((value) => value > min && value < max)
        .map((value) => ((value - min) / (max - min)) * 100)
    : Array.from({ length: markerCount }, (_, index) => {
        if (index === 0 || index === markerCount - 1) {
          return null;
        }

        return (index / (markerCount - 1)) * 100;
      }).filter((offset): offset is number => offset !== null);

  if (markerOffsets.length === 0) {
    return null;
  }

  return (
    <>
      {markerOffsets.map((offsetValue, index) => {
        const offset = `${offsetValue}%`;
        return (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute rounded-full bg-[color:var(--slider-active-color)] opacity-0 transition-opacity duration-150",
              disabled
                ? null
                : isPointerDragging
                  ? "opacity-100"
                  : "group-hover/slider-control:opacity-100",
              orientation === "vertical"
                ? "left-1/2 h-px w-1.5 -translate-x-1/2 translate-y-1/2"
                : "top-1/2 h-1.5 w-px -translate-x-1/2 -translate-y-1/2",
            )}
            data-slot="slider-marker"
            key={`${offset}-${index}`}
            style={orientation === "vertical" ? { bottom: offset } : { left: offset }}
          />
        );
      })}
    </>
  );
}

function SliderThumbs({
  count,
  disabled = false,
  getAriaLabel,
  onDoubleClick,
}: {
  count: number;
  disabled?: boolean;
  getAriaLabel?: (index: number) => string;
  onDoubleClick?: SliderThumbDoubleClickHandler;
}): React.JSX.Element {
  const { activeDragIndex, handlePointerDown } = useActiveSliderThumbDrag(disabled);
  const lastPointerDownRef = React.useRef<SliderThumbPointerSnapshot | null>(null);
  const suppressNextDoubleClickRef = React.useRef(false);

  const shouldResetFromPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, index: number): boolean => {
      if (event.detail >= 2) {
        return true;
      }

      const previousPointerDown = lastPointerDownRef.current;
      if (!previousPointerDown || previousPointerDown.index !== index) {
        return false;
      }

      const deltaTime = event.timeStamp - previousPointerDown.timeStamp;
      const deltaX = event.clientX - previousPointerDown.clientX;
      const deltaY = event.clientY - previousPointerDown.clientY;
      const distance = Math.hypot(deltaX, deltaY);

      return (
        previousPointerDown.pointerType === event.pointerType &&
        deltaTime >= 0 &&
        deltaTime <= sliderThumbDoubleClickDelayMs &&
        distance <= sliderThumbDoubleClickDistancePx
      );
    },
    [],
  );
  const handlePointerDownCapture = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, index: number) => {
      if (!onDoubleClick || disabled || event.button !== 0) {
        return;
      }

      if (shouldResetFromPointerDown(event, index)) {
        lastPointerDownRef.current = null;
        suppressNextDoubleClickRef.current = true;
        onDoubleClick(event, index);
        return;
      }

      lastPointerDownRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        index,
        pointerType: event.pointerType,
        timeStamp: event.timeStamp,
      };
    },
    [disabled, onDoubleClick, shouldResetFromPointerDown],
  );
  const handleDoubleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>, index: number) => {
      if (suppressNextDoubleClickRef.current) {
        suppressNextDoubleClickRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      onDoubleClick?.(event, index);
    },
    [onDoubleClick],
  );

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          getAriaLabel={getAriaLabel}
          index={index}
          key={index}
          onDoubleClick={(event) => handleDoubleClick(event, index)}
          onPointerDownCapture={(event) => handlePointerDownCapture(event, index)}
          onPointerDown={(event) => handlePointerDown(event, index)}
          className={cn(
            "group/slider-thumb relative block size-[9px] shrink-0 cursor-pointer rounded-[2px] select-none before:absolute before:top-1/2 before:left-1/2 before:block before:size-[18px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-[''] transition-[inset-inline-start,bottom] duration-200 ease-out data-[dragging]:transition-none disabled:pointer-events-none motion-reduce:transition-none",
          )}
        >
          <span
            aria-hidden
            data-active-dragging={activeDragIndex === index ? "true" : undefined}
            data-slot="slider-dot"
            className={cn(
              "pointer-events-none absolute inset-0 block rounded-[2px] bg-[color:var(--slider-active-color)] transition-[scale,background-color] duration-200 ease-out motion-reduce:transition-none",
              disabled
                ? null
                : "group-hover/slider-thumb:scale-[1.4] data-[active-dragging=true]:scale-[1.4]",
            )}
          />
        </SliderPrimitive.Thumb>
      ))}
    </>
  );
}

function SliderFill({ show }: { show: boolean }): React.JSX.Element | null {
  if (!show) {
    return null;
  }

  return (
    <SliderPrimitive.Indicator
      data-slot="slider-range"
      className={cn(
        "bg-[color:var(--slider-active-color)] transition-[width,height,inset-inline-start,bottom] duration-200 ease-out select-none data-[dragging]:transition-none data-horizontal:h-full data-vertical:w-full motion-reduce:transition-none",
      )}
    />
  );
}

function SliderControlContent({
  count,
  disabled,
  getAriaLabel,
  isDiscrete,
  isPointerDragging,
  markerCount,
  markerValues,
  max,
  min,
  onThumbDoubleClick,
  orientation,
  showFill,
}: SliderControlContentProps): React.JSX.Element {
  return (
    <SliderPrimitive.Control className="group/slider-control relative flex touch-none items-center select-none data-[disabled]:opacity-[0.15] data-horizontal:h-[18px] data-horizontal:w-full data-vertical:h-full data-vertical:min-h-40 data-vertical:w-[18px] data-vertical:flex-col">
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="group/slider-track relative grow overflow-visible rounded-full bg-[color:var(--slider-track-color)] select-none data-horizontal:h-px data-horizontal:w-full data-vertical:h-full data-vertical:w-px"
      >
        <SliderFill show={showFill} />
        {isDiscrete ? (
          <SliderMarkers
            disabled={disabled}
            isPointerDragging={isPointerDragging}
            markerCount={markerCount}
            markerValues={markerValues}
            max={max}
            min={min}
            orientation={orientation}
          />
        ) : null}
      </SliderPrimitive.Track>
      <SliderThumbs
        count={count}
        disabled={disabled}
        getAriaLabel={getAriaLabel}
        onDoubleClick={onThumbDoubleClick}
      />
    </SliderPrimitive.Control>
  );
}

export { SliderControlContent, SliderFill, SliderMarkers, SliderThumbs };
