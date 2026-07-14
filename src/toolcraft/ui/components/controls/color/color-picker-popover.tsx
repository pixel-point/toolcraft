"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../primitives/popover";
import { StyleGuideColorPicker } from "./style-guide-color-picker";
import { cn } from "../../../lib/utils";
import { useCallback, useRef, useState } from "react";

type ColorPickerPopoverSize = "default" | "sm";

type ColorPickerPopoverProps = {
  disabled?: boolean;
  label: string;
  pickerValue: string;
  showOpacity?: boolean;
  size?: ColorPickerPopoverSize;
  swatchColor: string;
  onColorChange: (nextColor: string) => void;
  onCommit?: () => void;
};

export function ColorPickerPopover({
  disabled = false,
  label,
  pickerValue,
  showOpacity = false,
  size = "default",
  swatchColor,
  onColorChange,
  onCommit,
}: ColorPickerPopoverProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const commitColor = useCallback(() => {
    onCommit?.();
  }, [onCommit]);
  const clearTriggerFocus = useCallback(() => {
    const blurTrigger = () => {
      if (document.activeElement === triggerRef.current) {
        triggerRef.current?.blur();
      }
    };

    blurTrigger();
    window.requestAnimationFrame(blurTrigger);
    window.setTimeout(blurTrigger, 0);
  }, []);
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        commitColor();
        clearTriggerFocus();
      }
    },
    [clearTriggerFocus, commitColor],
  );

  return (
    <Popover onOpenChange={handleOpenChange} open={open}>
      <PopoverTrigger
        aria-label={`Pick ${label}`}
        className={cn(
          "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-[color:var(--ring)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_30%,transparent)]",
          "border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_5%,transparent)]",
          size === "sm"
            ? "size-6 text-xs/relaxed"
            : "size-7 text-[13px] leading-[1.125rem]",
          "relative aspect-square flex-none p-0 [&:not(:focus):not([aria-expanded=true]):not([data-open]):not([data-popup-open]):not([data-state=open]):hover]:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] [&:not(:focus):not([aria-expanded=true]):not([data-open]):not([data-popup-open]):not([data-state=open]):hover]:text-[color:var(--foreground)] aria-expanded:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] data-open:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] data-popup-open:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] data-[state=open]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] disabled:pointer-events-none disabled:opacity-50",
        )}
        data-slot="button"
        disabled={disabled}
        ref={triggerRef}
        type="button"
      >
        <span
          aria-hidden="true"
          className={cn(
            "aspect-square shrink-0 rounded-[3px] border border-[color:color-mix(in_oklab,var(--border)_10%,transparent)]",
            size === "sm" ? "size-3.5" : "size-4",
          )}
          style={{ backgroundColor: swatchColor }}
        />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[236px] gap-0 overflow-visible p-0"
        finalFocus={false}
        sideOffset={6}
      >
        <StyleGuideColorPicker
          value={pickerValue}
          disabled={disabled}
          showOpacity={showOpacity}
          onChange={onColorChange}
          onCommit={commitColor}
        />
      </PopoverContent>
    </Popover>
  );
}
