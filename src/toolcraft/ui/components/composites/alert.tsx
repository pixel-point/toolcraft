import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] px-2 py-1.5 text-left text-xs/relaxed has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-1.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-[color:var(--card)] text-[color:var(--card-foreground)]",
        destructive:
          "border-[color:color-mix(in_oklab,var(--destructive)_40%,transparent)] bg-[color:color-mix(in_oklab,var(--destructive)_10%,transparent)] text-[color:var(--foreground)] [&>svg]:text-[color:var(--destructive)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      data-variant={variant ?? undefined}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-medium group-has-[>svg]/alert:col-start-2 group-data-[variant=destructive]/alert:text-[color:var(--destructive)] [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-[color:var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-xs/relaxed text-balance text-[color:var(--muted-foreground)] group-data-[variant=destructive]/alert:text-[color:color-mix(in_oklab,var(--destructive)_90%,transparent)] md:text-pretty [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-[color:var(--foreground)] [&_p:not(:last-child)]:mb-4",
        className,
      )}
      {...props}
    />
  );
}

function AlertAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-action"
      className={cn("absolute top-1.5 right-2", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription, AlertAction };
