"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MutableRefObject,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  ColorFooter,
  ColorModelSlider,
  ColorSurface,
  getColorSurfaceSliderConfig,
} from "./style-guide-color-picker-parts";
import {
  useColorModel,
  useHueHandlers,
  useInteractionState,
  useSurfaceDrag,
  useSurfacePreview,
  type ColorSurfacePosition,
  type DragBounds,
} from "./style-guide-color-picker-logic";
import {
  useHexInputHandlers,
  useSurfacePointerDown,
} from "./style-guide-color-picker-interactions";
import { hsvToHex, type HsvColor } from "../../../lib/style-guide-color-utils";
import {
  getColorChannels,
  getColorSurfaceModel,
  rgbChannelsToHex,
  type ColorFormatMode,
  type ColorSurfaceModel,
} from "./style-guide-color-picker-channel-utils";

type StyleGuideColorPickerProps = {
  value: string;
  disabled?: boolean;
  hexInputId?: string;
  hexInputLabel?: string;
  surfaceLabel?: string;
  hueLabel?: string;
  showOpacity?: boolean;
  surfaceClassName?: string;
  onChange: (hex: string) => void;
  onCommit?: () => void;
  onInteractionStateChange?: (isInteracting: boolean) => void;
};

type ColorPickerViewProps = {
  disabled: boolean;
  surfaceLabel: string;
  hueLabel: string;
  hexInputLabel: string;
  showOpacity: boolean;
  surfaceClassName?: string;
  surfaceRef: RefObject<HTMLDivElement | null>;
  resolvedHexInputId: string;
  optimisticColor: HsvColor;
  draftHexValue: string;
  isSurfaceDragging: boolean;
  hueColor: string;
  currentColorHex: string;
  colorFormatMode: ColorFormatMode;
  colorSurfaceModel: ColorSurfaceModel;
  surfacePosition: ColorSurfacePosition | null;
  sliderConfig: ReturnType<typeof getColorSurfaceSliderConfig>;
  sliderHandlers: {
    handleSliderCommit: (nextValue: number) => void;
    handleSliderDragStateChange: (nextIsDragging: boolean) => void;
    handleSliderPreviewChange: (nextValue: number) => void;
  };
  onColorFormatModeChange: (nextMode: ColorFormatMode) => void;
  onSurfacePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onHexFocus: () => void;
  onHexChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onHexBlur: () => void;
  onHexKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onColorValueFocus: () => void;
  onColorValueChange: (nextHex: string) => void;
  onColorValueBlur: () => void;
};

type ColorPickerRefs = {
  surfaceRef: RefObject<HTMLDivElement | null>;
  isHexInputFocusedRef: MutableRefObject<boolean>;
  surfaceBoundsRef: MutableRefObject<DragBounds | null>;
  surfaceDragStartHexRef: MutableRefObject<string | null>;
  surfaceDragStartColorRef: MutableRefObject<HsvColor | null>;
  pendingSurfaceCommitHexRef: MutableRefObject<string | null>;
  pendingSurfaceBaseHexRef: MutableRefObject<string | null>;
  hueDragStartHexRef: MutableRefObject<string | null>;
};

export const DEFAULT_COLOR_FORMAT_MODE = "hsl" satisfies ColorFormatMode;

function useColorPickerRefs(): ColorPickerRefs {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const isHexInputFocusedRef = useRef(false);
  const surfaceBoundsRef = useRef<DragBounds | null>(null);
  const surfaceDragStartHexRef = useRef<string | null>(null);
  const surfaceDragStartColorRef = useRef<HsvColor | null>(null);
  const pendingSurfaceCommitHexRef = useRef<string | null>(null);
  const pendingSurfaceBaseHexRef = useRef<string | null>(null);
  const hueDragStartHexRef = useRef<string | null>(null);

  return useMemo(
    () => ({
      surfaceRef,
      isHexInputFocusedRef,
      surfaceBoundsRef,
      surfaceDragStartHexRef,
      surfaceDragStartColorRef,
      pendingSurfaceCommitHexRef,
      pendingSurfaceBaseHexRef,
      hueDragStartHexRef,
    }),
    [],
  );
}

function useRgbBlueHandlers({
  latestHsvRef,
  hueDragStartHexRef,
  applyOptimisticHex,
  setInteractionSourceState,
  emitChange,
  onCommit,
}: {
  latestHsvRef: MutableRefObject<HsvColor>;
  hueDragStartHexRef: MutableRefObject<string | null>;
  applyOptimisticHex: (nextHex: string) => string | null;
  setInteractionSourceState: (source: "hue", nextIsActive: boolean) => void;
  emitChange: (hex: string) => void;
  onCommit?: () => void;
}) {
  const handleSliderDragStateChange = useCallback(
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

  const applyBlueChannel = useCallback(
    (nextBlue: number) => {
      const channels = getColorChannels(hsvToHex(latestHsvRef.current)).rgb;
      const nextHex = rgbChannelsToHex([
        channels[0],
        channels[1],
        Math.round(Math.max(0, Math.min(255, nextBlue))),
      ]);

      return applyOptimisticHex(nextHex) ?? nextHex;
    },
    [applyOptimisticHex, latestHsvRef],
  );

  const handleSliderPreviewChange = useCallback(
    (nextValue: number) => {
      emitChange(applyBlueChannel(nextValue));
    },
    [applyBlueChannel, emitChange],
  );

  const handleSliderCommit = useCallback(
    (nextValue: number) => {
      const nextHex = applyBlueChannel(nextValue);
      const dragStartHex = hueDragStartHexRef.current;
      hueDragStartHexRef.current = null;
      if (!dragStartHex || nextHex === dragStartHex) return;

      emitChange(nextHex);
      onCommit?.();
    },
    [applyBlueChannel, emitChange, hueDragStartHexRef, onCommit],
  );

  return { handleSliderCommit, handleSliderDragStateChange, handleSliderPreviewChange };
}

type SurfacePositionOverride = {
  colorModel: ColorSurfaceModel;
  hex: string;
  position: ColorSurfacePosition;
};

function useColorPickerSurfaceDrag(
  refs: ColorPickerRefs,
  model: ReturnType<typeof useColorModel>,
  preview: ReturnType<typeof useSurfacePreview>,
  interaction: ReturnType<typeof useInteractionState>,
  surfaceModelRef: MutableRefObject<ColorSurfaceModel>,
  setSurfacePositionOverride: (
    position: ColorSurfacePosition,
    hex: string,
    surfaceModel: ColorSurfaceModel,
  ) => void,
  isSurfaceDragging: boolean,
  setIsSurfaceDragging: (nextIsDragging: boolean) => void,
  onCommit?: () => void,
) {
  const surfaceDragOptions = useMemo(
    () => ({
      isSurfaceDragging,
      setIsSurfaceDragging,
      surfaceBoundsRef: refs.surfaceBoundsRef,
      surfaceDragStartHexRef: refs.surfaceDragStartHexRef,
      surfaceDragStartColorRef: refs.surfaceDragStartColorRef,
      pendingSurfaceCommitHexRef: refs.pendingSurfaceCommitHexRef,
      pendingSurfaceBaseHexRef: refs.pendingSurfaceBaseHexRef,
      latestHsvRef: model.latestHsvRef,
      surfaceModelRef,
      applyOptimisticColor: model.applyOptimisticColor,
      scheduleSurfacePreview: preview.scheduleSurfacePreview,
      flushPendingSurfacePreview: preview.flushPendingSurfacePreview,
      setSurfacePositionOverride,
      setInteractionSourceState: interaction.setInteractionSourceState,
      emitChange: model.emitChange,
      onCommit,
    }),
    [
      interaction.setInteractionSourceState,
      isSurfaceDragging,
      model,
      onCommit,
      preview,
      refs,
      setSurfacePositionOverride,
      setIsSurfaceDragging,
      surfaceModelRef,
    ],
  );
  useSurfaceDrag(surfaceDragOptions);
}

function useColorValueHandlers(
  refs: ColorPickerRefs,
  model: ReturnType<typeof useColorModel>,
  interaction: ReturnType<typeof useInteractionState>,
  onCommit?: () => void,
) {
  const { setInteractionSourceState } = interaction;
  const handleColorValueFocus = useCallback(() => {
    refs.isHexInputFocusedRef.current = true;
    setInteractionSourceState("hex", true);
  }, [refs.isHexInputFocusedRef, setInteractionSourceState]);
  const handleColorValueChange = useCallback(
    (nextHex: string) => {
      const nextDraftHex = nextHex.toUpperCase();

      refs.isHexInputFocusedRef.current = true;
      setInteractionSourceState("hex", true);
      model.setDraftHexValue(nextDraftHex);
      model.applyOptimisticHex(nextDraftHex);
      model.emitChange(nextDraftHex);
    },
    [model, refs.isHexInputFocusedRef, setInteractionSourceState],
  );
  const handleColorValueBlur = useCallback(() => {
    refs.isHexInputFocusedRef.current = false;
    setInteractionSourceState("hex", false);
    onCommit?.();
  }, [onCommit, refs.isHexInputFocusedRef, setInteractionSourceState]);

  return {
    handleColorValueBlur,
    handleColorValueChange,
    handleColorValueFocus,
  };
}

function useColorPickerController({
  value,
  disabled = false,
  hexInputId,
  hexInputLabel = "Hex color",
  surfaceLabel = "Color saturation and brightness",
  hueLabel = "Color hue",
  showOpacity = false,
  surfaceClassName,
  onChange,
  onCommit,
  onInteractionStateChange,
}: StyleGuideColorPickerProps): ColorPickerViewProps {
  const generatedHexInputId = useId();
  const [isSurfaceDragging, setIsSurfaceDragging] = useState(false);
  const [colorFormatMode, setColorFormatMode] = useState<ColorFormatMode>(
    DEFAULT_COLOR_FORMAT_MODE,
  );
  const colorSurfaceModel = getColorSurfaceModel(colorFormatMode);
  const surfaceModelRef = useRef<ColorSurfaceModel>(colorSurfaceModel);
  const [surfacePositionOverride, setSurfacePositionOverrideState] =
    useState<SurfacePositionOverride | null>(null);
  const refs = useColorPickerRefs();
  const interaction = useInteractionState(onInteractionStateChange);
  const model = useColorModel({
    value,
    isSurfaceDragging,
    hueDragStartHexRef: refs.hueDragStartHexRef,
    isHexInputFocusedRef: refs.isHexInputFocusedRef,
    pendingSurfaceCommitHexRef: refs.pendingSurfaceCommitHexRef,
    pendingSurfaceBaseHexRef: refs.pendingSurfaceBaseHexRef,
    onChange,
  });
  const preview = useSurfacePreview(model.emitChange);
  useEffect(() => {
    surfaceModelRef.current = colorSurfaceModel;
    setSurfacePositionOverrideState(null);
  }, [colorSurfaceModel]);
  const setSurfacePositionOverride = useCallback(
    (position: ColorSurfacePosition, hex: string, surfaceModel: ColorSurfaceModel) => {
      setSurfacePositionOverrideState({ colorModel: surfaceModel, hex, position });
    },
    [],
  );
  const hueHandlers = useHueHandlers({
    latestHsvRef: model.latestHsvRef,
    hueDragStartHexRef: refs.hueDragStartHexRef,
    applyOptimisticColor: model.applyOptimisticColor,
    setInteractionSourceState: interaction.setInteractionSourceState,
    emitChange: model.emitChange,
    onCommit,
  });
  const rgbBlueHandlers = useRgbBlueHandlers({
    latestHsvRef: model.latestHsvRef,
    hueDragStartHexRef: refs.hueDragStartHexRef,
    applyOptimisticHex: model.applyOptimisticHex,
    setInteractionSourceState: interaction.setInteractionSourceState,
    emitChange: model.emitChange,
    onCommit,
  });
  useColorPickerSurfaceDrag(
    refs,
    model,
    preview,
    interaction,
    surfaceModelRef,
    setSurfacePositionOverride,
    isSurfaceDragging,
    setIsSurfaceDragging,
    onCommit,
  );
  const hexHandlers = useHexInputHandlers({
    isHexInputFocusedRef: refs.isHexInputFocusedRef,
    draftHexValue: model.draftHexValue,
    normalizedHex: model.normalizedHex,
    latestHsvRef: model.latestHsvRef,
    setDraftHexValue: model.setDraftHexValue,
    applyOptimisticHex: model.applyOptimisticHex,
    emitChange: model.emitChange,
    setInteractionSourceState: interaction.setInteractionSourceState,
    onCommit,
  });
  const colorValueHandlers = useColorValueHandlers(
    refs,
    model,
    interaction,
    onCommit,
  );
  const onSurfacePointerDown = useSurfacePointerDown({
    disabled,
    surfaceRef: refs.surfaceRef,
    surfaceBoundsRef: refs.surfaceBoundsRef,
    surfaceDragStartHexRef: refs.surfaceDragStartHexRef,
    surfaceDragStartColorRef: refs.surfaceDragStartColorRef,
    pendingSurfacePreviewHexRef: preview.pendingSurfacePreviewHexRef,
    pendingSurfaceCommitHexRef: refs.pendingSurfaceCommitHexRef,
    pendingSurfaceBaseHexRef: refs.pendingSurfaceBaseHexRef,
    latestHsvRef: model.latestHsvRef,
    surfaceModel: colorSurfaceModel,
    clearScheduledSurfacePreview: preview.clearScheduledSurfacePreview,
    applyOptimisticColor: model.applyOptimisticColor,
    setSurfacePositionOverride,
    setInteractionSourceState: interaction.setInteractionSourceState,
    emitChange: model.emitChange,
    setIsSurfaceDragging,
  });
  const currentColorHex = hsvToHex(model.optimisticColor);
  const surfacePosition =
    surfacePositionOverride?.colorModel === colorSurfaceModel &&
    surfacePositionOverride.hex === currentColorHex
      ? surfacePositionOverride.position
      : null;

  return {
    disabled,
    surfaceLabel,
    hueLabel,
    hexInputLabel,
    showOpacity,
    surfaceClassName,
    surfaceRef: refs.surfaceRef,
    resolvedHexInputId: hexInputId ?? generatedHexInputId,
    optimisticColor: model.optimisticColor,
    draftHexValue: model.draftHexValue,
    isSurfaceDragging,
    hueColor: hsvToHex({ h: model.optimisticColor.h, s: 1, v: 1 }),
    currentColorHex,
    colorFormatMode,
    colorSurfaceModel,
    surfacePosition,
    sliderConfig: getColorSurfaceSliderConfig({
      colorModel: colorSurfaceModel,
      currentColorHex,
      hueLabel,
      optimisticColor: model.optimisticColor,
    }),
    sliderHandlers:
      colorSurfaceModel === "rgb"
        ? rgbBlueHandlers
        : {
            handleSliderCommit: hueHandlers.handleHueCommit,
            handleSliderDragStateChange: hueHandlers.handleHueDragStateChange,
            handleSliderPreviewChange: hueHandlers.handleHuePreviewChange,
          },
    onColorFormatModeChange: setColorFormatMode,
    onSurfacePointerDown,
    onColorValueFocus: colorValueHandlers.handleColorValueFocus,
    onColorValueChange: colorValueHandlers.handleColorValueChange,
    onColorValueBlur: colorValueHandlers.handleColorValueBlur,
    ...hexHandlers,
  };
}

function ColorPickerView(props: ColorPickerViewProps) {
  return (
    <div
      data-slot="style-guide-color-picker"
      className="flex h-full min-h-0 w-full flex-1 flex-col"
    >
      <ColorSurface
        surfaceRef={props.surfaceRef}
        surfaceLabel={props.surfaceLabel}
        surfaceClassName={props.surfaceClassName}
        disabled={props.disabled}
        hueColor={props.hueColor}
        currentColorHex={props.currentColorHex}
        colorModel={props.colorSurfaceModel}
        optimisticColor={props.optimisticColor}
        surfacePosition={props.surfacePosition}
        isSurfaceDragging={props.isSurfaceDragging}
        onPointerDown={props.onSurfacePointerDown}
        onThumbPointerDown={(event) => {
          event.stopPropagation();
          props.onSurfacePointerDown(event);
        }}
      />
      <div
        data-slot="style-guide-color-controls"
        className="flex w-full shrink-0 flex-col"
      >
        <div
          data-slot="style-guide-color-slider-wrap"
          className="flex h-9 w-full shrink-0 items-center px-3"
        >
          <ColorModelSlider
            label={props.sliderConfig.label}
            disabled={props.disabled}
            max={props.sliderConfig.max}
            railBackground={props.sliderConfig.railBackground}
            value={props.sliderConfig.value}
            onDragStateChange={props.sliderHandlers.handleSliderDragStateChange}
            onPreviewChange={props.sliderHandlers.handleSliderPreviewChange}
            onCommit={props.sliderHandlers.handleSliderCommit}
          />
        </div>
        <ColorFooter
          resolvedHexInputId={props.resolvedHexInputId}
          hexInputLabel={props.hexInputLabel}
          disabled={props.disabled}
          draftHexValue={props.draftHexValue}
          onHexFocus={props.onHexFocus}
          onHexChange={props.onHexChange}
          onHexBlur={props.onHexBlur}
          onHexKeyDown={props.onHexKeyDown}
          onColorValueFocus={props.onColorValueFocus}
          onColorValueChange={props.onColorValueChange}
          onColorValueBlur={props.onColorValueBlur}
          mode={props.colorFormatMode}
          onModeChange={props.onColorFormatModeChange}
          showOpacity={props.showOpacity}
        />
      </div>
    </div>
  );
}

export function StyleGuideColorPicker(props: StyleGuideColorPickerProps) {
  return <ColorPickerView {...useColorPickerController(props)} />;
}
