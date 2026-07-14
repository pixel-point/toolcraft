"use client";

import * as React from "react";

export type PortalLayerContainer =
  | HTMLElement
  | ShadowRoot
  | null
  | React.RefObject<HTMLElement | ShadowRoot | null>
  | undefined;

const PortalLayerContainerContext = React.createContext<PortalLayerContainer>(undefined);

function PortalLayerContainerProvider({
  children,
  container,
}: {
  children: React.ReactNode;
  container: PortalLayerContainer;
}): React.JSX.Element {
  return (
    <PortalLayerContainerContext.Provider value={container}>
      {children}
    </PortalLayerContainerContext.Provider>
  );
}

function usePortalLayerContainer(container?: PortalLayerContainer): PortalLayerContainer {
  const inheritedContainer = React.useContext(PortalLayerContainerContext);
  return container ?? inheritedContainer;
}

export { PortalLayerContainerProvider, PortalLayerContainerContext, usePortalLayerContainer };
