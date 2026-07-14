"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

import { Button } from "../primitives";
import {
  PortalLayerContainerProvider,
  type PortalLayerContainer,
  usePortalLayerContainer,
} from "../primitives";
import { ScrollFade } from "../primitives";
import { cn } from "../../lib/utils";
import { XIcon } from "@phosphor-icons/react";

const DIALOG_SECTION_BORDER_COLOR = "color-mix(in oklab, var(--border) 5%, transparent)";

const DialogLayoutContext = React.createContext<{
  sectioned: boolean;
  showCloseButton: boolean;
}>({
  sectioned: false,
  showCloseButton: false,
});

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  children,
  container,
  ...props
}: DialogPrimitive.Portal.Props): React.JSX.Element {
  const resolvedContainer = usePortalLayerContainer(container);
  const portalNodeRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <DialogPrimitive.Portal
      data-slot="dialog-portal"
      container={resolvedContainer}
      ref={portalNodeRef}
      {...props}
    >
      <PortalLayerContainerProvider container={portalNodeRef}>
        {children}
      </PortalLayerContainerProvider>
    </DialogPrimitive.Portal>
  );
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/72 duration-100 supports-backdrop-filter:backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogCloseButton({
  className,
}: {
  className?: string;
} = {}): React.JSX.Element {
  return (
    <DialogPrimitive.Close
      data-slot="dialog-close"
      render={
        <Button
          className={cn("absolute top-3 right-3", className)}
          size="icon-sm"
          type="button"
          variant="ghost"
        />
      }
    >
      <XIcon />
      <span className="sr-only">Close</span>
    </DialogPrimitive.Close>
  );
}

function DialogContent({
  className,
  children,
  layout = "default",
  portalContainer,
  size = "default",
  showCloseButton = true,
  style,
  ...props
}: DialogPrimitive.Popup.Props & {
  layout?: "default" | "sections";
  portalContainer?: PortalLayerContainer;
  size?: "default" | "xl" | "2xl";
  showCloseButton?: boolean;
}) {
  const sectioned = layout === "sections";
  const resolvedStyle =
    size === "xl"
      ? {
          ...style,
          width: "min(var(--container-xl), calc(100% - 2rem))",
        }
      : size === "2xl"
        ? {
            ...style,
            width: "min(calc(var(--container-xl) + 4rem), calc(100% - 2rem))",
          }
        : style;

  return (
    <DialogPortal container={portalContainer}>
      <DialogOverlay />
      <DialogLayoutContext.Provider value={{ sectioned, showCloseButton }}>
        <DialogPrimitive.Popup
          data-slot="dialog-content"
          className={cn(
            "floating-popup-surface fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-2xl border p-4 popup-text-xs-plus text-[color:var(--popover-foreground)] duration-100 outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            size === "default" && "sm:max-w-sm",
            size === "xl" && "sm:max-w-xl",
            sectioned && "gap-0 p-0",
            className,
          )}
          style={resolvedStyle}
          {...props}
        >
          {children}
          {showCloseButton ? (
            <DialogCloseButton className={sectioned ? "top-3 right-3" : undefined} />
          ) : null}
        </DialogPrimitive.Popup>
      </DialogLayoutContext.Provider>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { sectioned, showCloseButton } = React.useContext(DialogLayoutContext);

  return (
    <div
      data-slot="dialog-header"
      className={cn(
        "flex flex-col gap-1.5 text-left",
        sectioned && "px-4 pt-4",
        showCloseButton && "pr-12",
        className,
      )}
      {...props}
    />
  );
}

function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  const { sectioned } = React.useContext(DialogLayoutContext);

  return (
    <div
      data-slot="dialog-body"
      className={cn("flex flex-col gap-4", sectioned && "px-4 pt-3 pb-6", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  justify = "end",
  children,
  ...props
}: React.ComponentProps<"div"> & {
  justify?: "between" | "end" | "start";
  showCloseButton?: boolean;
}) {
  const { sectioned } = React.useContext(DialogLayoutContext);

  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        justify === "start" && "sm:justify-start",
        justify === "between" && "sm:justify-between",
        sectioned && "border-t px-4 py-4",
        className,
      )}
      style={sectioned ? { borderColor: DIALOG_SECTION_BORDER_COLOR } : undefined}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button type="button" variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  );
}

function getDialogTitleText(children: React.ReactNode): string | null {
  const childNodes = React.Children.toArray(children);
  if (childNodes.length === 0) {
    return null;
  }

  if (childNodes.some((child) => typeof child !== "string" && typeof child !== "number")) {
    return null;
  }

  const text = childNodes.join("");
  return text.length > 0 ? text : null;
}

function DialogTitle({ children, className, title, ...props }: DialogPrimitive.Title.Props) {
  const textContent = getDialogTitleText(children);
  const resolvedTitle = title ?? textContent ?? undefined;

  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("min-w-0 text-sm leading-tight font-semibold tracking-tight", className)}
      title={resolvedTitle}
      {...props}
    >
      {textContent ? (
        <ScrollFade
          className="no-scrollbar min-w-0"
          containerClassName="min-w-0"
          preset="compact"
          side="right"
          watch={[textContent]}
        >
          <span className="block min-w-max whitespace-nowrap">{textContent}</span>
        </ScrollFade>
      ) : (
        children
      )}
    </DialogPrimitive.Title>
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "popup-text-xs-plus leading-relaxed text-balance text-[color:var(--muted-foreground)] md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-[color:var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
