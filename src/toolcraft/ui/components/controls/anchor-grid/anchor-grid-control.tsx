"use client";

import * as React from "react";

import { Button, Field } from "../../primitives";
import { ControlFieldLabel } from "../../control-layout";
import {
  hoverImportantSelectedItemBorderClassName,
  hoverImportantSelectedItemSurfaceClassName,
  importantSelectedItemBorderClassName,
  importantSelectedItemSurfaceClassName,
} from "../../primitives/selection-state";
import { cn } from "../../../lib/utils";

export type AnchorGridValue =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "center"
  | "center-left"
  | "center-right"
  | "top-center"
  | "top-left"
  | "top-right";

export type AnchorGridControlProps = {
  name: string;
  onValueChange?: (value: AnchorGridValue) => void;
  value?: AnchorGridValue;
};

const anchorOptions = [
  "top-left",
  "top-center",
  "top-right",
  "center-left",
  "center",
  "center-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
] as const satisfies readonly AnchorGridValue[];

const anchorLabels = {
  "bottom-center": "Bottom Center",
  "bottom-left": "Bottom Left",
  "bottom-right": "Bottom Right",
  center: "Center",
  "center-left": "Center Left",
  "center-right": "Center Right",
  "top-center": "Top Center",
  "top-left": "Top Left",
  "top-right": "Top Right",
} as const satisfies Record<AnchorGridValue, string>;

export function AnchorGridControl({
  name,
  onValueChange,
  value = "center",
}: AnchorGridControlProps): React.JSX.Element {
  const [currentValue, setCurrentValue] = React.useState(value);

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  function updateValue(nextValue: AnchorGridValue): void {
    setCurrentValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <Field className="min-w-0 !gap-2">
      <ControlFieldLabel>{name}</ControlFieldLabel>
      <div className="grid w-full grid-cols-3 gap-1.5">
        {anchorOptions.map((option) => (
          <Button
            aria-label={anchorLabels[option]}
            aria-pressed={currentValue === option}
            className={cn(
              "h-9 w-full rounded-lg !bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)] px-0 transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out hover:!bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)] active:scale-[0.98] active:!bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)]",
              currentValue === option && [
                importantSelectedItemBorderClassName,
                importantSelectedItemSurfaceClassName,
                hoverImportantSelectedItemBorderClassName,
                hoverImportantSelectedItemSurfaceClassName,
              ],
            )}
            key={option}
            onClick={() => updateValue(option)}
            type="button"
            variant="outline"
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none inline-flex size-2 rounded-full bg-[color:color-mix(in_oklab,var(--foreground)_18%,transparent)] transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out",
                currentValue === option &&
                  "scale-110 bg-[color:var(--foreground)]",
              )}
            />
          </Button>
        ))}
      </div>
    </Field>
  );
}
