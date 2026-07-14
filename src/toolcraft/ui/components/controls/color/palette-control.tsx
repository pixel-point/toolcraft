"use client";

import * as React from "react";

import { cn } from "../../../lib/utils";
import {
  createControlHistoryGroupId,
  type ControlChangeMeta,
} from "../control-types";
import {
  PALETTE_SHADE_STEPS,
  STYLE_GUIDE_PRIMARY_FAMILY_OPTIONS,
  TAILWIND_COLOR_PALETTE,
  getPaletteHex,
  type PaletteColorFamily,
  type PaletteControlValue,
  type PaletteShadeStep,
} from "./palette-control-data";

export {
  PALETTE_SHADE_STEPS,
  STYLE_GUIDE_PRIMARY_FAMILY_OPTIONS,
  TAILWIND_COLOR_PALETTE,
  getPaletteHex,
};
export type { PaletteColorFamily, PaletteControlValue, PaletteShadeStep };

export type PaletteControlChangeMeta = ControlChangeMeta & {
  stage: "live" | "commit";
  hex: string;
};

export type PaletteControlProps = {
  value?: PaletteControlValue;
  defaultValue?: PaletteControlValue;
  disabled?: boolean;
  ariaLabel?: string;
  title?: string;
  variant?: "popover" | "panel";
  className?: string;
  onValueChange?: (
    nextValue: PaletteControlValue,
    meta: PaletteControlChangeMeta,
  ) => void;
  onCommit?: (nextValue: PaletteControlValue, hex: string) => void;
  onInteractionStateChange?: (isInteracting: boolean) => void;
};

const PALETTE_COLUMNS = 5;
const PALETTE_CELL_SIZE = 28;
const PALETTE_GAP = 12;
const SHADE_RAIL_WIDTH = 20;
const CLICK_COMMIT_IDLE_MS = 250;
const PERSIST_SETTLE_MS = 160;
const DEFAULT_PALETTE_CONTROL_VALUE: PaletteControlValue = {
  family: "Amber",
  shade: "500",
};

function valuesEqual(left: PaletteControlValue, right: PaletteControlValue) {
  return left.family === right.family && left.shade === right.shade;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getShadeIndicatorTopPercent(shade: PaletteShadeStep) {
  const index = PALETTE_SHADE_STEPS.indexOf(shade);

  return Math.max(0, index) * (100 / PALETTE_SHADE_STEPS.length);
}

export function PaletteControl({
  value,
  defaultValue = DEFAULT_PALETTE_CONTROL_VALUE,
  disabled = false,
  ariaLabel = "Primary color palette",
  title = "Color palette",
  variant = "panel",
  className,
  onValueChange,
  onCommit,
  onInteractionStateChange,
}: PaletteControlProps): React.JSX.Element {
  const initialValue = value ?? defaultValue;
  const [optimisticValue, setOptimisticValue] =
    React.useState<PaletteControlValue>(initialValue);
  const [isShadeDragging, setIsShadeDragging] = React.useState(false);
  const [indicatorTopPercent, setIndicatorTopPercent] = React.useState(() =>
    getShadeIndicatorTopPercent(initialValue.shade),
  );
  const optimisticValueRef = React.useRef(initialValue);
  const pendingCommitRef = React.useRef<PaletteControlValue | null>(null);
  const pendingPersistRef = React.useRef<PaletteControlValue | null>(null);
  const clickCommitTimeoutRef = React.useRef<number | null>(null);
  const persistTimeoutRef = React.useRef<number | null>(null);
  const liveHistoryGroupRef = React.useRef<string | null>(null);
  const isInteractingRef = React.useRef(false);
  const shadeTrackRef = React.useRef<HTMLDivElement | null>(null);
  const onValueChangeRef = React.useRef(onValueChange);
  const onCommitRef = React.useRef(onCommit);
  const onInteractionStateChangeRef = React.useRef(onInteractionStateChange);

  const paletteRows = Math.ceil(
    STYLE_GUIDE_PRIMARY_FAMILY_OPTIONS.length / PALETTE_COLUMNS,
  );
  const paletteBlockHeight =
    paletteRows * PALETTE_CELL_SIZE + Math.max(0, paletteRows - 1) * PALETTE_GAP;

  const activePalette =
    TAILWIND_COLOR_PALETTE.find(
      (palette) => palette.name === optimisticValue.family,
    ) ?? TAILWIND_COLOR_PALETTE[0];
  const shadeSegmentPercent = 100 / PALETTE_SHADE_STEPS.length;

  React.useEffect(() => {
    onValueChangeRef.current = onValueChange;
  }, [onValueChange]);

  React.useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  React.useEffect(() => {
    onInteractionStateChangeRef.current = onInteractionStateChange;
  }, [onInteractionStateChange]);

  const setInteractionState = React.useCallback((nextIsInteracting: boolean) => {
    if (isInteractingRef.current === nextIsInteracting) {
      return;
    }

    isInteractingRef.current = nextIsInteracting;
    onInteractionStateChangeRef.current?.(nextIsInteracting);
  }, []);

  const clearClickCommitTimeout = React.useCallback(() => {
    if (clickCommitTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(clickCommitTimeoutRef.current);
    clickCommitTimeoutRef.current = null;
  }, []);

  const clearPersistTimeout = React.useCallback(() => {
    if (persistTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = null;
  }, []);

  const getLiveHistoryMeta = React.useCallback((): ControlChangeMeta => {
    liveHistoryGroupRef.current ??= createControlHistoryGroupId("palette");

    return {
      history: "merge",
      historyGroup: liveHistoryGroupRef.current,
    };
  }, []);

  const finishLiveHistoryGroup = React.useCallback(() => {
    liveHistoryGroupRef.current = null;
  }, []);

  const emitChange = React.useCallback(
    (nextValue: PaletteControlValue, stage: PaletteControlChangeMeta["stage"]) => {
      const hex = getPaletteHex(nextValue);
      const historyMeta =
        stage === "live" || liveHistoryGroupRef.current
          ? getLiveHistoryMeta()
          : undefined;

      onValueChangeRef.current?.(nextValue, {
        ...historyMeta,
        stage,
        hex,
      });
    },
    [getLiveHistoryMeta],
  );

  const syncOptimisticValue = React.useCallback((nextValue: PaletteControlValue) => {
    optimisticValueRef.current = nextValue;
    setOptimisticValue(nextValue);
  }, []);

  const flushPendingPersist = React.useCallback(
    (options?: { immediate?: boolean }) => {
      const pendingPersist = pendingPersistRef.current;

      if (!pendingPersist) {
        return false;
      }

      clearPersistTimeout();

      if (options?.immediate) {
        pendingPersistRef.current = null;
        onCommitRef.current?.(pendingPersist, getPaletteHex(pendingPersist));
        finishLiveHistoryGroup();
        setInteractionState(false);
        return true;
      }

      persistTimeoutRef.current = window.setTimeout(() => {
        persistTimeoutRef.current = null;
        const nextPersist = pendingPersistRef.current;
        pendingPersistRef.current = null;

        if (!nextPersist) {
          finishLiveHistoryGroup();
          setInteractionState(false);
          return;
        }

        onCommitRef.current?.(nextPersist, getPaletteHex(nextPersist));
        finishLiveHistoryGroup();
        setInteractionState(false);
      }, PERSIST_SETTLE_MS);

      return true;
    },
    [clearPersistTimeout, finishLiveHistoryGroup, setInteractionState],
  );

  const flushPendingCommit = React.useCallback((options?: { persistImmediately?: boolean }) => {
    const pendingCommit = pendingCommitRef.current;
    clearClickCommitTimeout();

    if (!pendingCommit) {
      if (!pendingPersistRef.current) {
        setInteractionState(false);
      }
      return false;
    }

    pendingCommitRef.current = null;
    emitChange(pendingCommit, "commit");
    pendingPersistRef.current = pendingCommit;
    flushPendingPersist({ immediate: options?.persistImmediately });

    return true;
  }, [clearClickCommitTimeout, emitChange, flushPendingPersist, setInteractionState]);

  const scheduleClickCommit = React.useCallback(
    (nextValue: PaletteControlValue) => {
      pendingCommitRef.current = nextValue;
      clearClickCommitTimeout();
      clearPersistTimeout();
      pendingPersistRef.current = null;
      setInteractionState(true);
      clickCommitTimeoutRef.current = window.setTimeout(() => {
        flushPendingCommit();
      }, CLICK_COMMIT_IDLE_MS);
    },
    [clearClickCommitTimeout, clearPersistTimeout, flushPendingCommit, setInteractionState],
  );

  const applyLiveSelection = React.useCallback(
    (nextValue: PaletteControlValue, source: "click" | "drag") => {
      if (disabled || valuesEqual(nextValue, optimisticValueRef.current)) {
        return null;
      }

      syncOptimisticValue(nextValue);
      emitChange(nextValue, "live");

      if (source === "click") {
        scheduleClickCommit(nextValue);
      } else {
        clearClickCommitTimeout();
        clearPersistTimeout();
        pendingPersistRef.current = null;
        pendingCommitRef.current = nextValue;
        setInteractionState(true);
      }

      return getPaletteHex(nextValue);
    },
    [
      clearClickCommitTimeout,
      clearPersistTimeout,
      disabled,
      emitChange,
      scheduleClickCommit,
      setInteractionState,
      syncOptimisticValue,
    ],
  );

  const updateDraggedShade = React.useCallback(
    (clientY: number) => {
      const trackBounds = shadeTrackRef.current?.getBoundingClientRect();

      if (!trackBounds || trackBounds.height === 0) {
        return;
      }

      const segmentHeight = trackBounds.height / PALETTE_SHADE_STEPS.length;
      const maxTop = trackBounds.height - segmentHeight;
      const nextTop = clamp(
        clientY - trackBounds.top - segmentHeight / 2,
        0,
        maxTop,
      );
      const nextIndex = clamp(
        Math.round(nextTop / segmentHeight),
        0,
        PALETTE_SHADE_STEPS.length - 1,
      );
      const nextShade = PALETTE_SHADE_STEPS[nextIndex]!;

      setIndicatorTopPercent((nextTop / trackBounds.height) * 100);
      applyLiveSelection(
        {
          family: optimisticValueRef.current.family,
          shade: nextShade,
        },
        "drag",
      );
    },
    [applyLiveSelection],
  );

  React.useEffect(() => {
    if (isShadeDragging) {
      return;
    }

    setIndicatorTopPercent(getShadeIndicatorTopPercent(optimisticValue.shade));
  }, [isShadeDragging, optimisticValue.shade]);

  React.useEffect(() => {
    if (!value) {
      return;
    }

    if (isShadeDragging || pendingCommitRef.current) {
      return;
    }

    syncOptimisticValue(value);
  }, [isShadeDragging, syncOptimisticValue, value]);

  React.useEffect(() => {
    if (!isShadeDragging) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      updateDraggedShade(event.clientY);
    };

    const handlePointerFinish = () => {
      setIsShadeDragging(false);
      flushPendingCommit();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerFinish);
    window.addEventListener("pointercancel", handlePointerFinish);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerFinish);
      window.removeEventListener("pointercancel", handlePointerFinish);
    };
  }, [flushPendingCommit, isShadeDragging, updateDraggedShade]);

  React.useEffect(() => {
    return () => {
      const didCommit = flushPendingCommit({ persistImmediately: true });
      if (!didCommit) {
        flushPendingPersist({ immediate: true });
      }
    };
  }, [flushPendingCommit, flushPendingPersist]);

  const paletteGrid = (
    <div
      className="grid content-start gap-x-3 gap-y-3"
      style={{
        gridAutoRows: `${PALETTE_CELL_SIZE}px`,
        gridTemplateColumns: `repeat(${PALETTE_COLUMNS}, ${PALETTE_CELL_SIZE}px)`,
      }}
    >
      {STYLE_GUIDE_PRIMARY_FAMILY_OPTIONS.map((palette) => {
        const isSelected = palette.name === optimisticValue.family;

        return (
          <button
            key={palette.name}
            type="button"
            aria-label={`Primary family ${palette.name}`}
            aria-pressed={isSelected}
            disabled={disabled}
            className={cn(
              "relative size-[26px] place-self-center rounded-full border border-[color:color-mix(in_oklab,var(--foreground)_10%,transparent)] transition-[box-shadow,transform,opacity] duration-150 ease-out hover:scale-[1.04] active:scale-[0.98]",
              "focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_40%,transparent)] focus-visible:outline-hidden",
              isSelected &&
                "after:pointer-events-none after:absolute after:-inset-[6px] after:rounded-full after:border-2 after:border-[color:var(--foreground)] after:content-['']",
              disabled && "cursor-not-allowed opacity-60",
            )}
            style={{ backgroundColor: palette.shades["500"] }}
            onClick={() => {
              applyLiveSelection(
                {
                  family: palette.name,
                  shade: optimisticValueRef.current.shade,
                },
                "click",
              );
            }}
          />
        );
      })}
    </div>
  );

  const shadeRail = (
    <div className="flex items-stretch">
      <div
        ref={shadeTrackRef}
        data-slot="palette-shade-track"
        data-testid="palette-shade-track"
        className="relative flex min-h-0 flex-col"
        style={{ height: `${paletteBlockHeight}px`, width: `${SHADE_RAIL_WIDTH}px` }}
      >
        <div
          data-slot="palette-shade-indicator"
          data-testid="palette-shade-indicator"
          aria-hidden="true"
          className={cn(
            "absolute inset-x-0 z-10 touch-none",
            isShadeDragging
              ? "cursor-grabbing transition-none"
              : "cursor-grab transition-[top] duration-130 ease-out",
            disabled && "cursor-not-allowed",
          )}
          style={{
            height: `${shadeSegmentPercent}%`,
            top: `${indicatorTopPercent}%`,
          }}
          onPointerDown={(event) => {
            if (disabled) {
              return;
            }

            event.preventDefault();
            clearClickCommitTimeout();
            clearPersistTimeout();
            pendingPersistRef.current = null;
            setInteractionState(true);
            setIsShadeDragging(true);
          }}
        >
          <div className="absolute inset-[-3px] rounded-[7px] border-[3px] border-[color:var(--foreground)] [box-shadow:0_0_4px_rgba(0,0,0,0.3),inset_0_0_4px_rgba(0,0,0,0.3)]" />
        </div>

        {PALETTE_SHADE_STEPS.map((shade, index) => {
          const isSelected = shade === optimisticValue.shade;
          const isFirst = index === 0;
          const isLast = index === PALETTE_SHADE_STEPS.length - 1;

          return (
            <button
              key={shade}
              type="button"
              aria-label={`Primary shade ${shade}`}
              aria-pressed={isSelected}
              disabled={disabled}
              className={cn(
                "relative inline-flex min-h-0 w-5 flex-1 rounded-none border border-transparent transition-[opacity,transform] duration-150 ease-out hover:scale-[1.02]",
                "focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_40%,transparent)] focus-visible:outline-hidden",
                isFirst && "rounded-t-[3px]",
                isLast && "rounded-b-[3px]",
                disabled && "cursor-not-allowed opacity-60",
              )}
              style={{ backgroundColor: activePalette.shades[shade] }}
              onClick={() => {
                applyLiveSelection(
                  {
                    family: optimisticValueRef.current.family,
                    shade,
                  },
                  "click",
                );
              }}
            >
              <span className="sr-only">{shade}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (variant === "panel") {
    return (
      <div
        aria-label={ariaLabel}
        data-slot="palette-control"
        className={cn("flex w-full justify-center py-[12px]", className)}
        role="group"
      >
        <div className="inline-flex w-fit items-stretch">
          <div
            data-slot="palette-control-palette-block"
            data-testid="palette-control-palette-block"
            className="shrink-0"
          >
            {paletteGrid}
          </div>
          <div
            aria-hidden="true"
            className="mx-5 w-px shrink-0 bg-[color:color-mix(in_oklab,var(--border)_8%,transparent)]"
          />
          <div
            data-slot="palette-control-slider-block"
            data-testid="palette-control-slider-block"
            className="flex min-w-0 items-stretch"
          >
            {shadeRail}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={ariaLabel}
      data-slot="palette-control"
      className={cn(
        "inline-flex flex-col overflow-hidden rounded-lg border border-[color:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] bg-[color:color-mix(in_oklab,var(--popover)_98%,transparent)] text-[color:var(--popover-foreground)] shadow-[0_10px_16px_color-mix(in_oklab,var(--background)_40%,transparent)]",
        className,
      )}
      role="group"
    >
      <div className="flex h-10 items-center border-b border-[color:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] px-4">
        <div className="text-[14px] leading-none font-semibold text-[color:var(--foreground)]">
          {title}
        </div>
      </div>
      <div className="inline-grid grid-cols-[auto_1px_auto] items-stretch">
        <div className="px-4 py-4">
          {paletteGrid}
        </div>

        <div
          aria-hidden="true"
          className="h-full w-px bg-[color:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)]"
        />

        <div className="flex items-stretch px-4 py-4">
          {shadeRail}
        </div>
      </div>
    </div>
  );
}
