import * as React from "react";

import { CaretLeftIcon, CaretRightIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { Button } from "../primitives";
import { cn } from "../../lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-0.5", className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & {
  size?: "default" | "icon";
} & React.ComponentProps<"a">;

function PaginationLink({
  children,
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      className={className}
      radius="md"
      size={size}
      variant={isActive ? "outline" : "ghost-muted"}
      render={(renderProps) => {
        const { children: renderedChildren, ...renderedAnchorProps } =
          renderProps as React.ComponentProps<"a">;

        return (
          <a
            {...renderedAnchorProps}
            {...props}
            aria-current={isActive ? "page" : undefined}
            data-active={isActive}
          >
            {renderedChildren}
          </a>
        );
      }}
    >
      {children}
    </Button>
  );
}

function PaginationPrevious({
  className,
  text = "Previous",
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string;
}) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      className={className}
      size="default"
      {...props}
    >
      <CaretLeftIcon data-icon="inline-start" />
      <span className="hidden sm:block">{text}</span>
    </PaginationLink>
  );
}

function PaginationNext({
  className,
  text = "Next",
  ...props
}: React.ComponentProps<typeof PaginationLink> & {
  text?: string;
}) {
  return (
    <PaginationLink aria-label="Go to next page" className={className} size="default" {...props}>
      <span className="hidden sm:block">{text}</span>
      <CaretRightIcon data-icon="inline-end" />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <Button
      aria-hidden
      className={cn("pointer-events-none", className)}
      radius="md"
      render={<span data-slot="pagination-ellipsis" {...props} />}
      size="icon"
      variant="ghost-muted"
    >
      <DotsThreeIcon />
      <span className="sr-only">More pages</span>
    </Button>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};
