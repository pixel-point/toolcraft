"use client";

import * as React from "react";

import {
  EditableSliderValueLabel,
  Field,
  Slider,
} from "../../primitives";
import { ControlFieldLabel } from "../../control-layout";
import {
  formatRangeSliderValue,
  parseRangeSliderDraft,
} from "./range-slider-value";
import { applySliderValueLabelUnit } from "../slider/slider-value";
import {
  createControlHistoryGroupId,
  type ControlChangeMeta,
  type ControlValueChangeHandler,
} from "../control-types";

export type RangeSliderControlProps = {
  baseValue?: readonly [number, number] | readonly number[];
  disabled?: boolean;
  markerCount?: number;
  max?: number;
  min?: number;
  name: string;
  onValueChange?: ControlValueChangeHandler<readonly number[]>;
  step?: number;
  unit?: string;
  value: readonly [number, number] | readonly number[];
  valueLabel?: string;
  variant?: "continuous" | "discrete";
};

export function RangeSliderControl({
  baseValue,
  disabled = false,
  markerCount,
  max = 100,
  min = 0,
  name,
  onValueChange,
  step = 0.1,
  unit,
  value,
  valueLabel,
  variant = "continuous",
}: RangeSliderControlProps): React.JSX.Element {
  const [rangeValue, setRangeValue] = React.useState<readonly number[]>(value);
  const liveHistoryGroupRef = React.useRef<string | null>(null);
  const resolvedValueLabel = valueLabel
    ? applySliderValueLabelUnit(valueLabel, unit)
    : formatRangeSliderValue(rangeValue, unit);

  React.useEffect(() => {
    setRangeValue(value);
  }, [value]);

  function getLiveHistoryMeta(): ControlChangeMeta {
    liveHistoryGroupRef.current ??= createControlHistoryGroupId(`range-slider:${name}`);

    return {
      history: "merge",
      historyGroup: liveHistoryGroupRef.current,
    };
  }

  function finishLiveHistoryGroup(): void {
    liveHistoryGroupRef.current = null;
  }

  function updateValue(
    nextValue: number | readonly number[],
    meta?: ControlChangeMeta,
  ): void {
    const resolvedValue =
      typeof nextValue === "number" ? [nextValue, nextValue] : [...nextValue];

    setRangeValue(resolvedValue);
    onValueChange?.(resolvedValue, meta);
  }

  function commitValueLabel(nextValueLabel: string): void {
    const nextValue = parseRangeSliderDraft(nextValueLabel, { max, min, step });

    if (!nextValue) {
      return;
    }

    setRangeValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <Field className="min-w-0 gap-1!" data-disabled={disabled}>
      <div className="flex w-full min-w-0 items-center justify-between gap-3">
        <ControlFieldLabel>{name}</ControlFieldLabel>
        <EditableSliderValueLabel
          ariaLabel={`${name} value`}
          disabled={disabled}
          onCommit={commitValueLabel}
          valueLabel={resolvedValueLabel}
        />
      </div>
      <Slider
        className="w-full"
        markerCount={markerCount}
        max={max}
        min={min}
        disabled={disabled}
        onValueChange={(nextValue) => updateValue(nextValue, getLiveHistoryMeta())}
        onValueCommitted={finishLiveHistoryGroup}
        resetValue={baseValue ?? value}
        step={step}
        value={rangeValue}
        variant={variant}
      />
    </Field>
  );
}
