"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { Field, Input } from "../../primitives";
import {
  createControlHistoryGroupId,
  type ControlChangeMeta,
  type ControlValueChangeHandler,
} from "../control-types";

export type TextInputControlInput = {
  commitOnBlur?: boolean;
  defaultValue?: string;
  name: string;
  onValueChange?: ControlValueChangeHandler<string>;
  showLabel?: boolean;
  value: string;
};

type TextInputControlSingleProps = TextInputControlInput & {
  inputs?: never;
  inputsPerRow?: never;
};

type TextInputControlGroupProps = {
  inputs: readonly TextInputControlInput[];
  inputsPerRow?: number;
};

export type TextInputControlProps =
  | TextInputControlSingleProps
  | TextInputControlGroupProps;

function isTextInputControlGroupProps(
  props: TextInputControlProps,
): props is TextInputControlGroupProps {
  return Array.isArray((props as TextInputControlGroupProps).inputs);
}

function getInputsPerRow(inputsPerRow: number | undefined): number {
  if (typeof inputsPerRow !== "number" || !Number.isFinite(inputsPerRow)) {
    return 1;
  }

  return Math.max(1, Math.floor(inputsPerRow));
}

function TextInputControlField({
  commitOnBlur = false,
  defaultValue,
  name,
  onValueChange,
  showLabel = true,
  value,
}: TextInputControlInput): React.JSX.Element {
  const [currentValue, setCurrentValue] = React.useState(value);
  const valueRef = React.useRef(value);
  const defaultValueRef = React.useRef(defaultValue ?? value);
  const liveHistoryGroupRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    valueRef.current = value;
    setCurrentValue(value);
  }, [value]);

  React.useEffect(() => {
    defaultValueRef.current = defaultValue ?? value;
  }, [defaultValue, value]);

  function getLiveHistoryMeta(): ControlChangeMeta {
    liveHistoryGroupRef.current ??= createControlHistoryGroupId(`text:${name}`);

    return {
      history: "merge",
      historyGroup: liveHistoryGroupRef.current,
    };
  }

  function finishLiveHistoryGroup(): void {
    liveHistoryGroupRef.current = null;
  }

  function updateValue(nextValue: string): void {
    setCurrentValue(nextValue);

    if (!commitOnBlur) {
      onValueChange?.(nextValue, getLiveHistoryMeta());
    }
  }

  function commitValue(nextValue = currentValue): void {
    const committedValue =
      nextValue.trim() === "" ? defaultValueRef.current : nextValue;

    setCurrentValue(committedValue);

    if (committedValue !== valueRef.current) {
      onValueChange?.(committedValue);
    }
  }

  return (
    <Field className="min-w-0 gap-2">
      {showLabel ? <ControlFieldLabel>{name}</ControlFieldLabel> : null}
      <Input
        aria-label={showLabel ? undefined : name}
        className="font-mono"
        onBlur={commitOnBlur ? () => commitValue() : finishLiveHistoryGroup}
        onChange={(event) => updateValue(event.target.value)}
        onKeyDown={
          commitOnBlur
            ? (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitValue(event.currentTarget.value);
                  event.currentTarget.blur();
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  setCurrentValue(valueRef.current);
                  event.currentTarget.blur();
                }
              }
            : undefined
        }
        size="default"
        value={currentValue}
      />
    </Field>
  );
}

export function TextInputControl(
  props: TextInputControlProps,
): React.JSX.Element {
  if (isTextInputControlGroupProps(props)) {
    const inputsPerRow = getInputsPerRow(props.inputsPerRow);

    return (
      <div
        className="grid min-w-0 gap-2"
        data-slot="text-input-control-grid"
        style={{
          gridTemplateColumns: `repeat(${inputsPerRow}, minmax(0, 1fr))`,
        }}
      >
        {props.inputs.map((input, index) => (
          <TextInputControlField
            key={`${input.name}-${index}`}
            {...input}
          />
        ))}
      </div>
    );
  }

  return <TextInputControlField {...props} />;
}
