import {
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  getSurfacePosition,
  getSurfaceHsvColor,
  type DragBounds,
  type ColorSurfacePosition,
  type InteractionSource,
} from "./style-guide-color-picker-logic";
import { hsvToHex, normalizeHexColor, type HsvColor } from "../../../lib/style-guide-color-utils";
import { type ColorSurfaceModel } from "./style-guide-color-picker-channel-utils";

type HexInputOptions = {
  isHexInputFocusedRef: MutableRefObject<boolean>;
  draftHexValue: string;
  normalizedHex: string;
  latestHsvRef: MutableRefObject<HsvColor>;
  setDraftHexValue: (nextDraft: string) => void;
  applyOptimisticHex: (nextHex: string, options?: { updateDraft?: boolean }) => string | null;
  emitChange: (hex: string) => void;
  setInteractionSourceState: (source: InteractionSource, nextIsActive: boolean) => void;
  onCommit?: () => void;
};

export function useHexInputHandlers({
  isHexInputFocusedRef,
  draftHexValue,
  normalizedHex,
  latestHsvRef,
  setDraftHexValue,
  applyOptimisticHex,
  emitChange,
  setInteractionSourceState,
  onCommit,
}: HexInputOptions) {
  const onHexFocus = useCallback(() => {
    isHexInputFocusedRef.current = true;
    setInteractionSourceState("hex", true);
  }, [isHexInputFocusedRef, setInteractionSourceState]);

  const onHexChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextDraft = event.target.value.toUpperCase();
      setDraftHexValue(nextDraft);
      const normalizedDraft = normalizeHexColor(nextDraft);
      if (normalizedDraft) {
        applyOptimisticHex(normalizedDraft, { updateDraft: false });
      }
    },
    [applyOptimisticHex, setDraftHexValue],
  );

  const onHexBlur = useCallback(() => {
    isHexInputFocusedRef.current = false;
    setInteractionSourceState("hex", false);
    const normalizedDraft = normalizeHexColor(draftHexValue);
    if (!normalizedDraft) return setDraftHexValue(hsvToHex(latestHsvRef.current).toUpperCase());

    setDraftHexValue(normalizedDraft.toUpperCase());
    if (normalizedDraft !== hsvToHex(latestHsvRef.current)) {
      applyOptimisticHex(normalizedDraft);
      emitChange(normalizedDraft);
    }
    onCommit?.();
  }, [
    applyOptimisticHex,
    draftHexValue,
    emitChange,
    isHexInputFocusedRef,
    latestHsvRef,
    onCommit,
    setDraftHexValue,
    setInteractionSourceState,
  ]);

  const onHexKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.currentTarget.blur();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setDraftHexValue(normalizedHex.toUpperCase());
        event.currentTarget.blur();
      }
    },
    [normalizedHex, setDraftHexValue],
  );

  return { onHexFocus, onHexChange, onHexBlur, onHexKeyDown };
}

type SurfacePointerDownOptions = {
  disabled: boolean;
  surfaceRef: RefObject<HTMLDivElement | null>;
  surfaceBoundsRef: MutableRefObject<DragBounds | null>;
  surfaceDragStartHexRef: MutableRefObject<string | null>;
  surfaceDragStartColorRef: MutableRefObject<HsvColor | null>;
  pendingSurfacePreviewHexRef: MutableRefObject<string | null>;
  pendingSurfaceCommitHexRef: MutableRefObject<string | null>;
  pendingSurfaceBaseHexRef: MutableRefObject<string | null>;
  latestHsvRef: MutableRefObject<HsvColor>;
  surfaceModel: ColorSurfaceModel;
  clearScheduledSurfacePreview: () => void;
  applyOptimisticColor: (nextColor: HsvColor) => string;
  setSurfacePositionOverride: (
    position: ColorSurfacePosition,
    hex: string,
    surfaceModel: ColorSurfaceModel,
  ) => void;
  setInteractionSourceState: (source: InteractionSource, nextIsActive: boolean) => void;
  emitChange: (hex: string) => void;
  setIsSurfaceDragging: (nextIsDragging: boolean) => void;
};

export function useSurfacePointerDown({
  disabled,
  surfaceRef,
  surfaceBoundsRef,
  surfaceDragStartHexRef,
  surfaceDragStartColorRef,
  pendingSurfacePreviewHexRef,
  pendingSurfaceCommitHexRef,
  pendingSurfaceBaseHexRef,
  latestHsvRef,
  surfaceModel,
  clearScheduledSurfacePreview,
  applyOptimisticColor,
  setSurfacePositionOverride,
  setInteractionSourceState,
  emitChange,
  setIsSurfaceDragging,
}: SurfacePointerDownOptions) {
  return useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.preventDefault();
      const surfaceBounds = surfaceRef.current?.getBoundingClientRect();
      if (!surfaceBounds || surfaceBounds.width === 0 || surfaceBounds.height === 0) return;

      surfaceBoundsRef.current = surfaceBounds;
      surfaceDragStartHexRef.current = hsvToHex(latestHsvRef.current);
      surfaceDragStartColorRef.current = { ...latestHsvRef.current };
      pendingSurfacePreviewHexRef.current = null;
      clearScheduledSurfacePreview();
      pendingSurfaceCommitHexRef.current = null;
      pendingSurfaceBaseHexRef.current = null;
      const surfacePosition = getSurfacePosition(event.clientX, event.clientY, surfaceBounds);
      const nextHex = applyOptimisticColor(
        getSurfaceHsvColor({
          clientX: event.clientX,
          clientY: event.clientY,
          currentColor: surfaceDragStartColorRef.current,
          surfaceBounds,
          surfaceModel,
        }),
      );
      setSurfacePositionOverride(surfacePosition, nextHex, surfaceModel);
      setInteractionSourceState("surface", true);
      emitChange(nextHex);
      setIsSurfaceDragging(true);
    },
    [
      applyOptimisticColor,
      clearScheduledSurfacePreview,
      disabled,
      emitChange,
      latestHsvRef,
      pendingSurfaceBaseHexRef,
      pendingSurfaceCommitHexRef,
      pendingSurfacePreviewHexRef,
      setInteractionSourceState,
      setIsSurfaceDragging,
      surfaceModel,
      surfaceBoundsRef,
      surfaceDragStartColorRef,
      surfaceDragStartHexRef,
      surfaceRef,
      setSurfacePositionOverride,
    ],
  );
}
