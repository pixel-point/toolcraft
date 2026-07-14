import type React from "react";
import type { CSSProperties, ReactNode, Ref } from "react";

export type ScrollFadeSide = "top" | "bottom" | "left" | "right";
export type ScrollFadeIntensity = "normal" | "medium" | "dense";
export type ScrollFadePreset = "compact" | "default" | "large";
export type ScrollFadeVisibilityMode = "overflow" | "terminal";

export interface ScrollFadeProps extends Omit<
  React.ComponentProps<"div">,
  "children" | "className"
> {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  containerRef?: React.Ref<HTMLDivElement>;
  dismissOnFirstInteraction?: boolean;
  disableTransition?: boolean;
  forceVisible?: boolean;
  height?: number;
  intensity?: ScrollFadeIntensity;
  interactionWatch?: readonly unknown[];
  preset?: ScrollFadePreset;
  side?: ScrollFadeSide;
  showOppositeSide?: boolean;
  visibilityMode?: ScrollFadeVisibilityMode;
  viewportRef?: Ref<HTMLDivElement>;
  watch?: readonly unknown[];
}

export type ScrollFadeRootStyle = CSSProperties & {
  "--scroll-fade-size"?: string;
};

export type ScrollFadeViewportStyle = CSSProperties & {
  "--scroll-fade-leading-fade"?: string;
  "--scroll-fade-leading-solid"?: string;
  "--scroll-fade-mask-image"?: string;
  "--scroll-fade-trailing-fade"?: string;
  "--scroll-fade-trailing-solid"?: string;
};
