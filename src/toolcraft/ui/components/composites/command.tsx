"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";

import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { MagnifyingGlassIcon, CheckIcon } from "@phosphor-icons/react";
import { ScrollFade } from "../primitives";

const commandWindowFrameClassName =
  "floating-popup-surface overflow-hidden rounded-3xl border popup-text-xs-plus text-[color:var(--popover-foreground)]";

const CommandWindowFrame = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => {
    return (
      <div
        data-slot="command-window-frame"
        ref={ref}
        className={cn(commandWindowFrameClassName, className)}
        {...props}
      />
    );
  },
);
CommandWindowFrame.displayName = "CommandWindowFrame";

function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "floating-popup-fill flex w-full min-h-0 flex-col overflow-hidden rounded-3xl text-[color:var(--popover-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string;
  description?: string;
  className?: string;
  showCloseButton?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          commandWindowFrameClassName,
          "top-1/3 translate-y-0 gap-0 rounded-3xl! p-0 ring-0",
          className,
        )}
        showCloseButton={showCloseButton}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> & {
    leadingVisual?: React.ReactNode;
  }
>(({ className, leadingVisual, ...props }, ref) => {
  return (
    <label
      data-slot="command-input-wrapper"
      className="flex w-full items-center gap-3 px-4 py-3 text-[color:var(--foreground)]"
    >
      <span
        data-slot="command-input-leading-visual"
        className="flex size-(--command-icon-size) shrink-0 items-center justify-center text-[color:var(--foreground)]"
      >
        {leadingVisual ?? <MagnifyingGlassIcon className="size-(--command-icon-size)" />}
      </span>
      <CommandPrimitive.Input
        className={cn(
          "w-full min-w-0 border-0 bg-transparent p-0 text-xs-plus leading-relaxed font-medium shadow-none outline-hidden placeholder:text-[color:var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        data-slot="command-input"
        ref={ref}
        {...props}
      />
    </label>
  );
});
CommandInput.displayName = CommandPrimitive.Input.displayName;

const CommandTextInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input"> & {
    leadingVisual?: React.ReactNode;
    typography?: "default" | "popup";
  }
>(({ className, leadingVisual, typography = "popup", ...props }, ref) => {
  return (
    <label
      data-slot="command-input-wrapper"
      className="flex w-full items-center gap-3 px-4 py-3 text-[color:var(--foreground)]"
    >
      <span
        data-slot="command-input-leading-visual"
        className="flex size-(--command-icon-size) shrink-0 items-center justify-center text-[color:var(--foreground)]"
      >
        {leadingVisual ?? <MagnifyingGlassIcon className="size-(--command-icon-size)" />}
      </span>
      <input
        aria-controls={props["aria-controls"] ?? "command-listbox"}
        aria-autocomplete="list"
        aria-expanded={props["aria-expanded"] ?? false}
        autoComplete="off"
        autoCorrect="off"
        className={cn(
          "w-full min-w-0 border-0 bg-transparent p-0 font-medium shadow-none outline-hidden placeholder:text-[color:var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50",
          typography === "default" ? "text-base/relaxed" : "popup-text-xs-plus leading-relaxed",
          className,
        )}
        data-slot="command-input"
        ref={ref}
        role="combobox"
        spellCheck={false}
        type="text"
        {...props}
      />
    </label>
  );
});
CommandTextInput.displayName = "CommandTextInput";

function CommandList({
  className,
  scrollFade = false,
  scrollFadeClassName,
  scrollFadeContainerClassName,
  scrollFadeWatch = [],
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List> & {
  scrollFade?: boolean;
  scrollFadeClassName?: string;
  scrollFadeContainerClassName?: string;
  scrollFadeWatch?: readonly unknown[];
}) {
  const commandList = (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 min-h-0 scroll-pt-1 overflow-x-hidden overflow-y-auto outline-none **:[[cmdk-list-sizer]]:min-w-full",
        scrollFade ? "max-h-none! overflow-visible!" : null,
        className,
      )}
      {...props}
    />
  );

  if (!scrollFade) {
    return commandList;
  }

  return (
    <ScrollFade
      className={cn("max-h-72 scroll-pt-1", scrollFadeClassName)}
      containerClassName={scrollFadeContainerClassName}
      intensity="medium"
      preset="large"
      showOppositeSide
      side="bottom"
      watch={scrollFadeWatch}
    >
      {commandList}
    </ScrollFade>
  );
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn(
        "py-6 text-center popup-text-xs-plus leading-normal tracking-tight text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1.5 text-[color:var(--foreground)] **:[[cmdk-group-heading]]:px-2.5 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("floating-popup-separator -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function CommandItem({
  active = false,
  className,
  children,
  tintIconsOnSelect = true,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item> & {
  active?: boolean;
  tintIconsOnSelect?: boolean;
}) {
  return (
    <CommandPrimitive.Item
      data-active={active ? "true" : "false"}
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex h-(--command-item-block-size) cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 popup-text-xs-plus leading-normal tracking-tight font-medium outline-hidden select-none in-data-[slot=dialog-content]:rounded-md data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-selected:bg-[color:color-mix(in_oklab,var(--foreground)_4%,transparent)] data-selected:text-[color:var(--foreground)] data-[active=true]:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] data-[active=true]:text-[color:var(--foreground)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--command-icon-size)",
        tintIconsOnSelect
          ? "data-selected:*:[svg]:text-[color:var(--foreground)] data-[active=true]:*:[svg]:text-[color:var(--foreground)]"
          : null,
        className,
      )}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-has-data-[slot=command-trailing-action]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  );
}

function CommandShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-[0.625rem] tracking-widest text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] group-data-selected/command-item:text-[color:color-mix(in_oklab,var(--foreground)_95%,transparent)] group-data-[active=true]/command-item:text-[color:var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandTextInput,
  CommandList,
  CommandWindowFrame,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
