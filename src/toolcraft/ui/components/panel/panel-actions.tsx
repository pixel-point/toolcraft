"use client";

import type { ReactElement, ReactNode } from "react";
import * as React from "react";
import {
  ArrowCounterClockwiseIcon,
  CheckIcon,
  CopySimpleIcon,
  DownloadSimpleIcon,
  EraserIcon,
  ExportIcon,
  MagicWandIcon,
  ShuffleIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";

import { Button } from "../primitives";
import { cn } from "../../lib/utils";

export type PanelActionIconName =
  | "check"
  | "copy"
  | "download"
  | "download-simple"
  | "eraser"
  | "export"
  | "rotate-ccw"
  | "shuffle"
  | "upload-simple"
  | "wand-sparkles";

const panelActionIconComponents = {
  check: CheckIcon,
  copy: CopySimpleIcon,
  download: DownloadSimpleIcon,
  "download-simple": DownloadSimpleIcon,
  eraser: EraserIcon,
  export: ExportIcon,
  "rotate-ccw": ArrowCounterClockwiseIcon,
  shuffle: ShuffleIcon,
  "upload-simple": UploadSimpleIcon,
  "wand-sparkles": MagicWandIcon,
} as const;

type PanelActionVariant = NonNullable<
  React.ComponentProps<typeof Button>["variant"]
>;

export type PanelActionObjectOption = {
  children?: ReactNode;
  className?: string;
  icon?: PanelActionIconName | ReactElement;
  name: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  value?: string;
  variant: PanelActionVariant;
};

export type PanelActionOption = PanelActionObjectOption;

export type PanelActionsProps = {
  actions?: readonly PanelActionOption[];
  children?: ReactNode;
  className?: string;
  columns?: 1 | 2;
  onAction?: (value: string) => void;
};

function getPanelActionValue(action: PanelActionOption): string {
  return action.value ?? action.name;
}

function getPanelActionContent(action: PanelActionOption): ReactNode {
  return action.children ?? action.name;
}

function getPanelActionIcon(action: PanelActionOption): ReactNode {
  if (action.icon == null) {
    return null;
  }

  if (typeof action.icon !== "string") {
    return action.icon;
  }

  const Icon = panelActionIconComponents[action.icon];

  return <Icon data-icon="inline-start" data-icon-name={action.icon} />;
}

function getPanelActionAriaLabel(
  action: PanelActionOption,
  content: ReactNode,
): string | undefined {
  if (typeof content === "string") {
    return undefined;
  }

  return action.name;
}

function shouldSpanFullActionRow(
  index: number,
  actionCount: number,
  columns: 1 | 2,
): boolean {
  return columns === 2 && actionCount % 2 === 1 && index === actionCount - 1;
}

export function PanelActions({
  actions,
  children,
  className,
  columns,
  onAction,
}: PanelActionsProps): React.JSX.Element {
  const actionCount = actions?.length ?? React.Children.count(children);
  const resolvedColumns = columns ?? (actionCount > 1 ? 2 : 1);

  return (
    <div
      className={cn(
        "grid min-w-0 gap-2",
        resolvedColumns === 2 ? "grid-cols-2" : "grid-cols-1",
        className,
      )}
      data-slot="panel-actions"
    >
      {actions
        ? actions.map((action, index) => {
            const actionContent = getPanelActionContent(action);
            const actionValue = getPanelActionValue(action);
            const handleActionClick: React.MouseEventHandler<
              HTMLButtonElement
            > = (event) => {
              action.onClick?.(event);

              if (!event.defaultPrevented) {
                onAction?.(actionValue);
              }
            };

            return (
              <Button
                aria-label={getPanelActionAriaLabel(action, actionContent)}
                className={cn(
                  "w-full",
                  shouldSpanFullActionRow(index, actionCount, resolvedColumns) &&
                    "col-span-2",
                  action.className,
                )}
                key={actionValue}
                onClick={handleActionClick}
                type="button"
                variant={action.variant}
              >
                {getPanelActionIcon(action)}
                {actionContent}
              </Button>
            );
          })
        : children}
    </div>
  );
}
