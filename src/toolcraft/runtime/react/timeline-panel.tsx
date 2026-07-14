'use client';

import * as React from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  Button,
  PanelSurface,
  Popover,
  PopoverContent,
  PopoverTrigger,
  PrimitiveArrowIcon,
  ScrollFade,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/toolcraft/ui';
import { Eye, EyeOff, Pause, Play, Repeat, Repeat1, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import type {
  ToolcraftPanelState,
  ToolcraftTimelineBezierControlPoints,
  ToolcraftTimelineKeyframe,
  ToolcraftTimelineKeyframeEasing,
  ToolcraftTimelineKeyframeGroup,
} from '../state/types';
import { getToolcraftTimelineLoopTime } from '../state/timeline-loop';
import { isTimelineReadyForPlayback } from '../state/timeline-readiness';
import { PanelContainer } from './panel-host';
import type { PanelPlacement, PanelStateChange } from './panel-host-types';
import { useToolcraft } from './use-toolcraft';

type TimelinePanelProps = {
  className?: string;
  defaultExpanded?: boolean;
  framed?: boolean;
  onPanelStateChange?: PanelStateChange;
  panelPlacement?: PanelPlacement;
  panelState?: ToolcraftPanelState;
  variant?: 'compact' | 'extended';
};

function cn(...classNames: Array<string | false | null | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

const timelinePanelCollapsedSize = { height: 36 } as const;
const timelinePanelCompactWidthPx = 36;
const timelinePanelCollapsedWidthPx = 256;
const timelinePanelExpandedWidthPx = 688;
const timelinePanelMinResponsiveWidthPx = 320;
const timelinePanelSideCollisionMarginPx = 10;
const timelinePanelSurfaceBorderHeightPx = 2;
const timelinePanelHeaderHeightPx = 36;
const timelineExpandedRulerHeightPx = 36;
const timelineKeyframeRowHeightPx = 36;
const timelineEmptyStateHeightPx = timelineKeyframeRowHeightPx;
const maxVisibleTimelineKeyframeRows = 8;
const timelineKeyframeListMaxHeightPx =
  maxVisibleTimelineKeyframeRows * timelineKeyframeRowHeightPx;
const timelineTrackStartOffsetPx = 164;
const timelineTrackEndInsetPx = 0;
const timelineTrackColumnBorderWidthPx = 1;
const timelineTrackStartVisualOffsetPx = -timelineTrackColumnBorderWidthPx;
const timelineExpandedTrackStartOffsetPx =
  timelineTrackStartOffsetPx + timelineTrackStartVisualOffsetPx;
const timelineRulerLeftInsetPx = timelineTrackStartVisualOffsetPx / 2;
const timelineRulerRightInsetPx = timelineTrackColumnBorderWidthPx / 2;
const timelineRowActionColumnWidthPx = 36;
const timelineExpandedTrackEndOffsetPx =
  timelineTrackEndInsetPx + timelineRowActionColumnWidthPx + timelineTrackColumnBorderWidthPx;
const timelinePlayheadSafeZonePx = 7;
const timelinePlayheadHitAreaWidthPx =
  timelineTrackColumnBorderWidthPx + timelinePlayheadSafeZonePx * 2;
const maxTimelineDurationSeconds = 60;
const minTimelineDurationSeconds = 1;
const timelineScrubStepSeconds = 0.25;
const timelinePanelExpandCollapseTransition = {
  damping: 34,
  mass: 0.85,
  stiffness: 330,
  type: 'spring',
} as const;
const timelinePanelResizeTransition = {
  duration: 0.16,
  ease: [0.22, 1, 0.36, 1],
} as const;
const timelineKeyframePresenceTransition = {
  duration: 0.14,
  ease: [0.22, 1, 0.36, 1],
} as const;
const selectedItemSurfaceClassName = 'bg-[color:color-mix(in_oklab,var(--link)_12%,transparent)]';
const selectedItemBorderClassName =
  'border-[color:color-mix(in_oklab,var(--border)_10%,transparent)]';

type TimelineBezierControlPoints = ToolcraftTimelineBezierControlPoints;

const defaultTimelineBezierControlPoints = [
  0.65, 0, 0.35, 1,
] satisfies TimelineBezierControlPoints;

const defaultTimelineKeyframeEasing: ToolcraftTimelineKeyframeEasing = {
  controlPoints: defaultTimelineBezierControlPoints,
  type: 'bezier',
};

function getTimelinePanelExpandedSize(keyframeGroups: readonly ToolcraftTimelineKeyframeGroup[]): {
  height: number;
  width: number;
} {
  const rowCount = keyframeGroups.length;
  const rowAreaHeight =
    rowCount > 0
      ? Math.min(rowCount * timelineKeyframeRowHeightPx, timelineKeyframeListMaxHeightPx)
      : timelineEmptyStateHeightPx;

  return {
    height:
      timelinePanelSurfaceBorderHeightPx +
      timelinePanelHeaderHeightPx +
      timelineExpandedRulerHeightPx +
      rowAreaHeight,
    width: timelinePanelExpandedWidthPx,
  };
}

function doRectsOverlapVertically(first: DOMRect, second: DOMRect): boolean {
  return first.top < second.bottom && first.bottom > second.top;
}

function getTimelinePanelBoundsElement(panel: HTMLElement): HTMLElement | null {
  return panel.closest<HTMLElement>(
    '[data-slot="toolcraft-runtime-app"], [data-toolcraft-panel-stage]',
  );
}

function getTimelinePanelAnchorRect(panel: HTMLElement): DOMRect {
  const panelHost = panel.closest<HTMLElement>(
    '[data-slot="toolcraft-runtime-panel-host"][data-panel-type="timeline"]',
  );
  const panelHostRect = panelHost?.getBoundingClientRect();

  if (panelHostRect && panelHostRect.width > 0 && panelHostRect.height > 0) {
    return panelHostRect;
  }

  return panel.getBoundingClientRect();
}

type TimelinePanelResponsiveLayout = {
  offsetX: number;
  width: number;
};

function getTimelinePanelResponsiveLayout(panel: HTMLElement): TimelinePanelResponsiveLayout | null {
  const boundsElement = getTimelinePanelBoundsElement(panel);
  const boundsRect = boundsElement?.getBoundingClientRect();
  const anchorRect = getTimelinePanelAnchorRect(panel);
  const panelRect = panel.getBoundingClientRect();

  if (!boundsElement || !boundsRect || boundsRect.width <= 0 || anchorRect.width <= 0) {
    return null;
  }

  const boundsLeft = boundsRect.left + timelinePanelSideCollisionMarginPx;
  const boundsRight = boundsRect.right - timelinePanelSideCollisionMarginPx;
  const panelCenterX = anchorRect.left + anchorRect.width / 2;
  let leftLimit = boundsLeft;
  let rightLimit = boundsRight;

  for (const sidePanel of boundsElement.querySelectorAll<HTMLElement>(
    '[data-panel-type="layers"], [data-panel-type="controls"]',
  )) {
    const sidePanelRect = sidePanel.getBoundingClientRect();

    if (sidePanelRect.width <= 0 || !doRectsOverlapVertically(panelRect, sidePanelRect)) {
      continue;
    }

    if (sidePanelRect.right <= panelCenterX) {
      leftLimit = Math.max(leftLimit, sidePanelRect.right + timelinePanelSideCollisionMarginPx);
      continue;
    }

    if (sidePanelRect.left >= panelCenterX) {
      rightLimit = Math.min(rightLimit, sidePanelRect.left - timelinePanelSideCollisionMarginPx);
    }
  }

  const availableWidth = Math.floor(Math.max(0, rightLimit - leftLimit));
  const width =
    availableWidth >= timelinePanelExpandedWidthPx
      ? timelinePanelExpandedWidthPx
      : Math.max(timelinePanelMinResponsiveWidthPx, availableWidth);
  const halfWidth = width / 2;
  const minCenterX = leftLimit + halfWidth;
  const maxCenterX = rightLimit - halfWidth;
  const nextCenterX =
    minCenterX <= maxCenterX
      ? Math.max(minCenterX, Math.min(maxCenterX, panelCenterX))
      : leftLimit + Math.max(0, rightLimit - leftLimit) / 2;
  const offsetX = Math.round(nextCenterX - panelCenterX);

  return {
    offsetX: Object.is(offsetX, -0) ? 0 : offsetX,
    width,
  };
}

function areTimelinePanelResponsiveLayoutsEqual(
  first: TimelinePanelResponsiveLayout | null,
  second: TimelinePanelResponsiveLayout | null,
): boolean {
  return first?.offsetX === second?.offsetX && first?.width === second?.width;
}

function useTimelinePanelResponsiveLayout(enabled: boolean): {
  panelRef: React.RefObject<HTMLDivElement | null>;
  responsiveLayout: TimelinePanelResponsiveLayout | null;
} {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [responsiveLayout, setResponsiveLayout] =
    useState<TimelinePanelResponsiveLayout | null>(null);

  const measureResponsiveLayout = useCallback((): void => {
    const panel = panelRef.current;
    const nextLayout = enabled && panel ? getTimelinePanelResponsiveLayout(panel) : null;

    setResponsiveLayout((currentLayout) =>
      areTimelinePanelResponsiveLayoutsEqual(currentLayout, nextLayout)
        ? currentLayout
        : nextLayout,
    );
  }, [enabled]);

  const scheduleMeasure = useCallback((): void => {
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      measureResponsiveLayout();
    });
  }, [measureResponsiveLayout]);

  const measureImmediately = useCallback((): void => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    measureResponsiveLayout();
  }, [measureResponsiveLayout]);

  useLayoutEffect(() => {
    measureImmediately();

    if (!enabled) {
      return undefined;
    }

    window.addEventListener('resize', measureImmediately);
    document.addEventListener('pointermove', scheduleMeasure, { capture: true });
    document.addEventListener('pointerup', measureImmediately, { capture: true });

    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measureImmediately);
    const panel = panelRef.current;
    const boundsElement = panel ? getTimelinePanelBoundsElement(panel) : null;

    if (resizeObserver) {
      if (boundsElement) {
        resizeObserver.observe(boundsElement);

        for (const sidePanel of boundsElement.querySelectorAll<HTMLElement>(
          '[data-panel-type="layers"], [data-panel-type="controls"]',
        )) {
          resizeObserver.observe(sidePanel);
        }
      }
    }

    return () => {
      window.removeEventListener('resize', measureImmediately);
      document.removeEventListener('pointermove', scheduleMeasure, { capture: true });
      document.removeEventListener('pointerup', measureImmediately, { capture: true });
      resizeObserver?.disconnect();

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [enabled, measureImmediately, scheduleMeasure]);

  return { panelRef, responsiveLayout };
}

function clampTimelineDuration(value: number): number {
  if (!Number.isFinite(value)) {
    return 8;
  }

  return Math.max(minTimelineDurationSeconds, Math.min(maxTimelineDurationSeconds, value));
}

function clampTimelineTime(value: number, durationSeconds: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(durationSeconds, value));
}

function formatTimelineSeconds(value: number): string {
  return value.toFixed(2);
}

function getRoundedKeyframeTime(value: number): number {
  return Number.parseFloat(value.toFixed(2));
}

function getKeyframeId(controlId: string, timeSeconds: number): string {
  return `${controlId}::${formatTimelineSeconds(timeSeconds)}`;
}

function formatTimelineDisplaySeconds(value: number): string {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return String(Number.parseFloat(value.toFixed(2)));
}

function formatDurationValueLabel(value: number): string {
  return `${Number.parseFloat(value.toFixed(2))}s`;
}

function formatTimelineHeaderTimeLabel({
  currentTimeSeconds,
  durationSeconds,
}: {
  currentTimeSeconds: number;
  durationSeconds: number;
}): string {
  return `${formatTimelineSeconds(currentTimeSeconds)} / ${formatTimelineDisplaySeconds(
    durationSeconds,
  )}s`;
}

function getTimelineProgressRatio(currentTimeSeconds: number, durationSeconds: number): number {
  if (durationSeconds <= 0) {
    return 0;
  }

  return clampTimelineTime(currentTimeSeconds, durationSeconds) / durationSeconds;
}

function getTimelineProgressPercent(currentTimeSeconds: number, durationSeconds: number): string {
  return `${getTimelineProgressRatio(currentTimeSeconds, durationSeconds) * 100}%`;
}

function getTimelineHandlePosition(currentTimeSeconds: number, durationSeconds: number): string {
  const progressPercent = getTimelineProgressPercent(currentTimeSeconds, durationSeconds);
  const progressRatio = getTimelineProgressRatio(currentTimeSeconds, durationSeconds);
  const offsetPx = Number((5 - progressRatio * 10).toFixed(4));

  if (offsetPx < 0) {
    return `calc(${progressPercent} - ${Math.abs(offsetPx)}px)`;
  }

  if (offsetPx > 0) {
    return `calc(${progressPercent} + ${offsetPx}px)`;
  }

  return progressPercent;
}

function TimelinePanelDivider(): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className="block h-5 w-px shrink-0 rounded-full bg-[color:color-mix(in_oklab,var(--border)_8%,transparent)]"
      data-slot="timeline-panel-divider"
    />
  );
}

function TimelineIconButton({
  active = false,
  children,
  disabled = false,
  label,
  onClick,
  size = 'icon',
  tooltipSide = 'top',
}: {
  active?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  size?: 'icon-sm' | 'icon';
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
}): React.JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            aria-pressed={active}
            className="data-[icon-active=true]:text-[color:var(--foreground)]"
            data-icon-active={active}
            disabled={disabled}
            onClick={() => {
              if (disabled) {
                return;
              }

              onClick();
            }}
            size={size}
            type="button"
            variant="ghost"
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}

function stopTimelineEasingEvent(
  event: React.MouseEvent<HTMLElement> | React.PointerEvent<HTMLElement>,
): void {
  event.stopPropagation();
}

function getTimelineEasingPopoverAnchor(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  return (
    document.querySelector<HTMLElement>('[data-slot="timeline-panel"][data-expanded-height]') ??
    document.querySelector<HTMLElement>('[data-slot="timeline-panel"]')
  );
}

type TimelineEasingPresetCategory = 'basic' | 'expressive' | 'in' | 'inOut' | 'out';

type TimelineEasingPreset = {
  category: TimelineEasingPresetCategory;
  controlPoints: TimelineBezierControlPoints;
  label: string;
  name: string;
};

type TimelineCurveEditorDragTarget = 'p1' | 'p2';

const timelineEasingPresetCategories = [
  ['basic', 'Foundation'],
  ['out', 'Out'],
  ['in', 'In'],
  ['inOut', 'In Out'],
  ['expressive', 'Expressive'],
] as const satisfies ReadonlyArray<readonly [TimelineEasingPresetCategory, string]>;

const timelineEasingPresets = [
  { category: 'basic', controlPoints: [0, 0, 1, 1], label: 'Linear', name: 'linear' },
  { category: 'basic', controlPoints: [0.65, 0, 0.35, 1], label: 'Smooth', name: 'smooth' },
  {
    category: 'expressive',
    controlPoints: [1, -0.4, 0.35, 0.95],
    label: 'Anticipate',
    name: 'anticipate',
  },
  {
    category: 'expressive',
    controlPoints: [0.36, 0, 0.66, -0.56],
    label: 'Back In',
    name: 'backIn',
  },
  {
    category: 'expressive',
    controlPoints: [0.34, 1.56, 0.64, 1],
    label: 'Back Out',
    name: 'backOut',
  },
  { category: 'out', controlPoints: [0, 0, 0.2, 1], label: 'Quick Out', name: 'quickOut' },
  {
    category: 'out',
    controlPoints: [0.175, 0.885, 0.32, 1.1],
    label: 'Swift Out',
    name: 'swiftOut',
  },
  { category: 'out', controlPoints: [0.19, 1, 0.22, 1], label: 'Snappy Out', name: 'snappyOut' },
  {
    category: 'out',
    controlPoints: [0.215, 0.61, 0.355, 1],
    label: 'Out Cubic',
    name: 'outCubic',
  },
  { category: 'out', controlPoints: [0, 0, 0.58, 1], label: 'Ease Out', name: 'easeOut' },
  { category: 'in', controlPoints: [0.42, 0, 1, 1], label: 'Ease In', name: 'easeIn' },
  { category: 'in', controlPoints: [0.6, 0.04, 0.98, 0.335], label: 'In Circ', name: 'inCirc' },
  { category: 'in', controlPoints: [0.755, 0.05, 0.855, 0.06], label: 'In Quint', name: 'inQuint' },
  {
    category: 'inOut',
    controlPoints: [0.42, 0, 0.58, 1],
    label: 'Ease In Out',
    name: 'easeInOut',
  },
  {
    category: 'inOut',
    controlPoints: [0.77, 0, 0.175, 1],
    label: 'In Out Quart',
    name: 'inOutQuart',
  },
  {
    category: 'inOut',
    controlPoints: [0.86, 0, 0.07, 1],
    label: 'In Out Quint',
    name: 'inOutQuint',
  },
  { category: 'inOut', controlPoints: [1, 0, 0, 1], label: 'In Out Expo', name: 'inOutExpo' },
  {
    category: 'inOut',
    controlPoints: [0.785, 0.135, 0.15, 0.86],
    label: 'In Out Circ',
    name: 'inOutCirc',
  },
] as const satisfies readonly TimelineEasingPreset[];

const easingNumberTokenPattern = /[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)/g;
const easingEditorViewBoxSize = 180;
const easingEditorGridInset = 24;
const easingEditorGridSize = 132;
const easingEditorFrameWidth = 220;
const easingEditorFrameHeight = 240;
const easingEditorFrameOffsetX = (easingEditorFrameWidth - easingEditorViewBoxSize) / 2;
const easingEditorFrameOffsetY = (easingEditorFrameHeight - easingEditorViewBoxSize) / 2;
const timelineEasingPresetIconSize = 20;
const timelineEasingPresetIconViewBoxSize = 28;
const timelineEasingPresetIconLineColor = 'color-mix(in oklab, var(--border) 60%, transparent)';
const timelineEasingPresetButtonBaseClassName =
  'inline-flex items-center gap-2 rounded-lg border p-1 text-left font-mono text-[11px] leading-[14px] transition-[background-color,border-color,color,transform] duration-150 ease-out hover:bg-[color:color-mix(in_oklab,var(--foreground)_6%,transparent)] hover:border-[color:color-mix(in_oklab,var(--border)_14%,transparent)] active:scale-[0.985]';
const timelineEasingPopoverWidthPx = 688;
const timelineEasingCurveAnimationDurationMs = 180;

function getTimelineEasingPopoverWidthElement(): HTMLElement | null {
  const panel = getTimelineEasingPopoverAnchor();

  return panel?.querySelector<HTMLElement>('[data-slot="timeline-panel-header"]') ?? panel;
}

function useTimelineEasingPopoverWidth(): number {
  const [popoverWidth, setPopoverWidth] = useState(timelineEasingPopoverWidthPx);

  useEffect(() => {
    const widthElement = getTimelineEasingPopoverWidthElement();

    if (!widthElement) {
      return;
    }

    const updatePopoverWidth = (): void => {
      const nextWidth = widthElement.getBoundingClientRect().width;

      if (nextWidth > 0) {
        setPopoverWidth(nextWidth);
      }
    };

    updatePopoverWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updatePopoverWidth);

      return () => {
        window.removeEventListener('resize', updatePopoverWidth);
      };
    }

    const observer = new ResizeObserver(updatePopoverWidth);

    observer.observe(widthElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  return popoverWidth;
}

function clampEasingValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function cloneToolcraftTimelineKeyframeEasing(
  easing: ToolcraftTimelineKeyframeEasing,
): ToolcraftTimelineKeyframeEasing {
  return easing.type === 'step'
    ? { type: 'step' }
    : { controlPoints: [...easing.controlPoints], type: 'bezier' };
}

function getToolcraftTimelineKeyframeEasing(
  easing: ToolcraftTimelineKeyframeEasing | undefined,
): ToolcraftTimelineKeyframeEasing {
  return cloneToolcraftTimelineKeyframeEasing(easing ?? defaultTimelineKeyframeEasing);
}

function normalizeToolcraftTimelineKeyframeEasing(
  easing: unknown,
): ToolcraftTimelineKeyframeEasing | undefined {
  if (typeof easing !== 'object' || easing === null || Array.isArray(easing)) {
    return undefined;
  }

  const easingRecord = easing as Record<string, unknown>;

  if (easingRecord.type === 'step') {
    return { type: 'step' };
  }

  if (easingRecord.type !== 'bezier' || !Array.isArray(easingRecord.controlPoints)) {
    return undefined;
  }

  const [x1, y1, x2, y2] = easingRecord.controlPoints;

  if (
    typeof x1 !== 'number' ||
    typeof y1 !== 'number' ||
    typeof x2 !== 'number' ||
    typeof y2 !== 'number' ||
    !Number.isFinite(x1) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(x2) ||
    !Number.isFinite(y2)
  ) {
    return undefined;
  }

  return {
    controlPoints: [
      clampEasingValue(x1, 0, 1),
      clampEasingValue(y1, -1, 2),
      clampEasingValue(x2, 0, 1),
      clampEasingValue(y2, -1, 2),
    ],
    type: 'bezier',
  };
}

function parseTimelineEasingNumberTokens(value: string): number[] {
  return Array.from(value.matchAll(easingNumberTokenPattern), ([token]) =>
    Number.parseFloat(token.replace(',', '.')),
  ).filter(Number.isFinite);
}

function parseToolcraftTimelineKeyframeEasing(
  value: string,
  baseEasing?: ToolcraftTimelineKeyframeEasing,
): ToolcraftTimelineKeyframeEasing | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^step(?:\s+hold)?$/i.test(trimmedValue)) {
    return { type: 'step' };
  }

  const cubicBezierMatch = trimmedValue.match(/^cubic-bezier\((.+)\)$/i);
  const rawControlPoints = parseTimelineEasingNumberTokens(
    cubicBezierMatch?.[1] ?? trimmedValue,
  );

  if (rawControlPoints.length === 0) {
    return null;
  }

  const fallbackControlPoints =
    baseEasing?.type === 'bezier' ? baseEasing.controlPoints : defaultTimelineBezierControlPoints;
  const controlPoints = [
    rawControlPoints[0] ?? fallbackControlPoints[0],
    rawControlPoints[1] ?? fallbackControlPoints[1],
    rawControlPoints[2] ?? fallbackControlPoints[2],
    rawControlPoints[3] ?? fallbackControlPoints[3],
  ] satisfies TimelineBezierControlPoints;

  return (
    normalizeToolcraftTimelineKeyframeEasing({
      controlPoints,
      type: 'bezier',
    }) ?? null
  );
}

function formatTimelineBezierControlPoints(
  controlPoints: TimelineBezierControlPoints,
): string {
  return controlPoints.map((point) => Number(point.toFixed(3))).join(', ');
}

function findTimelineEasingPresetName(easing: ToolcraftTimelineKeyframeEasing): string | null {
  if (easing.type === 'step') {
    return null;
  }

  const [x1, y1, x2, y2] = easing.controlPoints;

  return (
    timelineEasingPresets.find((preset) => {
      const [presetX1, presetY1, presetX2, presetY2] = preset.controlPoints;

      return (
        Math.abs(x1 - presetX1) < 0.005 &&
        Math.abs(y1 - presetY1) < 0.005 &&
        Math.abs(x2 - presetX2) < 0.005 &&
        Math.abs(y2 - presetY2) < 0.005
      );
    })?.name ?? null
  );
}

function getEasingEditorControlPoints(
  easing: ToolcraftTimelineKeyframeEasing,
): TimelineBezierControlPoints {
  return easing.type === 'step' ? [0, 0, 1, 1] : easing.controlPoints;
}

function areEasingControlPointsEqual(
  first: TimelineBezierControlPoints,
  second: TimelineBezierControlPoints,
): boolean {
  return first.every((point, index) => Math.abs(point - second[index]) < 0.0001);
}

function getTimelineEasingAnimationProgress(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

function interpolateTimelineEasingControlPoints(
  from: TimelineBezierControlPoints,
  to: TimelineBezierControlPoints,
  progress: number,
): TimelineBezierControlPoints {
  const easedProgress = getTimelineEasingAnimationProgress(Math.max(0, Math.min(1, progress)));

  return from.map(
    (point, index) => point + (to[index] - point) * easedProgress,
  ) as TimelineBezierControlPoints;
}

function getEasingEditorPoint(x: number, y: number): [number, number] {
  return [
    easingEditorGridInset + easingEditorGridSize * x,
    easingEditorGridInset + (1 - y) * easingEditorGridSize,
  ];
}

function getEasingIconPath(
  controlPoints: TimelineBezierControlPoints,
  size: number,
): string {
  const pointX = (point: number): number => 3 + point * (size - 6);
  const pointY = (point: number): number => size - 3 - point * (size - 6);

  return `M ${pointX(0)} ${pointY(0)} C ${pointX(controlPoints[0])} ${pointY(
    controlPoints[1],
  )}, ${pointX(controlPoints[2])} ${pointY(controlPoints[3])}, ${pointX(1)} ${pointY(1)}`;
}

function getEasingPreviewPath(controlPoints: TimelineBezierControlPoints): string {
  const [startX, startY] = getEasingEditorPoint(0, 0);
  const [firstX, firstY] = getEasingEditorPoint(controlPoints[0], controlPoints[1]);
  const [secondX, secondY] = getEasingEditorPoint(controlPoints[2], controlPoints[3]);
  const [endX, endY] = getEasingEditorPoint(1, 1);

  return `M ${startX} ${startY} C ${firstX} ${firstY}, ${secondX} ${secondY}, ${endX} ${endY}`;
}

function getEasingInputValue(easing: ToolcraftTimelineKeyframeEasing): string {
  return easing.type === 'step'
    ? 'step'
    : formatTimelineBezierControlPoints(easing.controlPoints);
}

function getTimelineEasingPresetButtonClassName(isActive: boolean): string {
  return cn(
    timelineEasingPresetButtonBaseClassName,
    isActive && selectedItemBorderClassName,
    isActive && selectedItemSurfaceClassName,
    isActive
      ? 'text-[color:var(--foreground)]'
      : 'border-[color:color-mix(in_oklab,var(--border)_8%,transparent)] text-[color:var(--muted-foreground)]',
  );
}

function TimelineEasingCurveIcon({
  className,
  easing,
  size = 20,
}: {
  className?: string;
  easing: ToolcraftTimelineKeyframeEasing;
  size?: number;
}): React.JSX.Element {
  if (easing.type === 'step') {
    return (
      <svg
        aria-hidden="true"
        className={cn('pointer-events-none', className)}
        fill="none"
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        width={size}
      >
        <path
          d={`M 3 ${size - 3} H ${size - 3} V 3`}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth={1.5}
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={cn('pointer-events-none', className)}
      fill="none"
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
    >
      <path
        d={getEasingIconPath(easing.controlPoints, size)}
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function TimelineEasingPresetIcon({
  controlPoints,
}: {
  controlPoints: TimelineBezierControlPoints;
}): React.JSX.Element {
  const iconSize = timelineEasingPresetIconViewBoxSize;
  const iconInset = 4;
  const iconGridSize = iconSize - iconInset * 2;
  const pointX = (point: number): number => iconInset + point * iconGridSize;
  const pointY = (point: number): number => iconInset + (1 - point) * iconGridSize;
  const path = `M ${pointX(0)} ${pointY(0)} C ${pointX(controlPoints[0])} ${pointY(
    controlPoints[1],
  )}, ${pointX(controlPoints[2])} ${pointY(controlPoints[3])}, ${pointX(1)} ${pointY(1)}`;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none shrink-0"
      data-slot="timeline-easing-preset-icon"
      fill="none"
      height={timelineEasingPresetIconSize}
      viewBox={`0 0 ${iconSize} ${iconSize}`}
      width={timelineEasingPresetIconSize}
    >
      <rect
        fill="color-mix(in oklab, currentColor 8%, transparent)"
        height={iconGridSize}
        rx={2}
        stroke="color-mix(in oklab, currentColor 18%, transparent)"
        strokeWidth={1}
        width={iconGridSize}
        x={iconInset}
        y={iconInset}
      />
      <path
        d={path}
        stroke={timelineEasingPresetIconLineColor}
        strokeLinecap="round"
        strokeWidth={1}
      />
    </svg>
  );
}

function TimelineEasingStepPresetIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none shrink-0"
      data-slot="timeline-easing-step-icon"
      fill="none"
      height={timelineEasingPresetIconSize}
      viewBox="0 0 28 28"
      width={timelineEasingPresetIconSize}
    >
      <rect
        fill="color-mix(in oklab, currentColor 8%, transparent)"
        height={20}
        rx={2}
        stroke="color-mix(in oklab, currentColor 18%, transparent)"
        strokeWidth={1}
        width={20}
        x={4}
        y={4}
      />
      <path
        d="M 4 24 H 24 V 4"
        stroke={timelineEasingPresetIconLineColor}
        strokeLinecap="round"
        strokeWidth={1}
      />
    </svg>
  );
}

function TimelineEasingEditor({
  easing,
  onChange,
}: {
  easing: ToolcraftTimelineKeyframeEasing;
  onChange: (easing: ToolcraftTimelineKeyframeEasing) => void;
}): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragTarget, setDragTarget] = useState<TimelineCurveEditorDragTarget | null>(null);
  const targetControlPoints = getEasingEditorControlPoints(easing);
  const targetControlPointsKey = `${easing.type}:${targetControlPoints.join(',')}`;
  const [displayedControlPoints, setDisplayedControlPoints] =
    useState<TimelineBezierControlPoints>(targetControlPoints);
  const displayedControlPointsRef =
    useRef<TimelineBezierControlPoints>(displayedControlPoints);
  const animationFrameRef = useRef<number | null>(null);
  const [isCurveAnimating, setIsCurveAnimating] = useState(false);
  const isStep = easing.type === 'step';
  const renderedControlPoints = dragTarget ? targetControlPoints : displayedControlPoints;
  const [startX, startY] = getEasingEditorPoint(0, 0);
  const [endX, endY] = getEasingEditorPoint(1, 1);
  const [firstX, firstY] = getEasingEditorPoint(renderedControlPoints[0], renderedControlPoints[1]);
  const [secondX, secondY] = getEasingEditorPoint(
    renderedControlPoints[2],
    renderedControlPoints[3],
  );
  const setAnimatedControlPoints = (
    nextControlPoints: TimelineBezierControlPoints,
  ): void => {
    displayedControlPointsRef.current = nextControlPoints;
    setDisplayedControlPoints(nextControlPoints);
  };
  const getEditorPointFromClient = (
    clientX: number,
    clientY: number,
  ): { x: number; y: number } | null => {
    if (!svgRef.current) {
      return null;
    }
    const rect = svgRef.current.getBoundingClientRect();

    if (!(rect.width > 0 && rect.height > 0)) {
      return null;
    }

    const scale = Math.min(
      rect.width / easingEditorFrameWidth,
      rect.height / easingEditorFrameHeight,
    );

    if (!(scale > 0)) {
      return null;
    }

    const viewBoxLeft = rect.left + (rect.width - easingEditorFrameWidth * scale) / 2;
    const viewBoxTop = rect.top + (rect.height - easingEditorFrameHeight * scale) / 2;
    const pointerX = (clientX - viewBoxLeft) / scale - easingEditorFrameOffsetX;
    const pointerY = (clientY - viewBoxTop) / scale - easingEditorFrameOffsetY;

    return {
      x: Math.max(0, Math.min(1, (pointerX - easingEditorGridInset) / easingEditorGridSize)),
      y: Math.max(-1, Math.min(2, 1 - (pointerY - easingEditorGridInset) / easingEditorGridSize)),
    };
  };
  const updateControlPoint = (
    target: TimelineCurveEditorDragTarget,
    nextPoint: { x: number; y: number },
  ): void => {
    const nextControlPoints = [...targetControlPoints] as TimelineBezierControlPoints;

    if (target === 'p1') {
      nextControlPoints[0] = nextPoint.x;
      nextControlPoints[1] = nextPoint.y;
    } else {
      nextControlPoints[2] = nextPoint.x;
      nextControlPoints[3] = nextPoint.y;
    }

    onChange({ controlPoints: nextControlPoints, type: 'bezier' });
  };
  const handleDragMove = (event: PointerEvent): void => {
    if (!dragTarget) {
      return;
    }

    const nextPoint = getEditorPointFromClient(event.clientX, event.clientY);

    if (!nextPoint) {
      return;
    }

    updateControlPoint(dragTarget, nextPoint);
  };

  useEffect(() => {
    const nextControlPoints = [...targetControlPoints] as TimelineBezierControlPoints;

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (
      dragTarget ||
      typeof window === 'undefined' ||
      !window.requestAnimationFrame ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsCurveAnimating(false);
      setAnimatedControlPoints(nextControlPoints);
      return undefined;
    }

    const startControlPoints = displayedControlPointsRef.current;

    if (areEasingControlPointsEqual(startControlPoints, nextControlPoints)) {
      setIsCurveAnimating(false);
      setAnimatedControlPoints(nextControlPoints);
      return undefined;
    }

    let animationStartTime: number | null = null;

    setIsCurveAnimating(true);

    const tick = (timestamp: number): void => {
      animationStartTime ??= timestamp;

      const progress = Math.min(
        1,
        (timestamp - animationStartTime) / timelineEasingCurveAnimationDurationMs,
      );

      setAnimatedControlPoints(
        interpolateTimelineEasingControlPoints(startControlPoints, nextControlPoints, progress),
      );

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      animationFrameRef.current = null;
      setIsCurveAnimating(false);
      setAnimatedControlPoints(nextControlPoints);
    };

    animationFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [dragTarget, targetControlPointsKey]);

  useEffect(() => {
    if (!dragTarget) {
      return;
    }

    const handlePointerUp = (): void => {
      setDragTarget(null);
    };
    const previousCursor = document.body.style.cursor;

    document.body.style.cursor = 'grabbing';
    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.body.style.cursor = previousCursor;
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [targetControlPoints, dragTarget, handleDragMove]);

  const startControlPointDrag =
    (target: TimelineCurveEditorDragTarget) => (event: React.PointerEvent<SVGElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setDragTarget(target);
    };
  const startCurveDrag = (event: React.PointerEvent<SVGPathElement>): void => {
    event.preventDefault();
    event.stopPropagation();

    const point = getEditorPointFromClient(event.clientX, event.clientY);

    if (!point) {
      return;
    }

    setDragTarget(point.x <= 0.5 ? 'p1' : 'p2');
  };

  return (
    <svg
      aria-label="Easing curve editor"
      className="w-[240px] shrink-0 select-none"
      data-animating={isCurveAnimating ? 'true' : undefined}
      data-curve-animation-duration={timelineEasingCurveAnimationDurationMs}
      data-slot="timeline-easing-editor"
      height={easingEditorFrameHeight}
      ref={svgRef}
      role="img"
      style={{ touchAction: 'none' }}
      viewBox={`0 0 ${easingEditorFrameWidth} ${easingEditorFrameHeight}`}
      width={easingEditorFrameWidth}
    >
      <g transform={`translate(${easingEditorFrameOffsetX} ${easingEditorFrameOffsetY})`}>
        <rect
          fill="none"
          height={easingEditorGridSize}
          rx={2}
          stroke="color-mix(in oklab, var(--border) 10%, transparent)"
          strokeWidth={1}
          width={easingEditorGridSize}
          x={easingEditorGridInset}
          y={easingEditorGridInset}
        />
        {[0.25, 0.5, 0.75].map((point) => {
          const [gridX] = getEasingEditorPoint(point, 0);
          const [, gridY] = getEasingEditorPoint(0, point);

          return (
            <g key={point}>
              <line
                stroke="color-mix(in oklab, var(--border) 6%, transparent)"
                strokeWidth={1}
                x1={gridX}
                x2={gridX}
                y1={easingEditorGridInset}
                y2={easingEditorGridInset + easingEditorGridSize}
              />
              <line
                stroke="color-mix(in oklab, var(--border) 6%, transparent)"
                strokeWidth={1}
                x1={easingEditorGridInset}
                x2={easingEditorGridInset + easingEditorGridSize}
                y1={gridY}
                y2={gridY}
              />
            </g>
          );
        })}
        <line
          stroke="color-mix(in oklab, var(--foreground) 12%, transparent)"
          strokeDasharray="3 3"
          strokeWidth={1}
          x1={startX}
          x2={endX}
          y1={startY}
          y2={endY}
        />
        {isStep ? (
          <>
            <line
              data-slot="timeline-easing-step-horizontal"
              stroke="color-mix(in oklab, var(--foreground) 85%, transparent)"
              strokeLinecap="round"
              strokeWidth={2}
              x1={startX}
              x2={endX}
              y1={startY}
              y2={startY}
            />
            <line
              data-slot="timeline-easing-step-vertical"
              stroke="color-mix(in oklab, var(--foreground) 85%, transparent)"
              strokeLinecap="round"
              strokeWidth={1.5}
              x1={endX}
              x2={endX}
              y1={startY}
              y2={endY}
            />
          </>
        ) : (
          <>
            <line
              stroke="color-mix(in oklab, var(--foreground) 25%, transparent)"
              strokeWidth={1}
              x1={startX}
              x2={firstX}
              y1={startY}
              y2={firstY}
            />
            <line
              stroke="color-mix(in oklab, var(--foreground) 25%, transparent)"
              strokeWidth={1}
              x1={endX}
              x2={secondX}
              y1={endY}
              y2={secondY}
            />
            <line
              className="cursor-grab active:cursor-grabbing"
              data-slot="timeline-easing-control-line-hit-area"
              onPointerDown={startControlPointDrag('p1')}
              pointerEvents="stroke"
              stroke="transparent"
              strokeLinecap="round"
              strokeWidth={18}
              x1={startX}
              x2={firstX}
              y1={startY}
              y2={firstY}
            />
            <line
              className="cursor-grab active:cursor-grabbing"
              data-slot="timeline-easing-control-line-hit-area"
              onPointerDown={startControlPointDrag('p2')}
              pointerEvents="stroke"
              stroke="transparent"
              strokeLinecap="round"
              strokeWidth={18}
              x1={endX}
              x2={secondX}
              y1={endY}
              y2={secondY}
            />
            <path
              d={getEasingPreviewPath(renderedControlPoints)}
              data-slot="timeline-easing-curve"
              fill="none"
              stroke="color-mix(in oklab, var(--foreground) 85%, transparent)"
              strokeLinecap="round"
              strokeWidth={2}
            />
            <path
              className="cursor-grab active:cursor-grabbing"
              d={getEasingPreviewPath(renderedControlPoints)}
              data-slot="timeline-easing-curve-hit-area"
              fill="none"
              onPointerDown={startCurveDrag}
              pointerEvents="stroke"
              stroke="transparent"
              strokeLinecap="round"
              strokeWidth={18}
            />
            <circle
              cx={startX}
              cy={startY}
              fill="color-mix(in oklab, var(--foreground) 50%, transparent)"
              r={3}
            />
            <circle
              cx={endX}
              cy={endY}
              fill="color-mix(in oklab, var(--foreground) 50%, transparent)"
              r={3}
            />
            <circle
              className="cursor-grab active:cursor-grabbing"
              cx={firstX}
              cy={firstY}
              fill="var(--foreground)"
              onPointerDown={startControlPointDrag('p1')}
              r={5}
              stroke="color-mix(in oklab, var(--background) 70%, transparent)"
              strokeWidth={1}
            />
            <circle
              className="cursor-grab active:cursor-grabbing"
              cx={secondX}
              cy={secondY}
              fill="var(--foreground)"
              onPointerDown={startControlPointDrag('p2')}
              r={5}
              stroke="color-mix(in oklab, var(--background) 70%, transparent)"
              strokeWidth={1}
            />
          </>
        )}
      </g>
    </svg>
  );
}

function TimelineEasingPopoverContent({
  easing,
  onChange,
}: {
  easing: ToolcraftTimelineKeyframeEasing;
  onChange: (easing: ToolcraftTimelineKeyframeEasing) => void;
}): React.JSX.Element {
  const [inputValue, setInputValue] = useState(getEasingInputValue(easing));
  const [inputError, setInputError] = useState<string | null>(null);
  const [inputEditing, setInputEditing] = useState(false);
  const activePresetName = findTimelineEasingPresetName(easing);
  const committedInputValue = getEasingInputValue(easing);
  const isStep = easing.type === 'step';
  const popoverWidth = useTimelineEasingPopoverWidth();

  useEffect(() => {
    if (inputEditing) {
      return;
    }

    setInputValue(committedInputValue);
    setInputError(null);
  }, [committedInputValue, inputEditing]);

  const commitInputValue = (
    value = inputValue,
    { revertOnInvalid = false }: { revertOnInvalid?: boolean } = {},
  ): void => {
    const nextEasing = parseToolcraftTimelineKeyframeEasing(value, easing);

    if (!nextEasing) {
      if (revertOnInvalid) {
        setInputValue(committedInputValue);
        setInputError(null);
        return;
      }

      setInputError('Use cubic-bezier(x1, y1, x2, y2) or step.');
      return;
    }

    setInputError(null);
    setInputValue(getEasingInputValue(nextEasing));

    if (getEasingInputValue(nextEasing) === committedInputValue) {
      return;
    }

    onChange(nextEasing);
  };

  return (
    <div className="flex flex-row items-stretch" style={{ width: popoverWidth }}>
      <TimelineEasingEditor easing={easing} onChange={onChange} />
      <span
        aria-hidden="true"
        className="w-px shrink-0 self-stretch bg-[color:color-mix(in_oklab,var(--border)_10%,transparent)]"
        data-slot="timeline-easing-divider"
      />
      <ScrollFade
        className="max-h-[240px] min-w-0 flex-1 py-3 pr-3 pl-3"
        containerClassName="min-w-0 flex-1"
        data-slot="timeline-easing-presets"
        height={36}
        preset="default"
        showOppositeSide
        side="bottom"
        visibilityMode="terminal"
      >
        <div className="flex flex-col gap-4">
          {timelineEasingPresetCategories.map(([category, categoryLabel]) => {
            const presets = timelineEasingPresets.filter(
              (preset) => preset.category === category,
            );
            const showStepPreset = category === 'basic';

            if (presets.length === 0 && !showStepPreset) {
              return null;
            }

            return (
              <div className="flex flex-col gap-1.5" key={category}>
                <span
                  className="text-[11px] leading-4 opacity-60"
                  data-slot="timeline-easing-section-label"
                >
                  {categoryLabel}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {showStepPreset ? (
                    <button
                      className={getTimelineEasingPresetButtonClassName(isStep)}
                      onClick={() => onChange({ type: 'step' })}
                      type="button"
                    >
                      <TimelineEasingStepPresetIcon />
                      <span>Step Hold</span>
                    </button>
                  ) : null}
                  {presets.map((preset) => {
                    const isActive = activePresetName === preset.name;

                    return (
                      <button
                        className={getTimelineEasingPresetButtonClassName(isActive)}
                        key={preset.name}
                        onClick={() =>
                          onChange({
                            controlPoints: [...preset.controlPoints],
                            type: 'bezier',
                          })
                        }
                        type="button"
                      >
                        <TimelineEasingPresetIcon controlPoints={preset.controlPoints} />
                        <span>{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] leading-4 opacity-60"
                data-slot="timeline-easing-section-label"
              >
                Curve Values
              </span>
            </div>
            <input
              className="h-8 cursor-text rounded-lg border border-[color:color-mix(in_oklab,var(--border)_10%,transparent)] bg-[color:color-mix(in_oklab,var(--background)_20%,transparent)] px-2.5 font-mono text-[12px] text-[color:var(--foreground)] transition-[background-color,border-color] duration-150 ease-out outline-none placeholder:text-[color:var(--muted-foreground)] in-data-[focus-visible-mode=keyboard]:focus-visible:border-[color:color-mix(in_oklab,var(--border)_22%,transparent)] in-data-[focus-visible-mode=keyboard]:focus-visible:bg-[color:color-mix(in_oklab,var(--foreground)_4%,transparent)]"
              onBlur={(event) => {
                commitInputValue(event.currentTarget.value, { revertOnInvalid: true });
                setInputEditing(false);
              }}
              onChange={(event) => {
                setInputValue(event.currentTarget.value);
                if (inputError) {
                  setInputError(null);
                }
              }}
              onFocus={(event) => {
                setInputEditing(true);
                event.currentTarget.select();
              }}
              onKeyDown={(event) => {
                if (
                  event.key === 'Backspace' ||
                  event.key === 'Delete' ||
                  event.key === 'ArrowLeft' ||
                  event.key === 'ArrowRight' ||
                  event.key === 'ArrowUp' ||
                  event.key === 'ArrowDown'
                ) {
                  event.stopPropagation();
                }

                if (event.key === 'Enter') {
                  event.preventDefault();
                  event.stopPropagation();
                  commitInputValue(event.currentTarget.value);
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  setInputValue(committedInputValue);
                  setInputError(null);
                  event.currentTarget.blur();
                }
              }}
              placeholder="0.19, 1, 0.22, 1 or step"
              type="text"
              value={inputValue}
            />
            {inputError ? (
              <p className="font-mono text-[10px] leading-3 text-[color:var(--destructive)]">
                {inputError}
              </p>
            ) : null}
          </div>
        </div>
      </ScrollFade>
    </div>
  );
}

function TimelineKeyframeEasingPopover({
  easing,
  label,
  onChange,
}: {
  easing?: ToolcraftTimelineKeyframeEasing;
  label: string;
  onChange?: (easing: ToolcraftTimelineKeyframeEasing) => void;
}): React.JSX.Element {
  const resolvedEasing = getToolcraftTimelineKeyframeEasing(easing);

  return (
    <Popover modal={false}>
      <PopoverTrigger
        render={
          <Button
            aria-label={`Edit ${label} keyframe curve`}
            className="text-[color:color-mix(in_oklab,var(--foreground)_75%,transparent)] hover:text-[color:var(--foreground)] data-popup-open:text-[color:var(--foreground)]"
            onClick={stopTimelineEasingEvent}
            onPointerDown={stopTimelineEasingEvent}
            size="icon-sm"
            type="button"
            variant="ghost"
          />
        }
      >
        <TimelineEasingCurveIcon easing={resolvedEasing} size={16} />
      </PopoverTrigger>
      <PopoverContent
        align="center"
        anchor={getTimelineEasingPopoverAnchor}
        className="toolcraft-panel-surface isolate w-auto gap-0 overflow-hidden rounded-lg border p-0 supports-backdrop-filter:backdrop-blur-2xl supports-backdrop-filter:backdrop-saturate-150"
        data-timeline-keyframe-easing-popover=""
        onClick={stopTimelineEasingEvent}
        onPointerDown={stopTimelineEasingEvent}
        side="bottom"
        sideOffset={6}
      >
        <TimelineEasingPopoverContent
          easing={resolvedEasing}
          onChange={(nextEasing) => onChange?.(nextEasing)}
        />
      </PopoverContent>
    </Popover>
  );
}

function TimelinePanelMask({
  currentTimeSeconds,
  durationSeconds,
  isHandleVisible,
}: {
  currentTimeSeconds: number;
  durationSeconds: number;
  isHandleVisible: boolean;
}): React.JSX.Element {
  const progressRatio = getTimelineProgressRatio(currentTimeSeconds, durationSeconds);
  const progressPercent = getTimelineProgressPercent(currentTimeSeconds, durationSeconds);
  const progressMask =
    progressRatio >= 1 && isHandleVisible
      ? 'linear-gradient(to right, transparent 0%, black 5%, black 100%)'
      : 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 inset-y-[-1px] overflow-hidden rounded-t-lg rounded-b-lg"
      data-slot="timeline-panel-mask"
    >
      <span
        className="absolute inset-x-1 bottom-0 h-px [mask-image:var(--timeline-progress-edge-fade-mask)] [-webkit-mask-image:var(--timeline-progress-edge-fade-mask)]"
        data-slot="timeline-playback-line"
        style={
          {
            '--timeline-progress-edge-fade-mask': progressMask,
          } as CSSProperties
        }
      >
        <span
          className="absolute bottom-0 left-0 h-px rounded-b-lg bg-[color:color-mix(in_oklab,var(--link)_90%,transparent)]"
          data-slot="timeline-playback-progress"
          style={{ width: progressRatio <= 0 ? '0px' : progressPercent }}
        />
      </span>
    </div>
  );
}

function getKeyboardScrubTime({
  currentTimeSeconds,
  durationSeconds,
  key,
}: {
  currentTimeSeconds: number;
  durationSeconds: number;
  key: string;
}): number | null {
  if (key === 'ArrowLeft') {
    return currentTimeSeconds - timelineScrubStepSeconds;
  }

  if (key === 'ArrowRight') {
    return currentTimeSeconds + timelineScrubStepSeconds;
  }

  if (key === 'Home') {
    return 0;
  }

  if (key === 'End') {
    return durationSeconds;
  }

  return null;
}

function TimelinePlaybackStrip({
  currentTimeSeconds,
  durationSeconds,
  isScrubbing,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  stripRef,
}: {
  currentTimeSeconds: number;
  durationSeconds: number;
  isScrubbing: boolean;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  stripRef: React.RefObject<HTMLDivElement | null>;
}): React.JSX.Element {
  const handlePosition = getTimelineHandlePosition(currentTimeSeconds, durationSeconds);

  return (
    <div
      aria-label="Playback position"
      aria-valuemax={Number(formatTimelineSeconds(durationSeconds))}
      aria-valuemin={0}
      aria-valuenow={Number(formatTimelineSeconds(currentTimeSeconds))}
      className={cn(
        'group/timeline-strip absolute right-[-11px] bottom-[-5px] left-[-5px] z-0 h-2 cursor-ew-resize touch-none outline-none',
        isScrubbing && 'cursor-grabbing',
      )}
      data-dragging={isScrubbing ? 'true' : undefined}
      onKeyDown={onKeyDown}
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      ref={stripRef}
      role="slider"
      tabIndex={0}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-px size-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-[color:var(--link)] opacity-0 shadow-[0_2px_2px_color-mix(in_oklab,var(--background)_70%,transparent)] transition-[opacity,transform] duration-[120ms] ease-out before:absolute before:inset-[-4px] before:content-[""] group-hover/timeline-panel-surface:opacity-100 group-hover/timeline-strip:opacity-100 group-focus-visible/timeline-strip:opacity-100',
          isScrubbing && 'scale-110 opacity-100',
        )}
        data-slot="timeline-playback-handle"
        style={{ left: handlePosition }}
      />
    </div>
  );
}

function getTimelineRulerTicks(durationSeconds: number): number[] {
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => durationSeconds * ratio);
}

function getTimelineRulerMarkRatios(): number[] {
  return Array.from({ length: 33 }, (_value, index) => index / 32);
}

function getTimelineTrackPositionStyle(
  currentTimeSeconds: number,
  durationSeconds: number,
): CSSProperties {
  const ratio = Math.max(0, Math.min(1, currentTimeSeconds / durationSeconds));

  return getTimelineCalcPositionStyle(
    ratio,
    timelineExpandedTrackStartOffsetPx * (1 - ratio) - timelineExpandedTrackEndOffsetPx * ratio,
  );
}

function getTimelineKeyframePositionStyle(
  timeSeconds: number,
  durationSeconds: number,
): CSSProperties {
  const ratio = Math.max(0, Math.min(1, timeSeconds / durationSeconds));

  return getTimelineCalcPositionStyle(ratio, timelineTrackStartVisualOffsetPx * (1 - ratio));
}

function getTimelineTrackTimeFromClientX({
  clientX,
  durationSeconds,
  trackElement,
}: {
  clientX: number;
  durationSeconds: number;
  trackElement: HTMLElement;
}): number {
  const rect = trackElement.getBoundingClientRect();
  const trackLeft = rect.left + timelineTrackStartVisualOffsetPx;
  const trackWidth = Math.max(
    1,
    rect.width - timelineTrackStartVisualOffsetPx - timelineTrackEndInsetPx,
  );
  const ratio = Math.max(0, Math.min(1, (clientX - trackLeft) / trackWidth));

  return getRoundedKeyframeTime(clampTimelineTime(durationSeconds * ratio, durationSeconds));
}

function getTimelineCalcPositionStyle(ratio: number, pixelOffset: number): CSSProperties {
  const roundedPixelOffset = Number.parseFloat(pixelOffset.toFixed(3));
  const offsetOperator = roundedPixelOffset < 0 ? '-' : '+';

  return {
    left: `calc(${ratio * 100}% ${offsetOperator} ${Math.abs(roundedPixelOffset)}px)`,
  };
}

function getTimelineEventTargetElement(target: EventTarget | null): Element | null {
  return target instanceof Element ? target : null;
}

function isTimelineInteractiveElement(target: EventTarget | null): boolean {
  return Boolean(
    getTimelineEventTargetElement(target)?.closest(
      "button, input, textarea, select, [contenteditable='true'], [role='button']",
    ),
  );
}

function isEditableTimelineEventTarget(target: EventTarget | null): boolean {
  return Boolean(
    getTimelineEventTargetElement(target)?.closest(
      "input, textarea, select, [contenteditable='true']",
    ),
  );
}

type TimelineKeyframeDragState = {
  controlId: string;
  didMove: boolean;
  initialTimeSeconds: number;
  keyframeId: string;
  latestTimeSeconds: number;
  pointerId: number;
  trackElement: HTMLElement;
  wasSelectedOnPointerDown: boolean;
};

function findTimelineKeyframe(
  keyframeGroups: readonly ToolcraftTimelineKeyframeGroup[],
  keyframeId: string | null,
): ToolcraftTimelineKeyframe | undefined {
  if (!keyframeId) {
    return undefined;
  }

  for (const group of keyframeGroups) {
    const keyframe = group.keyframes.find((currentKeyframe) => currentKeyframe.id === keyframeId);

    if (keyframe) {
      return keyframe;
    }
  }

  return undefined;
}

function TimelineKeyframeRow({
  durationSeconds,
  group,
  isScrubbing,
  onChangeKeyframeEasing,
  onDeleteControlKeyframes,
  onKeyframeDragStart,
  onMoveKeyframe,
  onSelectedKeyframeChange,
  selectedKeyframeId,
}: {
  durationSeconds: number;
  group: ToolcraftTimelineKeyframeGroup;
  isScrubbing: boolean;
  onChangeKeyframeEasing: (keyframeId: string, easing: ToolcraftTimelineKeyframeEasing) => void;
  onDeleteControlKeyframes: (controlId: string) => void;
  onKeyframeDragStart: () => void;
  onMoveKeyframe: (keyframeId: string, timeSeconds: number) => string | null;
  onSelectedKeyframeChange: (keyframeId: string | null) => void;
  selectedKeyframeId: string | null;
}): React.JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const [draftKeyframeTimes, setDraftKeyframeTimes] = useState<Record<string, number>>({});
  const keyframeDragRef = useRef<TimelineKeyframeDragState | null>(null);
  const keyframeClickIntentRef = useRef<{
    didMove: boolean;
    keyframeId: string;
    wasSelectedOnPointerDown: boolean;
  } | null>(null);
  const selectedGroupKeyframe = group.keyframes.find(
    (keyframe) => keyframe.id === selectedKeyframeId,
  );
  const getKeyframeTrackElement = (target: Element): HTMLElement | null =>
    target.closest('[data-slot="timeline-keyframe-track"]');
  const handleKeyframePointerDown = (
    event: React.PointerEvent<HTMLButtonElement>,
    keyframe: ToolcraftTimelineKeyframe,
  ): void => {
    const trackElement = getKeyframeTrackElement(event.currentTarget);

    if (!trackElement) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    onSelectedKeyframeChange(keyframe.id);
    onKeyframeDragStart();
    const wasSelectedOnPointerDown = keyframe.id === selectedKeyframeId;

    keyframeClickIntentRef.current = {
      didMove: false,
      keyframeId: keyframe.id,
      wasSelectedOnPointerDown,
    };
    keyframeDragRef.current = {
      controlId: keyframe.controlId,
      didMove: false,
      initialTimeSeconds: keyframe.timeSeconds,
      keyframeId: keyframe.id,
      latestTimeSeconds: keyframe.timeSeconds,
      pointerId: event.pointerId,
      trackElement,
      wasSelectedOnPointerDown,
    };
  };
  const handleKeyframePointerMove = (event: React.PointerEvent<HTMLButtonElement>): void => {
    const dragState = keyframeDragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextTimeSeconds = getTimelineTrackTimeFromClientX({
      clientX: event.clientX,
      durationSeconds,
      trackElement: dragState.trackElement,
    });

    dragState.latestTimeSeconds = nextTimeSeconds;
    const didMove = nextTimeSeconds !== dragState.initialTimeSeconds;
    dragState.didMove = didMove;

    if (keyframeClickIntentRef.current?.keyframeId === dragState.keyframeId) {
      keyframeClickIntentRef.current.didMove = didMove;
    }

    setDraftKeyframeTimes((currentDrafts) =>
      currentDrafts[dragState.keyframeId] === nextTimeSeconds
        ? currentDrafts
        : { ...currentDrafts, [dragState.keyframeId]: nextTimeSeconds },
    );
  };
  const endKeyframeDrag = (event: React.PointerEvent<HTMLButtonElement>): void => {
    const dragState = keyframeDragRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (dragState.didMove) {
      const nextSelectedKeyframeId = onMoveKeyframe(
        dragState.keyframeId,
        dragState.latestTimeSeconds,
      );

      onSelectedKeyframeChange(
        nextSelectedKeyframeId ?? getKeyframeId(dragState.controlId, dragState.latestTimeSeconds),
      );
    }

    setDraftKeyframeTimes((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };

      delete nextDrafts[dragState.keyframeId];
      return nextDrafts;
    });
    keyframeDragRef.current = null;
  };

  return (
    <motion.div
      animate={{ height: timelineKeyframeRowHeightPx, opacity: 1 }}
      className={cn(
        'w-full shrink-0 overflow-hidden border-t border-[color:color-mix(in_oklab,var(--border)_6%,transparent)] transition-colors duration-150 ease-out select-none first:border-t-0',
        selectedGroupKeyframe
          ? 'bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)]'
          : !isScrubbing && 'hover:bg-[color:color-mix(in_oklab,var(--foreground)_3%,transparent)]',
      )}
      data-scrubbing={isScrubbing ? 'true' : 'false'}
      data-slot="timeline-keyframe-row"
      data-visible={isVisible ? 'true' : 'false'}
      exit={{ height: 0, opacity: 0 }}
      initial={{ height: 0, opacity: 0 }}
      transition={timelineKeyframePresenceTransition}
    >
      <div className="grid h-9 w-full grid-cols-[164px_minmax(0,1fr)_36px] overflow-visible">
        <div className="flex h-full min-w-0 items-center gap-1.5 border-r border-[color:color-mix(in_oklab,var(--border)_6%,transparent)] pr-1.5 pl-1 text-[11px] leading-4 text-[color:color-mix(in_oklab,var(--foreground)_75%,transparent)] select-none">
          <TimelineIconButton
            label={`Toggle ${group.label} visibility`}
            onClick={() => setIsVisible((currentValue) => !currentValue)}
            size="icon-sm"
            tooltipSide="top"
          >
            {isVisible ? (
              <Eye data-icon="visibility-visible" />
            ) : (
              <EyeOff data-icon="visibility-hidden" />
            )}
          </TimelineIconButton>
          <span
            className={cn(
              'block min-w-0 flex-1 truncate pr-2 transition-[color,opacity] duration-150 ease-out',
              !isVisible && 'text-[color:var(--foreground)] opacity-40',
            )}
            title={group.label}
          >
            {group.label}
          </span>
          {selectedGroupKeyframe ? (
            <span className="ml-auto flex shrink-0" data-slot="timeline-keyframe-easing-control">
              <TimelineKeyframeEasingPopover
                easing={selectedGroupKeyframe.easing}
                label={group.label}
                onChange={(nextEasing) =>
                  onChangeKeyframeEasing(selectedGroupKeyframe.id, nextEasing)
                }
              />
            </span>
          ) : null}
        </div>
        <div
          className="relative h-full min-h-0 overflow-visible border-r border-[color:color-mix(in_oklab,var(--border)_6%,transparent)]"
          data-slot="timeline-keyframe-track"
        >
          <div
            className={cn(
              'absolute inset-0 overflow-visible',
              isVisible ? 'text-[color:var(--link)]' : 'text-[color:var(--foreground)]',
            )}
            data-slot="timeline-keyframe-track-content"
            style={{ opacity: isVisible ? undefined : 0.15 }}
          >
            <span
              className={cn(
                'absolute top-1/2 right-0 h-px -translate-y-1/2',
                isVisible
                  ? 'bg-[color:color-mix(in_oklab,currentColor_40%,transparent)]'
                  : 'bg-current',
              )}
              style={{ left: timelineTrackStartVisualOffsetPx }}
            />
            <AnimatePresence initial={false}>
              {group.keyframes.map((keyframe) => {
                const isSelected = keyframe.id === selectedKeyframeId;
                const displayTimeSeconds = draftKeyframeTimes[keyframe.id] ?? keyframe.timeSeconds;

                return (
                  <motion.button
                    animate={{ opacity: 1 }}
                    aria-label={`${group.label} keyframe at ${formatTimelineSeconds(
                      keyframe.timeSeconds,
                    )}s`}
                    aria-pressed={isSelected}
                    className="absolute top-1/2 z-30 m-0 size-2 -translate-x-1/2 -translate-y-1/2 cursor-default appearance-none border-0 bg-transparent p-0 text-current outline-none"
                    data-selected={isSelected ? 'true' : undefined}
                    data-slot="timeline-keyframe"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    key={keyframe.id}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const clickIntent = keyframeClickIntentRef.current;

                      keyframeClickIntentRef.current = null;

                      if (clickIntent?.didMove) {
                        return;
                      }

                      if (clickIntent?.keyframeId === keyframe.id) {
                        onSelectedKeyframeChange(
                          clickIntent.wasSelectedOnPointerDown ? null : keyframe.id,
                        );
                        return;
                      }

                      onSelectedKeyframeChange(isSelected ? null : keyframe.id);
                    }}
                    onPointerCancel={endKeyframeDrag}
                    onPointerDown={(event) => handleKeyframePointerDown(event, keyframe)}
                    onPointerMove={handleKeyframePointerMove}
                    onPointerUp={endKeyframeDrag}
                    style={getTimelineKeyframePositionStyle(displayTimeSeconds, durationSeconds)}
                    title={keyframe.valueLabel}
                    transition={timelineKeyframePresenceTransition}
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute top-1/2 left-1/2 block size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px]',
                        isSelected && isVisible ? 'bg-[color:var(--foreground)]' : 'bg-current',
                      )}
                    />
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex h-full min-w-0 items-center justify-center">
          <TimelineIconButton
            label={`Delete ${group.label} keyframes`}
            onClick={() => {
              onSelectedKeyframeChange(null);
              onDeleteControlKeyframes(group.controlId);
            }}
            size="icon-sm"
            tooltipSide="top"
          >
            <Trash2 />
          </TimelineIconButton>
        </div>
      </div>
    </motion.div>
  );
}

function TimelineExpandedContent({
  currentTimeSeconds,
  durationSeconds,
  isScrubbing,
  keyframeGroups,
  onChangeKeyframeEasing,
  onDeleteControlKeyframes,
  onDeleteKeyframe,
  onKeyframeDragStart,
  onKeyDown,
  onMoveKeyframe,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSelectedKeyframeChange,
  selectedKeyframeId,
  stripRef,
}: {
  currentTimeSeconds: number;
  durationSeconds: number;
  isScrubbing: boolean;
  keyframeGroups: readonly ToolcraftTimelineKeyframeGroup[];
  onChangeKeyframeEasing: (keyframeId: string, easing: ToolcraftTimelineKeyframeEasing) => void;
  onDeleteControlKeyframes: (controlId: string) => void;
  onDeleteKeyframe: (keyframeId: string) => void;
  onKeyframeDragStart: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onMoveKeyframe: (keyframeId: string, timeSeconds: number) => string | null;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onSelectedKeyframeChange: (keyframeId: string | null) => void;
  selectedKeyframeId: string | null;
  stripRef: React.RefObject<HTMLDivElement | null>;
}): React.JSX.Element {
  const trackPlayheadStyle = getTimelineTrackPositionStyle(currentTimeSeconds, durationSeconds);
  const selectedKeyframe = findTimelineKeyframe(keyframeGroups, selectedKeyframeId);
  const deleteSelectedKeyframe = (): void => {
    if (!selectedKeyframeId) {
      return;
    }

    onDeleteKeyframe(selectedKeyframeId);
    onSelectedKeyframeChange(null);
  };
  const moveSelectedKeyframeByStep = (direction: -1 | 1): void => {
    if (!selectedKeyframe) {
      return;
    }

    const nextTimeSeconds = getRoundedKeyframeTime(
      clampTimelineTime(
        selectedKeyframe.timeSeconds + timelineScrubStepSeconds * direction,
        durationSeconds,
      ),
    );

    if (nextTimeSeconds === selectedKeyframe.timeSeconds) {
      return;
    }

    const nextSelectedKeyframeId = onMoveKeyframe(selectedKeyframe.id, nextTimeSeconds);

    onSelectedKeyframeChange(nextSelectedKeyframeId ?? selectedKeyframe.id);
  };
  const handleExpandedKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (isEditableTimelineEventTarget(event.target)) {
      return;
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      if (!selectedKeyframeId) {
        return;
      }

      event.preventDefault();
      deleteSelectedKeyframe();
      return;
    }

    if (event.key === 'Escape' && selectedKeyframeId) {
      event.preventDefault();
      onSelectedKeyframeChange(null);
      return;
    }

    if (event.key === 'ArrowLeft' && selectedKeyframe) {
      event.preventDefault();
      moveSelectedKeyframeByStep(-1);
      return;
    }

    if (event.key === 'ArrowRight' && selectedKeyframe) {
      event.preventDefault();
      moveSelectedKeyframeByStep(1);
      return;
    }

    onKeyDown(event);
  };
  const handleExpandedPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    const targetElement = getTimelineEventTargetElement(event.target);
    const clickedKeyframe = targetElement?.closest('[data-slot="timeline-keyframe"]');
    const clickedInteractiveElement = isTimelineInteractiveElement(event.target);

    if (!clickedKeyframe && !clickedInteractiveElement && selectedKeyframeId) {
      onSelectedKeyframeChange(null);
    }

    if (clickedInteractiveElement && !clickedKeyframe) {
      return;
    }

    onPointerDown(event);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-slot="timeline-expanded">
      <div className="relative grid h-9 min-w-0 shrink-0 grid-cols-[164px_minmax(0,1fr)_36px] after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-px after:h-px after:bg-[color:color-mix(in_oklab,var(--border)_20%,transparent)]">
        <div className="flex min-w-0 items-center px-3 text-[11px] leading-4 text-[color:color-mix(in_oklab,var(--foreground)_75%,transparent)] select-none">
          <span className="min-w-0 truncate opacity-60">Properties</span>
        </div>
        <div className="relative min-w-0 text-[10px] leading-none text-[color:color-mix(in_oklab,var(--muted-foreground)_80%,transparent)] tabular-nums">
          <div
            className="absolute top-[13px] h-2 overflow-visible"
            data-slot="timeline-expanded-ruler-labels"
            style={{ left: timelineRulerLeftInsetPx, right: timelineRulerRightInsetPx }}
          >
            {getTimelineRulerTicks(durationSeconds).map((tick, index, ticks) => (
              <span
                className="absolute top-0 -translate-x-1/2 text-center"
                key={tick.toFixed(2)}
                style={{ left: `${(index / (ticks.length - 1)) * 100}%` }}
              >
                {Math.round(tick)}
              </span>
            ))}
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 h-2"
            data-slot="timeline-expanded-ruler"
            style={{ left: timelineRulerLeftInsetPx, right: timelineRulerRightInsetPx }}
          >
            {getTimelineRulerMarkRatios().map((ratio, index) => (
              <span
                className={cn(
                  'absolute bottom-0 w-px -translate-x-1/2',
                  index % 8 === 0
                    ? 'h-2.5 bg-[color:color-mix(in_oklab,var(--border)_20%,transparent)]'
                    : 'h-1.5 bg-[color:color-mix(in_oklab,var(--border)_10%,transparent)]',
                )}
                data-major-tick={index % 8 === 0 ? 'true' : undefined}
                key={ratio}
                style={{ left: `${ratio * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="min-w-0" />
      </div>
      <div
        aria-label="Playback position"
        aria-valuemax={Number(formatTimelineSeconds(durationSeconds))}
        aria-valuemin={0}
        aria-valuenow={Number(formatTimelineSeconds(currentTimeSeconds))}
        className="group/timeline-expanded-scrubber relative min-h-0 flex-1 touch-none overflow-visible outline-none select-none"
        data-dragging={isScrubbing ? 'true' : undefined}
        data-slot="timeline-expanded-scrubber"
        data-timeline-track-end={timelineExpandedTrackEndOffsetPx}
        data-timeline-track-start={timelineExpandedTrackStartOffsetPx}
        onKeyDown={handleExpandedKeyDown}
        onPointerCancel={onPointerUp}
        onPointerDown={handleExpandedPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        ref={stripRef}
        role="slider"
        tabIndex={0}
      >
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 z-20 w-px -translate-x-1/2 bg-[color:var(--foreground)]"
          data-slot="timeline-expanded-playhead"
          style={trackPlayheadStyle}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0 bottom-0 z-[25] -translate-x-1/2 cursor-ew-resize',
            isScrubbing && 'cursor-grabbing',
          )}
          data-slot="timeline-expanded-playhead-hit-area"
          style={{ ...trackPlayheadStyle, width: timelinePlayheadHitAreaWidthPx }}
        />
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-[-1px] z-30 size-[9px] -translate-x-1/2 -translate-y-1/2 cursor-ew-resize rounded-[2px] bg-[color:var(--foreground)] shadow-[0_2px_2px_color-mix(in_oklab,var(--background)_20%,transparent)] transition-transform duration-[120ms] ease-out',
            isScrubbing && 'scale-[1.25] cursor-grabbing',
          )}
          data-slot="timeline-expanded-playhead-handle"
          style={trackPlayheadStyle}
        />
        <motion.div
          animate={{ opacity: keyframeGroups.length === 0 ? 1 : 0 }}
          aria-hidden={keyframeGroups.length === 0 ? undefined : 'true'}
          className="pointer-events-none absolute inset-0 flex min-h-0 items-center justify-center px-4 text-center text-[11px] leading-4 text-[color:color-mix(in_oklab,var(--foreground)_30%,transparent)]"
          initial={false}
          transition={timelineKeyframePresenceTransition}
        >
          Add your first keyframe from the properties panel.
        </motion.div>
        <AnimatePresence initial={false}>
          {keyframeGroups.map((group) => (
            <TimelineKeyframeRow
              durationSeconds={durationSeconds}
              group={group}
              isScrubbing={isScrubbing}
              key={group.controlId}
              onChangeKeyframeEasing={onChangeKeyframeEasing}
              onDeleteControlKeyframes={onDeleteControlKeyframes}
              onKeyframeDragStart={onKeyframeDragStart}
              onMoveKeyframe={onMoveKeyframe}
              onSelectedKeyframeChange={onSelectedKeyframeChange}
              selectedKeyframeId={selectedKeyframeId}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function useTimelineClock({
  durationSeconds,
  isHoverPaused,
  isLooping,
  isPlaying,
  isScrubbing,
  setCurrentTimeSeconds,
  setIsPlaying,
}: {
  durationSeconds: number;
  isHoverPaused: boolean;
  isLooping: boolean;
  isPlaying: boolean;
  isScrubbing: boolean;
  setCurrentTimeSeconds: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}): void {
  useEffect(() => {
    if (
      !isPlaying ||
      isHoverPaused ||
      isScrubbing ||
      typeof window === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function'
    ) {
      return;
    }

    let frame = 0;
    let previousTimestamp = window.performance.now();
    const tick = (timestamp: number) => {
      const elapsedSeconds = (timestamp - previousTimestamp) / 1000;

      previousTimestamp = timestamp;
      setCurrentTimeSeconds((currentValue) => {
        const nextValue = currentValue + elapsedSeconds;

        if (nextValue < durationSeconds) {
          return nextValue;
        }

        if (isLooping) {
          return getToolcraftTimelineLoopTime({
            currentTimeSeconds: nextValue,
            durationSeconds,
          });
        }

        setIsPlaying(false);
        return durationSeconds;
      });
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frame);
  }, [
    durationSeconds,
    isHoverPaused,
    isLooping,
    isPlaying,
    isScrubbing,
    setCurrentTimeSeconds,
    setIsPlaying,
  ]);
}

function useTimelineScrubber({
  currentTimeSeconds,
  disabled = false,
  durationSeconds,
  setCurrentTimeSeconds,
  setIsPlaying,
}: {
  currentTimeSeconds: number;
  disabled?: boolean;
  durationSeconds: number;
  setCurrentTimeSeconds: React.Dispatch<React.SetStateAction<number>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [isScrubbing, setIsScrubbing] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disabled && isScrubbing) {
      setIsScrubbing(false);
    }
  }, [disabled, isScrubbing]);

  const getScrubGeometry = (): { rect: DOMRect; trackStart: number; trackWidth: number } | null => {
    const rect = stripRef.current?.getBoundingClientRect();

    if (!(rect && rect.width > 0)) {
      return null;
    }

    const rawTrackStart = Number.parseFloat(stripRef.current?.dataset.timelineTrackStart ?? '0');
    const trackStart = Number.isFinite(rawTrackStart) ? rawTrackStart : 0;
    const rawTrackEndInset = Number.parseFloat(stripRef.current?.dataset.timelineTrackEnd ?? '0');
    const trackEndInset = Number.isFinite(rawTrackEndInset) ? rawTrackEndInset : 0;
    const trackWidth = Math.max(1, rect.width - trackStart - trackEndInset);

    return { rect, trackStart, trackWidth };
  };
  const canStartScrubbingFromPointerEvent = (
    event: React.PointerEvent<HTMLDivElement>,
  ): boolean => {
    const geometry = getScrubGeometry();

    if (!geometry) {
      return false;
    }

    const isExpandedTimeline = geometry.trackStart > 0;
    const startedFromExpandedPlayhead =
      event.target instanceof Element &&
      event.target.closest(
        [
          '[data-slot="timeline-expanded-playhead"]',
          '[data-slot="timeline-expanded-playhead-handle"]',
          '[data-slot="timeline-expanded-playhead-hit-area"]',
        ].join(','),
      );

    if (isExpandedTimeline) {
      return Boolean(startedFromExpandedPlayhead);
    }

    return event.clientX >= geometry.rect.left + geometry.trackStart;
  };
  const setCurrentTimeFromClientX = (clientX: number): void => {
    const geometry = getScrubGeometry();

    if (!geometry) {
      return;
    }

    const { rect, trackStart, trackWidth } = geometry;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left - trackStart) / trackWidth));

    setCurrentTimeSeconds(clampTimelineTime(durationSeconds * ratio, durationSeconds));
  };
  const handleScrubKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    if (disabled) {
      return;
    }

    const nextTime = getKeyboardScrubTime({
      currentTimeSeconds,
      durationSeconds,
      key: event.key,
    });

    if (nextTime === null) {
      return;
    }

    event.preventDefault();
    setCurrentTimeSeconds(clampTimelineTime(nextTime, durationSeconds));
  };
  const handleScrubPointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (disabled || !canStartScrubbingFromPointerEvent(event)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPlaying(false);
    setIsScrubbing(true);
    setCurrentTimeFromClientX(event.clientX);
  };
  const handleScrubPointerMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!isScrubbing) {
      return;
    }

    setCurrentTimeFromClientX(event.clientX);
  };
  const handleScrubPointerUp = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (!isScrubbing) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsScrubbing(false);
  };

  return {
    handleScrubKeyDown,
    handleScrubPointerDown,
    handleScrubPointerMove,
    handleScrubPointerUp,
    isScrubbing,
    stripRef,
  };
}

function selectTimelineEditableText(node: HTMLElement): void {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

function TimelineDurationValue({
  durationSeconds,
  onCommit,
}: {
  durationSeconds: number;
  onCommit: (value: string) => void;
}): React.JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const editorRef = useRef<HTMLSpanElement>(null);
  const valueLabel = formatDurationValueLabel(durationSeconds);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    editor.textContent = valueLabel;
    editor.focus();
    selectTimelineEditableText(editor);
  }, [isEditing, valueLabel]);

  function commitDraft(): void {
    onCommit(editorRef.current?.textContent ?? valueLabel);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <span
        aria-label="timeline duration"
        className="block h-5 min-w-[3ch] !cursor-text overflow-hidden whitespace-nowrap rounded bg-[color:color-mix(in_oklab,var(--foreground)_8%,transparent)] px-1 font-sans text-xs leading-5 text-[color:var(--foreground)] outline-none tabular-nums"
        contentEditable
        data-slot="timeline-duration-editor"
        key="duration-editor"
        onBlur={commitDraft}
        onFocus={(event) => selectTimelineEditableText(event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitDraft();
          }

          if (event.key === 'Escape') {
            event.preventDefault();
            setIsEditing(false);
          }
        }}
        onPointerDown={(event) => event.stopPropagation()}
        ref={editorRef}
        role="textbox"
        suppressContentEditableWarning
        tabIndex={0}
      />
    );
  }

  return (
    <button
      aria-label="Edit timeline duration"
      className="block h-5 min-w-[3ch] shrink-0 !cursor-text overflow-hidden rounded px-1 font-sans text-xs leading-5 text-[color:var(--muted-foreground)] tabular-nums transition-colors duration-150 ease-out group-hover/timeline-panel-header:bg-[color:color-mix(in_oklab,var(--foreground)_8%,transparent)] focus-visible:bg-[color:color-mix(in_oklab,var(--foreground)_8%,transparent)] focus-visible:outline-none"
      data-slot="timeline-duration-display"
      key="duration-display"
      onClick={(event) => {
        event.stopPropagation();
        setIsEditing(true);
      }}
      onPointerDown={(event) => event.stopPropagation()}
      type="button"
    >
      {valueLabel}
    </button>
  );
}

function TimelinePanelHeader({
  canExpand,
  currentTimeSeconds,
  durationSeconds,
  isExpanded,
  isLooping,
  isPlaying,
  isScrubbing,
  playbackReady,
  onDurationCommit,
  onScrubKeyDown,
  onScrubPointerDown,
  onScrubPointerMove,
  onScrubPointerUp,
  onToggleExpanded,
  onToggleLoop,
  onTogglePlayback,
  stripRef,
  variant,
}: {
  canExpand: boolean;
  currentTimeSeconds: number;
  durationSeconds: number;
  isExpanded: boolean;
  isLooping: boolean;
  isPlaying: boolean;
  isScrubbing: boolean;
  playbackReady: boolean;
  onDurationCommit: (value: string) => void;
  onScrubKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onScrubPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onScrubPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onScrubPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onToggleExpanded: () => void;
  onToggleLoop: () => void;
  onTogglePlayback: () => void;
  stripRef: React.RefObject<HTMLDivElement | null>;
  variant: 'compact' | 'extended';
}): React.JSX.Element {
  if (variant === 'compact') {
    return (
      <div
        className="relative flex h-full min-w-0 shrink-0 items-center justify-center"
        data-slot="timeline-panel-header"
        data-timeline-panel-variant="compact"
      >
        <div
          className="relative z-10 inline-flex shrink-0 items-center"
          data-slot="timeline-transport-controls"
        >
          <TimelineIconButton
            disabled={!playbackReady}
            label={isPlaying ? 'Pause playback' : 'Play playback'}
            onClick={onTogglePlayback}
          >
            {isPlaying ? <Pause /> : <Play />}
          </TimelineIconButton>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group/timeline-panel-header relative flex min-w-0 shrink-0 items-center gap-1',
        isExpanded
          ? 'h-9 border-b border-[color:color-mix(in_oklab,var(--border)_8%,transparent)] p-1'
          : 'h-full',
      )}
      data-slot="timeline-panel-header"
    >
      <div
        className="relative z-10 inline-flex shrink-0 items-center gap-1"
        data-slot="timeline-transport-controls"
      >
        <TimelineIconButton
          disabled={!playbackReady}
          label={isPlaying ? 'Pause playback' : 'Play playback'}
          onClick={onTogglePlayback}
        >
          {isPlaying ? <Pause /> : <Play />}
        </TimelineIconButton>
        <TimelineIconButton
          label={isLooping ? 'Disable loop' : 'Enable loop'}
          onClick={onToggleLoop}
        >
          {isLooping ? <Repeat data-icon="loop-enabled" /> : <Repeat1 data-icon="loop-disabled" />}
        </TimelineIconButton>
      </div>
      <TimelinePanelDivider />
      <div className="ml-2 inline-flex shrink-0 items-center gap-1 text-xs leading-5 text-[color:color-mix(in_oklab,var(--foreground)_90%,transparent)]">
        <span>{isExpanded ? 'Duration:' : 'Dur:'}</span>
        <TimelineDurationValue
          durationSeconds={durationSeconds}
          onCommit={onDurationCommit}
        />
      </div>
      <span
        className={cn(
          'flex-1 cursor-default overflow-hidden text-right font-sans text-[11px] leading-5 whitespace-nowrap text-[color:var(--muted-foreground)] tabular-nums [contain:paint] select-none',
          isExpanded ? 'min-w-[5.5rem]' : 'min-w-0',
        )}
      >
        {formatTimelineHeaderTimeLabel({ currentTimeSeconds, durationSeconds })}
      </span>
      {canExpand ? (
        <span className="relative z-10 flex shrink-0" data-slot="timeline-panel-expand-toggle">
          <TimelineIconButton
            label={isExpanded ? 'Collapse timeline panel' : 'Expand timeline panel'}
            onClick={onToggleExpanded}
            tooltipSide="top"
          >
            <PrimitiveArrowIcon direction={isExpanded ? 'up' : 'down'} />
          </TimelineIconButton>
        </span>
      ) : null}
      {isExpanded ? null : (
        <TimelinePlaybackStrip
          currentTimeSeconds={currentTimeSeconds}
          durationSeconds={durationSeconds}
          isScrubbing={isScrubbing}
          onKeyDown={onScrubKeyDown}
          onPointerDown={onScrubPointerDown}
          onPointerMove={onScrubPointerMove}
          onPointerUp={onScrubPointerUp}
          stripRef={stripRef}
        />
      )}
    </div>
  );
}

export function TimelinePanel({
  className,
  defaultExpanded = false,
  framed = true,
  onPanelStateChange,
  panelPlacement,
  panelState,
  variant = 'extended',
}: TimelinePanelProps): React.JSX.Element | null {
  const { dispatch, state } = useToolcraft();

  if (!state.schema.panels.timeline) {
    return null;
  }

  const keyframesEnabled = state.schema.assembly.capabilities.includes('timeline.keyframes');
  const playbackReady = isTimelineReadyForPlayback(state.schema, state.mediaAssets);

  const {
    currentTimeSeconds,
    durationSeconds,
    expanded,
    isLooping,
    isPlaying,
    keyframeGroups,
    selectedKeyframeId,
  } = state.timeline;
  const [defaultExpandedPending, setDefaultExpandedPending] = useState(defaultExpanded);
  const [isHoverPaused, setIsHoverPaused] = useState(false);
  const displayedIsPlaying = playbackReady && isPlaying;
  const isCompact = variant === 'compact';
  const isExpanded = !isCompact && keyframesEnabled && (expanded || defaultExpandedPending);
  const expandedPanelSize = getTimelinePanelExpandedSize(keyframeGroups);
  const previousIsExpandedRef = useRef(isExpanded);
  const timelineRef = useRef(state.timeline);
  const isExpandCollapseTransition = previousIsExpandedRef.current !== isExpanded;
  const timelinePanelTransition = isExpandCollapseTransition
    ? timelinePanelExpandCollapseTransition
    : timelinePanelResizeTransition;

  useEffect(() => {
    timelineRef.current = state.timeline;
  }, [state.timeline]);
  useEffect(() => {
    previousIsExpandedRef.current = isExpanded;
  }, [isExpanded]);
  useEffect(() => {
    if (playbackReady) {
      return;
    }

    if (currentTimeSeconds !== 0) {
      dispatch({ currentTimeSeconds: 0, type: 'timeline.setCurrentTime' });
    }

    if (isPlaying) {
      dispatch({ isPlaying: false, type: 'timeline.setPlaying' });
    }
  }, [currentTimeSeconds, dispatch, isPlaying, playbackReady]);
  useEffect(() => {
    if (!defaultExpanded || !keyframesEnabled) {
      return;
    }

    dispatch({ expanded: true, type: 'timeline.setExpanded' });
    setDefaultExpandedPending(false);
  }, [defaultExpanded, dispatch, keyframesEnabled]);

  const setCurrentTimeSeconds = useCallback(
    (nextValue: React.SetStateAction<number>): void => {
      const resolvedValue =
        typeof nextValue === 'function'
          ? nextValue(timelineRef.current.currentTimeSeconds)
          : nextValue;

      dispatch({ currentTimeSeconds: resolvedValue, type: 'timeline.setCurrentTime' });
    },
    [dispatch],
  );
  const setIsPlaying = useCallback(
    (nextValue: React.SetStateAction<boolean>): void => {
      const resolvedValue =
        typeof nextValue === 'function' ? nextValue(timelineRef.current.isPlaying) : nextValue;

      dispatch({ isPlaying: resolvedValue, type: 'timeline.setPlaying' });
    },
    [dispatch],
  );
  const setSelectedKeyframeId = useCallback(
    (keyframeId: string | null): void => {
      dispatch({ keyframeId, type: 'timeline.selectKeyframe' });
    },
    [dispatch],
  );
  const scrubber = useTimelineScrubber({
    currentTimeSeconds,
    disabled: !playbackReady,
    durationSeconds,
    setCurrentTimeSeconds,
    setIsPlaying,
  });
  const deleteKeyframe = useCallback(
    (keyframeId: string): void => {
      dispatch({ keyframeId, type: 'timeline.deleteKeyframe' });
    },
    [dispatch],
  );
  const moveKeyframe = useCallback(
    (keyframeId: string, nextTimeSeconds: number): string | null => {
      const targetKeyframe = findTimelineKeyframe(keyframeGroups, keyframeId);

      if (!targetKeyframe) {
        return null;
      }

      const nextSelectedKeyframeId = getKeyframeId(targetKeyframe.controlId, nextTimeSeconds);

      dispatch({
        keyframeId,
        timeSeconds: nextTimeSeconds,
        type: 'timeline.moveKeyframe',
      });

      return nextSelectedKeyframeId;
    },
    [dispatch, keyframeGroups],
  );

  useTimelineClock({
    durationSeconds,
    isHoverPaused,
    isLooping,
    isPlaying: displayedIsPlaying,
    isScrubbing: scrubber.isScrubbing,
    setCurrentTimeSeconds,
    setIsPlaying,
  });

  useEffect(() => {
    if (!selectedKeyframeId || typeof document === 'undefined') {
      return;
    }

    const handleDocumentKeyDown = (event: KeyboardEvent): void => {
      if (
        event.defaultPrevented ||
        (event.key !== 'Delete' && event.key !== 'Backspace' && event.key !== 'Escape') ||
        isEditableTimelineEventTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();

      if (event.key === 'Escape') {
        setSelectedKeyframeId(null);
        return;
      }

      deleteKeyframe(selectedKeyframeId);
    };

    document.addEventListener('keydown', handleDocumentKeyDown);

    return () => {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [deleteKeyframe, selectedKeyframeId]);

  useEffect(() => {
    if (!selectedKeyframeId || typeof document === 'undefined') {
      return;
    }

    const handleDocumentPointerDown = (event: PointerEvent): void => {
      const targetElement = getTimelineEventTargetElement(event.target);
      const clickedKeyframe = targetElement?.closest('[data-slot="timeline-keyframe"]');
      const clickedEasingPopover = targetElement?.closest(
        '[data-timeline-keyframe-easing-popover]',
      );
      const clickedTimelinePanel = targetElement?.closest('[data-slot="timeline-panel"]');
      const clickedTimelineInteractiveElement =
        clickedTimelinePanel && isTimelineInteractiveElement(event.target);

      if (!clickedKeyframe && !clickedEasingPopover && !clickedTimelineInteractiveElement) {
        setSelectedKeyframeId(null);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true });

    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
    };
  }, [selectedKeyframeId]);

  const commitDurationValue = (nextValue: string): void => {
    const nextDuration = clampTimelineDuration(Number.parseFloat(nextValue));

    dispatch({ durationSeconds: nextDuration, type: 'timeline.setDuration' });
  };
  const deleteControlKeyframes = (controlId: string): void => {
    dispatch({ controlId, type: 'timeline.deleteControlKeyframes' });
  };
  const changeKeyframeEasing = (
    keyframeId: string,
    nextEasing: ToolcraftTimelineKeyframeEasing,
  ): void => {
    dispatch({ easing: nextEasing, keyframeId, type: 'timeline.changeKeyframeEasing' });
  };
  const resolvedPanelPlacement = panelPlacement ?? (framed ? 'frame' : 'surface');
  const shouldConstrainToContainer = resolvedPanelPlacement === 'surface';
  const { panelRef: timelineSurfaceRef, responsiveLayout } = useTimelinePanelResponsiveLayout(
    isExpanded && !shouldConstrainToContainer,
  );
  const unconstrainedTimelinePanelWidth = isCompact
    ? timelinePanelCompactWidthPx
    : isExpanded
    ? expandedPanelSize.width
    : timelinePanelCollapsedWidthPx;
  const timelinePanelWidth =
    isExpanded && responsiveLayout !== null
      ? Math.min(unconstrainedTimelinePanelWidth, responsiveLayout.width)
      : unconstrainedTimelinePanelWidth;
  const timelinePanelOffsetX =
    isExpanded && responsiveLayout !== null ? responsiveLayout.offsetX : 0;
  const timelinePanelLayoutStyle: CSSProperties = {
    transform: timelinePanelOffsetX !== 0 ? `translateX(${timelinePanelOffsetX}px)` : undefined,
  };
  const timelinePanelAnimation = {
    height: isExpanded ? expandedPanelSize.height : timelinePanelCollapsedSize.height,
    ...(shouldConstrainToContainer
      ? { maxWidth: timelinePanelWidth }
      : { width: timelinePanelWidth }),
  };

  const timelineSurface = (
    <motion.div
      animate={timelinePanelAnimation}
      className={cn(
        'pointer-events-auto origin-top',
        shouldConstrainToContainer ? 'w-full' : 'max-w-full',
        !framed && className,
      )}
      data-expanded-height={isExpanded ? expandedPanelSize.height : undefined}
      data-responsive-width={
        timelinePanelWidth < unconstrainedTimelinePanelWidth ? timelinePanelWidth : undefined
      }
      data-responsive-offset-x={timelinePanelOffsetX !== 0 ? timelinePanelOffsetX : undefined}
      data-hover-paused={isHoverPaused ? 'true' : 'false'}
      data-playback-ready={playbackReady ? 'true' : 'false'}
      data-scrubbing={scrubber.isScrubbing ? 'true' : 'false'}
      data-slot="timeline-panel"
      data-timeline-panel-variant={variant}
      initial={false}
      ref={timelineSurfaceRef}
      style={timelinePanelLayoutStyle}
      transition={timelinePanelTransition}
    >
      <PanelSurface
        className={cn(
          'group/timeline-panel-surface relative flex h-full w-full flex-col rounded-t-lg rounded-b-lg',
          isExpanded ? 'overflow-hidden' : 'overflow-visible p-1',
          !isCompact && !isExpanded && !keyframesEnabled && 'pr-3',
        )}
        data-panel-id="timeline"
        onPointerEnter={() => setIsHoverPaused(true)}
        onPointerLeave={(event) => {
          const nextTarget = event.relatedTarget;

          if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
            return;
          }

          setIsHoverPaused(false);
        }}
      >
        {!isCompact && !isExpanded ? (
          <TimelinePanelMask
            currentTimeSeconds={currentTimeSeconds}
            durationSeconds={durationSeconds}
            isHandleVisible={isHoverPaused || scrubber.isScrubbing}
          />
        ) : null}
        <TimelinePanelHeader
          canExpand={keyframesEnabled}
          currentTimeSeconds={currentTimeSeconds}
          durationSeconds={durationSeconds}
          isExpanded={isExpanded}
          isLooping={isLooping}
          isPlaying={displayedIsPlaying}
          isScrubbing={scrubber.isScrubbing}
          playbackReady={playbackReady}
          onDurationCommit={commitDurationValue}
          onScrubKeyDown={scrubber.handleScrubKeyDown}
          onScrubPointerDown={scrubber.handleScrubPointerDown}
          onScrubPointerMove={scrubber.handleScrubPointerMove}
          onScrubPointerUp={scrubber.handleScrubPointerUp}
          onToggleExpanded={() => {
            setDefaultExpandedPending(false);
            dispatch({ expanded: !isExpanded, type: 'timeline.setExpanded' });
          }}
          onToggleLoop={() => dispatch({ type: 'timeline.toggleLoop' })}
          onTogglePlayback={() => {
            setIsHoverPaused(false);
            dispatch({ type: 'timeline.togglePlayback' });
          }}
          stripRef={scrubber.stripRef}
          variant={variant}
        />
        {isExpanded && keyframesEnabled ? (
          <TimelineExpandedContent
            currentTimeSeconds={currentTimeSeconds}
            durationSeconds={durationSeconds}
            isScrubbing={scrubber.isScrubbing}
            keyframeGroups={keyframeGroups}
            onChangeKeyframeEasing={changeKeyframeEasing}
            onDeleteControlKeyframes={deleteControlKeyframes}
            onDeleteKeyframe={deleteKeyframe}
            onKeyframeDragStart={() => setIsPlaying(false)}
            onKeyDown={scrubber.handleScrubKeyDown}
            onMoveKeyframe={moveKeyframe}
            onPointerDown={scrubber.handleScrubPointerDown}
            onPointerMove={scrubber.handleScrubPointerMove}
            onPointerUp={scrubber.handleScrubPointerUp}
            onSelectedKeyframeChange={setSelectedKeyframeId}
            selectedKeyframeId={selectedKeyframeId}
            stripRef={scrubber.stripRef}
          />
        ) : null}
      </PanelSurface>
    </motion.div>
  );

  return (
    <PanelContainer
      onPanelStateChange={onPanelStateChange}
      panelState={panelState}
      panelType="timeline"
      placement={resolvedPanelPlacement}
    >
      {timelineSurface}
    </PanelContainer>
  );
}

export { TimelinePanel as KeyframesPanel };
