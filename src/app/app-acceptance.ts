import { getToolcraftControlKeyframeCapability } from "@/toolcraft/runtime";
import type {
  ToolcraftActionSchema,
  ToolcraftControlConditionSchema,
  ToolcraftControlOrderRole,
  ToolcraftControlSchema,
  ResolvedToolcraftAppSchema,
} from "@/toolcraft/runtime";

import { appSchema } from "./app-schema";

export type ToolcraftAcceptanceEvidence =
  | "command-side-effect"
  | "exported-bytes"
  | "media-lifecycle"
  | "persistence-state"
  | "product-output"
  | "rendered-pixels"
  | "timeline-output"
  | "viewport-side-effect";

export type ToolcraftReferenceCoverage =
  | "canvas-sizing"
  | "control-mapping"
  | "export-at-time"
  | "export-copy"
  | "media-lifecycle"
  | "pause-resume"
  | "renderer-loop"
  | "renderer-state"
  | "restart"
  | "spawn-update-cadence"
  | "time-progress";

export type ToolcraftReferenceTimelineCoverage =
  | "all-range"
  | "duration"
  | "export-at-time"
  | "export-range"
  | "jump-to-trim-start"
  | "keyframes"
  | "loop"
  | "playback"
  | "range-playback"
  | "restart"
  | "scrub"
  | "state-jump"
  | "time-progress"
  | "trim-range";

export type ToolcraftTimelinePlaybackCoverage =
  | "duration"
  | "loop"
  | "pause-resume"
  | "rendered-frame"
  | "scrub";

export type ToolcraftCanvasSizingCoverage = "fixed-output-size" | "intrinsic-media-size";

export type ToolcraftPersistenceCoverage = "reload";

export type ToolcraftSettingsTransferCoverage = "opt-out";

export type ToolcraftAutonomousAnimationCoverage =
  | "no-duration-control"
  | "no-export-at-time"
  | "no-loop-control"
  | "no-play-pause"
  | "no-scrub"
  | "no-user-facing-transport";

export type ToolcraftTimelineLoopDurationSource =
  | "product-derived"
  | "reference"
  | "user-request";

export type ToolcraftTimelineLoopDurationIntent = {
  evidence: string;
  seconds: number;
  source: ToolcraftTimelineLoopDurationSource;
};

export type ToolcraftAnimationIntent =
  | {
      mode: "none";
    }
  | {
      behaviorCoverage: readonly ToolcraftAutonomousAnimationCoverage[];
      mode: "autonomous";
      reason: string;
    }
  | {
      loopDuration: ToolcraftTimelineLoopDurationIntent;
      mode: "timeline-keyframes";
    }
  | {
      loopDuration: ToolcraftTimelineLoopDurationIntent;
      mode: "timeline-playback";
    };

export type ToolcraftReferenceTimelineMode =
  | "custom-reference-timeline"
  | "none"
  | "toolcraft-keyframes"
  | "toolcraft-playback";

export type ToolcraftReferenceTimelineContract = {
  behaviorCoverage: readonly ToolcraftReferenceTimelineCoverage[];
  loopDuration?: ToolcraftTimelineLoopDurationIntent;
  mode: ToolcraftReferenceTimelineMode;
};

export type ToolcraftReferenceStudyStatus =
  | "ran-original"
  | "restored-local"
  | "source-inspection-only";

export type ToolcraftReferenceStudyEvidence = {
  behaviorEvidence: string;
  referenceLocation: string;
  reproductionSteps: string;
  sourceEvidence: string;
  sourceOnlyReason?: string;
  status: ToolcraftReferenceStudyStatus;
};

export type ToolcraftVideoReferenceStoryboardFrame = {
  behaviorObservation: string;
  frameId: string;
  frameSource: string;
  timeSeconds: number;
  visualObservation: string;
};

export type ToolcraftVideoReferenceTransition = {
  behaviorDelta: string;
  fromFrameId: string;
  id: string;
  toFrameId: string;
};

export type ToolcraftVideoReferenceAcceptanceMapping = {
  acceptanceId: string;
  behavior: string;
  frameIds: readonly string[];
};

export type ToolcraftVideoReferenceStudyEvidence = {
  acceptanceMapping: readonly ToolcraftVideoReferenceAcceptanceMapping[];
  behaviorDecomposition: string;
  extractionEvidence: string;
  referenceLocation: string;
  storyboard: readonly ToolcraftVideoReferenceStoryboardFrame[];
  transitionAnalysis: readonly ToolcraftVideoReferenceTransition[];
};

export type ToolcraftReferenceFeatureStatus =
  | "intentionally-changed"
  | "ported"
  | "toolcraft-native";

export type ToolcraftReferenceFeatureInventoryItem = {
  acceptanceId: string;
  behaviorEvidence: string;
  featureName: string;
  id: string;
  referenceBehavior: string;
  sourceEvidence: string;
  status: ToolcraftReferenceFeatureStatus;
  toolcraftMapping: string;
  userApprovedChangeReason?: string;
};

export type ToolcraftLayerCoverage =
  | "grouping"
  | "media-lifecycle"
  | "reorder"
  | "selected-layer-controls"
  | "selection"
  | "visibility";

export type ToolcraftControlPartCoverage =
  | "anchorGrid.position"
  | "channelMixer.activeChannel"
  | "channelMixer.values"
  | "curves.activeChannel"
  | "curves.points"
  | "colorOpacity.hex"
  | "colorOpacity.opacity"
  | "fontPicker.color"
  | "fontPicker.fontId"
  | "fontPicker.fontSize"
  | "fontPicker.fontWeight"
  | "fontPicker.letterSpacing"
  | "fontPicker.lineHeight"
  | "fontPicker.opacity"
  | "fontPicker.textCase"
  | "gradient.angle"
  | "gradient.gradientType"
  | "gradient.stops.color"
  | "gradient.stops.opacity"
  | "gradient.stops.position"
  | "palette.family"
  | "palette.shade"
  | "rangeInput.end"
  | "rangeInput.start"
  | "rangeSlider.lower"
  | "rangeSlider.upper"
  | "vector.x"
  | "vector.y";

export type ToolcraftCustomControlCoverage =
  | "built-in-gap"
  | "kit-primitives"
  | "minimal-ui"
  | "product-output"
  | "runtime-state";

const builtInToolcraftControlTypeValues = [
  "actions",
  "anchorGrid",
  "aspectRatio",
  "channelMixer",
  "checkbox",
  "code",
  "collectionActions",
  "color",
  "colorOpacity",
  "curves",
  "fileDrop",
  "fontPicker",
  "gradient",
  "imagePicker",
  "palette",
  "panelActions",
  "rangeInput",
  "rangeSlider",
  "segmented",
  "select",
  "settingsTransfer",
  "slider",
  "switch",
  "text",
  "vector",
] as const;
const insufficientFixedCanvasSizingReasonPattern =
  /\b(no|without|missing|lacks?|does\s+not\s+(?:have|expose)|did\s+not\s+(?:have|expose)|has\s+no|had\s+no)\b[^.]{0,80}\b(?:size|dimension|canvas|output)\b[^.]{0,80}\b(?:editor|controls?|settings?|picker|input|ui)\b|\breference\s+app\b[^.]{0,120}\b(?:no|without|missing|lacks?|does\s+not\s+(?:have|expose)|did\s+not\s+(?:have|expose)|has\s+no|had\s+no)\b[^.]{0,80}\b(?:size|dimension|canvas|output)\b/i;

export type ToolcraftBuiltInControlType =
  (typeof builtInToolcraftControlTypeValues)[number];

export type ToolcraftBuiltInFitCheck = {
  checkedBuiltIns: readonly ToolcraftBuiltInControlType[];
  closestBuiltIn: ToolcraftBuiltInControlType | "none";
  productObservable: string;
  whyInsufficient: string;
};

export type ToolcraftTransferMode =
  | {
      animationIntent?: ToolcraftAnimationIntent;
      mode: "new-toolcraft-app";
      videoReferenceStudy?: ToolcraftVideoReferenceStudyEvidence;
    }
  | {
      animationIntent?: ToolcraftAnimationIntent;
      behaviorCoverage: readonly ToolcraftReferenceCoverage[];
      mode: "reference-runtime-clone";
      referenceFeatureInventory?: readonly ToolcraftReferenceFeatureInventoryItem[];
      referenceName: string;
      referenceStudy?: ToolcraftReferenceStudyEvidence;
      referenceTimeline: ToolcraftReferenceTimelineContract;
      sourceOfTruth: "reference-runtime";
      videoReferenceStudy?: ToolcraftVideoReferenceStudyEvidence;
    };

export type ToolcraftProductReadiness =
  | {
      mode: "starter";
      reason: string;
    }
  | {
      mode: "product";
      productName: string;
      productSummary: string;
      requestedBehavior: string;
    };

export type ToolcraftComponentAcceptance = {
  actionCoverage?: readonly string[];
  automated: boolean;
  automatedTestName: string;
  browser: boolean;
  browserTestName: string;
  componentType: string;
  evidence: ToolcraftAcceptanceEvidence;
  expectedObservable: string;
  fixture: string;
  id: string;
  canvasHandle?: {
    exportCleanTestName: string;
    outputObservable: string;
    testId: string;
    writesTarget: string;
  };
  kind: "canvas-handle" | "control" | "runtime";
  canvasSizingCoverage?: ToolcraftCanvasSizingCoverage;
  layerCoverage?: ToolcraftLayerCoverage;
  optionCoverage?: "each-visible-item" | readonly string[];
  persistenceCoverage?: ToolcraftPersistenceCoverage;
  referenceCoverage?: ToolcraftReferenceCoverage;
  referenceTimelineCoverage?: ToolcraftReferenceTimelineCoverage;
  settingsTransferCoverage?: ToolcraftSettingsTransferCoverage;
  target?: string;
  timelineCoverage?: "keyframes" | "playback";
  timelinePlaybackCoverage?:
    | "all-playback-behavior"
    | readonly ToolcraftTimelinePlaybackCoverage[];
  controlPartCoverage?:
    | "all-visible-parts"
    | readonly ToolcraftControlPartCoverage[];
  customControlCoverage?:
    | "all-custom-control-behavior"
    | readonly ToolcraftCustomControlCoverage[];
  builtInFitCheck?: ToolcraftBuiltInFitCheck;
  userAction: string;
};

export type ToolcraftVisibleControl = {
  control: ToolcraftControlSchema;
  controlId: string;
  sectionTitle?: string;
};

export type ToolcraftControlOrderItem = {
  controlId: string;
  rank: number;
  role: ToolcraftControlOrderRole;
  sectionTitle?: string;
  target: string;
  type: string;
};

export type ToolcraftControlSectionInventoryEntry = {
  entity?: string;
  groupingReason: string;
  splitReason?: string;
  targets: readonly string[];
  title: string;
  workflowStage?: string;
};

export const appTransferMode: ToolcraftTransferMode = {
  animationIntent: { mode: "none" },
  mode: "new-toolcraft-app",
};

export const appProductReadiness: ToolcraftProductReadiness = {
  mode: "starter",
  reason:
    "Neutral Toolcraft template before a product schema, renderer, and acceptance matrix are authored.",
};

export const appAcceptance: readonly ToolcraftComponentAcceptance[] = [];

export const starterControlSectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [];

function getActionValue(action: ToolcraftActionSchema | string): string {
  return typeof action === "string" ? action : action.value;
}

function getActionLabelText(action: ToolcraftActionSchema | string): string {
  return typeof action === "string" ? action : (action.label ?? action.value);
}

function getActionSearchText(action: ToolcraftActionSchema | string): string {
  return typeof action === "string" ? action : `${action.label} ${action.value} ${action.command ?? ""}`;
}

function isCanvasSizeTarget(target: string): boolean {
  return target === "canvas.size.width" || target === "canvas.size.height";
}

const runtimeSetupControlTargets = new Set([
  "runtime.settingsTransfer",
  "canvas.aspectRatio",
  "canvas.renderScale",
  "canvas.size.width",
  "canvas.size.height",
  "panels.timeline.extended",
]);

function isRuntimeSetupControlTarget(target: string): boolean {
  return runtimeSetupControlTargets.has(target);
}

function isResetPanelAction(action: ToolcraftActionSchema | string): boolean {
  return /\breset\b/i.test(getActionSearchText(action));
}

function getControlOptionValues(control: ToolcraftControlSchema): readonly string[] {
  if (control.type === "imagePicker") {
    return control.items?.map((item) => item.value) ?? [];
  }

  return control.options?.map((option) => option.value) ?? [];
}

function hasCoverageForValues(
  coverage: ToolcraftComponentAcceptance["actionCoverage"] | ToolcraftComponentAcceptance["optionCoverage"],
  values: readonly string[],
): boolean {
  if (values.length === 0) {
    return true;
  }

  if (coverage === "each-visible-item") {
    return true;
  }

  if (!Array.isArray(coverage)) {
    return false;
  }

  return values.every((value) => coverage.includes(value));
}

function hasControlPartCoverage(
  coverage: ToolcraftComponentAcceptance["controlPartCoverage"],
  requiredParts: readonly ToolcraftControlPartCoverage[],
): boolean {
  if (requiredParts.length === 0) {
    return true;
  }

  if (coverage === "all-visible-parts") {
    return true;
  }

  if (!Array.isArray(coverage)) {
    return false;
  }

  return requiredParts.every((part) => coverage.includes(part));
}

function hasCustomControlCoverage(
  coverage: ToolcraftComponentAcceptance["customControlCoverage"],
  requiredParts: readonly ToolcraftCustomControlCoverage[],
): boolean {
  if (coverage === "all-custom-control-behavior") {
    return true;
  }

  if (!Array.isArray(coverage)) {
    return false;
  }

  return requiredParts.every((part) => coverage.includes(part));
}

function hasTimelinePlaybackCoverage(
  coverage: ToolcraftComponentAcceptance["timelinePlaybackCoverage"],
  requiredParts: readonly ToolcraftTimelinePlaybackCoverage[],
): boolean {
  if (coverage === "all-playback-behavior") {
    return true;
  }

  if (!Array.isArray(coverage)) {
    return false;
  }

  return requiredParts.every((part) => coverage.includes(part));
}

function hasTimelinePlaybackCoveragePart(
  coverage: ToolcraftComponentAcceptance["timelinePlaybackCoverage"],
  part: ToolcraftTimelinePlaybackCoverage,
): boolean {
  return coverage === "all-playback-behavior" || (Array.isArray(coverage) && coverage.includes(part));
}

function getAcceptanceEvidenceText(entry: ToolcraftComponentAcceptance): string {
  return [
    entry.automatedTestName,
    entry.browserTestName,
    entry.expectedObservable,
    entry.fixture,
    entry.userAction,
  ].join(" ");
}

function getTimelineLoopDurationIntent(
  animationIntent: ToolcraftAnimationIntent | undefined,
): ToolcraftTimelineLoopDurationIntent | undefined {
  if (
    animationIntent?.mode !== "timeline-playback" &&
    animationIntent?.mode !== "timeline-keyframes"
  ) {
    return undefined;
  }

  return animationIntent.loopDuration;
}

function isValidTimelineLoopDurationSource(source: string): boolean {
  return source === "reference" || source === "user-request" || source === "product-derived";
}

const runtimeDefaultLoopDurationEvidencePattern =
  /\b(?:runtime|template|generic|fallback|default)\b.{0,40}\b(?:8\s*s|8\s*sec(?:ond)?s?|eight\s*sec(?:ond)?s?)\b|\b(?:8\s*s|8\s*sec(?:ond)?s?|eight\s*sec(?:ond)?s?)\b.{0,40}\b(?:runtime|template|generic|fallback|default)\b/i;

function hasSeamlessForwardLoopEvidence(text: string): boolean {
  const hasDurationChange =
    /\b(duration|range|state\.timeline\.durationSeconds|timeline)\b/i.test(text) &&
    /\b(edit|change|changed|changing|commit|set|after)\w*\b/i.test(text);
  const hasFirstLastFrameEvidence =
    /\b(first[-\s/]*(?:and\s+)?last|last[-\s/]*(?:and\s+)?first|wrapped\s+first\s+frame)\b/i.test(
      text,
    ) ||
    (/\bfirst\s+frame\b/i.test(text) && /\blast\s+frame\b/i.test(text)) ||
    (/\bstart\s+frame\b/i.test(text) && /\bend\s+frame\b/i.test(text));
  const hasNoVisibleJumpEvidence =
    /\b(no|not|without|avoid(?:s|ing)?|absent|rejects?|disallow(?:s|ed)?|forbid(?:s|den)?)\b.{0,40}\bvisible\s+jump\b/i.test(
      text,
    );
  const hasSeamEvidence =
    hasFirstLastFrameEvidence &&
    (/\b(stitch(?:es|ed|ing)?|seam(?:less)?)\b/i.test(text) || hasNoVisibleJumpEvidence);
  const hasForwardDirectionEvidence =
    /\b(forward[-\s]*only|one\s+direction|same\s+direction|advances?\s+in\s+one\s+direction|motion\s+advances?\s+forward|direction\s+does\s+not\s+reverse)\b/i.test(text);
  const hasNoMirrorEvidence =
    /\b(no|not|without|avoid(?:s|ing)?|absent|rejects?|disallow(?:s|ed)?|forbid(?:s|den)?)\b.{0,40}\bmirror(?:ed|ing)?\b/i.test(text);
  const hasNoYoyoEvidence =
    /\b(no|not|without|avoid(?:s|ing)?|absent|rejects?|disallow(?:s|ed)?|forbid(?:s|den)?)\b.{0,40}\byo-?yo\b/i.test(text);
  const hasNoPingPongEvidence =
    /\b(no|not|without|avoid(?:s|ing)?|absent|rejects?|disallow(?:s|ed)?|forbid(?:s|den)?)\b.{0,40}\bping[-\s]*pong\b/i.test(text);
  const hasNoReverseEvidence =
    /\b(no|not|without|avoid(?:s|ing)?|absent|rejects?|disallow(?:s|ed)?|forbid(?:s|den)?)\b.{0,40}\breverse\b/i.test(text);

  return (
    hasDurationChange &&
    hasSeamEvidence &&
    hasForwardDirectionEvidence &&
    hasNoMirrorEvidence &&
    hasNoYoyoEvidence &&
    hasNoPingPongEvidence &&
    hasNoReverseEvidence
  );
}

function getFileDropLifecycleCoverageErrors(
  label: string,
  control: ToolcraftControlSchema,
  entry: ToolcraftComponentAcceptance,
  hasDefaultMediaAssets: boolean,
): string[] {
  const errors: string[] = [];
  const evidenceText = getAcceptanceEvidenceText(entry);

  if (entry.evidence !== "media-lifecycle") {
    errors.push(
      `${label} fileDrop acceptance evidence must be "media-lifecycle" so upload, clear, and reset behavior cannot be replaced by generic product-output coverage.`,
    );
  }

  if (
    !/\b(upload|import|drop|drag|browse|choose|select file|source image)\b/i.test(
      evidenceText,
    ) ||
    !/\b(clear|remove|delete|trash)\b/i.test(evidenceText) ||
    !/\b(reset|reset controls|section reset|global reset)\b/i.test(evidenceText)
  ) {
    errors.push(
      `${label} fileDrop acceptance must prove upload/import, clear/remove, and section or global reset restore default source media or remove uploaded source media when no default exists.`,
    );
  }

  if (hasDefaultMediaAssets) {
    const provesDefaultRemoval =
      /\b(default|predefined|preset|attached)\b.{0,60}\b(clear|remove|delete|trash)\b/i.test(
        evidenceText,
      ) ||
      /\b(clear|remove|delete|trash)\b.{0,60}\b(default|predefined|preset|attached)\b/i.test(
        evidenceText,
      );
    const provesDefaultReset =
      /\b(reset|section reset|global reset)\b.{0,80}\b(restore|restores|return|returns|recreate|recreates)\b.{0,80}\b(default|predefined|preset|attached)\b/i.test(
        evidenceText,
      );

    if (!provesDefaultRemoval || !provesDefaultReset) {
      errors.push(
        `${label} fileDrop acceptance must prove predefined media.defaultAssets render as attached files, can be removed to an empty source/canvas state, and are restored by section or global Reset.`,
      );
    }
  }

  if (control.assetKind !== "file") {
    const provesRotate = /\b(rotate|rotation|90°|90\s*degrees?)\b/i.test(evidenceText);
    const provesFlip = /\b(flip|flipped)\b/i.test(evidenceText);
    const provesTransformConsumption =
      /\b(mediaAssets\[\]\.transform|runtime media transform|transform metadata|preview|renderer|rendered output|export)\b/i.test(
        evidenceText,
      );

    if (!provesRotate || !provesFlip || !provesTransformConsumption) {
      errors.push(
        `${label} image fileDrop acceptance must prove rotate and flip actions update runtime media transform metadata and that preview, renderer, or export consumes the transform.`,
      );
    }
  }

  if (control.multiple === true) {
    const provesReorder = /\b(reorder|sort|sorting|drag|order)\b/i.test(evidenceText);
    const provesOrderConsumption =
      /\b(runtime media order|mediaAssets order|ordered media|preview|renderer|rendered output|export)\b/i.test(
        evidenceText,
      );

    if (!provesReorder || !provesOrderConsumption) {
      errors.push(
        `${label} multiple fileDrop acceptance must prove thumbnail/file reorder updates runtime media order and that preview, renderer, or export consumes that order.`,
      );
    }
  }

  return errors;
}

const conditionOperatorLabels = [
  "equals",
  "notEquals",
  "oneOf",
  "notOneOf",
  "greaterThan",
  "greaterThanOrEqual",
  "lessThan",
  "lessThanOrEqual",
] as const satisfies readonly (keyof ToolcraftControlConditionSchema)[];

function hasConditionOperator(condition: ToolcraftControlConditionSchema): boolean {
  return conditionOperatorLabels.some((operator) => operator in condition);
}

function getConditionValidationErrors({
  condition,
  conditionName,
  controlTargets,
  label,
}: {
  condition: ToolcraftControlConditionSchema;
  conditionName: "disabledWhen" | "visibleWhen";
  controlTargets: ReadonlySet<string>;
  label: string;
}): string[] {
  const errors: string[] = [];

  if (!hasConditionOperator(condition)) {
    errors.push(
      `${label} ${conditionName} must declare one of equals, notEquals, oneOf, notOneOf, greaterThan, greaterThanOrEqual, lessThan, or lessThanOrEqual so the dependent state is deterministic.`,
    );
  }

  for (const arrayOperator of ["oneOf", "notOneOf"] as const) {
    if (
      arrayOperator in condition &&
      (!Array.isArray(condition[arrayOperator]) ||
        condition[arrayOperator]?.length === 0)
    ) {
      errors.push(
        `${label} ${conditionName}.${arrayOperator} must be a non-empty array.`,
      );
    }
  }

  for (const numericOperator of [
    "greaterThan",
    "greaterThanOrEqual",
    "lessThan",
    "lessThanOrEqual",
  ] as const) {
    if (
      numericOperator in condition &&
      (typeof condition[numericOperator] !== "number" ||
        !Number.isFinite(condition[numericOperator]))
    ) {
      errors.push(
        `${label} ${conditionName}.${numericOperator} must be a finite number.`,
      );
    }
  }

  if (
    !controlTargets.has(condition.target) &&
    !isCanvasSizeTarget(condition.target)
  ) {
    errors.push(
      `${label} ${conditionName} target ${condition.target} does not match another schema control target or canvas size target.`,
    );
  }

  return errors;
}

export function getRequiredToolcraftControlPartCoverage(
  control: ToolcraftControlSchema,
): readonly ToolcraftControlPartCoverage[] {
  switch (control.type) {
    case "anchorGrid":
      return ["anchorGrid.position"];
    case "channelMixer":
      return ["channelMixer.activeChannel", "channelMixer.values"];
    case "curves":
      return control.variant === "single"
        ? ["curves.points"]
        : ["curves.activeChannel", "curves.points"];
    case "fontPicker":
      return [
        "fontPicker.fontId",
        "fontPicker.fontWeight",
        "fontPicker.fontSize",
        "fontPicker.letterSpacing",
        "fontPicker.lineHeight",
        "fontPicker.textCase",
        "fontPicker.color",
        "fontPicker.opacity",
      ];
    case "gradient":
      return [
        "gradient.gradientType",
        "gradient.angle",
        "gradient.stops.position",
        "gradient.stops.color",
        "gradient.stops.opacity",
      ];
    case "palette":
      return ["palette.family", "palette.shade"];
    case "rangeInput":
      return ["rangeInput.start", "rangeInput.end"];
    case "rangeSlider":
      return ["rangeSlider.lower", "rangeSlider.upper"];
    case "vector":
      return ["vector.x", "vector.y"];
    default:
      return [];
  }
}

const builtInToolcraftControlTypes = new Set<string>(
  builtInToolcraftControlTypeValues,
);

const requiredCustomControlCoverage: readonly ToolcraftCustomControlCoverage[] = [
  "built-in-gap",
  "kit-primitives",
  "minimal-ui",
  "product-output",
  "runtime-state",
];

function isCustomToolcraftControl(control: ToolcraftControlSchema): boolean {
  return !builtInToolcraftControlTypes.has(control.type);
}

const collectionEntityCustomControlRe =
  /\b(collection|repeatable|list|lists|item|items|entry|entries|row|rows|asset|assets|object|objects|color|colors|swatch|swatches|glyph|glyphs|symbol|symbols|point|points|stop|stops|variant|variants|rule|rules|mask|masks|shape|shapes|layer|layers|media|image|images|file|files)\b/i;
const collectionOperationCustomControlRe =
  /\b(add|adding|delete|deleting|remove|removing|reorder|reordering|order|ordering|sort|sorting|select|selecting|selected|selection|duplicate|duplicating|upload|import|clear|clearing)\b/i;

const actionLikeCustomControlRe =
  /\b(add|adding|delete|deleting|remove|removing|duplicate|duplicating|sort|sorting|normalize|normalizing|clear|clearing|reset|shuffle|randomize|randomizing)\b/i;

const chromeOnlyCustomControlReasonRe =
  /\b(icon|icons|visual|style|styling|layout|spacing|chrome|button|buttons|compact|custom look|custom ui)\b/i;
const productInteractionCustomControlReasonRe =
  /\b(runtime|state|canvas|output|export|upload|import|preview|reorder|ordering|sort|drag|resize|handle|threshold|density|mapping|geometry|nested|multi|multiple|per-item|metadata|hit target|validation|selection)\b/i;
const collectionValueKeyRe =
  /^(items?|entries|rows|assets|objects|colors?|glyphs?|symbols?|points?|stops?|variants?|rules?|masks?|shapes?|layers?|media|images?|files?)$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyUnknownForFitCheck(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(stringifyUnknownForFitCheck).join(" ");
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .flatMap(([key, entryValue]) => [key, stringifyUnknownForFitCheck(entryValue)])
      .join(" ");
  }

  return "";
}

function arrayLooksLikeCollectionValue(value: readonly unknown[]): boolean {
  return (
    value.length === 0 ||
    value.some((item) => isRecord(item) || Array.isArray(item) || typeof item === "string")
  );
}

function hasCollectionValueShape(value: unknown): boolean {
  if (!isRecord(value)) {
    return Array.isArray(value) && arrayLooksLikeCollectionValue(value);
  }

  return Object.entries(value).some(([key, entryValue]) => {
    if (Array.isArray(entryValue)) {
      return collectionValueKeyRe.test(key) || arrayLooksLikeCollectionValue(entryValue);
    }

    return collectionValueKeyRe.test(key) && isRecord(entryValue);
  });
}

function getCustomFitCheckSearchText(
  entry: ToolcraftComponentAcceptance,
  control?: ToolcraftControlSchema,
): string {
  return [
    control?.type,
    control?.target,
    typeof control?.label === "string" ? control.label : undefined,
    stringifyUnknownForFitCheck(control?.defaultValue),
    entry.id,
    entry.target,
    entry.componentType,
    entry.expectedObservable,
    entry.userAction,
    entry.builtInFitCheck?.whyInsufficient,
    entry.builtInFitCheck?.productObservable,
  ]
    .filter(Boolean)
    .join(" ");
}

function isCollectionLikeCustomControl(
  entry: ToolcraftComponentAcceptance,
  control: ToolcraftControlSchema,
): boolean {
  if (hasCollectionValueShape(control.defaultValue)) {
    return true;
  }

  const searchText = getCustomFitCheckSearchText(entry, control);

  return (
    collectionEntityCustomControlRe.test(searchText) &&
    collectionOperationCustomControlRe.test(searchText)
  );
}

function getBuiltInFitCheckErrors(
  label: string,
  entry: ToolcraftComponentAcceptance,
  control: ToolcraftControlSchema,
): string[] {
  const fitCheck = entry.builtInFitCheck;

  if (!fitCheck) {
    return [
      `${label} is a custom control and must declare builtInFitCheck with checkedBuiltIns, closestBuiltIn, whyInsufficient, and productObservable.`,
    ];
  }

  const errors: string[] = [];
  const checkedBuiltIns = Array.isArray(fitCheck.checkedBuiltIns)
    ? fitCheck.checkedBuiltIns
    : [];

  if (checkedBuiltIns.length === 0) {
    errors.push(
      `${label} builtInFitCheck.checkedBuiltIns must name at least one checked built-in control.`,
    );
  }

  const unknownCheckedBuiltIns = checkedBuiltIns.filter(
    (builtIn) => !builtInToolcraftControlTypes.has(builtIn),
  );

  if (unknownCheckedBuiltIns.length > 0) {
    errors.push(
      `${label} builtInFitCheck.checkedBuiltIns contains unknown built-in controls: ${unknownCheckedBuiltIns.join(", ")}.`,
    );
  }

  if (
    fitCheck.closestBuiltIn !== "none" &&
    !checkedBuiltIns.includes(fitCheck.closestBuiltIn)
  ) {
    errors.push(
      `${label} builtInFitCheck.closestBuiltIn must be one of the checked built-ins or "none".`,
    );
  }

  if (fitCheck.whyInsufficient.trim().length < 24) {
    errors.push(
      `${label} builtInFitCheck.whyInsufficient must explain why the closest built-in cannot express the product interaction.`,
    );
  }

  if (fitCheck.productObservable.trim().length < 24) {
    errors.push(
      `${label} builtInFitCheck.productObservable must name the product output or side effect that proves the custom control is necessary.`,
    );
  }

  const searchText = getCustomFitCheckSearchText(entry, control);

  if (
    isCollectionLikeCustomControl(entry, control) &&
    !checkedBuiltIns.includes("collectionActions")
  ) {
    errors.push(
      `${label} builtInFitCheck.checkedBuiltIns must include collectionActions when the custom control owns a growable, removable, selectable, or reorderable runtime item set.`,
    );
  }

  if (actionLikeCustomControlRe.test(searchText) && !checkedBuiltIns.includes("actions")) {
    errors.push(
      `${label} builtInFitCheck.checkedBuiltIns must include actions when the custom control exposes local command buttons such as add, remove, delete, duplicate, sort, normalize, or clear.`,
    );
  }

  if (
    chromeOnlyCustomControlReasonRe.test(fitCheck.whyInsufficient) &&
    !productInteractionCustomControlReasonRe.test(fitCheck.whyInsufficient)
  ) {
    errors.push(
      `${label} builtInFitCheck.whyInsufficient cannot justify a custom control only with icons, layout, styling, or custom buttons; name the product interaction or value model that built-ins cannot express.`,
    );
  }

  return errors;
}

function isSliderLikeControl(control: ToolcraftControlSchema): boolean {
  return control.type === "slider" || control.type === "rangeSlider";
}

const SMALL_SEMANTIC_DISCRETE_POSITION_LIMIT = 13;
const MAX_VISUAL_DISCRETE_POSITION_COUNT = 32;
const SEMANTIC_DISCRETE_SLIDER_RE =
  /\b(anchor|band|bands|cell|cells|col|cols|column|columns|count|gap|grid|jitter|level|levels|octave|octaves|pass|passes|point|points|row|rows|segment|segments|step|steps|tile|tiles)\b/i;
const FINITE_ANIMATION_STEP_SLIDER_RE =
  /\b(char|chars|character|characters|flip|flips|glyph|glyphs|frame|frames|letter|letters)\b/i;
const FINITE_ANIMATION_STEP_VALUE_RE = /\b(count|depth|step|steps)\b/i;
const SEMANTIC_CONTINUOUS_SLIDER_RE =
  /\b(duration|fps|frame rate|frames per second|rate|speed|time|seconds?|ms|milliseconds?|hz|cols\/s|ch\/s)\b/i;

function getStepPositionCount(control: ToolcraftControlSchema): number | undefined {
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
  const intervalCount =
    Math.abs(rawStepCount - roundedStepCount) < Number.EPSILON * 100
      ? roundedStepCount
      : Math.floor(rawStepCount) + 1;

  return Math.max(2, intervalCount + 1);
}

function getStepMarkerCount(control: ToolcraftControlSchema): number | undefined {
  return getStepPositionCount(control);
}

function isIntegerStepDomain(control: ToolcraftControlSchema): boolean {
  return (
    typeof control.min === "number" &&
    typeof control.max === "number" &&
    typeof control.step === "number" &&
    Number.isInteger(control.min) &&
    Number.isInteger(control.max) &&
    Number.isInteger(control.step)
  );
}

function getSliderSemanticText(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  return [
    controlId,
    control.target,
    getControlLabelText(control),
    typeof control.unit === "string" ? control.unit : "",
  ].join(" ");
}

function shouldUseVisualDiscreteSlider(
  controlId: string,
  control: ToolcraftControlSchema,
): boolean {
  const positionCount = getStepPositionCount(control);

  if (!positionCount || !isIntegerStepDomain(control)) {
    return false;
  }

  const semanticText = getSliderSemanticText(controlId, control);

  if (SEMANTIC_CONTINUOUS_SLIDER_RE.test(semanticText)) {
    return false;
  }

  const hasFiniteAnimationStepSemantics =
    FINITE_ANIMATION_STEP_SLIDER_RE.test(semanticText) &&
    FINITE_ANIMATION_STEP_VALUE_RE.test(semanticText);

  if (hasFiniteAnimationStepSemantics) {
    return positionCount <= MAX_VISUAL_DISCRETE_POSITION_COUNT;
  }

  if (positionCount > SMALL_SEMANTIC_DISCRETE_POSITION_LIMIT) {
    return false;
  }

  return SEMANTIC_DISCRETE_SLIDER_RE.test(semanticText);
}

function getSliderVariantClassificationErrors({
  control,
  controlId,
  label,
}: {
  control: ToolcraftControlSchema;
  controlId: string;
  label: string;
}): string[] {
  const errors: string[] = [];
  const positionCount = getStepPositionCount(control);

  if (!positionCount) {
    return errors;
  }

  if (
    shouldUseVisualDiscreteSlider(controlId, control) &&
    control.variant !== "discrete"
  ) {
    errors.push(
      `${label} has ${positionCount} semantic integer positions and must use variant "discrete" so Toolcraft renders tick markers.`,
    );
  }

  if (
    control.variant === "discrete" &&
    positionCount > MAX_VISUAL_DISCRETE_POSITION_COUNT
  ) {
    errors.push(
      `${label} declares variant "discrete" with ${positionCount} positions, which would overload tick markers. Keep it stepped continuous or use a different control.`,
    );
  }

  return errors;
}

function getControlLabelText(control: ToolcraftControlSchema): string {
  return typeof control.label === "string" ? control.label : "";
}

function hasVisibleControlLabel(control: ToolcraftControlSchema): boolean {
  return typeof control.label === "string" && control.label.trim().length > 0;
}

const shortSingleLineTextMaxLength = 80;
const longTextControlEvidencePattern =
  /\b(multiline|multi-line|multi\s+line|long\s+(?:text|content|prompt|instructions?)|paragraph|body\s+(?:copy|text)|rich\s+text|textarea|instructions?|script|code|json|css|shader|template|markdown|csv|xml|yaml|html|svg|list|lines|dataset|structured|source\s+text)\b/i;
const shortSingleLineTextIntentPattern =
  /\b(button|label|title|name|caption|headline|cta|badge|token|word|phrase|single-line|one-line|short\s+text)\b/i;

function getControlDefaultString(control: ToolcraftControlSchema): string | undefined {
  return typeof control.defaultValue === "string" ? control.defaultValue : undefined;
}

function getTextValueControlIntentText(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  return [
    controlId,
    control.target,
    getControlLabelText(control),
    control.description ?? "",
  ]
    .join(" ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function getCodeTextareaControlError({
  control,
  controlId,
  label,
}: {
  control: ToolcraftControlSchema;
  controlId: string;
  label: string;
}): string | undefined {
  if (control.type !== "code") {
    return undefined;
  }

  const defaultValue = getControlDefaultString(control);
  const intentText = getTextValueControlIntentText(controlId, control);
  const hasLongTextEvidence =
    longTextControlEvidencePattern.test(intentText) ||
    (defaultValue !== undefined &&
      (defaultValue.length > shortSingleLineTextMaxLength ||
        /[\r\n]/.test(defaultValue)));
  const looksLikeShortSingleLineText =
    shortSingleLineTextIntentPattern.test(intentText) ||
    (defaultValue !== undefined &&
      defaultValue.trim().length > 0 &&
      defaultValue.trim().length <= shortSingleLineTextMaxLength &&
      !/[\r\n]/.test(defaultValue));

  if (!looksLikeShortSingleLineText || hasLongTextEvidence) {
    return undefined;
  }

  return `${label} uses CodeTextarea for short single-line text. Use type "text" for button labels, canvas labels, titles, captions, names, badges, tokens, and other short one-line content. Reserve type "code" for long, multiline, or structured values, and document that reason in description when the default is short.`;
}

const singleCurveSemanticPattern =
  /\b(acceleration|accel|bend|easing|ease|response|depth|mask|opacity|alpha|motion|velocity|threshold|falloff|remap|remapping)\b|speed\s+profile|mapping\s+curve|curve\s+mapping/i;
const rgbCurveSemanticPattern =
  /\b(rgb|rgba|channel|channels|red|green|blue|color\s*correction|colour\s*correction|color\s*grading|colour\s*grading|color\s*grade|colour\s*grade|color\s*curve|colour\s*curve|tone\s*mapping|hue|saturation|chroma)\b/i;

function getCurveSemanticText(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  return [
    controlId,
    control.target,
    getControlLabelText(control),
    control.description ?? "",
  ]
    .join(" ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2");
}

function shouldUseSingleCurveVariant(
  controlId: string,
  control: ToolcraftControlSchema,
): boolean {
  if (control.type !== "curves" || control.variant === "single") {
    return false;
  }

  const text = getCurveSemanticText(controlId, control);

  return singleCurveSemanticPattern.test(text) && !rgbCurveSemanticPattern.test(text);
}

function getToggleControlLabelError(
  control: ToolcraftControlSchema,
  sectionTitle?: string,
): string | undefined {
  if (control.type !== "switch" && control.type !== "checkbox") {
    return undefined;
  }

  const label = getControlLabelText(control).trim();

  if (/^(enable|disable)\b/i.test(label)) {
    return `toggle labels must name the setting context only; use "CRT", "Background", "Glow", or "Loop" instead of "${label}".`;
  }

  if (
    label &&
    sectionTitle &&
    normalizeToolcraftSemanticText(label) ===
      normalizeToolcraftSemanticText(sectionTitle)
  ) {
    return `toggle label "${label}" duplicates section title "${sectionTitle}". Use a shorter contextual label such as "Include" or rename the toggle to a more specific setting.`;
  }

  return undefined;
}

function getSingleActionsControlLabelError(
  control: ToolcraftControlSchema,
): string | undefined {
  if (control.type !== "actions") {
    return undefined;
  }

  const actions = getControlActions(control);

  if (actions.length !== 1) {
    return undefined;
  }

  const label = getControlLabelText(control).trim();
  const actionLabel = getActionLabelText(actions[0] as ToolcraftActionSchema | string).trim();

  if (
    label &&
    actionLabel &&
    normalizeToolcraftSemanticText(label) === normalizeToolcraftSemanticText(actionLabel)
  ) {
    return `single Actions control label "${label}" duplicates its only button label "${actionLabel}". Keep the button as the command and use a short context label such as "Ink wash", "Palette action", or "Current layer".`;
  }

  return undefined;
}

const maxInlineSwitchLabelLength = 16;
const maxInlineSwitchLabelWordCount = 2;

function getInlineSwitchLabelText(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  if (control.label === false) {
    return "";
  }

  const label = getControlLabelText(control).trim();

  return label || controlId;
}

function isInlineSwitchLabelSafe(
  controlId: string,
  control: ToolcraftControlSchema,
): boolean {
  const label = getInlineSwitchLabelText(controlId, control);

  if (!label) {
    return true;
  }

  const wordCount = label.split(/\s+/u).filter(Boolean).length;

  return label.length <= maxInlineSwitchLabelLength && wordCount <= maxInlineSwitchLabelWordCount;
}

function isBooleanControl(control: ToolcraftControlSchema | undefined): boolean {
  return control?.type === "checkbox" || control?.type === "switch";
}

function controlsShareToolcraftTargetEntity(
  firstControl: ToolcraftControlSchema,
  secondControl: ToolcraftControlSchema,
): boolean {
  const firstPrefix = getToolcraftLooseTargetPrefix(firstControl.target);
  const secondPrefix = getToolcraftLooseTargetPrefix(secondControl.target);

  return Boolean(firstPrefix && firstPrefix === secondPrefix);
}

function sectionHasInlineLayoutGroupForPair(
  section: NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number],
  firstControlId: string,
  secondControlId: string,
): boolean {
  return (section.layoutGroups ?? []).some(
    (layoutGroup) =>
      layoutGroup.layout === "inline" &&
      layoutGroup.columns === 2 &&
      layoutGroup.controls.length === 2 &&
      layoutGroup.controls.includes(firstControlId) &&
      layoutGroup.controls.includes(secondControlId),
  );
}

function getControlActions(
  control: ToolcraftControlSchema,
): readonly (ToolcraftActionSchema | string)[] {
  const maybeControlWithActions = control as {
    actions?: readonly (ToolcraftActionSchema | string)[];
  };

  return Array.isArray(maybeControlWithActions.actions)
    ? maybeControlWithActions.actions
    : [];
}

function getTimelineTransportControlText(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  return [
    controlId,
    control.target,
    getControlLabelText(control),
    ...getControlActions(control).map(getActionSearchText),
  ].join(" ");
}

function getAnimationIntentControlText({
  control,
  controlId,
  sectionTitle,
}: ToolcraftVisibleControl): string {
  return [
    sectionTitle ?? "",
    controlId,
    control.target,
    getControlLabelText(control),
  ].join(" ");
}

function getSearchableControlText({
  control,
  controlId,
  sectionTitle,
}: ToolcraftVisibleControl): string {
  return [
    sectionTitle ?? "",
    controlId,
    control.target,
    getControlLabelText(control),
  ]
    .join(" ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

function actionLooksLikePngExport(action: ToolcraftActionSchema | string): boolean {
  const text = getActionSearchText(action).replace(/([a-z])([A-Z])/g, "$1 $2");

  return (
    (/\b(export|download)\b/i.test(text) && /\b(png|image)\b/i.test(text)) ||
    /\bexport\.png\b/i.test(text)
  );
}

function actionLooksLikeVideoExport(action: ToolcraftActionSchema | string): boolean {
  const text = getActionSearchText(action).replace(/([a-z])([A-Z])/g, "$1 $2");

  return (
    (/\b(export|download)\b/i.test(text) && /\b(video|mp4|webm|mov)\b/i.test(text)) ||
    /\bexport\.video\b/i.test(text)
  );
}

function schemaHasPngExportPanelAction(schema: ResolvedToolcraftAppSchema): boolean {
  return (schema.panels.controls?.sections ?? []).some((section) =>
    Object.values(section.controls).some(
      (control) =>
        control.type === "panelActions" &&
        getControlActions(control).some(actionLooksLikePngExport),
    ),
  );
}

function schemaHasVideoExportPanelAction(schema: ResolvedToolcraftAppSchema): boolean {
  return (schema.panels.controls?.sections ?? []).some((section) =>
    Object.values(section.controls).some(
      (control) =>
        control.type === "panelActions" &&
        getControlActions(control).some(actionLooksLikeVideoExport),
    ),
  );
}

function getFirstPanelActionsSectionIndex(schema: ResolvedToolcraftAppSchema): number {
  return (schema.panels.controls?.sections ?? []).findIndex((section) =>
    Object.values(section.controls).some((control) => control.type === "panelActions"),
  );
}

function getSchemaControlsSectionByTitle(
  schema: ResolvedToolcraftAppSchema,
  title: string,
): NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number] | undefined {
  const normalizedTitle = normalizeToolcraftSemanticText(title);

  return (schema.panels.controls?.sections ?? []).find(
    (section) => normalizeToolcraftSemanticText(section.title) === normalizedTitle,
  );
}

function getSchemaControlsSectionIndexByTitle(
  schema: ResolvedToolcraftAppSchema,
  title: string,
): number {
  const normalizedTitle = normalizeToolcraftSemanticText(title);

  return (schema.panels.controls?.sections ?? []).findIndex(
    (section) => normalizeToolcraftSemanticText(section.title) === normalizedTitle,
  );
}

function getSectionControlEntryByTarget(
  section:
    | NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number]
    | undefined,
  target: string,
): readonly [string, ToolcraftControlSchema] | undefined {
  if (!section) {
    return undefined;
  }

  return Object.entries(section.controls).find(([, control]) => control.target === target);
}

function schemaHasOutputBackgroundColorControl(
  controls: readonly ToolcraftVisibleControl[],
): boolean {
  return controls.some((visibleControl) => {
    const { control } = visibleControl;

    if (control.type !== "color") {
      return false;
    }

    return /\b(background|backdrop|scene|canvas)\b/i.test(
      getSearchableControlText(visibleControl),
    );
  });
}

function schemaHasOutputBackgroundToggleControl(
  controls: readonly ToolcraftVisibleControl[],
): boolean {
  return controls.some(isOutputBackgroundToggleControl);
}

function isOutputBackgroundToggleControl(visibleControl: ToolcraftVisibleControl): boolean {
  const { control } = visibleControl;

  if (
    control.type !== "switch" &&
    control.type !== "checkbox" &&
    control.type !== "select" &&
    control.type !== "segmented"
  ) {
    return false;
  }

  return /\b(background|backdrop|transparent|transparency|alpha)\b/i.test(
    getSearchableControlText(visibleControl),
  );
}

function getOutputBackgroundColorEntry(
  section:
    | NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number]
    | undefined,
): readonly [string, ToolcraftControlSchema] | undefined {
  if (!section) {
    return undefined;
  }

  return Object.entries(section.controls).find(([controlId, control]) => {
    if (control.type !== "color") {
      return false;
    }

    return /\b(background|backdrop|scene|canvas)\b/i.test(
      [section.title, controlId, control.target, getControlLabelText(control)]
        .join(" ")
        .replace(/([a-z])([A-Z])/g, "$1 $2"),
    );
  });
}

function sectionHasEqualWidthOutputBackgroundRow(
  section:
    | NonNullable<ResolvedToolcraftAppSchema["panels"]["controls"]>["sections"][number]
    | undefined,
  toggleControlId: string | undefined,
  colorControlId: string | undefined,
): boolean {
  if (!section || !toggleControlId || !colorControlId) {
    return false;
  }

  return (section.layoutGroups ?? []).some(
    (layoutGroup) =>
      layoutGroup.layout === "inline" &&
      layoutGroup.columns === 2 &&
      layoutGroup.controls.length === 2 &&
      layoutGroup.controls[0] === toggleControlId &&
      layoutGroup.controls[1] === colorControlId,
  );
}

const SEGMENTED_CONTROL_MAX_OPTIONS = 4;
const SEGMENTED_CONTROL_MAX_OPTION_LABEL_LENGTH = 9;
const SEGMENTED_CONTROL_MAX_TOTAL_LABEL_LENGTH = 24;

function getSegmentedControlLayoutError(
  control: ToolcraftControlSchema,
): string | null {
  if (control.type !== "segmented") {
    return null;
  }

  const labels = control.options?.map((option) => option.label.trim()) ?? [];
  const totalLabelLength = labels.reduce((total, label) => total + label.length, 0);
  const longLabels = labels.filter(
    (label) => label.length > SEGMENTED_CONTROL_MAX_OPTION_LABEL_LENGTH,
  );

  if (
    labels.length > SEGMENTED_CONTROL_MAX_OPTIONS ||
    longLabels.length > 0 ||
    totalLabelLength > SEGMENTED_CONTROL_MAX_TOTAL_LABEL_LENGTH
  ) {
    return [
      `segmented controls must preserve cell padding: use at most ${SEGMENTED_CONTROL_MAX_OPTIONS} short options`,
      `(max ${SEGMENTED_CONTROL_MAX_OPTION_LABEL_LENGTH} characters per label and ${SEGMENTED_CONTROL_MAX_TOTAL_LABEL_LENGTH} total)`,
      "or shorten labels first; if the compact names still exceed the budget, use a select dropdown instead.",
    ].join(" ");
  }

  return null;
}

const controlOrderRoleRanks = {
  input: 0,
  mode: 1,
  primary: 2,
  spatial: 2,
  color: 2,
  strength: 3,
  detail: 4,
  advanced: 5,
  action: 6,
} satisfies Record<ToolcraftControlOrderRole, number>;

const requiredReferenceCloneCoverage = [
  "canvas-sizing",
  "control-mapping",
  "renderer-state",
] satisfies readonly ToolcraftReferenceCoverage[];

const referenceTransportCoverage = new Set<ToolcraftReferenceCoverage>([
  "export-at-time",
  "pause-resume",
  "restart",
  "time-progress",
]);

const toolcraftReferenceTimelineCoverage = new Set<ToolcraftReferenceTimelineCoverage>([
  "duration",
  "export-at-time",
  "keyframes",
  "loop",
  "playback",
  "restart",
  "scrub",
  "time-progress",
]);

const customReferenceTimelineCoverage = new Set<ToolcraftReferenceTimelineCoverage>([
  "all-range",
  "export-range",
  "jump-to-trim-start",
  "range-playback",
  "state-jump",
  "trim-range",
]);

const referenceFeatureStatusValues = new Set<ToolcraftReferenceFeatureStatus>([
  "intentionally-changed",
  "ported",
  "toolcraft-native",
]);

const referenceStudyStatusValues = new Set<ToolcraftReferenceStudyStatus>([
  "ran-original",
  "restored-local",
  "source-inspection-only",
]);

const explicitReferenceChangeReasonPattern =
  /\b(user|requested|explicit|approved|redesign|change request)\b/i;

const referenceStudySourceOnlyReasonPattern =
  /\b(cannot|can't|unable|unavailable|missing|broken|fails?|blocked|no\s+(?:server|deps?|dependency|access)|not\s+(?:runnable|available))\b/i;

const videoReferenceEvidencePattern =
  /\b(?:reference\s+(?:video|gif)|screen\s*recording|contact[-\s]*sheet|storyboard|frame[-\s]*by[-\s]*frame|extracted[-\s]*frames?|ffprobe)\b|(?:^|[\\/"'\s])[^\\/"'\s]+\.(?:mp4|mov|webm|gif)\b/i;

const timelineTransportControlPattern =
  /\b(play|pause|paused|resume|animate|restart)\b/i;

const animationIntentControlPattern =
  /\b(animation|animate|motion|playback)\b/i;

const requiredAutonomousAnimationCoverage = [
  "no-user-facing-transport",
  "no-play-pause",
  "no-scrub",
  "no-duration-control",
  "no-loop-control",
  "no-export-at-time",
] satisfies readonly ToolcraftAutonomousAnimationCoverage[];

const requiredLayerCoverage = [
  "selection",
  "visibility",
  "reorder",
  "grouping",
] satisfies readonly ToolcraftLayerCoverage[];

const requiredTimelinePlaybackCoverage = [
  "pause-resume",
  "scrub",
  "duration",
  "loop",
  "rendered-frame",
] satisfies readonly ToolcraftTimelinePlaybackCoverage[];

function getToolcraftTransferModeEvidenceText(
  transferMode: ToolcraftTransferMode,
): string {
  return JSON.stringify(transferMode);
}

function validateToolcraftVideoReferenceStudy(
  study: ToolcraftVideoReferenceStudyEvidence,
  acceptance: readonly ToolcraftComponentAcceptance[],
): string[] {
  const errors: string[] = [];
  const acceptanceById = new Map(acceptance.map((entry) => [entry.id, entry]));
  const frameIds = new Set<string>();

  if (!study.referenceLocation.trim()) {
    errors.push(
      "videoReferenceStudy.referenceLocation must name the inspected video, GIF, screen recording, contact sheet, or extracted-frame folder.",
    );
  }

  if (!study.extractionEvidence.trim()) {
    errors.push(
      "videoReferenceStudy.extractionEvidence must explain how frames were inspected or extracted before implementation.",
    );
  }

  if (!study.behaviorDecomposition.trim()) {
    errors.push(
      "videoReferenceStudy.behaviorDecomposition must decompose the observed frame-to-frame changes into product behavior to preserve.",
    );
  }

  if (study.storyboard.length < 4) {
    errors.push(
      "videoReferenceStudy.storyboard must include at least four timecoded frames so the reference is studied as motion, not a single screenshot.",
    );
  }

  for (const [index, frame] of study.storyboard.entries()) {
    const frameLabel = frame.frameId.trim() || `#${index + 1}`;

    if (!frame.frameId.trim()) {
      errors.push(`videoReferenceStudy.storyboard frame ${index + 1} must include a stable frameId.`);
    } else if (frameIds.has(frame.frameId)) {
      errors.push(
        `videoReferenceStudy.storyboard frameId "${frame.frameId}" is duplicated; each sampled frame needs a stable id.`,
      );
    } else {
      frameIds.add(frame.frameId);
    }

    if (!Number.isFinite(frame.timeSeconds) || frame.timeSeconds < 0) {
      errors.push(
        `videoReferenceStudy.storyboard "${frameLabel}" must include a non-negative finite timeSeconds value.`,
      );
    }

    if (!frame.frameSource.trim()) {
      errors.push(
        `videoReferenceStudy.storyboard "${frameLabel}" must cite the frame image, contact sheet cell, or source timecode inspected.`,
      );
    }

    if (!frame.visualObservation.trim()) {
      errors.push(
        `videoReferenceStudy.storyboard "${frameLabel}" must describe the visible frame state.`,
      );
    }

    if (!frame.behaviorObservation.trim()) {
      errors.push(
        `videoReferenceStudy.storyboard "${frameLabel}" must describe the behavior inferred from that frame.`,
      );
    }
  }

  if (study.transitionAnalysis.length < 3) {
    errors.push(
      "videoReferenceStudy.transitionAnalysis must include at least three frame-to-frame deltas proving how behavior changes between sampled frames.",
    );
  }

  for (const [index, transition] of study.transitionAnalysis.entries()) {
    const transitionLabel = transition.id.trim() || `#${index + 1}`;

    if (!transition.id.trim()) {
      errors.push(
        `videoReferenceStudy.transitionAnalysis item ${index + 1} must include a stable id.`,
      );
    }

    if (!frameIds.has(transition.fromFrameId)) {
      errors.push(
        `videoReferenceStudy.transitionAnalysis "${transitionLabel}" fromFrameId "${transition.fromFrameId}" must point to a storyboard frameId.`,
      );
    }

    if (!frameIds.has(transition.toFrameId)) {
      errors.push(
        `videoReferenceStudy.transitionAnalysis "${transitionLabel}" toFrameId "${transition.toFrameId}" must point to a storyboard frameId.`,
      );
    }

    if (!transition.behaviorDelta.trim()) {
      errors.push(
        `videoReferenceStudy.transitionAnalysis "${transitionLabel}" must describe the behavior delta between frames.`,
      );
    }
  }

  if (study.acceptanceMapping.length === 0) {
    errors.push(
      "videoReferenceStudy.acceptanceMapping must map observed video behaviors to acceptance rows.",
    );
  }

  for (const [index, mapping] of study.acceptanceMapping.entries()) {
    const mappingLabel = mapping.behavior.trim() || `#${index + 1}`;

    if (!mapping.behavior.trim()) {
      errors.push(
        `videoReferenceStudy.acceptanceMapping item ${index + 1} must name the observed behavior.`,
      );
    }

    if (mapping.frameIds.length === 0) {
      errors.push(
        `videoReferenceStudy.acceptanceMapping "${mappingLabel}" must cite storyboard frameIds that prove the behavior.`,
      );
    }

    for (const frameId of mapping.frameIds) {
      if (!frameIds.has(frameId)) {
        errors.push(
          `videoReferenceStudy.acceptanceMapping "${mappingLabel}" frameId "${frameId}" must point to a storyboard frameId.`,
        );
      }
    }

    const acceptanceId = mapping.acceptanceId.trim();
    const entry = acceptanceById.get(acceptanceId);

    if (!acceptanceId) {
      errors.push(
        `videoReferenceStudy.acceptanceMapping "${mappingLabel}" must include acceptanceId for the test proving the copied behavior.`,
      );
      continue;
    }

    if (!entry) {
      errors.push(
        `videoReferenceStudy.acceptanceMapping "${mappingLabel}" points to missing acceptanceId "${acceptanceId}".`,
      );
      continue;
    }

    if (!entry.automated || !entry.automatedTestName.trim()) {
      errors.push(
        `${acceptanceId} must have automated coverage proving video reference behavior "${mappingLabel}".`,
      );
    }

    if (!entry.browser || !entry.browserTestName.trim()) {
      errors.push(
        `${acceptanceId} must have browser coverage proving video reference behavior "${mappingLabel}".`,
      );
    }

    if (!entry.expectedObservable.trim()) {
      errors.push(
        `${acceptanceId} must describe the observable result for video reference behavior "${mappingLabel}".`,
      );
    }
  }

  return errors;
}

function isModeSelectorControl(
  controlId: string,
  control: ToolcraftControlSchema,
): boolean {
  if (control.type !== "select" && control.type !== "segmented") {
    return false;
  }

  return /mode|type|filter|style|preset|variant/i.test(
    `${controlId} ${control.target} ${getControlLabelText(control)}`,
  );
}

function matchesControlMeaning(
  controlId: string,
  control: ToolcraftControlSchema,
  pattern: RegExp,
): boolean {
  return pattern.test(`${controlId} ${control.target} ${getControlLabelText(control)}`);
}

export function inferToolcraftControlOrderRole(
  controlId: string,
  control: ToolcraftControlSchema,
): ToolcraftControlOrderRole {
  if (control.orderRole) {
    return control.orderRole;
  }

  if (control.type === "panelActions") {
    return "action";
  }

  if (
    control.type === "fileDrop" ||
    control.target.startsWith("media.") ||
    control.target === "canvas.size.width" ||
    control.target === "canvas.size.height"
  ) {
    return "input";
  }

  if (isModeSelectorControl(controlId, control)) {
    return "mode";
  }

  if (control.type === "vector") {
    return "spatial";
  }

  if (control.type === "color" || control.type === "gradient") {
    return "color";
  }

  if (
    matchesControlMeaning(
      controlId,
      control,
      /grain|noise|texture|detail|blur|threshold|sample|quality|density|iteration|radius/i,
    )
  ) {
    return "detail";
  }

  if (
    isSliderLikeControl(control) ||
    matchesControlMeaning(
      controlId,
      control,
      /amount|brightness|contrast|depth|highlight|intensity|mix|opacity|saturation|scale|spread|strength/i,
    )
  ) {
    return "strength";
  }

  return "primary";
}

function getToolcraftControlOrderErrors(schema: ResolvedToolcraftAppSchema): string[] {
  const errors: string[] = [];

  for (const section of schema.panels.controls?.sections ?? []) {
    let previousItem: ToolcraftControlOrderItem | undefined;

    for (const [controlId, control] of Object.entries(section.controls)) {
      if (control.type === "panelActions" || isRuntimeSetupControlTarget(control.target)) {
        continue;
      }

      const role = inferToolcraftControlOrderRole(controlId, control);
      const item: ToolcraftControlOrderItem = {
        controlId,
        rank: controlOrderRoleRanks[role],
        role,
        sectionTitle: section.title,
        target: control.target,
        type: control.type,
      };

      if (previousItem && item.rank < previousItem.rank) {
        const sectionLabel = section.title ? `${section.title} / ` : "";

        errors.push(
          `${sectionLabel}${controlId} (${control.target}) has orderRole "${role}" after ${previousItem.controlId} (${previousItem.target}) with orderRole "${previousItem.role}". Move mode/input/primary controls before dependent strength/detail/advanced controls or split them into an earlier section.`,
        );
      }

      previousItem = item;
    }
  }

  return errors;
}

function getToolcraftRuntimeSetupSectionErrors(
  schema: ResolvedToolcraftAppSchema,
): string[] {
  const errors: string[] = [];
  const controlsPanel = schema.panels.controls;

  if (!controlsPanel) {
    return [
      "Generated Toolcraft apps must define a controls panel so the mandatory runtime Setup section is visible.",
    ];
  }

  const sections = schema.panels.controls?.sections ?? [];

  if (sections.length === 0) {
    return [
      'Runtime Setup must be the first visible controls-panel section titled "Setup". Do not ship an empty controls panel.',
    ];
  }

  const setupSection = sections[0];
  const setupTitle = setupSection?.title?.trim();
  const setupControls = Object.values(setupSection?.controls ?? {});
  const setupTargets = new Set(setupControls.map((control) => control.target));
  const hasSetupTarget = (target: string) => setupTargets.has(target);

  if (setupTitle !== "Setup") {
    errors.push(
      'Runtime Setup must be the first visible controls-panel section titled "Setup". Do not move Export Settings, Import Settings, canvas sizing, Resolution scale, or Timeline into app-authored sections.',
    );
  }

  if (
    !setupControls.some(
      (control) =>
        control.type === "settingsTransfer" &&
        control.target === "runtime.settingsTransfer",
    )
  ) {
    errors.push(
      'Runtime Setup must include settingsTransfer at target "runtime.settingsTransfer" so Export Settings and Import Settings are always visible.',
    );
  }

  if (schema.canvas.enabled && schema.canvas.sizing.mode === "editable-output") {
    const missingCanvasTargets = [
      "canvas.aspectRatio",
      "canvas.size.width",
      "canvas.size.height",
    ].filter((target) => !hasSetupTarget(target));

    if (missingCanvasTargets.length > 0) {
      errors.push(
        `Runtime Setup for editable-output canvas must include Aspect ratio, Canvas width, and Canvas height. Missing targets: ${missingCanvasTargets.join(", ")}.`,
      );
    }
  }

  if (schema.canvas.renderScale.enabled && !hasSetupTarget("canvas.renderScale")) {
    errors.push(
      'Runtime Setup must include Resolution scale at target "canvas.renderScale" whenever canvas.renderScale is enabled.',
    );
  }

  if (schema.panels.timeline?.enabled) {
    if (!hasSetupTarget("panels.timeline.extended")) {
      errors.push(
        'Runtime Setup must include the Timeline switch at target "panels.timeline.extended" whenever panels.timeline is enabled.',
      );
    }
  } else if (
    sections.some((section) =>
      Object.values(section.controls).some(
        (control) => control.target === "panels.timeline.extended",
      ),
    )
  ) {
    errors.push(
      'Runtime Setup must not include the Timeline switch unless panels.timeline is enabled.',
    );
  }

  for (const [sectionIndex, section] of sections.entries()) {
    const isRuntimeSetupSection = sectionIndex === 0 && section.title?.trim() === "Setup";

    for (const [controlId, control] of Object.entries(section.controls)) {
      if (!isRuntimeSetupControlTarget(control.target) || isRuntimeSetupSection) {
        continue;
      }

      const sectionLabel = getToolcraftSectionLabel(section.title, sectionIndex);

      errors.push(
        `${sectionLabel} / ${controlId} uses runtime Setup target "${control.target}". Runtime Setup owns Export Settings, Import Settings, Aspect ratio, Canvas width, Canvas height, Resolution scale, and Timeline; do not declare these controls in app-authored sections.`,
      );
    }
  }

  return errors;
}

const genericControlSectionTitlePattern =
  /^(controls?|settings?|parameters?|options?|configuration|config|adjustments?)$/i;

const controlTypeSectionTitlePattern =
  /^(sliders?|colors?|colours?|inputs?|selects?|switches?|checkboxes?|toggles?|buttons?|actions?)$/i;

const weakControlLabelContextSectionTitlePattern =
  /^(appearance|look|looks|properties?|style|styles|values?|visuals?)$/i;

const broadControlSectionTitlePattern =
  /^(animation|export|flow|icon|logo|motion|output|scene|shape|shapes|text|typography|visual|visuals)$/i;

const genericControlLabelPattern =
  /^(angle|amount|blur|brightness|color|contrast|count|density|depth|frequency|height|hue|intensity|offset|opacity|phase|position|quality|radius|rotation|saturation|scale|size|spacing|speed|strength|threshold|tint|width)$/i;

const maxPreferredControlsPerSection = 7;
const maxHardControlsPerSection = 10;

const controlSemanticClusterPatterns: ReadonlyArray<readonly [string, RegExp]> = [
  ["input", /\b(upload|source|prompt|content|text|phrase|copy|message|file|media|image)\b/i],
  ["mode", /\b(mode|type|preset|style|variant|filter|layout|format|quality)\b/i],
  ["motion", /\b(animation|speed|velocity|accel|acceleration|correlation|duration|timing|loop|phase|fps|rate)\b/i],
  ["geometry", /\b(width|height|size|scale|position|offset|anchor|origin|target|radius|distance|spread|bend|curve|curves|path|shape|grid|gap)\b/i],
  ["density", /\b(fill|density|amount|count|ratio|word|words|letter|letters|particle|particles|layer|layers|island|islands)\b/i],
  ["color", /\b(color|colour|gradient|shade|tint|background|halo|glow|opacity|alpha|stroke|fillColor|fillOpacity)\b/i],
  ["typography", /\b(font|weight|case|leading|tracking|lineHeight|letterSpacing|typeface)\b/i],
  ["export", /\b(export|copy|download|video|png|webm|mp4|mov|bitrate|resolution)\b/i],
];

const fontPickerOwnedTypographyPartLabels = new Map<string, string>([
  ["case", "case"],
  ["color", "color"],
  ["colour", "color"],
  ["family", "font family"],
  ["fill", "color"],
  ["fillcolor", "color"],
  ["fillopacity", "opacity"],
  ["font", "font family"],
  ["fontcolor", "color"],
  ["fontfamily", "font family"],
  ["fontid", "font family"],
  ["fontsize", "font size"],
  ["fontweight", "font weight"],
  ["foreground", "color"],
  ["foregroundcolor", "color"],
  ["leading", "line height"],
  ["letterspacing", "letter spacing"],
  ["lineheight", "line height"],
  ["opacity", "opacity"],
  ["size", "font size"],
  ["textcase", "case"],
  ["textcolor", "color"],
  ["textfill", "color"],
  ["textopacity", "opacity"],
  ["tracking", "letter spacing"],
  ["typeface", "font family"],
  ["weight", "font weight"],
]);

const fontPickerDescriptionOwnedPartPatterns: ReadonlyArray<readonly [string, RegExp]> = [
  ["font family", /\b(?:font\s+family|family|typeface)\b/i],
  ["font weight", /\b(?:font\s+weight|weight)\b/i],
  ["font size", /\b(?:font\s+size|size)\b/i],
  ["case", /\b(?:text\s+case|case|uppercase|lowercase|capitalize|title\s+case)\b/i],
  ["color", /\b(?:text\s+color|font\s+color|color|colour|fill)\b/i],
  ["opacity", /\b(?:text\s+opacity|font\s+opacity|opacity|alpha)\b/i],
  ["letter spacing", /\b(?:letter\s+spacing|tracking)\b/i],
  ["line height", /\b(?:line\s+height|leading)\b/i],
];

function getToolcraftSectionLabel(sectionTitle: string | undefined, sectionIndex: number): string {
  return sectionTitle?.trim() || `untitled section ${sectionIndex + 1}`;
}

function humanizeToolcraftLabelPart(value: string): string {
  const text = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "";
  }

  return text.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}

function lowerCaseToolcraftLabelStart(value: string): string {
  return value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value;
}

function normalizeToolcraftSemanticText(value: string | undefined): string {
  return humanizeToolcraftLabelPart(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function getToolcraftTargetParts(target: string): string[] {
  return target.split(".").filter(Boolean);
}

function getToolcraftTargetProperty(target: string): string {
  return getToolcraftTargetParts(target).at(-1) ?? "";
}

function getToolcraftStrictTargetPrefix(target: string): string | null {
  const parts = getToolcraftTargetParts(target);

  if (parts.length < 3) {
    return null;
  }

  const prefix = parts.slice(0, -1).join(".");

  if (prefix === "canvas.size") {
    return null;
  }

  return prefix;
}

function getToolcraftLooseTargetPrefix(target: string): string | null {
  const parts = getToolcraftTargetParts(target);

  if (parts.length < 2) {
    return null;
  }

  const prefix = parts.slice(0, -1).join(".");

  if (prefix === "canvas.size") {
    return null;
  }

  return prefix;
}

function isToolcraftWeakSectionContext(sectionTitle: string | undefined): boolean {
  if (!sectionTitle) {
    return true;
  }

  return (
    genericControlSectionTitlePattern.test(sectionTitle) ||
    controlTypeSectionTitlePattern.test(sectionTitle) ||
    weakControlLabelContextSectionTitlePattern.test(sectionTitle)
  );
}

function doesToolcraftSectionMatchTarget(
  sectionTitle: string | undefined,
  target: string,
): boolean {
  const sectionText = normalizeToolcraftSemanticText(sectionTitle);

  if (!sectionText) {
    return false;
  }

  return getToolcraftTargetParts(target).some((part) => {
    const targetText = normalizeToolcraftSemanticText(part);
    return (
      targetText.length > 0 &&
      (targetText === sectionText ||
        targetText.includes(sectionText) ||
        sectionText.includes(targetText))
    );
  });
}

function getToolcraftSuggestedControlLabel(
  control: ToolcraftControlSchema,
  sectionTitle: string | undefined,
): string {
  const label = getControlLabelText(control).trim();
  const targetProperty = humanizeToolcraftLabelPart(control.target.split(".").at(-1) ?? "");
  const normalizedLabel = normalizeToolcraftSemanticText(label);
  const normalizedTargetProperty = normalizeToolcraftSemanticText(targetProperty);

  if (
    label &&
    normalizedTargetProperty &&
    normalizedTargetProperty !== normalizedLabel &&
    normalizedTargetProperty.endsWith(normalizedLabel)
  ) {
    return targetProperty;
  }

  const property = label || targetProperty;
  const loosePrefix = getToolcraftLooseTargetPrefix(control.target);
  const prefixParts = loosePrefix ? getToolcraftTargetParts(loosePrefix) : [];
  const prefixEntity = humanizeToolcraftLabelPart(prefixParts.at(-1) ?? "");
  const sectionEntity =
    sectionTitle && !isToolcraftWeakSectionContext(sectionTitle)
      ? humanizeToolcraftLabelPart(sectionTitle)
      : "";
  const entity = prefixEntity || sectionEntity;

  if (!entity) {
    return property;
  }

  const normalizedEntity = normalizeToolcraftSemanticText(entity);
  const normalizedProperty = normalizeToolcraftSemanticText(property);

  if (normalizedEntity && normalizedProperty.includes(normalizedEntity)) {
    return property;
  }

  return `${entity} ${lowerCaseToolcraftLabelStart(property)}`;
}

function getToolcraftFontPickerOwnedTypographyPart(
  control: ToolcraftControlSchema,
): string | undefined {
  if (control.type === "fontPicker") {
    return undefined;
  }

  const normalizedCandidates = [
    getToolcraftTargetProperty(control.target),
    getControlLabelText(control),
  ].map(normalizeToolcraftSemanticText);

  for (const candidate of normalizedCandidates) {
    const ownedPart = fontPickerOwnedTypographyPartLabels.get(candidate);

    if (ownedPart) {
      return ownedPart;
    }
  }

  return undefined;
}

function getToolcraftControlSemanticCluster(
  controlId: string,
  control: ToolcraftControlSchema,
): string {
  const text = [
    controlId,
    getToolcraftTargetProperty(control.target),
    getControlLabelText(control),
    control.description ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  for (const [cluster, pattern] of controlSemanticClusterPatterns) {
    if (pattern.test(text)) {
      return cluster;
    }
  }

  return inferToolcraftControlOrderRole(controlId, control);
}

function normalizeToolcraftConditionValue(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const normalized = normalizeToolcraftSemanticText(String(value));
    return normalized || null;
  }

  return null;
}

function getToolcraftConditionBranchTexts(
  condition: ToolcraftControlConditionSchema,
  gateControl: ToolcraftControlSchema,
): string[] {
  const rawValues =
    "equals" in condition
      ? [condition.equals]
      : Array.isArray(condition.oneOf)
        ? [...condition.oneOf]
        : [];
  const normalizedValues = rawValues
    .map(normalizeToolcraftConditionValue)
    .filter((value): value is string => Boolean(value));
  const optionLabels = (gateControl.options ?? [])
    .filter((option) =>
      normalizedValues.includes(normalizeToolcraftSemanticText(option.value)),
    )
    .map((option) => normalizeToolcraftSemanticText(option.label))
    .filter(Boolean);

  return [...new Set([...normalizedValues, ...optionLabels])];
}

function sectionTitleLooksLikeDependencyBranch({
  condition,
  gateControl,
  sectionTitle,
}: {
  condition: ToolcraftControlConditionSchema;
  gateControl: ToolcraftControlSchema;
  sectionTitle: string | undefined;
}): boolean {
  const sectionText = normalizeToolcraftSemanticText(sectionTitle);

  if (!sectionText) {
    return false;
  }

  return getToolcraftConditionBranchTexts(condition, gateControl).some(
    (branchText) =>
      branchText.length > 2 &&
      (sectionText === branchText ||
        sectionText.includes(branchText) ||
        branchText.includes(sectionText)),
  );
}

function isToolcraftProductSectionControl(control: ToolcraftControlSchema): boolean {
  return (
    control.type !== "panelActions" &&
    control.type !== "settingsTransfer" &&
    !isRuntimeSetupControlTarget(control.target)
  );
}

function isToolcraftVisibleAcceptanceControl(control: ToolcraftControlSchema): boolean {
  return control.type === "panelActions" || isToolcraftProductSectionControl(control);
}

function getToolcraftGenericControlLabelError({
  control,
  controlId,
  sectionLabel,
  sectionLoosePrefixCount,
  sectionTitle,
}: {
  control: ToolcraftControlSchema;
  controlId: string;
  sectionLabel: string;
  sectionLoosePrefixCount: number;
  sectionTitle: string | undefined;
}): string | undefined {
  const label = getControlLabelText(control).trim();

  if (!genericControlLabelPattern.test(label)) {
    return undefined;
  }

  const hasWeakContext =
    isToolcraftWeakSectionContext(sectionTitle) ||
    (sectionLoosePrefixCount > 1 &&
      !doesToolcraftSectionMatchTarget(sectionTitle, control.target));

  if (!hasWeakContext) {
    return undefined;
  }

  const suggestedLabel = getToolcraftSuggestedControlLabel(control, sectionTitle);

  return `${sectionLabel} / ${controlId} label "${label}" is too generic in this context. Short labels are allowed when the nearest visible section or group clearly names the affected product entity. Rename it to "${suggestedLabel}".`;
}

function getToolcraftControlDescriptionError({
  control,
  controlId,
  sectionLabel,
  sectionTitle,
}: {
  control: ToolcraftControlSchema;
  controlId: string;
  sectionLabel: string;
  sectionTitle: string | undefined;
}): string | undefined {
  const description = control.description?.trim();

  if (!description) {
    return undefined;
  }

  const label = getControlLabelText(control).trim();

  if (
    isToolcraftObviousColorSectionControlDescription({
      control,
      description,
      label,
      sectionTitle,
    })
  ) {
    return `${sectionLabel} / ${controlId} description adds a help icon to an obvious color-section control. Omit control.description when the section title and visible label already explain the setting.`;
  }

  if (control.type !== "fontPicker") {
    return undefined;
  }

  const repeatedParts = fontPickerDescriptionOwnedPartPatterns
    .filter(([, pattern]) => pattern.test(description))
    .map(([part]) => part);

  if (repeatedParts.length < 2) {
    return undefined;
  }

  return `${sectionLabel} / ${controlId} description repeats FontPicker-owned fields (${repeatedParts.join(", ")}). FontPicker help must explain only non-obvious product behavior; use section titles and visible field labels for font family, weight, size, case, color, opacity, letter spacing, and line height, or omit description.`;
}

function isToolcraftColorSectionTitle(sectionTitle: string | undefined): boolean {
  return /\b(colou?rs?|palette|palettes|shades?|accents?)\b/i.test(
    sectionTitle ?? "",
  );
}

function isToolcraftSequentialColorLabel(label: string): boolean {
  return /^colou?r\s+\d+$/i.test(label.trim());
}

function isToolcraftPaletteVariationTarget(target: string): boolean {
  return (
    /(?:^|\.)(?:palette|palettes|colou?rs?|shades?|accents?)\b/i.test(
      target,
    ) || /(?:^|\.)(?:accent|shade|colou?r)\d+\b/i.test(target)
  );
}

function isToolcraftSimplePaletteDistributionLabel(label: string): boolean {
  return /^(spread|mix|distribution)$/i.test(label.trim());
}

function isToolcraftGenericControlHelpDescription(description: string): boolean {
  return /^(adjusts?|changes?|chooses?|controls?|defines?|selects?|sets?|updates?)\b/i.test(
    description.trim(),
  );
}

function isToolcraftObviousColorSectionControlDescription({
  control,
  description,
  label,
  sectionTitle,
}: {
  control: ToolcraftControlSchema;
  description: string;
  label: string;
  sectionTitle: string | undefined;
}): boolean {
  if (!isToolcraftColorSectionTitle(sectionTitle)) {
    return false;
  }

  if (
    (control.type === "color" || control.type === "colorOpacity") &&
    isToolcraftSequentialColorLabel(label)
  ) {
    return true;
  }

  return (
    isToolcraftSimplePaletteDistributionLabel(label) &&
    isToolcraftGenericControlHelpDescription(description)
  );
}

function getToolcraftColorBankLabelErrors({
  controls,
  sectionLabel,
  sectionTitle,
}: {
  controls: readonly [string, ToolcraftControlSchema][];
  sectionLabel: string;
  sectionTitle: string | undefined;
}): string[] {
  const colorControls = controls.filter(([, control]) => {
    if (control.type !== "color" && control.type !== "colorOpacity") {
      return false;
    }

    return true;
  });

  if (colorControls.length < 2) {
    return [];
  }

  const loosePrefixes = new Set(
    colorControls
      .map(([, control]) => getToolcraftLooseTargetPrefix(control.target))
      .filter((prefix): prefix is string => Boolean(prefix)),
  );

  if (loosePrefixes.size !== 1) {
    return [];
  }

  const sequentialColorControls = colorControls.filter(([, control]) =>
    isToolcraftSequentialColorLabel(getControlLabelText(control)),
  );
  const isPaletteVariationBank =
    colorControls.every(([, control]) =>
      isToolcraftPaletteVariationTarget(control.target),
    ) ||
    (isToolcraftColorSectionTitle(sectionTitle) &&
      sequentialColorControls.length > 0);

  if (!isPaletteVariationBank) {
    return [];
  }

  const visibleColorControls = colorControls.filter(([, control]) =>
    hasVisibleControlLabel(control),
  );
  const errors: string[] = [];

  if (
    visibleColorControls.length > 0 &&
    visibleColorControls.length < colorControls.length
  ) {
    errors.push(
      `${sectionLabel} mixes labeled and unlabeled color items in one palette variation group. Decide label visibility for the whole group: omit all per-item labels when colors only add variety, or label every item only when each color has a distinct user-facing role.`,
    );
  }

  for (const [controlId, control] of sequentialColorControls) {
    const label = getControlLabelText(control).trim();

    errors.push(
      `${sectionLabel} / ${controlId} uses visible label "${label}" for a palette variation color. When colors only add variety to one shared palette, set label: false or use collectionActions with unlabeled items. Keep visible labels only when each color edits a distinct user-facing entity such as Fill, Stroke, Background, Connector, or Object color.`,
    );
  }

  return errors;
}

function getToolcraftSectionInventoryByTitle(
  sectionInventory: readonly ToolcraftControlSectionInventoryEntry[],
): Map<string, ToolcraftControlSectionInventoryEntry> {
  return new Map(
    sectionInventory.map((entry) => [entry.title.trim(), entry]),
  );
}

function hasToolcraftInventorySplitEvidence({
  sectionInventoryByTitle,
  sections,
}: {
  sectionInventoryByTitle: ReadonlyMap<string, ToolcraftControlSectionInventoryEntry>;
  sections: ReadonlySet<string>;
}): boolean {
  const entries = [...sections].map((sectionLabel) =>
    sectionInventoryByTitle.get(sectionLabel),
  );

  return (
    entries.length === sections.size &&
    entries.every(
      (entry) =>
        entry &&
        (entry.workflowStage?.trim().length ?? 0) > 0 &&
        (entry.splitReason?.trim().length ?? 0) >= 12,
    )
  );
}

function getToolcraftControlSectionInventoryErrors(
  schema: ResolvedToolcraftAppSchema,
  sectionInventory: readonly ToolcraftControlSectionInventoryEntry[],
): string[] {
  const errors: string[] = [];

  if (sectionInventory.length === 0) {
    return errors;
  }

  const schemaSections = (schema.panels.controls?.sections ?? []).flatMap(
    (section, sectionIndex) => {
      const targets = Object.values(section.controls)
        .filter(isToolcraftProductSectionControl)
        .map((control) => control.target);

      if (targets.length === 0) {
        return [];
      }

      return [
        {
          label: getToolcraftSectionLabel(section.title, sectionIndex),
          targets,
        },
      ];
    },
  );
  const schemaSectionTitles = new Set(schemaSections.map((section) => section.label));
  const schemaTargetToSection = new Map<string, string>();

  for (const section of schemaSections) {
    for (const target of section.targets) {
      schemaTargetToSection.set(target, section.label);
    }
  }

  const inventoryTitleCounts = new Map<string, number>();
  const inventoryTargetToSection = new Map<string, string>();

  for (const entry of sectionInventory) {
    const title = entry.title.trim();
    const entity = entry.entity?.trim() ?? "";
    const workflowStage = entry.workflowStage?.trim() ?? "";
    const groupingReason = entry.groupingReason.trim();
    const splitReason = entry.splitReason?.trim() ?? "";

    if (!title) {
      errors.push(
        "Control Section Inventory contains an entry without a section title.",
      );
      continue;
    }

    inventoryTitleCounts.set(title, (inventoryTitleCounts.get(title) ?? 0) + 1);

    if (!schemaSectionTitles.has(title)) {
      errors.push(
        `Control Section Inventory references "${title}", but no rendered product controls section uses that title.`,
      );
    }

    if (!entity && !workflowStage) {
      errors.push(
        `Control Section Inventory entry "${title}" must declare entity or workflowStage so grouping is based on product meaning, not UI layout.`,
      );
    }

    if (groupingReason.length < 12) {
      errors.push(
        `Control Section Inventory entry "${title}" must include a concrete groupingReason explaining why these controls belong together.`,
      );
    }

    if (splitReason && splitReason.length < 12) {
      errors.push(
        `Control Section Inventory entry "${title}" splitReason is too vague. Explain the product workflow split or omit splitReason.`,
      );
    }

    if (entry.targets.length === 0) {
      errors.push(
        `Control Section Inventory entry "${title}" must list the product control targets rendered in that section.`,
      );
    }

    for (const target of entry.targets) {
      const schemaSection = schemaTargetToSection.get(target);

      if (!schemaSection) {
        errors.push(
          `Control Section Inventory entry "${title}" lists target "${target}", but that target is not rendered by any product controls section.`,
        );
        continue;
      }

      if (schemaSection !== title) {
        errors.push(
          `Control Section Inventory entry "${title}" lists target "${target}", but the schema renders it in "${schemaSection}". Update the schema grouping or the inventory.`,
        );
      }

      const existingSection = inventoryTargetToSection.get(target);

      if (existingSection && existingSection !== title) {
        errors.push(
          `Control Section Inventory lists target "${target}" in both "${existingSection}" and "${title}". Each product control target belongs to exactly one section inventory entry.`,
        );
      }

      inventoryTargetToSection.set(target, title);
    }
  }

  for (const [title, count] of inventoryTitleCounts) {
    if (count > 1) {
      errors.push(
        `Control Section Inventory repeats section "${title}" ${count} times. Section inventory entries must be unique.`,
      );
    }
  }

  for (const section of schemaSections) {
    const entry = sectionInventory.find(
      (inventoryEntry) => inventoryEntry.title.trim() === section.label,
    );

    if (!entry) {
      errors.push(
        `Control Section Inventory is missing product section "${section.label}". Add its entity/workflow stage, targets, and groupingReason.`,
      );
      continue;
    }

    const inventoryTargets = new Set(entry.targets);

    for (const target of section.targets) {
      if (!inventoryTargets.has(target)) {
        errors.push(
          `Control Section Inventory entry "${section.label}" is missing rendered target "${target}". The inventory must cover every product control in the section.`,
        );
      }
    }
  }

  return errors;
}

function getToolcraftControlSectionGroupingErrors(
  schema: ResolvedToolcraftAppSchema,
  sectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = [],
): string[] {
  const errors: string[] = [];
  const visibleControls: Array<{
    control: ToolcraftControlSchema;
    controlId: string;
    loosePrefix: string | null;
    sectionLabel: string;
    sectionTitle: string | undefined;
  }> = [];
  const strictPrefixSections = new Map<string, Set<string>>();
  const loosePrefixSections = new Map<string, Set<string>>();
  const colorSectionLoosePrefixes = new Map<string, string>();
  const sectionInventoryByTitle = getToolcraftSectionInventoryByTitle(sectionInventory);
  const sectionTitleCounts = new Map<string, { count: number; label: string }>();
  const controlsByTarget = new Map<
    string,
    {
      control: ToolcraftControlSchema;
      controlId: string;
      loosePrefix: string | null;
      sectionLabel: string;
      sectionTitle: string | undefined;
    }
  >();

  for (const [sectionIndex, section] of (schema.panels.controls?.sections ?? []).entries()) {
    const sectionTitle = section.title?.trim();
    const sectionLabel = getToolcraftSectionLabel(sectionTitle, sectionIndex);
    const controls = Object.entries(section.controls).filter(([, control]) =>
      isToolcraftProductSectionControl(control),
    );

    if (controls.length === 0) {
      continue;
    }

    if (!sectionTitle) {
      errors.push(
        `${sectionLabel} is missing a controls section title. Every visible controls-panel section must name the product entity, workflow stage, or behavior it edits.`,
      );
    }

    if (sectionTitle) {
      const normalizedSectionTitle = normalizeToolcraftSemanticText(sectionTitle);
      const titleCount = sectionTitleCounts.get(normalizedSectionTitle);
      sectionTitleCounts.set(normalizedSectionTitle, {
        count: (titleCount?.count ?? 0) + 1,
        label: titleCount?.label ?? sectionTitle,
      });
    }

    if (sectionTitle && genericControlSectionTitlePattern.test(sectionTitle)) {
      errors.push(
        `${sectionLabel} is too generic for a controls section. Name the product entity, workflow stage, or behavior it edits instead of using a bucket title.`,
      );
    }

    if (sectionTitle && controlTypeSectionTitlePattern.test(sectionTitle)) {
      errors.push(
        `${sectionLabel} names a UI control type instead of the product entity. Group controls by product meaning, not by Slider, Color, Input, Button, or similar component type.`,
      );
    }

    const sectionLoosePrefixes = new Set(
      controls
        .map(([, control]) => getToolcraftLooseTargetPrefix(control.target))
        .filter((prefix): prefix is string => Boolean(prefix)),
    );
    const productControls = controls.filter(([, control]) =>
      isToolcraftProductSectionControl(control),
    );
    const semanticClusters = new Set(
      productControls.map(([controlId, control]) =>
        getToolcraftControlSemanticCluster(controlId, control),
      ),
    );
    const clusterList = [...semanticClusters].join(", ");
    const hasBroadSectionTitle =
      sectionTitle !== undefined && broadControlSectionTitlePattern.test(sectionTitle);

    if (
      productControls.length > maxPreferredControlsPerSection &&
      hasBroadSectionTitle &&
      semanticClusters.size >= 3
    ) {
      errors.push(
        `${sectionLabel} has ${productControls.length} controls across multiple semantic clusters (${clusterList}). Broad section titles are only valid for small cohesive groups; split this into discrete sections with specific titles such as motion, geometry, density, color, typography, or export sub-entities.`,
      );
    }

    if (productControls.length > maxHardControlsPerSection && semanticClusters.size > 1) {
      errors.push(
        `${sectionLabel} has ${productControls.length} controls across ${semanticClusters.size} semantic clusters (${clusterList}). Controls-panel sections should stay discrete; split sections that grow past ${maxHardControlsPerSection} controls unless every control edits one tightly scoped entity.`,
      );
    }

    errors.push(
      ...getToolcraftColorBankLabelErrors({
        controls,
        sectionLabel,
        sectionTitle,
      }),
    );

    for (const [controlId, control] of controls) {
      const strictPrefix = getToolcraftStrictTargetPrefix(control.target);
      const loosePrefix = getToolcraftLooseTargetPrefix(control.target);
      const genericLabelError = getToolcraftGenericControlLabelError({
        control,
        controlId,
        sectionLabel,
        sectionLoosePrefixCount: sectionLoosePrefixes.size,
        sectionTitle,
      });

      if (genericLabelError) {
        errors.push(genericLabelError);
      }

      const descriptionError = getToolcraftControlDescriptionError({
        control,
        controlId,
        sectionLabel,
        sectionTitle,
      });

      if (descriptionError) {
        errors.push(descriptionError);
      }

      visibleControls.push({
        control,
        controlId,
        loosePrefix,
        sectionLabel,
        sectionTitle,
      });
      controlsByTarget.set(control.target, {
        control,
        controlId,
        loosePrefix,
        sectionLabel,
        sectionTitle,
      });

      if (strictPrefix) {
        const sections = strictPrefixSections.get(strictPrefix) ?? new Set<string>();
        sections.add(sectionLabel);
        strictPrefixSections.set(strictPrefix, sections);
      }

      if (loosePrefix) {
        const sections = loosePrefixSections.get(loosePrefix) ?? new Set<string>();
        sections.add(sectionLabel);
        loosePrefixSections.set(loosePrefix, sections);
      }

      if (
        control.type === "color" &&
        sectionTitle &&
        /^colors?$/i.test(sectionTitle) &&
        loosePrefix
      ) {
        colorSectionLoosePrefixes.set(loosePrefix, `${sectionLabel} / ${controlId}`);
      }
    }
  }

  for (const { count, label } of sectionTitleCounts.values()) {
    if (count > 1) {
      errors.push(
        `Controls panel repeats the section title "${label}" ${count} times. Section titles must be unique and describe distinct product entities or workflow stages.`,
      );
    }
  }

  for (const item of visibleControls) {
    for (const [conditionName, condition] of [
      ["visibleWhen", item.control.visibleWhen],
      ["disabledWhen", item.control.disabledWhen],
    ] as const) {
      if (!condition || !item.loosePrefix) {
        continue;
      }

      const gateControl = controlsByTarget.get(condition.target);

      if (!gateControl || gateControl.sectionLabel === item.sectionLabel) {
        continue;
      }

      const sharesTargetEntity =
        gateControl.loosePrefix !== null &&
        gateControl.loosePrefix === item.loosePrefix;
      const looksLikeBranchSection =
        conditionName === "visibleWhen" &&
        sectionTitleLooksLikeDependencyBranch({
          condition,
          gateControl: gateControl.control,
          sectionTitle: item.sectionTitle,
        });

      if (!sharesTargetEntity && !looksLikeBranchSection) {
        continue;
      }

      errors.push(
        `${item.sectionLabel} / ${item.controlId} is gated by ${conditionName} target "${condition.target}" in ${gateControl.sectionLabel}, but it belongs to the same dependency group. Keep selectors and their dependent controls in one semantic section when they describe one product entity or branch; use visibleWhen for branch-specific controls inside that section instead of splitting branch controls into their own section. Do not use disabledWhen for product controls.`,
      );
    }
  }

  const fontPickerControls = visibleControls.filter(
    (item) => item.control.type === "fontPicker" && item.loosePrefix,
  );

  for (const item of visibleControls) {
    if (!item.loosePrefix || item.control.type === "fontPicker") {
      continue;
    }

    const ownedTypographyPart =
      getToolcraftFontPickerOwnedTypographyPart(item.control);

    if (!ownedTypographyPart) {
      continue;
    }

    const owningFontPicker = fontPickerControls.find(
      (fontPicker) => fontPicker.loosePrefix === item.loosePrefix,
    );

    if (!owningFontPicker) {
      continue;
    }

    const label = getControlLabelText(item.control).trim() || item.controlId;

    errors.push(
      `${item.sectionLabel} / ${item.controlId} splits "${label}" out of the FontPicker-owned typography block for "${item.loosePrefix}". Keep font family, weight, size, case, letter spacing, line height, color, and opacity in the same fontPicker value.`,
    );
  }

  for (const [prefix, sections] of strictPrefixSections) {
    if (
      sections.size > 1 &&
      !hasToolcraftInventorySplitEvidence({ sectionInventoryByTitle, sections })
    ) {
      errors.push(
        `Controls for product entity "${prefix}" are split across sections: ${[...sections].join(", ")}. Keep controls for the same product entity in one semantic section unless the Control Section Inventory declares workflowStage and splitReason for every split section.`,
      );
    }
  }

  for (const [prefix, colorControlLabel] of colorSectionLoosePrefixes) {
    const sections = loosePrefixSections.get(prefix);

    if (sections && sections.size > 1) {
      errors.push(
        `${colorControlLabel} is separated from other "${prefix}" controls. A color that configures the same product entity belongs inside that entity section with a concise field label that stays unambiguous in context.`,
      );
    }
  }

  return errors;
}

export function collectToolcraftVisibleControls(
  schema: ResolvedToolcraftAppSchema = appSchema,
): ToolcraftVisibleControl[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls)
      .filter(([, control]) => isToolcraftVisibleAcceptanceControl(control))
      .map(([controlId, control]) => ({
        control,
        controlId,
        sectionTitle: section.title,
      })),
  );
}

export function collectToolcraftKeyframeableControls(
  schema: ResolvedToolcraftAppSchema = appSchema,
): ToolcraftVisibleControl[] {
  return collectToolcraftVisibleControls(schema).filter(
    ({ control }) => getToolcraftControlKeyframeCapability(control).capable,
  );
}

export function getToolcraftControlOrder(
  schema: ResolvedToolcraftAppSchema = appSchema,
): ToolcraftControlOrderItem[] {
  return (schema.panels.controls?.sections ?? []).flatMap((section) =>
    Object.entries(section.controls)
      .filter(([, control]) => isToolcraftProductSectionControl(control))
      .map(([controlId, control]) => {
        const role = inferToolcraftControlOrderRole(controlId, control);

        return {
          controlId,
          rank: controlOrderRoleRanks[role],
          role,
          sectionTitle: section.title,
          target: control.target,
          type: control.type,
        };
      }),
  );
}

export function getToolcraftControlOrderTargets(
  schema: ResolvedToolcraftAppSchema = appSchema,
): string[] {
  return getToolcraftControlOrder(schema).map((item) => item.target);
}

export function validateToolcraftAcceptanceCoverage(
  schema: ResolvedToolcraftAppSchema = appSchema,
  acceptance: readonly ToolcraftComponentAcceptance[] = appAcceptance,
  transferMode: ToolcraftTransferMode = appTransferMode,
  sectionInventory: readonly ToolcraftControlSectionInventoryEntry[] = starterControlSectionInventory,
): string[] {
  const errors: string[] = [];
  const controls = collectToolcraftVisibleControls(schema);
  const controlAcceptance = new Map(
    acceptance
      .filter((entry) => entry.kind === "control")
      .map((entry) => [entry.target, entry]),
  );
  const timelineMode = schema.panels.timeline?.enabled ? schema.panels.timeline.mode : null;
  const layersEnabled = Boolean(schema.panels.layers);
  const controlTargets = new Set(controls.map(({ control }) => control.target));
  const animationIntent = transferMode.animationIntent;
  const hasVideoExportAction = schemaHasVideoExportPanelAction(schema);
  const animationControls = controls.filter(
    (visibleControl) =>
      visibleControl.control.type !== "panelActions" &&
      animationIntentControlPattern.test(getAnimationIntentControlText(visibleControl)),
  );
  const commandTargets = new Set([
    "canvas.center",
    "canvas.setOffset",
    "canvas.setSize",
    "canvas.setViewport",
    "canvas.zoomIn",
    "canvas.zoomOut",
    "controls.setValue",
    "history.redo",
    "history.undo",
  ]);

  errors.push(...getToolcraftRuntimeSetupSectionErrors(schema));
  errors.push(...getToolcraftControlOrderErrors(schema));
  errors.push(...getToolcraftControlSectionGroupingErrors(schema, sectionInventory));
  errors.push(...getToolcraftControlSectionInventoryErrors(schema, sectionInventory));

  const transferModeEvidenceText = getToolcraftTransferModeEvidenceText(transferMode);

  if (
    videoReferenceEvidencePattern.test(transferModeEvidenceText) &&
    !transferMode.videoReferenceStudy
  ) {
    errors.push(
      "appTransferMode cites a video reference, screen recording, GIF, extracted frames, or contact sheet; declare videoReferenceStudy with storyboard frames, frame-to-frame transition analysis, behavior decomposition, and acceptance mapping before implementation.",
    );
  }

  if (transferMode.videoReferenceStudy) {
    errors.push(
      ...validateToolcraftVideoReferenceStudy(
        transferMode.videoReferenceStudy,
        acceptance,
      ),
    );
  }

  for (const [sectionIndex, section] of (schema.panels.controls?.sections ?? []).entries()) {
    const sectionLabel = getToolcraftSectionLabel(section.title, sectionIndex);

    for (const layoutGroup of section.layoutGroups ?? []) {
      if (layoutGroup.layout !== "inline") {
        continue;
      }

      const rangeSliderIds = layoutGroup.controls.filter(
        (controlId) => section.controls[controlId]?.type === "rangeSlider",
      );

      if (rangeSliderIds.length > 0) {
        errors.push(
          `${sectionLabel} layoutGroups inline row "${layoutGroup.controls.join(", ")}" includes rangeSlider ${rangeSliderIds.join(", ")}. RangeSlider is a full-width two-thumb control and must not share a row with another slider or range slider.`,
        );
      }

      const segmentedIds = layoutGroup.controls.filter(
        (controlId) => section.controls[controlId]?.type === "segmented",
      );

      if (segmentedIds.length > 0) {
        errors.push(
          `${sectionLabel} layoutGroups inline row "${layoutGroup.controls.join(", ")}" includes segmented control ${segmentedIds.join(", ")}. Segmented is full-width and must not share a two-column or half-width row; use Select when a finite choice must fit beside another control.`,
        );
      }

      const switchEntries = layoutGroup.controls
        .map((controlId) => [controlId, section.controls[controlId]] as const)
        .filter(
          (entry): entry is readonly [string, ToolcraftControlSchema] =>
            Boolean(entry[1]) && entry[1].type === "switch",
        );
      const booleanEntries = layoutGroup.controls
        .map((controlId) => [controlId, section.controls[controlId]] as const)
        .filter(
          (entry): entry is readonly [string, ToolcraftControlSchema] =>
            Boolean(entry[1]) && isBooleanControl(entry[1]),
        );
      const parameterEntries = layoutGroup.controls
        .map((controlId) => [controlId, section.controls[controlId]] as const)
        .filter(
          (entry): entry is readonly [string, ToolcraftControlSchema] =>
            Boolean(entry[1]) && !isBooleanControl(entry[1]),
        );

      if (switchEntries.length > 1) {
        const unsafeSwitchLabels = switchEntries.filter(
          ([controlId, control]) => !isInlineSwitchLabelSafe(controlId, control),
        );

        if (unsafeSwitchLabels.length > 0) {
          errors.push(
            `${sectionLabel} layoutGroups inline row "${layoutGroup.controls.join(", ")}" includes switch labels ${unsafeSwitchLabels.map(([controlId, control]) => `${controlId} "${getInlineSwitchLabelText(controlId, control)}"`).join(", ")} that are too long for a two-column toggle row. Switches share a row only when every visible label fits without truncation; shorten labels or stack them.`,
          );
        }
      }

      if (booleanEntries.length === 1 && parameterEntries.length === 1) {
        const unsafeBooleanLabels = booleanEntries.filter(
          ([controlId, control]) => !isInlineSwitchLabelSafe(controlId, control),
        );

        if (unsafeBooleanLabels.length > 0) {
          errors.push(
            `${sectionLabel} layoutGroups inline row "${layoutGroup.controls.join(", ")}" includes toggle label ${unsafeBooleanLabels.map(([controlId, control]) => `${controlId} "${getInlineSwitchLabelText(controlId, control)}"`).join(", ")} that is too long for a compact toggle-plus-parameter row. Keep the toggle label short, such as "Include" inside Background, or stack the controls.`,
          );
        }

        const visibleParameterLabels = parameterEntries.filter(
          ([, control]) => control.label !== false,
        );

        if (visibleParameterLabels.length > 0) {
          errors.push(
            `${sectionLabel} layoutGroups inline row "${layoutGroup.controls.join(", ")}" pairs a toggle with parameter labels ${visibleParameterLabels.map(([controlId, control]) => `${controlId} "${getControlLabelText(control)}"`).join(", ")}. In toggle-plus-parameter rows, the non-toggle parameter must use label false; if that label is needed, stack the controls instead.`,
          );
        }
      }
    }

    const sectionControls = Object.entries(section.controls).filter(([, control]) =>
      isToolcraftProductSectionControl(control),
    );

    for (let index = 0; index < sectionControls.length - 1; index += 1) {
      const [firstControlId, firstControl] = sectionControls[index] ?? [];
      const [secondControlId, secondControl] = sectionControls[index + 1] ?? [];

      if (
        !firstControlId ||
        !secondControlId ||
        !firstControl ||
        !secondControl ||
        firstControl.visibleWhen ||
        secondControl.visibleWhen ||
        !isBooleanControl(firstControl) ||
        !isBooleanControl(secondControl) ||
        !isInlineSwitchLabelSafe(firstControlId, firstControl) ||
        !isInlineSwitchLabelSafe(secondControlId, secondControl) ||
        !controlsShareToolcraftTargetEntity(firstControl, secondControl) ||
        sectionHasInlineLayoutGroupForPair(section, firstControlId, secondControlId)
      ) {
        continue;
      }

      errors.push(
        `${sectionLabel} has adjacent short toggle controls "${firstControlId}" and "${secondControlId}" for the same product entity "${getToolcraftLooseTargetPrefix(firstControl.target)}". Put them in a two-column inline layoutGroup so compact paired toggles share one row.`,
      );
    }
  }

  if (schemaHasPngExportPanelAction(schema)) {
    const backgroundSection = getSchemaControlsSectionByTitle(schema, "Background");
    const backgroundSectionIndex = getSchemaControlsSectionIndexByTitle(schema, "Background");
    const panelActionsSectionIndex = getFirstPanelActionsSectionIndex(schema);
    const imageExportSectionIndex = getSchemaControlsSectionIndexByTitle(schema, "Image Export");
    const videoExportSectionIndex = getSchemaControlsSectionIndexByTitle(schema, "Video Export");
    const expectedOutputSettingsIndex =
      imageExportSectionIndex >= 0 ? imageExportSectionIndex : videoExportSectionIndex;
    const finalExportSettingsIndex = hasVideoExportAction
      ? videoExportSectionIndex
      : imageExportSectionIndex;
    const includeBackgroundEntry = getSectionControlEntryByTarget(
      backgroundSection,
      "export.includeBackground",
    );
    const backgroundColorEntry = getOutputBackgroundColorEntry(backgroundSection);
    const imageExportSection = getSchemaControlsSectionByTitle(schema, "Image Export");
    const imageFormatEntry = getSectionControlEntryByTarget(
      imageExportSection,
      "export.image.format",
    );
    const imageResolutionEntry = getSectionControlEntryByTarget(
      imageExportSection,
      "export.image.resolution",
    );
    const imageFormatControl = imageFormatEntry?.[1];
    const imageResolutionControl = imageResolutionEntry?.[1];
    const imageFormatOptionValues =
      imageFormatControl?.options?.map((option) => option.value.toLowerCase()) ?? [];
    const imageResolutionOptionValues =
      imageResolutionControl?.options?.map((option) => option.value.toLowerCase()) ?? [];

    if (!backgroundSection) {
      errors.push(
        'Product apps with Export PNG must expose a separate controls section titled "Background" directly before the first export settings section.',
      );
    }

    if (
      backgroundSectionIndex >= 0 &&
      expectedOutputSettingsIndex >= 0 &&
      backgroundSectionIndex !== expectedOutputSettingsIndex - 1
    ) {
      errors.push(
        'The "Background" controls section must sit directly before the first export settings section: Image Export when PNG export exists, otherwise Video Export.',
      );
    }

    if (
      finalExportSettingsIndex >= 0 &&
      panelActionsSectionIndex >= 0 &&
      finalExportSettingsIndex !== panelActionsSectionIndex - 1
    ) {
      errors.push(
        'Export settings must sit directly above sticky footer actions: Image Export for still apps, or Video Export after Image Export for animated apps.',
      );
    }

    if (
      hasVideoExportAction &&
      imageExportSectionIndex >= 0 &&
      videoExportSectionIndex >= 0 &&
      imageExportSectionIndex !== videoExportSectionIndex - 1
    ) {
      errors.push(
        'Animated apps with both Export PNG and Export Video must place Image Export immediately before Video Export.',
      );
    }

    if (!schemaHasOutputBackgroundColorControl(controls)) {
      errors.push(
        "Product apps with Export PNG must expose a user-facing background color control such as appearance.background or scene.background. Preview, PNG export, and video export must read that runtime value instead of hardcoding the product background.",
      );
    }

    if (!backgroundColorEntry) {
      errors.push(
        'The "Background" section must contain the renderer-owned background color control, such as appearance.background or scene.background.',
      );
    } else {
      const [, backgroundColorControl] = backgroundColorEntry;

      if (backgroundColorControl.label !== false) {
        errors.push(
          'The background color control inside the required "Background" section must use label false; the section title already supplies the visible context.',
        );
      }
    }

    if (!schemaHasOutputBackgroundToggleControl(controls)) {
      errors.push(
        'Product apps with Export PNG must expose export.includeBackground inside the required "Background" section as a Switch labeled "Include". PNG export must pass that runtime value to createToolcraftPngExportCanvas includeBackground; live preview must use shouldIncludeToolcraftPreviewBackground(state); video export keeps the background.',
      );
    }

    if (!includeBackgroundEntry) {
      errors.push(
        'The "Background" section must contain export.includeBackground as the Include switch.',
      );
    } else {
      const [, includeBackgroundControl] = includeBackgroundEntry;

      if (includeBackgroundControl.type !== "switch") {
        errors.push('export.includeBackground must be a Switch control labeled "Include".');
      }

      if (getControlLabelText(includeBackgroundControl) !== "Include") {
        errors.push(
          'export.includeBackground must use the short visible label "Include"; the Background section title already supplies the rest of the context.',
        );
      }
    }

    if (
      !sectionHasEqualWidthOutputBackgroundRow(
        backgroundSection,
        includeBackgroundEntry?.[0],
        backgroundColorEntry?.[0],
      )
    ) {
      errors.push(
        'The "Background" section must render export.includeBackground and the background color in one two-column inline layoutGroup, with Include on the left and the unlabeled background color on the right.',
      );
    }

    if (!imageExportSection) {
      errors.push(
        'Apps with Export PNG must expose image export settings in a separate controls section titled "Image Export" directly above sticky footer export actions or directly before "Video Export" when video export also exists.',
      );
    }

    if (!imageFormatControl) {
      errors.push(
        'The separate "Image Export" section must include a format control with target "export.image.format".',
      );
    } else {
      if (imageFormatControl.type !== "select") {
        errors.push(
          'Image Export format must be a Select control so it matches the Video Export settings structure.',
        );
      }

      if (!imageFormatOptionValues.includes("png") || !imageFormatOptionValues.includes("jpg")) {
        errors.push('Image Export format options must include "png" and "jpg".');
      }

      if (imageFormatControl.defaultValue !== "png") {
        errors.push('Image Export format must default to "png".');
      }
    }

    if (!imageResolutionControl) {
      errors.push(
        'The separate "Image Export" section must include a resolution control with target "export.image.resolution".',
      );
    } else {
      if (imageResolutionControl.type !== "select") {
        errors.push(
          'Image Export resolution must be a Select control so it matches the Video Export settings structure.',
        );
      }

      if (
        !imageResolutionOptionValues.includes("2k") ||
        !imageResolutionOptionValues.includes("4k") ||
        !imageResolutionOptionValues.includes("8k")
      ) {
        errors.push(
          'Image Export resolution options must include "2k", "4k", and "8k".',
        );
      }

      if (imageResolutionControl.defaultValue !== "4k") {
        errors.push('Image Export resolution must default to "4k".');
      }
    }

    const imageFormatControlId = imageFormatEntry?.[0];
    const imageResolutionControlId = imageResolutionEntry?.[0];
    const imageExportHasInlinePair =
      imageExportSection === undefined ||
      imageFormatControlId === undefined ||
      imageResolutionControlId === undefined
        ? false
        : sectionHasInlineLayoutGroupForPair(
            imageExportSection,
            imageFormatControlId,
            imageResolutionControlId,
          );

    if (!imageExportHasInlinePair) {
      errors.push(
        "Image Export format and resolution must render as one compact two-column inline row, matching Video Export settings.",
      );
    }
  }

  if (hasVideoExportAction && !timelineMode) {
    errors.push(
      'Apps with Export Video must enable the top Toolcraft timeline. Use panels.timeline mode "playback" for product animation transport, or mode "keyframes" when exported animation is driven by keyframes; autonomous no-timeline animation is only allowed when there is no video export.',
    );
  }

  if (animationControls.length > 0 && !timelineMode && animationIntent?.mode !== "autonomous") {
    errors.push(
      [
        `Animation controls ${animationControls.map(({ control, controlId, sectionTitle }) => `"${sectionTitle ? `${sectionTitle} / ` : ""}${controlId}" (${control.target})`).join(", ")} exist while panels.timeline is omitted.`,
        'Use panels.timeline mode "playback" for product animation transport, mode "keyframes" for editable keyframes, or declare appTransferMode.animationIntent mode "autonomous" with coverage proving there is no user-facing transport.',
      ].join(" "),
    );
  }

  if (animationIntent?.mode === "autonomous") {
    const declaredAutonomousCoverage = new Set(animationIntent.behaviorCoverage);
    const missingAutonomousCoverage = requiredAutonomousAnimationCoverage.filter(
      (coverage) => !declaredAutonomousCoverage.has(coverage),
    );

    if (timelineMode) {
      errors.push(
        `appTransferMode.animationIntent mode "autonomous" conflicts with panels.timeline mode "${timelineMode}". Use timeline-playback, timeline-keyframes, or remove the timeline.`,
      );
    }

    if (hasVideoExportAction) {
      errors.push(
        'appTransferMode.animationIntent mode "autonomous" conflicts with Export Video. Video export creates product-time behavior, so the renderer and export must use the top Toolcraft timeline duration, loop, and deterministic timestamps.',
      );
    }

    if (!animationIntent.reason.trim()) {
      errors.push(
        'appTransferMode.animationIntent mode "autonomous" must include a reason explaining why the animation is decorative/self-running and does not need top timeline transport.',
      );
    }

    if (missingAutonomousCoverage.length > 0) {
      errors.push(
        `appTransferMode.animationIntent mode "autonomous" must include behaviorCoverage ${missingAutonomousCoverage.map((coverage) => `"${coverage}"`).join(", ")}.`,
      );
    }
  }

  if (animationIntent?.mode === "timeline-playback" && timelineMode !== "playback") {
    errors.push(
      'appTransferMode.animationIntent mode "timeline-playback" requires panels.timeline mode "playback".',
    );
  }

  if (animationIntent?.mode === "timeline-keyframes" && timelineMode !== "keyframes") {
    errors.push(
      'appTransferMode.animationIntent mode "timeline-keyframes" requires panels.timeline mode "keyframes".',
    );
  }

  if (
    transferMode.mode === "new-toolcraft-app" &&
    timelineMode === "playback" &&
    animationIntent?.mode !== "timeline-playback"
  ) {
    errors.push(
      'panels.timeline mode "playback" requires appTransferMode.animationIntent mode "timeline-playback" with loopDuration provenance.',
    );
  }

  if (
    transferMode.mode === "new-toolcraft-app" &&
    timelineMode === "keyframes" &&
    animationIntent?.mode !== "timeline-keyframes"
  ) {
    errors.push(
      'panels.timeline mode "keyframes" requires appTransferMode.animationIntent mode "timeline-keyframes" with loopDuration provenance.',
    );
  }

  if (
    timelineMode &&
    (animationIntent?.mode === "timeline-playback" ||
      animationIntent?.mode === "timeline-keyframes")
  ) {
    const timelineDefaultDurationSeconds = schema.panels.timeline?.defaultDurationSeconds;
    const loopDuration = getTimelineLoopDurationIntent(animationIntent);

    if (!loopDuration) {
      errors.push(
        `appTransferMode.animationIntent mode "${animationIntent.mode}" must declare loopDuration with source, seconds, and evidence. Do not let runtime/template fallback duration such as 8s stand in for product loop intent.`,
      );
    } else {
      if (
        !Number.isFinite(loopDuration.seconds) ||
        loopDuration.seconds <= 0
      ) {
        errors.push(
          `appTransferMode.animationIntent.loopDuration.seconds must be a positive finite duration; received ${String(loopDuration.seconds)}.`,
        );
      }

      if (!isValidTimelineLoopDurationSource(loopDuration.source)) {
        errors.push(
          `appTransferMode.animationIntent.loopDuration.source must be "reference", "user-request", or "product-derived"; received "${String(loopDuration.source)}". Runtime/template fallback is not a valid loop-duration source.`,
        );
      }

      if (!loopDuration.evidence.trim()) {
        errors.push(
          "appTransferMode.animationIntent.loopDuration.evidence must explain where the initial loop duration came from, such as reference timing, an explicit user request, or a product-derived timing rule.",
        );
      }

      if (runtimeDefaultLoopDurationEvidencePattern.test(loopDuration.evidence)) {
        errors.push(
          "appTransferMode.animationIntent.loopDuration.evidence must not cite the runtime/template fallback 8s default as the product loop source. Use reference timing, an explicit user request, or a product-derived timing rule.",
        );
      }

      if (typeof timelineDefaultDurationSeconds !== "number") {
        errors.push(
          "Timeline playback/keyframe apps must set panels.timeline.defaultDurationSeconds to the declared loopDuration.seconds so the initial UI duration is not the runtime fallback.",
        );
      } else if (
        Number.isFinite(loopDuration.seconds) &&
        Math.abs(timelineDefaultDurationSeconds - loopDuration.seconds) > 0.001
      ) {
        errors.push(
          `panels.timeline.defaultDurationSeconds (${timelineDefaultDurationSeconds}) must match appTransferMode.animationIntent.loopDuration.seconds (${loopDuration.seconds}).`,
        );
      }
    }
  }

  if (transferMode.mode === "reference-runtime-clone") {
    const declaredReferenceCoverage = new Set(transferMode.behaviorCoverage);
    const referenceTimeline = transferMode.referenceTimeline;
    const referenceStudy = transferMode.referenceStudy;
    const referenceFeatureInventory = transferMode.referenceFeatureInventory ?? [];
    const acceptanceById = new Map(acceptance.map((entry) => [entry.id, entry]));
    const referenceFeatureIds = new Set<string>();
    const referenceFeatureAcceptanceIds = new Set<string>();
    const referenceCoverageFromInventory = new Set<ToolcraftReferenceCoverage>();
    const referenceTimelineCoverageFromInventory =
      new Set<ToolcraftReferenceTimelineCoverage>();

    if (!schema.assembly.surfaces.canvas.enabled) {
      errors.push(
        "reference-runtime-clone must keep the Toolcraft canvas shell enabled; preserve the reference renderer inside ToolcraftApp canvasContent instead of replacing the app with the original UI.",
      );
    }

    if (!transferMode.referenceName.trim()) {
      errors.push(
        "reference-runtime-clone transferMode must name the reference app or artifact.",
      );
    }

    if (transferMode.sourceOfTruth !== "reference-runtime") {
      errors.push(
        'reference-runtime-clone transferMode must set sourceOfTruth to "reference-runtime".',
      );
    }

    if (!referenceStudy) {
      errors.push(
        "reference-runtime-clone transferMode must declare referenceStudy proving the reference was inspected and, when runnable or reconstructable, run or restored locally before implementation.",
      );
    } else {
      if (!referenceStudyStatusValues.has(referenceStudy.status)) {
        errors.push(
          'referenceStudy.status must be "ran-original", "restored-local", or "source-inspection-only".',
        );
      }

      if (!referenceStudy.referenceLocation.trim()) {
        errors.push(
          "referenceStudy.referenceLocation must name the inspected reference folder, URL, artifact, or source location.",
        );
      }

      if (!referenceStudy.sourceEvidence.trim()) {
        errors.push(
          "referenceStudy.sourceEvidence must summarize the source/runtime files, routes, schemas, or assets inspected.",
        );
      }

      if (!referenceStudy.behaviorEvidence.trim()) {
        errors.push(
          "referenceStudy.behaviorEvidence must summarize the runtime/browser behavior checked from the original or restored reference.",
        );
      }

      if (!referenceStudy.reproductionSteps.trim()) {
        errors.push(
          "referenceStudy.reproductionSteps must record how the reference was run, restored in the Toolcraft environment, or why source-only inspection was used.",
        );
      }

      if (referenceStudy.status === "source-inspection-only") {
        if (!referenceStudy.sourceOnlyReason?.trim()) {
          errors.push(
            'referenceStudy.status "source-inspection-only" requires sourceOnlyReason explaining why the reference could not be run or restored locally.',
          );
        } else if (
          !referenceStudySourceOnlyReasonPattern.test(referenceStudy.sourceOnlyReason)
        ) {
          errors.push(
            'referenceStudy.sourceOnlyReason must state the concrete blocker that made running or restoring the reference unavailable.',
          );
        }
      }
    }

    if (referenceFeatureInventory.length === 0) {
      errors.push(
        "reference-runtime-clone transferMode must declare referenceFeatureInventory with every user-visible and output-affecting behavior from the inspected reference, mapped to Toolcraft implementation and acceptance coverage.",
      );
    }

    for (const [index, feature] of referenceFeatureInventory.entries()) {
      const featureLabel = feature.id.trim() || `#${index + 1}`;

      if (!feature.id.trim()) {
        errors.push(
          `referenceFeatureInventory item ${index + 1} must include a stable id.`,
        );
      } else if (referenceFeatureIds.has(feature.id)) {
        errors.push(
          `referenceFeatureInventory id "${feature.id}" is duplicated; each reference feature must be inventoried once.`,
        );
      } else {
        referenceFeatureIds.add(feature.id);
      }

      if (!feature.featureName.trim()) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" must include a short featureName.`,
        );
      }

      if (!feature.sourceEvidence.trim()) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" must include sourceEvidence from the inspected reference source, runtime, UI, or browser behavior.`,
        );
      }

      if (!feature.behaviorEvidence.trim()) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" must include behaviorEvidence from the original, restored, or source-only reference study proving this feature was observed before Toolcraft mapping.`,
        );
      }

      if (!feature.referenceBehavior.trim()) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" must describe the referenceBehavior to preserve.`,
        );
      }

      if (!feature.toolcraftMapping.trim()) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" must describe the Toolcraft mapping for the preserved behavior.`,
        );
      }

      if (!referenceFeatureStatusValues.has(feature.status)) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" status must be "ported", "toolcraft-native", or "intentionally-changed".`,
        );
      }

      if (feature.status === "intentionally-changed") {
        if (!feature.userApprovedChangeReason?.trim()) {
          errors.push(
            `referenceFeatureInventory "${featureLabel}" status "intentionally-changed" requires userApprovedChangeReason.`,
          );
        } else if (
          !explicitReferenceChangeReasonPattern.test(feature.userApprovedChangeReason)
        ) {
          errors.push(
            `referenceFeatureInventory "${featureLabel}" userApprovedChangeReason must cite explicit user approval or redesign/change-request evidence.`,
          );
        }
      }

      const acceptanceId = feature.acceptanceId.trim();

      if (!acceptanceId) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" must include acceptanceId for the test proving the mapped reference behavior.`,
        );
        continue;
      }

      referenceFeatureAcceptanceIds.add(acceptanceId);

      const entry = acceptanceById.get(acceptanceId);

      if (!entry) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" points to missing acceptanceId "${acceptanceId}".`,
        );
        continue;
      }

      if (!entry.referenceCoverage && !entry.referenceTimelineCoverage) {
        errors.push(
          `referenceFeatureInventory "${featureLabel}" acceptanceId "${acceptanceId}" must point to an acceptance entry with referenceCoverage or referenceTimelineCoverage.`,
        );
      }

      if (entry.referenceCoverage) {
        referenceCoverageFromInventory.add(entry.referenceCoverage);
      }

      if (entry.referenceTimelineCoverage) {
        referenceTimelineCoverageFromInventory.add(entry.referenceTimelineCoverage);
      }

      if (!entry.automated || !entry.automatedTestName.trim()) {
        errors.push(
          `${acceptanceId} must have automated coverage proving inventoried reference feature "${featureLabel}".`,
        );
      }

      if (!entry.browser || !entry.browserTestName.trim()) {
        errors.push(
          `${acceptanceId} must have browser coverage proving inventoried reference feature "${featureLabel}".`,
        );
      }

      if (!entry.expectedObservable.trim()) {
        errors.push(
          `${acceptanceId} must describe the observable result for inventoried reference feature "${featureLabel}".`,
        );
      }
    }

    for (const coverage of requiredReferenceCloneCoverage) {
      if (!declaredReferenceCoverage.has(coverage)) {
        errors.push(
          `reference-runtime-clone transferMode must include behaviorCoverage "${coverage}".`,
        );
      }
    }

    for (const coverage of declaredReferenceCoverage) {
      const entry = acceptance.find(
        (acceptanceEntry) => acceptanceEntry.referenceCoverage === coverage,
      );

      if (!entry) {
        errors.push(
          `reference-runtime-clone behaviorCoverage "${coverage}" is missing an acceptance entry with referenceCoverage "${coverage}".`,
        );
        continue;
      }

      if (!entry.automated || !entry.automatedTestName.trim()) {
        errors.push(
          `${entry.id} must have automated coverage proving reference behavior "${coverage}".`,
        );
      }

      if (!entry.browser || !entry.browserTestName.trim()) {
        errors.push(
          `${entry.id} must have browser coverage proving reference behavior "${coverage}".`,
        );
      }

      if (!entry.expectedObservable.trim()) {
        errors.push(
          `${entry.id} must describe the observable reference behavior for "${coverage}".`,
        );
      }
    }

    for (const coverage of declaredReferenceCoverage) {
      if (!referenceCoverageFromInventory.has(coverage)) {
        errors.push(
          `reference-runtime-clone behaviorCoverage "${coverage}" must be represented in referenceFeatureInventory by an item whose acceptanceId points to that referenceCoverage.`,
        );
      }
    }

    if (!referenceTimeline) {
      errors.push(
        'reference-runtime-clone transferMode must declare referenceTimeline with mode "none", "toolcraft-playback", "toolcraft-keyframes", or "custom-reference-timeline".',
      );
    } else {
      const declaredReferenceTimelineCoverage = new Set(referenceTimeline.behaviorCoverage);
      const declaredReferenceTransportCoverage = [...declaredReferenceCoverage].filter(
        (coverage) => referenceTransportCoverage.has(coverage),
      );
      const declaredToolcraftTimelineCoverage = [...declaredReferenceTimelineCoverage].filter(
        (coverage) => toolcraftReferenceTimelineCoverage.has(coverage),
      );

      for (const coverage of declaredReferenceTimelineCoverage) {
        if (!referenceTimelineCoverageFromInventory.has(coverage)) {
          errors.push(
            `referenceTimeline behaviorCoverage "${coverage}" must be represented in referenceFeatureInventory by an item whose acceptanceId points to that referenceTimelineCoverage.`,
          );
        }
      }

      if (referenceTimeline.mode === "none" && declaredReferenceTimelineCoverage.size > 0) {
        errors.push(
          'referenceTimeline mode "none" must not declare reference timeline behaviorCoverage.',
        );
      }

      if (
        referenceTimeline.mode === "none" &&
        declaredReferenceTransportCoverage.length > 0
      ) {
        errors.push(
          `reference-runtime-clone transport behaviorCoverage ${declaredReferenceTransportCoverage.map((coverage) => `"${coverage}"`).join(", ")} requires referenceTimeline mode "toolcraft-playback", "toolcraft-keyframes", or "custom-reference-timeline"; mode "none" is only for references with no user-facing transport behavior.`,
        );
      }

      if (
        (referenceTimeline.mode === "toolcraft-playback" ||
          referenceTimeline.mode === "toolcraft-keyframes") &&
        declaredReferenceTimelineCoverage.size === 0
      ) {
        errors.push(
          `referenceTimeline mode "${referenceTimeline.mode}" must list the concrete timeline transport behaviors in behaviorCoverage.`,
        );
      }

      if (referenceTimeline.mode === "toolcraft-playback" && timelineMode !== "playback") {
        errors.push(
          'referenceTimeline mode "toolcraft-playback" requires panels.timeline mode "playback".',
        );
      }

      if (referenceTimeline.mode === "toolcraft-keyframes" && timelineMode !== "keyframes") {
        errors.push(
          'referenceTimeline mode "toolcraft-keyframes" requires panels.timeline mode "keyframes".',
        );
      }

      if (
        referenceTimeline.mode === "toolcraft-playback" ||
        referenceTimeline.mode === "toolcraft-keyframes"
      ) {
        const timelineDefaultDurationSeconds = schema.panels.timeline?.defaultDurationSeconds;
        const loopDuration = referenceTimeline.loopDuration;

        if (!loopDuration) {
          errors.push(
            `referenceTimeline mode "${referenceTimeline.mode}" must declare loopDuration with source, seconds, and evidence. Do not let runtime/template fallback duration such as 8s stand in for reference loop intent.`,
          );
        } else {
          if (!Number.isFinite(loopDuration.seconds) || loopDuration.seconds <= 0) {
            errors.push(
              `referenceTimeline.loopDuration.seconds must be a positive finite duration; received ${String(loopDuration.seconds)}.`,
            );
          }

          if (!isValidTimelineLoopDurationSource(loopDuration.source)) {
            errors.push(
              `referenceTimeline.loopDuration.source must be "reference", "user-request", or "product-derived"; received "${String(loopDuration.source)}". Runtime/template fallback is not a valid loop-duration source.`,
            );
          }

          if (!loopDuration.evidence.trim()) {
            errors.push(
              "referenceTimeline.loopDuration.evidence must explain where the reference loop duration came from, such as measured reference timing, an explicit user request, or a product-derived timing rule.",
            );
          }

          if (runtimeDefaultLoopDurationEvidencePattern.test(loopDuration.evidence)) {
            errors.push(
              "referenceTimeline.loopDuration.evidence must not cite the runtime/template fallback 8s default as the reference loop source. Use measured reference timing, an explicit user request, or a product-derived timing rule.",
            );
          }

          if (typeof timelineDefaultDurationSeconds !== "number") {
            errors.push(
              "Toolcraft reference playback/keyframe timelines must set panels.timeline.defaultDurationSeconds to referenceTimeline.loopDuration.seconds so the initial UI duration is not the runtime fallback.",
            );
          } else if (
            Number.isFinite(loopDuration.seconds) &&
            Math.abs(timelineDefaultDurationSeconds - loopDuration.seconds) > 0.001
          ) {
            errors.push(
              `panels.timeline.defaultDurationSeconds (${timelineDefaultDurationSeconds}) must match referenceTimeline.loopDuration.seconds (${loopDuration.seconds}).`,
            );
          }
        }
      }

      if (
        referenceTimeline.mode === "toolcraft-playback" &&
        declaredReferenceTimelineCoverage.has("keyframes")
      ) {
        errors.push(
          'referenceTimeline behaviorCoverage "keyframes" requires referenceTimeline mode "toolcraft-keyframes".',
        );
      }

      if (
        referenceTimeline.mode === "toolcraft-keyframes" &&
        !declaredReferenceTimelineCoverage.has("keyframes")
      ) {
        errors.push(
          'referenceTimeline mode "toolcraft-keyframes" must include behaviorCoverage "keyframes".',
        );
      }

      if (
        (referenceTimeline.mode === "toolcraft-playback" ||
          referenceTimeline.mode === "toolcraft-keyframes") &&
        declaredToolcraftTimelineCoverage.length === 0
      ) {
        errors.push(
          `referenceTimeline mode "${referenceTimeline.mode}" must include at least one Toolcraft timeline behavior such as "playback", "restart", "scrub", "duration", "loop", "time-progress", "export-at-time", or "keyframes".`,
        );
      }

      if (
        referenceTimeline.mode === "custom-reference-timeline" &&
        declaredReferenceTimelineCoverage.size === 0
      ) {
        errors.push(
          'referenceTimeline mode "custom-reference-timeline" must list every reference timeline behavior in behaviorCoverage.',
        );
      }

      for (const coverage of declaredReferenceTimelineCoverage) {
        if (
          customReferenceTimelineCoverage.has(coverage) &&
          referenceTimeline.mode !== "custom-reference-timeline"
        ) {
          errors.push(
            `referenceTimeline mode "${referenceTimeline.mode}" cannot preserve custom reference timeline behavior "${coverage}". Use mode "custom-reference-timeline" and browser-backed referenceTimelineCoverage instead.`,
          );
        }

        const entry = acceptance.find(
          (acceptanceEntry) => acceptanceEntry.referenceTimelineCoverage === coverage,
        );

        if (!entry) {
          errors.push(
            `referenceTimeline behaviorCoverage "${coverage}" is missing an acceptance entry with referenceTimelineCoverage "${coverage}".`,
          );
          continue;
        }

        if (entry.kind !== "runtime") {
          errors.push(
            `${entry.id} must be a runtime acceptance entry proving reference timeline behavior "${coverage}".`,
          );
        }

        if (!entry.automated || !entry.automatedTestName.trim()) {
          errors.push(
            `${entry.id} must have automated coverage proving reference timeline behavior "${coverage}".`,
          );
        }

        if (!entry.browser || !entry.browserTestName.trim()) {
          errors.push(
            `${entry.id} must have browser coverage proving reference timeline behavior "${coverage}".`,
          );
        }

        if (!entry.expectedObservable.trim()) {
          errors.push(
            `${entry.id} must describe the observable reference timeline behavior for "${coverage}".`,
          );
        }
      }
    }

    for (const entry of acceptance) {
      if (
        (entry.referenceCoverage || entry.referenceTimelineCoverage) &&
        !referenceFeatureAcceptanceIds.has(entry.id)
      ) {
        errors.push(
          `${entry.id} declares reference coverage but is not mapped from referenceFeatureInventory. Every reference acceptance row must correspond to an inventoried reference feature.`,
        );
      }
    }
  } else {
    for (const entry of acceptance) {
      if (entry.referenceCoverage) {
        errors.push(
          `${entry.id} declares referenceCoverage "${entry.referenceCoverage}" but transferMode is not "reference-runtime-clone".`,
        );
      }

      if (entry.referenceTimelineCoverage) {
        errors.push(
          `${entry.id} declares referenceTimelineCoverage "${entry.referenceTimelineCoverage}" but transferMode is not "reference-runtime-clone".`,
        );
      }
    }
  }

  if (layersEnabled) {
    for (const coverage of requiredLayerCoverage) {
      const entry = acceptance.find(
        (acceptanceEntry) =>
          acceptanceEntry.kind === "runtime" && acceptanceEntry.layerCoverage === coverage,
      );

      if (!entry) {
        errors.push(
          `panels.layers requires a runtime acceptance entry with layerCoverage "${coverage}" proving layer ${coverage} behavior.`,
        );
        continue;
      }

      if (!entry.automated || !entry.automatedTestName.trim()) {
        errors.push(`${entry.id} must have automated coverage proving layer ${coverage}.`);
      }

      if (!entry.browser || !entry.browserTestName.trim()) {
        errors.push(`${entry.id} must have browser coverage proving layer ${coverage}.`);
      }

      if (!entry.expectedObservable.trim()) {
        errors.push(
          `${entry.id} must describe the observable layer behavior for "${coverage}".`,
        );
      }
    }
  } else {
    for (const entry of acceptance) {
      if (entry.layerCoverage) {
        errors.push(
          `${entry.id} declares layerCoverage "${entry.layerCoverage}" but panels.layers is not enabled.`,
        );
      }
    }
  }

  if (timelineMode) {
    const playbackEntry = acceptance.find(
      (entry) => entry.kind === "runtime" && entry.timelineCoverage === "playback",
    );

    if (!playbackEntry) {
      errors.push(
        `panels.timeline mode "${timelineMode}" requires a runtime acceptance entry with timelineCoverage "playback" proving pause, scrub, duration/loop, and rendered-frame behavior.`,
      );
    } else if (
      !hasTimelinePlaybackCoverage(
        playbackEntry.timelinePlaybackCoverage,
        requiredTimelinePlaybackCoverage,
      )
    ) {
      errors.push(
        `${playbackEntry.id} timelineCoverage "playback" must declare timelinePlaybackCoverage for pause-resume, scrub, duration, loop, and rendered-frame. Duration coverage must prove renderer progress maps 0..state.timeline.durationSeconds, not a local fixed animation duration.`,
      );
    } else {
      const playbackEvidenceText = [
        playbackEntry.automatedTestName,
        playbackEntry.browserTestName,
        playbackEntry.expectedObservable,
        playbackEntry.userAction,
      ].join(" ");

      if (
        hasTimelinePlaybackCoveragePart(playbackEntry.timelinePlaybackCoverage, "duration") &&
        (!/\bduration\b/i.test(playbackEvidenceText) ||
          !/\b(edit|change|commit|enter|set)\w*\b/i.test(playbackEvidenceText))
      ) {
        errors.push(
          `${playbackEntry.id} timelinePlaybackCoverage "duration" must describe editing/changing the timeline duration through the UI and proving the renderer follows state.timeline.durationSeconds.`,
        );
      }

      if (
        hasTimelinePlaybackCoveragePart(playbackEntry.timelinePlaybackCoverage, "loop") &&
        !hasSeamlessForwardLoopEvidence(playbackEvidenceText)
      ) {
        errors.push(
          `${playbackEntry.id} timelinePlaybackCoverage "loop" must prove a seamless forward-only product loop: motion advances in one direction, avoids mirror/yoyo/ping-pong/reverse fallbacks, first and last frames stitch without a visible jump, and the same seam holds after changing timeline duration.`,
        );
      }
    }
  }

  if (schema.canvas.sizing.mode === "fixed-output") {
    if (schemaHasPngExportPanelAction(schema) || schemaHasVideoExportPanelAction(schema)) {
      errors.push(
        'Product/output apps with export actions must use canvas.sizing mode "editable-output" so Aspect ratio, Canvas width, and Canvas height are always available. Put reference, fixed-format, or user-requested dimensions in canvas.size as the initial value instead of hiding size controls with "fixed-output".',
      );
    }

    const fixedCanvasSizingEntry = acceptance.find(
      (entry) =>
        entry.kind === "runtime" &&
        entry.canvasSizingCoverage === "fixed-output-size",
    );

    if (!fixedCanvasSizingEntry) {
      errors.push(
        'canvas.sizing mode "fixed-output" requires a runtime acceptance entry with canvasSizingCoverage "fixed-output-size" explaining why width and height are intentionally non-editable. Product/output apps must use "editable-output"; user-provided, reference, fixed-format, or base/default sizes belong in canvas.size as editable initial values.',
      );
    } else {
      const evidenceText = getAcceptanceEvidenceText(fixedCanvasSizingEntry);

      if (!/(fixed|locked|non-editable|not user-editable|must not edit|reference-defined|product-defined)/i.test(evidenceText)) {
        errors.push(
          `${fixedCanvasSizingEntry.id} canvasSizingCoverage "fixed-output-size" must explain why the output dimensions are intentionally fixed for a non-product/internal fixture, not merely initialized from a default size.`,
        );
      }

      if (insufficientFixedCanvasSizingReasonPattern.test(evidenceText)) {
        errors.push(
          `${fixedCanvasSizingEntry.id} canvasSizingCoverage "fixed-output-size" cannot be justified by the reference or previous app lacking a size editor. Exportable product apps must use editable-output; put reference, product-defined, or fixed-format dimensions in canvas.size as initial values instead of hiding size controls.`,
        );
      }

      if (!fixedCanvasSizingEntry.automated || !fixedCanvasSizingEntry.automatedTestName.trim()) {
        errors.push(
          `${fixedCanvasSizingEntry.id} must have automated coverage proving fixed output dimensions.`,
        );
      }

      if (!fixedCanvasSizingEntry.browser || !fixedCanvasSizingEntry.browserTestName.trim()) {
        errors.push(
          `${fixedCanvasSizingEntry.id} must have browser coverage proving fixed output dimensions.`,
        );
      }
    }
  }

  if (
    schema.canvas.enabled &&
    schema.canvas.upload &&
    schema.canvas.sizing.mode === "intrinsic-media"
  ) {
    const intrinsicCanvasSizingEntry = acceptance.find(
      (entry) =>
        entry.kind === "runtime" &&
        entry.canvasSizingCoverage === "intrinsic-media-size",
    );

    if (!intrinsicCanvasSizingEntry) {
      errors.push(
        'canvas.sizing mode "intrinsic-media" with upload requires a runtime acceptance entry with canvasSizingCoverage "intrinsic-media-size" proving the app is a true media-viewer/source-native product where imported media natural dimensions intentionally own canvas.size. Uploaded background/source images inside product canvases must use "editable-output" and keep the current canvas size.',
      );
    } else {
      const evidenceText = getAcceptanceEvidenceText(intrinsicCanvasSizingEntry);

      if (
        !/(media[- ]viewer|source[- ]native|natural dimension|natural size|intrinsic media|intrinsic size|media owns canvas|canvas\.size)/i.test(
          evidenceText,
        )
      ) {
        errors.push(
          `${intrinsicCanvasSizingEntry.id} canvasSizingCoverage "intrinsic-media-size" must explain why uploaded media natural dimensions intentionally own canvas.size instead of behaving as background/source material inside the current editable output canvas.`,
        );
      }

      if (!intrinsicCanvasSizingEntry.automated || !intrinsicCanvasSizingEntry.automatedTestName.trim()) {
        errors.push(
          `${intrinsicCanvasSizingEntry.id} must have automated coverage proving intrinsic media sizing.`,
        );
      }

      if (!intrinsicCanvasSizingEntry.browser || !intrinsicCanvasSizingEntry.browserTestName.trim()) {
        errors.push(
          `${intrinsicCanvasSizingEntry.id} must have browser coverage proving intrinsic media sizing.`,
        );
      }
    }
  }

  if (schema.persistence.storage === "localStorage") {
    const persistenceEntry = acceptance.find(
      (entry) =>
        entry.kind === "runtime" &&
        entry.persistenceCoverage === "reload",
    );

    if (!persistenceEntry) {
      errors.push(
        'persistence.storage "localStorage" requires a runtime acceptance entry with persistenceCoverage "reload" proving user-edited persisted state restores after a real browser reload. Settings import/export is not a substitute for persistence.',
      );
    } else {
      const evidenceText = getAcceptanceEvidenceText(persistenceEntry);

      if (!persistenceEntry.automated || !persistenceEntry.automatedTestName.trim()) {
        errors.push(
          `${persistenceEntry.id} must have automated coverage proving persistence reload behavior.`,
        );
      }

      if (!persistenceEntry.browser || !persistenceEntry.browserTestName.trim()) {
        errors.push(
          `${persistenceEntry.id} must have browser coverage proving persistence reload behavior.`,
        );
      }

      if (!persistenceEntry.expectedObservable.trim()) {
        errors.push(
          `${persistenceEntry.id} must describe the persisted state observable after reload.`,
        );
      }

      if (!/\b(reload|refresh|reopen|page\.reload)\b/i.test(evidenceText)) {
        errors.push(
          `${persistenceEntry.id} persistenceCoverage "reload" must describe changing a user-facing setting, reloading the browser page, and observing the restored value/output.`,
        );
      }
    }
  }

  if (timelineMode === "keyframes") {
    const hasKeyframesCoverage = acceptance.some(
      (entry) => entry.kind === "runtime" && entry.timelineCoverage === "keyframes",
    );

    if (!hasKeyframesCoverage) {
      errors.push(
        'panels.timeline mode "keyframes" requires a runtime acceptance entry with timelineCoverage "keyframes" proving expanded rows, diamonds, keyframe mutation, and renderer evaluation.',
      );
    }
  }

  for (const { control, controlId, sectionTitle } of controls) {
    const label = `${sectionTitle ? `${sectionTitle} / ` : ""}${controlId} (${control.target})`;
    const entry = controlAcceptance.get(control.target);
    const keyframeCapability = getToolcraftControlKeyframeCapability(control);
    const isCustomControl = isCustomToolcraftControl(control);
    const isSelectedLayerTarget = control.target.startsWith("selectedLayer.");
    const toggleLabelError = getToggleControlLabelError(control, sectionTitle);
    const singleActionsLabelError = getSingleActionsControlLabelError(control);
    const codeTextareaError = getCodeTextareaControlError({
      control,
      controlId,
      label,
    });

    if (toggleLabelError) {
      errors.push(`${label} ${toggleLabelError}`);
    }

    if (singleActionsLabelError) {
      errors.push(`${label} ${singleActionsLabelError}`);
    }

    if (codeTextareaError) {
      errors.push(codeTextareaError);
    }

    if (
      control.type === "rangeSlider" &&
      Array.isArray(control.defaultValue) &&
      typeof control.defaultValue[0] === "number" &&
      typeof control.defaultValue[1] === "number" &&
      control.defaultValue[0] === control.defaultValue[1]
    ) {
      errors.push(
        `${label} rangeSlider defaultValue must start with different lower and upper values so the two-thumb control does not collapse into a single-value slider.`,
      );
    }

    if (
      control.type !== "panelActions" &&
      timelineTransportControlPattern.test(getTimelineTransportControlText(controlId, control))
    ) {
      errors.push(
        `${label} looks like an app-wide timeline transport control. Play, Pause, Animate, Resume, and Restart animation belong to the top timeline; keep right-panel controls for renderer parameters, generation/apply actions, and output delivery.`,
      );
    }

    if (shouldUseSingleCurveVariant(controlId, control)) {
      errors.push(
        `${label} is a semantic single curve and must set variant: "single"; RGB/R/G/B curve tabs are reserved for color-correction or channel-specific curves.`,
      );
    }

    if (control.keyframeable === true && !keyframeCapability.capable) {
      errors.push(
        `${label} sets keyframeable true, but this control type or runtime-owned target cannot create timeline keyframes.`,
      );
    }

    if (
      timelineMode === "keyframes" &&
      keyframeCapability.capable &&
      control.keyframeable === false
    ) {
      errors.push(
        `${label} is keyframe-capable by Toolcraft control type; remove keyframeable: false and provide keyframe evaluator coverage instead of hiding the diamond.`,
      );
    }

    if (isSelectedLayerTarget && !layersEnabled) {
      errors.push(
        `${label} uses reserved selectedLayer.* target without panels.layers enabled. Use an app-specific target for single-layer apps or enable layers with layerCoverage.`,
      );
    }

    if (control.visibleWhen) {
      errors.push(
        ...getConditionValidationErrors({
          condition: control.visibleWhen,
          conditionName: "visibleWhen",
          controlTargets,
          label,
        }),
      );
    }

    if (control.disabledWhen) {
      errors.push(
        ...getConditionValidationErrors({
          condition: control.disabledWhen,
          conditionName: "disabledWhen",
          controlTargets,
          label,
        }),
      );
    }

    if (control.disabled === true) {
      errors.push(
        `${label} sets disabled: true. Generated product panels should show only controls usable in the current state; hide unavailable product controls with visibleWhen instead of rendering disabled controls.`,
      );
    }

    if (control.disabledWhen) {
      errors.push(
        `${label} uses disabledWhen. Generated product panels should show only controls usable in the current state; hide unavailable product controls with visibleWhen instead of rendering disabled controls.`,
      );
    }

    if (!entry) {
      errors.push(`${label} is missing an acceptance entry.`);
      continue;
    }

    if (!entry.automated) {
      errors.push(`${label} must have automated acceptance coverage.`);
    }

    if (!entry.browser) {
      errors.push(`${label} must have browser acceptance coverage.`);
    }

    if (entry.browser && !entry.browserTestName.trim()) {
      errors.push(`${label} must point to a browser test name.`);
    }

    if (!entry.expectedObservable.trim()) {
      errors.push(`${label} must describe a product-level observable.`);
    }

    if (!entry.automatedTestName.trim()) {
      errors.push(`${label} must point to an automated test name.`);
    }

    if (entry.componentType !== control.type) {
      errors.push(
        `${label} acceptance componentType must be "${control.type}", received "${entry.componentType}".`,
      );
    }

    if (control.type === "fileDrop") {
      const hasDefaultMediaAssets = schema.media.defaultAssets.some(
        (asset) => asset.sourceTarget === control.target,
      );

      errors.push(
        ...getFileDropLifecycleCoverageErrors(
          label,
          control,
          entry,
          hasDefaultMediaAssets,
        ),
      );
    }

    if (
      isCustomControl &&
      !hasCustomControlCoverage(
        entry.customControlCoverage,
        requiredCustomControlCoverage,
      )
    ) {
      errors.push(
        `${label} is a custom control and must declare customControlCoverage for: ${requiredCustomControlCoverage.join(", ")}.`,
      );
    }

    if (isCustomControl) {
      errors.push(...getBuiltInFitCheckErrors(label, entry, control));
    }

    if (
      control.visibleWhen &&
      !/\b(visible|shown|show|appears|hidden|hide|hides|not visible|disappear|unavailable)\b/i.test(
        getAcceptanceEvidenceText(entry),
      )
    ) {
      errors.push(
        `${label} uses visibleWhen and acceptance must prove the control becomes visible and hidden/unavailable when ${control.visibleWhen.target} reaches the gating values.`,
      );
    }

    if (
      schemaHasPngExportPanelAction(schema) &&
      isOutputBackgroundToggleControl({ control, controlId, sectionTitle })
    ) {
      const evidenceText = getAcceptanceEvidenceText(entry);
      const provesPngTransparency =
        /\b(png|image)\b/i.test(evidenceText) &&
        /\b(transparent|transparency|alpha)\b/i.test(evidenceText);
      const provesPreviewTransparency =
        /\b(preview|canvas)\b/i.test(evidenceText) &&
        /\b(transparent|transparency|alpha|hide|hides|hidden|without background|no background|background off)\b/i.test(
          evidenceText,
        );
      const provesVideoBackground =
        /\bvideo\b/i.test(evidenceText) &&
        /\b(keep|keeps|preserve|preserves|stay|stays|remain|remains|still|background)\b/i.test(
          evidenceText,
        );

      if (!provesPngTransparency || !provesPreviewTransparency || !provesVideoBackground) {
        errors.push(
          `${label} controls background inclusion and acceptance must prove disabling it makes PNG output transparent, hides the live preview product background, and keeps video output with the product background.`,
        );
      }
    }

    const requiredControlParts =
      getRequiredToolcraftControlPartCoverage(control);

    if (!hasControlPartCoverage(entry.controlPartCoverage, requiredControlParts)) {
      errors.push(
        `${label} must declare controlPartCoverage for every semantic value part: ${requiredControlParts.join(", ")}.`,
      );
    }

    if (timelineMode === "keyframes" && keyframeCapability.capable) {
      if (entry.timelineCoverage !== "keyframes") {
        errors.push(
          `${label} is keyframe-capable by Toolcraft control type and must have acceptance timelineCoverage "keyframes" proving its diamond creates/updates a keyframe row and changes evaluated output.`,
        );
      }
    }

    if (
      isSelectedLayerTarget &&
      layersEnabled &&
      entry.layerCoverage !== "selected-layer-controls"
    ) {
      errors.push(
        `${label} targets selectedLayer.* and must have acceptance layerCoverage "selected-layer-controls" proving the control edits the currently selected layer output.`,
      );
    }

    if (isSliderLikeControl(control)) {
      const expectedMarkerCount = getStepMarkerCount(control);

      if (control.unit === "x") {
        errors.push(
          `${label} uses unit "x", but Toolcraft slider values do not use x suffixes. Omit unit for scale, multiplier, intensity, opacity, strength, depth, and shader amount values unless a real measurement unit applies.`,
        );
      }

      if (
        control.variant === "discrete" &&
        expectedMarkerCount &&
        control.markerCount !== expectedMarkerCount
      ) {
        errors.push(
          `${label} discrete slider must render one marker per step; expected markerCount ${expectedMarkerCount}, received ${String(control.markerCount)}.`,
        );
      }

      errors.push(
        ...getSliderVariantClassificationErrors({
          control,
          controlId,
          label,
        }),
      );
    }

    if (control.type === "imagePicker") {
      const itemValues = getControlOptionValues(control);

      if (!hasCoverageForValues(entry.optionCoverage, itemValues)) {
        errors.push(
          `${label} must cover every visible ImagePicker item: ${itemValues.join(", ")}.`,
        );
      }
    }

    if (control.type === "select" || control.type === "segmented") {
      const optionValues = getControlOptionValues(control);

      if (optionValues.length > 1 && !hasCoverageForValues(entry.optionCoverage, optionValues)) {
        errors.push(`${label} must cover every visible option: ${optionValues.join(", ")}.`);
      }

      const segmentedLayoutError = getSegmentedControlLayoutError(control);

      if (segmentedLayoutError) {
        errors.push(`${label} ${segmentedLayoutError}`);
      }
    }

    if (control.type === "panelActions") {
      const actionValues = control.actions?.map(getActionValue) ?? [];
      const resetActionValues =
        control.actions?.filter(isResetPanelAction).map(getActionValue) ?? [];

      if (resetActionValues.length > 0) {
        errors.push(
          `${label} must not include Reset footer actions (${resetActionValues.join(", ")}). The controls panel header owns Reset controls; sticky panelActions are only for product delivery actions such as Export, Copy, Generate, Apply, or Download.`,
        );
      }

      if (!hasCoverageForValues(entry.actionCoverage, actionValues)) {
        errors.push(`${label} must cover every footer action: ${actionValues.join(", ")}.`);
      }
    }
  }

  for (const entry of acceptance) {
    if (
      entry.kind === "control" &&
      entry.target &&
      !controlTargets.has(entry.target) &&
      !isRuntimeSetupControlTarget(entry.target)
    ) {
      errors.push(`${entry.id} points to missing control target ${entry.target}.`);
    }

    if (entry.kind !== "canvas-handle") {
      continue;
    }

    if (!entry.canvasHandle) {
      errors.push(`${entry.id} canvas handle is missing canvasHandle metadata.`);
      continue;
    }

    if (!entry.canvasHandle.testId.trim()) {
      errors.push(`${entry.id} canvas handle must provide a stable testId.`);
    }

    if (!entry.canvasHandle.writesTarget.trim()) {
      errors.push(`${entry.id} canvas handle must name the runtime target it writes.`);
    }

    if (
      entry.canvasHandle.writesTarget &&
      !controlTargets.has(entry.canvasHandle.writesTarget) &&
      !commandTargets.has(entry.canvasHandle.writesTarget)
    ) {
      errors.push(
        `${entry.id} canvas handle writesTarget ${entry.canvasHandle.writesTarget} does not match a schema target or supported editor command.`,
      );
    }

    if (!entry.canvasHandle.outputObservable.trim()) {
      errors.push(`${entry.id} canvas handle must describe the product output change.`);
    }

    if (!entry.canvasHandle.exportCleanTestName.trim()) {
      errors.push(`${entry.id} canvas handle must point to an export-clean test.`);
    }

    if (!entry.browser || !entry.browserTestName.trim()) {
      errors.push(`${entry.id} canvas handle must have browser drag coverage.`);
    }

    if (!entry.automated || !entry.automatedTestName.trim()) {
      errors.push(`${entry.id} canvas handle must have automated output coverage.`);
    }
  }

  return errors;
}
