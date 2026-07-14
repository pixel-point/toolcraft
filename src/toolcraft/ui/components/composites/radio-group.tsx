import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { cva, type VariantProps } from "class-variance-authority";

import { checkedSelectedItemClassName } from "../primitives";
import { cn } from "../../lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-3", className)}
      {...props}
    />
  );
}

const radioGroupItemVariants = cva(
  `group/radio-group-item peer relative flex aspect-square shrink-0 cursor-pointer rounded-full border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] bg-clip-padding text-[color:var(--foreground)] transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 hover:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--input)_15%,transparent)] focus-visible:border-[color:var(--ring)] focus-visible:ring focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_30%,transparent)] data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-disabled:hover:border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] data-disabled:hover:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] aria-invalid:border-[color:var(--destructive)] aria-invalid:ring aria-invalid:ring-[color:color-mix(in_oklab,var(--destructive)_20%,transparent)] dark:aria-invalid:border-[color:color-mix(in_oklab,var(--destructive)_50%,transparent)] dark:aria-invalid:ring-[color:color-mix(in_oklab,var(--destructive)_40%,transparent)] ${checkedSelectedItemClassName}`,
  {
    variants: {
      size: {
        default: "size-4",
        lg: "size-4.5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const radioGroupIndicatorVariants = cva("flex items-center justify-center", {
  variants: {
    size: {
      default: "size-4",
      lg: "size-4.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const radioGroupDotVariants = cva(
  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--foreground)]",
  {
    variants: {
      size: {
        default: "size-2",
        lg: "size-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function RadioGroupItem({
  className,
  size,
  ...props
}: RadioPrimitive.Root.Props & VariantProps<typeof radioGroupItemVariants>) {
  const resolvedSize = size ?? "default";

  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      data-size={resolvedSize}
      className={cn(radioGroupItemVariants({ size: resolvedSize }), className)}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className={radioGroupIndicatorVariants({ size: resolvedSize })}
      >
        <span className={radioGroupDotVariants({ size: resolvedSize })} />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  );
}

export { RadioGroup, RadioGroupItem };
