import * as React from "react";
import { type Button as BaseButtonPrimitive } from "@base-ui/react/button";

import {
  AnimatedLoader,
  DEFAULT_ANIMATED_LOADER_HEIGHT,
  type LoaderSize,
} from "../animated-loader";

export const DEFAULT_BUTTON_LOADING_WIDTH = 96;
export const DEFAULT_BUTTON_LOADING_EDGE_INSET = 16;
export const COMPACT_BUTTON_LOADING_EDGE_INSET = 4;
export const COMPACT_BUTTON_LOADING_HEIGHT = DEFAULT_ANIMATED_LOADER_HEIGHT - 2;

type UseButtonLoadingStateOptions<TElement extends HTMLElement> = {
  ariaLabel?: string;
  children: React.ReactNode;
  className?: unknown;
  compactHeight?: boolean;
  disabled?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  loadingHeight?: LoaderSize;
  loadingIndicatorClassName?: string;
  loadingWidth?: LoaderSize;
  measurementKey?: string;
  ref?: React.Ref<TElement>;
  style?: ButtonStyle;
};

type ButtonStyle =
  | React.CSSProperties
  | ((state: BaseButtonPrimitive.State) => React.CSSProperties | undefined);

function extractButtonTextContent(children: React.ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => extractButtonTextContent(child)).join("");
  }

  if (React.isValidElement<{ children?: React.ReactNode }>(children)) {
    return extractButtonTextContent(children.props.children);
  }

  return "";
}

function assignButtonRef<T>(ref: React.Ref<T> | undefined, value: T): void {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref && typeof ref === "object") {
    ref.current = value;
  }
}

function withButtonInlineSize(style: ButtonStyle | undefined, inlineSize: number): ButtonStyle {
  const inlineSizeStyle = {
    maxWidth: `${inlineSize}px`,
    minWidth: `${inlineSize}px`,
    width: `${inlineSize}px`,
  };

  if (typeof style === "function") {
    return (state) => ({
      ...style(state),
      ...inlineSizeStyle,
    });
  }

  return {
    ...style,
    ...inlineSizeStyle,
  };
}

export function useButtonLoadingState<TElement extends HTMLElement>({
  ariaLabel,
  children,
  className,
  compactHeight = false,
  disabled,
  iconOnly = false,
  loading = false,
  loadingHeight,
  loadingIndicatorClassName,
  loadingWidth,
  measurementKey,
  ref,
  style,
}: UseButtonLoadingStateOptions<TElement>): {
  buttonAriaBusy: true | undefined;
  buttonAriaLabel: string | undefined;
  buttonClassName: string | undefined;
  buttonContent: React.ReactNode;
  buttonDisabled: boolean;
  buttonLoader: React.ReactNode;
  buttonRef: (node: TElement | null) => void;
  buttonStyle: ButtonStyle | undefined;
  dataLoading: "true" | undefined;
} {
  const buttonElementRef = React.useRef<TElement | null>(null);
  const stableInlineSizeRef = React.useRef<number | null>(null);
  const loadingInsetX = iconOnly
    ? COMPACT_BUTTON_LOADING_EDGE_INSET
    : DEFAULT_BUTTON_LOADING_EDGE_INSET;
  const resolvedLoadingHeight =
    loadingHeight ??
    (compactHeight ? COMPACT_BUTTON_LOADING_HEIGHT : DEFAULT_ANIMATED_LOADER_HEIGHT);
  const resolvedLoadingAriaLabel =
    (ariaLabel ?? extractButtonTextContent(children).trim()) || undefined;
  const buttonRef = React.useCallback(
    (node: TElement | null) => {
      buttonElementRef.current = node;
      assignButtonRef(ref, node);
    },
    [ref],
  );

  React.useLayoutEffect(() => {
    if (loading) {
      return;
    }

    const buttonElement = buttonElementRef.current;
    if (!buttonElement) {
      return;
    }

    const measuredInlineSize = buttonElement.getBoundingClientRect().width;
    if (measuredInlineSize > 0) {
      stableInlineSizeRef.current = measuredInlineSize;
    }
  }, [children, className, loading, measurementKey, style]);

  return {
    buttonAriaBusy: loading || undefined,
    buttonAriaLabel: loading ? resolvedLoadingAriaLabel : ariaLabel,
    buttonClassName: loading ? "relative overflow-hidden transition-none !opacity-100" : undefined,
    buttonContent: loading ? (
      <span
        aria-hidden="true"
        className="invisible inline-flex items-center"
        data-slot="button-content"
        style={{ gap: "inherit" }}
      >
        {children}
      </span>
    ) : (
      children
    ),
    buttonDisabled: Boolean(disabled || loading),
    buttonLoader: loading ? (
      <span
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        data-slot="button-loader"
      >
        <AnimatedLoader
          height={resolvedLoadingHeight}
          indicatorClassName={loadingIndicatorClassName}
          insetX={loadingInsetX}
          width={loadingWidth ?? DEFAULT_BUTTON_LOADING_WIDTH}
        />
      </span>
    ) : null,
    buttonRef,
    buttonStyle:
      loading && stableInlineSizeRef.current
        ? withButtonInlineSize(style, stableInlineSizeRef.current)
        : style,
    dataLoading: loading ? "true" : undefined,
  };
}
