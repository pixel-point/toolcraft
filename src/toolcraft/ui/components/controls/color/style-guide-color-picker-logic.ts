import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  clampNumber,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  type HsvColor,
} from "../../../lib/style-guide-color-utils";
import {
  getColorChannels,
  hslChannelsToHex,
  rgbChannelsToHex,
  type ColorSurfaceModel,
} from "./style-guide-color-picker-channel-utils";

export type DragBounds = Pick<DOMRect, "left" | "top" | "width" | "height">;
export type ColorSurfacePosition = { x: number; y: number };
export type InteractionSource = "surface" | "hue" | "hex";

const PENDING_SURFACE_ACK_RGB_DISTANCE_THRESHOLD = 8;

export function calculateHexDistance(
  leftHex: string | null | undefined,
  rightHex: string | null | undefined,
) {
  const normalizedLeft = normalizeHexColor(leftHex);
  const normalizedRight = normalizeHexColor(rightHex);
  if (!normalizedLeft || !normalizedRight) return Number.POSITIVE_INFINITY;

  const leftValue = normalizedLeft.slice(1);
  const rightValue = normalizedRight.slice(1);
  const leftChannels = [
    Number.parseInt(leftValue.slice(0, 2), 16),
    Number.parseInt(leftValue.slice(2, 4), 16),
    Number.parseInt(leftValue.slice(4, 6), 16),
  ];
  const rightChannels = [
    Number.parseInt(rightValue.slice(0, 2), 16),
    Number.parseInt(rightValue.slice(2, 4), 16),
    Number.parseInt(rightValue.slice(4, 6), 16),
  ];

  return leftChannels.reduce(
    (distance, channel, index) => distance + Math.abs(channel - rightChannels[index]!),
    0,
  );
}

export function resolveHsvFromHex(nextHex: string, fallbackColor: HsvColor): HsvColor {
  const nextColor = hexToHsv(nextHex);
  if (nextColor.v === 0) return { h: fallbackColor.h, s: fallbackColor.s, v: 0 };
  if (nextColor.s === 0) return { h: fallbackColor.h, s: 0, v: nextColor.v };
  return nextColor;
}

export function getSurfacePosition(
  clientX: number,
  clientY: number,
  surfaceBounds: DragBounds,
): ColorSurfacePosition {
  return {
    x: clampNumber((clientX - surfaceBounds.left) / surfaceBounds.width, 0, 1),
    y: clampNumber((clientY - surfaceBounds.top) / surfaceBounds.height, 0, 1),
  };
}

export function getSurfaceHexColor({
  clientX,
  clientY,
  currentColor,
  surfaceBounds,
  surfaceModel,
}: {
  clientX: number;
  clientY: number;
  currentColor: HsvColor;
  surfaceBounds: DragBounds;
  surfaceModel: ColorSurfaceModel;
}): string {
  const { x, y } = getSurfacePosition(clientX, clientY, surfaceBounds);

  if (surfaceModel === "rgb") {
    const [, , blue] = getColorChannels(hsvToHex(currentColor)).rgb;

    return rgbChannelsToHex([
      Math.round(x * 255),
      Math.round((1 - y) * 255),
      blue,
    ]);
  }

  if (surfaceModel === "hsl") {
    return hslChannelsToHex([
      Math.round(currentColor.h),
      Math.round(x * 100),
      Math.round((1 - y) * 100),
    ]);
  }

  return hsvToHex({
    h: currentColor.h,
    s: x,
    v: 1 - y,
  });
}

export function getSurfaceHsvColor({
  clientX,
  clientY,
  currentColor,
  surfaceBounds,
  surfaceModel,
}: {
  clientX: number;
  clientY: number;
  currentColor: HsvColor;
  surfaceBounds: DragBounds;
  surfaceModel: ColorSurfaceModel;
}): HsvColor {
  const { x, y } = getSurfacePosition(clientX, clientY, surfaceBounds);

  if (surfaceModel === "rgb") {
    return resolveHsvFromHex(
      getSurfaceHexColor({
        clientX,
        clientY,
        currentColor,
        surfaceBounds,
        surfaceModel,
      }),
      currentColor,
    );
  }

  if (surfaceModel === "hsl") {
    const nextColor = hexToHsv(
      hslChannelsToHex([
        Math.round(currentColor.h),
        Math.round(x * 100),
        Math.round((1 - y) * 100),
      ]),
    );

    return { ...nextColor, h: currentColor.h };
  }

  return {
    h: currentColor.h,
    s: x,
    v: 1 - y,
  };
}

export function useInteractionState(onInteractionStateChange?: (isInteracting: boolean) => void) {
  const onInteractionStateChangeRef = useRef(onInteractionStateChange);
  const interactionSourcesRef = useRef<Record<InteractionSource, boolean>>({
    surface: false,
    hue: false,
    hex: false,
  });
  const isInteractingRef = useRef(false);

  useEffect(() => {
    onInteractionStateChangeRef.current = onInteractionStateChange;
  }, [onInteractionStateChange]);

  const setInteractionSourceState = useCallback(
    (source: InteractionSource, nextIsActive: boolean) => {
      if (interactionSourcesRef.current[source] === nextIsActive) return;

      interactionSourcesRef.current[source] = nextIsActive;
      const nextIsInteracting =
        interactionSourcesRef.current.surface ||
        interactionSourcesRef.current.hue ||
        interactionSourcesRef.current.hex;

      if (isInteractingRef.current === nextIsInteracting) return;

      isInteractingRef.current = nextIsInteracting;
      onInteractionStateChangeRef.current?.(nextIsInteracting);
    },
    [],
  );

  const clearInteractionState = useCallback(() => {
    if (!isInteractingRef.current) return;

    interactionSourcesRef.current = { surface: false, hue: false, hex: false };
    isInteractingRef.current = false;
    onInteractionStateChangeRef.current?.(false);
  }, []);

  useEffect(() => clearInteractionState, [clearInteractionState]);

  return { clearInteractionState, setInteractionSourceState };
}

type ColorModelOptions = {
  value: string;
  isSurfaceDragging: boolean;
  hueDragStartHexRef: MutableRefObject<string | null>;
  isHexInputFocusedRef: MutableRefObject<boolean>;
  pendingSurfaceCommitHexRef: MutableRefObject<string | null>;
  pendingSurfaceBaseHexRef: MutableRefObject<string | null>;
  onChange: (hex: string) => void;
};

export function useColorModel({
  value,
  isSurfaceDragging,
  hueDragStartHexRef,
  isHexInputFocusedRef,
  pendingSurfaceCommitHexRef,
  pendingSurfaceBaseHexRef,
  onChange,
}: ColorModelOptions) {
  const normalizedHex = normalizeHexColor(value) ?? "#000000";
  const [optimisticColor, setOptimisticColor] = useState<HsvColor>(() => hexToHsv(normalizedHex));
  const [draftHexValue, setDraftHexValue] = useState(normalizedHex.toUpperCase());
  const latestHsvRef = useRef(optimisticColor);
  const lastEmittedHexRef = useRef(normalizedHex);

  const applyOptimisticColor = useCallback(
    (nextColor: HsvColor, options?: { updateDraft?: boolean }) => {
      latestHsvRef.current = nextColor;
      setOptimisticColor(nextColor);
      const nextHex = hsvToHex(nextColor);
      if (options?.updateDraft !== false) setDraftHexValue(nextHex.toUpperCase());
      return nextHex;
    },
    [],
  );

  const applyOptimisticHex = useCallback(
    (nextHex: string, options?: { updateDraft?: boolean }) => {
      const normalizedNextHex = normalizeHexColor(nextHex);
      if (!normalizedNextHex) return null;
      return applyOptimisticColor(
        resolveHsvFromHex(normalizedNextHex, latestHsvRef.current),
        options,
      );
    },
    [applyOptimisticColor],
  );

  const emitChange = useCallback(
    (nextHex: string) => {
      if (nextHex === lastEmittedHexRef.current) return;
      lastEmittedHexRef.current = nextHex;
      onChange(nextHex);
    },
    [onChange],
  );

  useEffect(() => {
    latestHsvRef.current = optimisticColor;
  }, [optimisticColor]);

  useEffect(() => {
    if (isSurfaceDragging || hueDragStartHexRef.current !== null || isHexInputFocusedRef.current)
      return;

    const pendingCommitHex = pendingSurfaceCommitHexRef.current;
    const pendingBaseHex = pendingSurfaceBaseHexRef.current;
    if (pendingCommitHex) {
      const distance = calculateHexDistance(normalizedHex, pendingCommitHex);
      if (
        normalizedHex === pendingCommitHex ||
        distance <= PENDING_SURFACE_ACK_RGB_DISTANCE_THRESHOLD
      ) {
        pendingSurfaceCommitHexRef.current = null;
        pendingSurfaceBaseHexRef.current = null;
        lastEmittedHexRef.current = normalizedHex;
        setDraftHexValue(normalizedHex.toUpperCase());
        return;
      }
      if (pendingBaseHex && normalizedHex === pendingBaseHex) return;
      pendingSurfaceCommitHexRef.current = null;
      pendingSurfaceBaseHexRef.current = null;
    }

    const nextColor = resolveHsvFromHex(normalizedHex, latestHsvRef.current);
    latestHsvRef.current = nextColor;
    lastEmittedHexRef.current = normalizedHex;
    setOptimisticColor(nextColor);
    setDraftHexValue(normalizedHex.toUpperCase());
  }, [
    hueDragStartHexRef,
    isHexInputFocusedRef,
    isSurfaceDragging,
    normalizedHex,
    pendingSurfaceBaseHexRef,
    pendingSurfaceCommitHexRef,
  ]);

  return {
    normalizedHex,
    optimisticColor,
    draftHexValue,
    setDraftHexValue,
    latestHsvRef,
    applyOptimisticColor,
    applyOptimisticHex,
    emitChange,
  };
}

export function useSurfacePreview(emitChange: (hex: string) => void) {
  const pendingSurfacePreviewHexRef = useRef<string | null>(null);
  const surfacePreviewRafRef = useRef<number | null>(null);

  const clearScheduledSurfacePreview = useCallback(() => {
    if (surfacePreviewRafRef.current === null) return;
    window.cancelAnimationFrame(surfacePreviewRafRef.current);
    surfacePreviewRafRef.current = null;
  }, []);

  const flushPendingSurfacePreview = useCallback(() => {
    clearScheduledSurfacePreview();
    const pendingPreviewHex = pendingSurfacePreviewHexRef.current;
    pendingSurfacePreviewHexRef.current = null;
    if (pendingPreviewHex) emitChange(pendingPreviewHex);
  }, [clearScheduledSurfacePreview, emitChange]);

  const scheduleSurfacePreview = useCallback(
    (nextHex: string) => {
      pendingSurfacePreviewHexRef.current = nextHex;
      if (surfacePreviewRafRef.current !== null) return;

      surfacePreviewRafRef.current = window.requestAnimationFrame(() => {
        surfacePreviewRafRef.current = null;
        const scheduledHex = pendingSurfacePreviewHexRef.current;
        pendingSurfacePreviewHexRef.current = null;
        if (scheduledHex) emitChange(scheduledHex);
      });
    },
    [emitChange],
  );

  useEffect(() => clearScheduledSurfacePreview, [clearScheduledSurfacePreview]);

  return {
    pendingSurfacePreviewHexRef,
    clearScheduledSurfacePreview,
    flushPendingSurfacePreview,
    scheduleSurfacePreview,
  };
}

type SurfaceDragOptions = {
  isSurfaceDragging: boolean;
  setIsSurfaceDragging: (nextIsDragging: boolean) => void;
  surfaceBoundsRef: MutableRefObject<DragBounds | null>;
  surfaceDragStartHexRef: MutableRefObject<string | null>;
  surfaceDragStartColorRef: MutableRefObject<HsvColor | null>;
  pendingSurfaceCommitHexRef: MutableRefObject<string | null>;
  pendingSurfaceBaseHexRef: MutableRefObject<string | null>;
  latestHsvRef: MutableRefObject<HsvColor>;
  surfaceModelRef: MutableRefObject<ColorSurfaceModel>;
  applyOptimisticColor: (nextColor: HsvColor) => string;
  scheduleSurfacePreview: (hex: string) => void;
  flushPendingSurfacePreview: () => void;
  setSurfacePositionOverride: (
    position: ColorSurfacePosition,
    hex: string,
    surfaceModel: ColorSurfaceModel,
  ) => void;
  setInteractionSourceState: (source: InteractionSource, nextIsActive: boolean) => void;
  emitChange: (hex: string) => void;
  onCommit?: () => void;
};

export function useSurfaceDrag(options: SurfaceDragOptions) {
  useEffect(() => {
    if (!options.isSurfaceDragging) return;

    const updateFromSurface = (clientX: number, clientY: number) => {
      const surfaceBounds = options.surfaceBoundsRef.current;
      if (!surfaceBounds || surfaceBounds.width === 0 || surfaceBounds.height === 0) return;

      const surfacePosition = getSurfacePosition(clientX, clientY, surfaceBounds);
      const surfaceModel = options.surfaceModelRef.current;
      const nextColor = getSurfaceHsvColor({
        clientX,
        clientY,
        surfaceBounds,
        currentColor: options.surfaceDragStartColorRef.current ?? options.latestHsvRef.current,
        surfaceModel,
      });
      const optimisticHex = options.applyOptimisticColor(nextColor);
      options.setSurfacePositionOverride(surfacePosition, optimisticHex, surfaceModel);
      options.scheduleSurfacePreview(optimisticHex);
    };

    const finishDrag = () => {
      const nextHex = hsvToHex(options.latestHsvRef.current);
      const dragStartHex = options.surfaceDragStartHexRef.current;
      options.setIsSurfaceDragging(false);
      options.setInteractionSourceState("surface", false);
      options.surfaceBoundsRef.current = null;
      options.surfaceDragStartHexRef.current = null;
      options.surfaceDragStartColorRef.current = null;
      options.flushPendingSurfacePreview();

      if (!dragStartHex || nextHex === dragStartHex) {
        options.pendingSurfaceCommitHexRef.current = null;
        options.pendingSurfaceBaseHexRef.current = null;
        return;
      }

      options.pendingSurfaceCommitHexRef.current = nextHex;
      options.pendingSurfaceBaseHexRef.current = dragStartHex;
      options.emitChange(nextHex);
      options.onCommit?.();
    };

    const handlePointerMove = (event: PointerEvent) =>
      updateFromSurface(event.clientX, event.clientY);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [options]);
}

type HueHandlersOptions = {
  latestHsvRef: MutableRefObject<HsvColor>;
  hueDragStartHexRef: MutableRefObject<string | null>;
  applyOptimisticColor: (nextColor: HsvColor) => string;
  setInteractionSourceState: (source: InteractionSource, nextIsActive: boolean) => void;
  emitChange: (hex: string) => void;
  onCommit?: () => void;
};

export function useHueHandlers({
  latestHsvRef,
  hueDragStartHexRef,
  applyOptimisticColor,
  setInteractionSourceState,
  emitChange,
  onCommit,
}: HueHandlersOptions) {
  const handleHueDragStateChange = useCallback(
    (nextIsDragging: boolean) => {
      if (nextIsDragging) {
        hueDragStartHexRef.current = hsvToHex(latestHsvRef.current);
        setInteractionSourceState("hue", true);
        return;
      }
      setInteractionSourceState("hue", false);
    },
    [hueDragStartHexRef, latestHsvRef, setInteractionSourceState],
  );

  const handleHuePreviewChange = useCallback(
    (nextHue: number) => {
      const nextHex = applyOptimisticColor({
        h: nextHue,
        s: latestHsvRef.current.s,
        v: latestHsvRef.current.v,
      });
      emitChange(nextHex);
    },
    [applyOptimisticColor, emitChange, latestHsvRef],
  );

  const handleHueCommit = useCallback(
    (nextHue: number) => {
      const nextHex = applyOptimisticColor({
        h: nextHue,
        s: latestHsvRef.current.s,
        v: latestHsvRef.current.v,
      });
      const dragStartHex = hueDragStartHexRef.current;
      hueDragStartHexRef.current = null;
      if (!dragStartHex || nextHex === dragStartHex) return;

      emitChange(nextHex);
      onCommit?.();
    },
    [applyOptimisticColor, emitChange, hueDragStartHexRef, latestHsvRef, onCommit],
  );

  return { handleHueDragStateChange, handleHuePreviewChange, handleHueCommit };
}
