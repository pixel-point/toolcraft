"use client";

import type { ReactElement, ReactNode } from "react";
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  CheckIcon,
  CopySimpleIcon,
  DownloadSimpleIcon,
  EraserIcon,
  ExportIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  MagicWandIcon,
  ShuffleIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";

import { Button, Field } from "../../primitives";
import { ControlFieldLabel } from "../../control-layout";
import { cn } from "../../../lib/utils";

export type ActionControlIconName =
  | "check"
  | "copy"
  | "download"
  | "download-simple"
  | "eraser"
  | "export"
  | "flip-horizontal"
  | "flip-vertical"
  | "rotate-cw"
  | "rotate-ccw"
  | "shuffle"
  | "upload-simple"
  | "wand-sparkles";

const actionIconComponents = {
  check: CheckIcon,
  copy: CopySimpleIcon,
  download: DownloadSimpleIcon,
  "download-simple": DownloadSimpleIcon,
  eraser: EraserIcon,
  export: ExportIcon,
  "flip-horizontal": FlipHorizontalIcon,
  "flip-vertical": FlipVerticalIcon,
  "rotate-cw": ArrowClockwiseIcon,
  "rotate-ccw": ArrowCounterClockwiseIcon,
  shuffle: ShuffleIcon,
  "upload-simple": UploadSimpleIcon,
  "wand-sparkles": MagicWandIcon,
} as const;

export type ActionControlObjectOption = {
  ariaLabel?: string;
  children?: ReactNode;
  label?: string;
  value: string;
  icon?: ActionControlIconName | ReactElement;
};

export type ActionControlOption = string | ActionControlObjectOption;

function getActionValue(action: ActionControlOption): string {
  return typeof action === "string" ? action : action.value;
}

function getActionLabel(action: ActionControlOption): string {
  return typeof action === "string"
    ? action
    : (action.ariaLabel ?? action.label ?? action.value);
}

function getActionContent(action: ActionControlOption): ReactNode {
  if (typeof action === "string") {
    return action;
  }

  return action.children ?? action.label ?? action.value;
}

function getActionIcon(action: ActionControlOption): ReactNode {
  if (typeof action === "string" || action.icon == null) {
    return null;
  }

  if (typeof action.icon !== "string") {
    return action.icon;
  }

  const Icon = actionIconComponents[action.icon];

  return <Icon data-icon="inline-start" />;
}

function getActionAriaLabel(
  action: ActionControlOption,
  content: ReactNode,
): string | undefined {
  if (typeof action !== "string" && action.ariaLabel) {
    return action.ariaLabel;
  }

  if (typeof content === "string") {
    return undefined;
  }

  return typeof action === "string" ? action : (action.label ?? action.value);
}

export type ActionsControlProps = {
  actions: readonly ActionControlOption[];
  buttonColumns?: 1 | 2 | 3 | 4;
  name: string;
  onAction?: (value: string) => void;
  showActionLabels?: boolean;
  showLabel?: boolean;
};

export function ActionsControl({
  actions,
  buttonColumns,
  name,
  onAction,
  showActionLabels = true,
  showLabel = true,
}: ActionsControlProps): React.JSX.Element {
  const hasSingleAction = actions.length === 1;
  const columnClass =
    buttonColumns === 4
      ? "w-full grid-cols-4"
      : buttonColumns === 3
        ? "w-full grid-cols-3"
      : buttonColumns === 2
        ? "w-full grid-cols-2"
        : buttonColumns === 1
          ? "w-full grid-cols-1"
          : hasSingleAction
            ? "w-1/2 grid-cols-1"
            : "w-full grid-cols-2";

  return (
    <Field
      aria-label={showLabel ? undefined : name}
      className="h-fit min-w-0 gap-2"
      data-slot="actions-control"
      orientation="vertical"
    >
      {showLabel ? (
        <ControlFieldLabel className="min-w-0" textClassName="min-w-0 truncate">
          {name}
        </ControlFieldLabel>
      ) : null}
      <div
        className={cn(
          "grid max-w-full gap-1.5",
          columnClass,
        )}
        data-actions-count={actions.length}
        data-actions-columns={buttonColumns ?? (hasSingleAction ? 1 : 2)}
        data-slot="actions-control-buttons"
      >
        {actions.map((action) => {
          const actionContent = getActionContent(action);
          const actionLabel = getActionLabel(action);
          const actionValue = getActionValue(action);

          return (
            <Button
              aria-label={
                showActionLabels ? getActionAriaLabel(action, actionContent) : actionLabel
              }
              key={actionValue}
              onClick={() => onAction?.(actionValue)}
              className="w-full"
              size="sm"
              type="button"
              variant="outline"
            >
              {getActionIcon(action)}
              {showActionLabels ? actionContent : null}
            </Button>
          );
        })}
      </div>
    </Field>
  );
}
