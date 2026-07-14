import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react";
import { cva } from "class-variance-authority";
import { outlineControlSurfaceClassName } from "../../lib/control-outline";
import { cn } from "../../lib/utils";
import { Button } from "../primitives";
import { PrimitiveArrowIcon } from "../primitives";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../primitives";
import { ScrollFade } from "../primitives";
import { XIcon, CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
const Combobox = ComboboxPrimitive.Root;
type ComboboxFieldSize = "sm" | "default" | "lg" | "xl";
const comboboxHoverBorderClassName =
  "[&:not(:focus-within):hover]:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)]";
const comboboxButtonNoHoverBackgroundClassName =
  "hover:bg-transparent active:bg-transparent data-pressed:bg-transparent";
const comboboxActiveInputBorderClassName = [
  comboboxHoverBorderClassName,
  "has-[[data-slot=input-group-button][aria-expanded=true]]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "has-[[data-slot=input-group-button][data-state=open]]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "has-[[data-slot=input-group-button][data-popup-open]]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "has-[[data-slot=input-group-button][data-open]]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "has-[[data-slot=combobox-trigger][aria-expanded=true]]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "has-[[data-slot=combobox-trigger][data-state=open]]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "has-[[data-slot=combobox-trigger][data-popup-open]]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
  "has-[[data-slot=combobox-trigger][data-open]]:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)]",
].join(" ");
const comboboxPopupSurfaceBaseClassName =
  "floating-popup-surface group/combobox-content relative overflow-hidden rounded-lg border p-1 popup-text-xs-plus text-[color:var(--popover-foreground)] [&>[data-slot=combobox-search]]:-mx-1 [&>[data-slot=combobox-search]]:-mt-1 [&>[data-slot=combobox-search]]:mb-0 [&>[data-slot=combobox-search]]:border-b [&>[data-slot=combobox-search]]:border-[color:color-mix(in_oklab,var(--border)_5%,transparent)] [&>[data-slot=combobox-search]]:pr-1 [&>[data-slot=combobox-search]]:pl-0 [&>[data-slot=combobox-search]]:pt-1 [&>[data-slot=combobox-search]]:pb-1 [&>[data-slot=combobox-search]>[data-slot=input-group]]:m-0 [&>[data-slot=combobox-search]>[data-slot=input-group]]:rounded-none [&>[data-slot=combobox-search]>[data-slot=input-group]]:border-none [&>[data-slot=combobox-search]>[data-slot=input-group]]:bg-transparent [&>[data-slot=combobox-search]>[data-slot=input-group]]:shadow-none";
const comboboxPopupSurfaceClassName = cn(
  comboboxPopupSurfaceBaseClassName,
  "max-h-(--available-height) w-[min(var(--anchor-width),calc(var(--spacing)*64))] max-w-[min(var(--available-width),calc(var(--spacing)*64))] min-w-[min(calc(var(--anchor-width)+calc(var(--spacing)*7)),calc(var(--spacing)*64))] origin-(--transform-origin) duration-100 data-[chips=true]:min-w-[min(var(--anchor-width),calc(var(--spacing)*64))] data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
);
const ComboboxChipsSizeContext =
  React.createContext<ComboboxFieldSize>("default");
const useComboboxChipsSize = (): ComboboxFieldSize =>
  React.useContext(ComboboxChipsSizeContext);
const getComboboxInputButtonSize = (
  size: ComboboxFieldSize,
): "icon-xxs" | "icon-xs" =>
  size === "sm" || size === "default" ? "icon-xxs" : "icon-xs";
const getComboboxPopupTypographyClassName = (
  size: ComboboxFieldSize,
): string =>
  size === "default"
    ? "text-[13px] leading-[1.125rem]"
    : size === "lg" || size === "xl"
      ? "text-sm/relaxed"
      : "text-xs/relaxed";

const ComboboxValue = (props: ComboboxPrimitive.Value.Props) => (
  <ComboboxPrimitive.Value data-slot="combobox-value" {...props} />
);

function ComboboxTrigger({
  className,
  children,
  size = "default",
  ...props
}: ComboboxPrimitive.Trigger.Props & {
  size?: ComboboxFieldSize;
}) {
  const isLargeFieldSize = size === "lg" || size === "xl";

  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      className={cn(
        "group/combobox-trigger cursor-pointer",
        isLargeFieldSize ? "[&_svg:not([class*='size-'])]:size-4" : undefined,
        className,
      )}
      {...props}
    >
      {children}
      <PrimitiveArrowIcon
        data-slot="combobox-trigger-caret"
        openClassName="group-aria-expanded/button:rotate-180 group-data-popup-open/button:rotate-180 group-data-open/button:rotate-180 group-aria-expanded/combobox-trigger:rotate-180 group-data-popup-open/combobox-trigger:rotate-180 group-data-open/combobox-trigger:rotate-180"
      />
    </ComboboxPrimitive.Trigger>
  );
}

function ComboboxClear({
  className,
  size = "default",
  ...props
}: ComboboxPrimitive.Clear.Props & {
  size?: ComboboxFieldSize;
}) {
  const buttonSize = getComboboxInputButtonSize(size);

  return (
    <ComboboxPrimitive.Clear
      data-slot="combobox-clear"
      render={
        <Button
          data-slot="input-group-button"
          className={cn(
            "shadow-none",
            comboboxButtonNoHoverBackgroundClassName,
          )}
          size={buttonSize}
          variant="ghost-static"
        />
      }
      className={cn(className)}
      {...props}
    >
      <XIcon className="pointer-events-none" />
    </ComboboxPrimitive.Clear>
  );
}

function ComboboxInput({
  className,
  children,
  disabled = false,
  size = "default",
  showTrigger = true,
  showClear = false,
  ...props
}: Omit<ComboboxPrimitive.Input.Props, "size"> & {
  size?: ComboboxFieldSize;
  showTrigger?: boolean;
  showClear?: boolean;
}) {
  const shouldRenderTrigger = showTrigger && !showClear;
  const isPopupSearch = !showTrigger && !showClear;
  const isLargeFieldSize = size === "lg" || size === "xl";
  const buttonSize = getComboboxInputButtonSize(size);
  const typographyClassName = getComboboxPopupTypographyClassName(size);
  const inputGroup = (
    <InputGroup
      className={cn("w-full", comboboxActiveInputBorderClassName, className)}
      focusStyle={isPopupSearch ? "none" : undefined}
      size={size}
      surfaceStyle={isPopupSearch ? "transparent" : undefined}
    >
      {isPopupSearch && (
        <InputGroupAddon align="inline-start">
          <MagnifyingGlassIcon
            className={cn(isLargeFieldSize ? "size-4" : "size-3.5")}
          />
        </InputGroupAddon>
      )}
      <ComboboxPrimitive.Input
        render={
          <InputGroupInput
            className={cn("leading-normal tracking-tight", typographyClassName)}
            disabled={disabled}
            typographyStyle={isPopupSearch ? "popup" : undefined}
          />
        }
        {...props}
      />
      <InputGroupAddon align="inline-end">
        {shouldRenderTrigger && (
          <Button
            data-slot="input-group-button"
            variant="ghost-static"
            render={<ComboboxTrigger size={size} />}
            size={buttonSize}
            className={cn(
              "group-has-data-[slot=combobox-clear]/input-group:hidden",
              comboboxButtonNoHoverBackgroundClassName,
            )}
            disabled={disabled}
          />
        )}
        {showClear && <ComboboxClear disabled={disabled} size={size} />}
      </InputGroupAddon>
      {children}
    </InputGroup>
  );

  if (isPopupSearch) {
    return <div data-slot="combobox-search">{inputGroup}</div>;
  }

  return inputGroup;
}

function ComboboxContent({
  className,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  anchor,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<
    ComboboxPrimitive.Positioner.Props,
    "side" | "align" | "sideOffset" | "alignOffset" | "anchor"
  >) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        anchor={anchor}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          data-chips={!!anchor}
          className={cn(comboboxPopupSurfaceClassName, className)}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  );
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      render={(listProps) => {
        const {
          children,
          className: renderedClassName,
          ...renderedListProps
        } = listProps as React.ComponentProps<"div">;

        return (
          <div {...renderedListProps} className="min-h-0 w-full">
            <ScrollFade
              className={cn(
                "no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] w-full scroll-py-1 overscroll-contain",
                renderedClassName,
                className,
              )}
              containerClassName="min-h-0 w-full"
              preset="compact"
              side="bottom"
            >
              {children}
            </ScrollFade>
          </div>
        );
      }}
      {...props}
    />
  );
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  const itemContent =
    typeof children === "string" || typeof children === "number" ? (
      <ScrollFade
        className="no-scrollbar min-w-0"
        containerClassName="min-w-0 flex-1"
        preset="compact"
        side="right"
        watch={[children]}
      >
        <span className="inline-block whitespace-nowrap pr-2">{children}</span>
      </ScrollFade>
    ) : (
      children
    );

  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        "relative flex min-h-7 w-full min-w-0 cursor-pointer items-center gap-2 rounded-md py-1.5 pr-8 pl-2 popup-text-xs-plus leading-normal tracking-tight font-medium outline-hidden select-none data-highlighted:bg-[color:color-mix(in_oklab,var(--foreground)_5%,transparent)] data-highlighted:text-[color:var(--accent-foreground)] not-data-[variant=destructive]:data-highlighted:**:text-[color:var(--accent-foreground)] data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className,
      )}
      {...props}
    >
      {itemContent}
      <ComboboxPrimitive.ItemIndicator
        render={
          <span className="pointer-events-none absolute right-2 flex items-center justify-center" />
        }
      >
        <CheckIcon className="pointer-events-none" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  );
}

const ComboboxGroup = ({
  className,
  ...props
}: ComboboxPrimitive.Group.Props) => (
  <ComboboxPrimitive.Group
    data-slot="combobox-group"
    className={cn(className)}
    {...props}
  />
);

function ComboboxLabel({
  className,
  ...props
}: ComboboxPrimitive.GroupLabel.Props) {
  return (
    <ComboboxPrimitive.GroupLabel
      data-slot="combobox-label"
      className={cn(
        "px-2 py-1.5 popup-text-xs-plus text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}

const ComboboxCollection = (props: ComboboxPrimitive.Collection.Props) => (
  <ComboboxPrimitive.Collection data-slot="combobox-collection" {...props} />
);

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      data-slot="combobox-empty"
      className={cn(
        "hidden w-full justify-center py-2 text-center popup-text-xs-plus leading-normal tracking-tight text-[color:color-mix(in_oklab,var(--foreground)_60%,transparent)] group-data-empty/combobox-content:flex",
        className,
      )}
      {...props}
    />
  );
}

function ComboboxSeparator({
  className,
  ...props
}: ComboboxPrimitive.Separator.Props) {
  return (
    <ComboboxPrimitive.Separator
      data-slot="combobox-separator"
      className={cn("floating-popup-separator -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function ComboboxChips({
  className,
  size = "default",
  ...props
}: Omit<React.ComponentPropsWithRef<typeof ComboboxPrimitive.Chips>, "size"> & {
  size?: ComboboxFieldSize;
}) {
  return (
    <ComboboxChipsSizeContext.Provider value={size}>
      <ComboboxPrimitive.Chips
        data-size={size}
        data-slot="combobox-chips"
        className={cn(comboboxChipsVariants({ size }), className)}
        {...props}
      />
    </ComboboxChipsSizeContext.Provider>
  );
}

const comboboxChipsVariants = cva(
  cn(
    "flex flex-wrap items-center gap-1 rounded-md border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] transition-colors focus-within:border-[color:color-mix(in_oklab,var(--border)_30%,transparent)] has-aria-invalid:border-[color:var(--destructive)] dark:has-aria-invalid:border-[color:color-mix(in_oklab,var(--destructive)_50%,transparent)]",
    comboboxHoverBorderClassName,
    outlineControlSurfaceClassName,
  ),
  {
    variants: {
      size: {
        sm: "min-h-6 pl-2 pr-0 text-xs/relaxed has-data-[slot=combobox-chip]:px-1",
        default:
          "min-h-7 py-0.5 pl-2 pr-0 text-[13px] leading-[1.125rem] has-data-[slot=combobox-chip]:px-1",
        lg: "min-h-8 gap-1.5 py-1 pl-2.5 pr-0 text-sm/relaxed has-data-[slot=combobox-chip]:px-1",
        xl: "min-h-10 gap-2 py-1 pl-1 pr-0 text-sm/relaxed",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

function ComboboxChip({
  className,
  children,
  showRemove = true,
  ...props
}: ComboboxPrimitive.Chip.Props & {
  showRemove?: boolean;
}) {
  const size = useComboboxChipsSize();
  const removeButtonSize =
    size === "xl"
      ? "icon-lg"
      : size === "lg"
        ? "icon-sm"
        : size === "sm"
          ? "icon-xxs"
          : "icon-xs";

  return (
    <ComboboxPrimitive.Chip
      data-slot="combobox-chip"
      className={cn(comboboxChipVariants({ size }), className)}
      {...props}
    >
      {children}
      {showRemove && (
        <ComboboxPrimitive.ChipRemove
          render={
            <Button
              className={comboboxButtonNoHoverBackgroundClassName}
              size={removeButtonSize}
              variant="ghost-static"
            />
          }
          className="-ml-1 opacity-50 hover:opacity-100"
          data-slot="combobox-chip-remove"
        >
          <XIcon className="pointer-events-none" />
        </ComboboxPrimitive.ChipRemove>
      )}
    </ComboboxPrimitive.Chip>
  );
}

const comboboxChipVariants = cva(
  "flex w-fit items-center justify-center gap-1 rounded-[calc(var(--radius-md)-2px)] bg-[color:color-mix(in_oklab,var(--muted-foreground)_10%,transparent)] font-medium whitespace-nowrap text-[color:var(--foreground)] has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
  {
    variants: {
      size: {
        sm: "-ml-px h-4 px-1.5 text-xs/relaxed",
        default: "h-5 px-1.5 text-[13px] leading-[1.125rem]",
        lg: "h-6 px-2 text-sm/relaxed",
        xl: "h-8 px-2.5 text-sm/relaxed",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

const ComboboxChipsInput = ({
  className,
  ...props
}: ComboboxPrimitive.Input.Props) => (
  <ComboboxPrimitive.Input
    data-slot="combobox-chip-input"
    className={cn("min-w-16 flex-1 outline-none", className)}
    {...props}
  />
);

const useComboboxAnchor = () => React.useRef<HTMLDivElement | null>(null);

export {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxGroup,
  ComboboxLabel,
  ComboboxCollection,
  ComboboxEmpty,
  ComboboxSeparator,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxTrigger,
  ComboboxValue,
  comboboxPopupSurfaceClassName,
  useComboboxAnchor,
};
