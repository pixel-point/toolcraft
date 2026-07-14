"use client";

import * as React from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";

import { PrimitiveArrowIcon } from "../primitives";
import {
  PanelIconButton,
  stopPanelHeaderButtonPointerDown,
} from "./panel-icon-button";

type PanelHeaderProps = {
  collapsed: boolean;
  collapseLabel?: string;
  expandLabel?: string;
  onResetControls?: () => void;
  onToggleCollapsed: () => void;
  title: string;
};

export function PanelHeader({
  collapsed,
  collapseLabel = "Collapse controls",
  expandLabel = "Expand controls",
  onResetControls,
  onToggleCollapsed,
  title,
}: PanelHeaderProps): React.JSX.Element {
  return (
    <div className="shrink-0" data-slot="properties-panel-header-shell">
      <div
        className="flex h-9 touch-none items-center justify-between gap-3 pr-1 pl-3 hover:cursor-grab active:cursor-grabbing"
        data-panel-drag-handle=""
        data-slot="properties-panel-header"
      >
        <p className="m-0 min-w-0 truncate text-xs-plus font-medium text-[color:var(--foreground)]">
          {title}
        </p>
        <div className="inline-flex shrink-0 items-center gap-1">
          {collapsed || !onResetControls ? null : (
            <PanelIconButton
              label="Reset controls"
              onClick={onResetControls}
              onPointerDown={stopPanelHeaderButtonPointerDown}
              spinOnClick
            >
              <ArrowCounterClockwiseIcon />
            </PanelIconButton>
          )}
          <PanelIconButton
            label={collapsed ? expandLabel : collapseLabel}
            onClick={onToggleCollapsed}
            onPointerDown={stopPanelHeaderButtonPointerDown}
          >
            <PrimitiveArrowIcon direction={collapsed ? "down" : "up"} />
          </PanelIconButton>
        </div>
      </div>
    </div>
  );
}
