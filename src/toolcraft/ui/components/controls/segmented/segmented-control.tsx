"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { Field, ToggleGroup, ToggleGroupItem } from "../../primitives";
import type { ControlOption } from "../control-types";

export type SegmentedControlVariant = "default" | "dots";

export type SegmentedControlOption = ControlOption & {
  indicatorColor?: string;
};

export type SegmentedControlProps = {
  ariaLabel?: string;
  name: string;
  onValueChange?: (value: string) => void;
  options: readonly SegmentedControlOption[];
  value?: string;
  variant?: SegmentedControlVariant;
};

export function SegmentedControl({
  ariaLabel,
  name,
  onValueChange,
  options,
  value,
  variant = "default",
}: SegmentedControlProps): React.JSX.Element {
  const [currentValue, setCurrentValue] = React.useState(
    () => value ?? options[0]?.value ?? "",
  );
  const selectedValue = value ?? currentValue;

  React.useEffect(() => {
    if (typeof value !== "undefined") {
      setCurrentValue(value);
      return;
    }

    if (!options.some((option) => option.value === currentValue)) {
      setCurrentValue(options[0]?.value ?? "");
    }
  }, [currentValue, options, value]);

  function updateValue(nextValue: string): void {
    setCurrentValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <Field className="min-w-0 gap-2">
      <ControlFieldLabel>{name}</ControlFieldLabel>
      <ToggleGroup
        aria-label={ariaLabel ?? name}
        className="w-full"
        onValueChange={(nextValue) => {
          const [selectedValue] = nextValue;

          if (selectedValue) {
            updateValue(selectedValue);
          }
        }}
        size="default"
        value={selectedValue ? [selectedValue] : []}
        variant="outline"
      >
        {options.map((option) => (
          <ToggleGroupItem
            aria-label={option.label}
            className={
              variant === "dots" ? "min-w-0 flex-1 gap-[7px]" : "min-w-0 flex-1"
            }
            key={option.value}
            value={option.value}
          >
            {variant === "dots" ? (
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: option.indicatorColor ?? "currentColor",
                }}
              />
            ) : null}
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  );
}
