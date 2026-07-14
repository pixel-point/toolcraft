import { MinusIcon, PlusIcon } from "@phosphor-icons/react";
import * as React from "react";
import {
  Button,
  Field,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "../../primitives";
import { selectedItemSurfaceClassName } from "../../primitives/selection-state";
import { cn } from "../../../lib/utils";

import {
  formatStopPosition,
  maxGradientStops,
  minGradientStops,
  normalizeStopOpacity,
  parseStopOpacity,
  parseStopPosition,
  type IndexedGradientStop,
} from "./gradient-control-utils";
import { ColorValueControl } from "../color";
import { ControlFieldLabel } from "../../control-layout";

function GradientStopsHeader({
  canAdd,
  onAdd,
}: {
  canAdd: boolean;
  onAdd: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2">
      <ControlFieldLabel>Stops</ControlFieldLabel>
      <Button
        aria-label="Add gradient stop"
        disabled={!canAdd}
        onClick={onAdd}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

function GradientStopColorControls({
  onColorChange,
  onOpacityChange,
  stop,
  stopLabel,
  stopName,
}: {
  onColorChange: (nextColor: string) => void;
  onOpacityChange: (nextOpacity: number) => void;
  stop: IndexedGradientStop;
  stopLabel: string;
  stopName: string;
}): React.JSX.Element {
  return (
    <ColorValueControl
      className="min-w-0"
      color={stop.color}
      inputName={`${stopName}-color`}
      label={stopLabel}
      nativeInputName={`${stopName}-native-color`}
      onColorChange={onColorChange}
    >
      <GradientStopOpacityInput
        onOpacityChange={onOpacityChange}
        stop={stop}
        stopLabel={stopLabel}
        stopName={stopName}
      />
    </ColorValueControl>
  );
}

function GradientStopOpacityInput({
  onOpacityChange,
  stop,
  stopLabel,
  stopName,
}: {
  onOpacityChange: (nextOpacity: number) => void;
  stop: IndexedGradientStop;
  stopLabel: string;
  stopName: string;
}): React.JSX.Element {
  const committedOpacity = String(parseStopOpacity(stop.opacity));
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

    const nextOpacity = normalizeStopOpacity(trimmedDraft);

    setDraftOpacity(String(nextOpacity));

    if (nextOpacity !== parseStopOpacity(stop.opacity)) {
      onOpacityChange(nextOpacity);
    }
  }

  return (
    <InputGroup className="w-14 flex-none rounded-l-none [&:not(:focus-within):hover]:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] [&:not(:focus-within):hover]:text-[color:var(--foreground)]">
      <InputGroupInput
        aria-label={`${stopLabel} opacity`}
        autoComplete="off"
        className="pl-[5px] pr-1 text-right font-mono"
        inputMode="numeric"
        name={`${stopName}-opacity`}
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

function getStopPositionInputValue(position: string): string {
  return String(Math.round(parseStopPosition(position) * 100));
}

function getNormalizedStopPositionFromInputValue(value: string): string | null {
  const parsedValue = Number.parseFloat(value);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return formatStopPosition(parsedValue / 100);
}

function GradientStopPositionInput({
  onPositionChange,
  stop,
  stopLabel,
  stopName,
}: {
  onPositionChange: (nextPosition: string) => void;
  stop: IndexedGradientStop;
  stopLabel: string;
  stopName: string;
}): React.JSX.Element {
  const committedPosition = formatStopPosition(parseStopPosition(stop.position));
  const committedInputValue = getStopPositionInputValue(stop.position);
  const [draftValue, setDraftValue] = React.useState(committedInputValue);
  const skipNextBlurCommitRef = React.useRef(false);

  React.useEffect(() => {
    setDraftValue(committedInputValue);
  }, [committedInputValue]);

  function commitPosition(nextValue = draftValue): void {
    const nextPosition = getNormalizedStopPositionFromInputValue(nextValue);

    if (nextPosition === null) {
      setDraftValue(committedInputValue);
      return;
    }

    setDraftValue(getStopPositionInputValue(nextPosition));

    if (nextPosition !== committedPosition) {
      onPositionChange(nextPosition);
    }
  }

  return (
    <InputGroup className="min-w-0">
      <InputGroupInput
        aria-label={`${stopLabel} position`}
        autoComplete="off"
        className="pl-[5px] pr-1 text-left font-mono"
        inputMode="numeric"
        name={`${stopName}-position`}
        onBlur={() => {
          if (skipNextBlurCommitRef.current) {
            skipNextBlurCommitRef.current = false;
            return;
          }

          commitPosition();
        }}
        onChange={(event) => setDraftValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitPosition(event.currentTarget.value);
            skipNextBlurCommitRef.current = true;
            event.currentTarget.blur();
          }

          if (event.key === "Escape") {
            event.preventDefault();
            setDraftValue(committedInputValue);
            skipNextBlurCommitRef.current = true;
            event.currentTarget.blur();
          }
        }}
        type="text"
        value={draftValue}
      />
      <InputGroupAddon align="inline-end" className="pr-1.5 pl-0">
        <InputGroupText className="group-hover/input-group:text-[color:var(--foreground)]">
          %
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

function GradientStopRowSelectionSurface({
  isSelected,
}: {
  isSelected: boolean;
}): React.JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -inset-[5px] rounded-[7px] opacity-0 data-[selected=true]:opacity-100",
        selectedItemSurfaceClassName,
      )}
      data-selected={isSelected}
      data-slot="gradient-stop-row-surface"
    />
  );
}

function GradientStopRow({
  canRemove,
  isSelected,
  onColorChange,
  onOpacityChange,
  onPositionChange,
  onRemove,
  onSelect,
  stop,
}: {
  canRemove: boolean;
  isSelected: boolean;
  onColorChange: (nextColor: string) => void;
  onOpacityChange: (nextOpacity: number) => void;
  onPositionChange: (nextPosition: string) => void;
  onRemove: () => void;
  onSelect: () => void;
  stop: IndexedGradientStop;
}): React.JSX.Element {
  const stopLabel = `Stop ${stop.originalIndex + 1}`;
  const stopName = `gradient-stop-${stop.originalIndex + 1}`;

  function selectAndChangeColor(nextColor: string): void {
    onSelect();
    onColorChange(nextColor);
  }

  function selectAndChangeOpacity(nextOpacity: number): void {
    onSelect();
    onOpacityChange(nextOpacity);
  }

  function selectAndChangePosition(nextPosition: string): void {
    onSelect();
    onPositionChange(nextPosition);
  }

  return (
    <Field
      className="min-w-0 rounded-none p-0"
      data-selected={isSelected}
      onFocusCapture={onSelect}
      onPointerDownCapture={onSelect}
      orientation="horizontal"
    >
      <div className="min-w-0 flex-1 py-1" data-slot="gradient-stop-row-gutter">
        <div className="relative min-w-0" data-slot="gradient-stop-row-content">
          <GradientStopRowSelectionSurface isSelected={isSelected} />
          <div
            className="relative grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)_1.5rem] items-center gap-[6px]"
            data-slot="gradient-stop-row-grid"
          >
            <GradientStopPositionInput
              onPositionChange={selectAndChangePosition}
              stop={stop}
              stopLabel={stopLabel}
              stopName={stopName}
            />
            <GradientStopColorControls
              onColorChange={selectAndChangeColor}
              onOpacityChange={selectAndChangeOpacity}
              stop={stop}
              stopLabel={stopLabel}
              stopName={stopName}
            />
            <Button
              aria-label={`Remove ${stopLabel.toLowerCase()}`}
              disabled={!canRemove}
              onClick={onRemove}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <MinusIcon />
            </Button>
          </div>
        </div>
      </div>
    </Field>
  );
}

export function GradientStopsList({
  onAdd,
  onColorChange,
  onOpacityChange,
  onPositionChange,
  onRemove,
  onSelect,
  selectedIndex,
  stops,
}: {
  onAdd: () => void;
  onColorChange: (index: number, nextColor: string) => void;
  onOpacityChange: (index: number, nextOpacity: number) => void;
  onPositionChange: (index: number, nextPosition: string) => void;
  onRemove: (index: number) => void;
  onSelect: (index: number) => void;
  selectedIndex: number | null;
  stops: readonly IndexedGradientStop[];
}): React.JSX.Element {
  const canAdd = stops.length < maxGradientStops;
  const canRemove = stops.length > minGradientStops;

  return (
    <div
      className="flex min-w-0 flex-col gap-1"
      data-slot="gradient-stops-list"
    >
      <GradientStopsHeader canAdd={canAdd} onAdd={onAdd} />
      <div
        className="flex min-w-0 flex-col gap-[2px]"
        data-slot="gradient-stops-list-rows"
      >
        {stops.map((stop) => (
          <GradientStopRow
            canRemove={canRemove}
            isSelected={selectedIndex === stop.originalIndex}
            key={stop.originalIndex}
            onColorChange={(nextColor) =>
              onColorChange(stop.originalIndex, nextColor)
            }
            onOpacityChange={(nextOpacity) =>
              onOpacityChange(stop.originalIndex, nextOpacity)
            }
            onPositionChange={(nextPosition) =>
              onPositionChange(stop.originalIndex, nextPosition)
            }
            onRemove={() => onRemove(stop.originalIndex)}
            onSelect={() => onSelect(stop.originalIndex)}
            stop={stop}
          />
        ))}
      </div>
    </div>
  );
}
