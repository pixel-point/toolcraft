import type {
  ToolcraftControlSchema,
  ResolvedToolcraftAppSchema,
} from "../schema/types";
import { isToolcraftRuntimeOwnedTarget } from "../schema/runtime-targets";

export type ToolcraftPerformanceInteraction =
  | "animation-frame"
  | "animation-viewport-drag"
  | "control-change"
  | "control-drag"
  | "export-copy"
  | "mask-drag"
  | "media-import"
  | "preview-render"
  | "timeline-playback"
  | "timeline-scrub"
  | "viewport-zoom-stress"
  | "viewport-stability";

export type ToolcraftPerformanceCoverage = {
  automated: boolean;
  automatedTestName: string;
  browser: boolean;
  browserTestName: string;
};

export type ToolcraftBrowserCheckPreferredRunner = "agent-browser";

export type ToolcraftBrowserCheckFallbackRunner = "playwright";

export type ToolcraftBrowserCheckFallbackCondition =
  | "agent-browser-unavailable"
  | "ci";

export type ToolcraftBrowserCheckPolicy = {
  fallbackRunner: ToolcraftBrowserCheckFallbackRunner;
  fallbackWhen: readonly ToolcraftBrowserCheckFallbackCondition[];
  preferredRunner: ToolcraftBrowserCheckPreferredRunner;
};

export type ToolcraftPerformanceBudget = {
  maxExportMs?: number;
  maxFrameGapMs?: number;
  maxInteractionMs?: number;
  maxLongTaskMs?: number;
  maxPreviewMs?: number;
  maxRenderMs?: number;
};

export type ToolcraftPerformanceValueSet = {
  default: unknown;
  max?: unknown;
  min?: unknown;
};

export type ToolcraftPerformanceFixtureKind =
  | "custom"
  | "high-density"
  | "large-canvas"
  | "large-text"
  | "many-items"
  | "max-value"
  | "media";

export type ToolcraftPerformanceLoadMetric =
  | "canvas-area"
  | "count"
  | "custom"
  | "media-area"
  | "numeric-max"
  | "numeric-min"
  | "text-length";

export type ToolcraftPerformanceUserFacingRange =
  | "experimental-above-smooth"
  | "fully-guaranteed";

export type ToolcraftPerformanceLoadEvidence = {
  attemptedTarget: unknown;
  decision: string;
  measuredResult: string;
  optimizationAttempted?: string;
  result: "failed" | "passed";
  scenarioId: string;
};

export type ToolcraftPerformanceLoadProfile = {
  degradationStepPercent?: 10;
  evidence?: readonly ToolcraftPerformanceLoadEvidence[];
  hardLimit: unknown;
  metric: ToolcraftPerformanceLoadMetric;
  smoothTarget: unknown;
  smoothTargetRatio: number;
  target: string;
  userFacingRange: ToolcraftPerformanceUserFacingRange;
};

export type ToolcraftPerformanceFixture = {
  kind: ToolcraftPerformanceFixtureKind;
  loadProfile?: ToolcraftPerformanceLoadProfile;
  minChars?: number;
  minCount?: number;
  minLines?: number;
  reason: string;
  value?: unknown;
};

export type ToolcraftPerformanceStressFixtureKind = ToolcraftPerformanceFixtureKind;
export type ToolcraftPerformanceStressFixture = ToolcraftPerformanceFixture;
export type ToolcraftPerformanceWorkloadFixture = ToolcraftPerformanceFixture;

export type ToolcraftPerformanceScenario = ToolcraftPerformanceCoverage & {
  budget: ToolcraftPerformanceBudget;
  controlLabel?: string;
  expectedObservable: string;
  fixture: string;
  id: string;
  interaction: ToolcraftPerformanceInteraction;
  target?: string;
  stress?: boolean;
  stressFixture?: ToolcraftPerformanceStressFixture;
  workloadFixture?: ToolcraftPerformanceWorkloadFixture;
  uiSelector?: string;
  values?: ToolcraftPerformanceValueSet;
  workload: boolean;
};

export type ToolcraftRendererStrategy =
  | "none"
  | "dom"
  | "svg"
  | "canvas-2d"
  | "webgl"
  | "webgpu";

export type ToolcraftRendererWorkload =
  | "none"
  | "simple-composition"
  | "text-output"
  | "vector-output"
  | "pixel-output";

export type ToolcraftSourceRepresentation =
  | "reference-runtime"
  | "dom-text"
  | "svg"
  | "canvas-2d"
  | "webgl-texture"
  | "webgpu-texture"
  | "image-media"
  | "video-media"
  | "procedural-data"
  | "mixed";

export type ToolcraftProductRepresentation =
  | "text"
  | "vector"
  | "pixel"
  | "video"
  | "mixed";

export type ToolcraftPreviewRenderer =
  | "dom"
  | "svg"
  | "canvas-2d"
  | "webgl"
  | "webgpu";

export type ToolcraftExportRenderer =
  | "none"
  | "dom"
  | "svg"
  | "canvas-2d"
  | "webgl"
  | "webgpu"
  | "media-recorder"
  | "webcodecs";

export type ToolcraftRendererLayerKind =
  | "background"
  | "product-foreground"
  | "editing-handles"
  | "export-composite";

export type ToolcraftRendererLayerContent =
  | "bitmap-media"
  | "composite"
  | "dense-pattern"
  | "geometry"
  | "handles"
  | "noise"
  | "shader"
  | "text";

export type ToolcraftRendererLayerPrimitiveCount = "low" | "medium" | "high";

export type ToolcraftRendererLayerExportMode =
  | "included"
  | "excluded"
  | "composited";

export type ToolcraftRendererLayer = {
  content: readonly ToolcraftRendererLayerContent[];
  exportMode: ToolcraftRendererLayerExportMode;
  id: string;
  intentionalRasterizationReason?: string;
  kind: ToolcraftRendererLayerKind;
  primitiveCount: ToolcraftRendererLayerPrimitiveCount;
  renderer: Exclude<ToolcraftRendererStrategy, "none">;
  uiSelector?: string;
};

export type ToolcraftRendererMeasuredAlternativeEvidence = {
  alternativeStrategy: "webgl" | "webgpu";
  decision: string;
  fixture: string;
  measuredResult: string;
  scenarioId: string;
};

export type ToolcraftRendererTechnique = {
  exportRenderer: ToolcraftExportRenderer;
  fidelityRisks: readonly string[];
  intentionalRasterizationReason?: string;
  layers?: readonly ToolcraftRendererLayer[];
  measuredAlternativeEvidence?: readonly ToolcraftRendererMeasuredAlternativeEvidence[];
  performanceRisks: readonly string[];
  previewExportDifferenceReason?: string;
  previewRenderer: ToolcraftPreviewRenderer;
  productRepresentation: ToolcraftProductRepresentation;
  referenceRendererChangeReason?: string;
  rendererStrategy: ToolcraftRendererStrategy;
  rendererWorkload: ToolcraftRendererWorkload;
  sourceRepresentation: ToolcraftSourceRepresentation;
  whyNotAlternativeStrategies: readonly string[];
};

export type ToolcraftRenderPassKind =
  | "decode"
  | "preprocess"
  | "pixel-transform"
  | "vector-build"
  | "text-layout"
  | "rasterize"
  | "composite"
  | "handles"
  | "export";

export type ToolcraftRenderPassRunLocation =
  | "main"
  | "worker"
  | "gpu"
  | "worker-or-gpu"
  | "export-only";

export type ToolcraftRenderPassOutput =
  | "source"
  | "intermediate"
  | "preview"
  | "overlay"
  | "export";

export type ToolcraftRenderPassQuality = "preview" | "full" | "retina" | "export";

export type ToolcraftRenderPass = {
  cacheKey?: readonly string[];
  id: string;
  inputs: readonly string[];
  invalidatedBy: readonly string[];
  kind: ToolcraftRenderPassKind;
  output: ToolcraftRenderPassOutput;
  quality: ToolcraftRenderPassQuality;
  runsOn: ToolcraftRenderPassRunLocation;
};

export type ToolcraftPipelineInteraction =
  | "animation-frame"
  | "control-change"
  | "control-drag"
  | "media-import"
  | "mask-drag"
  | "viewport-drag"
  | "viewport-zoom"
  | "timeline-playback"
  | "timeline-scrub"
  | "export";

export type ToolcraftInteractionInvalidation = {
  interaction: ToolcraftPipelineInteraction;
  invalidates: readonly string[];
  mustNotInvalidate?: readonly string[];
  targets: readonly string[];
};

export type ToolcraftRendererPipeline = {
  interactionInvalidation: readonly ToolcraftInteractionInvalidation[];
  passes: readonly ToolcraftRenderPass[];
};

export type ToolcraftPerformanceConfig = {
  browserCheckPolicy?: ToolcraftBrowserCheckPolicy;
  rendererPipeline?: ToolcraftRendererPipeline;
  rendererStrategy: ToolcraftRendererStrategy;
  rendererTechnique?: ToolcraftRendererTechnique;
  rendererWorkload: ToolcraftRendererWorkload;
  scenarios: readonly ToolcraftPerformanceScenario[];
  usesCustomRenderer: boolean;
  workloadTargets: readonly string[];
};

export type ToolcraftPerformanceSensitiveControl = {
  control: ToolcraftControlSchema;
  controlId: string;
  target: string;
};

export type ToolcraftUnclassifiedPerformanceControl = {
  control: ToolcraftControlSchema;
  controlId: string;
  target: string;
};

const maxPerformanceBudgetCaps: Required<ToolcraftPerformanceBudget> = {
  maxExportMs: 8000,
  maxFrameGapMs: 120,
  maxInteractionMs: 2000,
  maxLongTaskMs: 250,
  maxPreviewMs: 2000,
  maxRenderMs: 2000,
};

export const defaultToolcraftBrowserCheckPolicy: ToolcraftBrowserCheckPolicy = {
  fallbackRunner: "playwright",
  fallbackWhen: ["agent-browser-unavailable", "ci"],
  preferredRunner: "agent-browser",
};

export function defineToolcraftPerformance(
  config: ToolcraftPerformanceConfig,
): ToolcraftPerformanceConfig & { browserCheckPolicy: ToolcraftBrowserCheckPolicy } {
  return {
    ...config,
    browserCheckPolicy: {
      ...defaultToolcraftBrowserCheckPolicy,
      ...config.browserCheckPolicy,
      fallbackWhen:
        config.browserCheckPolicy?.fallbackWhen ??
        defaultToolcraftBrowserCheckPolicy.fallbackWhen,
    },
  };
}

const workloadControlPattern =
  /char\s*size|cell|density|glyph|grid|iteration|matrix|particle|quality|radius|resolution|sample|scale|size/i;

const heavyTextInputPattern = /code|css|instruction|json|prompt|script|shader|template/i;

const largeTextStressMinChars = 50_000;
const largeTextStressMinLines = 1_000;
const mediaStressMinArea = 1920 * 1080;
const mediaStressMinLongEdge = 1920;

const performanceFixtureKinds = new Set<ToolcraftPerformanceFixtureKind>([
  "custom",
  "high-density",
  "large-canvas",
  "large-text",
  "many-items",
  "max-value",
  "media",
]);

const performanceLoadMetrics = new Set<ToolcraftPerformanceLoadMetric>([
  "canvas-area",
  "count",
  "custom",
  "media-area",
  "numeric-max",
  "numeric-min",
  "text-length",
]);

const performanceUserFacingRanges = new Set<ToolcraftPerformanceUserFacingRange>([
  "experimental-above-smooth",
  "fully-guaranteed",
]);

const browserCheckPreferredRunners = new Set<ToolcraftBrowserCheckPreferredRunner>([
  "agent-browser",
]);

const browserCheckFallbackRunners = new Set<ToolcraftBrowserCheckFallbackRunner>([
  "playwright",
]);

const browserCheckFallbackConditions = new Set<ToolcraftBrowserCheckFallbackCondition>([
  "agent-browser-unavailable",
  "ci",
]);

const loadProfileRequiredFixtureKinds = new Set<ToolcraftPerformanceFixtureKind>([
  "high-density",
  "large-canvas",
  "many-items",
  "max-value",
  "media",
]);

const renderPassKinds = new Set<ToolcraftRenderPassKind>([
  "decode",
  "preprocess",
  "pixel-transform",
  "vector-build",
  "text-layout",
  "rasterize",
  "composite",
  "handles",
  "export",
]);

const renderPassRunLocations = new Set<ToolcraftRenderPassRunLocation>([
  "main",
  "worker",
  "gpu",
  "worker-or-gpu",
  "export-only",
]);

const renderPassOutputs = new Set<ToolcraftRenderPassOutput>([
  "source",
  "intermediate",
  "preview",
  "overlay",
  "export",
]);

const renderPassQualities = new Set<ToolcraftRenderPassQuality>([
  "preview",
  "full",
  "retina",
  "export",
]);

const pipelineInteractions = new Set<ToolcraftPipelineInteraction>([
  "animation-frame",
  "control-change",
  "control-drag",
  "media-import",
  "mask-drag",
  "viewport-drag",
  "viewport-zoom",
  "timeline-playback",
  "timeline-scrub",
  "export",
]);

const expensiveRenderPassKinds = new Set<ToolcraftRenderPassKind>([
  "decode",
  "preprocess",
  "pixel-transform",
  "text-layout",
  "rasterize",
]);

const cacheRequiredRenderPassKinds = new Set<ToolcraftRenderPassKind>([
  ...expensiveRenderPassKinds,
  "composite",
]);

const highFrequencyViewportInteractions = new Set<ToolcraftPipelineInteraction>([
  "animation-frame",
  "mask-drag",
  "timeline-playback",
  "timeline-scrub",
  "viewport-drag",
  "viewport-zoom",
]);

const vaguePipelineReferencePattern =
  /^(?:all|all values|everything|props|runtime|settings|state|values)$/i;

function getControlSemanticText(control: ToolcraftControlSchema): string {
  return [
    control.target,
    typeof control.label === "string" ? control.label : "",
    control.unit ?? "",
    control.valueLabel ?? "",
    control.xLabel ?? "",
    control.yLabel ?? "",
    ...(control.options ?? []).flatMap((option) => [option.label, option.value]),
  ].join(" ");
}

function isSemanticallyWorkloadControl(control: ToolcraftControlSchema): boolean {
  const semanticText = getControlSemanticText(control);

  if (control.type === "code" || control.type === "text") {
    return heavyTextInputPattern.test(semanticText);
  }

  return workloadControlPattern.test(semanticText);
}

function isPotentialWorkloadControl(control: ToolcraftControlSchema): boolean {
  return control.performanceRole === "workload" || isSemanticallyWorkloadControl(control);
}

export function collectToolcraftPerformanceSensitiveControls(
  schema: ResolvedToolcraftAppSchema,
): ToolcraftPerformanceSensitiveControl[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls)
      .filter(
        ([, control]) =>
          !isToolcraftRuntimeOwnedTarget(control.target) && isPotentialWorkloadControl(control),
      )
      .map(([controlId, control]) => ({
        control,
        controlId,
        target: control.target,
      })),
  );
}

function collectToolcraftPerformanceRoleConflicts(
  schema: ResolvedToolcraftAppSchema,
): ToolcraftPerformanceSensitiveControl[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls)
      .filter(
        ([, control]) =>
          !isToolcraftRuntimeOwnedTarget(control.target) &&
          control.performanceRole === "responsiveness" &&
          isSemanticallyWorkloadControl(control),
      )
      .map(([controlId, control]) => ({
        control,
        controlId,
        target: control.target,
      })),
  );
}

export function collectToolcraftUnclassifiedPerformanceControls(
  schema: ResolvedToolcraftAppSchema,
): ToolcraftUnclassifiedPerformanceControl[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls)
      .filter(
        ([, control]) =>
          control.type !== "panelActions" &&
          control.type !== "settingsTransfer" &&
          !isToolcraftRuntimeOwnedTarget(control.target) &&
          control.performanceRole !== "workload" &&
          control.performanceRole !== "responsiveness",
      )
      .map(([controlId, control]) => ({
        control,
        controlId,
        target: control.target,
      })),
  );
}

function hasAnyBudget(budget: ToolcraftPerformanceBudget): boolean {
  return Object.values(budget).some((value) => typeof value === "number" && value > 0);
}

function hasMinDefaultMax(values: ToolcraftPerformanceScenario["values"]): boolean {
  return values !== undefined && "default" in values && "min" in values && "max" in values;
}

function getBrowserCheckPolicyErrors(config: ToolcraftPerformanceConfig): string[] {
  const errors: string[] = [];
  const policy = config.browserCheckPolicy ?? defaultToolcraftBrowserCheckPolicy;
  const fallbackWhen = policy.fallbackWhen as unknown;

  if (
    !browserCheckPreferredRunners.has(
      policy.preferredRunner as ToolcraftBrowserCheckPreferredRunner,
    )
  ) {
    errors.push(
      'browserCheckPolicy.preferredRunner must be "agent-browser" so AI agents use their controlled browser before fallback automation.',
    );
  }

  if (
    !browserCheckFallbackRunners.has(
      policy.fallbackRunner as ToolcraftBrowserCheckFallbackRunner,
    )
  ) {
    errors.push(
      'browserCheckPolicy.fallbackRunner must be "playwright" so generated apps keep a portable CI/non-agent fallback.',
    );
  }

  if (!Array.isArray(fallbackWhen)) {
    errors.push(
      'browserCheckPolicy.fallbackWhen must include "agent-browser-unavailable" and "ci".',
    );
    return errors;
  }

  for (const condition of fallbackWhen) {
    if (
      !browserCheckFallbackConditions.has(
        condition as ToolcraftBrowserCheckFallbackCondition,
      )
    ) {
      errors.push(
        `browserCheckPolicy.fallbackWhen contains unsupported condition "${String(
          condition,
        )}".`,
      );
    }
  }

  if (!fallbackWhen.includes("agent-browser-unavailable")) {
    errors.push(
      'browserCheckPolicy.fallbackWhen must include "agent-browser-unavailable" so Playwright is only used when no agent browser exists.',
    );
  }

  if (!fallbackWhen.includes("ci")) {
    errors.push(
      'browserCheckPolicy.fallbackWhen must include "ci" so CI/non-agent automation has a portable performance runner.',
    );
  }

  return errors;
}

function getSliderDragControlType(
  control: ToolcraftControlSchema | undefined,
): "rangeSlider" | "slider" | null {
  if (control?.type === "slider" || control?.type === "rangeSlider") {
    return control.type;
  }

  return null;
}

function hasControlDragScenario(scenarios: readonly ToolcraftPerformanceScenario[]): boolean {
  return scenarios.some((scenario) => scenario.interaction === "control-drag");
}

function hasPerformanceFixtureValue(
  fixture: ToolcraftPerformanceFixture,
): fixture is ToolcraftPerformanceFixture & { value: unknown } {
  return Object.prototype.hasOwnProperty.call(fixture, "value");
}

function isPerformanceFixtureObjectValue(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getMediaStressFixtureDimensions(
  value: unknown,
): { height: number; width: number } | null {
  if (!isPerformanceFixtureObjectValue(value)) {
    return null;
  }

  const width = Number(value.width);
  const height = Number(value.height);

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  return { height, width };
}

function getTextLineCount(value: string): number {
  if (value.length === 0) {
    return 0;
  }

  return value.split(/\r\n|\r|\n/).length;
}

function getPerformanceFixtureLargeTextValueErrors(
  scenarioId: string,
  valueLabel: string,
  value: unknown,
  options: {
    minChars?: number;
    minLines?: number;
  } = {},
): string[] {
  const errors: string[] = [];

  if (typeof value !== "string") {
    errors.push(`${scenarioId} ${valueLabel} must be a string.`);
    return errors;
  }

  const minChars = options.minChars ?? largeTextStressMinChars;
  const minLines = options.minLines ?? largeTextStressMinLines;

  if (minChars < largeTextStressMinChars) {
    errors.push(`${scenarioId} ${valueLabel}.minChars must be >= ${largeTextStressMinChars}.`);
  }

  if (minLines < largeTextStressMinLines) {
    errors.push(`${scenarioId} ${valueLabel}.minLines must be >= ${largeTextStressMinLines}.`);
  }

  if (value.length < minChars) {
    errors.push(`${scenarioId} ${valueLabel} must contain at least ${minChars} characters.`);
  }

  if (getTextLineCount(value) < minLines) {
    errors.push(`${scenarioId} ${valueLabel} must contain at least ${minLines} lines.`);
  }

  return errors;
}

function getLastFixturePathSegment(path: string): string {
  return path.split(/[._-]/).filter(Boolean).at(-1) ?? path;
}

function isCustomLargeTextFixturePath(path: string): boolean {
  return /^(?:content|text|prompt|code|script|shader|template|json|css)$/i.test(
    getLastFixturePathSegment(path),
  );
}

function isCustomMediaFixturePath(path: string): boolean {
  return /(?:^|[._-])(?:media|image|video|sourceMedia|sourceImage)(?:$|[._-])/i.test(path);
}

function isCustomRenderScaleFixturePath(path: string): boolean {
  return /^(?:canvas\.)?renderScale$|(?:^|[._-])resolutionScale$/i.test(path);
}

function isCustomCountFixturePath(path: string): boolean {
  return /(?:^|[._-])(?:count|items|layers|particles|points|rows|columns|density|detail|quality|samples|iterations)(?:$|[._-])/i.test(
    path,
  );
}

function customFixtureValueNeedsLoadProfile(value: unknown, pathPrefix = ""): boolean {
  if (!isPerformanceFixtureObjectValue(value)) {
    return false;
  }

  return Object.entries(value).some(([key, itemValue]) => {
    const itemPath = pathPrefix ? `${pathPrefix}.${key}` : key;

    if (
      isCustomLargeTextFixturePath(itemPath) ||
      isCustomMediaFixturePath(itemPath) ||
      isCustomRenderScaleFixturePath(itemPath) ||
      isCustomCountFixturePath(itemPath)
    ) {
      return true;
    }

    if (typeof itemValue === "number" && Number.isFinite(itemValue)) {
      return true;
    }

    return customFixtureValueNeedsLoadProfile(itemValue, itemPath);
  });
}

function getSortedJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(getSortedJsonValue);
  }

  if (isPerformanceFixtureObjectValue(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, itemValue]) => [key, getSortedJsonValue(itemValue)]),
    );
  }

  return value;
}

function arePerformanceFixtureValuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(getSortedJsonValue(left)) === JSON.stringify(getSortedJsonValue(right));
}

function getNumericFixtureValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getCountFixtureValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.length;
  }

  if (isPerformanceFixtureObjectValue(value)) {
    const count = Number(value.count ?? value.items ?? value.length);

    if (Number.isFinite(count)) {
      return count;
    }

    if (Array.isArray(value.items)) {
      return value.items.length;
    }
  }

  return null;
}

function getAreaFixtureDimensions(value: unknown): { height: number; width: number } | null {
  return getMediaStressFixtureDimensions(value);
}

function getAreaFixtureValue(value: unknown): number | null {
  const dimensions = getAreaFixtureDimensions(value);

  if (!dimensions) {
    return null;
  }

  return dimensions.width * dimensions.height;
}

function formatLoadProfileRatio(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function getLoadProfileActualSmoothRatio(
  profile: ToolcraftPerformanceLoadProfile,
): number | null {
  if (profile.metric === "numeric-max") {
    const hardLimit = getNumericFixtureValue(profile.hardLimit);
    const smoothTarget = getNumericFixtureValue(profile.smoothTarget);

    return hardLimit !== null && smoothTarget !== null && hardLimit > 0
      ? smoothTarget / hardLimit
      : null;
  }

  if (profile.metric === "numeric-min") {
    const hardLimit = getNumericFixtureValue(profile.hardLimit);
    const smoothTarget = getNumericFixtureValue(profile.smoothTarget);

    return hardLimit !== null && smoothTarget !== null && smoothTarget > 0
      ? hardLimit / smoothTarget
      : null;
  }

  if (profile.metric === "count") {
    const hardLimit = getCountFixtureValue(profile.hardLimit);
    const smoothTarget = getCountFixtureValue(profile.smoothTarget);

    return hardLimit !== null && smoothTarget !== null && hardLimit > 0
      ? smoothTarget / hardLimit
      : null;
  }

  if (profile.metric === "canvas-area" || profile.metric === "media-area") {
    const hardArea = getAreaFixtureValue(profile.hardLimit);
    const smoothArea = getAreaFixtureValue(profile.smoothTarget);

    return hardArea !== null && smoothArea !== null && hardArea > 0
      ? smoothArea / hardArea
      : null;
  }

  return null;
}

function getLoadProfileSmoothTargetRatioError(
  label: string,
  profile: ToolcraftPerformanceLoadProfile,
): string | null {
  const declaredRatio = profile.smoothTargetRatio;

  if (
    typeof declaredRatio !== "number" ||
    !Number.isFinite(declaredRatio) ||
    declaredRatio <= 0 ||
    declaredRatio > 1
  ) {
    return null;
  }

  if (
    declaredRatio === 1 &&
    !arePerformanceFixtureValuesEqual(profile.smoothTarget, profile.hardLimit)
  ) {
    return `${label}.smoothTargetRatio 1 requires smoothTarget to equal hardLimit.`;
  }

  const actualRatio = getLoadProfileActualSmoothRatio(profile);

  if (actualRatio === null) {
    return null;
  }

  const tolerance = 0.0001;

  if (declaredRatio === 1) {
    return Math.abs(actualRatio - 1) <= tolerance
      ? null
      : `${label}.smoothTargetRatio 1 must describe the actual smooth target ratio ${formatLoadProfileRatio(actualRatio)}.`;
  }

  const previousStepRatio = Math.min(1, declaredRatio + 0.1);

  return actualRatio >= declaredRatio - tolerance &&
    actualRatio < previousStepRatio - tolerance
    ? null
    : `${label}.smoothTargetRatio ${formatLoadProfileRatio(declaredRatio)} must describe the actual smooth target ratio ${formatLoadProfileRatio(actualRatio)}.`;
}

function fixtureRequiresLoadProfile(fixture: ToolcraftPerformanceFixture): boolean {
  return (
    loadProfileRequiredFixtureKinds.has(fixture.kind) ||
    (fixture.kind === "custom" && customFixtureValueNeedsLoadProfile(fixture.value))
  );
}

function getLoadProfileRatioStepCount(ratio: number): number {
  return Math.round((1 - ratio) / 0.1);
}

function isTenPercentRatioStep(ratio: number): boolean {
  return Math.abs(ratio * 10 - Math.round(ratio * 10)) < 0.0001;
}

function getSchemaNumericHardLimit(
  control: ToolcraftControlSchema | undefined,
  metric: ToolcraftPerformanceLoadMetric,
): number | null {
  if (!control || (metric !== "numeric-max" && metric !== "numeric-min")) {
    return null;
  }

  const value = metric === "numeric-max" ? control.max : control.min;

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getPerformanceLoadProfileErrors(
  scenario: ToolcraftPerformanceScenario,
  fieldName: "stressFixture" | "workloadFixture",
  fixture: ToolcraftPerformanceFixture,
  control: ToolcraftControlSchema | undefined,
): string[] {
  const errors: string[] = [];
  const profile = fixture.loadProfile;

  if (!profile) {
    return fixtureRequiresLoadProfile(fixture)
      ? [
          `${scenario.id} ${fieldName}.loadProfile must declare hardLimit, smoothTarget, and smoothTargetRatio so performance workload is a measured smooth target rather than a hidden toy fixture.`,
        ]
      : [];
  }

  const label = `${scenario.id} ${fieldName}.loadProfile`;

  if (!profile.target.trim()) {
    errors.push(`${label}.target must name the product workload target.`);
  }

  if (!performanceLoadMetrics.has(profile.metric)) {
    errors.push(`${label}.metric "${profile.metric}" is not supported.`);
  }

  if (!performanceUserFacingRanges.has(profile.userFacingRange)) {
    errors.push(`${label}.userFacingRange "${profile.userFacingRange}" is not supported.`);
  }

  if (
    typeof profile.smoothTargetRatio !== "number" ||
    !Number.isFinite(profile.smoothTargetRatio) ||
    profile.smoothTargetRatio <= 0 ||
    profile.smoothTargetRatio > 1
  ) {
    errors.push(`${label}.smoothTargetRatio must be > 0 and <= 1.`);
  } else if (!isTenPercentRatioStep(profile.smoothTargetRatio)) {
    errors.push(`${label}.smoothTargetRatio must use 10 percent steps such as 1, 0.9, or 0.8.`);
  }

  const smoothTargetRatioError = getLoadProfileSmoothTargetRatioError(label, profile);

  if (smoothTargetRatioError) {
    errors.push(smoothTargetRatioError);
  }

  if (!hasPerformanceFixtureValue(fixture)) {
    errors.push(`${label}.smoothTarget cannot be checked because ${fieldName}.value is missing.`);
  } else if (!arePerformanceFixtureValuesEqual(profile.smoothTarget, fixture.value)) {
    errors.push(`${label}.smoothTarget must match ${fieldName}.value so browser tests apply the documented smooth workload target.`);
  }

  const schemaHardLimit = getSchemaNumericHardLimit(control, profile.metric);

  if (
    schemaHardLimit !== null &&
    !arePerformanceFixtureValuesEqual(profile.hardLimit, schemaHardLimit)
  ) {
    errors.push(`${label}.hardLimit must match schema ${profile.metric === "numeric-max" ? "max" : "min"} ${schemaHardLimit}.`);
  }

  if (profile.metric === "numeric-max" || profile.metric === "numeric-min") {
    const hardLimit = getNumericFixtureValue(profile.hardLimit);
    const smoothTarget = getNumericFixtureValue(profile.smoothTarget);

    if (hardLimit === null || smoothTarget === null) {
      errors.push(`${label}.${profile.metric} hardLimit and smoothTarget must be numeric.`);
    } else if (profile.metric === "numeric-max" && smoothTarget > hardLimit) {
      errors.push(`${label}.smoothTarget must be <= hardLimit for numeric-max workloads.`);
    } else if (profile.metric === "numeric-min" && smoothTarget < hardLimit) {
      errors.push(`${label}.smoothTarget must be >= hardLimit for numeric-min workloads.`);
    }
  }

  if (profile.metric === "count") {
    const hardLimit = getCountFixtureValue(profile.hardLimit);
    const smoothTarget = getCountFixtureValue(profile.smoothTarget);

    if (hardLimit === null || smoothTarget === null) {
      errors.push(`${label}.count hardLimit and smoothTarget must be numeric counts, arrays, or objects with count/items.`);
    } else if (smoothTarget > hardLimit) {
      errors.push(`${label}.smoothTarget count must be <= hardLimit count.`);
    }
  }

  if (profile.metric === "canvas-area" || profile.metric === "media-area") {
    const hardArea = getAreaFixtureValue(profile.hardLimit);
    const smoothArea = getAreaFixtureValue(profile.smoothTarget);

    if (hardArea === null || smoothArea === null) {
      errors.push(`${label}.${profile.metric} hardLimit and smoothTarget must include numeric width and height.`);
    } else if (smoothArea > hardArea) {
      errors.push(`${label}.smoothTarget area must be <= hardLimit area.`);
    }
  }

  if (fixture.kind === "many-items") {
    const smoothCount = getCountFixtureValue(fixture.value);

    if (typeof fixture.minCount !== "number" || fixture.minCount <= 0) {
      errors.push(`${scenario.id} ${fieldName}.minCount must be a positive number for many-items fixtures.`);
    } else if (smoothCount !== null && smoothCount < fixture.minCount) {
      errors.push(`${scenario.id} ${fieldName}.value must include at least ${fixture.minCount} items for many-items fixtures.`);
    }
  }

  if (
    typeof profile.smoothTargetRatio === "number" &&
    Number.isFinite(profile.smoothTargetRatio)
  ) {
    if (profile.smoothTargetRatio === 1) {
      if (profile.userFacingRange !== "fully-guaranteed") {
        errors.push(`${label}.userFacingRange must be "fully-guaranteed" when smoothTargetRatio is 1.`);
      }
    } else if (profile.smoothTargetRatio > 0 && profile.smoothTargetRatio < 1) {
      if (profile.degradationStepPercent !== 10) {
        errors.push(`${label}.degradationStepPercent must be 10 when smoothTargetRatio is below 1.`);
      }

      if (profile.userFacingRange !== "experimental-above-smooth") {
        errors.push(`${label}.userFacingRange must be "experimental-above-smooth" when smoothTargetRatio is below 1.`);
      }

      const expectedEvidenceCount = getLoadProfileRatioStepCount(profile.smoothTargetRatio);
      const evidence = profile.evidence ?? [];

      if (evidence.length < expectedEvidenceCount) {
        errors.push(`${label}.evidence must include failed measurements for each 10 percent step above smoothTargetRatio ${profile.smoothTargetRatio}.`);
      }

      for (const [index, entry] of evidence.entries()) {
        const evidenceLabel = `${label}.evidence[${index}]`;

        if (!entry.scenarioId.trim()) {
          errors.push(`${evidenceLabel}.scenarioId must name the measured scenario.`);
        }

        if (entry.result !== "failed") {
          errors.push(`${evidenceLabel}.result must be "failed" for degraded smooth targets.`);
        }

        if (!entry.measuredResult.trim()) {
          errors.push(`${evidenceLabel}.measuredResult must include the measured budget failure.`);
        }

        if (!entry.optimizationAttempted?.trim()) {
          errors.push(`${evidenceLabel}.optimizationAttempted must describe the optimization attempted before lowering the smooth target.`);
        }

        if (!entry.decision.trim()) {
          errors.push(`${evidenceLabel}.decision must explain why this target was rejected or lowered.`);
        }
      }
    }
  }

  return errors;
}

function getCustomPerformanceFixtureSemanticErrors(
  scenarioId: string,
  fieldName: "stressFixture" | "workloadFixture",
  value: Record<string, unknown>,
  pathPrefix = "",
): string[] {
  const errors: string[] = [];

  for (const [key, itemValue] of Object.entries(value)) {
    const itemPath = pathPrefix ? `${pathPrefix}.${key}` : key;
    const itemLabel = `custom ${fieldName}.${itemPath}`;

    if (isCustomLargeTextFixturePath(itemPath)) {
      errors.push(
        ...getPerformanceFixtureLargeTextValueErrors(
          scenarioId,
          itemLabel,
          itemValue,
        ),
      );
      continue;
    }

    if (isCustomMediaFixturePath(itemPath)) {
      const dimensions = getMediaStressFixtureDimensions(itemValue);

      if (!dimensions) {
        errors.push(
          `${scenarioId} ${itemLabel} must be an object with numeric width and height so browser tests can generate or load realistic media.`,
        );
      } else if (
        Math.max(dimensions.width, dimensions.height) < mediaStressMinLongEdge ||
        dimensions.width * dimensions.height < mediaStressMinArea
      ) {
        errors.push(
          `${scenarioId} ${itemLabel} must be at least 1920x1080-equivalent; received ${dimensions.width}x${dimensions.height}.`,
        );
      }
      continue;
    }

    if (isCustomRenderScaleFixturePath(itemPath)) {
      if (
        typeof itemValue !== "number" ||
        !Number.isFinite(itemValue) ||
        itemValue <= 1
      ) {
        errors.push(
          `${scenarioId} ${itemLabel} must be a numeric Resolution scale greater than 1 so browser tests prove high-resolution backing pixels.`,
        );
      }
      continue;
    }

    if (isPerformanceFixtureObjectValue(itemValue)) {
      errors.push(
        ...getCustomPerformanceFixtureSemanticErrors(
          scenarioId,
          fieldName,
          itemValue,
          itemPath,
        ),
      );
    }
  }

  return errors;
}

function isLargeTextWorkloadControl(
  control: ToolcraftControlSchema | undefined,
): boolean {
  if (
    !control ||
    (control.type !== "code" && control.type !== "text" && control.type !== "textarea")
  ) {
    return false;
  }

  return (
    control.type === "code" ||
    control.type === "textarea" ||
    heavyTextInputPattern.test(getControlSemanticText(control))
  );
}

function getPerformanceFixtureShapeErrors(
  scenario: ToolcraftPerformanceScenario,
  fieldName: "stressFixture" | "workloadFixture",
  fixture: ToolcraftPerformanceFixture,
  control: ToolcraftControlSchema | undefined,
  options: {
    requireLargeText?: boolean;
    requireMedia?: boolean;
  } = {},
): string[] {
  const errors: string[] = [];
  const scenarioId = scenario.id;

  if (!performanceFixtureKinds.has(fixture.kind)) {
    errors.push(`${scenarioId} ${fieldName}.kind "${fixture.kind}" is not supported.`);
  }

  if (options.requireMedia) {
    if (fixture.kind !== "media") {
      errors.push(
        `${scenarioId} media-import scenario must use ${fieldName}.kind "media" with a realistic uploaded source size.`,
      );
    }
  }

  if (!fixture.reason.trim()) {
    errors.push(
      `${scenarioId} ${fieldName} must explain why this is the heaviest useful fixture.`,
    );
  }

  if (!hasPerformanceFixtureValue(fixture)) {
    errors.push(
      `${scenarioId} ${fieldName} must include value so browser tests can apply the exact heavy state.`,
    );
  } else if (fixture.kind === "custom") {
    if (!isPerformanceFixtureObjectValue(fixture.value)) {
      errors.push(
        `${scenarioId} custom ${fieldName}.value must be an object with one key per heavy state part so browser tests can apply every key.`,
      );
    } else if (Object.keys(fixture.value).length === 0) {
      errors.push(
        `${scenarioId} custom ${fieldName}.value must include at least one heavy state key.`,
      );
    } else {
      errors.push(
        ...getCustomPerformanceFixtureSemanticErrors(
          scenarioId,
          fieldName,
          fixture.value,
        ),
      );
    }
  } else if (fixture.kind === "media") {
    const dimensions = getMediaStressFixtureDimensions(fixture.value);

    if (!dimensions) {
      errors.push(
        `${scenarioId} media ${fieldName}.value must be an object with numeric width and height so browser tests can generate or load a realistic source image.`,
      );
    } else if (
      Math.max(dimensions.width, dimensions.height) < mediaStressMinLongEdge ||
      dimensions.width * dimensions.height < mediaStressMinArea
    ) {
      errors.push(
        `${scenarioId} media ${fieldName}.value must be at least 1920x1080-equivalent; received ${dimensions.width}x${dimensions.height}.`,
      );
    }
  }

  if (!options.requireLargeText && fixture.kind !== "large-text") {
    errors.push(...getPerformanceLoadProfileErrors(scenario, fieldName, fixture, control));
    return errors;
  }

  if (fixture.kind !== "large-text") {
    errors.push(
      `${scenarioId} text workload scenario must use ${fieldName}.kind "large-text" with a real long text value.`,
    );
    return errors;
  }

  errors.push(
    ...getPerformanceFixtureLargeTextValueErrors(
      scenarioId,
      `large-text ${fieldName}.value`,
      fixture.value,
      {
        minChars: fixture.minChars,
        minLines: fixture.minLines,
      },
    ),
  );

  errors.push(...getPerformanceLoadProfileErrors(scenario, fieldName, fixture, control));

  return errors;
}

function getStressFixtureErrors(
  scenario: ToolcraftPerformanceScenario,
  control: ToolcraftControlSchema | undefined,
): string[] {
  const isMediaImport = scenario.interaction === "media-import";

  if (!scenario.workload && scenario.stress !== true && !scenario.stressFixture && !isMediaImport) {
    return [];
  }

  const fixture = scenario.stressFixture;

  if (!fixture) {
    if (isMediaImport) {
      return [
        `${scenario.id} media-import scenario must declare stressFixture.kind "media" with a realistic uploaded source size.`,
      ];
    }

    return scenario.workload
      ? [
          `${scenario.id} workload scenario must declare stressFixture with the real heaviest value used by browser performance tests.`,
        ]
      : [
          `${scenario.id} stress scenario must declare stressFixture with the real heaviest state used by browser performance tests.`,
        ];
  }

  const errors: string[] = [];

  if (isMediaImport && !scenario.workload) {
    errors.push(
      `${scenario.id} media-import scenario must set workload true because decoded source size changes renderer workload.`,
    );
  }

  errors.push(
    ...getPerformanceFixtureShapeErrors(scenario, "stressFixture", fixture, control, {
      requireLargeText: isLargeTextWorkloadControl(control),
      requireMedia: isMediaImport,
    }),
  );

  return errors;
}

function stressFixtureAlreadyDefinesIndependentWorkload(
  scenario: ToolcraftPerformanceScenario,
  control: ToolcraftControlSchema | undefined,
): boolean {
  return (
    scenario.stressFixture?.kind === "large-text" &&
    isLargeTextWorkloadControl(control)
  );
}

function isWorkloadBaselineSensitiveScenario(
  config: ToolcraftPerformanceConfig,
  scenario: ToolcraftPerformanceScenario,
  control: ToolcraftControlSchema | undefined,
): boolean {
  if (
    !scenario.workload ||
    (scenario.interaction !== "control-change" && scenario.interaction !== "control-drag")
  ) {
    return false;
  }

  if (!config.usesCustomRenderer) {
    return false;
  }

  if (config.rendererWorkload === "none" || config.rendererWorkload === "simple-composition") {
    return false;
  }

  return !stressFixtureAlreadyDefinesIndependentWorkload(scenario, control);
}

function getWorkloadFixtureErrors(
  config: ToolcraftPerformanceConfig,
  scenario: ToolcraftPerformanceScenario,
  control: ToolcraftControlSchema | undefined,
): string[] {
  const requiresBaseline = isWorkloadBaselineSensitiveScenario(config, scenario, control);
  const errors: string[] = [];

  if (scenario.workloadFixture && !scenario.stressFixture) {
    errors.push(
      `${scenario.id} workloadFixture must be paired with stressFixture so tests apply a heavy baseline and then the measured scenario value.`,
    );
  }

  if (!requiresBaseline && !scenario.workloadFixture) {
    return errors;
  }

  const fixture = scenario.workloadFixture;

  if (!fixture) {
    errors.push(
      `${scenario.id} workload control scenario must declare workloadFixture for the app's heavy baseline state; stressFixture covers the control value only.`,
    );
    return errors;
  }

  errors.push(
    ...getPerformanceFixtureShapeErrors(
      scenario,
      "workloadFixture",
      fixture,
      control,
    ),
  );

  return errors;
}

function hasPositiveBudgetField(
  budget: ToolcraftPerformanceBudget,
  field: keyof ToolcraftPerformanceBudget,
): boolean {
  const value = budget[field];
  return typeof value === "number" && value > 0;
}

function getMissingInteractionBudgetFields(
  scenario: ToolcraftPerformanceScenario,
): string[] {
  switch (scenario.interaction) {
    case "animation-frame":
      return hasPositiveBudgetField(scenario.budget, "maxFrameGapMs")
        ? hasPositiveBudgetField(scenario.budget, "maxLongTaskMs")
          ? []
          : ["maxLongTaskMs"]
        : hasPositiveBudgetField(scenario.budget, "maxLongTaskMs")
          ? ["maxFrameGapMs"]
          : ["maxFrameGapMs", "maxLongTaskMs"];
    case "animation-viewport-drag":
    case "mask-drag":
    case "viewport-zoom-stress":
      return (["maxInteractionMs", "maxFrameGapMs", "maxLongTaskMs"] as const).filter(
        (field) => !hasPositiveBudgetField(scenario.budget, field),
      );
    case "viewport-stability":
      return hasPositiveBudgetField(scenario.budget, "maxFrameGapMs")
        ? []
        : ["maxFrameGapMs"];
    case "control-change":
    case "control-drag":
    case "media-import":
      return (["maxInteractionMs", "maxFrameGapMs"] as const).filter(
        (field) => !hasPositiveBudgetField(scenario.budget, field),
      );
    case "export-copy":
      return hasPositiveBudgetField(scenario.budget, "maxExportMs") ? [] : ["maxExportMs"];
    case "preview-render":
      return hasPositiveBudgetField(scenario.budget, "maxPreviewMs") ||
        hasPositiveBudgetField(scenario.budget, "maxRenderMs")
        ? []
        : ["maxPreviewMs or maxRenderMs"];
    case "timeline-playback":
      return (["maxFrameGapMs", "maxLongTaskMs"] as const).filter(
        (field) => !hasPositiveBudgetField(scenario.budget, field),
      );
    case "timeline-scrub":
      return (["maxInteractionMs", "maxFrameGapMs", "maxLongTaskMs"] as const).filter(
        (field) => !hasPositiveBudgetField(scenario.budget, field),
      );
  }
}

function getBudgetCapErrors(scenario: ToolcraftPerformanceScenario): string[] {
  return Object.entries(scenario.budget).flatMap(([field, value]) => {
    const budgetField = field as keyof ToolcraftPerformanceBudget;
    const cap = maxPerformanceBudgetCaps[budgetField];

    if (typeof value !== "number" || value <= cap) {
      return [];
    }

    return [`${scenario.id} ${budgetField} budget must be <= ${cap}ms, received ${value}ms.`];
  });
}

function requiresConcreteUiTarget(interaction: ToolcraftPerformanceInteraction): boolean {
  return (
    interaction === "control-change" ||
    interaction === "control-drag" ||
    interaction === "mask-drag" ||
    interaction === "timeline-playback" ||
    interaction === "timeline-scrub"
  );
}

function getAllSchemaControls(
  schema: ResolvedToolcraftAppSchema,
): ToolcraftControlSchema[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.values(section.controls),
  );
}

function getVisiblePerformanceControlTargets(schema: ResolvedToolcraftAppSchema): string[] {
  return getAllSchemaControls(schema)
    .filter((control) => control.type !== "panelActions")
    .map((control) => control.target);
}

function getActionValue(
  action: NonNullable<ToolcraftControlSchema["actions"]>[number],
): string {
  return typeof action === "string" ? action : action.value;
}

function hasOutputDeliveryAction(schema: ResolvedToolcraftAppSchema): boolean {
  return getAllSchemaControls(schema).some(
    (control) =>
      control.type === "panelActions" &&
      (control.actions ?? []).some((action) =>
        /copy|download|export/i.test(getActionValue(action)),
      ),
  );
}

function hasKeyframeTimeline(schema: ResolvedToolcraftAppSchema): boolean {
  return schema.panels.timeline?.enabled === true && schema.panels.timeline.mode === "keyframes";
}

function hasLayersPanel(schema: ResolvedToolcraftAppSchema): boolean {
  return schema.panels.layers === true;
}

function hasNonEmptyItems(items: readonly string[]): boolean {
  return items.some((item) => item.trim().length > 0);
}

const rasterRendererStrategies = new Set<ToolcraftRendererStrategy>([
  "canvas-2d",
  "webgl",
  "webgpu",
]);

const semanticForegroundContent = new Set<ToolcraftRendererLayerContent>([
  "geometry",
  "text",
]);

const detailHeavyRendererContent = new Set<ToolcraftRendererLayerContent>([
  "bitmap-media",
  "dense-pattern",
  "noise",
  "shader",
]);

const vectorLayerRendererStrategies = new Set<ToolcraftRendererStrategy>(["dom", "svg"]);

function getLayerContentFamily(content: ToolcraftRendererLayerContent): string {
  if (content === "geometry" || content === "handles") {
    return "vector";
  }

  if (content === "text") {
    return "text";
  }

  if (
    content === "bitmap-media" ||
    content === "dense-pattern" ||
    content === "noise" ||
    content === "shader"
  ) {
    return "pixel";
  }

  return "composite";
}

function hasSemanticForegroundContent(layer: ToolcraftRendererLayer): boolean {
  return layer.content.some((content) => semanticForegroundContent.has(content));
}

function hasDetailHeavyRendererLayer(
  technique: ToolcraftRendererTechnique | undefined,
): boolean {
  return (technique?.layers ?? []).some(
    (layer) =>
      layer.primitiveCount === "high" ||
      layer.content.some((content) => detailHeavyRendererContent.has(content)),
  );
}

function hasHighCountCanvas2DRendererLayer(
  technique: ToolcraftRendererTechnique | undefined,
): boolean {
  return (technique?.layers ?? []).some(
    (layer) =>
      layer.renderer === "canvas-2d" &&
      layer.primitiveCount === "high" &&
      (hasSemanticForegroundContent(layer) ||
        layer.content.some((content) => detailHeavyRendererContent.has(content))),
  );
}

function hasDetailHeavyCanvas2DRendererLayer(
  technique: ToolcraftRendererTechnique | undefined,
): boolean {
  return (technique?.layers ?? []).some(
    (layer) =>
      layer.renderer === "canvas-2d" &&
      layer.content.some((content) => detailHeavyRendererContent.has(content)),
  );
}

function getRendererMeasuredAlternativeEvidenceErrors(
  technique: ToolcraftRendererTechnique,
): string[] {
  return (technique.measuredAlternativeEvidence ?? []).flatMap((evidence, index) => {
    const label = `rendererTechnique.measuredAlternativeEvidence[${index}]`;
    const errors: string[] = [];

    if (evidence.alternativeStrategy !== "webgl" && evidence.alternativeStrategy !== "webgpu") {
      errors.push(`${label}.alternativeStrategy must be "webgl" or "webgpu".`);
    }

    if (!evidence.scenarioId.trim()) {
      errors.push(`${label}.scenarioId must name the measured performance scenario.`);
    }

    if (!evidence.fixture.trim()) {
      errors.push(`${label}.fixture must name the exact stress fixture that was measured.`);
    }

    if (!evidence.measuredResult.trim()) {
      errors.push(`${label}.measuredResult must summarize measured frame, interaction, render, or long-task results.`);
    }

    if (!evidence.decision.trim()) {
      errors.push(`${label}.decision must explain why the selected renderer remains appropriate.`);
    }

    return errors;
  });
}

function hasMeasuredGpuAlternativeEvidence(
  technique: ToolcraftRendererTechnique,
): boolean {
  return (technique.measuredAlternativeEvidence ?? []).some(
    (evidence) =>
      (evidence.alternativeStrategy === "webgl" ||
        evidence.alternativeStrategy === "webgpu") &&
      evidence.scenarioId.trim().length > 0 &&
      evidence.fixture.trim().length > 0 &&
      evidence.measuredResult.trim().length > 0 &&
      evidence.decision.trim().length > 0,
  );
}

function hasStressPreviewOrAnimationScenario(config: ToolcraftPerformanceConfig): boolean {
  return config.scenarios.some(
    (scenario) =>
      scenario.stress === true &&
      (scenario.interaction === "preview-render" ||
        scenario.interaction === "animation-frame"),
  );
}

function hasLongTaskBudgetScenario(config: ToolcraftPerformanceConfig): boolean {
  return config.scenarios.some((scenario) =>
    hasPositiveBudgetField(scenario.budget, "maxLongTaskMs"),
  );
}

function hasZoomSensitiveRenderer(config: ToolcraftPerformanceConfig): boolean {
  return (
    config.rendererWorkload === "text-output" ||
    config.rendererWorkload === "vector-output" ||
    config.rendererWorkload === "pixel-output" ||
    hasDetailHeavyRendererLayer(config.rendererTechnique)
  );
}

function getRendererLayerErrors(technique: ToolcraftRendererTechnique): string[] {
  const errors: string[] = [];
  const layers = technique.layers ?? [];

  if (technique.productRepresentation === "mixed" && layers.length === 0) {
    errors.push(
      'productRepresentation "mixed" requires rendererTechnique.layers so mixed output is machine-checkable.',
    );
  }

  if (technique.productRepresentation === "mixed") {
    const contentFamilies = new Set(
      layers.flatMap((layer) => layer.content.map((content) => getLayerContentFamily(content))),
    );
    contentFamilies.delete("composite");

    if (contentFamilies.size < 2) {
      errors.push(
        'productRepresentation "mixed" requires rendererTechnique.layers with at least two different content families.',
      );
    }
  }

  for (const layer of layers) {
    if (!layer.id.trim()) {
      errors.push("rendererTechnique layers must have non-empty ids.");
    }

    if (!hasNonEmptyItems(layer.content)) {
      errors.push(`rendererTechnique layer "${layer.id}" must list content.`);
    }

    if (
      layer.kind === "product-foreground" &&
      hasSemanticForegroundContent(layer) &&
      layer.primitiveCount !== "high" &&
      rasterRendererStrategies.has(layer.renderer) &&
      !layer.intentionalRasterizationReason?.trim()
    ) {
      errors.push(
        `rendererTechnique layer "${layer.id}" uses ${layer.renderer} for low-count semantic geometry/text. Use dom/svg for semantic foreground or provide intentionalRasterizationReason.`,
      );
    }

    if (
      (layer.kind === "product-foreground" || layer.kind === "editing-handles") &&
      !layer.uiSelector?.trim()
    ) {
      errors.push(
        `rendererTechnique layer "${layer.id}" is ${layer.kind} and must declare uiSelector so browser tests can verify the visible renderer layer.`,
      );
    }

    if (
      layer.kind === "editing-handles" &&
      (!vectorLayerRendererStrategies.has(layer.renderer) || layer.exportMode !== "excluded")
    ) {
      errors.push(
        `rendererTechnique layer "${layer.id}" is editing-handles and must use dom/svg with exportMode "excluded".`,
      );
    }
  }

  return errors;
}

function getRendererTechniqueErrors(config: ToolcraftPerformanceConfig): string[] {
  const errors: string[] = [];
  const technique = config.rendererTechnique;

  if (config.usesCustomRenderer && !technique) {
    return [
      "Custom renderers must declare rendererTechnique so renderer choice is machine-checkable.",
    ];
  }

  if (!config.usesCustomRenderer && technique) {
    errors.push("Non-custom renderer configs must omit rendererTechnique.");
  }

  if (!technique) {
    return errors;
  }

  if (technique.rendererWorkload !== config.rendererWorkload) {
    errors.push(
      `rendererTechnique.rendererWorkload "${technique.rendererWorkload}" must match rendererWorkload "${config.rendererWorkload}".`,
    );
  }

  if (technique.rendererStrategy !== config.rendererStrategy) {
    errors.push(
      `rendererTechnique.rendererStrategy "${technique.rendererStrategy}" must match rendererStrategy "${config.rendererStrategy}".`,
    );
  }

  if (config.usesCustomRenderer && !hasNonEmptyItems(technique.whyNotAlternativeStrategies)) {
    errors.push(
      "Custom renderer technique must explain why alternative renderer strategies were rejected.",
    );
  }

  if (config.usesCustomRenderer && !hasNonEmptyItems(technique.fidelityRisks)) {
    errors.push("Custom renderer technique must list fidelity risks.");
  }

  if (config.usesCustomRenderer && !hasNonEmptyItems(technique.performanceRisks)) {
    errors.push("Custom renderer technique must list performance risks.");
  }

  errors.push(...getRendererMeasuredAlternativeEvidenceErrors(technique));

  if (
    technique.productRepresentation === "text" &&
    technique.rendererWorkload !== "text-output" &&
    !technique.intentionalRasterizationReason?.trim()
  ) {
    errors.push(
      'productRepresentation "text" requires rendererWorkload "text-output" unless intentionalRasterizationReason is provided.',
    );
  }

  if (
    technique.productRepresentation === "vector" &&
    technique.rendererWorkload !== "vector-output" &&
    !technique.intentionalRasterizationReason?.trim()
  ) {
    errors.push(
      'productRepresentation "vector" requires rendererWorkload "vector-output" unless intentionalRasterizationReason is provided.',
    );
  }

  if (
    technique.productRepresentation === "pixel" &&
    technique.rendererWorkload !== "pixel-output"
  ) {
    errors.push('productRepresentation "pixel" requires rendererWorkload "pixel-output".');
  }

  if (
    technique.previewRenderer !== technique.exportRenderer &&
    technique.exportRenderer !== "none" &&
    !technique.previewExportDifferenceReason?.trim()
  ) {
    errors.push("Different preview/export renderers require previewExportDifferenceReason.");
  }

  if (
    technique.sourceRepresentation === "reference-runtime" &&
    technique.previewRenderer !== technique.rendererStrategy &&
    !technique.referenceRendererChangeReason?.trim()
  ) {
    errors.push("Reference runtime renderer changes require referenceRendererChangeReason.");
  }

  errors.push(...getRendererLayerErrors(technique));

  if (
    config.usesCustomRenderer &&
    technique.rendererStrategy === "canvas-2d" &&
    hasDetailHeavyCanvas2DRendererLayer(technique) &&
    !hasMeasuredGpuAlternativeEvidence(technique)
  ) {
    errors.push(
      "Detail-heavy Canvas 2D renderers must include rendererTechnique.measuredAlternativeEvidence for WebGL/WebGPU stress comparison before keeping the pixel work on CPU.",
    );
  }

  return errors;
}

function getPassById(
  pipeline: ToolcraftRendererPipeline,
): Map<string, ToolcraftRenderPass> {
  return new Map(pipeline.passes.map((pass) => [pass.id, pass]));
}

function hasMainThreadCanvasRasterCompositePreviewPressure(
  config: ToolcraftPerformanceConfig,
): boolean {
  if (config.rendererStrategy !== "canvas-2d" || !config.rendererPipeline) {
    return false;
  }

  const hasMainThreadRasterPass = config.rendererPipeline.passes.some(
    (pass) =>
      pass.runsOn === "main" &&
      (pass.kind === "rasterize" || pass.kind === "pixel-transform") &&
      (pass.output === "intermediate" || pass.output === "preview") &&
      (pass.quality === "full" || pass.quality === "retina"),
  );
  const hasMainThreadPreviewComposite = config.rendererPipeline.passes.some(
    (pass) =>
      pass.runsOn === "main" &&
      pass.kind === "composite" &&
      pass.output === "preview" &&
      (pass.quality === "full" || pass.quality === "retina"),
  );

  return hasMainThreadRasterPass && hasMainThreadPreviewComposite;
}

function hasPipelineReference(value: string): boolean {
  return value.trim().length > 0 && !vaguePipelineReferencePattern.test(value.trim());
}

function getPipelineReferenceErrors(
  passId: string,
  field: string,
  references: readonly string[] | undefined,
): string[] {
  if (!references || references.length === 0) {
    return [`rendererPipeline pass "${passId}" must list ${field}.`];
  }

  return references.flatMap((reference) =>
    hasPipelineReference(reference)
      ? []
      : [
          `rendererPipeline pass "${passId}" ${field} entry "${reference}" is too vague. Name the concrete runtime target, source key, resource key, or cache key part.`,
        ],
  );
}

function getPipelineInteractionForScenario(
  interaction: ToolcraftPerformanceInteraction,
): ToolcraftPipelineInteraction | null {
  switch (interaction) {
    case "animation-frame":
      return "animation-frame";
    case "animation-viewport-drag":
      return "viewport-drag";
    case "control-change":
      return "control-change";
    case "control-drag":
      return "control-drag";
    case "export-copy":
      return "export";
    case "mask-drag":
      return "mask-drag";
    case "media-import":
      return "media-import";
    case "preview-render":
      return null;
    case "timeline-playback":
      return "timeline-playback";
    case "timeline-scrub":
      return "timeline-scrub";
    case "viewport-zoom-stress":
      return "viewport-zoom";
    case "viewport-stability":
      return null;
  }
}

function getRendererPipelineErrors(
  _schema: ResolvedToolcraftAppSchema,
  config: ToolcraftPerformanceConfig,
): string[] {
  const errors: string[] = [];
  const pipeline = config.rendererPipeline;

  if (config.usesCustomRenderer && !pipeline) {
    return [
      "Custom renderers must declare rendererPipeline so render passes, cache keys, and invalidation are machine-checkable.",
    ];
  }

  if (!config.usesCustomRenderer && pipeline) {
    return ["Non-custom renderer configs must omit rendererPipeline."];
  }

  if (!pipeline) {
    return errors;
  }

  if (pipeline.passes.length === 0) {
    errors.push("rendererPipeline must declare at least one render pass.");
  }

  if (pipeline.interactionInvalidation.length === 0) {
    errors.push(
      "rendererPipeline must declare interactionInvalidation so high-frequency UI work cannot accidentally invalidate expensive passes.",
    );
  }

  const passIds = new Set<string>();

  for (const pass of pipeline.passes) {
    const passId = pass.id.trim();

    if (!passId) {
      errors.push("rendererPipeline passes must have non-empty ids.");
    } else if (passIds.has(passId)) {
      errors.push(`rendererPipeline pass id "${passId}" must be unique.`);
    } else {
      passIds.add(passId);
    }

    if (!renderPassKinds.has(pass.kind)) {
      errors.push(`rendererPipeline pass "${pass.id}" kind "${pass.kind}" is not supported.`);
    }

    if (!renderPassRunLocations.has(pass.runsOn)) {
      errors.push(
        `rendererPipeline pass "${pass.id}" runsOn "${pass.runsOn}" is not supported.`,
      );
    }

    if (!renderPassOutputs.has(pass.output)) {
      errors.push(
        `rendererPipeline pass "${pass.id}" output "${pass.output}" is not supported.`,
      );
    }

    if (!renderPassQualities.has(pass.quality)) {
      errors.push(
        `rendererPipeline pass "${pass.id}" quality "${pass.quality}" is not supported.`,
      );
    }

    errors.push(...getPipelineReferenceErrors(pass.id, "inputs", pass.inputs));
    errors.push(...getPipelineReferenceErrors(pass.id, "invalidatedBy", pass.invalidatedBy));

    if (pass.cacheKey) {
      errors.push(...getPipelineReferenceErrors(pass.id, "cacheKey", pass.cacheKey));
    }

    if (
      cacheRequiredRenderPassKinds.has(pass.kind) &&
      (!pass.cacheKey || pass.cacheKey.length === 0)
    ) {
      errors.push(
        `rendererPipeline pass "${pass.id}" is a cache-sensitive ${pass.kind} pass and must declare cacheKey so tests can reject full recomputation on every control change.`,
      );
    }

    if (pass.kind === "decode") {
      const hasMediaImportScenario = config.scenarios.some(
        (scenario) => scenario.interaction === "media-import",
      );

      if (!hasMediaImportScenario) {
        errors.push(
          `rendererPipeline pass "${pass.id}" decodes media, so performance scenarios must include media-import coverage.`,
        );
      }
    }
  }

  const passesById = getPassById(pipeline);
  const invalidationTargets = new Set<string>();
  const pipelineInteractionSet = new Set(
    pipeline.interactionInvalidation.map((invalidation) => invalidation.interaction),
  );

  for (const invalidation of pipeline.interactionInvalidation) {
    if (!pipelineInteractions.has(invalidation.interaction)) {
      errors.push(
        `rendererPipeline interaction "${invalidation.interaction}" is not supported.`,
      );
    }

    errors.push(
      ...getPipelineReferenceErrors(
        invalidation.interaction,
        "targets",
        invalidation.targets,
      ),
    );

    for (const target of invalidation.targets) {
      if (hasPipelineReference(target)) {
        invalidationTargets.add(target);
      }
    }

    const mustNotInvalidate = new Set(invalidation.mustNotInvalidate ?? []);

    for (const passId of invalidation.invalidates) {
      if (!passId.trim()) {
        errors.push(
          `rendererPipeline ${invalidation.interaction} invalidates contains an empty pass id.`,
        );
        continue;
      }

      const pass = passesById.get(passId);

      if (!pass) {
        errors.push(
          `rendererPipeline ${invalidation.interaction} invalidates unknown pass "${passId}".`,
        );
        continue;
      }

      if (mustNotInvalidate.has(passId)) {
        errors.push(
          `rendererPipeline ${invalidation.interaction} cannot both invalidate and mustNotInvalidate pass "${passId}".`,
        );
      }

      if (
        highFrequencyViewportInteractions.has(invalidation.interaction) &&
        expensiveRenderPassKinds.has(pass.kind)
      ) {
        errors.push(
          `rendererPipeline ${invalidation.interaction} must not invalidate expensive pass "${passId}" (${pass.kind}). Move viewport work to transforms/uniforms or explain it through a cheaper pass.`,
        );
      }
    }

    for (const passId of invalidation.mustNotInvalidate ?? []) {
      if (!passId.trim()) {
        errors.push(
          `rendererPipeline ${invalidation.interaction} mustNotInvalidate contains an empty pass id.`,
        );
      } else if (!passesById.has(passId)) {
        errors.push(
          `rendererPipeline ${invalidation.interaction} mustNotInvalidate unknown pass "${passId}".`,
        );
      }
    }
  }

  for (const scenario of config.scenarios) {
    const pipelineInteraction = getPipelineInteractionForScenario(scenario.interaction);

    if (pipelineInteraction && !pipelineInteractionSet.has(pipelineInteraction)) {
      errors.push(
        `Performance scenario ${scenario.id} exercises ${pipelineInteraction}, so rendererPipeline.interactionInvalidation must declare that interaction.`,
      );
    }
  }

  for (const target of config.workloadTargets) {
    if (!invalidationTargets.has(target)) {
      errors.push(
        `Performance workload target ${target} must appear in rendererPipeline interactionInvalidation targets.`,
      );
    }
  }

  return errors;
}

export function validateToolcraftPerformanceCoverage(
  schema: ResolvedToolcraftAppSchema,
  config: ToolcraftPerformanceConfig,
): string[] {
  const errors: string[] = [];
  const scenariosByTarget = new Map<string, ToolcraftPerformanceScenario[]>();
  const browserTestNamesByScenario = new Map<string, string>();
  const customRendererStrategies = new Set<ToolcraftRendererStrategy>([
    "dom",
    "svg",
    "canvas-2d",
    "webgl",
    "webgpu",
  ]);
  const gpuRendererStrategies = new Set<ToolcraftRendererStrategy>(["webgl", "webgpu"]);
  const controlsByTarget = new Map(
    getAllSchemaControls(schema).map((control) => [control.target, control] as const),
  );

  errors.push(...getBrowserCheckPolicyErrors(config));
  errors.push(...getRendererTechniqueErrors(config));
  errors.push(...getRendererPipelineErrors(schema, config));

  if (config.usesCustomRenderer && !customRendererStrategies.has(config.rendererStrategy)) {
    errors.push(
      'Custom renderers must declare rendererStrategy "dom", "svg", "canvas-2d", "webgl", or "webgpu".',
    );
  }

  if (!config.usesCustomRenderer && config.rendererStrategy !== "none") {
    errors.push(
      `Non-custom renderer configs must use rendererStrategy "none", received "${config.rendererStrategy}".`,
    );
  }

  if (config.usesCustomRenderer && config.rendererWorkload === "none") {
    errors.push(
      'Custom renderers must declare rendererWorkload "simple-composition", "text-output", "vector-output", or "pixel-output".',
    );
  }

  if (!config.usesCustomRenderer && config.rendererWorkload !== "none") {
    errors.push(
      `Non-custom renderer configs must use rendererWorkload "none", received "${config.rendererWorkload}".`,
    );
  }

  if (
    hasMainThreadCanvasRasterCompositePreviewPressure(config) &&
    config.rendererWorkload !== "pixel-output"
  ) {
    errors.push(
      `Canvas 2D pipelines with main-thread rasterize/composite preview pressure must use rendererWorkload "pixel-output" or move expensive passes off the main thread; received "${config.rendererWorkload}".`,
    );
  }

  if (
    config.rendererWorkload === "pixel-output" &&
    !gpuRendererStrategies.has(config.rendererStrategy) &&
    (!config.rendererTechnique || !hasMeasuredGpuAlternativeEvidence(config.rendererTechnique))
  ) {
    errors.push(
      `rendererWorkload "pixel-output" should use rendererStrategy "webgl" or "webgpu", received "${config.rendererStrategy}". Keeping a CPU renderer requires rendererTechnique.measuredAlternativeEvidence for WebGL/WebGPU stress comparison.`,
    );
  }

  if (config.rendererWorkload === "pixel-output") {
    if (!hasStressPreviewOrAnimationScenario(config)) {
      errors.push(
        'rendererWorkload "pixel-output" must include a stress preview-render or animation-frame scenario with stress: true for the largest product canvas and heaviest workload values.',
      );
    }

    if (!hasLongTaskBudgetScenario(config)) {
      errors.push(
        'rendererWorkload "pixel-output" must include at least one maxLongTaskMs budget so GPU-backed previews cannot pass while freezing the main thread.',
      );
    }
  }

  if (config.usesCustomRenderer && hasDetailHeavyRendererLayer(config.rendererTechnique)) {
    if (!hasStressPreviewOrAnimationScenario(config)) {
      errors.push(
        "Detail-heavy custom renderers must include a stress preview-render or animation-frame scenario for the largest product canvas and heaviest workload values.",
      );
    }

    if (!hasLongTaskBudgetScenario(config)) {
      errors.push(
        "Detail-heavy custom renderers must include at least one maxLongTaskMs budget so renderer technology can be revised when main-thread work stalls.",
      );
    }
  }

  if (
    config.usesCustomRenderer &&
    hasHighCountCanvas2DRendererLayer(config.rendererTechnique) &&
    !hasStressPreviewOrAnimationScenario(config)
  ) {
    errors.push(
      "High-count Canvas 2D renderer layers must include stress preview-render or animation-frame evidence before delivery. If that stress evidence fails, revise renderer strategy instead of only lowering product workload.",
    );
  }

  for (const scenario of config.scenarios) {
    if (!scenario.id.trim()) {
      errors.push("Performance scenario is missing an id.");
    }

    if (!scenario.fixture.trim()) {
      errors.push(`${scenario.id} must name a representative fixture.`);
    }

    if (!scenario.expectedObservable.trim()) {
      errors.push(`${scenario.id} must describe a product-level performance observable.`);
    }

    if (!hasAnyBudget(scenario.budget)) {
      errors.push(`${scenario.id} must declare at least one numeric performance budget.`);
    }

    const missingBudgetFields = getMissingInteractionBudgetFields(scenario);
    if (missingBudgetFields.length > 0) {
      errors.push(
        `${scenario.id} ${scenario.interaction} scenario must declare ${missingBudgetFields.join(
          " and ",
        )}.`,
      );
    }

    errors.push(...getBudgetCapErrors(scenario));

    if (!scenario.automated || !scenario.automatedTestName.trim()) {
      errors.push(`${scenario.id} must point to an automated performance test.`);
    }

    if (!scenario.browser || !scenario.browserTestName.trim()) {
      errors.push(`${scenario.id} must point to a browser performance test.`);
    }

    if (scenario.browser && scenario.browserTestName.trim()) {
      const previousScenarioId = browserTestNamesByScenario.get(scenario.browserTestName);

      if (previousScenarioId) {
        errors.push(
          `${scenario.id} browserTestName "${scenario.browserTestName}" is already used by ${previousScenarioId}. Give each performance scenario its own browser test so every control is actually exercised.`,
        );
      } else {
        browserTestNamesByScenario.set(scenario.browserTestName, scenario.id);
      }
    }

    if (
      scenario.workload &&
      scenario.interaction !== "media-import" &&
      !hasMinDefaultMax(scenario.values)
    ) {
      errors.push(`${scenario.id} workload scenario must include min/default/max values.`);
    }

    const scenarioControl = controlsByTarget.get(scenario.target ?? "");
    errors.push(...getStressFixtureErrors(scenario, scenarioControl));
    errors.push(...getWorkloadFixtureErrors(config, scenario, scenarioControl));

    if (
      requiresConcreteUiTarget(scenario.interaction) &&
      !scenario.controlLabel?.trim() &&
      !scenario.uiSelector?.trim()
    ) {
      errors.push(
        `${scenario.id} ${scenario.interaction} scenario must declare controlLabel or uiSelector for its real browser interaction.`,
      );
    }

    if (scenario.target) {
      const scenarios = scenariosByTarget.get(scenario.target) ?? [];
      scenarios.push(scenario);
      scenariosByTarget.set(scenario.target, scenarios);
    }
  }

  const performanceTargets = new Set(config.workloadTargets);
  const schemaTargets = new Set(
    (schema.panels.controls?.sections ?? []).flatMap((section) =>
      Object.values(section.controls).map((control) => control.target),
    ),
  );
  const sensitiveTargets = new Set(
    collectToolcraftPerformanceSensitiveControls(schema)
      .map((entry) => entry.target)
      .filter((target) => !isToolcraftRuntimeOwnedTarget(target)),
  );
  const performanceRoleConflicts = collectToolcraftPerformanceRoleConflicts(schema);

  for (const { controlId, target } of performanceRoleConflicts) {
    errors.push(
      `${controlId} (${target}) looks performance-sensitive but declares performanceRole "responsiveness". Use performanceRole "workload" with workloadTargets and min/default/max coverage, or rename/restructure the control if it is truly lightweight.`,
    );
  }

  for (const target of sensitiveTargets) {
    if (!performanceTargets.has(target)) {
      errors.push(
        `${target} is performance-sensitive and must be listed in workloadTargets with min/default/max workload coverage.`,
      );
    }
  }

  for (const target of performanceTargets) {
    if (!schemaTargets.has(target)) {
      errors.push(`Performance workload target ${target} does not exist in schema controls.`);
    }

    const targetScenarios = scenariosByTarget.get(target) ?? [];
    const targetControl = controlsByTarget.get(target);
    const targetRequiresDrag = getSliderDragControlType(targetControl) !== null;
    const hasWorkloadCoverage = targetScenarios.some(
      (scenario) =>
        scenario.workload &&
        (targetRequiresDrag
          ? scenario.interaction === "control-drag"
          : scenario.interaction === "control-drag" ||
            scenario.interaction === "control-change") &&
        hasMinDefaultMax(scenario.values),
    );

    if (!hasWorkloadCoverage) {
      errors.push(
        targetRequiresDrag
          ? `${target} must have min/default/max workload performance coverage through a real control-drag scenario.`
          : `${target} must have min/default/max workload performance coverage.`,
      );
    }
  }

  for (const target of getVisiblePerformanceControlTargets(schema)) {
    if (isToolcraftRuntimeOwnedTarget(target)) {
      continue;
    }

    const targetScenarios = scenariosByTarget.get(target) ?? [];
    const targetControl = controlsByTarget.get(target);
    const sliderControlType = getSliderDragControlType(targetControl);

    if (targetScenarios.length === 0) {
      errors.push(
        `${target} must have a performance scenario because every visible control can affect app responsiveness.`,
      );
    } else if (sliderControlType && !hasControlDragScenario(targetScenarios)) {
      errors.push(
        `${target} is a ${sliderControlType} and must have a control-drag performance scenario proving live canvas/product feedback while dragging.`,
      );
    }
  }

  if (hasOutputDeliveryAction(schema)) {
    const interactions = new Set(config.scenarios.map((scenario) => scenario.interaction));

    if (!interactions.has("export-copy")) {
      errors.push("Output actions must include an export-copy performance scenario.");
    }
  }

  if (config.usesCustomRenderer) {
    const interactions = new Set(config.scenarios.map((scenario) => scenario.interaction));
    const hasAnimatedRendererScenario = interactions.has("animation-frame");
    const needsViewportZoomStress =
      hasAnimatedRendererScenario || hasZoomSensitiveRenderer(config);

    for (const requiredInteraction of [
      "preview-render",
      "control-drag",
      "viewport-stability",
    ] as const) {
      if (!interactions.has(requiredInteraction)) {
        errors.push(
          `Custom renderers must include a ${requiredInteraction} performance scenario.`,
        );
      }
    }

    if (hasAnimatedRendererScenario) {
      const hasAnimatedViewportDrag = config.scenarios.some(
        (scenario) =>
          scenario.interaction === "animation-viewport-drag" &&
          scenario.stress === true,
      );

      if (!hasAnimatedViewportDrag) {
        errors.push(
          "Animated custom renderers must include an animation-viewport-drag performance scenario that samples frames while physically moving the canvas viewport.",
        );
      }
    }

    if (needsViewportZoomStress) {
      const hasViewportZoomStress = config.scenarios.some(
        (scenario) =>
          scenario.interaction === "viewport-zoom-stress" &&
          scenario.stress === true,
      );

      if (!hasViewportZoomStress) {
        errors.push(
          "Detail-heavy or animated custom renderers must include a viewport-zoom-stress performance scenario that uses real zoom controls while sampling frame gaps and long tasks.",
        );
      }
    }

    if (schema.canvas.upload) {
      const mediaImportScenarios = config.scenarios.filter(
        (scenario) => scenario.interaction === "media-import",
      );

      if (mediaImportScenarios.length === 0) {
        errors.push(
          "Custom renderers with canvas upload must include a media-import performance scenario.",
        );
      } else if (
        !mediaImportScenarios.some(
          (scenario) => scenario.workload && scenario.stressFixture?.kind === "media",
        )
      ) {
        errors.push(
          'Custom renderers with canvas upload must include a workload media-import performance scenario with stressFixture.kind "media".',
        );
      }
    }

    if (hasKeyframeTimeline(schema)) {
      const hasKeyframeViewportStability = config.scenarios.some(
        (scenario) =>
          scenario.interaction === "viewport-stability" &&
          scenario.target === "timeline.keyframes",
      );

      if (!hasKeyframeViewportStability) {
        errors.push(
          'Keyframe custom renderers must include a viewport-stability performance scenario with target "timeline.keyframes" that exercises zoom/radar, expanded keyframes, keyframe creation, and playback or scrubbing.',
        );
      }
    }

    if (hasLayersPanel(schema)) {
      const hasLayerViewportStability = config.scenarios.some(
        (scenario) =>
          scenario.interaction === "viewport-stability" &&
          scenario.target === "layers.interactions",
      );

      if (!hasLayerViewportStability) {
        errors.push(
          'Layer-enabled custom renderers must include a viewport-stability performance scenario with target "layers.interactions" that exercises zoom/radar, layer selection, visibility, reorder or grouping, and selected-layer output stability.',
        );
      }
    }
  }

  return errors;
}
