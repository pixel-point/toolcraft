"use client";

import * as React from "react";

import { ControlFieldLabel } from "../../control-layout";
import { Field } from "../../primitives";
import { cn } from "../../../lib/utils";

type ImagePickerColumns = 2 | 3 | 4;

export type ImagePickerItem = {
  alt?: string;
  src: string;
  value: string;
};

export type ImagePickerControlProps = {
  items?: readonly ImagePickerItem[];
  name?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

const defaultImageSrc =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220"%3E%3C/svg%3E';

const defaultImagePickerItems = [
  { alt: "Image 1", src: defaultImageSrc, value: "image-1" },
  { alt: "Image 2", src: defaultImageSrc, value: "image-2" },
  { alt: "Image 3", src: defaultImageSrc, value: "image-3" },
  { alt: "Image 4", src: defaultImageSrc, value: "image-4" },
  { alt: "Image 5", src: defaultImageSrc, value: "image-5" },
  { alt: "Image 6", src: defaultImageSrc, value: "image-6" },
  { alt: "Image 7", src: defaultImageSrc, value: "image-7" },
  { alt: "Image 8", src: defaultImageSrc, value: "image-8" },
] satisfies readonly ImagePickerItem[];

const columnClassNames: Record<ImagePickerColumns, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
};

function getInitialValue(
  items: readonly ImagePickerItem[],
  value: string | undefined,
): string {
  return value ?? items[0]?.value ?? "";
}

function getImagePickerColumns(itemCount: number): ImagePickerColumns {
  if (itemCount === 2) {
    return 2;
  }

  if (itemCount === 3 || itemCount === 6) {
    return 3;
  }

  return 4;
}

export function ImagePickerControl({
  items = defaultImagePickerItems,
  name = "Image",
  value,
  onValueChange,
}: ImagePickerControlProps): React.JSX.Element {
  const [currentValue, setCurrentValue] = React.useState(() =>
    getInitialValue(items, value),
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setCurrentValue(value);
      return;
    }

    setCurrentValue((previousValue) =>
      items.some((item) => item.value === previousValue)
        ? previousValue
        : (items[0]?.value ?? ""),
    );
  }, [items, value]);

  function updateValue(nextValue: string): void {
    setCurrentValue(nextValue);
    onValueChange?.(nextValue);
  }

  const columns = getImagePickerColumns(items.length);

  return (
    <Field className="min-w-0 !gap-[10px]">
      <ControlFieldLabel>{name}</ControlFieldLabel>
      <div
        className={cn(
          "grid min-w-0 gap-[10px] overflow-visible",
          columnClassNames[columns],
        )}
      >
        {items.map((item) => {
          const isSelected = item.value === currentValue;

          return (
            <button
              aria-label={item.alt ?? item.value}
              aria-pressed={isSelected}
              className={cn(
                "group/image-picker-item relative min-w-0 cursor-pointer rounded-lg border border-[color:color-mix(in_oklab,var(--border)_10%,transparent)] bg-[color:var(--muted)] p-0 outline-none transition-[border-color,background-color,box-shadow] duration-150 ease-out",
                "hover:border-[color:color-mix(in_oklab,var(--border)_22%,transparent)] hover:bg-[color:var(--muted)]",
                "focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_30%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
                "data-[selected=true]:outline data-[selected=true]:outline-[1px] data-[selected=true]:outline-offset-2 data-[selected=true]:outline-[color:var(--border)] data-[selected=true]:[outline-style:solid]",
              )}
              data-selected={isSelected}
              key={item.value}
              onClick={() => updateValue(item.value)}
              type="button"
            >
              <span
                className={cn(
                  "relative block w-full overflow-hidden rounded-[inherit] bg-[color:var(--muted)]",
                  "aspect-[4/3]",
                )}
              >
                <img
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                  src={item.src}
                />
              </span>
            </button>
          );
        })}
      </div>
    </Field>
  );
}
