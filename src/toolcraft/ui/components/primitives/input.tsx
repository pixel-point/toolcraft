"use client";

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import {
  SHARED_INPUT_CONTROL_BASE_CLASS_NAME,
  SHARED_INPUT_CONTROL_SIZE_CLASS_NAMES,
} from "../../lib/input-control-style";

import { cn } from "../../lib/utils";

const inputVariants = cva(SHARED_INPUT_CONTROL_BASE_CLASS_NAME, {
  variants: {
    size: SHARED_INPUT_CONTROL_SIZE_CLASS_NAMES,
  },
  defaultVariants: {
    size: "default",
  },
});

type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants> & {
    collapseSelectionOnBlur?: boolean;
  };

function collapseSelection(target: HTMLInputElement): void {
  try {
    const caretPosition = target.selectionEnd ?? target.value.length;
    target.setSelectionRange(caretPosition, caretPosition);
  } catch {
    // Ignore unsupported input types.
  }
}

function Input({
  className,
  collapseSelectionOnBlur = false,
  onBlur,
  size,
  type,
  ...props
}: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size }), className)}
      onBlur={(event) => {
        if (collapseSelectionOnBlur) {
          collapseSelection(event.currentTarget);
        }

        onBlur?.(event);
      }}
      {...props}
    />
  );
}

export { Input, inputVariants };
