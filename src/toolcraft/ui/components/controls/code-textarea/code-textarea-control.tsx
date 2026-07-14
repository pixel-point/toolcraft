"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { Field, Textarea } from "../../primitives";
import {
  createControlHistoryGroupId,
  type ControlChangeMeta,
  type ControlValueChangeHandler,
} from "../control-types";

export type CodeTextareaControlProps = {
  defaultValue?: string;
  name: string;
  onValueChange?: ControlValueChangeHandler<string>;
  showLabel?: boolean;
  value: string;
};

export function CodeTextareaControl({
  name,
  onValueChange,
  showLabel = true,
  value,
}: CodeTextareaControlProps): React.JSX.Element {
  const [currentValue, setCurrentValue] = React.useState(value);
  const valueRef = React.useRef(value);
  const liveHistoryGroupRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    valueRef.current = value;
    setCurrentValue(value);
  }, [value]);

  function getLiveHistoryMeta(): ControlChangeMeta {
    liveHistoryGroupRef.current ??= createControlHistoryGroupId(`code:${name}`);

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
    onValueChange?.(nextValue, getLiveHistoryMeta());
  }

  function resetToCurrentValue(): void {
    setCurrentValue(valueRef.current);

    if (valueRef.current !== currentValue) {
      onValueChange?.(valueRef.current);
    }

    finishLiveHistoryGroup();
  }

  return (
    <Field className="min-w-0 gap-2">
      {showLabel ? (
        <div className="flex items-center">
          <ControlFieldLabel>{name}</ControlFieldLabel>
        </div>
      ) : null}
      <Textarea
        aria-label={name}
        className="max-h-[calc(12lh+12px)] min-h-[84px] overflow-y-auto font-mono"
        onBlur={finishLiveHistoryGroup}
        onChange={(event) => updateValue(event.target.value)}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            finishLiveHistoryGroup();
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            resetToCurrentValue();
            event.currentTarget.blur();
          }
        }}
        size="sm"
        value={currentValue}
      />
    </Field>
  );
}
