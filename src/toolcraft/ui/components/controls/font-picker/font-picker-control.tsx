"use client";

import * as React from "react";
import {
  CheckIcon,
  MagnifyingGlassIcon,
} from "@phosphor-icons/react";

import { ControlFieldLabel } from "../../control-layout";
import {
  Field,
  Input,
  Popover,
  PopoverContent,
  ScrollFade,
  Slider,
  PopoverTrigger,
  SelectTriggerButton,
} from "../../primitives";
import { cn } from "../../../lib/utils";
import type { ControlChangeMeta, ControlValueChangeHandler } from "../control-types";
import {
  filterFontPickerFonts,
  FONT_PICKER_FILTER_OPTIONS,
  getDefaultFontPickerFontId,
  getFontPickerFontById,
  resolveFontPickerFontId,
  type FontPickerFontCatalogEntry,
  type FontPickerFontFilterValue,
} from "./font-catalog";
import {
  queueFontPickerPreviewLoad,
  queueFontPickerPreviewLoadBatch,
} from "./font-preview-loader";
import { ColorOpacityControl } from "../color";
import { StaticSelect } from "../select";
import { useMeasuredElementWidth } from "../use-measured-element-width";
import { useHoverIntent } from "./use-hover-intent";

export type FontPickerLetterSpacingPreset =
  | "tight"
  | "tighter"
  | "normal"
  | "wide"
  | "wider"
  | "widest";

export type FontPickerLineHeightPreset =
  | "loose"
  | "none"
  | "normal"
  | "relaxed"
  | "snug"
  | "tight";

export type FontPickerTextCasePreset =
  | "capitalize"
  | "lowercase"
  | "original"
  | "titleCase"
  | "uppercase";

export type FontPickerValue = {
  color: string;
  fontId: string;
  fontSize: number;
  fontWeight: string;
  letterSpacing: FontPickerLetterSpacingPreset;
  lineHeight: FontPickerLineHeightPreset;
  opacity: number;
  textCase: FontPickerTextCasePreset;
};

export type FontPickerControlProps = {
  defaultValue?: Partial<FontPickerValue> | string;
  disabled?: boolean;
  name: string;
  onPreviewChange?: (nextFontId: string | null) => void;
  onValueChange?: ControlValueChangeHandler<FontPickerValue>;
  searchPlaceholder?: string;
  value?: Partial<FontPickerValue> | string;
};

const fontItemHeightPx = 36;
const fontItemGapPx = 1;
const fontVirtualItemStepPx = fontItemHeightPx + fontItemGapPx;
const fontListOverscanItems = 6;
const fontListHeightWithFooterPx = 240;
const fontPreloadBufferAheadItems = 60;
const fontPreloadBufferBehindItems = 30;
const defaultFontPickerFontSizePx = 16;
const defaultFontPickerColor = "#FFFFFF";
const defaultFontPickerOpacity = 100;
const minFontPickerFontSizePx = 1;

const menuItemInteractionClassName =
  "hover:bg-[color:color-mix(in_oklab,var(--muted-foreground)_10%,transparent)] hover:text-[color:var(--foreground)] focus:bg-[color:color-mix(in_oklab,var(--muted-foreground)_10%,transparent)] focus:text-[color:var(--foreground)]";

const letterSpacingSteps: Array<{
  label: string;
  numericValue: number;
  value: FontPickerLetterSpacingPreset;
}> = [
  { label: "Tighter", numericValue: -0.05, value: "tighter" },
  { label: "Tight", numericValue: -0.025, value: "tight" },
  { label: "Normal", numericValue: 0, value: "normal" },
  { label: "Wide", numericValue: 0.025, value: "wide" },
  { label: "Wider", numericValue: 0.05, value: "wider" },
  { label: "Widest", numericValue: 0.1, value: "widest" },
];

const lineHeightSteps: Array<{
  label: string;
  numericValue: number;
  value: FontPickerLineHeightPreset;
}> = [
  { label: "None", numericValue: 1, value: "none" },
  { label: "Tight", numericValue: 1.25, value: "tight" },
  { label: "Snug", numericValue: 1.375, value: "snug" },
  { label: "Normal", numericValue: 1.5, value: "normal" },
  { label: "Relaxed", numericValue: 1.625, value: "relaxed" },
  { label: "Loose", numericValue: 2, value: "loose" },
];

const textCaseOptions: Array<{
  label: string;
  value: FontPickerTextCasePreset;
}> = [
  { label: "As typed", value: "original" },
  { label: "Uppercase", value: "uppercase" },
  { label: "Lowercase", value: "lowercase" },
  { label: "Capitalize", value: "capitalize" },
  { label: "Title Case", value: "titleCase" },
];

function isFontPickerTextCase(value: unknown): value is FontPickerTextCasePreset {
  return textCaseOptions.some((option) => option.value === value);
}

function getStepByValue<Value extends string>(
  steps: readonly { numericValue: number; value: Value }[],
  value: Value,
  fallbackValue: Value,
): { numericValue: number; value: Value } {
  const step = steps.find((item) => item.value === value);
  if (step) {
    return step;
  }

  return steps.find((item) => item.value === fallbackValue) ?? steps[0]!;
}

function getStepIndexByValue<Value extends string>(
  steps: readonly { value: Value }[],
  value: Value,
  fallbackValue: Value,
): number {
  const stepIndex = steps.findIndex((item) => item.value === value);
  if (stepIndex >= 0) {
    return stepIndex;
  }

  const fallbackIndex = steps.findIndex((item) => item.value === fallbackValue);
  return fallbackIndex >= 0 ? fallbackIndex : 0;
}

function normalizeFontPickerValue(
  value: FontPickerControlProps["value"],
): FontPickerValue {
  const fontId = resolveFontPickerFontId(
    typeof value === "string" ? value : value?.fontId,
  );
  const font = getFontPickerFontById(fontId);

  if (typeof value === "string") {
    return {
      color: defaultFontPickerColor,
      fontId,
      fontSize: defaultFontPickerFontSizePx,
      fontWeight: resolveFontPickerFontWeight(font),
      letterSpacing: "normal",
      lineHeight: "normal",
      opacity: defaultFontPickerOpacity,
      textCase: "original",
    };
  }

  return {
    color: normalizeFontPickerColor(value?.color),
    fontId,
    fontSize: normalizeFontPickerFontSize(value?.fontSize),
    fontWeight: resolveFontPickerFontWeight(font, value?.fontWeight),
    letterSpacing: value?.letterSpacing ?? "normal",
    lineHeight: value?.lineHeight ?? "normal",
    opacity: normalizeFontPickerOpacity(value?.opacity),
    textCase: isFontPickerTextCase(value?.textCase) ? value.textCase : "original",
  };
}

function normalizeFontPickerColor(value: unknown): string {
  return typeof value === "string" && value.trim() ? value : defaultFontPickerColor;
}

function normalizeFontPickerOpacity(value: unknown): number {
  const nextOpacity =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));

  return Number.isFinite(nextOpacity)
    ? Math.min(100, Math.max(0, Math.round(nextOpacity)))
    : defaultFontPickerOpacity;
}

function getFontPickerWeightOptions(
  font: FontPickerFontCatalogEntry | null,
): string[] {
  const weights = font?.weights.length ? font.weights : ["400"];

  return Array.from(new Set(weights.map((weight) => String(weight)))).sort(
    (left, right) => Number(left) - Number(right),
  );
}

function resolveFontPickerFontWeight(
  font: FontPickerFontCatalogEntry | null,
  weight?: string,
): string {
  const weights = getFontPickerWeightOptions(font);
  const requestedWeight = typeof weight === "string" ? weight : undefined;

  if (requestedWeight && weights.includes(requestedWeight)) {
    return requestedWeight;
  }

  if (weights.includes("400")) {
    return "400";
  }

  const requestedNumericWeight = Number(requestedWeight ?? 400);
  if (Number.isFinite(requestedNumericWeight)) {
    return weights.reduce((closest, current) => {
      return Math.abs(Number(current) - requestedNumericWeight) <
        Math.abs(Number(closest) - requestedNumericWeight)
        ? current
        : closest;
    }, weights[0] ?? "400");
  }

  return weights[0] ?? "400";
}

function normalizeFontPickerFontSize(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultFontPickerFontSizePx;
  }

  return Math.max(minFontPickerFontSizePx, Math.round(value));
}

function getFontFamilyStyle(font: FontPickerFontCatalogEntry | null): React.CSSProperties | undefined {
  return font
    ? {
        fontFamily: `"${font.family}", ui-sans-serif, system-ui, sans-serif`,
      }
    : undefined;
}

function LetterSpacingIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden
      className="size-4 shrink-0"
      data-slot="font-picker-footer-icon"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#D9D9D9" height="16" width="1" />
      <rect fill="#D9D9D9" height="16" width="1" x="15" />
      <path
        d="M5.18182 13H4L7.41818 3H8.58182L12 13H10.8182L8.03636 4.58203H7.96364L5.18182 13ZM5.61818 9.09375H10.3818V10.168H5.61818V9.09375Z"
        fill="white"
      />
    </svg>
  );
}

function LineHeightIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden
      className="size-4 shrink-0"
      data-slot="font-picker-footer-icon"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        fill="#D9D9D9"
        height="16"
        transform="rotate(90 16 0)"
        width="1"
        x="16"
      />
      <rect
        fill="#D9D9D9"
        height="16"
        transform="rotate(90 16 15)"
        width="1"
        x="16"
        y="15"
      />
      <path
        d="M5.18182 13H4L7.41818 3H8.58182L12 13H10.8182L8.03636 4.58203H7.96364L5.18182 13ZM5.61818 9.09375H10.3818V10.168H5.61818V9.09375Z"
        fill="white"
      />
    </svg>
  );
}

function FontPickerFooterControl({
  disabled,
  icon,
  onValueChange,
  steps,
  title,
  valueIndex,
}: {
  disabled: boolean;
  icon: React.ReactNode;
  onValueChange: (nextValue: number) => void;
  steps: readonly unknown[];
  title: string;
  valueIndex: number;
}): React.JSX.Element {
  const markerValues = steps.map((_, index) => index);
  const min = 0;
  const max = Math.max(0, markerValues.length - 1);
  const currentValue = Math.min(max, Math.max(min, Math.round(valueIndex)));

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2"
      data-slot="font-picker-footer-control"
    >
      {icon}
      <div className="min-w-0 flex-1" data-slot="font-picker-footer-slider">
        <Slider
          className="[&_[data-slot=slider-range]]:transition-none [&_[data-slot=slider-thumb]]:transition-none"
          disabled={disabled}
          getAriaLabel={() => title}
          markerValues={markerValues}
          max={max}
          min={min}
          onValueChange={(nextValue) => {
            const resolvedValue = Array.isArray(nextValue) ? nextValue[0] : nextValue;

            if (typeof resolvedValue === "number") {
              onValueChange(Math.min(max, Math.max(min, Math.round(resolvedValue))));
            }
          }}
          showFill
          snapValues={markerValues}
          step={1}
          value={[currentValue]}
          variant="discrete"
        />
      </div>
    </div>
  );
}

export function FontPickerControl({
  defaultValue,
  disabled = false,
  name,
  onPreviewChange,
  onValueChange,
  searchPlaceholder = "Find font",
  value,
}: FontPickerControlProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] =
    React.useState<FontPickerFontFilterValue>("sans-serif");
  const [scrollTop, setScrollTop] = React.useState(0);
  const [viewportHeight, setViewportHeight] = React.useState(0);
  const [scrollViewportElement, setScrollViewportElement] =
    React.useState<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const scrollViewportRef = React.useRef<HTMLDivElement | null>(null);
  const previousScrollTopRef = React.useRef(0);
  const scrollDirectionRef = React.useRef<"backward" | "forward">("forward");
  const shouldScrollSelectedOnOpenRef = React.useRef(false);
  const scrollFrameRef = React.useRef<number | null>(null);
  const previewFrameRef = React.useRef<number | null>(null);
  const pendingPreviewFontIdRef = React.useRef<string | null>(null);
  const lastEmittedPreviewFontIdRef = React.useRef<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const familyWeightRowRef = React.useRef<HTMLDivElement | null>(null);
  const familyWeightRowWidth = useMeasuredElementWidth(familyWeightRowRef);
  const normalizedValue = normalizeFontPickerValue(value);
  const normalizedDefaultValue = normalizeFontPickerValue(defaultValue);
  const [fontSizeDraft, setFontSizeDraft] = React.useState(
    String(normalizedValue.fontSize),
  );
  const selectedFont = getFontPickerFontById(normalizedValue.fontId);
  const filteredFonts = React.useMemo(
    () => filterFontPickerFonts(query, category),
    [category, query],
  );
  const selectedFontIndex = React.useMemo(() => {
    if (!selectedFont) {
      return -1;
    }

    return filteredFonts.findIndex((font) => font.id === selectedFont.id);
  }, [filteredFonts, selectedFont]);
  const resolvedViewportHeight =
    viewportHeight > 0 ? viewportHeight : fontListHeightWithFooterPx;
  const selectedFontTop = selectedFontIndex >= 0 ? selectedFontIndex * fontVirtualItemStepPx : 0;
  const selectedFontBottom = selectedFontTop + fontItemHeightPx;
  const selectedFontVisible =
    selectedFontIndex >= 0 &&
    selectedFontBottom > scrollTop &&
    selectedFontTop < scrollTop + resolvedViewportHeight;
  const pinnedSelectedRowSide =
    selectedFont && selectedFontIndex >= 0 && !selectedFontVisible
      ? selectedFontBottom <= scrollTop
        ? "top"
        : "bottom"
      : null;
  const visibleItemCount = Math.max(
    1,
    Math.ceil(resolvedViewportHeight / fontVirtualItemStepPx),
  );
  const virtualStartIndex = Math.max(
    0,
    Math.floor(scrollTop / fontVirtualItemStepPx) - fontListOverscanItems,
  );
  const virtualEndIndex = Math.min(
    filteredFonts.length,
    virtualStartIndex + visibleItemCount + fontListOverscanItems * 2,
  );
  const visibleFonts = React.useMemo(
    () => filteredFonts.slice(virtualStartIndex, virtualEndIndex),
    [filteredFonts, virtualEndIndex, virtualStartIndex],
  );
  const topSpacerHeight = virtualStartIndex * fontVirtualItemStepPx;
  const bottomSpacerHeight = Math.max(
    0,
    (filteredFonts.length - virtualEndIndex) * fontVirtualItemStepPx,
  );
  const emitChange = React.useCallback(
    (nextValue: FontPickerValue, meta?: ControlChangeMeta) => {
      onValueChange?.(nextValue, meta);
    },
    [onValueChange],
  );

  React.useEffect(() => {
    setFontSizeDraft(String(normalizedValue.fontSize));
  }, [normalizedValue.fontSize]);

  function commitFontSizeDraft(nextDraft = fontSizeDraft): void {
    const nextSize =
      nextDraft.trim() === ""
        ? normalizedDefaultValue.fontSize
        : normalizeFontPickerFontSize(Number(nextDraft));

    setFontSizeDraft(String(nextSize));

    if (nextSize !== normalizedValue.fontSize) {
      emitChange(
        {
          ...normalizedValue,
          fontSize: nextSize,
        },
        { history: "merge" },
      );
    }
  }

  const emitPreviewImmediately = React.useCallback(
    (nextFontId: string | null) => {
      if (disabled) {
        return;
      }

      if (nextFontId !== null && lastEmittedPreviewFontIdRef.current === nextFontId) {
        return;
      }

      lastEmittedPreviewFontIdRef.current = nextFontId;
      onPreviewChange?.(nextFontId);
    },
    [disabled, onPreviewChange],
  );

  const cancelScheduledPreview = React.useCallback(() => {
    if (previewFrameRef.current !== null) {
      window.cancelAnimationFrame(previewFrameRef.current);
      previewFrameRef.current = null;
    }

    pendingPreviewFontIdRef.current = null;
  }, []);

  const emitPreviewChange = React.useCallback(
    (nextFontId: string | null, options?: { immediate?: boolean }) => {
      if (disabled) {
        return;
      }

      if (nextFontId === null || options?.immediate) {
        cancelScheduledPreview();
        emitPreviewImmediately(nextFontId);
        return;
      }

      pendingPreviewFontIdRef.current = nextFontId;
      if (previewFrameRef.current !== null) {
        return;
      }

      previewFrameRef.current = window.requestAnimationFrame(() => {
        previewFrameRef.current = null;
        const scheduledFontId = pendingPreviewFontIdRef.current;
        pendingPreviewFontIdRef.current = null;

        if (scheduledFontId) {
          emitPreviewImmediately(scheduledFontId);
        }
      });
    },
    [cancelScheduledPreview, disabled, emitPreviewImmediately],
  );

  const resetViewportScroll = React.useCallback(() => {
    const viewportElement = scrollViewportRef.current;
    if (viewportElement) {
      viewportElement.scrollTop = 0;
    }

    previousScrollTopRef.current = 0;
    scrollDirectionRef.current = "forward";
    setScrollTop(0);
  }, []);

  const scrollToFontIndex = React.useCallback((index: number) => {
    if (index < 0 || !scrollViewportRef.current) {
      return;
    }

    const nextScrollTop = index * fontVirtualItemStepPx;
    scrollDirectionRef.current =
      nextScrollTop >= scrollViewportRef.current.scrollTop
        ? "forward"
        : "backward";
    previousScrollTopRef.current = nextScrollTop;
    scrollViewportRef.current.scrollTop = nextScrollTop;
    setScrollTop(nextScrollTop);
  }, []);

  const warmFontPreview = React.useCallback(
    (
      fontEntry: FontPickerFontCatalogEntry | null | undefined,
      priority: "high" | "normal" = "normal",
    ) => {
      if (!fontEntry) {
        return;
      }

      queueFontPickerPreviewLoad(fontEntry, { priority });
    },
    [],
  );

  const queueBufferedPreload = React.useCallback(
    (direction: "backward" | "forward") => {
      if (!filteredFonts.length) {
        return;
      }

      const backwardItems =
        direction === "forward"
          ? fontPreloadBufferBehindItems
          : fontPreloadBufferAheadItems;
      const forwardItems =
        direction === "forward"
          ? fontPreloadBufferAheadItems
          : fontPreloadBufferBehindItems;
      const preloadStart = Math.max(0, virtualStartIndex - backwardItems);
      const preloadEnd = Math.min(filteredFonts.length, virtualEndIndex + forwardItems);

      if (preloadStart >= preloadEnd) {
        return;
      }

      queueFontPickerPreviewLoadBatch(filteredFonts.slice(preloadStart, preloadEnd), {
        priority: "normal",
      });
    },
    [filteredFonts, virtualEndIndex, virtualStartIndex],
  );

  const handleHoverPreview = React.useCallback(
    (font: FontPickerFontCatalogEntry) => {
      warmFontPreview(font, "high");
      emitPreviewChange(font.id);
    },
    [emitPreviewChange, warmFontPreview],
  );

  const {
    cancelIntent: cancelHoverPreviewIntent,
    scheduleIntent: scheduleHoverPreviewIntent,
  } = useHoverIntent({ onIntent: handleHoverPreview });

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        shouldScrollSelectedOnOpenRef.current = true;
        setQuery("");
        setCategory(selectedFont?.category ?? "sans-serif");
        resetViewportScroll();
      }

      setOpen(nextOpen);

      if (!nextOpen) {
        shouldScrollSelectedOnOpenRef.current = false;
        cancelHoverPreviewIntent();
        emitPreviewChange(null, { immediate: true });
        window.requestAnimationFrame(() => {
          if (document.activeElement === triggerRef.current) {
            triggerRef.current?.blur();
          }
        });
      }
    },
    [
      cancelHoverPreviewIntent,
      emitPreviewChange,
      resetViewportScroll,
      selectedFont?.category,
    ],
  );

  React.useEffect(() => {
    if (selectedFont) {
      warmFontPreview(selectedFont, "high");
    }
  }, [selectedFont, warmFontPreview]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    if (selectedFont) {
      warmFontPreview(selectedFont, "high");
    }

    queueFontPickerPreviewLoadBatch(visibleFonts, { priority: "high" });
  }, [open, selectedFont, visibleFonts, warmFontPreview]);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    queueBufferedPreload(scrollDirectionRef.current);
  }, [open, queueBufferedPreload, scrollTop]);

  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  React.useEffect(() => {
    if (!open || !shouldScrollSelectedOnOpenRef.current || selectedFontIndex < 0) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      shouldScrollSelectedOnOpenRef.current = false;
      scrollToFontIndex(selectedFontIndex);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, scrollToFontIndex, selectedFontIndex]);

  React.useEffect(() => {
    if (!open || !scrollViewportElement) {
      return undefined;
    }

    const viewportElement = scrollViewportElement;
    const syncMetrics = () => {
      setViewportHeight(
        viewportElement.clientHeight > 0
          ? viewportElement.clientHeight
          : fontListHeightWithFooterPx,
      );
      setScrollTop(viewportElement.scrollTop);
    };
    const handleScroll = () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        const nextScrollTop = viewportElement.scrollTop;
        scrollDirectionRef.current =
          nextScrollTop >= previousScrollTopRef.current ? "forward" : "backward";
        previousScrollTopRef.current = nextScrollTop;
        setScrollTop(nextScrollTop);
      });
    };

    syncMetrics();
    viewportElement.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", syncMetrics);

    return () => {
      viewportElement.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", syncMetrics);

      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
    };
  }, [open, scrollViewportElement]);

  React.useEffect(() => {
    return () => {
      cancelHoverPreviewIntent();
      cancelScheduledPreview();
      onPreviewChange?.(null);
    };
  }, [cancelHoverPreviewIntent, cancelScheduledPreview, onPreviewChange]);

  const attachScrollViewport = React.useCallback(
    (node: HTMLDivElement | null) => {
      scrollViewportRef.current = node;
      setScrollViewportElement(node);
    },
    [],
  );
  const clearHoverPreview = React.useCallback(() => {
    cancelHoverPreviewIntent();
    emitPreviewChange(null, { immediate: true });
  }, [cancelHoverPreviewIntent, emitPreviewChange]);
  const selectedFamily = selectedFont?.family ?? getFontPickerFontById(getDefaultFontPickerFontId())?.family ?? "Inter";
  const fontWeightOptions = getFontPickerWeightOptions(selectedFont);
  const selectedFontPreviewStyle = selectedFont
    ? {
        ...getFontFamilyStyle(selectedFont),
        fontWeight: normalizedValue.fontWeight,
      }
    : undefined;
  const letterSpacingStep = getStepByValue(
    letterSpacingSteps,
    normalizedValue.letterSpacing,
    "normal",
  );
  const letterSpacingStepIndex = getStepIndexByValue(
    letterSpacingSteps,
    normalizedValue.letterSpacing,
    "normal",
  );
  const lineHeightStep = getStepByValue(
    lineHeightSteps,
    normalizedValue.lineHeight,
    "normal",
  );
  const lineHeightStepIndex = getStepIndexByValue(
    lineHeightSteps,
    normalizedValue.lineHeight,
    "normal",
  );

  return (
    <Field className="min-w-0 !gap-y-[9px]">
      <div
        className="grid min-w-0 grid-cols-2 gap-2"
        data-slot="font-picker-family-weight-row"
        ref={familyWeightRowRef}
      >
        <div
          className="min-w-0 space-y-1.5"
          data-slot="font-picker-family-field"
        >
          <ControlFieldLabel>{name}</ControlFieldLabel>
          <Popover onOpenChange={handleOpenChange} open={open}>
            <PopoverTrigger
              data-placeholder-tone="muted"
              data-radius="default"
              data-slot="select-trigger"
              data-size="default"
              data-variant="default"
              render={
                <SelectTriggerButton
                  aria-label={`Select ${name}`}
                  className="w-full justify-between rounded-lg"
                  disabled={disabled}
                  open={open}
                  ref={triggerRef}
                  title={selectedFamily}
                  type="button"
                />
              }
            >
              <span
                className="flex min-w-0 flex-1 text-left"
                data-slot="select-value"
              >
                <ScrollFade
                  className="no-scrollbar min-w-0"
                  containerClassName="min-w-0 flex-1"
                  preset="compact"
                  side="right"
                  watch={[selectedFamily, normalizedValue.fontId]}
                >
                  <span
                    className="block min-w-max whitespace-nowrap pr-2"
                    data-slot="font-picker-trigger-value"
                    style={selectedFontPreviewStyle}
                    title={selectedFamily}
                  >
                    {selectedFamily}
                  </span>
                </ScrollFade>
              </span>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-(--anchor-width) gap-0 overflow-hidden rounded-lg border border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] bg-[color:color-mix(in_oklab,var(--popover)_88%,transparent)] p-0 text-[color:var(--popover-foreground)] shadow-sm backdrop-blur-[12.5px]"
              finalFocus={false}
              sideOffset={6}
              style={
                familyWeightRowWidth
                  ? { width: familyWeightRowWidth }
                  : undefined
              }
            >
              <div>
                <div className="border-b border-[color:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)]">
                  <div className="relative h-10">
                    <MagnifyingGlassIcon
                      aria-hidden
                      className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[color:var(--muted-foreground)]"
                    />
                    <Input
                      ref={searchInputRef}
                      className="h-10 border-none bg-transparent pl-[34px] text-[13px] font-normal focus-visible:bg-transparent focus-visible:ring-0"
                      name="font-search"
                      onChange={(event) => {
                        resetViewportScroll();
                        setQuery(event.target.value);
                      }}
                      placeholder={searchPlaceholder}
                      type="text"
                      value={query}
                    />
                  </div>
                </div>
                <div className="relative before:absolute before:inset-x-0 before:bottom-0 before:h-px before:bg-[color:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)]">
                  <div className="flex h-10 w-full items-center justify-between overflow-x-hidden px-3">
                    {FONT_PICKER_FILTER_OPTIONS.map((option) => {
                      const active = category === option.value;

                      return (
                        <button
                          className={cn(
                            "relative z-10 h-10 shrink-0 px-0 text-xs font-normal leading-none tracking-normal text-[color:var(--muted-foreground)] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[color:var(--foreground)] after:opacity-0 after:transition-opacity after:duration-200 after:ease-in-out after:content-[''] hover:text-[color:color-mix(in_oklab,var(--foreground)_80%,transparent)]",
                            active &&
                              "text-[color:var(--foreground)] after:opacity-100",
                          )}
                          data-state={active ? "active" : "inactive"}
                          key={option.value}
                          onClick={() => {
                            resetViewportScroll();
                            setCategory(option.value);
                          }}
                          type="button"
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div
                className="relative isolate pb-1"
                onMouseLeave={clearHoverPreview}
              >
                <div className="px-1 pt-1">
                  <div className="relative h-60">
                    <ScrollFade
                      className="toolcraft-scrollbar h-full"
                      containerClassName="h-full"
                      data-slot="font-picker-list-viewport"
                      height={24}
                      preset="default"
                      showOppositeSide
                      side="bottom"
                      viewportRef={attachScrollViewport}
                      watch={[
                        filteredFonts.length,
                        query,
                        category,
                        virtualStartIndex,
                        virtualEndIndex,
                      ]}
                    >
                      {visibleFonts.length ? (
                        <div
                          className="flex flex-col gap-px"
                          data-slot="font-picker-list"
                        >
                          {topSpacerHeight > 0 ? (
                            <div
                              aria-hidden
                              style={{ height: `${topSpacerHeight}px` }}
                            />
                          ) : null}
                          {visibleFonts.map((font) => {
                            const selected = font.id === normalizedValue.fontId;

                            return (
                              <button
                                className={cn(
                                  "flex min-h-9 w-full items-center justify-between gap-3 rounded-sm px-2.5 text-left text-sm font-normal text-[color:color-mix(in_oklab,var(--foreground)_85%,transparent)] outline-none",
                                  menuItemInteractionClassName,
                                  selected &&
                                    "bg-[color:color-mix(in_oklab,var(--muted-foreground)_5%,transparent)] font-medium text-[color:var(--foreground)] hover:bg-[color:color-mix(in_oklab,var(--muted-foreground)_5%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--muted-foreground)_5%,transparent)]",
                                )}
                                key={font.id}
                                onBlur={clearHoverPreview}
                                onClick={() => {
                                  cancelHoverPreviewIntent();
                                  warmFontPreview(font, "high");
                                  emitPreviewChange(null, { immediate: true });
                                  emitChange({
                                    ...normalizedValue,
                                    fontId: font.id,
                                    fontWeight: resolveFontPickerFontWeight(
                                      font,
                                      normalizedValue.fontWeight,
                                    ),
                                  });
                                }}
                                onFocus={() => {
                                  cancelHoverPreviewIntent();
                                  handleHoverPreview(font);
                                }}
                                onMouseEnter={() =>
                                  scheduleHoverPreviewIntent(font)
                                }
                                type="button"
                              >
                                <span
                                  className="min-w-0 truncate text-sm"
                                  style={getFontFamilyStyle(font)}
                                >
                                  {font.family}
                                </span>
                                {selected ? (
                                  <CheckIcon
                                    aria-hidden
                                    className="size-3.5 shrink-0 text-[color:var(--foreground)]"
                                    weight="bold"
                                  />
                                ) : null}
                              </button>
                            );
                          })}
                          {bottomSpacerHeight > 0 ? (
                            <div
                              aria-hidden
                              style={{ height: `${bottomSpacerHeight}px` }}
                            />
                          ) : null}
                        </div>
                      ) : null}
                    </ScrollFade>
                    {!visibleFonts.length ? (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="rounded-sm px-2 text-center text-xs text-[color:var(--muted-foreground)]">
                          No fonts match your search.
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                {pinnedSelectedRowSide ? (
                  <div
                    className={cn(
                      "absolute inset-x-0 z-20 overflow-hidden bg-[color:color-mix(in_oklab,var(--popover)_90%,transparent)]",
                      pinnedSelectedRowSide === "top"
                        ? "top-0 border-b border-[color:color-mix(in_oklab,var(--foreground)_10%,transparent)]"
                        : "bottom-0 border-t border-[color:color-mix(in_oklab,var(--foreground)_10%,transparent)]",
                    )}
                  >
                    <button
                      aria-label={`Jump to selected font ${selectedFont?.family ?? ""}`}
                      className={cn(
                        "flex min-h-9 w-full items-center justify-between px-[14px] text-left text-sm font-medium text-[color:var(--foreground)] outline-none",
                        menuItemInteractionClassName,
                      )}
                      data-side={pinnedSelectedRowSide}
                      data-slot="selected-font-jump-row"
                      onClick={() => scrollToFontIndex(selectedFontIndex)}
                      onMouseDown={(event) => event.preventDefault()}
                      type="button"
                    >
                      <span
                        className="min-w-0 flex-1 truncate text-sm"
                        style={selectedFontPreviewStyle}
                      >
                        {selectedFont?.family ?? ""}
                      </span>
                      <CheckIcon
                        aria-hidden
                        className="size-3.5 shrink-0"
                        weight="bold"
                      />
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="flex h-11 shrink-0 items-center gap-5 border-t border-[color:color-mix(in_oklab,var(--muted-foreground)_20%,transparent)] px-3.5">
                <FontPickerFooterControl
                  disabled={disabled}
                  icon={<LetterSpacingIcon />}
                  onValueChange={(nextIndex) => {
                    const nextStep =
                      letterSpacingSteps[nextIndex] ?? letterSpacingStep;

                    emitChange(
                      {
                        ...normalizedValue,
                        letterSpacing: nextStep.value,
                      },
                      { history: "merge" },
                    );
                  }}
                  steps={letterSpacingSteps}
                  title="Letter spacing"
                  valueIndex={letterSpacingStepIndex}
                />
                <FontPickerFooterControl
                  disabled={disabled}
                  icon={<LineHeightIcon />}
                  onValueChange={(nextIndex) => {
                    const nextStep =
                      lineHeightSteps[nextIndex] ?? lineHeightStep;

                    emitChange(
                      {
                        ...normalizedValue,
                        lineHeight: nextStep.value,
                      },
                      { history: "merge" },
                    );
                  }}
                  steps={lineHeightSteps}
                  title="Line height"
                  valueIndex={lineHeightStepIndex}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div
          className="min-w-0 space-y-1.5"
          data-slot="font-picker-weight-field"
        >
          <ControlFieldLabel>Weight</ControlFieldLabel>
          <StaticSelect
            ariaLabel="Font weight"
            disabled={disabled || fontWeightOptions.length <= 1}
            onValueChange={(nextWeight) => {
              emitChange(
                {
                  ...normalizedValue,
                  fontWeight: resolveFontPickerFontWeight(
                    selectedFont,
                    nextWeight,
                  ),
                },
                { history: "merge" },
              );
            }}
            options={fontWeightOptions.map((weight) => ({
              label: weight,
              value: weight,
            }))}
            scrollFadeValue={false}
            triggerClassName="min-w-0"
            value={normalizedValue.fontWeight}
          />
        </div>
      </div>
      <div
        className="grid min-w-0 grid-cols-2 gap-2"
        data-slot="font-picker-typography-controls"
      >
        <div className="min-w-0 space-y-1.5" data-slot="font-picker-size-field">
          <ControlFieldLabel>Size</ControlFieldLabel>
          <Input
            aria-label="Font size"
            className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            disabled={disabled}
            min={minFontPickerFontSizePx}
            onBlur={() => commitFontSizeDraft()}
            onChange={(event) => setFontSizeDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitFontSizeDraft(event.currentTarget.value);
                event.currentTarget.blur();
                return;
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setFontSizeDraft(String(normalizedValue.fontSize));
                event.currentTarget.blur();
              }
            }}
            step={1}
            type="text"
            value={fontSizeDraft}
          />
        </div>
        <div
          className="min-w-0 space-y-1.5"
          data-slot="font-picker-text-case-field"
        >
          <ControlFieldLabel>Case</ControlFieldLabel>
          <StaticSelect
            ariaLabel="Text case"
            disabled={disabled}
            onValueChange={(nextTextCase) => {
              emitChange(
                {
                  ...normalizedValue,
                  textCase: isFontPickerTextCase(nextTextCase)
                    ? nextTextCase
                    : "original",
                },
                { history: "merge" },
              );
            }}
            options={textCaseOptions}
            scrollFadeValue={false}
            value={normalizedValue.textCase}
          />
        </div>
      </div>
      <div className="min-w-0" data-slot="font-picker-color-field">
        <ColorOpacityControl
          hex={normalizedValue.color}
          name="Color"
          onValueChange={(nextColor, meta) => {
            emitChange(
              {
                ...normalizedValue,
                color: nextColor.hex,
                opacity: nextColor.opacity,
              },
              meta ?? { history: "merge" },
            );
          }}
          opacity={normalizedValue.opacity}
          showLabel
        />
      </div>
    </Field>
  );
}
