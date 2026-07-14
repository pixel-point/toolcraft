"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import {
  ButtonGroup,
  Field,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../../primitives";
import { cn } from "../../../lib/utils";
import { ColorPickerPopover } from "./color-picker-popover";
import {
  createControlHistoryGroupId,
  type ControlChangeMeta,
  type ControlValueChangeHandler,
} from "../control-types";

export type ColorControlInput = {
  hex?: string;
  name: string;
  onValueChange?: ControlValueChangeHandler<{ hex: string }>;
  showLabel?: boolean;
};

export type ColorOpacityValue = {
  hex: string;
  opacity: number;
};

export type ColorOpacityControlProps = {
  hex?: string;
  name: string;
  onValueChange?: ControlValueChangeHandler<ColorOpacityValue>;
  opacity?: number;
  showLabel?: boolean;
};

export type ColorControlInputPair = readonly [
  ColorControlInput,
  ColorControlInput,
];

type ColorControlSingleProps = ColorControlInput & {
  inputs?: never;
};

type ColorControlGroupProps = {
  inputs: ColorControlInputPair;
};

export type ColorControlProps =
  | ColorControlSingleProps
  | ColorControlGroupProps;

type ColorValueControlProps = {
  children?: React.ReactNode;
  className?: string;
  color: string;
  inputName?: string;
  label: string;
  nativeInputName?: string;
  onColorChange: ControlValueChangeHandler<string>;
  showHash?: boolean;
  size?: "default" | "sm";
};

const colorValueButtonGroupClassName =
  "w-full has-[[data-slot=button][aria-expanded=true]]:[&>input]:!border-l-[color:color-mix(in_oklab,var(--border)_30%,transparent)] has-[[data-slot=button][data-open]]:[&>input]:!border-l-[color:color-mix(in_oklab,var(--border)_30%,transparent)] has-[[data-slot=button][data-popup-open]]:[&>input]:!border-l-[color:color-mix(in_oklab,var(--border)_30%,transparent)] has-[[data-slot=button][data-state=open]]:[&>input]:!border-l-[color:color-mix(in_oklab,var(--border)_30%,transparent)]";

function isColorControlGroupProps(
  props: ColorControlProps,
): props is ColorControlGroupProps {
  return Array.isArray((props as ColorControlGroupProps).inputs);
}

function resolveCssVariableColor(color: string): string {
  const variableMatch = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/i.exec(
    color.trim(),
  );

  if (!variableMatch?.[1] || typeof window === "undefined") {
    return color;
  }

  const resolvedValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(variableMatch[1]);
  const fallbackValue = variableMatch[2]?.trim();
  const nextColor = resolvedValue.trim() || fallbackValue;

  return nextColor ? resolveCssVariableColor(nextColor) : color;
}

function formatHexChannel(value: number): string {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}

function linearSrgbToSrgb(value: number): number {
  return value >= 0.0031308
    ? 1.055 * value ** (1 / 2.4) - 0.055
    : 12.92 * value;
}

function oklchToHex(color: string): string | null {
  const match =
    /^oklch\(\s*([+-]?\d*\.?\d+%?)\s+([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)(?:deg)?(?:\s*\/\s*[+-]?\d*\.?\d+%?)?\s*\)$/i.exec(
      color.trim(),
    );

  if (!match) {
    return null;
  }

  const rawLightness = match[1] ?? "";
  const lightness = rawLightness.endsWith("%")
    ? Number.parseFloat(rawLightness) / 100
    : Number.parseFloat(rawLightness);
  const chroma = Number.parseFloat(match[2] ?? "");
  const hue = (Number.parseFloat(match[3] ?? "") * Math.PI) / 180;

  if (
    !Number.isFinite(lightness) ||
    !Number.isFinite(chroma) ||
    !Number.isFinite(hue)
  ) {
    return null;
  }

  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const lCone = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mCone = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sCone = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = lCone ** 3;
  const m = mCone ** 3;
  const s = sCone ** 3;
  const red = linearSrgbToSrgb(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
  );
  const green = linearSrgbToSrgb(
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
  );
  const blue = linearSrgbToSrgb(
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  );

  return `#${formatHexChannel(red)}${formatHexChannel(green)}${formatHexChannel(blue)}`;
}

function rgbToHex(color: string): string | null {
  const match =
    /^rgba?\(\s*([+-]?\d*\.?\d+%?)\s*[,\s]\s*([+-]?\d*\.?\d+%?)\s*[,\s]\s*([+-]?\d*\.?\d+%?)/i.exec(
      color.trim(),
    );

  if (!match) {
    return null;
  }

  const channels = [match[1] ?? "", match[2] ?? "", match[3] ?? ""].map(
    (channel) => {
      const parsed = Number.parseFloat(channel);
      return channel.endsWith("%") ? parsed / 100 : parsed / 255;
    },
  );

  if (channels.some((channel) => !Number.isFinite(channel))) {
    return null;
  }

  const [red = 0, green = 0, blue = 0] = channels;

  return `#${formatHexChannel(red)}${formatHexChannel(green)}${formatHexChannel(blue)}`;
}

function getNativeColorPickerValue(color: string): string {
  const trimmedColor = resolveCssVariableColor(color).trim();
  const bareHexMatch = /^([0-9a-f]{6})$/i.exec(trimmedColor);

  if (bareHexMatch?.[1]) {
    return `#${bareHexMatch[1].toUpperCase()}`;
  }

  const hexMatch = /^#([0-9a-f]{6})$/i.exec(trimmedColor);

  if (hexMatch?.[1]) {
    return `#${hexMatch[1].toUpperCase()}`;
  }

  const shortHexMatch = /^#([0-9a-f]{3})$/i.exec(trimmedColor);

  if (shortHexMatch?.[1]) {
    const [red = "0", green = "0", blue = "0"] = shortHexMatch[1];
    return `#${red}${red}${green}${green}${blue}${blue}`.toUpperCase();
  }

  const parsedFunctionalColor =
    oklchToHex(trimmedColor) ?? rgbToHex(trimmedColor);

  if (parsedFunctionalColor) {
    return parsedFunctionalColor;
  }

  return "#000000";
}

function getSwatchColorValue(color: string): string {
  const trimmedColor = color.trim();

  if (trimmedColor.startsWith("var(") || trimmedColor.includes("(")) {
    return trimmedColor;
  }

  return getNativeColorPickerValue(trimmedColor);
}

function getHexDraftValue(color: string, showHash: boolean): string {
  const hexColor = getNativeColorPickerValue(color);

  return showHash ? hexColor : hexColor.slice(1);
}

function getSanitizedHexDraft(value: string, showHash: boolean): string {
  const hex = value
    .replace(/[^\da-f]/gi, "")
    .slice(0, 6)
    .toUpperCase();

  return showHash ? `#${hex}` : hex;
}

function getCommittedHexColor(value: string): string | null {
  const hex = value
    .replace(/[^\da-f]/gi, "")
    .slice(0, 6)
    .toUpperCase();

  return hex.length === 6 ? `#${hex}` : null;
}

function parseOpacityValue(opacity: number | undefined): number {
  return Math.min(100, Math.max(0, Math.round(opacity ?? 100)));
}

function normalizeOpacityInput(value: string): number {
  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue)
    ? Math.min(100, Math.max(0, Math.round(parsedValue)))
    : 100;
}

function ColorOpacityInput({
  label,
  name,
  onOpacityChange,
  opacity,
}: {
  label: string;
  name?: string;
  onOpacityChange: (nextOpacity: number, meta?: ControlChangeMeta) => void;
  opacity: number;
}): React.JSX.Element {
  const committedOpacity = String(parseOpacityValue(opacity));
  const [draftOpacity, setDraftOpacity] = React.useState(committedOpacity);

  React.useEffect(() => {
    setDraftOpacity(committedOpacity);
  }, [committedOpacity]);

  function commitOpacity(nextDraft = draftOpacity): void {
    const trimmedDraft = nextDraft.trim();

    if (trimmedDraft === "" || !Number.isFinite(Number.parseFloat(trimmedDraft))) {
      setDraftOpacity(committedOpacity);
      return;
    }

    const nextOpacity = normalizeOpacityInput(trimmedDraft);

    setDraftOpacity(String(nextOpacity));

    if (nextOpacity !== parseOpacityValue(opacity)) {
      onOpacityChange(nextOpacity);
    }
  }

  return (
    <InputGroup className="w-14 flex-none rounded-l-none [&:not(:focus-within):hover]:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] [&:not(:focus-within):hover]:text-[color:var(--foreground)]">
      <InputGroupInput
        aria-label={`${label} opacity`}
        autoComplete="off"
        className="pl-2 pr-1 text-right font-mono"
        inputMode="numeric"
        name={name}
        onBlur={() => commitOpacity()}
        onChange={(event) => setDraftOpacity(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitOpacity(event.currentTarget.value);
            event.currentTarget.blur();
            return;
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDraftOpacity(committedOpacity);
            event.currentTarget.blur();
          }
        }}
        type="text"
        value={draftOpacity}
      />
      <InputGroupAddon align="inline-end" className="pr-1.5 pl-0">
        <InputGroupText className="group-hover/input-group:text-[color:var(--foreground)]">
          %
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

export function ColorValueControl({
  children,
  className,
  color,
  inputName,
  label,
  nativeInputName,
  onColorChange,
  showHash = true,
  size = "default",
}: ColorValueControlProps): React.JSX.Element {
  const [draftColor, setDraftColor] = React.useState(() =>
    getHexDraftValue(color, showHash),
  );
  const [previewColor, setPreviewColor] = React.useState(color);
  const liveHistoryGroupRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setDraftColor(getHexDraftValue(color, showHash));
    setPreviewColor(color);
  }, [color, showHash]);

  function getLiveHistoryMeta(): ControlChangeMeta {
    liveHistoryGroupRef.current ??= createControlHistoryGroupId(`color:${label}`);

    return {
      history: "merge",
      historyGroup: liveHistoryGroupRef.current,
    };
  }

  function finishLiveHistoryGroup(): void {
    liveHistoryGroupRef.current = null;
  }

  function commitColor(nextColor: string, meta?: ControlChangeMeta): void {
    const normalizedColor = nextColor.toUpperCase();
    setPreviewColor(normalizedColor);
    setDraftColor(getHexDraftValue(normalizedColor, showHash));
    onColorChange(normalizedColor, meta);
  }

  function updateDraft(nextValue: string): void {
    const nextDraft = getSanitizedHexDraft(nextValue, showHash);

    setDraftColor(nextDraft);

    const committedColor = getCommittedHexColor(nextDraft);
    if (committedColor) {
      setPreviewColor(committedColor);
    }
  }

  function handleDraftBlur(): void {
    const committedColor = getCommittedHexColor(draftColor);

    if (committedColor) {
      commitColor(
        committedColor,
        liveHistoryGroupRef.current ? getLiveHistoryMeta() : undefined,
      );
      finishLiveHistoryGroup();
      return;
    }

    setDraftColor(getHexDraftValue(color, showHash));
    setPreviewColor(color);
    finishLiveHistoryGroup();
  }

  return (
    <>
      <ButtonGroup
        adjacentBorderTone="subtle"
        className={cn(colorValueButtonGroupClassName, className)}
      >
        <ColorPickerPopover
          label={label}
          pickerValue={getNativeColorPickerValue(previewColor)}
          showOpacity={Boolean(children)}
          size={size}
          swatchColor={getSwatchColorValue(previewColor)}
          onColorChange={(nextColor) => commitColor(nextColor, getLiveHistoryMeta())}
          onCommit={handleDraftBlur}
        />
        <Input
          aria-label={`${label} hex`}
          autoComplete="off"
          className="font-mono"
          name={inputName}
          onBlur={handleDraftBlur}
          onChange={(event) => updateDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleDraftBlur();
              event.currentTarget.blur();
              return;
            }

            if (event.key === "Escape") {
              event.preventDefault();
              setDraftColor(getHexDraftValue(color, showHash));
              setPreviewColor(color);
              finishLiveHistoryGroup();
              event.currentTarget.blur();
            }
          }}
          size={size}
          spellCheck={false}
          type="text"
          value={draftColor}
        />
        {children}
      </ButtonGroup>
      {nativeInputName ? (
        <input name={nativeInputName} type="hidden" value={previewColor} />
      ) : null}
    </>
  );
}

function ColorControlField({
  fullWidth = false,
  hex,
  name,
  onValueChange,
  showLabel = false,
}: ColorControlInput & { fullWidth?: boolean }): React.JSX.Element {
  const activeColor = hex ?? "var(--foreground)";

  function updateColor(nextColor: string, meta?: ControlChangeMeta): void {
    const nextValue = {
      hex: nextColor,
    };

    if (meta) {
      onValueChange?.(nextValue, meta);
      return;
    }

    onValueChange?.(nextValue);
  }

  return (
    <Field className="h-fit min-w-0 justify-start gap-2">
      {showLabel ? <ControlFieldLabel>{name}</ControlFieldLabel> : null}
      <div className={cn("min-w-0", fullWidth ? "w-full" : "w-1/2 shrink-0")}>
        <ColorValueControl
          color={activeColor}
          label={name}
          onColorChange={updateColor}
        />
      </div>
    </Field>
  );
}

export function ColorControl(props: ColorControlProps): React.JSX.Element {
  if (isColorControlGroupProps(props)) {
    return (
      <div
        className="grid min-w-0 gap-[10px]"
        data-slot="color-control-grid"
        style={{
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        {props.inputs.map((input, index) => (
          <ColorControlField
            fullWidth
            key={`${input.name}-${index}`}
            {...input}
          />
        ))}
      </div>
    );
  }

  return <ColorControlField {...props} />;
}

export function ColorOpacityControl({
  hex,
  name,
  onValueChange,
  opacity,
  showLabel = false,
}: ColorOpacityControlProps): React.JSX.Element {
  const activeColor = hex ?? "var(--foreground)";
  const activeOpacity = parseOpacityValue(opacity);

  function updateColor(nextColor: string, meta?: ControlChangeMeta): void {
    const nextValue = {
      hex: nextColor,
      opacity: activeOpacity,
    };

    if (meta) {
      onValueChange?.(nextValue, meta);
      return;
    }

    onValueChange?.(nextValue);
  }

  function updateOpacity(nextOpacity: number, meta?: ControlChangeMeta): void {
    const nextValue = {
      hex: activeColor,
      opacity: nextOpacity,
    };

    if (meta) {
      onValueChange?.(nextValue, meta);
      return;
    }

    onValueChange?.(nextValue);
  }

  return (
    <Field className="h-fit min-w-0 justify-start gap-2">
      {showLabel ? <ControlFieldLabel>{name}</ControlFieldLabel> : null}
      <div className="min-w-0 w-full">
        <ColorValueControl
          color={activeColor}
          label={name}
          onColorChange={updateColor}
        >
          <ColorOpacityInput
            label={name}
            name={`${name.toLowerCase().replace(/\s+/g, "-")}-opacity`}
            onOpacityChange={updateOpacity}
            opacity={activeOpacity}
          />
        </ColorValueControl>
      </div>
    </Field>
  );
}
