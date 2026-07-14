"use client";

import * as React from "react";

import {
  evaluateToolcraftTimelineValue,
  evaluateToolcraftTimelineValues,
} from "../state/keyframe-evaluation";
import { ToolcraftContext } from "./toolcraft-root";

export function useToolcraft() {
  const context = React.useContext(ToolcraftContext);

  if (!context) {
    throw new Error("useToolcraft must be used inside ToolcraftRoot");
  }

  return context;
}

export function useToolcraftValue(target: string): unknown {
  return useToolcraft().state.values[target];
}

export function useToolcraftEvaluatedValues(timeSeconds?: number): Record<string, unknown> {
  const { state } = useToolcraft();

  return React.useMemo(
    () => evaluateToolcraftTimelineValues(state, timeSeconds),
    [state, timeSeconds],
  );
}

export function useToolcraftEvaluatedValue(target: string, timeSeconds?: number): unknown {
  const { state } = useToolcraft();

  return React.useMemo(
    () => evaluateToolcraftTimelineValue(state, target, timeSeconds),
    [state, target, timeSeconds],
  );
}
