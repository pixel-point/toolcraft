"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { cn } from "../../../lib/utils";
import {
  Field,
  ScrollFade,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../primitives";
import type { ControlOption } from "../control-types";
import { useMeasuredElementWidth } from "../use-measured-element-width";

export type SelectControlInput = {
  name: string;
  onValueChange?: (value: string) => void;
  options: readonly ControlOption[];
  showLabel?: boolean;
  value: string;
};

type StaticSelectSize = "sm" | "default" | "lg" | "xl";

type SelectControlSingleProps = SelectControlInput & {
  inputs?: never;
  inputsPerRow?: never;
};

type SelectControlGroupProps = {
  inputs: readonly SelectControlInput[];
  inputsPerRow?: number;
  layout?: never;
};

export type SelectControlProps =
  | SelectControlSingleProps
  | SelectControlGroupProps;

const WIDE_SELECT_OPTION_LABEL_LENGTH = 32;

function hasWideSelectContent(options: readonly ControlOption[]): boolean {
  return options.some((option) => option.label.length >= WIDE_SELECT_OPTION_LABEL_LENGTH);
}

function isSelectControlGroupProps(
  props: SelectControlProps,
): props is SelectControlGroupProps {
  return Array.isArray((props as SelectControlGroupProps).inputs);
}

function getInputsPerRow(inputsPerRow: number | undefined): number {
  if (typeof inputsPerRow !== "number" || !Number.isFinite(inputsPerRow)) {
    return 1;
  }

  return Math.min(2, Math.max(1, Math.floor(inputsPerRow)));
}

export function StaticSelect({
  ariaLabel,
  disabled,
  onValueChange,
  options,
  popupMaxWidth,
  scrollFadeValue = true,
  size = "default",
  triggerClassName,
  value,
}: {
  ariaLabel?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  options: readonly ControlOption[];
  popupMaxWidth?: number;
  scrollFadeValue?: boolean;
  size?: StaticSelectSize;
  triggerClassName?: string;
  value: string;
}): React.JSX.Element {
  const selected = options.find((option) => option.value === value) ?? options[0];
  const shouldConstrainPopup = hasWideSelectContent(options);

  return (
    <Select
      items={options.map((option) => ({ label: option.label, value: option.value }))}
      onValueChange={(nextValue) => onValueChange?.(String(nextValue))}
      value={selected?.value}
    >
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn("w-full justify-between", triggerClassName)}
        disabled={disabled}
        size={size}
        title={selected?.label}
      >
        <SelectValue>
          {() =>
            scrollFadeValue ? (
              <ScrollFade
                className="no-scrollbar min-w-0"
                containerClassName="min-w-0 flex-1"
                preset="compact"
                side="right"
                watch={[selected?.label]}
              >
                <span className="block min-w-max whitespace-nowrap pr-2" title={selected?.label}>
                  {selected?.label ?? ""}
                </span>
              </ScrollFade>
            ) : (
              <span className="block min-w-0 flex-1 whitespace-nowrap pr-2" title={selected?.label}>
                {selected?.label ?? ""}
              </span>
            )
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="end"
        alignItemWithTrigger={false}
        style={shouldConstrainPopup && popupMaxWidth ? { maxWidth: popupMaxWidth } : undefined}
      >
        <SelectGroup>
          {options.map((item) => (
            <SelectItem key={item.value} title={item.label} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function SelectControlField({
  name,
  onValueChange,
  options,
  showLabel = true,
  value,
}: SelectControlInput): React.JSX.Element {
  const fieldRef = React.useRef<HTMLDivElement>(null);
  const popupMaxWidth = useMeasuredElementWidth(fieldRef);
  const [currentValue, setCurrentValue] = React.useState(value);

  React.useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  function updateValue(nextValue: string): void {
    setCurrentValue(nextValue);
    onValueChange?.(nextValue);
  }

  return (
    <Field
      className={cn("h-fit min-w-0", showLabel && "gap-2")}
      orientation="vertical"
      ref={fieldRef}
    >
      {showLabel ? <ControlFieldLabel>{name}</ControlFieldLabel> : null}
      <div className="min-w-0 w-full">
        <StaticSelect
          ariaLabel={showLabel ? undefined : name}
          onValueChange={updateValue}
          options={options}
          popupMaxWidth={popupMaxWidth}
          value={currentValue}
        />
      </div>
    </Field>
  );
}

export function SelectControl(
  props: SelectControlProps,
): React.JSX.Element {
  if (isSelectControlGroupProps(props)) {
    const inputsPerRow = getInputsPerRow(props.inputsPerRow);

    return (
      <div
        className="grid min-w-0 gap-x-2.5 gap-y-3"
        data-slot="select-control-grid"
        style={{
          gridTemplateColumns: `repeat(${inputsPerRow}, minmax(0, 1fr))`,
        }}
      >
        {props.inputs.map((input, index) => (
          <SelectControlField
            key={`${input.name}-${index}`}
            {...input}
          />
        ))}
      </div>
    );
  }

  return <SelectControlField {...props} />;
}
