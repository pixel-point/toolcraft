"use client";

import * as React from "react";
import { TargetIcon } from "@phosphor-icons/react";
import {
  Button,
  PanelSurface,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/toolcraft/ui";
import { Moon, Redo2, Sun, Undo2, ZoomIn, ZoomOut } from "lucide-react";

import type { ToolcraftPanelState } from "../state/types";
import { PanelContainer } from "./panel-host";
import type { PanelPlacement, PanelStateChange } from "./panel-host-types";
import { useToolcraftTheme } from "./theme-runtime";
import { useToolcraft } from "./use-toolcraft";

export type ToolbarPanelProps = {
  className?: string;
  framed?: boolean;
  onPanelStateChange?: PanelStateChange;
  panelPlacement?: PanelPlacement;
  panelState?: ToolcraftPanelState;
};

type ToolbarIconButtonProps = {
  active?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
};

const toolbarIconButtonSize = "icon";
const desktopToolbarTightButtonGapClassName = "-mr-px";

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

function ToolbarDivider(): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="block h-5 w-px shrink-0 rounded-full bg-[color:color-mix(in_oklab,var(--border)_8%,transparent)]"
      data-slot="desktop-toolbar-divider"
    />
  );
}

function ToolbarIconButton({
  active = false,
  children,
  className,
  disabled,
  label,
  onClick,
}: ToolbarIconButtonProps): React.JSX.Element {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.();

    if (typeof event.currentTarget.blur === "function") {
      event.currentTarget.blur();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "data-[icon-active=true]:text-[color:var(--foreground)]",
              className,
            )}
            data-icon-active={active}
            disabled={disabled}
            onClick={handleClick}
            size={toolbarIconButtonSize}
            type="button"
            variant="ghost"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

export function ToolbarPanel({
  className,
  framed = true,
  onPanelStateChange,
  panelPlacement,
  panelState,
}: ToolbarPanelProps): React.JSX.Element {
  const { dispatch, state } = useToolcraft();
  const { resolvedTheme, toggleResolvedTheme } = useToolcraftTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const canUndo = state.history.undo.length > 0;
  const canRedo = state.history.redo.length > 0;
  const historyEnabled = state.schema.toolbar.history;
  const radarEnabled = state.schema.toolbar.radar;
  const themeEnabled = state.schema.toolbar.theme;
  const zoomEnabled = state.schema.toolbar.zoom;

  const toolbarSurface = (
    <PanelSurface
      className={cn(
        "pointer-events-auto flex w-auto items-center justify-start gap-1.5 rounded-lg p-1",
        !framed && className,
      )}
      data-toolcraft-inspect-toolbar="true"
      data-panel-id="toolbar"
    >
      {historyEnabled ? (
        <>
          <ToolbarIconButton
            className={desktopToolbarTightButtonGapClassName}
            disabled={!canUndo}
            label="Undo"
            onClick={() => dispatch({ type: "history.undo" })}
          >
            <Undo2 />
          </ToolbarIconButton>
          <ToolbarIconButton
            className={desktopToolbarTightButtonGapClassName}
            disabled={!canRedo}
            label="Redo"
            onClick={() => dispatch({ type: "history.redo" })}
          >
            <Redo2 />
          </ToolbarIconButton>
          <ToolbarDivider />
        </>
      ) : null}
      {zoomEnabled ? (
        <>
          <ToolbarIconButton
            label="Zoom out"
            onClick={() => dispatch({ type: "canvas.zoomOut" })}
          >
            <ZoomOut />
          </ToolbarIconButton>
          <span
            className="inline-flex h-7 w-[4ch] shrink-0 cursor-default items-center justify-center font-mono text-[12px] leading-[1.125rem] text-[color:color-mix(in_oklab,var(--foreground)_90%,transparent)] tabular-nums select-none"
            data-panel-drag-ignore=""
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              dispatch({ type: "canvas.zoomReset" });
            }}
          >
            {state.canvas.zoom}%
          </span>
          <ToolbarIconButton
            label="Zoom in"
            onClick={() => dispatch({ type: "canvas.zoomIn" })}
          >
            <ZoomIn />
          </ToolbarIconButton>
          <ToolbarDivider />
        </>
      ) : null}
      {themeEnabled ? (
        <ToolbarIconButton
          label={nextTheme === "light" ? "Light theme" : "Dark theme"}
          onClick={toggleResolvedTheme}
        >
          {nextTheme === "light" ? (
            <Sun data-icon="theme-light" />
          ) : (
            <Moon data-icon="theme-dark" />
          )}
        </ToolbarIconButton>
      ) : null}
      {radarEnabled ? (
        <ToolbarIconButton
          label="Center canvas"
          onClick={() => dispatch({ type: "canvas.center" })}
        >
          <TargetIcon />
        </ToolbarIconButton>
      ) : null}
    </PanelSurface>
  );

  return (
    <PanelContainer
      onPanelStateChange={onPanelStateChange}
      panelState={panelState}
      panelType="toolbar"
      placement={panelPlacement ?? (framed ? "frame" : "surface")}
    >
      {toolbarSurface}
    </PanelContainer>
  );
}
