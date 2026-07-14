import {
  getToolcraftCanvasSizeTargetDimension,
} from "../schema/runtime-targets";
import type {
  ToolcraftControlConditionSchema,
  ToolcraftControlSchema,
  ToolcraftControlSectionSchema,
} from "../schema/types";
import type { ToolcraftState } from "../state/types";

function valuesEqual(first: unknown, second: unknown): boolean {
  if (Object.is(first, second)) {
    return true;
  }

  if (
    (typeof first !== "object" || first === null) &&
    (typeof second !== "object" || second === null)
  ) {
    return false;
  }

  try {
    return JSON.stringify(first) === JSON.stringify(second);
  } catch {
    return false;
  }
}

function valuesInclude(value: unknown, options: readonly unknown[]): boolean {
  return options.some((option) => valuesEqual(value, option));
}

function readComparableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numberValue = Number(value.trim());

    return Number.isFinite(numberValue) ? numberValue : null;
  }

  return null;
}

function compareConditionNumbers(
  value: unknown,
  expected: number | undefined,
  comparator: (value: number, expected: number) => boolean,
): boolean | null {
  if (typeof expected !== "number" || !Number.isFinite(expected)) {
    return null;
  }

  const numberValue = readComparableNumber(value);

  return numberValue === null ? false : comparator(numberValue, expected);
}

function getControlDefaultValueByTarget(
  sections: readonly ToolcraftControlSectionSchema[],
  target: string,
): unknown {
  for (const section of sections) {
    for (const control of Object.values(section.controls)) {
      if (control.target === target) {
        return control.defaultValue;
      }
    }
  }

  return undefined;
}

export function getToolcraftTargetValue(
  state: ToolcraftState,
  target: string,
): unknown {
  const canvasSizeDimension = getToolcraftCanvasSizeTargetDimension(target);

  return canvasSizeDimension
    ? state.canvas.size[canvasSizeDimension]
    : (state.values[target] ??
        getControlDefaultValueByTarget(
          state.schema.panels.controls?.sections ?? [],
          target,
        ));
}

export function toolcraftConditionMatches(
  state: ToolcraftState,
  condition: ToolcraftControlConditionSchema,
): boolean {
  const value = getToolcraftTargetValue(state, condition.target);
  const matches: boolean[] = [];

  if ("equals" in condition) {
    matches.push(valuesEqual(value, condition.equals));
  }

  if ("notEquals" in condition) {
    matches.push(!valuesEqual(value, condition.notEquals));
  }

  if (Array.isArray(condition.oneOf)) {
    matches.push(valuesInclude(value, condition.oneOf));
  }

  if (Array.isArray(condition.notOneOf)) {
    matches.push(!valuesInclude(value, condition.notOneOf));
  }

  const greaterThan = compareConditionNumbers(
    value,
    condition.greaterThan,
    (numberValue, expected) => numberValue > expected,
  );
  const greaterThanOrEqual = compareConditionNumbers(
    value,
    condition.greaterThanOrEqual,
    (numberValue, expected) => numberValue >= expected,
  );
  const lessThan = compareConditionNumbers(
    value,
    condition.lessThan,
    (numberValue, expected) => numberValue < expected,
  );
  const lessThanOrEqual = compareConditionNumbers(
    value,
    condition.lessThanOrEqual,
    (numberValue, expected) => numberValue <= expected,
  );

  for (const match of [
    greaterThan,
    greaterThanOrEqual,
    lessThan,
    lessThanOrEqual,
  ]) {
    if (match !== null) {
      matches.push(match);
    }
  }

  return matches.length > 0 && matches.every(Boolean);
}

export function isToolcraftSectionVisible(
  state: ToolcraftState,
  section: ToolcraftControlSectionSchema,
): boolean {
  return section.visibleWhen
    ? toolcraftConditionMatches(state, section.visibleWhen)
    : true;
}

export function isToolcraftControlVisible(
  state: ToolcraftState,
  control: ToolcraftControlSchema,
): boolean {
  return control.visibleWhen
    ? toolcraftConditionMatches(state, control.visibleWhen)
    : true;
}
