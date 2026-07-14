"use client";

import * as React from "react";

import { Button, Tooltip, TooltipContent, TooltipTrigger } from "../primitives";
import { cn } from "../../lib/utils";

export type PanelIconButtonProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick?: () => void;
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>;
  spinOnClick?: boolean;
  tooltipSide?: "top" | "right" | "bottom" | "left";
};

export const stopPanelHeaderButtonPointerDown: React.PointerEventHandler<
  HTMLButtonElement
> = (event) => {
  event.stopPropagation();
};

export function PanelIconButton({
  children,
  className,
  disabled,
  label,
  onClick,
  onPointerDown,
  spinOnClick = false,
  tooltipSide = "top",
}: PanelIconButtonProps): React.JSX.Element {
  const iconRef = React.useRef<HTMLSpanElement>(null);

  function animateIconPress(): void {
    const icon = iconRef.current;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!spinOnClick || !icon || prefersReducedMotion) {
      return;
    }

    for (const animation of icon.getAnimations()) {
      animation.cancel();
    }

    icon.animate(
      [{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }],
      {
        duration: 420,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    );
  }

  function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
    animateIconPress();
    onClick?.();

    if (typeof event.currentTarget.blur === "function") {
      event.currentTarget.blur();
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={label}
            className={cn(
              "data-[icon-active=true]:text-[color:var(--foreground)]",
              className,
            )}
            data-icon-active={false}
            disabled={disabled}
            onClick={handleClick}
            onPointerDown={onPointerDown}
            size="icon"
            type="button"
            variant="ghost"
          />
        }
      >
        <span ref={iconRef} className="inline-flex origin-center">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
