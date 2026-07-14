"use client";

import * as React from "react";

import { ScrollFade } from "../primitives";
import { cn } from "../../lib/utils";

const panelDividerClassName =
  "border-t border-[color:color-mix(in_oklab,var(--border)_8%,transparent)]";
const panelContentScrollFadeHeight = 44;
const panelContentViewportClassName =
  "flex min-h-0 flex-col overflow-x-hidden overflow-y-auto overscroll-contain";

export const PanelSurface = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function PanelSurface({ children, className, ...props }, ref) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        "floating-popup-surface toolcraft-panel-surface isolate border text-[color:var(--popover-foreground)] supports-backdrop-filter:backdrop-blur-2xl supports-backdrop-filter:backdrop-saturate-150",
        className,
      )}
    >
      {children}
    </div>
  );
});

export const PanelContentSurface = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    scrollFadeMode?: "always" | "overflow";
    stickyFooterActive?: boolean;
    stickyFooterProgress?: number | null;
    stickyFooter?: React.ReactNode;
  }
>(function PanelContentSurface(
  {
    children,
    className,
    scrollFadeMode = "always",
    stickyFooter,
    stickyFooterActive = false,
    stickyFooterProgress = null,
    ...props
  },
  ref,
) {
  const [viewportElement, setViewportElement] =
    React.useState<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = React.useState(
    scrollFadeMode === "always",
  );
  const attachViewport = React.useCallback(
    (node: HTMLDivElement | null) => {
      setViewportElement(node);

      if (typeof ref === "function") {
        ref(node);
        return;
      }

      if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );
  const hasStickyFooter = React.Children.count(stickyFooter) > 0;

  React.useLayoutEffect(() => {
    if (scrollFadeMode !== "overflow") {
      setHasOverflow(true);
      return;
    }

    if (!viewportElement) {
      setHasOverflow(false);
      return;
    }

    const updateOverflow = () => {
      setHasOverflow(
        viewportElement.scrollHeight > viewportElement.clientHeight + 1,
      );
    };

    updateOverflow();
    window.addEventListener("resize", updateOverflow);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateOverflow);

    resizeObserver?.observe(viewportElement);

    const contentNode = viewportElement.firstElementChild;
    if (contentNode) {
      resizeObserver?.observe(contentNode);
    }

    return () => {
      window.removeEventListener("resize", updateOverflow);
      resizeObserver?.disconnect();
    };
  }, [scrollFadeMode, viewportElement]);

  if (scrollFadeMode === "overflow" && !hasOverflow) {
    const viewport = (
      <div
        {...props}
        className={cn(
          panelContentViewportClassName,
          hasStickyFooter ? "flex-1" : panelDividerClassName,
          className,
        )}
        ref={attachViewport}
      >
        {children}
      </div>
    );

    return hasStickyFooter ? (
      <PanelContentWithStickyFooter
        stickyFooter={stickyFooter}
        stickyFooterActive={stickyFooterActive}
        stickyFooterProgress={stickyFooterProgress}
      >
        {viewport}
      </PanelContentWithStickyFooter>
    ) : (
      viewport
    );
  }

  const viewport = (
    <ScrollFade
      {...props}
      className={cn("flex min-h-0 flex-col", hasStickyFooter && "flex-1", className)}
      containerClassName={cn(
        "flex min-h-0 flex-col",
        hasStickyFooter ? "flex-1" : panelDividerClassName,
      )}
      height={panelContentScrollFadeHeight}
      preset="default"
      showOppositeSide
      side="bottom"
      visibilityMode="terminal"
      viewportRef={attachViewport}
    >
      {children}
    </ScrollFade>
  );

  return hasStickyFooter ? (
    <PanelContentWithStickyFooter
      stickyFooter={stickyFooter}
      stickyFooterActive={stickyFooterActive}
      stickyFooterProgress={stickyFooterProgress}
    >
      {viewport}
    </PanelContentWithStickyFooter>
  ) : (
    viewport
  );
});

function PanelContentWithStickyFooter({
  children,
  stickyFooter,
  stickyFooterActive,
  stickyFooterProgress,
}: {
  children: React.ReactNode;
  stickyFooter: React.ReactNode;
  stickyFooterActive: boolean;
  stickyFooterProgress: number | null;
}): React.JSX.Element {
  const stickyFooterStyle =
    typeof stickyFooterProgress === "number"
      ? ({
          "--sticky-footer-progress": String(stickyFooterProgress),
        } as React.CSSProperties)
      : undefined;

  return (
    <div className={cn("flex min-h-0 flex-col", panelDividerClassName)}>
      {children}
      <div
        className="relative shrink-0 before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-px before:origin-left before:scale-x-[var(--sticky-footer-progress,1)] before:bg-[color:var(--accent)] before:opacity-0 before:transition-[opacity,transform] before:duration-200 before:ease-out before:content-[''] data-[sticky-footer-active=true]:before:opacity-100"
        data-sticky-footer-progress={
          typeof stickyFooterProgress === "number" ? stickyFooterProgress : undefined
        }
        data-sticky-footer-active={stickyFooterActive ? "true" : undefined}
        data-slot="toolcraft-panel-sticky-actions"
        style={stickyFooterStyle}
      >
        {stickyFooter}
      </div>
    </div>
  );
}
