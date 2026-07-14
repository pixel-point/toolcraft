"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { SHARED_INPUT_CONTROL_BASE_CLASS_NAME } from "../../lib/input-control-style";

import { cn } from "../../lib/utils";

const textareaVariants = cva(
  cn("flex field-sizing-content resize-none", SHARED_INPUT_CONTROL_BASE_CLASS_NAME),
  {
    variants: {
      size: {
        content: "min-h-0 px-2 py-2 text-sm/relaxed",
        sm: "min-h-14 px-2 py-1.5 text-xs/relaxed",
        default: "min-h-16 px-2 py-2 text-xs-plus/relaxed",
        lg: "min-h-20 px-2.5 py-2.5 text-sm/relaxed",
        xl: "min-h-24 px-3 py-3 text-base/relaxed",
      },
      variant: {
        default: "",
        "code-editor":
          "relative z-10 min-h-0 overflow-x-auto overflow-y-hidden font-mono whitespace-pre text-xs/relaxed text-transparent caret-[color:var(--foreground)] selection:bg-[color:var(--accent)] selection:text-transparent",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea"> & VariantProps<typeof textareaVariants>
>(function Textarea({ className, size, variant, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      data-size={size ?? "default"}
      data-slot="textarea"
      data-variant={variant ?? "default"}
      className={cn(textareaVariants({ size, variant }), className)}
      {...props}
    />
  );
});

export { Textarea, textareaVariants };
