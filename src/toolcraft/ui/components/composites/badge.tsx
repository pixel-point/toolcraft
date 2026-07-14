import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "group/badge inline-flex h-[18px] w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap transition-all focus-visible:border-[color:var(--ring)] focus-visible:ring-[3px] focus-visible:ring-[color:color-mix(in_oklab,var(--ring)_50%,transparent)] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-[color:var(--destructive)] aria-invalid:ring-[color:color-mix(in_oklab,var(--destructive)_20%,transparent)] dark:aria-invalid:ring-[color:color-mix(in_oklab,var(--destructive)_40%,transparent)] [&>svg]:pointer-events-none [&>svg]:size-2.5!",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] [a]:hover:bg-[color:color-mix(in_oklab,var(--primary)_80%,transparent)]",
        secondary:
          "border-[color:color-mix(in_oklab,var(--border)_10%,transparent)] bg-[color:color-mix(in_oklab,var(--secondary)_12%,transparent)] text-[color:var(--secondary-foreground)] [a]:hover:bg-[color:color-mix(in_oklab,var(--secondary)_20%,transparent)]",
        warning:
          "border-[color:color-mix(in_oklab,var(--attention)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--attention)_15%,transparent)] text-[color:var(--attention)] [a]:hover:border-[color:color-mix(in_oklab,var(--attention)_60%,transparent)] [a]:hover:bg-[color:color-mix(in_oklab,var(--attention)_25%,transparent)] [a]:hover:text-[color:var(--attention)]",
        destructive:
          "border-[color:color-mix(in_oklab,var(--destructive)_30%,transparent)] bg-[color:color-mix(in_oklab,var(--destructive)_15%,transparent)] text-[color:var(--destructive)] focus-visible:border-[color:var(--destructive)] focus-visible:ring-[color:color-mix(in_oklab,var(--destructive)_20%,transparent)] dark:focus-visible:ring-[color:color-mix(in_oklab,var(--destructive)_40%,transparent)] [a]:hover:border-[color:color-mix(in_oklab,var(--destructive)_60%,transparent)] [a]:hover:bg-[color:color-mix(in_oklab,var(--destructive)_25%,transparent)] [a]:hover:text-[color:var(--destructive)]",
        outline:
          "border-[color:color-mix(in_oklab,var(--border)_12%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] text-[color:var(--foreground)] [a]:hover:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] [a]:hover:bg-[color:color-mix(in_oklab,var(--input)_15%,transparent)] [a]:hover:text-[color:var(--foreground)]",
        emphasisOutline:
          "border-[color:color-mix(in_oklab,var(--border)_10%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] text-[color:color-mix(in_oklab,var(--foreground)_80%,transparent)] [a]:hover:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] [a]:hover:bg-[color:color-mix(in_oklab,var(--input)_15%,transparent)] [a]:hover:text-[color:color-mix(in_oklab,var(--foreground)_80%,transparent)]",
        mutedOutline:
          "border-[color:color-mix(in_oklab,var(--border)_10%,transparent)] bg-[color:color-mix(in_oklab,var(--input)_10%,transparent)] text-[color:color-mix(in_oklab,var(--foreground)_40%,transparent)] [a]:hover:!border-[color:color-mix(in_oklab,var(--border)_20%,transparent)] [a]:hover:bg-[color:color-mix(in_oklab,var(--input)_15%,transparent)] [a]:hover:text-[color:color-mix(in_oklab,var(--foreground)_40%,transparent)]",
        ghost:
          "hover:bg-[color:var(--muted)] hover:text-[color:var(--muted-foreground)] dark:hover:bg-[color:color-mix(in_oklab,var(--muted)_50%,transparent)]",
        link: "text-[color:var(--primary)] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  children,
  className,
  shimmer = false,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    shimmer?: boolean;
  }) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
        children: shimmer ? (
          <span className="chat-thinking-shimmer-text">{children}</span>
        ) : (
          children
        ),
      },
      props,
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  });
}

export { Badge, badgeVariants };
