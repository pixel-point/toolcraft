"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "./button";
import { outlineControlSurfaceClassName } from "../../lib/control-outline";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { cn } from "../../lib/utils";

type InputGroupSize = "sm" | "default" | "lg" | "xl";

const InputGroupSizeContext = React.createContext<InputGroupSize>("default");

function useInputGroupSize(): InputGroupSize {
  return React.useContext(InputGroupSizeContext);
}

const inputGroupVariants = cva(
  cn(
    "group/input-group relative flex w-full min-w-0 items-center rounded-lg border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] transition-colors outline-none in-data-[slot=combobox-content]:focus-within:border-inherit in-data-[slot=combobox-content]:focus-within:ring-0 has-data-[align=block-end]:rounded-lg has-data-[align=block-start]:rounded-lg has-[[data-slot][aria-invalid=true]]:border-[color:var(--destructive)] has-[textarea]:rounded-lg has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>textarea]:h-auto has-[>[data-align=block-end]]:[&>input]:pt-3 has-[>[data-align=block-start]]:[&>input]:pb-3 has-[>[data-align=inline-end]]:[&>input]:pr-1.5 has-[>[data-align=inline-start]]:[&>input]:pl-1.5",
    "[&:not(:focus-within):hover]:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] [&:not(:focus-within):hover]:text-[color:var(--foreground)]",
  ),
  {
    variants: {
      size: {
        sm: "h-6",
        default: "h-7",
        lg: "h-8",
        xl: "h-10",
      },
      surfaceStyle: {
        default: outlineControlSurfaceClassName,
        transparent: "bg-transparent dark:bg-transparent",
        "toolbar-address": "",
      },
      focusStyle: {
        default:
          "has-[[data-slot=input-group-control]:focus]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] in-data-[slot=combobox-content]:has-[[data-slot=input-group-control]:focus]:border-inherit",
        none: "",
        "toolbar-address": "",
      },
    },
    defaultVariants: {
      size: "default",
      surfaceStyle: "default",
      focusStyle: "default",
    },
  },
);

function InputGroup({
  className,
  surfaceStyle,
  focusStyle,
  size = "default",
  ...props
}: React.ComponentProps<"div"> &
  Omit<VariantProps<typeof inputGroupVariants>, "size"> & {
    size?: InputGroupSize;
  }) {
  const normalizedSize = size ?? "default";

  return (
    <InputGroupSizeContext.Provider value={normalizedSize}>
      <div
        data-focus-style={focusStyle ?? undefined}
        data-size={normalizedSize}
        data-slot="input-group"
        data-surface-style={surfaceStyle ?? undefined}
        role="group"
        className={cn(
          inputGroupVariants({
            focusStyle,
            size: normalizedSize,
            surfaceStyle,
          }),
          className,
        )}
        {...props}
      />
    </InputGroupSizeContext.Provider>
  );
}

const inputGroupAddonVariants = cva(
  "flex h-auto cursor-text items-center justify-center gap-1 py-2 font-medium text-[color:var(--muted-foreground)] select-none group-data-[disabled=true]/input-group:opacity-50 [&>svg]:text-[color:var(--foreground)] **:data-[slot=kbd]:rounded-[calc(var(--radius-sm)-2px)] **:data-[slot=kbd]:bg-[color:color-mix(in_oklab,var(--muted-foreground)_10%,transparent)] **:data-[slot=kbd]:px-1 **:data-[slot=kbd]:text-[0.625rem] [&>svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      align: {
        "inline-start":
          "order-first pl-2 has-[>button]:pl-px has-[>kbd]:ml-[-0.275rem]",
        "inline-end":
          "order-last pr-1.5 has-[>button]:pr-0.5 has-[>kbd]:mr-[-0.275rem]",
        "block-start":
          "order-first w-full justify-start px-2 pt-2 group-has-[>input]/input-group:pt-2 [.border-b]:pb-2",
        "block-end":
          "order-last w-full justify-start px-2 pb-2 group-has-[>input]/input-group:pb-2 [.border-t]:pt-2",
      },
      size: {
        sm: "text-xs/relaxed",
        default: "text-xs/relaxed",
        lg: "gap-1.5 text-sm/relaxed data-[align=inline-start]:pl-2.5 data-[align=inline-start]:has-[>button]:pl-px data-[align=inline-end]:pr-2 data-[align=inline-end]:has-[>button]:pr-0.5 data-[align=block-start]:px-2.5 data-[align=block-end]:px-2.5 [&>svg:not([class*='size-'])]:size-4",
        xl: "gap-2 text-base/relaxed data-[align=inline-start]:pl-3 data-[align=inline-start]:has-[>button]:pl-px data-[align=inline-end]:pr-2.5 data-[align=inline-end]:has-[>button]:pr-0.5 data-[align=block-start]:px-3 data-[align=block-end]:px-3 [&>svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      align: "inline-start",
      size: "default",
    },
  },
);

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  const size = useInputGroupSize();

  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      className={cn(inputGroupAddonVariants({ align, size }), className)}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return;
        }
        e.preventDefault();
        e.currentTarget.parentElement?.querySelector("input")?.focus();
      }}
      {...props}
    />
  );
}

const inputGroupButtonVariants = cva(
  "items-center justify-center shadow-none",
  {
    variants: {
      groupSize: {
        sm: "text-xs/relaxed",
        default: "",
        lg: "data-[size=xs]:h-6 data-[size=xs]:px-2 data-[size=xs]:text-sm/relaxed data-[size=xs]:[&>svg:not([class*='size-'])]:size-3.5 data-[size=sm]:h-7 data-[size=sm]:text-sm/relaxed data-[size=icon-xs]:size-7 data-[size=icon-xs]:[&>svg:not([class*='size-'])]:size-3.5 data-[size=icon-sm]:size-8 data-[size=icon-sm]:[&>svg:not([class*='size-'])]:size-3.5",
        xl: "data-[size=xs]:h-8 data-[size=xs]:px-2.5 data-[size=xs]:text-base/relaxed data-[size=xs]:[&>svg:not([class*='size-'])]:size-4 data-[size=sm]:h-9 data-[size=sm]:px-3 data-[size=sm]:text-base/relaxed data-[size=sm]:[&>svg:not([class*='size-'])]:size-4 data-[size=icon-xs]:size-9 data-[size=icon-xs]:[&>svg:not([class*='size-'])]:size-4 data-[size=icon-sm]:size-10 data-[size=icon-sm]:[&>svg:not([class*='size-'])]:size-4",
      },
      size: {
        xxs: "h-[18px] gap-1 px-1.5 text-[11px] [&>svg:not([class*='size-'])]:size-2.5",
        xs: "h-5 gap-1 px-1.5 [&>svg:not([class*='size-'])]:size-3",
        sm: "h-6 gap-1 px-2 [&>svg:not([class*='size-'])]:size-3",
        "icon-xxs": "size-[18px] p-0 [&>svg:not([class*='size-'])]:size-2.5",
        "icon-xs": "size-6 p-0 [&>svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-7 p-0 [&>svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      groupSize: "default",
      size: "xs",
    },
  },
);

function InputGroupButton({
  className,
  type = "button",
  variant = "ghost",
  size = "xs",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "size" | "type"> &
  Omit<VariantProps<typeof inputGroupButtonVariants>, "groupSize"> & {
    type?: "button" | "submit" | "reset";
  }) {
  const groupSize = useInputGroupSize();

  return (
    <Button
      type={type}
      size={size}
      variant={variant}
      className={cn(inputGroupButtonVariants({ groupSize, size }), className)}
      {...props}
    />
  );
}

const inputGroupTextVariants = cva(
  "flex items-center gap-2 text-[color:color-mix(in_oklab,var(--foreground)_40%,transparent)] group-hover/input-group:text-[color:var(--foreground)] group-has-[[data-slot=input-group-control]:focus]/input-group:text-[color:var(--foreground)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        sm: "text-xs/relaxed",
        default: "text-xs/relaxed",
        lg: "text-sm/relaxed [&_svg:not([class*='size-'])]:size-4",
        xl: "text-base/relaxed [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {
  const size = useInputGroupSize();

  return (
    <span
      data-slot="input-group-text"
      className={cn(inputGroupTextVariants({ size }), className)}
      {...props}
    />
  );
}

const inputGroupInputVariants = cva(
  "h-full flex-1 border-0 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0",
  {
    variants: {
      size: {
        sm: "px-2 py-0 text-xs/relaxed",
        default: "px-2 py-0.5 text-xs/relaxed",
        lg: "px-2.5 py-1 text-sm/relaxed",
        xl: "px-3 py-1.5 text-base/relaxed",
      },
      surfaceStyle: {
        default: "rounded-none bg-transparent dark:bg-transparent",
        hoverInput:
          "rounded-lg bg-transparent hover:bg-[color:color-mix(in_oklab,var(--input)_30%,transparent)] dark:bg-transparent dark:hover:bg-[color:color-mix(in_oklab,var(--input)_30%,transparent)]",
        "toolbar-address": "rounded-none bg-transparent dark:bg-transparent",
      },
      typographyStyle: {
        default: "",
        addressBar: "text-xs-plus tracking-normal font-normal md:text-xs-plus",
        popup: "popup-text-xs-plus leading-normal tracking-tight font-normal",
      },
    },
    defaultVariants: {
      size: "default",
      surfaceStyle: "default",
      typographyStyle: "default",
    },
  },
);

function InputGroupInput({
  className,
  surfaceStyle,
  typographyStyle,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "size"> &
  Omit<VariantProps<typeof inputGroupInputVariants>, "size">) {
  const size = useInputGroupSize();

  return (
    <Input
      data-surface-style={surfaceStyle ?? undefined}
      data-typography-style={typographyStyle ?? undefined}
      data-slot="input-group-control"
      className={cn(
        inputGroupInputVariants({ size, surfaceStyle, typographyStyle }),
        className,
      )}
      {...props}
    />
  );
}

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<React.ComponentProps<typeof Textarea>, "size">
>(function InputGroupTextarea({ className, ...props }, ref) {
  const size = useInputGroupSize();

  return (
    <Textarea
      ref={ref}
      data-slot="input-group-control"
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
        className,
      )}
      size={size}
      {...props}
    />
  );
});

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupInput,
  InputGroupTextarea,
};
