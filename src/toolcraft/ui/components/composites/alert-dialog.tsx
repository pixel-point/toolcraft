"use client";

import * as React from "react";
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";

import {
  PortalLayerContainerProvider,
  type PortalLayerContainer,
  usePortalLayerContainer,
} from "../primitives";
import { cn } from "../../lib/utils";
import { Button } from "../primitives";

function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

function AlertDialogPortal({
  children,
  container,
  ...props
}: AlertDialogPrimitive.Portal.Props): React.JSX.Element {
  const resolvedContainer = usePortalLayerContainer(container);
  const portalNodeRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <AlertDialogPrimitive.Portal
      data-slot="alert-dialog-portal"
      container={resolvedContainer}
      ref={portalNodeRef}
      {...props}
    >
      <PortalLayerContainerProvider container={portalNodeRef}>
        {children}
      </PortalLayerContainerProvider>
    </AlertDialogPrimitive.Portal>
  );
}

function AlertDialogOverlay({ className, ...props }: AlertDialogPrimitive.Backdrop.Props) {
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/72 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogContent({
  className,
  portalContainer,
  size = "default",
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  portalContainer?: PortalLayerContainer;
  size?: "default" | "sm";
}) {
  return (
    <AlertDialogPortal container={portalContainer}>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        className={cn(
          "floating-popup-surface group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border p-5 popup-text-xs-plus text-[color:var(--popover-foreground)] duration-100 outline-none data-[size=default]:max-w-sm data-[size=sm]:max-w-72 data-[size=default]:sm:max-w-md data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn(
        "group/alert-dialog-header grid justify-items-center gap-x-3 gap-y-2 text-center sm:justify-items-start sm:text-left has-[>[data-slot=alert-dialog-media]]:grid-cols-[auto_1fr] has-[>[data-slot=alert-dialog-media]]:items-start has-[>[data-slot=alert-dialog-media]]:justify-items-start has-[>[data-slot=alert-dialog-media]]:text-left",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "mt-1 flex flex-col-reverse gap-2 border-t border-[color:color-mix(in_oklab,var(--border)_10%,transparent)] pt-4 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 group-data-[size=sm]/alert-dialog-content:[&>[data-slot=alert-dialog-action]]:w-full group-data-[size=sm]/alert-dialog-content:[&>[data-slot=alert-dialog-cancel]]:w-full sm:flex sm:justify-end sm:[&>[data-slot=alert-dialog-action]]:w-auto sm:[&>[data-slot=alert-dialog-cancel]]:w-auto",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-[color:color-mix(in_oklab,var(--border)_50%,transparent)] bg-[color:color-mix(in_oklab,var(--muted)_60%,transparent)] text-[color:var(--foreground)] shadow-xs group-has-[>[data-slot=alert-dialog-media]]/alert-dialog-header:row-span-2 *:[svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn(
        "popup-text-xs-plus leading-tight font-semibold tracking-tight group-has-[>[data-slot=alert-dialog-media]]/alert-dialog-header:col-start-2",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn(
        "popup-text-xs-plus leading-relaxed text-balance text-[color:var(--muted-foreground)] group-has-[>[data-slot=alert-dialog-media]]/alert-dialog-header:col-start-2 md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-[color:var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof Button>) {
  return <Button data-slot="alert-dialog-action" className={cn(className)} {...props} />;
}

function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<
    React.ComponentProps<typeof Button>,
    "loading" | "loadingHeight" | "loadingIndicatorClassName" | "loadingWidth" | "size" | "variant"
  >) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={cn(className)}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
