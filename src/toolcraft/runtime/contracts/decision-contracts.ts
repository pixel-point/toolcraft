export type ToolcraftDecisionArea =
  | "acceptance"
  | "canvas"
  | "controls"
  | "layers"
  | "panels"
  | "performance"
  | "persistence"
  | "reference-analysis"
  | "reference-clone"
  | "renderer"
  | "runtime-shell"
  | "timeline"
  | "workflow";

export type ToolcraftDecisionRuleLevel =
  | "default"
  | "escape-hatch"
  | "heuristic"
  | "invariant"
  | "recommendation";

export type ToolcraftDecisionVerdict =
  | "keep-hard"
  | "keep-but-clarify"
  | "move-to-validator"
  | "relax-to-heuristic"
  | "remove-duplicate";

export type ToolcraftDecisionEnforcement =
  | "acceptance-validator"
  | "browser-helper"
  | "cli-integrity-check"
  | "docs"
  | "performance-validator"
  | "runtime"
  | "schema-normalization"
  | "spec-checklist"
  | "starter-agents";

export type ToolcraftDecisionRule = {
  area: ToolcraftDecisionArea;
  currentConstraint: string;
  desiredBehavior: string;
  enforcement: readonly ToolcraftDecisionEnforcement[];
  id: string;
  level: ToolcraftDecisionRuleLevel;
  title: string;
  verdict: ToolcraftDecisionVerdict;
};

export const TOOLCRAFT_DECISION_CONTRACT = [
  {
    area: "runtime-shell",
    currentConstraint: "Apps must assemble through defineToolcraft and ToolcraftApp.",
    desiredBehavior:
      "Generated apps use the Toolcraft runtime shell and keep product-specific rendering inside supported extension points: schema controls, canvasContent product output, controlRenderers for true custom controls, ToolcraftApp onPanelAction, and runtime commands. App-specific code must not import or render low-level runtime surfaces or built-in control components directly.",
    enforcement: [
      "cli-integrity-check",
      "acceptance-validator",
      "starter-agents",
      "spec-checklist",
    ],
    id: "runtime-shell-required",
    level: "invariant",
    title: "Toolcraft runtime shell is required",
    verdict: "keep-hard",
  },
  {
    area: "canvas",
    currentConstraint:
      "canvasContent must not contain buttons, forms, CTAs, helper text, upload prompts, menus, settings UI, or invented placeholder/demo artwork for apps with uploaded/imported source-material flows.",
    desiredBehavior:
      "Canvas renders only real product result, source material, renderer output derived from current state, and valid product editing handles. If uploaded or imported content is part of the product source flow, the pre-content canvas stays neutral and runtime-backed until real content exists. Do not add agent-invented preset modes, demo backgrounds, CTA copy, fake sample output, or decorative placeholders to fill the canvas; a default procedural/reference source is allowed only when the prompt or reference explicitly defines it and the worklog records that evidence.",
    enforcement: ["browser-helper", "starter-agents", "spec-checklist"],
    id: "canvas-no-app-ui",
    level: "invariant",
    title: "Canvas contains product output, not app UI",
    verdict: "move-to-validator",
  },
  {
    area: "canvas",
    currentConstraint:
      "The Toolcraft canvas shell owns the visible workspace backing behind product output.",
    desiredBehavior:
      "Generated apps preserve the runtime canvas surface and do not replace, hide, or make the shell backing transparent when product renderers customize their own background.",
    enforcement: ["browser-helper", "starter-agents", "spec-checklist"],
    id: "canvas-surface-preserved",
    level: "invariant",
    title: "Canvas backing stays runtime-owned",
    verdict: "move-to-validator",
  },
  {
    area: "canvas",
    currentConstraint:
      "Product editing handles may live on the canvas when they manipulate visible product geometry.",
    desiredBehavior:
      "AI chooses canvas handles only for direct geometry or parameter manipulation and keeps handles tokenized, textless, export-excluded, and runtime-bound.",
    enforcement: ["browser-helper", "acceptance-validator", "spec-checklist"],
    id: "canvas-handle-placement",
    level: "heuristic",
    title: "Canvas handle placement is product-dependent",
    verdict: "keep-but-clarify",
  },
  {
    area: "panels",
    currentConstraint: "PanelHost owns drag, snap, and double-click reset behavior.",
    desiredBehavior:
      "Any rendered application panel preserves runtime panel mechanics and does not recreate panel dragging locally.",
    enforcement: ["runtime", "browser-helper", "starter-agents"],
    id: "panel-host-behavior",
    level: "invariant",
    title: "Panel mechanics stay runtime-owned",
    verdict: "keep-hard",
  },
  {
    area: "layers",
    currentConstraint:
      "Layers are optional and should appear only for multiple editable entities, grouping, visibility, selection, or reorder workflows.",
    desiredBehavior:
      "AI decides whether the product needs layers; single-layer apps do not render a layers panel.",
    enforcement: ["starter-agents", "spec-checklist"],
    id: "layers-enable-only-when-needed",
    level: "heuristic",
    title: "Layer enablement is product-dependent",
    verdict: "keep-but-clarify",
  },
  {
    area: "layers",
    currentConstraint:
      "Once layers are enabled, selection, visibility, reorder, grouping, media lifecycle, and selected-layer controls must work through the real LayersPanel UI.",
    desiredBehavior:
      "Layer-enabled apps prove real layer interactions and product output changes instead of dispatching layer commands directly in browser tests.",
    enforcement: ["acceptance-validator", "browser-helper", "performance-validator"],
    id: "layers-enabled-behavior",
    level: "invariant",
    title: "Enabled layers must fully work",
    verdict: "keep-hard",
  },
  {
    area: "timeline",
    currentConstraint:
      "Timeline is optional only for animated products that have no video export and are explicitly classified as autonomous decorative output.",
    desiredBehavior:
      "AI writes an Animation Intent Inventory before choosing no timeline, playback, keyframes, or custom reference timeline; user-requested product animation defaults to playback unless explicitly justified as autonomous output without video export. Export Video always requires a top Toolcraft timeline.",
    enforcement: ["starter-agents", "spec-checklist", "acceptance-validator"],
    id: "timeline-mode-choice",
    level: "heuristic",
    title: "Timeline mode is chosen from behavior",
    verdict: "keep-but-clarify",
  },
  {
    area: "timeline",
    currentConstraint:
      "Enabled timeline modes must control renderer time, pause, scrub, duration, loop, and keyframe evaluation where relevant.",
    desiredBehavior:
      "Playback and keyframe apps prove runtime timeline state controls visible and exported output, and renderer cycle duration follows state.timeline.durationSeconds.",
    enforcement: ["acceptance-validator", "browser-helper", "performance-validator"],
    id: "timeline-enabled-behavior",
    level: "invariant",
    title: "Enabled timelines must drive output",
    verdict: "keep-hard",
  },
  {
    area: "controls",
    currentConstraint:
      "Every visible schema control must bind to runtime state, reset from schema defaults, and have acceptance and browser coverage.",
    desiredBehavior:
      "Controls are not decorative; each visible control proves its product responsibility through runtime and output observables.",
    enforcement: ["acceptance-validator", "browser-helper"],
    id: "controls-product-coverage",
    level: "invariant",
    title: "Visible controls must affect the product",
    verdict: "keep-hard",
  },
  {
    area: "controls",
    currentConstraint:
      "Product-output apps expose final output delivery through sticky footer panelActions.",
    desiredBehavior:
      'Static products include Export PNG plus an "Image Export" section for format and 2K/4K/8K resolution; animated products include Export Video and Export PNG plus "Video Export" settings. Copy can be secondary, but it does not replace export. Product apps expose a required "Background" section directly before export settings, with a Switch labeled "Include" and a background color control with label false in one equal-width row. Standard helpers own runtime PNG transparency, live preview product-background visibility, and selected image dimensions or retina fallback, while Toolcraft canvas backing and video keep the background.',
    enforcement: ["acceptance-validator", "performance-validator", "browser-helper", "starter-agents"],
    id: "output-export-required",
    level: "invariant",
    title: "Product output always has export",
    verdict: "move-to-validator",
  },
  {
    area: "controls",
    currentConstraint:
      "Labels, color placement, section grouping, selector order, and inline density need product-aware decisions.",
    desiredBehavior:
      "Apps export a Control Section Inventory before schema authoring: every product controls section has a product entity or workflow stage, exact targets, a grouping reason, and split evidence when one target entity is intentionally divided.",
    enforcement: ["acceptance-validator", "schema-normalization", "docs", "starter-agents"],
    id: "controls-layout-heuristics",
    level: "heuristic",
    title: "Control layout remains product-aware",
    verdict: "keep-but-clarify",
  },
  {
    area: "renderer",
    currentConstraint:
      "Custom renderers must declare rendererTechnique and rendererTechnique.layers when product output uses semantic layers or mixed rendering.",
    desiredBehavior:
      "AI chooses rendering technology from product output semantics, fidelity, reference behavior, and performance, then proves that choice in typed config and browser tests.",
    enforcement: ["performance-validator", "browser-helper", "spec-checklist"],
    id: "renderer-technique-inventory",
    level: "default",
    title: "Renderer technique is a typed decision",
    verdict: "keep-but-clarify",
  },
  {
    area: "reference-clone",
    currentConstraint:
      "Reference-runtime-clone mode preserves the reference runtime as source of truth unless a redesign is explicit; functionality must be inventoried from inspected reference behavior before implementation.",
    desiredBehavior:
      "Ported apps keep reference loops, mutable state, transport semantics, media lifecycle, and export behavior before Toolcraft refinements. The agent records referenceStudy evidence from source inspection plus running the original or restoring it locally when runnable/reconstructable, builds a reference feature inventory from inspected source/runtime/UI behavior, gives each inventory item feature-level behavior evidence from that study, maps every user-visible and output-affecting feature to Toolcraft implementation and acceptance coverage, and marks intentional behavior changes only with explicit user approval evidence.",
    enforcement: ["acceptance-validator", "browser-helper", "starter-agents"],
    id: "reference-clone-source-of-truth",
    level: "invariant",
    title: "Reference clone preserves behavior",
    verdict: "keep-hard",
  },
  {
    area: "reference-analysis",
    currentConstraint:
      "Video, GIF, and screen-recording references are often treated as static visual inspiration or summarized from a few frames.",
    desiredBehavior:
      "Whenever a supplied reference is a video, GIF, screen recording, contact sheet, or extracted frame sequence, the agent studies it as behavioral evidence before implementation: extract or inspect a storyboard, record timecoded frame observations, compare frame-to-frame transitions, decompose changing entities and state into product behavior, and map those observed behaviors to acceptance rows. This applies to new Toolcraft apps and reference-runtime-clone work; it is independent from loop duration or timeline choice.",
    enforcement: ["acceptance-validator", "browser-helper", "docs", "starter-agents"],
    id: "video-reference-analysis",
    level: "invariant",
    title: "Video references require storyboard behavior study",
    verdict: "move-to-validator",
  },
  {
    area: "acceptance",
    currentConstraint:
      "Acceptance coverage must prove product responsibility, not only typecheck, component existence, runtime mutation, or shader uniform presence.",
    desiredBehavior:
      "Generated apps fail when a visible entity is disconnected from runtime state, product output, export output, or command side effects.",
    enforcement: ["acceptance-validator", "browser-helper"],
    id: "acceptance-product-observable",
    level: "invariant",
    title: "Acceptance needs product observables",
    verdict: "keep-hard",
  },
  {
    area: "performance",
    currentConstraint:
      "Performance coverage currently asks every visible non-action control for a performance scenario.",
    desiredBehavior:
      "Heavy workload controls get min/default/max workload coverage; ordinary controls get lightweight responsiveness coverage so they cannot hang or break input. Animated previews suspend or coalesce non-essential animation work during canvas drag, pan, pinch, zoom, and radar/center interactions without changing user playback state. A full performance checkpoint is required only when the first working version of an app exists, or whenever the user explicitly asks to optimize performance, fix lag, remove jank, speed up animation, stabilize drag/zoom, or otherwise complains about performance. The checkpoint uses the current AI agent's controlled browser first; Playwright is only the fallback runner when no agent browser is available or in CI/non-agent automation. Renderer, canvas, animation, export, timeline, layers, canvas.renderScale, bug fixes, and performance-sensitive controls need targeted functional/browser checks first and targeted performance scenarios only for touched workload/viewport/export paths. Performance fixes must preserve the selected render scale and must not pass budgets by silently downsampling, stretching a lower-resolution backing canvas, blurring output, or clamping canvas.renderScale below the user's chosen value. Browser performance checks read budgets from typed performance config and run sequentially for stable measurements.",
    enforcement: ["performance-validator", "browser-helper", "starter-agents"],
    id: "performance-coverage-levels",
    level: "invariant",
    title: "Performance coverage has workload and responsiveness levels",
    verdict: "keep-but-clarify",
  },
  {
    area: "persistence",
    currentConstraint:
      "Persistence policy must be deliberate; generated apps should not write runtime state to localStorage directly.",
    desiredBehavior:
      "AI states whether persistence exists, what is persisted, and how reset, import, clear, and new media affect stored state. Apps with localStorage persistence must include browser acceptance for changing a user setting, reloading the page, and observing the restored value or product output; settings import/export is not a substitute for persistence.",
    enforcement: ["starter-agents", "spec-checklist", "acceptance-validator", "browser-helper"],
    id: "persistence-policy-explicit",
    level: "default",
    title: "Persistence is explicit app policy",
    verdict: "keep-but-clarify",
  },
  {
    area: "workflow",
    currentConstraint:
      "Template app work must use brainstorming, writing-plans, systematic-debugging, and browser verification when the environment supports those skills.",
    desiredBehavior:
      "Workflow skills guide the generation process, while product implementation plans stay focused on app files, tests, build, and browser verification.",
    enforcement: ["starter-agents", "docs"],
    id: "workflow-required",
    level: "invariant",
    title: "Required workflow stays part of the contract",
    verdict: "remove-duplicate",
  },
] as const satisfies readonly ToolcraftDecisionRule[];

export function getToolcraftDecisionRule(
  id: string,
): ToolcraftDecisionRule | undefined {
  return TOOLCRAFT_DECISION_CONTRACT.find((rule) => rule.id === id);
}

export function getToolcraftDecisionRulesByArea(
  area: ToolcraftDecisionArea,
): ToolcraftDecisionRule[] {
  return TOOLCRAFT_DECISION_CONTRACT.filter((rule) => rule.area === area);
}
