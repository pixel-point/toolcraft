export type SliderRuntimeValue = number | readonly number[];
export type SliderValue<Value extends number | readonly number[]> = Value extends number
  ? number
  : Value;

function snapValue(value: number, min: number, max: number, step: number): number {
  const safeStep = step > 0 ? step : 1;
  const snapped = min + Math.round((value - min) / safeStep) * safeStep;

  return Math.min(max, Math.max(min, Number(snapped.toFixed(6))));
}

function snapValueToAllowedValues(
  value: number,
  min: number,
  max: number,
  allowedValues: readonly number[] | undefined,
): number | null {
  if (!allowedValues?.length) {
    return null;
  }

  const safeValues = allowedValues
    .filter((item) => Number.isFinite(item))
    .map((item) => Math.min(max, Math.max(min, item)));

  if (!safeValues.length) {
    return null;
  }

  const nearestValue = safeValues.reduce((nearest, item) => {
    const nearestDistance = Math.abs(nearest - value);
    const itemDistance = Math.abs(item - value);

    return itemDistance < nearestDistance ? item : nearest;
  }, safeValues[0]!);

  return Number(nearestValue.toFixed(6));
}

export function getSliderValues<Value extends number | readonly number[]>(
  value: Value | undefined,
  defaultValue: Value | undefined,
  min: number,
  max: number,
): number[] {
  if (Array.isArray(value)) {
    return [...value];
  }

  if (typeof value === "number") {
    return [value];
  }

  if (Array.isArray(defaultValue)) {
    return [...defaultValue];
  }

  if (typeof defaultValue === "number") {
    return [defaultValue];
  }

  return [min, max];
}

export function normalizeSliderValueShape<Value extends number | readonly number[]>(
  nextValue: SliderRuntimeValue,
  value: Value | undefined,
  defaultValue: Value | undefined,
  min: number,
): Value {
  const referenceValue = value ?? defaultValue;

  if (Array.isArray(referenceValue)) {
    return (Array.isArray(nextValue) ? [...nextValue] : [nextValue]) as unknown as Value;
  }

  if (typeof referenceValue === "number") {
    return (Array.isArray(nextValue) ? (nextValue[0] ?? min) : nextValue) as Value;
  }

  return nextValue as Value;
}

export function snapSliderValue<Value extends number | readonly number[]>(
  nextValue: Value,
  min: number,
  max: number,
  step: number,
  snapValues?: readonly number[],
): Value {
  if (typeof nextValue === "number") {
    const allowedValue = snapValueToAllowedValues(nextValue, min, max, snapValues);
    if (allowedValue !== null) {
      return allowedValue as Value;
    }

    return snapValue(nextValue, min, max, step) as Value;
  }

  return nextValue.map((item) => (
    snapValueToAllowedValues(item, min, max, snapValues) ?? snapValue(item, min, max, step)
  )) as unknown as Value;
}

export function valuesMatch<Value extends number | readonly number[]>(left: Value, right: Value): boolean {
  if (Array.isArray(left) && Array.isArray(right)) {
    return (
      left.length === right.length && left.every((leftValue, index) => leftValue === right[index])
    );
  }

  return left === right;
}
