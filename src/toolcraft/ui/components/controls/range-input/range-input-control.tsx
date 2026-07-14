"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { Field, Input } from "../../primitives";
import { type ControlValueChangeHandler } from "../control-types";
import { cn } from "../../../lib/utils";

export type RangeInputControlProps = {
  defaultValue?: { end: string; start: string };
  end: string;
  name: string;
  onValueChange?: ControlValueChangeHandler<{ start: string; end: string }>;
  showLabel?: boolean;
  start: string;
};

const RANGE_FULL_WIDTH_VALUE_LENGTH = 7;

function shouldUseFullWidthRangeInputs(start: string, end: string): boolean {
  return Math.max(start.length, end.length) > RANGE_FULL_WIDTH_VALUE_LENGTH;
}

function RangeInputs({
  className,
  end,
  name,
  onCancel,
  onCommit,
  onDraftChange,
  start,
}: RangeInputControlProps & {
  className?: string;
  onCancel: () => void;
  onCommit: () => void;
  onDraftChange: (nextValue: { start: string; end: string }) => void;
}): React.JSX.Element {
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter") {
      event.preventDefault();
      onCommit();
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      event.currentTarget.blur();
    }
  }

  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1.5",
        className,
      )}
    >
      <Input
        aria-label={`${name} start`}
        className="font-mono"
        onBlur={onCommit}
        onChange={(event) =>
          onDraftChange({ end, start: event.target.value })
        }
        onKeyDown={handleKeyDown}
        size="default"
        value={start}
      />
      <Input
        aria-label={`${name} end`}
        className="font-mono"
        onBlur={onCommit}
        onChange={(event) =>
          onDraftChange({ end: event.target.value, start })
        }
        onKeyDown={handleKeyDown}
        size="default"
        value={end}
      />
    </div>
  );
}

export function RangeInputControl({
  defaultValue,
  end,
  name,
  onValueChange,
  showLabel = true,
  start,
}: RangeInputControlProps): React.JSX.Element {
  const [currentValue, setCurrentValue] = React.useState({ end, start });
  const committedValueRef = React.useRef({ end, start });
  const defaultValueRef = React.useRef(defaultValue ?? { end, start });

  React.useEffect(() => {
    committedValueRef.current = { end, start };
    setCurrentValue({ end, start });
  }, [end, start]);

  React.useEffect(() => {
    defaultValueRef.current = defaultValue ?? { end, start };
  }, [defaultValue, end, start]);

  function updateDraft(nextValue: { start: string; end: string }): void {
    setCurrentValue(nextValue);
  }

  function getCommittedValue(): { start: string; end: string } {
    const nextValue = {
      end:
        currentValue.end.trim() === ""
          ? defaultValueRef.current.end
          : currentValue.end,
      start:
        currentValue.start.trim() === ""
          ? defaultValueRef.current.start
          : currentValue.start,
    };

    return nextValue;
  }

  function commitValue(): void {
    const nextValue = getCommittedValue();

    setCurrentValue(nextValue);

    if (
      nextValue.start !== committedValueRef.current.start ||
      nextValue.end !== committedValueRef.current.end
    ) {
      onValueChange?.(nextValue);
    }
  }

  function cancelDraft(): void {
    setCurrentValue(committedValueRef.current);
  }

  if (shouldUseFullWidthRangeInputs(start, end)) {
    return (
      <Field className="h-fit min-w-0 gap-2">
        {showLabel ? <ControlFieldLabel>{name}</ControlFieldLabel> : null}
        <RangeInputs
          className="w-full"
          end={currentValue.end}
          name={name}
          onCancel={cancelDraft}
          onCommit={commitValue}
          onDraftChange={updateDraft}
          start={currentValue.start}
        />
      </Field>
    );
  }

  return (
    <Field
      className={cn(
        "h-fit min-w-0",
        showLabel ? "items-center justify-between gap-3" : undefined,
      )}
      orientation={showLabel ? "horizontal" : "vertical"}
    >
      {showLabel ? <ControlFieldLabel>{name}</ControlFieldLabel> : null}
      <RangeInputs
        className={showLabel ? "w-1/2 shrink-0" : "w-full"}
        end={currentValue.end}
        name={name}
        onCancel={cancelDraft}
        onCommit={commitValue}
        onDraftChange={updateDraft}
        start={currentValue.start}
      />
    </Field>
  );
}
