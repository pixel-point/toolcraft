"use client";

import * as React from "react";
import type { Slider as SliderPrimitive } from "@base-ui/react/slider";

import {
  normalizeSliderValueShape,
  snapSliderValue,
  valuesMatch,
  type SliderRuntimeValue,
  type SliderValue,
} from "./slider-value";

export type SliderThumbDoubleClickHandler = (
  event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
  index: number,
) => void;

type UseSliderThumbResetOptions<Value extends number | readonly number[]> = {
  defaultValue?: Value;
  disabled?: boolean;
  handleValueChange: SliderPrimitive.Root.Props<Value>["onValueChange"];
  handleValueCommitted: (
    value: SliderValue<Value>,
    eventDetails: SliderPrimitive.Root.CommitEventDetails,
  ) => void;
  isDiscrete: boolean;
  max: number;
  min: number;
  resetValue?: Value;
  snapValues?: readonly number[];
  step: number;
  value?: Value;
  values: readonly number[];
};

function createSliderResetChangeEventDetails(
  event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
  activeThumbIndex: number,
): SliderPrimitive.Root.ChangeEventDetails {
  return {
    activeThumbIndex,
    allowPropagation: () => undefined,
    cancel: () => undefined,
    event: event.nativeEvent,
    isCanceled: false,
    isPropagationAllowed: false,
    reason: "none",
    trigger: event.currentTarget,
  };
}

function createSliderResetCommitEventDetails(
  event: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>,
): SliderPrimitive.Root.CommitEventDetails {
  return {
    event: event.nativeEvent,
    reason: "none",
  };
}

function getThumbResetValue<Value extends number | readonly number[]>(
  currentValue: Value,
  resetValue: Value,
  index: number,
): Value {
  if (!Array.isArray(currentValue) || !Array.isArray(resetValue)) {
    return resetValue;
  }

  const nextValue = [...currentValue];
  const nextThumbValue = resetValue[index] ?? currentValue[index];
  if (nextThumbValue === undefined) {
    return currentValue;
  }

  nextValue[index] = nextThumbValue;

  return nextValue as unknown as Value;
}

export function useSliderThumbReset<Value extends number | readonly number[]>({
  defaultValue,
  disabled,
  handleValueChange,
  handleValueCommitted,
  isDiscrete,
  max,
  min,
  resetValue,
  snapValues,
  step,
  value,
  values,
}: UseSliderThumbResetOptions<Value>): SliderThumbDoubleClickHandler {
  const initialResetValueRef = React.useRef<Value | undefined>(resetValue ?? defaultValue ?? value);

  return React.useCallback(
    (event, index) => {
      if (disabled) {
        return;
      }

      const resetTarget = resetValue ?? defaultValue ?? initialResetValueRef.current;
      if (resetTarget === undefined) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const normalizedResetValue = normalizeSliderValueShape(
        resetTarget as SliderRuntimeValue,
        value,
        defaultValue,
        min,
      );
      const currentValue = normalizeSliderValueShape(values, value, defaultValue, min);
      const resetThumbValue = getThumbResetValue(currentValue, normalizedResetValue, index);
      const nextValue = isDiscrete
        ? snapSliderValue(resetThumbValue, min, max, step, snapValues)
        : resetThumbValue;

      if (valuesMatch(currentValue, nextValue)) {
        return;
      }

      handleValueChange?.(
        nextValue as SliderValue<Value>,
        createSliderResetChangeEventDetails(event, index),
      );
      handleValueCommitted(
        nextValue as SliderValue<Value>,
        createSliderResetCommitEventDetails(event),
      );
    },
    [
      defaultValue,
      disabled,
      handleValueChange,
      handleValueCommitted,
      isDiscrete,
      max,
      min,
      resetValue,
      snapValues,
      step,
      value,
      values,
    ],
  );
}
