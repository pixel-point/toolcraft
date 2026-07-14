"use client";

import * as React from "react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { cva, type VariantProps } from "class-variance-authority";

import { outlineControlSurfaceClassName } from "../../lib/control-outline";
import { cn } from "../../lib/utils";
import {
  PortalLayerContainerProvider,
  usePortalLayerContainer,
} from "./portal-layer-context";
import { PrimitiveArrowIcon } from "./primitive-arrow-icon";
import { ScrollFade } from "./scroll-fade";
import { pressedSelectedItemClassName } from "./selection-state";
import { CheckIcon } from "@phosphor-icons/react";

const Select = SelectPrimitive.Root;

const dropdownHoverBorderClassName =
  "[&:not(:focus):not([aria-expanded=true]):not([data-open]):not([data-popup-open]):not([data-state=open]):hover]:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)]";

const selectTriggerVariants = cva(
  "flex w-fit cursor-pointer items-center justify-between gap-1.5 border whitespace-nowrap font-medium transition-colors outline-none select-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[color:var(--destructive)] *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 dark:aria-invalid:border-[color:color-mix(in_oklab,var(--destructive)_50%,transparent)] [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      placeholderTone: {
        default: "data-placeholder:text-[color:var(--foreground)]",
        muted: "data-placeholder:text-[color:var(--muted-foreground)]",
      },
      radius: {
        default: "rounded-lg",
        full: "rounded-full",
      },
      variant: {
        default: `${outlineControlSurfaceClassName} ${dropdownHoverBorderClassName} focus-visible:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] aria-expanded:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] data-popup-open:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] data-open:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]`,
        ghost: `border-transparent bg-transparent bg-clip-border text-[color:var(--foreground)] focus-visible:border-[color:var(--ring)] focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_30%,transparent)] hover:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] hover:text-[color:var(--foreground)] active:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] active:text-[color:var(--foreground)] aria-expanded:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] aria-expanded:text-[color:var(--foreground)] data-open:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] data-open:text-[color:var(--foreground)] data-popup-open:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] data-popup-open:text-[color:var(--foreground)] data-[state=open]:bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] data-[state=open]:text-[color:var(--foreground)] ${pressedSelectedItemClassName}`,
      },
      size: {
        sm: "h-6 gap-1 px-1.5 pr-1 py-0 text-xs/relaxed *:data-[slot=select-value]:gap-1 [&_svg:not([class*='size-'])]:size-3",
        default:
          "h-7 px-2 py-0.5 text-xs/relaxed [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-8 px-2.5 py-1 text-sm/relaxed [&_svg:not([class*='size-'])]:size-4",
        xl: "h-10 px-3 py-1.5 text-base/relaxed [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      placeholderTone: "muted",
      radius: "default",
      variant: "default",
      size: "default",
    },
  },
);

function SelectGroup({ className, ...props }: SelectPrimitive.Group.Props) {
  return (
    <SelectPrimitive.Group
      data-slot="select-group"
      className={cn("scroll-my-1 p-1", className)}
      {...props}
    />
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("flex min-w-0 flex-1 text-left", className)}
      {...props}
    />
  );
}

function SelectTrigger({
  className,
  placeholderTone = "muted",
  radius = "default",
  size = "default",
  variant = "default",
  children,
  ...props
}: SelectPrimitive.Trigger.Props & VariantProps<typeof selectTriggerVariants>) {
  return (
    <SelectPrimitive.Trigger
      data-placeholder-tone={placeholderTone}
      data-radius={radius}
      data-slot="select-trigger"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/select-trigger",
        selectTriggerVariants({ placeholderTone, radius, size, variant }),
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon
        render={
          <PrimitiveArrowIcon openClassName="group-aria-expanded/select-trigger:rotate-180 group-data-popup-open/select-trigger:rotate-180 group-data-open/select-trigger:rotate-180" />
        }
      />
    </SelectPrimitive.Trigger>
  );
}

const selectTriggerArrowOpenClassName =
  "group-aria-expanded/select-trigger:rotate-180 group-data-popup-open/select-trigger:rotate-180 group-data-open/select-trigger:rotate-180";

const SelectTriggerButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof selectTriggerVariants> & {
      open?: boolean;
    }
>(function SelectTriggerButton(
  {
    children,
    className,
    open,
    placeholderTone = "muted",
    radius = "default",
    size = "default",
    variant = "default",
    ...props
  },
  ref,
) {
  return (
    <button
      data-open={open ? "" : undefined}
      data-placeholder-tone={placeholderTone}
      data-radius={radius}
      data-slot="select-trigger"
      data-size={size}
      data-variant={variant}
      className={cn(
        "group/select-trigger",
        selectTriggerVariants({ placeholderTone, radius, size, variant }),
        className,
      )}
      ref={ref}
      {...props}
    >
      {children}
      <PrimitiveArrowIcon openClassName={selectTriggerArrowOpenClassName} />
    </button>
  );
});

function SelectContent({
  className,
  children,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  alignItemWithTrigger = true,
  ...props
}: SelectPrimitive.Popup.Props &
  Pick<
    SelectPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "alignItemWithTrigger"
  >) {
  const resolvedContainer = usePortalLayerContainer();
  const portalNodeRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <SelectPrimitive.Portal container={resolvedContainer} ref={portalNodeRef}>
      <PortalLayerContainerProvider container={portalNodeRef}>
        <SelectPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          alignItemWithTrigger={alignItemWithTrigger}
          className="isolate z-50"
        >
          <SelectPrimitive.Popup
            data-slot="select-content"
            data-align-trigger={alignItemWithTrigger}
            className={cn(
              "floating-popup-surface relative isolate z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg border text-[color:var(--popover-foreground)] duration-100 data-[align-trigger=true]:w-(--anchor-width) data-[align-trigger=true]:animate-none data-[align-trigger=false]:w-max data-[align-trigger=false]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              "floating-popup-surface relative isolate z-50 max-h-(--available-height) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg border popup-text-xs-plus text-[color:var(--popover-foreground)] duration-100 data-[align-trigger=true]:w-(--anchor-width) data-[align-trigger=true]:animate-none data-[align-trigger=false]:w-max data-[align-trigger=false]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:zoom-out-95",
              className,
            )}
            {...props}
          >
            <SelectScrollUpButton />
            <SelectPrimitive.List>{children}</SelectPrimitive.List>
            <SelectScrollDownButton />
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </PortalLayerContainerProvider>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-label"
      className={cn(
        "px-2 py-1.5 popup-text-xs-plus text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

function getTextTitle(
  title: unknown,
  children: React.ReactNode,
): string | undefined {
  if (typeof title === "string" && title.length > 0) {
    return title;
  }

  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  return undefined;
}

function useOverflowTitle(
  viewportRef: React.RefObject<HTMLDivElement | null>,
  textTitle: string | undefined,
): string | undefined {
  const [overflowing, setOverflowing] = React.useState(false);

  React.useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport || !textTitle) {
      setOverflowing(false);
      return undefined;
    }

    const updateOverflow = () => {
      setOverflowing(viewport.scrollWidth > viewport.clientWidth + 1);
    };

    updateOverflow();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(viewport);

    if (viewport.firstElementChild instanceof HTMLElement) {
      observer.observe(viewport.firstElementChild);
    }

    return () => {
      observer.disconnect();
    };
  }, [textTitle, viewportRef]);

  return overflowing ? textTitle : undefined;
}

function SelectItemTextContent({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string | undefined;
}): React.JSX.Element {
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const resolvedTitle = useOverflowTitle(viewportRef, title);

  if (!title) {
    return (
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
        {children}
      </span>
    );
  }

  return (
    <ScrollFade
      className="no-scrollbar min-w-0"
      containerClassName="min-w-0 flex-1"
      preset="compact"
      side="right"
      viewportRef={viewportRef}
      watch={[title]}
    >
      <span
        className="block min-w-max whitespace-nowrap pr-2"
        title={resolvedTitle}
      >
        {children}
      </span>
    </ScrollFade>
  );
}

function SelectItem({
  className,
  children,
  title,
  ...props
}: SelectPrimitive.Item.Props) {
  const textTitle = getTextTitle(title, children);

  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-7 w-full cursor-pointer items-center gap-2 rounded-md py-1 pr-8 pl-2 popup-text-xs-plus leading-normal tracking-tight font-medium outline-hidden select-none hover:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:text-[color:var(--accent-foreground)] not-data-[variant=destructive]:focus:**:text-[color:var(--accent-foreground)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText
        className="flex min-w-0 flex-1 gap-2 overflow-hidden whitespace-nowrap"
        data-slot="select-item-text"
      >
        <SelectItemTextContent title={textTitle}>
          {children}
        </SelectItemTextContent>
      </SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "floating-popup-separator pointer-events-none -mx-1 my-1 h-px",
        className,
      )}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpArrow>) {
  return (
    <SelectPrimitive.ScrollUpArrow
      data-slot="select-scroll-up-button"
      className={cn(
        "floating-popup-fill top-0 z-10 flex w-full cursor-pointer items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      <PrimitiveArrowIcon direction="up" />
    </SelectPrimitive.ScrollUpArrow>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownArrow>) {
  return (
    <SelectPrimitive.ScrollDownArrow
      data-slot="select-scroll-down-button"
      className={cn(
        "floating-popup-fill bottom-0 z-10 flex w-full cursor-pointer items-center justify-center py-1 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      <PrimitiveArrowIcon />
    </SelectPrimitive.ScrollDownArrow>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectTriggerButton,
  SelectValue,
};
