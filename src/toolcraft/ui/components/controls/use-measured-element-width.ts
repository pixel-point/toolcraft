"use client";

import * as React from "react";

function getMeasuredWidth(element: HTMLElement): number | undefined {
  const width = Math.round(element.getBoundingClientRect().width);

  return width > 0 ? width : undefined;
}

export function useMeasuredElementWidth(
  ref: React.RefObject<HTMLElement | null>,
): number | undefined {
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const updateWidth = () => {
      setWidth(getMeasuredWidth(element));
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return width;
}
