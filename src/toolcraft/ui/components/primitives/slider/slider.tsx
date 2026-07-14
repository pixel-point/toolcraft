"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";
import type { BaseUIEvent } from "@base-ui/react/types";

import { cn } from "../../../lib/utils";
import { useSliderInteractionValueChange } from "./slider-interaction";
import { SliderControlContent } from "./slider-parts";
import { useSliderThumbReset } from "./slider-reset";
import {
  getSliderValues,
  normalizeSliderValueShape,
  snapSliderValue,
  valuesMatch,
  type SliderRuntimeValue,
  type SliderValue,
} from "./slider-value";

type SliderVariant = "continuous" | "discrete";

type SliderProps<Value extends number | readonly number[]> = SliderPrimitive.Root.Props<Value> & {
  getAriaLabel?: (index: number) => string;
  markerCount?: number;
  markerValues?: readonly number[];
  resetValue?: Value;
  showFill?: boolean;
  snapValues?: readonly number[];
  variant?: SliderVariant;
};

type SliderPointerEvent = BaseUIEvent<React.PointerEvent<HTMLDivElement>>;
type SliderFocusEvent = BaseUIEvent<React.FocusEvent<HTMLDivElement>>;
type SliderPointerEventHandler = (event: SliderPointerEvent) => void;
type SliderFocusEventHandler = (event: SliderFocusEvent) => void;

type SliderValueStateOptions<Value extends number | readonly number[]> = {
  defaultValue?: Value;
  largeStep?: number;
  max: number;
  min: number;
  onValueChange?: SliderProps<Value>["onValueChange"];
  onValueCommitted?: SliderProps<Value>["onValueCommitted"];
  snapValues?: readonly number[];
  step: number;
  value?: Value;
  variant: SliderVariant;
};

type ControlledDiscreteValueResetOptions<Value extends number | readonly number[]> = {
  discreteValue: Value | undefined;
  isDiscrete: boolean;
  lastInternalDiscreteValueRef: React.RefObject<Value | undefined>;
  max: number;
  min: number;
  setDiscreteValue: React.Dispatch<React.SetStateAction<Value | undefined>>;
  snapValues?: readonly number[];
  step: number;
  value: Value | undefined;
};

type SliderPointerDraggingOptions = {
  disabled?: boolean;
  onBlurCapture?: SliderFocusEventHandler;
  onPointerCancelCapture?: SliderPointerEventHandler;
  onPointerDownCapture?: SliderPointerEventHandler;
  onPointerUpCapture?: SliderPointerEventHandler;
};

type SliderRuntimeOptions<Value extends number | readonly number[]> = {
  defaultValue?: Value;
  disabled?: boolean;
  largeStep?: number;
  markerCount?: number;
  markerValues?: readonly number[];
  max: number;
  min: number;
  onBlurCapture?: SliderFocusEventHandler;
  onPointerCancelCapture?: SliderPointerEventHandler;
  onPointerDownCapture?: SliderPointerEventHandler;
  onPointerUpCapture?: SliderPointerEventHandler;
  onValueChange?: SliderProps<Value>["onValueChange"];
  onValueCommitted?: SliderProps<Value>["onValueCommitted"];
  resetValue?: Value;
  snapValues?: readonly number[];
  step: number;
  value?: Value;
  variant: SliderVariant;
};

function getSliderStepMarkerCount({
  max,
  min,
  step,
}: {
  max: number;
  min: number;
  step: number;
}): number | undefined {
  if (
    !Number.isFinite(step) ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    step <= 0 ||
    max <= min
  ) {
    return undefined;
  }

  const rawStepCount = (max - min) / step;
  const roundedStepCount = Math.round(rawStepCount);
  const stepCount =
    Math.abs(rawStepCount - roundedStepCount) < Number.EPSILON * 100
      ? roundedStepCount
      : Math.floor(rawStepCount) + 1;

  return Math.max(2, stepCount + 1);
}

function useControlledDiscreteValueReset<Value extends number | readonly number[]>({
  discreteValue,
  isDiscrete,
  lastInternalDiscreteValueRef,
  max,
  min,
  setDiscreteValue,
  snapValues,
  step,
  value,
}: ControlledDiscreteValueResetOptions<Value>) {
  React.useEffect(() => {
    if (!isDiscrete || value === undefined || discreteValue === undefined) {
      return;
    }

    const lastInternalValue = lastInternalDiscreteValueRef.current;
    if (lastInternalValue !== undefined) {
      if (valuesMatch(value, lastInternalValue)) {
        return;
      }

      const snappedInternalValue = snapSliderValue(lastInternalValue, min, max, step, snapValues);
      if (valuesMatch(value, snappedInternalValue)) {
        return;
      }
    }

    setDiscreteValue(undefined);
  }, [
    discreteValue,
    isDiscrete,
    lastInternalDiscreteValueRef,
    max,
    min,
    setDiscreteValue,
    snapValues,
    step,
    value,
  ]);
}

function useSliderValueState<Value extends number | readonly number[]>({
  defaultValue,
  largeStep,
  max,
  min,
  onValueChange,
  onValueCommitted,
  snapValues,
  step,
  value,
  variant,
}: SliderValueStateOptions<Value>) {
  const [discreteValue, setDiscreteValue] = React.useState<Value | undefined>(() =>
    value === undefined ? defaultValue : undefined,
  );
  const lastInternalDiscreteValueRef = React.useRef<Value | undefined>(
    value === undefined ? defaultValue : undefined,
  );
  const lastChangeDetailsRef = React.useRef<SliderPrimitive.Root.ChangeEventDetails | null>(null);
  const isDiscrete = variant === "discrete";
  const resolvedValue = isDiscrete ? (discreteValue ?? value ?? defaultValue) : value;
  const rootStep = isDiscrete ? Math.max((max - min) / 1000, 0.000001) : step;
  const rootLargeStep = isDiscrete ? (largeStep ?? step) : largeStep;
  const values = React.useMemo(
    () => getSliderValues(resolvedValue, defaultValue, min, max),
    [resolvedValue, defaultValue, min, max],
  );

  useControlledDiscreteValueReset({
    discreteValue,
    isDiscrete,
    lastInternalDiscreteValueRef,
    max,
    min,
    setDiscreteValue,
    snapValues,
    step,
    value,
  });

  const handleValueChange = React.useCallback(
    (nextValue: SliderValue<Value>, eventDetails: SliderPrimitive.Root.ChangeEventDetails) => {
      lastChangeDetailsRef.current = eventDetails;
      if (isDiscrete) {
        const normalizedNextValue = normalizeSliderValueShape(
          nextValue as SliderRuntimeValue,
          value,
          defaultValue,
          min,
        );
        lastInternalDiscreteValueRef.current = normalizedNextValue;
        setDiscreteValue(normalizedNextValue);
        onValueChange?.(
          snapSliderValue(normalizedNextValue, min, max, step, snapValues) as SliderValue<Value>,
          eventDetails,
        );
        return;
      }

      onValueChange?.(nextValue, eventDetails);
    },
    [defaultValue, isDiscrete, max, min, onValueChange, snapValues, step, value],
  );
  const handleValueCommitted = React.useCallback(
    (nextValue: SliderValue<Value>, eventDetails: SliderPrimitive.Root.CommitEventDetails) => {
      if (!isDiscrete) {
        onValueCommitted?.(nextValue, eventDetails);
        return;
      }

      const normalizedNextValue = normalizeSliderValueShape(
        nextValue as SliderRuntimeValue,
        value,
        defaultValue,
        min,
      );
      const snappedValue = snapSliderValue(normalizedNextValue, min, max, step, snapValues);
      lastInternalDiscreteValueRef.current = snappedValue;
      setDiscreteValue(snappedValue);

      if (!valuesMatch(snappedValue, normalizedNextValue) && lastChangeDetailsRef.current) {
        onValueChange?.(snappedValue as SliderValue<Value>, lastChangeDetailsRef.current);
      }

      onValueCommitted?.(snappedValue as SliderValue<Value>, eventDetails);
    },
    [defaultValue, isDiscrete, max, min, onValueChange, onValueCommitted, snapValues, step, value],
  );

  return {
    handleValueChange,
    handleValueCommitted,
    isDiscrete,
    resolvedValue,
    rootLargeStep,
    rootStep,
    values,
  };
}

function useSliderPointerDragging({
  disabled,
  onBlurCapture,
  onPointerCancelCapture,
  onPointerDownCapture,
  onPointerUpCapture,
}: SliderPointerDraggingOptions) {
  const [isPointerDragging, setIsPointerDragging] = React.useState(false);
  const stopPointerDrag = React.useCallback(() => {
    setIsPointerDragging(false);
  }, []);
  const handlePointerDownCapture = React.useCallback(
    (event: SliderPointerEvent) => {
      onPointerDownCapture?.(event);
      if (event.defaultPrevented || disabled || event.button !== 0) {
        return;
      }

      setIsPointerDragging(true);
    },
    [disabled, onPointerDownCapture],
  );
  const handlePointerUpCapture = React.useCallback(
    (event: SliderPointerEvent) => {
      onPointerUpCapture?.(event);
      stopPointerDrag();
    },
    [onPointerUpCapture, stopPointerDrag],
  );
  const handlePointerCancelCapture = React.useCallback(
    (event: SliderPointerEvent) => {
      onPointerCancelCapture?.(event);
      stopPointerDrag();
    },
    [onPointerCancelCapture, stopPointerDrag],
  );
  const handleBlurCapture = React.useCallback(
    (event: SliderFocusEvent) => {
      onBlurCapture?.(event);
      stopPointerDrag();
    },
    [onBlurCapture, stopPointerDrag],
  );

  React.useEffect(() => {
    if (!isPointerDragging) {
      return undefined;
    }

    window.addEventListener("pointerup", stopPointerDrag);
    window.addEventListener("pointercancel", stopPointerDrag);
    window.addEventListener("blur", stopPointerDrag);

    return () => {
      window.removeEventListener("pointerup", stopPointerDrag);
      window.removeEventListener("pointercancel", stopPointerDrag);
      window.removeEventListener("blur", stopPointerDrag);
    };
  }, [isPointerDragging, stopPointerDrag]);

  return {
    handleBlurCapture,
    handlePointerCancelCapture,
    handlePointerDownCapture,
    handlePointerUpCapture,
    isPointerDragging,
  };
}

function useSliderRuntime<Value extends number | readonly number[]>({
  defaultValue,
  disabled,
  largeStep,
  markerCount,
  markerValues,
  max,
  min,
  onBlurCapture,
  onPointerCancelCapture,
  onPointerDownCapture,
  onPointerUpCapture,
  onValueChange,
  onValueCommitted,
  resetValue,
  snapValues,
  step,
  value,
  variant,
}: SliderRuntimeOptions<Value>) {
  const sliderValue = useSliderValueState({
    defaultValue,
    largeStep,
    max,
    min,
    onValueChange,
    onValueCommitted,
    snapValues,
    step,
    value,
    variant,
  });
  const pointerDrag = useSliderPointerDragging({
    disabled,
    onBlurCapture,
    onPointerCancelCapture,
    onPointerDownCapture,
    onPointerUpCapture,
  });
  const resolvedMarkerCount =
    variant === "discrete"
      ? (
          markerCount ??
          getSliderStepMarkerCount({ max, min, step }) ??
          Math.max(2, Math.round(max - min) + 1)
        )
      : (markerCount ?? Math.max(2, Math.round(max - min) + 1));
  const handleValueChange = useSliderInteractionValueChange({
    disabled,
    handleValueChange: sliderValue.handleValueChange,
    max,
    min,
    values: sliderValue.values,
  });
  const handleThumbDoubleClick = useSliderThumbReset({
    defaultValue,
    disabled,
    handleValueChange,
    handleValueCommitted: sliderValue.handleValueCommitted,
    isDiscrete: sliderValue.isDiscrete,
    max,
    min,
    resetValue,
    snapValues,
    step,
    value,
    values: sliderValue.values,
  });

  return {
    handleThumbDoubleClick,
    handleValueChange,
    pointerDrag,
    resolvedMarkerCount,
    sliderValue,
    markerValues,
  };
}

function Slider<Value extends number | readonly number[]>({
  className,
  defaultValue,
  disabled,
  getAriaLabel,
  largeStep,
  markerCount,
  markerValues,
  onBlurCapture,
  onPointerCancelCapture,
  onPointerDownCapture,
  onPointerUpCapture,
  onValueChange,
  onValueCommitted,
  orientation = "horizontal",
  resetValue,
  showFill = true,
  snapValues,
  step = 1,
  thumbAlignment = "edge",
  variant = "continuous",
  value,
  min = 0,
  max = 100,
  ...props
}: SliderProps<Value>) {
  const {
    handleThumbDoubleClick,
    handleValueChange,
    pointerDrag,
    resolvedMarkerCount,
    sliderValue,
  } = useSliderRuntime({
    defaultValue,
    disabled,
    largeStep,
    markerCount,
    markerValues,
    max,
    min,
    onBlurCapture,
    onPointerCancelCapture,
    onPointerDownCapture,
    onPointerUpCapture,
    onValueChange,
    onValueCommitted,
    resetValue,
    snapValues,
    step,
    value,
    variant,
  });

  return (
    <SliderPrimitive.Root
      className={cn(
        "app-no-drag data-horizontal:w-full data-vertical:h-full",
        "[--slider-active-color:var(--foreground)] [--slider-track-color:color-mix(in_oklab,var(--muted-foreground)_38%,transparent)]",
        "data-[disabled]:[--slider-active-color:var(--foreground)] data-[disabled]:[--slider-track-color:var(--foreground)]",
        className,
      )}
      data-slot="slider"
      data-variant={variant}
      defaultValue={sliderValue.isDiscrete ? undefined : defaultValue}
      value={sliderValue.resolvedValue}
      min={min}
      max={max}
      disabled={disabled}
      largeStep={sliderValue.rootLargeStep}
      onBlurCapture={pointerDrag.handleBlurCapture}
      onPointerCancelCapture={pointerDrag.handlePointerCancelCapture}
      onPointerDownCapture={pointerDrag.handlePointerDownCapture}
      onPointerUpCapture={pointerDrag.handlePointerUpCapture}
      onValueChange={handleValueChange}
      onValueCommitted={sliderValue.handleValueCommitted}
      orientation={orientation}
      step={sliderValue.rootStep}
      thumbAlignment={thumbAlignment}
      thumbCollisionBehavior="none"
      {...props}
    >
      <SliderControlContent
        count={sliderValue.values.length}
        disabled={disabled}
        getAriaLabel={getAriaLabel}
        isDiscrete={sliderValue.isDiscrete}
        isPointerDragging={pointerDrag.isPointerDragging}
        markerCount={resolvedMarkerCount}
        markerValues={markerValues}
        max={max}
        min={min}
        onThumbDoubleClick={handleThumbDoubleClick}
        orientation={orientation}
        showFill={showFill}
      />
    </SliderPrimitive.Root>
  );
}

export { SliderInteractionProvider } from "./slider-interaction";
export type { SliderInteractionChangeDetails } from "./slider-interaction";
export { Slider };
