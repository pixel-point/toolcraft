import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "../../lib/utils";
import { PrimitiveArrowIcon } from "../primitives";
import { CheckIcon } from "@phosphor-icons/react";

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: MenuPrimitive.Portal.Props): React.JSX.Element {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({
  className,
  ...props
}: MenuPrimitive.Trigger.Props) {
  return (
    <MenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      className={cn(
        "[&:not(:focus):not([aria-expanded=true]):not([data-open]):not([data-popup-open]):not([data-state=open]):hover]:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<
    MenuPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "floating-popup-surface z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto whitespace-nowrap rounded-lg border p-1 popup-text-xs-plus text-[color:var(--popover-foreground)] duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: MenuPrimitive.GroupLabel.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 popup-text-xs-plus text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] data-inset:pl-7.5",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item relative flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 popup-text-xs-plus leading-normal tracking-tight font-medium outline-hidden select-none hover:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:text-[color:var(--accent-foreground)] not-data-[variant=destructive]:focus:**:text-[color:var(--accent-foreground)] data-inset:pl-7.5 data-[variant=destructive]:text-[color:var(--destructive)] data-[variant=destructive]:hover:bg-[color:color-mix(in_oklab,var(--destructive)_10%,transparent)] data-[variant=destructive]:focus:bg-[color:color-mix(in_oklab,var(--destructive)_10%,transparent)] data-[variant=destructive]:focus:text-[color:var(--destructive)] data-[variant=destructive]:[&_[data-slot=dropdown-menu-shortcut]]:text-[color:var(--destructive)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5 data-[variant=destructive]:*:[svg]:text-[color:var(--destructive)]",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: MenuPrimitive.SubmenuTrigger.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-2 py-1 popup-text-xs-plus leading-normal tracking-tight font-medium outline-hidden select-none hover:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:text-[color:var(--accent-foreground)] not-data-[variant=destructive]:focus:**:text-[color:var(--accent-foreground)] data-inset:pl-7.5 data-popup-open:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] data-popup-open:text-[color:var(--accent-foreground)] data-open:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] data-open:text-[color:var(--accent-foreground)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      {children}
      <PrimitiveArrowIcon className="ml-auto" direction="right" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -3,
  side = "right",
  sideOffset = 0,
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn("w-auto min-w-32", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}: MenuPrimitive.CheckboxItem.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(
        "relative flex min-h-7 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-8 pl-2 popup-text-xs-plus leading-normal tracking-tight font-medium outline-hidden select-none hover:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:text-[color:var(--accent-foreground)] focus:**:text-[color:var(--accent-foreground)] data-inset:pl-7.5 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  inset,
  ...props
}: MenuPrimitive.RadioItem.Props & {
  inset?: boolean;
}) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(
        "relative flex min-h-7 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-8 pl-2 popup-text-xs-plus leading-normal tracking-tight font-medium outline-hidden select-none hover:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] focus:text-[color:var(--accent-foreground)] focus:**:text-[color:var(--accent-foreground)] data-inset:pl-7.5 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("floating-popup-separator -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-[0.625rem] tracking-widest text-[color:var(--muted-foreground)] group-focus/dropdown-menu-item:text-[color:var(--accent-foreground)]",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSubText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-subtext"
      className={cn(
        "text-xs font-normal !text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSubText,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
