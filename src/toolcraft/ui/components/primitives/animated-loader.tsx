import type { CSSProperties } from "react";

import { cn } from "../../lib/utils";

export type LoaderSize = number | string;

export type AnimatedLoaderProps = {
  className?: string;
  height?: LoaderSize;
  indicatorClassName?: string;
  insetX?: number;
  width?: LoaderSize;
};

export const DEFAULT_ANIMATED_LOADER_WIDTH = 40;
export const DEFAULT_ANIMATED_LOADER_HEIGHT = 6;
export const MAX_ANIMATED_LOADER_WIDTH = 64;

export function toCssSize(value: LoaderSize): string {
  return typeof value === "number" ? `${value}px` : value;
}

export function resolveAnimatedLoaderWidthStyle(width: LoaderSize, insetX?: number): string {
  const resolvedWidth = toCssSize(width);
  const constrainedByMaxWidth = `min(${resolvedWidth}, ${MAX_ANIMATED_LOADER_WIDTH}px)`;

  return typeof insetX === "number" && insetX > 0
    ? `min(${constrainedByMaxWidth}, max(0px, calc(100% - ${insetX * 2}px)))`
    : constrainedByMaxWidth;
}

export function AnimatedLoader({
  className,
  height = DEFAULT_ANIMATED_LOADER_HEIGHT,
  indicatorClassName,
  insetX,
  width = DEFAULT_ANIMATED_LOADER_WIDTH,
}: AnimatedLoaderProps): React.JSX.Element {
  const style: CSSProperties = {
    height: toCssSize(height),
    width: resolveAnimatedLoaderWidthStyle(width, insetX),
  };

  return (
    <span
      aria-hidden="true"
      className={cn("relative shrink-0", className)}
      data-inset-x={typeof insetX === "number" ? String(insetX) : undefined}
      data-slot="animated-loader"
      style={style}
    >
      <span
        className={cn(
          "button-loader-indicator absolute inset-y-0 left-0 right-[65%] rounded-full bg-[color:var(--foreground)] opacity-90",
          indicatorClassName,
        )}
        data-slot="animated-loader-indicator"
      />
    </span>
  );
}
