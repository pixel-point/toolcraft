export type ToolcraftContractKind =
  | "canvas"
  | "command"
  | "composition"
  | "control"
  | "panel"
  | "persistence"
  | "settings"
  | "toolbar";

export type ToolcraftStateMode = "command-only" | "controlled" | "runtime-owned";

export type ToolcraftSectionLayout = "grouped" | "standalone";

export type ToolcraftControlLayoutGroupColumns = 2;

export type ToolcraftControlLayoutGroupLayout = "inline";

export type ToolcraftLabelPolicy = "component-owned" | "hidden" | "optional" | "required";

export type ToolcraftPanelPlacement = "bottom" | "left" | "right" | "top";

export type ToolcraftPanelSnapEdge = "bottom" | "left" | "right" | "top";

export type ToolcraftControlDecisionStrictness =
  | "best-fit"
  | "custom-escape-hatch"
  | "exact-owner";

export type ToolcraftControlDecisionCatalog = {
  acceptableAlternatives?: readonly string[];
  doNotReplaceWith?: readonly string[];
  layoutConstraints?: readonly string[];
  ownsValueModel: readonly string[];
  requiredAcceptance: readonly string[];
  strictness: ToolcraftControlDecisionStrictness;
  useWhen: readonly string[];
};

export type ToolcraftComponentContract = {
  aiUsageRules?: readonly string[];
  capabilities?: readonly string[];
  commands?: readonly string[];
  decisionCatalog?: ToolcraftControlDecisionCatalog;
  defaultPlacement?: ToolcraftPanelPlacement;
  defaultSectionLayout?: ToolcraftSectionLayout;
  historyPolicy?: "never" | "optional" | "patch";
  id: string;
  kind: ToolcraftContractKind;
  labelPolicy?: ToolcraftLabelPolicy;
  requiredWrapper?: "PanelHost";
  schemaType?: string;
  snapEdges?: readonly ToolcraftPanelSnapEdge[];
  stateMode: ToolcraftStateMode;
  visualComponent: string;
};
