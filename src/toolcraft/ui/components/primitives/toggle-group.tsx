"use client";

import * as React from "react";
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";
import { toggleVariants } from "./toggle";

const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }
>({
  size: "default",
  variant: "default",
  spacing: 0,
  orientation: "horizontal",
});

function getJoinedOutlineGroupClassName({
  orientation,
  spacing,
  variant,
}: {
  orientation: "horizontal" | "vertical";
  spacing: number;
  variant?: VariantProps<typeof toggleVariants>["variant"];
}): string {
  if (spacing !== 0 || variant !== "outline") {
    return "";
  }

  if (orientation === "vertical") {
    return "[&>[data-slot]]:relative [&>[data-slot]:has(+[data-slot])]:border-b-0 [&>[data-slot][aria-pressed=true]+[data-slot]]:border-t-[color:color-mix(in_oklab,var(--border)_10%,transparent)] [&>[data-slot][data-pressed]+[data-slot]]:border-t-[color:color-mix(in_oklab,var(--border)_10%,transparent)] [&>[data-slot][data-state=on]+[data-slot]]:border-t-[color:color-mix(in_oklab,var(--border)_10%,transparent)]";
  }

  return "[&>[data-slot]]:relative [&>[data-slot]:has(+[data-slot])]:border-r-0 [&>[data-slot][aria-pressed=true]+[data-slot]]:border-l-[color:color-mix(in_oklab,var(--border)_10%,transparent)] [&>[data-slot][data-pressed]+[data-slot]]:border-l-[color:color-mix(in_oklab,var(--border)_10%,transparent)] [&>[data-slot][data-state=on]+[data-slot]]:border-l-[color:color-mix(in_oklab,var(--border)_10%,transparent)]";
}

function ToggleGroup({
  className,
  variant,
  size,
  spacing = 0,
  orientation = "horizontal",
  children,
  ...props
}: ToggleGroupPrimitive.Props &
  VariantProps<typeof toggleVariants> & {
    spacing?: number;
    orientation?: "horizontal" | "vertical";
  }) {
  const joinedOutlineGroupClassName = getJoinedOutlineGroupClassName({
    orientation,
    spacing,
    variant,
  });

  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      data-spacing={spacing}
      data-orientation={orientation}
      style={{ "--gap": spacing } as React.CSSProperties}
      className={cn(
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-md data-[size=sm]:rounded-[min(var(--radius-md),8px)] data-vertical:flex-col data-vertical:items-stretch",
        joinedOutlineGroupClassName,
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size, spacing, orientation }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive>
  );
}

function ToggleGroupItem({
  className,
  children,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);

  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      data-spacing={context.spacing}
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 focus:z-10 focus-visible:z-10 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-md group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-md group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-md group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-md",
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { ToggleGroup, ToggleGroupItem };
