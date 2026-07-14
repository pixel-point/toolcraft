"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "../../lib/utils";

function Switch({
  className,
  checkedThumbSide = "end",
  size = "default",
  ...props
}: SwitchPrimitive.Root.Props & {
  checkedThumbSide?: "start" | "end";
  size?: "xs" | "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-checked-thumb-side={checkedThumbSide}
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 cursor-pointer items-center rounded-full p-px transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 aria-invalid:ring aria-invalid:ring-[color:color-mix(in_oklab,var(--destructive)_20%,transparent)] data-[size=default]:h-4 data-[size=default]:w-[28px] data-[size=sm]:h-3.5 data-[size=sm]:w-[24px] data-[size=xs]:h-3 data-[size=xs]:w-5 dark:aria-invalid:ring-[color:color-mix(in_oklab,var(--destructive)_40%,transparent)] data-checked:bg-[color:var(--accent)] data-unchecked:bg-[color:color-mix(in_oklab,var(--input)_20%,transparent)] data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-[color:var(--background)] ring-0 transition-transform group-data-[size=default]/switch:size-3.5 group-data-[size=sm]/switch:size-3 group-data-[size=xs]/switch:size-2.5 group-data-[checked-thumb-side=end]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[checked-thumb-side=end]/switch:data-unchecked:translate-x-0 group-data-[checked-thumb-side=start]/switch:data-checked:translate-x-0 group-data-[checked-thumb-side=start]/switch:data-unchecked:translate-x-[calc(100%-2px)] dark:bg-[color:var(--foreground)]"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
