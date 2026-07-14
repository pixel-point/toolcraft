import { TOOLCRAFT_COMPONENT_CONTRACTS } from "../contracts/component-contracts";
import {
  getToolcraftCanvasAspectRatioPreset,
  getToolcraftCanvasAspectRatioPresetBySize,
} from "./canvas-aspect-ratio-presets";
import { toolcraftTimelinePanelExtendedTarget } from "./runtime-targets";
import type {
  ToolcraftAssemblyCapability,
  ToolcraftAssemblyCommand,
  ToolcraftAssemblyComponentId,
  ToolcraftAssemblyContract,
  ToolcraftAssemblyPanelContract,
  ToolcraftAppSchema,
  ToolcraftControlLayoutGroupSchema,
  ToolcraftControlSectionSchema,
  ToolcraftCanvasSize,
  ToolcraftCanvasSizingSchema,
  ToolcraftControlSchema,
  ToolcraftControlsPanelSchema,
  ToolcraftSettingsTransferSchema,
  ToolcraftTimelinePanelSchema,
  ToolcraftToolbarSchema,
  ResolvedToolcraftPanelsSchema,
  ResolvedToolcraftSettingsTransferSchema,
  ResolvedToolcraftTimelinePanelSchema,
  ResolvedToolcraftAppSchema,
} from "./types";

const defaultCanvasSize = {
  height: 1080,
  unit: "px",
  width: 1920,
} satisfies ToolcraftCanvasSize;

type ResolvedCanvas = ResolvedToolcraftAppSchema["canvas"];
type ResolvedExport = ResolvedToolcraftAppSchema["export"];
type ResolvedMedia = ResolvedToolcraftAppSchema["media"];
type ResolvedToolbar = Required<ToolcraftToolbarSchema>;
type PanelContract = {
  capabilities?: readonly string[];
  defaultPlacement: ToolcraftAssemblyPanelContract["defaultPlacement"];
  snapEdges: ToolcraftAssemblyPanelContract["snapEdges"];
  visualComponent: string;
};

const canvasSizeControlTargets = {
  height: "canvas.size.height",
  width: "canvas.size.width",
} as const;
const canvasAspectRatioTarget = "canvas.aspectRatio";
const canvasRenderScaleTarget = "canvas.renderScale";
const defaultTimelineDurationSeconds = 8;
const minTimelineDurationSeconds = 1;
const maxTimelineDurationSeconds = 60;
const defaultCanvasRenderScale = {
  defaultValue: 2,
  enabled: false,
  max: 2,
  min: 1,
  step: 0.25,
} satisfies ResolvedToolcraftAppSchema["canvas"]["renderScale"];
const maxAutoInlineControlLabelLength = 18;
const settingsTransferTarget = "runtime.settingsTransfer";
const runtimeSetupSectionTitle = "Setup";

type ToolcraftControlActionSchema = NonNullable<
  ToolcraftControlSchema["actions"]
>[number];

function unique<const Value extends string>(values: readonly Value[]): Value[] {
  return Array.from(new Set(values));
}

function assertNever(value: never): never {
  throw new Error(`Unsupported Toolcraft template persistence storage: ${String(value)}`);
}

function resolvePersistence(
  persistence: ToolcraftAppSchema["persistence"],
): ResolvedToolcraftAppSchema["persistence"] {
  switch (persistence?.storage) {
    case undefined:
    case "none":
      return { storage: "none" };
    case "localStorage":
      return persistence;
    default:
      return assertNever(persistence);
  }
}

function slugifySettingsTransferAppId(value: string | undefined): string {
  const slug = value
    ?.trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "toolcraft-app";
}

function getSettingsTransferMode(
  settingsTransfer: ToolcraftSettingsTransferSchema | undefined,
): "auto" | boolean {
  if (typeof settingsTransfer === "object" && settingsTransfer !== null) {
    return settingsTransfer.enabled ?? "auto";
  }

  return settingsTransfer ?? "auto";
}

function getSettingsTransferObject(
  settingsTransfer: ToolcraftSettingsTransferSchema | undefined,
): Extract<ToolcraftSettingsTransferSchema, object> | undefined {
  return typeof settingsTransfer === "object" && settingsTransfer !== null
    ? settingsTransfer
    : undefined;
}

function getSettingsTransferAppId({
  controls,
  persistence,
  settingsTransfer,
}: {
  controls: ToolcraftControlsPanelSchema | undefined;
  persistence: ResolvedToolcraftAppSchema["persistence"];
  settingsTransfer: ToolcraftSettingsTransferSchema | undefined;
}): string {
  const objectSchema = getSettingsTransferObject(settingsTransfer);

  if (objectSchema?.appId) {
    return slugifySettingsTransferAppId(objectSchema.appId);
  }

  if (persistence.storage === "localStorage") {
    const match = /^toolcraft:(.+):state:v\d+$/u.exec(persistence.key);

    if (match?.[1]) {
      return slugifySettingsTransferAppId(match[1]);
    }
  }

  return slugifySettingsTransferAppId(controls?.title);
}

function getSettingsTransferFileName({
  appId,
  settingsTransfer,
}: {
  appId: string;
  settingsTransfer: ToolcraftSettingsTransferSchema | undefined;
}): string {
  const explicitFileName = getSettingsTransferObject(settingsTransfer)?.fileName?.trim();

  if (explicitFileName) {
    return explicitFileName.endsWith(".json") ? explicitFileName : `${explicitFileName}.json`;
  }

  return `${appId}-settings.json`;
}

function resolveCanvasSizing(
  canvas: ToolcraftAppSchema["canvas"],
): ToolcraftCanvasSizingSchema {
  if (canvas.sizing) {
    return canvas.sizing;
  }

  if (canvas.size) {
    return { mode: "editable-output" };
  }

  if (canvas.upload) {
    return { mode: "editable-output" };
  }

  return { mode: "intrinsic-media" };
}

function clampCanvasRenderScale(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(2, value));
}

function resolveCanvasRenderScale(
  renderScale: ToolcraftAppSchema["canvas"]["renderScale"],
): ResolvedToolcraftAppSchema["canvas"]["renderScale"] {
  if (renderScale === true) {
    return {
      ...defaultCanvasRenderScale,
      enabled: true,
    };
  }

  if (!renderScale) {
    return defaultCanvasRenderScale;
  }

  const min = clampCanvasRenderScale(renderScale.min, defaultCanvasRenderScale.min);
  const max = Math.max(
    min,
    clampCanvasRenderScale(renderScale.max, defaultCanvasRenderScale.max),
  );
  const step =
    typeof renderScale.step === "number" && Number.isFinite(renderScale.step)
      ? Math.max(0.01, Math.min(1, renderScale.step))
      : defaultCanvasRenderScale.step;
  const defaultValue = Math.max(
    min,
    Math.min(
      max,
      clampCanvasRenderScale(renderScale.defaultValue, defaultCanvasRenderScale.defaultValue),
    ),
  );

  return {
    defaultValue,
    enabled: renderScale.enabled ?? true,
    max,
    min,
    step,
  };
}

function resolveExport(
  exportSchema: ToolcraftAppSchema["export"],
): ResolvedExport {
  return {
    png: {
      background: exportSchema?.png?.background ?? "include",
    },
  };
}

function resolveMedia(mediaSchema: ToolcraftAppSchema["media"]): ResolvedMedia {
  return {
    defaultAssets: mediaSchema?.defaultAssets ?? [],
  };
}

function getPanelDragMode(
  contract: { capabilities?: readonly string[] },
): ToolcraftAssemblyPanelContract["dragMode"] {
  return contract.capabilities?.includes("dragMode:handle") ? "handle" : "panel";
}

function createPanelAssemblyContract({
  capabilities = [],
  commands = [],
  contract,
  enabled,
}: {
  capabilities?: readonly ToolcraftAssemblyCapability[];
  commands?: readonly ToolcraftAssemblyCommand[];
  contract: PanelContract;
  enabled: boolean;
}): ToolcraftAssemblyPanelContract {
  const panelCapabilities = enabled
    ? unique<ToolcraftAssemblyCapability>([
        "panels.draggable",
        "panels.snap",
        "panels.doubleClickReset",
        ...capabilities,
      ])
    : [];
  const panelCommands = enabled
    ? unique<ToolcraftAssemblyCommand>([
        "panels.setOffset",
        "panels.setHidden",
        "panels.resetOffset",
        ...commands,
      ])
    : [];

  return {
    capabilities: panelCapabilities,
    commands: panelCommands,
    defaultPlacement: contract.defaultPlacement,
    dragMode: getPanelDragMode(contract),
    enabled,
    requiredWrapper: "PanelHost",
    snapEdges: contract.snapEdges,
    visualComponent: contract.visualComponent,
  };
}

function createToolcraftAssembly({
  canvas,
  panels,
  toolbar,
}: {
  canvas: ResolvedCanvas;
  panels: ResolvedToolcraftPanelsSchema;
  toolbar: ResolvedToolbar;
}): ToolcraftAssemblyContract {
  const components: ToolcraftAssemblyComponentId[] = [];
  const capabilities: ToolcraftAssemblyCapability[] = [];
  const commands: ToolcraftAssemblyCommand[] = [];
  const toolbarEnabled = toolbar.history || toolbar.radar || toolbar.theme || toolbar.zoom;
  const canvasEditableSize = canvas.sizing.mode === "editable-output";

  if (canvas.enabled) {
    components.push("canvas");

    if (canvasEditableSize) {
      capabilities.push("canvas.editableSize");
      commands.push("canvas.setSize");
    }

    if (canvas.renderScale.enabled) {
      capabilities.push("canvas.renderScale");
    }

    if (canvas.draggable) {
      capabilities.push("canvas.draggable");
      commands.push("canvas.panBy", "canvas.setOffset", "canvas.setViewport");
    }

    if (canvas.upload) {
      capabilities.push("canvas.upload");
      commands.push("media.delete", "media.import", "media.reorder", "media.transform");
    }
  }

  const controlsPanel = panels.controls
    ? createPanelAssemblyContract({
        capabilities: ["controls.panel", "controls.defaults"],
        commands: [
          "controls.apply",
          "controls.reset",
          "controls.resetTargets",
          "controls.setValue",
        ],
        contract: TOOLCRAFT_COMPONENT_CONTRACTS.controlsPanel,
        enabled: true,
      })
    : undefined;

  if (controlsPanel) {
    components.push("controlsPanel");
    capabilities.push(...controlsPanel.capabilities);
    commands.push(...controlsPanel.commands);
  }

  const layersPanel = panels.layers
    ? createPanelAssemblyContract({
        capabilities: [
          "layers.groups",
          "layers.panel",
          "layers.selection",
          "layers.visibility",
        ],
        commands: [
          "layers.add",
          "layers.delete",
          "layers.moveToGroup",
          "layers.rename",
          "layers.reorder",
          "layers.select",
          "layers.toggleCollapsed",
          "layers.toggleVisibility",
        ],
        contract: TOOLCRAFT_COMPONENT_CONTRACTS.layersPanel,
        enabled: true,
      })
    : undefined;

  if (layersPanel) {
    components.push("layersPanel");
    capabilities.push(...layersPanel.capabilities);
    commands.push(...layersPanel.commands);
  }

  const timelineKeyframesEnabled = panels.timeline?.mode === "keyframes";
  const timelinePanel = panels.timeline?.enabled
    ? createPanelAssemblyContract({
        capabilities: [
          "timeline.duration",
          "timeline.panel",
          "timeline.playback",
          ...(timelineKeyframesEnabled ? (["timeline.keyframes"] as const) : []),
        ],
        commands: [
          "timeline.setCurrentTime",
          "timeline.setDuration",
          "timeline.setPlaying",
          "timeline.toggleLoop",
          "timeline.togglePlayback",
          ...(timelineKeyframesEnabled
            ? ([
                "timeline.changeKeyframeEasing",
                "timeline.deleteControlKeyframes",
                "timeline.deleteKeyframe",
                "timeline.moveKeyframe",
                "timeline.selectKeyframe",
                "timeline.setExpanded",
                "timeline.toggleControlKeyframes",
                "timeline.toggleExpanded",
              ] as const)
            : []),
        ],
        contract: TOOLCRAFT_COMPONENT_CONTRACTS.timelinePanel,
        enabled: true,
      })
    : undefined;

  if (timelinePanel) {
    components.push("timelinePanel");
    capabilities.push(...timelinePanel.capabilities);
    commands.push(...timelinePanel.commands);
  }

  const toolbarCommands: ToolcraftAssemblyCommand[] = [];
  const toolbarCapabilities: ToolcraftAssemblyCapability[] = [];

  if (toolbar.history) {
    toolbarCapabilities.push("history.undoRedo", "toolbar.history");
    toolbarCommands.push("history.redo", "history.undo");
  }

  if (toolbar.radar) {
    toolbarCapabilities.push("toolbar.radar");
    toolbarCommands.push("canvas.center");
  }

  if (toolbar.theme) {
    toolbarCapabilities.push("toolbar.theme");
  }

  if (toolbar.zoom) {
    toolbarCapabilities.push("toolbar.zoom");
    toolbarCommands.push("canvas.zoomIn", "canvas.zoomOut", "canvas.zoomReset");
  }

  const toolbarPanel = createPanelAssemblyContract({
    capabilities: toolbarCapabilities,
    commands: toolbarCommands,
    contract: TOOLCRAFT_COMPONENT_CONTRACTS.toolbar,
    enabled: toolbarEnabled,
  });

  if (toolbarEnabled) {
    components.push("toolbar");
    capabilities.push(...toolbarPanel.capabilities);
    commands.push(...toolbarPanel.commands);
  }

  return {
    capabilities: unique(capabilities),
    commands: unique(commands),
    components: unique(components),
    surfaces: {
      canvas: {
        capabilities: canvas.enabled
          ? unique<ToolcraftAssemblyCapability>([
              ...(canvasEditableSize ? (["canvas.editableSize"] as const) : []),
              ...(canvas.draggable ? (["canvas.draggable"] as const) : []),
              ...(canvas.upload ? (["canvas.upload"] as const) : []),
            ])
          : [],
        commands: canvas.enabled
          ? unique<ToolcraftAssemblyCommand>([
              ...(canvasEditableSize ? (["canvas.setSize"] as const) : []),
              ...(canvas.draggable
                ? (["canvas.panBy", "canvas.setOffset", "canvas.setViewport"] as const)
                : []),
              ...(canvas.upload
                ? ([
                    "media.delete",
                    "media.import",
                    "media.reorder",
                    "media.transform",
                  ] as const)
                : []),
            ])
          : [],
        enabled: canvas.enabled,
        visualComponent: "CanvasShell",
      },
      panels: {
        controls: controlsPanel,
        layers: layersPanel,
        timeline: timelinePanel,
        toolbar: toolbarPanel,
      },
    },
  };
}

function getControlDefaultSectionLayout(
  control: ToolcraftControlSchema,
): "grouped" | "standalone" {
  const contract = (
    TOOLCRAFT_COMPONENT_CONTRACTS as Record<
      string,
      { defaultSectionLayout?: "grouped" | "standalone"; kind?: string } | undefined
    >
  )[control.type];

  return contract?.kind === "control" && contract.defaultSectionLayout
    ? contract.defaultSectionLayout
    : "grouped";
}

function getControlSectionLayout(
  control: ToolcraftControlSchema,
  entries: readonly [string, ToolcraftControlSchema][],
): "grouped" | "standalone" {
  if (isControlGatedBySameSectionControl(control, entries)) {
    return "grouped";
  }

  if (
    (control.type === "color" || control.type === "colorOpacity") &&
    entries.some(
      ([, entryControl]) =>
        entryControl.type !== "color" &&
        entryControl.type !== "colorOpacity" &&
        getControlDefaultSectionLayout(entryControl) === "grouped",
    )
  ) {
    return "grouped";
  }

  return getControlDefaultSectionLayout(control);
}

function isControlGatedBySameSectionControl(
  control: ToolcraftControlSchema,
  entries: readonly [string, ToolcraftControlSchema][],
): boolean {
  const gateTargets = [control.visibleWhen?.target, control.disabledWhen?.target].filter(
    (target): target is string => Boolean(target),
  );

  if (gateTargets.length === 0) {
    return false;
  }

  return entries.some(([, entryControl]) =>
    gateTargets.includes(entryControl.target) &&
    getControlDefaultSectionLayout(entryControl) === "grouped",
  );
}

function createControlsRecord(
  entries: readonly [string, ToolcraftControlSchema][],
): Record<string, ToolcraftControlSchema> {
  return Object.fromEntries(
    entries.map(([id, control]) => [id, normalizeControlSchema(control)]),
  );
}

function isSliderLikeControl(control: ToolcraftControlSchema): boolean {
  return control.type === "slider" || control.type === "rangeSlider";
}

function getStepMarkerCount(control: ToolcraftControlSchema): number | undefined {
  if (
    typeof control.step !== "number" ||
    typeof control.min !== "number" ||
    typeof control.max !== "number" ||
    !Number.isFinite(control.step) ||
    !Number.isFinite(control.min) ||
    !Number.isFinite(control.max) ||
    control.step <= 0 ||
    control.max <= control.min
  ) {
    return undefined;
  }

  const rawStepCount = (control.max - control.min) / control.step;
  const roundedStepCount = Math.round(rawStepCount);
  const stepCount =
    Math.abs(rawStepCount - roundedStepCount) < Number.EPSILON * 100
      ? roundedStepCount
      : Math.floor(rawStepCount) + 1;

  return Math.max(2, stepCount + 1);
}

function normalizeControlSchema(
  control: ToolcraftControlSchema,
): ToolcraftControlSchema {
  if (
    !isSliderLikeControl(control) ||
    typeof control.step !== "number" ||
    control.variant !== "discrete"
  ) {
    return control;
  }

  return {
    ...control,
    markerCount: getStepMarkerCount(control) ?? control.markerCount,
    variant: "discrete",
  };
}

function filterLayoutGroupsForControlIds(
  layoutGroups: readonly ToolcraftControlLayoutGroupSchema[] | undefined,
  controlIds: ReadonlySet<string>,
): ToolcraftControlLayoutGroupSchema[] {
  return (layoutGroups ?? [])
    .map((layoutGroup) => ({
      ...layoutGroup,
      controls: layoutGroup.controls.filter((controlId) => controlIds.has(controlId)),
    }))
    .filter((layoutGroup) => layoutGroup.controls.length > 1);
}

function hasControlEntries(
  entries: readonly [string, ToolcraftControlSchema][],
): boolean {
  return entries.length > 0;
}

function isPanelActionsControl(control: ToolcraftControlSchema): boolean {
  return control.type === "panelActions";
}

function resolveSettingsTransfer({
  controls,
  persistence,
  settingsTransfer,
}: {
  controls: ToolcraftControlsPanelSchema | undefined;
  persistence: ResolvedToolcraftAppSchema["persistence"];
  settingsTransfer: ToolcraftSettingsTransferSchema | undefined;
}): ResolvedToolcraftSettingsTransferSchema {
  const mode = getSettingsTransferMode(settingsTransfer);
  const appId = getSettingsTransferAppId({
    controls,
    persistence,
    settingsTransfer,
  });

  return {
    appId,
    enabled: Boolean(controls),
    fileName: getSettingsTransferFileName({ appId, settingsTransfer }),
    mode,
  };
}

function createSettingsTransferSection(
  settingsTransfer: ResolvedToolcraftSettingsTransferSchema,
): ToolcraftControlSectionSchema {
  return {
    controls: {
      settingsTransfer: {
        label: false,
        target: settingsTransferTarget,
        type: "settingsTransfer",
      },
    },
    layout: "standalone",
    title: runtimeSetupSectionTitle,
  };
}

function getCanvasSizeLayoutGroups(
  sizeControlIds: readonly string[],
): ToolcraftControlSectionSchema["layoutGroups"] {
  return sizeControlIds.length > 1
    ? [{ columns: 2, controls: [...sizeControlIds], layout: "inline" }]
    : undefined;
}

function getGreatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(Math.round(left));
  let b = Math.abs(Math.round(right));

  while (b !== 0) {
    const next = b;
    b = a % b;
    a = next;
  }

  return a || 1;
}

function getCanvasAspectRatioDefaultValue(size: ToolcraftCanvasSize): {
  height: number;
  mode: "custom" | "preset";
  value: string;
  width: number;
} {
  const divisor = getGreatestCommonDivisor(size.width, size.height);
  const width = Math.max(1, Math.round(size.width / divisor));
  const height = Math.max(1, Math.round(size.height / divisor));
  const value = `${width}:${height}`;
  const preset =
    getToolcraftCanvasAspectRatioPreset(value) ??
    getToolcraftCanvasAspectRatioPresetBySize(size);

  return {
    height: preset?.ratioHeight ?? height,
    mode: preset ? "preset" : "custom",
    value: preset?.value ?? value,
    width: preset?.ratioWidth ?? width,
  };
}

function mergeCanvasSizeControlsIntoSettingsTransferSection({
  aspectRatioControl,
  renderScaleControl,
  settingsTransferSection,
  sizeControlIds,
  sizeControls,
  timelineExtendedControl,
}: {
  aspectRatioControl: ToolcraftControlSchema;
  renderScaleControl?: ToolcraftControlSchema;
  settingsTransferSection: ToolcraftControlSectionSchema;
  sizeControlIds: readonly string[];
  sizeControls: ToolcraftControlSectionSchema["controls"];
  timelineExtendedControl?: ToolcraftControlSchema;
}): ToolcraftControlSectionSchema {
  const canvasSizeLayoutGroups = getCanvasSizeLayoutGroups(sizeControlIds) ?? [];

  return {
    ...settingsTransferSection,
    controls: {
      ...settingsTransferSection.controls,
      canvasAspectRatio: aspectRatioControl,
      ...sizeControls,
      ...(renderScaleControl ? { canvasRenderScale: renderScaleControl } : {}),
      ...(timelineExtendedControl ? { timelineExtended: timelineExtendedControl } : {}),
    },
    layoutGroups:
      canvasSizeLayoutGroups.length > 0 || settingsTransferSection.layoutGroups?.length
        ? [
            ...(settingsTransferSection.layoutGroups ?? []),
            ...canvasSizeLayoutGroups,
          ]
        : undefined,
  };
}

function mergeCanvasRenderScaleIntoSettingsTransferSection({
  renderScaleControl,
  settingsTransferSection,
  timelineExtendedControl,
}: {
  renderScaleControl: ToolcraftControlSchema;
  settingsTransferSection: ToolcraftControlSectionSchema;
  timelineExtendedControl?: ToolcraftControlSchema;
}): ToolcraftControlSectionSchema {
  return {
    ...settingsTransferSection,
    controls: {
      ...settingsTransferSection.controls,
      canvasRenderScale: renderScaleControl,
      ...(timelineExtendedControl ? { timelineExtended: timelineExtendedControl } : {}),
    },
  };
}

function mergeTimelineExtendedIntoSettingsTransferSection({
  settingsTransferSection,
  timelineExtendedControl,
}: {
  settingsTransferSection: ToolcraftControlSectionSchema;
  timelineExtendedControl: ToolcraftControlSchema;
}): ToolcraftControlSectionSchema {
  return {
    ...settingsTransferSection,
    controls: {
      ...settingsTransferSection.controls,
      timelineExtended: timelineExtendedControl,
    },
  };
}

function isPrimaryPanelAction(action: ToolcraftControlActionSchema): boolean {
  return typeof action !== "string" && action.variant !== "outline";
}

function orderPanelActions(
  actions: readonly ToolcraftControlActionSchema[],
): ToolcraftControlActionSchema[] {
  if (actions.length !== 2) {
    return [...actions];
  }

  return [...actions].sort(
    (left, right) => Number(isPrimaryPanelAction(left)) - Number(isPrimaryPanelAction(right)),
  );
}

function createMergedPanelActionsControl(
  entries: readonly [string, ToolcraftControlSchema][],
): ToolcraftControlSchema | null {
  const firstControl = entries[0]?.[1];

  if (!firstControl) {
    return null;
  }

  const actions = entries.flatMap(([, control]) => [...(control.actions ?? [])]);

  return {
    ...firstControl,
    actions: orderPanelActions(actions),
    target: firstControl.target || "panel.actions",
    type: "panelActions",
  };
}

function splitControlsPanelActionSections(
  sections: readonly ToolcraftControlSectionSchema[],
): {
  bodySections: ToolcraftControlSectionSchema[];
  stickyFooterSections: ToolcraftControlSectionSchema[];
} {
  const bodySections: ToolcraftControlSectionSchema[] = [];
  const stickyFooterSections: ToolcraftControlSectionSchema[] = [];
  const stickyFooterActionEntries: [string, ToolcraftControlSchema][] = [];

  for (const section of sections) {
    if (section.actionGroup) {
      const entries = Object.entries(section.controls);
      const actionEntries = entries.filter(([, control]) => isPanelActionsControl(control));
      const passthroughEntries = entries.filter(([, control]) => !isPanelActionsControl(control));

      stickyFooterActionEntries.push(...actionEntries);

      if (hasControlEntries(passthroughEntries)) {
        stickyFooterSections.push({
          ...section,
          controls: createControlsRecord(passthroughEntries),
        });
      }

      continue;
    }

    const bodyEntries: [string, ToolcraftControlSchema][] = [];
    const actionEntries: [string, ToolcraftControlSchema][] = [];

    for (const entry of Object.entries(section.controls)) {
      const [, control] = entry;

      if (isPanelActionsControl(control)) {
        actionEntries.push(entry);
      } else {
        bodyEntries.push(entry);
      }
    }

    if (hasControlEntries(bodyEntries)) {
      const controlIds = new Set(bodyEntries.map(([id]) => id));
      const layoutGroups = filterLayoutGroupsForControlIds(section.layoutGroups, controlIds);
      const title = getBodySectionTitleAfterActionSplit(section.title);

      bodySections.push({
        ...section,
        controls: createControlsRecord(bodyEntries),
        layoutGroups: layoutGroups.length > 0 ? layoutGroups : undefined,
        title,
      });
    }

    if (hasControlEntries(actionEntries)) {
      stickyFooterActionEntries.push(...actionEntries);
    }
  }

  const mergedActionsControl = createMergedPanelActionsControl(stickyFooterActionEntries);

  if (mergedActionsControl) {
    stickyFooterSections.unshift({
      actionGroup: "secondary",
      controls: { footer: mergedActionsControl },
      layout: "standalone",
      title: "Export",
    });
  }

  return { bodySections, stickyFooterSections };
}

function getBodySectionTitleAfterActionSplit(
  title: ToolcraftControlSectionSchema["title"],
): ToolcraftControlSectionSchema["title"] {
  if (!title) {
    return title;
  }

  return isActionOrExportSectionTitle(title) ? undefined : title;
}

function isActionOrExportSectionTitle(title: string): boolean {
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedTitle === "action" ||
    normalizedTitle === "actions" ||
    normalizedTitle === "export" ||
    normalizedTitle === "exports";
}

function isShortControlLabel(id: string, control: ToolcraftControlSchema): boolean {
  const label = typeof control.label === "string" ? control.label : id;

  return label.length <= maxAutoInlineControlLabelLength;
}

function isNumericTextControl(control: ToolcraftControlSchema): boolean {
  if (control.type !== "text") {
    return false;
  }

  if (typeof control.defaultValue === "number") {
    return Number.isFinite(control.defaultValue);
  }

  return (
    typeof control.defaultValue === "string" &&
    /^-?\d+(?:\.\d+)?(?:px|%|s)?$/u.test(control.defaultValue.trim())
  );
}

function isColorValueControl(control: ToolcraftControlSchema): boolean {
  return control.type === "color" || control.type === "colorOpacity";
}

function hasVisibleControlLabel(control: ToolcraftControlSchema): boolean {
  return typeof control.label === "string" && control.label.trim().length > 0;
}

function shouldAutoInlineMixedFieldControls(
  first: [string, ToolcraftControlSchema],
  second: [string, ToolcraftControlSchema],
): boolean {
  const [firstId, firstControl] = first;
  const [secondId, secondControl] = second;
  const isNumericColorPair =
    (isNumericTextControl(firstControl) && isColorValueControl(secondControl)) ||
    (isColorValueControl(firstControl) && isNumericTextControl(secondControl));

  return (
    isNumericColorPair &&
    hasVisibleControlLabel(firstControl) &&
    hasVisibleControlLabel(secondControl) &&
    isShortControlLabel(firstId, firstControl) &&
    isShortControlLabel(secondId, secondControl)
  );
}

function shouldAutoInlineControls(
  first: [string, ToolcraftControlSchema],
  second: [string, ToolcraftControlSchema],
): boolean {
  const [firstId, firstControl] = first;
  const [secondId, secondControl] = second;

  if (
    isNumericTextControl(firstControl) &&
    isNumericTextControl(secondControl) &&
    isShortControlLabel(firstId, firstControl) &&
    isShortControlLabel(secondId, secondControl)
  ) {
    return true;
  }

  return shouldAutoInlineMixedFieldControls(first, second);
}

function addAutoLayoutGroupsToSection(
  section: ToolcraftControlSectionSchema,
): ToolcraftControlSectionSchema {
  if (section.layout === "standalone" || section.actionGroup) {
    return section;
  }

  const entries = Object.entries(section.controls);
  const explicitLayoutGroups = section.layoutGroups ?? [];
  const groupedControlIds = new Set<string>();

  for (const layoutGroup of explicitLayoutGroups) {
    for (const controlId of layoutGroup.controls) {
      groupedControlIds.add(controlId);
    }
  }

  const autoLayoutGroups: ToolcraftControlLayoutGroupSchema[] = [];

  for (let index = 0; index < entries.length - 1; index += 1) {
    const firstEntry = entries[index];
    const secondEntry = entries[index + 1];

    if (!firstEntry || !secondEntry) {
      continue;
    }

    const [firstId] = firstEntry;
    const [secondId] = secondEntry;

    if (groupedControlIds.has(firstId) || groupedControlIds.has(secondId)) {
      continue;
    }

    if (!shouldAutoInlineControls(firstEntry, secondEntry)) {
      continue;
    }

    autoLayoutGroups.push({
      columns: 2,
      controls: [firstId, secondId],
      layout: "inline",
    });
    groupedControlIds.add(firstId);
    groupedControlIds.add(secondId);
    index += 1;
  }

  const layoutGroups = [...explicitLayoutGroups, ...autoLayoutGroups];

  return layoutGroups.length > 0
    ? {
        ...section,
        layoutGroups,
      }
    : section;
}

function getImplicitStandaloneSectionTitle(
  entries: readonly [string, ToolcraftControlSchema][],
): string {
  const names = entries
    .map(([id, control]) => getSectionTitlePart(id, control, entries))
    .filter((name): name is string => Boolean(name));

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} & ${names[1]}`;
  }

  return getCommonTargetSectionTitle(entries) ?? "Appearance";
}

function getSectionTitlePart(
  id: string,
  control: ToolcraftControlSchema,
  entries: readonly [string, ToolcraftControlSchema][],
): string | undefined {
  if (typeof control.label === "string" && control.label.trim()) {
    const label = control.label.trim();

    if (!isGenericSectionTitle(label)) {
      return label;
    }
  }

  const title = titleizeControlId(id);

  if (title && !isGenericSectionTitle(title)) {
    return title;
  }

  if (entries.length === 1) {
    return getControlTypeSectionTitle(control);
  }

  return undefined;
}

function getControlTypeSectionTitle(
  control: ToolcraftControlSchema,
): string | undefined {
  switch (control.type) {
    case "channelMixer":
      return "Channels";
    case "curves":
      return "Curves";
    case "fontPicker":
      return "Typography";
    case "gradient":
      return "Gradient";
    case "palette":
      return "Palette";
    case "settingsTransfer":
      return "Settings";
    default:
      return undefined;
  }
}

function getCommonTargetSectionTitle(
  entries: readonly [string, ToolcraftControlSchema][],
): string | undefined {
  const targetPrefixes = new Set(
    entries
      .map(([, control]) => control.target.split(".")[0]?.trim())
      .filter((prefix): prefix is string => Boolean(prefix)),
  );

  if (targetPrefixes.size !== 1) {
    return undefined;
  }

  const [targetPrefix] = targetPrefixes;
  const title = titlePrefixToSectionTitle(targetPrefix);

  return title && !isGenericSectionTitle(title) ? title : undefined;
}

function titlePrefixToSectionTitle(prefix: string | undefined): string | undefined {
  if (!prefix) {
    return undefined;
  }

  switch (prefix) {
    case "canvas":
      return runtimeSetupSectionTitle;
    case "runtime":
      return "Settings";
    case "style":
      return "Appearance";
    default:
      return titleizeControlId(prefix);
  }
}

function isGenericColorSectionTitle(title: string): boolean {
  const normalizedTitle = title.trim().toLowerCase();

  return normalizedTitle === "color" || normalizedTitle === "colors";
}

function isGenericSectionTitle(title: string): boolean {
  const normalizedTitle = title.trim().toLowerCase();

  return (
    normalizedTitle === "control" ||
    normalizedTitle === "controls" ||
    normalizedTitle === "setting" ||
    normalizedTitle === "settings" ||
    isGenericColorSectionTitle(title)
  );
}

function isColorOnlySectionEntries(
  entries: readonly [string, ToolcraftControlSchema][],
): boolean {
  return entries.length > 0 && entries.every(([, control]) => control.type === "color");
}

function titleizeControlId(id: string): string | undefined {
  const title = id
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  if (!title) {
    return undefined;
  }

  return title.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function withImplicitStandaloneSectionTitle(
  section: ToolcraftControlSectionSchema,
  entries: readonly [string, ToolcraftControlSchema][],
): ToolcraftControlSectionSchema {
  if (section.title) {
    if (isColorOnlySectionEntries(entries) && isGenericColorSectionTitle(section.title)) {
      return { ...section, title: "Appearance" };
    }

    return section;
  }

  const title = getImplicitStandaloneSectionTitle(entries);

  return { ...section, title };
}

function normalizeMixedSectionLayout(
  section: ToolcraftControlSectionSchema,
): ToolcraftControlSectionSchema[] {
  const entries = Object.entries(section.controls);

  if (section.layout === "standalone") {
    return [
      addAutoLayoutGroupsToSection(
        withImplicitStandaloneSectionTitle(section, entries),
      ),
    ];
  }

  if (entries.length <= 1) {
    return [addAutoLayoutGroupsToSection(withImplicitStandaloneSectionTitle(section, entries))];
  }

  const layouts = entries.map(([, control]) => getControlSectionLayout(control, entries));
  const uniqueLayouts = new Set(layouts);

  if (uniqueLayouts.size <= 1) {
    return [addAutoLayoutGroupsToSection(withImplicitStandaloneSectionTitle(section, entries))];
  }

  const normalizedSections: ToolcraftControlSectionSchema[] = [];
  let currentLayout = layouts[0];
  let currentEntries: [string, ToolcraftControlSchema][] = [];

  const pushCurrentSection = (): void => {
    if (!currentLayout || currentEntries.length === 0) {
      return;
    }

    const controlIds = new Set(currentEntries.map(([id]) => id));

    if (currentLayout === "standalone") {
      normalizedSections.push(
        withImplicitStandaloneSectionTitle(
          {
            controls: createControlsRecord(currentEntries),
            layout: "standalone",
          },
          currentEntries,
        ),
      );
    } else {
      normalizedSections.push(
        addAutoLayoutGroupsToSection({
          ...section,
          controls: createControlsRecord(currentEntries),
          layoutGroups: filterLayoutGroupsForControlIds(section.layoutGroups, controlIds),
        }),
      );
    }
  };

  for (const [index, entry] of entries.entries()) {
    const layout = layouts[index] ?? "grouped";

    if (layout !== currentLayout) {
      pushCurrentSection();
      currentLayout = layout;
      currentEntries = [];
    }

    currentEntries.push(entry);
  }

  pushCurrentSection();

  return normalizedSections;
}

function normalizeControlsPanelLayout(
  controls: ToolcraftControlsPanelSchema,
): ToolcraftControlsPanelSchema {
  const { bodySections, stickyFooterSections } = splitControlsPanelActionSections(
    controls.sections,
  );

  return {
    ...controls,
    sections: [
      ...bodySections.flatMap(normalizeMixedSectionLayout),
      ...stickyFooterSections.flatMap(normalizeMixedSectionLayout),
    ],
  };
}

function normalizePanels({
  canvas,
  panels,
  settingsTransfer,
}: {
  canvas: ResolvedCanvas;
  panels: ToolcraftAppSchema["panels"];
  settingsTransfer: ResolvedToolcraftSettingsTransferSchema;
}): ResolvedToolcraftPanelsSchema {
  const normalizedTimeline = resolveTimelinePanel(panels.timeline);
  const normalizedPanels: ResolvedToolcraftPanelsSchema = {
    ...(panels.controls ? { controls: panels.controls } : {}),
    ...(panels.layers ? { layers: panels.layers } : {}),
    ...(normalizedTimeline ? { timeline: normalizedTimeline } : {}),
  };

  if (!panels.controls) {
    return normalizedPanels;
  }

  const controls = { ...panels.controls };
  const settingsTransferSection = createSettingsTransferSection(settingsTransfer);
  const renderScaleControl: ToolcraftControlSchema | undefined =
    canvas.renderScale.enabled
      ? {
          defaultValue: canvas.renderScale.defaultValue,
          description:
            "Increases raster canvas backing resolution without changing the visible output size.",
          label: "Resolution scale",
          markerCount:
            Math.floor(
              (canvas.renderScale.max - canvas.renderScale.min) / canvas.renderScale.step,
            ) + 1,
          max: canvas.renderScale.max,
          min: canvas.renderScale.min,
          performanceReason:
            "Resolution scale changes raster, Canvas, WebGL, or WebGPU backing pixels.",
          performanceRole: "workload",
          step: canvas.renderScale.step,
          target: canvasRenderScaleTarget,
          type: "slider",
          variant: "discrete",
        }
      : undefined;
  const timelineExtendedControl: ToolcraftControlSchema | undefined =
    normalizedTimeline?.enabled
      ? {
          defaultValue: false,
          description:
            "Shows the extended runtime timeline with scrubber, duration, loop, and keyframe controls; compact mode keeps only Play visible.",
          label: "Timeline",
          target: toolcraftTimelinePanelExtendedTarget,
          type: "switch",
        }
      : undefined;

  if (!canvas.enabled || canvas.sizing.mode !== "editable-output") {
    const runtimeSetupSection = renderScaleControl
      ? mergeCanvasRenderScaleIntoSettingsTransferSection({
          renderScaleControl,
          settingsTransferSection,
          timelineExtendedControl,
        })
      : timelineExtendedControl
        ? mergeTimelineExtendedIntoSettingsTransferSection({
            settingsTransferSection,
            timelineExtendedControl,
          })
        : settingsTransferSection;

    return {
      ...normalizedPanels,
      controls: normalizeControlsPanelLayout({
        ...controls,
        sections: [
          runtimeSetupSection,
          ...controls.sections,
        ],
      }),
    };
  }

  const sizeControls: ToolcraftControlSectionSchema["controls"] = {};
  const sizeControlIds: string[] = [];
  const aspectRatioControl: ToolcraftControlSchema = {
    defaultValue: getCanvasAspectRatioDefaultValue(canvas.size),
    label: "Aspect ratio",
    orderRole: "input",
    performanceReason: "Aspect ratio changes output dimensions and renderer workload.",
    performanceRole: "workload",
    target: canvasAspectRatioTarget,
    type: "aspectRatio",
  };

  sizeControls.canvasWidth = {
    defaultValue: canvas.size.width,
    label: "Canvas width",
    orderRole: "input",
    performanceReason: "Canvas width changes output dimensions and renderer workload.",
    performanceRole: "workload",
    target: canvasSizeControlTargets.width,
    type: "text",
  };
  sizeControlIds.push("canvasWidth");

  sizeControls.canvasHeight = {
    defaultValue: canvas.size.height,
    label: "Canvas height",
    orderRole: "input",
    performanceReason: "Canvas height changes output dimensions and renderer workload.",
    performanceRole: "workload",
    target: canvasSizeControlTargets.height,
    type: "text",
  };
  sizeControlIds.push("canvasHeight");

  const runtimeSettingsSection = mergeCanvasSizeControlsIntoSettingsTransferSection({
    aspectRatioControl,
    renderScaleControl,
    settingsTransferSection,
    sizeControlIds,
    sizeControls,
    timelineExtendedControl,
  });

  return {
    ...normalizedPanels,
    controls: {
      ...normalizeControlsPanelLayout({
        ...controls,
        sections: [
          runtimeSettingsSection,
          ...controls.sections,
        ],
      }),
    },
  };
}

function resolveTimelinePanel(
  timeline: ToolcraftTimelinePanelSchema | undefined,
): ResolvedToolcraftTimelinePanelSchema | undefined {
  if (timeline === true) {
    return {
      defaultDurationSeconds: defaultTimelineDurationSeconds,
      enabled: true,
      mode: "keyframes",
    };
  }

  if (!timeline || timeline.enabled === false) {
    return undefined;
  }

  return {
    defaultDurationSeconds: normalizeTimelineDurationSeconds(timeline.defaultDurationSeconds),
    enabled: true,
    mode: timeline.mode ?? "keyframes",
  };
}

function normalizeTimelineDurationSeconds(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultTimelineDurationSeconds;
  }

  return Math.min(maxTimelineDurationSeconds, Math.max(minTimelineDurationSeconds, value));
}

function hasVisibleRuntimePanel({
  panels,
  toolbar,
}: {
  panels: ResolvedToolcraftPanelsSchema;
  toolbar: ResolvedToolbar;
}): boolean {
  return Boolean(
    panels.controls ||
      panels.layers ||
      panels.timeline ||
      toolbar.history ||
      toolbar.radar ||
      toolbar.theme ||
      toolbar.zoom,
  );
}

function assertPanelPersistenceContract({
  panels,
  persistence,
  toolbar,
}: {
  panels: ResolvedToolcraftPanelsSchema;
  persistence: ResolvedToolcraftAppSchema["persistence"];
  toolbar: ResolvedToolbar;
}): void {
  if (persistence.storage !== "localStorage" || !hasVisibleRuntimePanel({ panels, toolbar })) {
    return;
  }

  if (persistence.include.includes("panels")) {
    return;
  }

  throw new Error(
    'Toolcraft apps with visible runtime panels and localStorage persistence must include "panels" so dragged panel positions survive reload.',
  );
}

export function defineToolcraft(schema: ToolcraftAppSchema): ResolvedToolcraftAppSchema {
  const canvasEnabled = schema.canvas.enabled;
  const canvasSize = schema.canvas.size;
  const canvasRenderScale = resolveCanvasRenderScale(schema.canvas.renderScale);
  const canvasSizing = resolveCanvasSizing(schema.canvas);
  const persistence = resolvePersistence(schema.persistence);
  const settingsTransfer = resolveSettingsTransfer({
    controls: schema.panels.controls,
    persistence,
    settingsTransfer: schema.settingsTransfer,
  });
  const canvas = {
    ...schema.canvas,
    draggable: canvasEnabled ? (schema.canvas.draggable ?? true) : false,
    renderScale: canvasRenderScale,
    size: canvasSize ?? defaultCanvasSize,
    sizeSource: canvasSize ? ("app" as const) : ("runtime-default" as const),
    sizing: canvasSizing,
    upload: schema.canvas.upload ?? false,
  };
  const panels = normalizePanels({
    canvas,
    panels: schema.panels,
    settingsTransfer,
  });
  const toolbar = {
    history: schema.toolbar?.history ?? canvasEnabled,
    radar: schema.toolbar?.radar ?? canvasEnabled,
    theme: schema.toolbar?.theme ?? true,
    zoom: schema.toolbar?.zoom ?? canvasEnabled,
  };
  const exportSchema = resolveExport(schema.export);
  const media = resolveMedia(schema.media);

  assertPanelPersistenceContract({ panels, persistence, toolbar });

  return {
    assembly: createToolcraftAssembly({
      canvas,
      panels,
      toolbar,
    }),
    canvas,
    export: exportSchema,
    media,
    panels,
    persistence,
    settingsTransfer,
    toolbar,
  };
}
