import type * as React from "react";

import type { ToolcraftPanelId, ToolcraftPanelState } from "../state/types";

export type { ToolcraftPanelState } from "../state/types";

export type ToolcraftPanelType = ToolcraftPanelId;

export type PanelSnapEdge = "bottom" | "left" | "right" | "top";

export type PanelDragMode = "handle" | "panel";

export type PanelPoint = {
  x: number;
  y: number;
};

export type PanelDimensions = {
  height: number;
  width: number;
};

export type PanelViewport = PanelDimensions & {
  offsetLeft: number;
  offsetTop: number;
};

export type PanelSnapConfig = {
  edges: readonly PanelSnapEdge[];
  margin?: number;
  zone?: number;
};

export type PanelPlacement = "floating" | "frame" | "surface";

export type PanelStateChange = (state: Partial<ToolcraftPanelState>) => void;

export type PanelHostProps = {
  children: React.ReactNode;
  className?: string;
  dragMode?: PanelDragMode;
  innerClassName?: string;
  onPositionChange?: (position: PanelPoint) => void;
  onResetPosition?: () => void;
  panelId?: string;
  panelType: ToolcraftPanelType;
  position?: PanelPoint;
  snap?: PanelSnapConfig;
  style?: React.CSSProperties;
};

export type PanelStageProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
};

export type PanelContainerProps = {
  children: React.ReactNode;
  className?: string;
  dragMode?: PanelDragMode;
  onPanelStateChange?: PanelStateChange;
  panelClassName?: string;
  panelState?: ToolcraftPanelState;
  panelType: ToolcraftPanelType;
  placement: PanelPlacement;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "children" | "className">;

export type ToolcraftPanelHostProps = Omit<
  PanelHostProps,
  "onPositionChange" | "onResetPosition" | "position"
> & {
  onPositionChange?: (position: PanelPoint) => void;
  onResetPosition?: () => void;
  position?: PanelPoint;
};
