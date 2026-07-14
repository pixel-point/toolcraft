"use client";

import * as React from "react";
import type { Slider as SliderPrimitive } from "@base-ui/react/slider";

type SliderRuntimeValue = number | readonly number[];
type SliderValue<Value extends number | readonly number[]> = Value extends number ? number : Value;

export type SliderInteractionChangeDetails = {
  max: number;
  min: number;
  nextValues: readonly number[];
  previousValues: readonly number[];
};

type SliderInteractionContextValue = {
  onValueChange?: (details: SliderInteractionChangeDetails) => void;
};

type SliderInteractionValueChangeOptions<Value extends number | readonly number[]> = {
  disabled?: boolean;
  handleValueChange: (
    nextValue: SliderValue<Value>,
    eventDetails: SliderPrimitive.Root.ChangeEventDetails,
  ) => void;
  max: number;
  min: number;
  values: readonly number[];
};

const SliderInteractionContext = React.createContext<SliderInteractionContextValue | null>(null);

function getRuntimeSliderValues(nextValue: SliderRuntimeValue): number[] {
  return typeof nextValue === "number" ? [nextValue] : [...nextValue];
}

function runtimeValuesMatch(left: readonly number[], right: readonly number[]): boolean {
  return (
    left.length === right.length && left.every((leftValue, index) => leftValue === right[index])
  );
}

export function SliderInteractionProvider({
  children,
  onValueChange,
}: {
  children: React.ReactNode;
  onValueChange?: (details: SliderInteractionChangeDetails) => void;
}): React.JSX.Element {
  const contextValue = React.useMemo(() => ({ onValueChange }), [onValueChange]);

  return (
    <SliderInteractionContext.Provider value={contextValue}>
      {children}
    </SliderInteractionContext.Provider>
  );
}

export function useSliderInteractionValueChange<Value extends number | readonly number[]>({
  disabled,
  handleValueChange,
  max,
  min,
  values,
}: SliderInteractionValueChangeOptions<Value>): SliderPrimitive.Root.Props<Value>["onValueChange"] {
  const sliderInteraction = React.useContext(SliderInteractionContext);
  const latestRuntimeValuesRef = React.useRef(values);

  React.useEffect(() => {
    latestRuntimeValuesRef.current = values;
  }, [values]);

  return React.useCallback(
    (
      nextValue: SliderValue<Value>,
      eventDetails: SliderPrimitive.Root.ChangeEventDetails,
    ) => {
      handleValueChange(nextValue, eventDetails);

      if (disabled) {
        return;
      }

      const previousValues = latestRuntimeValuesRef.current;
      const nextValues = getRuntimeSliderValues(nextValue as SliderRuntimeValue);

      if (runtimeValuesMatch(previousValues, nextValues)) {
        return;
      }

      sliderInteraction?.onValueChange?.({ max, min, nextValues, previousValues });
      latestRuntimeValuesRef.current = nextValues;
    },
    [disabled, handleValueChange, max, min, sliderInteraction],
  );
}
