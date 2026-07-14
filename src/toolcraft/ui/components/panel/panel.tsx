"use client";

import * as React from "react";

import { ControlItem, ControlList, ControlSection } from "../control-layout";
import { cn } from "../../lib/utils";
import { PanelHeader } from "./panel-header";
import { PanelContentSurface, PanelSurface } from "./panel-surface";
import { PanelSection } from "./panel-section";

export type PanelProps = {
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
  contentTransitionSuppressionKey?: unknown;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onResetControls?: () => void;
  stickyFooterActive?: boolean;
  stickyFooterProgress?: number | null;
  title: string;
};

export function Panel({
  children,
  className,
  collapsed,
  contentTransitionSuppressionKey,
  defaultCollapsed = false,
  onCollapsedChange,
  onResetControls = noop,
  stickyFooterActive = false,
  stickyFooterProgress = null,
  title,
}: PanelProps): React.JSX.Element {
  const [internalCollapsed, setInternalCollapsed] =
    React.useState(defaultCollapsed);
  const resolvedCollapsed = collapsed ?? internalCollapsed;
  const hasPanelContentSections = hasDirectPanelContentSections(children);
  const panelContent = hasPanelContentSections ? (
    children
  ) : (
    <ImplicitPanelSection>{children}</ImplicitPanelSection>
  );
  const { bodyChildren, stickyFooterChildren } =
    splitPanelContentStickyFooter(panelContent);
  const suppressContentTransitions = useInitialPanelContentTransitionSuppression(
    contentTransitionSuppressionKey === undefined
      ? resolvedCollapsed
      : `${resolvedCollapsed}:${String(contentTransitionSuppressionKey)}`,
  );

  function toggleCollapsed(): void {
    const nextCollapsed = !resolvedCollapsed;
    setInternalCollapsed(nextCollapsed);
    onCollapsedChange?.(nextCollapsed);
  }

  return (
    <PanelSurface
      className={cn(
        "pointer-events-auto flex max-h-[calc(100dvh-1.25rem)] flex-col overflow-hidden rounded-lg p-0 w-[300px]",
        className,
      )}
      data-panel-id="properties"
    >
      <PanelHeader
        collapsed={resolvedCollapsed}
        onResetControls={onResetControls}
        onToggleCollapsed={toggleCollapsed}
        title={title}
      />
      {resolvedCollapsed ? null : (
        <PanelContentSurface
          data-toolcraft-controls-mounting={
            suppressContentTransitions ? "true" : undefined
          }
          data-slot="toolcraft-panel-content"
          stickyFooter={
            stickyFooterChildren.length > 0 ? stickyFooterChildren : undefined
          }
          stickyFooterActive={stickyFooterActive}
          stickyFooterProgress={stickyFooterProgress}
        >
          {bodyChildren}
        </PanelContentSurface>
      )}
    </PanelSurface>
  );
}

function noop(): void {}

function useInitialPanelContentTransitionSuppression(
  dependency: unknown,
): boolean {
  const [suppressionState, setSuppressionState] = React.useState(() => ({
    dependency,
    isSuppressing: true,
  }));

  React.useEffect(() => {
    setSuppressionState({ dependency, isSuppressing: true });

    if (typeof window === "undefined") {
      return undefined;
    }

    if (typeof window.requestAnimationFrame !== "function") {
      const timeout = window.setTimeout(() => {
        setSuppressionState({ dependency, isSuppressing: false });
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setSuppressionState({ dependency, isSuppressing: false });
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [dependency]);

  return (
    suppressionState.dependency !== dependency || suppressionState.isSuppressing
  );
}

function hasDirectPanelContentSections(children: React.ReactNode): boolean {
  return React.Children.toArray(children).some(isPanelContentSection);
}

function isPanelContentSection(child: React.ReactNode): boolean {
  if (!React.isValidElement(child)) {
    return false;
  }

  if (child.type === React.Fragment) {
    const props = child.props as { children?: React.ReactNode };

    return hasDirectPanelContentSections(props.children);
  }

  return child.type === ControlSection || child.type === PanelSection;
}

function splitPanelContentStickyFooter(children: React.ReactNode): {
  bodyChildren: React.ReactNode[];
  stickyFooterChildren: React.ReactNode[];
} {
  const childArray = React.Children.toArray(children);
  let stickyFooterStartIndex = childArray.length;

  while (
    stickyFooterStartIndex > 0 &&
    isPanelStickyFooterSection(childArray[stickyFooterStartIndex - 1])
  ) {
    stickyFooterStartIndex -= 1;
  }

  return {
    bodyChildren: childArray.slice(0, stickyFooterStartIndex),
    stickyFooterChildren: childArray.slice(stickyFooterStartIndex),
  };
}

function isPanelStickyFooterSection(child: React.ReactNode): boolean {
  if (!React.isValidElement<Record<string, unknown>>(child)) {
    return false;
  }

  return (
    child.props["data-toolcraft-section-actions"] !== undefined ||
    child.props.actionGroup !== undefined
  );
}

function ImplicitPanelSection({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const childArray = React.Children.toArray(children);
  const shouldRenderInnerDividers = childArray.length > 1;

  return (
    <ControlSection className="py-0">
      <ControlList className="pt-2 pb-6">
        {childArray.map((child, index) => (
          <ControlItem
            allowCompoundDividers={shouldRenderInnerDividers}
            key={getPanelChildKey(child, index)}
          >
            {child}
          </ControlItem>
        ))}
      </ControlList>
    </ControlSection>
  );
}

function getPanelChildKey(child: React.ReactNode, index: number): React.Key {
  return React.isValidElement(child) && child.key !== null ? child.key : index;
}
