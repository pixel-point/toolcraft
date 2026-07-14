import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import {
  PortalLayerContainerProvider,
  type PortalLayerContainer,
  usePortalLayerContainer,
} from "./portal-layer-context";
import { cn } from "../../lib/utils";

const popoverContentSurfaceClassName =
  "floating-popup-surface z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-lg border p-2.5 popup-text-xs-plus text-[color:var(--popover-foreground)] outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

const embeddedPopoverCardSurfaceClassName =
  "floating-popup-surface flex min-h-0 w-full flex-col overflow-hidden rounded-xl border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] p-0 text-[color:var(--foreground)]";

function PopoverSurface({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "embedded-card";
}) {
  return (
    <div
      data-slot="popover-content"
      data-variant={variant}
      className={cn(
        variant === "embedded-card"
          ? embeddedPopoverCardSurfaceClassName
          : popoverContentSurfaceClassName,
        className,
      )}
      {...props}
    />
  );
}

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  anchor,
  portalContainer,
  side = "bottom",
  sideOffset = 4,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "anchor" | "side" | "sideOffset"
  > & {
    portalContainer?: PortalLayerContainer;
  }) {
  const resolvedContainer = usePortalLayerContainer(portalContainer);
  const portalNodeRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <PopoverPrimitive.Portal container={resolvedContainer} ref={portalNodeRef}>
      <PortalLayerContainerProvider container={portalNodeRef}>
        <PopoverPrimitive.Positioner
          align={align}
          alignOffset={alignOffset}
          anchor={anchor}
          side={side}
          sideOffset={sideOffset}
          className="isolate z-50"
        >
          <PopoverPrimitive.Popup
            render={<PopoverSurface />}
            className={cn(className)}
            {...props}
          />
        </PopoverPrimitive.Positioner>
      </PortalLayerContainerProvider>
    </PopoverPrimitive.Portal>
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 popup-text-xs-plus", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("popup-text-xs-plus font-medium", className)}
      {...props}
    />
  );
}

function PopoverDescription({ className, ...props }: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-[color:var(--muted-foreground)]", className)}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverSurface,
  PopoverTitle,
  PopoverTrigger,
};
