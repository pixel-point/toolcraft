"use client";

import { useState } from "react";

import { cn } from "../../lib/utils";
import { useResolvedScrollFadeDisplayState } from "./scroll-fade-logic";
import { ScrollFadeViewport, useScrollFadeViewportAttachment } from "./scroll-fade-render";
import type { ScrollFadeProps } from "./scroll-fade-types";

export function ScrollFade({
  children,
  className,
  containerClassName,
  containerRef,
  disableTransition = false,
  dismissOnFirstInteraction = false,
  forceVisible = false,
  height,
  intensity,
  interactionWatch = [],
  preset,
  side = "bottom",
  showOppositeSide = false,
  style,
  visibilityMode = "overflow",
  viewportRef,
  watch = [],
  ...props
}: ScrollFadeProps): React.JSX.Element {
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);
  const attachViewport = useScrollFadeViewportAttachment({
    setViewportElement,
    viewportRef,
  });
  const { isHorizontal, rootStyle, viewportStyle, viewportVisible } =
    useResolvedScrollFadeDisplayState({
      disableTransition,
      dismissOnFirstInteraction,
      forceVisible,
      height,
      intensity,
      interactionWatch,
      preset,
      showOppositeSide,
      side,
      style,
      visibilityMode,
      viewportElement,
      watch,
    });

  return (
    <div
      className={cn("relative", containerClassName)}
      data-slot="scroll-fade"
      ref={containerRef}
      style={rootStyle}
    >
      <ScrollFadeViewport
        attachViewport={attachViewport}
        className={className}
        isHorizontal={isHorizontal}
        props={props}
        side={side}
        viewportStyle={viewportStyle}
        viewportVisible={viewportVisible}
      >
        {children}
      </ScrollFadeViewport>
    </div>
  );
}
