"use client";

import { Children, isValidElement, useEffect, useRef, useState } from "react";

import { Slider } from "./slider";

const editableValueTextBaseClassName =
  "block h-full min-w-0 overflow-hidden whitespace-nowrap font-sans text-xs leading-5 tabular-nums";
const valueLabelContainerClassName = "inline-grid h-5 shrink-0";

type EditableSliderValueLabelLayout = "content" | "reference";
type EditableSliderValueLabelTextAlign = "left" | "right";

type SliderMetadataProps = {
  max?: number;
  min?: number;
};

type EditableSliderValueLabelProps = {
  ariaLabel: string;
  disabled?: boolean;
  layout?: EditableSliderValueLabelLayout;
  maxValueLabel?: string;
  onCommit?: (nextValue: string) => void;
  onStep?: (direction: -1 | 1, currentDraft: string) => string | undefined;
  textAlign?: EditableSliderValueLabelTextAlign;
  valueLabel: string;
};

export function EditableSliderValueLabel({
  ariaLabel,
  disabled = false,
  layout = "reference",
  maxValueLabel,
  onCommit,
  onStep,
  textAlign = "right",
  valueLabel,
}: EditableSliderValueLabelProps): React.JSX.Element {
  const [editing, setEditing] = useState(false);
  const editorRef = useRef<HTMLSpanElement>(null);
  const valueLabelRef = useRef(valueLabel);
  const isEditableValueLabel = hasEditableNumericValueLabel(valueLabel);
  const valueTextClassName = getEditableValueTextClassName({ layout, textAlign });
  const widestValueLabel = getWidestValueLabel(valueLabel, maxValueLabel);

  useEffect(() => {
    valueLabelRef.current = valueLabel;
  }, [valueLabel]);

  useEffect(() => {
    if (editing) {
      const editor = editorRef.current;

      if (!editor) {
        return;
      }

      editor.textContent = valueLabelRef.current;
      editor.focus();
      selectEditableText(editor);
    }
  }, [editing]);

  if (disabled || !onCommit || !isEditableValueLabel) {
    const valueTextToneClassName = disabled
      ? "text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] opacity-60"
      : "text-[color:var(--muted-foreground)]";

    return (
      <span className={getValueLabelContainerClassName(layout, "cursor-default")}>
        {layout === "reference" ? <SliderValueLabelMeasure valueLabel={widestValueLabel} /> : null}
        <span
          className={`col-start-1 row-start-1 cursor-default ${valueTextToneClassName} ${valueTextClassName}`}
        >
          {valueLabel}
        </span>
      </span>
    );
  }

  function commitDraft(): void {
    onCommit?.(editorRef.current?.textContent ?? valueLabelRef.current);
    setEditing(false);
  }

  return (
    <span className={getValueLabelContainerClassName(layout)}>
      {layout === "reference" ? <SliderValueLabelMeasure valueLabel={widestValueLabel} /> : null}
      {editing ? (
        <EditableSliderValueEditor
          ariaLabel={ariaLabel}
          editorRef={editorRef}
          layout={layout}
          onCancel={() => setEditing(false)}
          onCommit={commitDraft}
          onStep={onStep}
          textClassName={valueTextClassName}
        />
      ) : (
        <EditableSliderValueButton
          ariaLabel={ariaLabel}
          layout={layout}
          onBeginEditing={() => setEditing(true)}
          textClassName={valueTextClassName}
          valueLabel={valueLabel}
        />
      )}
    </span>
  );
}

function SliderValueLabelMeasure({ valueLabel }: { valueLabel: string }): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      className={`invisible col-start-1 row-start-1 min-w-[4ch] pointer-events-none text-[color:var(--muted-foreground)] ${getEditableValueTextClassName(
        {
          layout: "reference",
          textAlign: "right",
        },
      )}`}
      data-slider-value-label-measure=""
    >
      {valueLabel}
    </span>
  );
}

function getValueLabelContainerClassName(
  layout: EditableSliderValueLabelLayout,
  className = "",
): string {
  return [
    valueLabelContainerClassName,
    layout === "content" ? "w-fit justify-items-start" : "place-items-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

function getEditableValueTextClassName({
  layout,
  textAlign,
}: {
  layout: EditableSliderValueLabelLayout;
  textAlign: EditableSliderValueLabelTextAlign;
}): string {
  return [
    editableValueTextBaseClassName,
    layout === "content" ? "w-auto" : "w-full",
    textAlign === "left" ? "text-left" : "text-right",
  ].join(" ");
}

function EditableSliderValueEditor({
  ariaLabel,
  editorRef,
  layout,
  onCancel,
  onCommit,
  onStep,
  textClassName,
}: {
  ariaLabel: string;
  editorRef: React.RefObject<HTMLSpanElement | null>;
  layout: EditableSliderValueLabelLayout;
  onCancel: () => void;
  onCommit: () => void;
  onStep?: (direction: -1 | 1, currentDraft: string) => string | undefined;
  textClassName: string;
}): React.JSX.Element {
  return (
    <span
      aria-label={ariaLabel}
      className={`col-start-1 row-start-1 cursor-text p-0 text-[color:var(--foreground)] outline-none ${layout === "content" ? "justify-self-start" : ""} ${textClassName}`}
      contentEditable
      onBlur={onCommit}
      onFocus={(event) => selectEditableText(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onCommit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          const nextValueLabel = onStep?.(
            event.key === "ArrowUp" ? 1 : -1,
            event.currentTarget.textContent ?? "",
          );

          if (typeof nextValueLabel === "string") {
            event.preventDefault();
            event.currentTarget.textContent = nextValueLabel;
            selectEditableText(event.currentTarget);
          }
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

function EditableSliderValueButton({
  ariaLabel,
  layout,
  onBeginEditing,
  textClassName,
  valueLabel,
}: {
  ariaLabel: string;
  layout: EditableSliderValueLabelLayout;
  onBeginEditing: () => void;
  textClassName: string;
  valueLabel: string;
}): React.JSX.Element {
  function beginEditableActivation(event: React.MouseEvent | React.PointerEvent): void {
    event.stopPropagation();
    onBeginEditing();
  }

  return (
    <button
      aria-label={`Edit ${ariaLabel}`}
      className={`col-start-1 row-start-1 h-full min-w-0 appearance-none cursor-text border-0 bg-transparent p-0 transition-colors ${layout === "content" ? "w-auto justify-self-start" : "w-full"}`}
      onClick={beginEditableActivation}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
          onBeginEditing();
        }
      }}
      onMouseDown={stopEditableActivation}
      onMouseUp={beginEditableActivation}
      onPointerDown={stopEditableActivation}
      onPointerUp={beginEditableActivation}
      type="button"
    >
      <span
        className={`cursor-text text-[color:var(--muted-foreground)] transition-colors duration-200 ease-out hover:text-[color:var(--foreground)] ${textClassName}`}
      >
        {valueLabel}
      </span>
    </button>
  );
}

function stopEditableActivation(event: React.MouseEvent | React.PointerEvent): void {
  event.stopPropagation();
}

export function getInferredValueLabelWidthReference(
  valueLabel: string,
  children: React.ReactNode,
): string | undefined {
  const sliderMetadata = getSliderMetadata(children);

  if (!sliderMetadata) {
    return undefined;
  }

  return getNumericValueLabelWidthReference(valueLabel, sliderMetadata);
}

function getSliderMetadata(children: React.ReactNode): SliderMetadataProps | undefined {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<SliderMetadataProps>(child) || child.type !== Slider) {
      continue;
    }

    return {
      max: child.props.max ?? 100,
      min: child.props.min ?? 0,
    };
  }

  return undefined;
}

export function getNumericValueLabelWidthReference(
  valueLabel: string,
  { max = 100, min = 0 }: SliderMetadataProps,
): string | undefined {
  const numericMatches = Array.from(valueLabel.matchAll(/-?\d+(?:\.\d+)?/g));

  if (numericMatches.length === 0) {
    return undefined;
  }

  const decimalPrecision = Math.max(...numericMatches.map(getNumericMatchDecimalPrecision));
  const widestEndpoint = [min, max]
    .map((value) => formatNumericEndpoint(value, decimalPrecision))
    .sort((left, right) => right.length - left.length)[0];

  return valueLabel.replaceAll(/-?\d+(?:\.\d+)?/g, widestEndpoint ?? "");
}

function getNumericMatchDecimalPrecision(match: RegExpMatchArray): number {
  return match[0].split(".")[1]?.length ?? 0;
}

function formatNumericEndpoint(value: number, decimalPrecision: number): string {
  if (decimalPrecision > 0) {
    return value.toFixed(decimalPrecision);
  }

  return `${Math.round(value)}`;
}

function getWidestValueLabel(valueLabel: string, maxValueLabel?: string): string {
  if (!maxValueLabel || valueLabel.length > maxValueLabel.length) {
    return valueLabel;
  }

  return maxValueLabel;
}

function hasEditableNumericValueLabel(valueLabel: string): boolean {
  return /-?\d+(?:\.\d+)?/.test(valueLabel);
}

function selectEditableText(node: HTMLElement): void {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}
