"use client";

import { useCallback } from "react";
import type { Ref } from "react";
import { cn } from "../../lib/utils";
import type { ScrollFadeSide, ScrollFadeViewportStyle } from "./scroll-fade-types";

export function useScrollFadeViewportAttachment({
  setViewportElement,
  viewportRef,
}: {
  setViewportElement: (node: HTMLDivElement | null) => void;
  viewportRef: Ref<HTMLDivElement> | undefined;
}): (node: HTMLDivElement | null) => void {
  return useCallback(
    (node: HTMLDivElement | null) => {
      setViewportElement(node);

      if (!viewportRef) {
        return;
      }

      if (typeof viewportRef === "function") {
        viewportRef(node);
        return;
      }

      viewportRef.current = node;
    },
    [setViewportElement, viewportRef],
  );
}

export function ScrollFadeViewport({
  attachViewport,
  className,
  isHorizontal,
  props,
  side,
  viewportStyle,
  viewportVisible,
  children,
}: {
  attachViewport: (node: HTMLDivElement | null) => void;
  children: React.ReactNode;
  className: string | undefined;
  isHorizontal: boolean;
  props: Omit<React.ComponentProps<"div">, "children" | "className" | "style" | "ref"> & {
    "data-slot"?: string;
  };
  side: ScrollFadeSide;
  viewportStyle: ScrollFadeViewportStyle;
  viewportVisible: boolean;
}): React.JSX.Element {
  const { "data-slot": dataSlot, ...viewportProps } = props;

  return (
    <div
      {...viewportProps}
      className={cn(
        isHorizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-x-hidden overflow-y-auto",
        "overscroll-contain",
        className,
      )}
      data-side={side}
      data-slot={dataSlot ?? "scroll-fade-viewport"}
      data-scroll-fade-viewport=""
      data-visible={viewportVisible ? "true" : "false"}
      ref={attachViewport}
      style={viewportStyle}
    >
      {children}
    </div>
  );
}
