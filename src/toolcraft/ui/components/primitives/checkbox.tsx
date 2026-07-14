"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { CheckIcon } from "@phosphor-icons/react";

const checkboxVariants = cva(
  "peer relative flex shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] bg-clip-padding text-[color:var(--foreground)] transition-all outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 hover:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--input)_15%,transparent)] focus-visible:ring focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_30%,transparent)] data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] data-disabled:hover:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] aria-invalid:border-[color:var(--destructive)] aria-invalid:ring aria-invalid:ring-[color:color-mix(in_oklab,var(--destructive)_20%,transparent)] dark:aria-invalid:border-[color:color-mix(in_oklab,var(--destructive)_50%,transparent)] dark:aria-invalid:ring-[color:color-mix(in_oklab,var(--destructive)_40%,transparent)] data-checked:border-[color:var(--primary)] data-checked:hover:border-[color:var(--primary)] data-checked:active:border-[color:var(--primary)] data-checked:focus-visible:border-[color:var(--primary)] data-checked:bg-[color:var(--primary)] data-checked:bg-clip-border data-checked:text-[color:var(--primary-foreground)] dark:data-checked:bg-[color:var(--primary)]",
  {
    variants: {
      size: {
        sm: "size-3.5",
        default: "size-4",
        lg: "size-4.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const checkboxIndicatorVariants = cva("grid place-content-center text-current transition-none", {
  variants: {
    size: {
      sm: "[&>svg]:size-3",
      default: "[&>svg]:size-3.5",
      lg: "[&>svg]:size-3.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

function Checkbox({
  className,
  size,
  ...props
}: CheckboxPrimitive.Root.Props & VariantProps<typeof checkboxVariants>) {
  const resolvedSize = size ?? "default";

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-size={resolvedSize}
      className={cn(checkboxVariants({ size: resolvedSize }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className={checkboxIndicatorVariants({ size: resolvedSize })}
      >
        <CheckIcon />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
