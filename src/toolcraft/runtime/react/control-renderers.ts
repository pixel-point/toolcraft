"use client";

import type * as React from "react";
import type { ControlChangeMeta } from "@/toolcraft/ui";

import type { ToolcraftControlSchema } from "../schema/types";
import type { ToolcraftCommand, ToolcraftState } from "../state/types";

export type ToolcraftCustomControlSetValue<Value = unknown> = (
  value: Value,
  meta?: ControlChangeMeta,
) => void;

export type ToolcraftCustomControlRendererProps<Value = unknown> = {
  control: ToolcraftControlSchema;
  controlId: string;
  dispatch: React.Dispatch<ToolcraftCommand>;
  keyframeAction: React.ReactNode;
  name: string;
  setValue: ToolcraftCustomControlSetValue<Value>;
  state: ToolcraftState;
  value: Value;
};

export type ToolcraftCustomControlRenderer<Value = unknown> = (
  props: ToolcraftCustomControlRendererProps<Value>,
) => React.ReactNode;

export type ToolcraftControlRendererMap = Readonly<
  Record<string, ToolcraftCustomControlRenderer>
>;
