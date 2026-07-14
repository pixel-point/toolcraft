"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

import type {
  ScrollFadeIntensity,
  ScrollFadePreset,
  ScrollFadeProps,
  ScrollFadeRootStyle,
  ScrollFadeSide,
  ScrollFadeVisibilityMode,
  ScrollFadeViewportStyle,
} from "./scroll-fade-types";

type ResolvedScrollFadeConfig = {
  height: number;
  intensity: ScrollFadeIntensity;
};

const SCROLL_FADE_PRESETS: Record<ScrollFadePreset, ResolvedScrollFadeConfig> = {
  compact: { height: 20, intensity: "normal" },
  default: { height: 24, intensity: "medium" },
  large: { height: 48, intensity: "dense" },
};

function isHorizontalScrollFade(side: ScrollFadeSide): boolean {
  return side === "left" || side === "right";
}

function getIntensityStops(intensity: ScrollFadeIntensity): {
  fadeStop: number;
  solidStop: number;
} {
  if (intensity === "dense") {
    return { fadeStop: 90, solidStop: 24 };
  }

  if (intensity === "medium") {
    return { fadeStop: 82, solidStop: 16 };
  }

  return { fadeStop: 100, solidStop: 0 };
}

function toRoundedPx(value: number): string {
  return `${Math.max(0, Number(value.toFixed(2)))}px`;
}

function resolveScrollFadeConfig({
  height,
  intensity,
  preset,
}: Pick<ScrollFadeProps, "height" | "intensity" | "preset">): ResolvedScrollFadeConfig {
  const presetConfig = preset ? SCROLL_FADE_PRESETS[preset] : undefined;

  return {
    height: height ?? presetConfig?.height ?? 24,
    intensity: intensity ?? presetConfig?.intensity ?? "normal",
  };
}

function getScrollFadeAxisMaskImage(side: ScrollFadeSide): string {
  const direction = side === "left" || side === "right" ? "to right" : "to bottom";

  return `linear-gradient(${direction}, transparent 0%, transparent var(--scroll-fade-leading-solid), black var(--scroll-fade-leading-fade), black calc(100% - var(--scroll-fade-trailing-fade)), transparent calc(100% - var(--scroll-fade-trailing-solid)), transparent 100%)`;
}

function getOppositeScrollFadeSide(side: ScrollFadeSide): ScrollFadeSide {
  if (side === "bottom") {
    return "top";
  }

  if (side === "top") {
    return "bottom";
  }

  if (side === "left") {
    return "right";
  }

  return "left";
}

function getScrollFadeEdgeStops({
  intensity,
  showFade,
  size,
}: {
  intensity: ScrollFadeIntensity;
  showFade: boolean;
  size: number;
}): {
  fade: string;
  solid: string;
} {
  if (!showFade) {
    return {
      fade: "0px",
      solid: "0px",
    };
  }

  const { fadeStop, solidStop } = getIntensityStops(intensity);

  if (intensity === "normal") {
    return {
      fade: toRoundedPx(size),
      solid: "0px",
    };
  }

  return {
    fade: toRoundedPx(size * (fadeStop / 100)),
    solid: toRoundedPx(size * (solidStop / 100)),
  };
}

function resolveScrollFadeEdgeVisibility({
  showOppositeFade,
  showPrimaryFade,
  side,
}: {
  showOppositeFade: boolean;
  showPrimaryFade: boolean;
  side: ScrollFadeSide;
}): {
  leadingFadeVisible: boolean;
  trailingFadeVisible: boolean;
} {
  if (side === "top" || side === "left") {
    return {
      leadingFadeVisible: showPrimaryFade,
      trailingFadeVisible: showOppositeFade,
    };
  }

  return {
    leadingFadeVisible: showOppositeFade,
    trailingFadeVisible: showPrimaryFade,
  };
}

function resolveScrollFadeViewportStyle({
  intensity,
  showOppositeFade,
  showPrimaryFade,
  side,
  size,
  style,
}: {
  intensity: ScrollFadeIntensity;
  showOppositeFade: boolean;
  showPrimaryFade: boolean;
  side: ScrollFadeSide;
  size: number;
  style: CSSProperties | undefined;
}): ScrollFadeViewportStyle {
  const maskImage = getScrollFadeAxisMaskImage(side);
  const { leadingFadeVisible, trailingFadeVisible } = resolveScrollFadeEdgeVisibility({
    showOppositeFade,
    showPrimaryFade,
    side,
  });
  const leadingEdge = getScrollFadeEdgeStops({
    intensity,
    size,
    showFade: leadingFadeVisible,
  });
  const trailingEdge = getScrollFadeEdgeStops({
    intensity,
    size,
    showFade: trailingFadeVisible,
  });

  return {
    ...style,
    "--scroll-fade-leading-fade": leadingEdge.fade,
    "--scroll-fade-leading-solid": leadingEdge.solid,
    "--scroll-fade-mask-image": maskImage,
    "--scroll-fade-trailing-fade": trailingEdge.fade,
    "--scroll-fade-trailing-solid": trailingEdge.solid,
  };
}

function areDependenciesEqual(previous: readonly unknown[], next: readonly unknown[]): boolean {
  if (previous.length !== next.length) {
    return false;
  }

  return previous.every((value, index) => Object.is(value, next[index]));
}

function useDependencyVersion(dependencies: readonly unknown[]): number {
  const previousDependenciesRef = useRef(dependencies);
  const versionRef = useRef(0);

  if (!areDependenciesEqual(previousDependenciesRef.current, dependencies)) {
    previousDependenciesRef.current = dependencies;
    versionRef.current += 1;
  }

  return versionRef.current;
}

function useScrollFadeInteractionDismissal({
  dependencyVersion,
  dismissOnFirstInteraction,
  interactionVersion,
}: {
  dependencyVersion: number;
  dismissOnFirstInteraction: boolean;
  interactionVersion: number;
}): {
  dismissInteraction: () => void;
  interactionDismissed: boolean;
} {
  const [interactionDismissed, setInteractionDismissed] = useState(false);
  const previousInteractionVersionRef = useRef(interactionVersion);

  useLayoutEffect(() => {
    setInteractionDismissed(false);
  }, [dependencyVersion, dismissOnFirstInteraction]);

  useLayoutEffect(() => {
    if (!dismissOnFirstInteraction) {
      previousInteractionVersionRef.current = interactionVersion;
      return;
    }

    if (previousInteractionVersionRef.current === interactionVersion) {
      return;
    }

    previousInteractionVersionRef.current = interactionVersion;
    setInteractionDismissed(true);
  }, [dismissOnFirstInteraction, interactionVersion]);

  const dismissInteraction = useCallback(() => {
    setInteractionDismissed(true);
  }, []);

  return { dismissInteraction, interactionDismissed };
}

function getShouldShowScrollFade({
  interactionDismissed,
  isHorizontal,
  side,
  visibilityMode,
  viewportElement,
}: {
  interactionDismissed: boolean;
  isHorizontal: boolean;
  side: ScrollFadeSide;
  visibilityMode: ScrollFadeVisibilityMode;
  viewportElement: HTMLDivElement;
}): boolean {
  const scrollOffset = isHorizontal ? viewportElement.scrollLeft : viewportElement.scrollTop;
  const viewportSize = isHorizontal ? viewportElement.clientWidth : viewportElement.clientHeight;
  const scrollSize = isHorizontal ? viewportElement.scrollWidth : viewportElement.scrollHeight;
  const hasOverflow = scrollSize > viewportSize + 1;
  const isAtStart = scrollOffset <= 1;
  const isAtEnd = scrollOffset + viewportSize >= scrollSize - 1;

  if (interactionDismissed || !hasOverflow) {
    return false;
  }

  if (visibilityMode === "terminal") {
    return side === "top" || side === "left" ? isAtEnd : isAtStart;
  }

  return side === "top" || side === "left" ? !isAtStart : !isAtEnd;
}

function useScrollFadeVisibility({
  dependencyVersion,
  dismissInteraction,
  dismissOnFirstInteraction,
  interactionDismissed,
  isHorizontal,
  side,
  visibilityMode,
  viewportElement,
}: {
  dependencyVersion: number;
  dismissInteraction: () => void;
  dismissOnFirstInteraction: boolean;
  interactionDismissed: boolean;
  isHorizontal: boolean;
  side: ScrollFadeSide;
  visibilityMode: ScrollFadeVisibilityMode;
  viewportElement: HTMLDivElement | null;
}): boolean {
  const [showFade, setShowFade] = useState(false);

  useLayoutEffect(() => {
    if (!viewportElement) {
      setShowFade(false);
      return;
    }

    const updateFadeVisibility = (): void => {
      const nextShowFade = getShouldShowScrollFade({
        interactionDismissed,
        isHorizontal,
        side,
        visibilityMode,
        viewportElement,
      });

      setShowFade((current) => (current === nextShowFade ? current : nextShowFade));
    };

    const handleScroll = (): void => {
      if (dismissOnFirstInteraction) {
        dismissInteraction();
        setShowFade(false);
        return;
      }

      updateFadeVisibility();
    };

    updateFadeVisibility();
    viewportElement.addEventListener("scroll", handleScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateFadeVisibility);
      resizeObserver.observe(viewportElement);

      const contentNode = viewportElement.firstElementChild;
      if (contentNode) {
        resizeObserver.observe(contentNode);
      }
    }

    return () => {
      viewportElement.removeEventListener("scroll", handleScroll);
      resizeObserver?.disconnect();
    };
  }, [
    dependencyVersion,
    dismissInteraction,
    dismissOnFirstInteraction,
    interactionDismissed,
    isHorizontal,
    side,
    visibilityMode,
    viewportElement,
  ]);

  return showFade;
}

export function useResolvedScrollFadeDisplayState({
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
}: {
  disableTransition: boolean;
  dismissOnFirstInteraction: boolean;
  forceVisible: boolean;
  height: number | undefined;
  intensity: ScrollFadeIntensity | undefined;
  interactionWatch: readonly unknown[];
  preset: ScrollFadePreset | undefined;
  showOppositeSide: boolean;
  side: ScrollFadeSide;
  style: CSSProperties | undefined;
  visibilityMode: ScrollFadeVisibilityMode;
  viewportElement: HTMLDivElement | null;
  watch: readonly unknown[];
}): {
  isHorizontal: boolean;
  rootStyle: ScrollFadeRootStyle;
  viewportStyle: ScrollFadeViewportStyle;
  viewportVisible: boolean;
} {
  const dependencyVersion = useDependencyVersion(watch);
  const interactionVersion = useDependencyVersion(interactionWatch);
  const isHorizontal = isHorizontalScrollFade(side);
  const resolvedFade = resolveScrollFadeConfig({ height, intensity, preset });
  const oppositeSide = getOppositeScrollFadeSide(side);
  const { dismissInteraction, interactionDismissed } = useScrollFadeInteractionDismissal({
    dependencyVersion,
    dismissOnFirstInteraction,
    interactionVersion,
  });
  const showFade = useScrollFadeVisibility({
    dependencyVersion,
    dismissInteraction,
    dismissOnFirstInteraction,
    interactionDismissed,
    isHorizontal,
    side,
    visibilityMode,
    viewportElement,
  });
  const showOppositeFade = useScrollFadeVisibility({
    dependencyVersion,
    dismissInteraction,
    dismissOnFirstInteraction,
    interactionDismissed,
    isHorizontal,
    side: oppositeSide,
    visibilityMode,
    viewportElement,
  });
  const shouldShowOppositeFade = showOppositeSide && showOppositeFade;
  const resolvedShowFade = forceVisible || showFade;
  const viewportVisible = forceVisible || resolvedShowFade || shouldShowOppositeFade;

  return {
    isHorizontal,
    rootStyle: {
      "--scroll-fade-size": `${resolvedFade.height}px`,
    },
    viewportStyle: resolveScrollFadeViewportStyle({
      intensity: resolvedFade.intensity,
      showOppositeFade: shouldShowOppositeFade,
      showPrimaryFade: resolvedShowFade,
      side,
      size: resolvedFade.height,
      style: disableTransition ? { ...style, transition: "none" } : style,
    }),
    viewportVisible,
  };
}
