"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../../primitives/input-group";
import { StaticSelect } from "../select";
import {
  getColorChannels,
  getEditableChannelHex,
  type ColorChannels,
  type ColorFormatMode,
  type ColorSurfaceModel,
} from "./style-guide-color-picker-channel-utils";
import { type HsvColor } from "../../../lib/style-guide-color-utils";
import { cn } from "../../../lib/utils";
import { type ColorSurfacePosition } from "./style-guide-color-picker-logic";

export { getColorChannels } from "./style-guide-color-picker-channel-utils";

const HUE_RAIL_BACKGROUND =
  "linear-gradient(90deg, #ff0000 0%, #ffff00 16.67%, #00ff00 33.33%, #00ffff 50%, #0000ff 66.67%, #ff00ff 83.33%, #ff0000 100%)";
const RGB_BLUE_RAIL_BACKGROUND = "linear-gradient(90deg, rgb(0 0 0), rgb(0 0 255))";

function clampSliderValue(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

function getSliderValueFromClientX(clientX: number, bounds: DOMRect, max: number): number {
  if (bounds.width === 0) return 0;

  return clampSliderValue(Math.round(((clientX - bounds.left) / bounds.width) * max), max);
}

type ColorSurfaceProps = {
  surfaceRef: RefObject<HTMLDivElement | null>;
  surfaceLabel: string;
  surfaceClassName?: string;
  disabled: boolean;
  hueColor: string;
  currentColorHex: string;
  colorModel: ColorSurfaceModel;
  optimisticColor: HsvColor;
  surfacePosition: ColorSurfacePosition | null;
  isSurfaceDragging: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onThumbPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

function getRgbCss([red, green, blue]: [number, number, number]): string {
  return `rgb(${red} ${green} ${blue})`;
}

export function getColorSurfaceThumbPosition({
  colorModel,
  currentColorHex,
  optimisticColor,
  surfacePosition,
}: {
  colorModel: ColorSurfaceModel;
  currentColorHex: string;
  optimisticColor: HsvColor;
  surfacePosition?: ColorSurfacePosition | null;
}): { left: string; top: string } {
  if (surfacePosition) {
    return {
      left: `${surfacePosition.x * 100}%`,
      top: `${surfacePosition.y * 100}%`,
    };
  }

  const channels = getColorChannels(currentColorHex);

  if (colorModel === "rgb") {
    const [red, green] = channels.rgb;

    return {
      left: `${(red / 255) * 100}%`,
      top: `${(1 - green / 255) * 100}%`,
    };
  }

  if (colorModel === "hsl") {
    const [, saturation, lightness] = channels.hsl;

    return {
      left: `${saturation}%`,
      top: `${100 - lightness}%`,
    };
  }

  return {
    left: `${optimisticColor.s * 100}%`,
    top: `${(1 - optimisticColor.v) * 100}%`,
  };
}

export function getColorSurfaceStyle({
  colorModel,
  currentColorHex,
  hue,
  hueColor,
}: {
  colorModel: ColorSurfaceModel;
  currentColorHex: string;
  hue?: number;
  hueColor: string;
}): CSSProperties {
  const channels = getColorChannels(currentColorHex);

  if (colorModel === "rgb") {
    const blue = channels.rgb[2];

    return {
      backgroundColor: getRgbCss([0, 0, blue]),
      backgroundImage: [
        "linear-gradient(to right, rgb(0 0 0), rgb(255 0 0))",
        "linear-gradient(to top, rgb(0 0 0), rgb(0 255 0))",
      ].join(", "),
      backgroundBlendMode: "screen",
    };
  }

  if (colorModel === "hsl") {
    const [fallbackHue] = channels.hsl;
    const resolvedHue = hue ?? fallbackHue;

    return {
      backgroundImage: [
        "linear-gradient(to bottom, #fff 0%, transparent 50%, #000 100%)",
        `linear-gradient(to right, hsl(${resolvedHue} 0% 50%), hsl(${resolvedHue} 100% 50%))`,
      ].join(", "),
    };
  }

  return {
    backgroundColor: hueColor,
  };
}

export function getColorSurfaceSliderConfig({
  colorModel,
  currentColorHex,
  hueLabel,
  optimisticColor,
}: {
  colorModel: ColorSurfaceModel;
  currentColorHex: string;
  hueLabel: string;
  optimisticColor: HsvColor;
}): {
  label: string;
  max: number;
  railBackground: string;
  value: number;
} {
  if (colorModel === "rgb") {
    const [, , blue] = getColorChannels(currentColorHex).rgb;

    return {
      label: "RGB blue channel",
      max: 255,
      railBackground: RGB_BLUE_RAIL_BACKGROUND,
      value: blue,
    };
  }

  return {
    label: hueLabel,
    max: 360,
    railBackground: HUE_RAIL_BACKGROUND,
    value: optimisticColor.h,
  };
}

export function ColorSurface({
  surfaceRef,
  surfaceLabel,
  surfaceClassName,
  disabled,
  hueColor,
  currentColorHex,
  colorModel,
  optimisticColor,
  surfacePosition,
  isSurfaceDragging,
  onPointerDown,
  onThumbPointerDown,
}: ColorSurfaceProps) {
  const thumbPosition = getColorSurfaceThumbPosition({
    colorModel,
    currentColorHex,
    optimisticColor,
    surfacePosition,
  });

  return (
    <div
      ref={surfaceRef}
      data-slot="style-guide-color-surface"
      data-color-model={colorModel}
      aria-label={surfaceLabel}
      className={cn(
        "group/surface relative aspect-square w-full shrink-0 touch-none rounded-t-[8px]",
        surfaceClassName,
        disabled && "cursor-not-allowed opacity-60",
      )}
      style={getColorSurfaceStyle({
        colorModel,
        currentColorHex,
        hue: optimisticColor.h,
        hueColor,
      })}
      onPointerDown={onPointerDown}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-[8px]">
        {colorModel === "hsb" ? (
          <>
            <div className="absolute inset-0 bg-linear-to-r from-white to-transparent" />
            <div className="absolute inset-0 bg-linear-to-t from-black to-transparent" />
          </>
        ) : null}
        <div
          data-slot="style-guide-color-surface-divider"
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px bg-[color:color-mix(in_oklab,var(--border)_6%,transparent)]"
        />
      </div>
      <div
        data-slot="style-guide-color-surface-thumb"
        aria-hidden
        className={cn(
          "absolute size-[14px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-foreground shadow-[0_1px_4px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-out group-hover/surface:scale-[1.4286]",
          isSurfaceDragging && "scale-[1.4286]",
        )}
        style={{
          backgroundColor: currentColorHex,
          left: thumbPosition.left,
          top: thumbPosition.top,
        }}
        onPointerDown={onThumbPointerDown}
      />
    </div>
  );
}

type ColorModelSliderProps = {
  label: string;
  disabled: boolean;
  max: number;
  railBackground: string;
  value: number;
  onDragStateChange: (nextIsDragging: boolean) => void;
  onPreviewChange: (nextValue: number) => void;
  onCommit: (nextValue: number) => void;
};

export function ColorModelSlider({
  label,
  disabled,
  max,
  railBackground,
  value,
  onDragStateChange,
  onPreviewChange,
  onCommit,
}: ColorModelSliderProps) {
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const dragBoundsRef = useRef<DOMRect | null>(null);
  const latestDragValueRef = useRef(value);
  const callbacksRef = useRef({ onCommit, onDragStateChange, onPreviewChange });
  const [isDragging, setIsDragging] = useState(false);
  const activeValue = isDragging ? latestDragValueRef.current : value;
  const valuePercent = max === 0 ? 0 : (clampSliderValue(activeValue, max) / max) * 100;

  useEffect(() => {
    callbacksRef.current = { onCommit, onDragStateChange, onPreviewChange };
  }, [onCommit, onDragStateChange, onPreviewChange]);

  useEffect(() => {
    if (!isDragging) {
      latestDragValueRef.current = value;
    }
  }, [isDragging, value]);

  const previewFromClientX = useCallback(
    (clientX: number) => {
      const bounds = dragBoundsRef.current;
      if (!bounds) return;

      const nextValue = getSliderValueFromClientX(clientX, bounds, max);
      latestDragValueRef.current = nextValue;
      callbacksRef.current.onPreviewChange(nextValue);
    },
    [max],
  );

  const finishDrag = useCallback((shouldCommit: boolean) => {
    const nextValue = latestDragValueRef.current;

    dragBoundsRef.current = null;
    setIsDragging(false);
    callbacksRef.current.onDragStateChange(false);

    if (shouldCommit) {
      callbacksRef.current.onCommit(nextValue);
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      previewFromClientX(event.clientX);
    };
    const handlePointerUp = (event: PointerEvent) => {
      event.preventDefault();
      previewFromClientX(event.clientX);
      finishDrag(true);
    };
    const handlePointerCancel = () => finishDrag(false);

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
    window.addEventListener("blur", handlePointerCancel);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerCancel);
      window.removeEventListener("blur", handlePointerCancel);
    };
  }, [finishDrag, isDragging, previewFromClientX]);

  const beginDrag = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;

      const bounds = sliderRef.current?.getBoundingClientRect();
      if (!bounds || bounds.width === 0) return;

      event.preventDefault();
      dragBoundsRef.current = bounds;
      setIsDragging(true);
      callbacksRef.current.onDragStateChange(true);
      previewFromClientX(event.clientX);
    },
    [disabled, previewFromClientX],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      const step = event.shiftKey ? 10 : 1;
      let nextValue: number | null = null;

      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        nextValue = clampSliderValue(activeValue - step, max);
      } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
        nextValue = clampSliderValue(activeValue + step, max);
      } else if (event.key === "Home") {
        nextValue = 0;
      } else if (event.key === "End") {
        nextValue = max;
      }

      if (nextValue == null) return;

      event.preventDefault();
      latestDragValueRef.current = nextValue;
      callbacksRef.current.onPreviewChange(nextValue);
      callbacksRef.current.onCommit(nextValue);
    },
    [activeValue, disabled, max],
  );

  return (
    <div
      data-slot="style-guide-color-hue"
      className={cn(
        "relative w-full",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div
        data-slot="style-guide-color-hue-rail"
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
        style={{ background: railBackground }}
      />
      <div
        aria-label={label}
        aria-valuemax={max}
        aria-valuemin={0}
        aria-valuenow={activeValue}
        className={cn(
          "relative h-[18px] w-full touch-none cursor-pointer select-none [--slider-active-color:var(--foreground)] [--slider-track-color:transparent]",
          disabled && "cursor-not-allowed",
        )}
        data-slot="slider"
        data-variant="continuous"
        onKeyDown={handleKeyDown}
        onPointerDown={beginDrag}
        ref={sliderRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
      >
        <div
          className="group/slider-control relative flex h-[18px] w-full touch-none items-center select-none"
          data-orientation="horizontal"
          data-slot="slider-control"
        >
          <div
            className="group/slider-track relative h-px w-full grow overflow-visible rounded-full bg-[color:var(--slider-track-color)] select-none"
            data-slot="slider-track"
          />
          <div
            className="group/slider-thumb absolute top-1/2 block size-[9px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full select-none before:absolute before:top-1/2 before:left-1/2 before:block before:size-[18px] before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']"
            data-dragging={isDragging ? "" : undefined}
            data-slot="slider-thumb"
            style={{ left: `${valuePercent}%` }}
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-0 block rounded-full bg-[color:var(--slider-active-color)] transition-[scale,background-color] duration-200 ease-out motion-reduce:transition-none",
                disabled
                  ? null
                  : "group-hover/slider-thumb:scale-[1.4] group-data-[dragging]/slider-thumb:scale-[1.4]",
              )}
              data-slot="slider-dot"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type ColorFooterProps = {
  resolvedHexInputId: string;
  hexInputLabel: string;
  disabled: boolean;
  draftHexValue: string;
  onHexFocus: () => void;
  onHexChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onHexBlur: () => void;
  onHexKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onColorValueFocus: () => void;
  onColorValueChange: (nextHex: string) => void;
  onColorValueBlur: () => void;
  mode: ColorFormatMode;
  onModeChange: (nextMode: ColorFormatMode) => void;
  showOpacity?: boolean;
};

const COLOR_FORMAT_MODES = [
  { label: "Hex", value: "hex" },
  { label: "RGB", value: "rgb" },
  { label: "HSL", value: "hsl" },
  { label: "HSB", value: "hsb" },
] as const satisfies ReadonlyArray<{ label: string; value: ColorFormatMode }>;

const colorFormatSelectWidth = `calc(${Math.max(
  ...COLOR_FORMAT_MODES.map((formatMode) => formatMode.label.length),
)}ch + 2rem)`;

const colorValueInputGroupClassName = "h-6 min-w-0 flex-1";

const colorValueInputClassName =
  "min-w-0 px-1 text-center text-xs font-mono";

const colorValueCellSeparatorClassName =
  "pointer-events-none absolute top-0 bottom-0 w-px bg-[color:color-mix(in_oklab,var(--border)_12%,transparent)]";

function toColorFormatMode(value: unknown): ColorFormatMode | null {
  const candidate =
    typeof value === "string"
      ? value
      : value && typeof value === "object" && "value" in value
        ? String(value.value)
        : null;

  return COLOR_FORMAT_MODES.some((formatMode) => formatMode.value === candidate)
    ? (candidate as ColorFormatMode)
    : null;
}

function ColorFormatSelect({
  disabled,
  mode,
  onModeChange,
}: {
  disabled: boolean;
  mode: ColorFormatMode;
  onModeChange: (nextMode: ColorFormatMode) => void;
}) {
  return (
    <div className="min-w-0 shrink-0" style={{ width: colorFormatSelectWidth }}>
      <StaticSelect
        disabled={disabled}
        options={COLOR_FORMAT_MODES}
        scrollFadeValue={false}
        size="sm"
        triggerClassName="text-[11px]"
        value={mode}
        onValueChange={(nextMode) => {
          const resolvedMode = toColorFormatMode(nextMode);

          if (resolvedMode) onModeChange(resolvedMode);
        }}
      />
    </div>
  );
}

function ColorValueCells({
  channels,
  disabled,
  mode,
  onColorValueBlur,
  onColorValueChange,
  onColorValueFocus,
  showOpacity,
}: {
  channels: ColorChannels;
  disabled: boolean;
  mode: ColorFormatMode;
  onColorValueBlur: () => void;
  onColorValueChange: (nextHex: string) => void;
  onColorValueFocus: () => void;
  showOpacity: boolean;
}) {
  if (mode === "css") {
    const [red, green, blue] = channels.rgb;

    return (
      <InputGroup
        data-slot="style-guide-color-value-cells"
        className={colorValueInputGroupClassName}
        size="sm"
      >
        <InputGroupInput
          aria-label="CSS color value"
          className="min-w-0 px-2 font-mono text-xs"
          disabled={disabled}
          readOnly
          value={`rgb(${red} ${green} ${blue})`}
        />
      </InputGroup>
    );
  }

  const colorValues =
    mode === "rgb"
      ? channels.rgb
      : mode === "hsl"
        ? channels.hsl
        : channels.hsb;
  const values = showOpacity ? [...colorValues, 100] : colorValues;

  return (
    <InputGroup
      data-slot="style-guide-color-value-cells"
      className={colorValueInputGroupClassName}
      size="sm"
    >
      <div className="relative flex h-full min-w-0 flex-1">
        {values.slice(1).map((_, index) => (
          <span
            aria-hidden
            className={colorValueCellSeparatorClassName}
            key={`${mode}-separator-${index}`}
            style={{ left: `${((index + 1) / values.length) * 100}%` }}
          />
        ))}
        {values.map((value, index) => {
          const isAlphaChannel = index === 3;

          return (
            <InputGroupInput
              aria-label={`${mode.toUpperCase()} channel ${index + 1}`}
              className={colorValueInputClassName}
              disabled={disabled}
              inputMode="numeric"
              key={`${mode}-${index}`}
              readOnly={isAlphaChannel}
              value={String(value)}
              onBlur={isAlphaChannel ? undefined : onColorValueBlur}
              onChange={(event) => {
                const nextHex = getEditableChannelHex({
                  channels,
                  channelIndex: index,
                  mode,
                  rawValue: event.target.value,
                });

                if (nextHex) onColorValueChange(nextHex);
              }}
              onFocus={
                isAlphaChannel
                  ? undefined
                  : () => {
                      onColorValueFocus();
                    }
              }
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  event.currentTarget.blur();
                }
              }}
            />
          );
        })}
      </div>
      {showOpacity ? (
        <InputGroupAddon align="inline-end" className="pr-1.5 pl-0">
          <InputGroupText>%</InputGroupText>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export function ColorFooter({
  resolvedHexInputId,
  hexInputLabel,
  disabled,
  draftHexValue,
  onHexFocus,
  onHexChange,
  onHexBlur,
  onHexKeyDown,
  onColorValueFocus,
  onColorValueChange,
  onColorValueBlur,
  mode,
  onModeChange,
  showOpacity = false,
}: ColorFooterProps) {
  const channels = useMemo(
    () => getColorChannels(draftHexValue),
    [draftHexValue],
  );

  return (
    <div
      data-slot="style-guide-color-footer"
      className="flex w-full shrink-0 items-center border-t border-[color:color-mix(in_oklab,var(--border)_6%,transparent)] px-2 py-3"
    >
      <div
        data-slot="style-guide-color-footer-row"
        className="flex w-full min-w-0 items-center gap-1.5"
      >
        <ColorFormatSelect
          disabled={disabled}
          mode={mode}
          onModeChange={onModeChange}
        />
        {mode === "hex" ? (
          <InputGroup className="h-6 min-w-0 flex-1" size="sm">
            <InputGroupInput
              id={resolvedHexInputId}
              type="text"
              inputMode="text"
              spellCheck={false}
              autoCapitalize="characters"
              autoCorrect="off"
              disabled={disabled}
              aria-label={hexInputLabel}
              className="min-w-0 font-mono text-xs"
              value={draftHexValue}
              onFocus={onHexFocus}
              onChange={onHexChange}
              onBlur={onHexBlur}
              onKeyDown={onHexKeyDown}
            />
          </InputGroup>
        ) : (
          <ColorValueCells
            channels={channels}
            disabled={disabled}
            mode={mode}
            onColorValueBlur={onColorValueBlur}
            onColorValueChange={onColorValueChange}
            onColorValueFocus={onColorValueFocus}
            showOpacity={showOpacity}
          />
        )}
      </div>
    </div>
  );
}
