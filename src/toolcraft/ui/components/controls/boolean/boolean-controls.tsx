"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { Checkbox, Field, Switch } from "../../primitives";

type BooleanControlBaseProps = {
  checked: boolean;
  name: string;
  onCheckedChange?: (checked: boolean) => void;
  showLabel?: boolean;
};

export type SwitchControlProps = BooleanControlBaseProps;
export type CheckboxControlProps = BooleanControlBaseProps;

function useBooleanControlValue({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}): [boolean, (checked: boolean) => void] {
  const [currentChecked, setCurrentChecked] = React.useState(checked);

  React.useEffect(() => {
    setCurrentChecked(checked);
  }, [checked]);

  return [
    currentChecked,
    (nextChecked: boolean) => {
      setCurrentChecked(nextChecked);
      onCheckedChange?.(nextChecked);
    },
  ];
}

export function SwitchControl({
  checked,
  name,
  onCheckedChange,
  showLabel = true,
}: SwitchControlProps): React.JSX.Element {
  const [currentChecked, updateChecked] = useBooleanControlValue({ checked, onCheckedChange });

  return (
    <Field className="h-fit justify-start py-1" orientation="horizontal" style={{ gap: 8 }}>
      <Switch
        aria-label={showLabel ? undefined : name}
        checked={currentChecked}
        onCheckedChange={updateChecked}
        size="default"
      />
      {showLabel ? <ControlFieldLabel textClassName="opacity-90">{name}</ControlFieldLabel> : null}
    </Field>
  );
}

export function CheckboxControl({
  checked,
  name,
  onCheckedChange,
  showLabel = true,
}: CheckboxControlProps): React.JSX.Element {
  const [currentChecked, updateChecked] = useBooleanControlValue({ checked, onCheckedChange });

  return (
    <Field className="h-fit justify-start py-1" orientation="horizontal" style={{ gap: 8 }}>
      <Checkbox
        aria-label={showLabel ? undefined : name}
        checked={currentChecked}
        onCheckedChange={(nextChecked) => updateChecked(nextChecked === true)}
      />
      {showLabel ? <ControlFieldLabel textClassName="opacity-90">{name}</ControlFieldLabel> : null}
    </Field>
  );
}
