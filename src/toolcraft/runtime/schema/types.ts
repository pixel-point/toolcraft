import type {
  ToolcraftControlLayoutGroupColumns,
  ToolcraftControlLayoutGroupLayout,
  ToolcraftSectionLayout,
} from "../contracts/types";

export type ToolcraftCanvasSize = {
  height: number;
  unit: "px";
  width: number;
};

export type ToolcraftCanvasSizeSource = "app" | "runtime-default";

export type ToolcraftCanvasSizingMode =
  | "editable-output"
  | "fixed-output"
  | "intrinsic-media";

export type ToolcraftCanvasSizingSchema = {
  mode: ToolcraftCanvasSizingMode;
};

export type ToolcraftCanvasRenderScaleSchema =
  | boolean
  | {
      defaultValue?: number;
      enabled?: boolean;
      max?: number;
      min?: number;
      step?: number;
    };

export type ResolvedToolcraftCanvasRenderScaleSchema = {
  defaultValue: number;
  enabled: boolean;
  max: number;
  min: number;
  step: number;
};

export type ToolcraftPngExportBackground = "include" | "transparent";

export type ToolcraftPngExportSchema = {
  background?: ToolcraftPngExportBackground;
};

export type ToolcraftExportSchema = {
  png?: ToolcraftPngExportSchema;
};

export type ResolvedToolcraftExportSchema = {
  png: Required<ToolcraftPngExportSchema>;
};

export type ToolcraftAssemblyComponentId =
  | "canvas"
  | "controlsPanel"
  | "layersPanel"
  | "timelinePanel"
  | "toolbar";

export type ToolcraftAssemblyCapability =
  | "canvas.draggable"
  | "canvas.editableSize"
  | "canvas.renderScale"
  | "canvas.upload"
  | "controls.defaults"
  | "controls.panel"
  | "history.undoRedo"
  | "layers.groups"
  | "layers.panel"
  | "layers.selection"
  | "layers.visibility"
  | "panels.doubleClickReset"
  | "panels.draggable"
  | "panels.snap"
  | "timeline.duration"
  | "timeline.keyframes"
  | "timeline.panel"
  | "timeline.playback"
  | "toolbar.history"
  | "toolbar.radar"
  | "toolbar.theme"
  | "toolbar.zoom";

export type ToolcraftAssemblyCommand =
  | "canvas.center"
  | "canvas.panBy"
  | "canvas.setOffset"
  | "canvas.setSize"
  | "canvas.setViewport"
  | "canvas.zoomIn"
  | "canvas.zoomOut"
  | "canvas.zoomReset"
  | "controls.apply"
  | "controls.reset"
  | "controls.resetTargets"
  | "controls.setValue"
  | "history.redo"
  | "history.undo"
  | "layers.add"
  | "layers.delete"
  | "layers.moveToGroup"
  | "layers.rename"
  | "layers.reorder"
  | "layers.select"
  | "layers.toggleCollapsed"
  | "layers.toggleVisibility"
  | "media.delete"
  | "media.import"
  | "media.reorder"
  | "media.transform"
  | "panels.resetOffset"
  | "panels.setHidden"
  | "panels.setOffset"
  | "timeline.changeKeyframeEasing"
  | "timeline.deleteControlKeyframes"
  | "timeline.deleteKeyframe"
  | "timeline.moveKeyframe"
  | "timeline.selectKeyframe"
  | "timeline.setCurrentTime"
  | "timeline.setDuration"
  | "timeline.setExpanded"
  | "timeline.setPlaying"
  | "timeline.toggleControlKeyframes"
  | "timeline.toggleExpanded"
  | "timeline.toggleLoop"
  | "timeline.togglePlayback";

export type ToolcraftAssemblyPanelContract = {
  capabilities: readonly ToolcraftAssemblyCapability[];
  commands: readonly ToolcraftAssemblyCommand[];
  defaultPlacement: "bottom" | "left" | "right" | "top";
  dragMode: "handle" | "panel";
  enabled: boolean;
  requiredWrapper: "PanelHost";
  snapEdges: readonly ("bottom" | "left" | "right" | "top")[];
  visualComponent: string;
};

export type ToolcraftAssemblyCanvasContract = {
  capabilities: readonly ToolcraftAssemblyCapability[];
  commands: readonly ToolcraftAssemblyCommand[];
  enabled: boolean;
  visualComponent: "CanvasShell";
};

export type ToolcraftAssemblyContract = {
  capabilities: readonly ToolcraftAssemblyCapability[];
  commands: readonly ToolcraftAssemblyCommand[];
  components: readonly ToolcraftAssemblyComponentId[];
  surfaces: {
    canvas: ToolcraftAssemblyCanvasContract;
    panels: {
      controls?: ToolcraftAssemblyPanelContract;
      layers?: ToolcraftAssemblyPanelContract;
      timeline?: ToolcraftAssemblyPanelContract;
      toolbar: ToolcraftAssemblyPanelContract;
    };
  };
};

export type ToolcraftCanvasSchema = {
  draggable?: boolean;
  enabled: boolean;
  renderScale?: ToolcraftCanvasRenderScaleSchema;
  size?: ToolcraftCanvasSize;
  sizing?: ToolcraftCanvasSizingSchema;
  upload?: boolean;
};

export type ToolcraftToolbarSchema = {
  history?: boolean;
  radar?: boolean;
  theme?: boolean;
  zoom?: boolean;
};

export type ToolcraftTimelineMode = "keyframes" | "playback";

export type ToolcraftTimelinePanelSchema =
  | boolean
  | {
      defaultDurationSeconds?: number;
      enabled?: boolean;
      mode?: ToolcraftTimelineMode;
    };

export type ResolvedToolcraftTimelinePanelSchema = {
  defaultDurationSeconds: number;
  enabled: boolean;
  mode: ToolcraftTimelineMode;
};

export type ToolcraftPersistableStateSlice =
  | "canvas"
  | "layers"
  | "media"
  | "panels"
  | "timeline"
  | "values";

export type ToolcraftNoPersistenceSchema = {
  storage?: "none";
};

export type ToolcraftLocalStoragePersistenceSchema = {
  include: readonly ToolcraftPersistableStateSlice[];
  key: `toolcraft:${string}:state:v${number}`;
  storage: "localStorage";
  version: number;
};

export type ToolcraftPersistenceSchema =
  | ToolcraftNoPersistenceSchema
  | ToolcraftLocalStoragePersistenceSchema;

export type ResolvedToolcraftPersistenceSchema =
  | { storage: "none" }
  | ToolcraftLocalStoragePersistenceSchema;

export type ToolcraftSettingsTransferMode = boolean | "auto";

export type ToolcraftSettingsTransferObjectSchema = {
  appId?: string;
  enabled?: ToolcraftSettingsTransferMode;
  fileName?: string;
};

export type ToolcraftSettingsTransferSchema =
  | ToolcraftSettingsTransferMode
  | ToolcraftSettingsTransferObjectSchema;

export type ResolvedToolcraftSettingsTransferSchema = {
  appId: string;
  enabled: boolean;
  fileName: string;
  mode: ToolcraftSettingsTransferMode;
};

export type ToolcraftActionCommand = "controls.apply" | "controls.reset";

export type ToolcraftActionSchema = {
  command?: ToolcraftActionCommand;
  icon?:
    | "check"
    | "copy"
    | "download"
    | "download-simple"
    | "eraser"
    | "export"
    | "rotate-ccw"
    | "shuffle"
    | "upload-simple"
    | "wand-sparkles";
  label?: string;
  value: string;
  variant?: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary";
};

export type ToolcraftImagePickerItemSchema = {
  alt?: string;
  src: string;
  value: string;
};

export type ToolcraftControlOrderRole =
  | "action"
  | "advanced"
  | "color"
  | "detail"
  | "input"
  | "mode"
  | "primary"
  | "spatial"
  | "strength";

export type ToolcraftControlPerformanceRole =
  | "responsiveness"
  | "workload";

export type ToolcraftFileDropAssetKind = "file" | "image";

export type ToolcraftMediaPositionSchema = {
  x: number;
  y: number;
};

export type ToolcraftMediaTransformSchema = {
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  rotationDeg?: 0 | 90 | 180 | 270;
};

export type ToolcraftDefaultMediaAssetSchema = {
  assetKind?: ToolcraftFileDropAssetKind;
  dataUrl: string;
  fileName: string;
  id?: string;
  layerId?: string;
  layerName?: string;
  mimeType?: string;
  position?: ToolcraftMediaPositionSchema;
  size?: ToolcraftCanvasSize;
  sourceTarget?: string;
  transform?: ToolcraftMediaTransformSchema;
};

export type ToolcraftMediaSchema = {
  defaultAssets?: readonly ToolcraftDefaultMediaAssetSchema[];
};

export type ResolvedToolcraftMediaSchema = {
  defaultAssets: readonly ToolcraftDefaultMediaAssetSchema[];
};

export type ToolcraftControlConditionSchema = {
  equals?: unknown;
  greaterThan?: number;
  greaterThanOrEqual?: number;
  lessThan?: number;
  lessThanOrEqual?: number;
  notOneOf?: readonly unknown[];
  notEquals?: unknown;
  oneOf?: readonly unknown[];
  target: string;
};

export type ToolcraftControlDisabledConditionSchema =
  ToolcraftControlConditionSchema;

export type ToolcraftColorOpacityValueSchema = {
  hex: string;
  opacity?: number;
};

export type ToolcraftCollectionItemControlSchema = {
  commitMode?: "content" | "setting";
  defaultValue?: unknown;
  label?: boolean | string;
  markerCount?: number;
  max?: number;
  min?: number;
  options?: readonly { label: string; value: string }[];
  step?: number;
  type: string;
  unit?: string;
  variant?: string;
};

export type ToolcraftFontPickerValueSchema = {
  color?: string;
  fontId: string;
  fontSize?: number;
  fontWeight?: string;
  letterSpacing?: "tight" | "tighter" | "normal" | "wide" | "wider" | "widest";
  lineHeight?: "loose" | "none" | "normal" | "relaxed" | "snug" | "tight";
  opacity?: number;
  textCase?: "capitalize" | "lowercase" | "original" | "titleCase" | "uppercase";
};

export type ToolcraftCurveInterpolation = "monotone" | "smooth";

export type ToolcraftVectorCoordinateMode = "cartesian" | "screen";

export type ToolcraftControlSchema = {
  accept?: string;
  actions?: readonly (ToolcraftActionSchema | string)[];
  assetKind?: ToolcraftFileDropAssetKind;
  addLabel?: string;
  commitMode?: "content" | "setting";
  coordinateMode?: ToolcraftVectorCoordinateMode;
  defaultValue?: unknown;
  description?: string;
  disabled?: boolean;
  disabledWhen?: ToolcraftControlDisabledConditionSchema;
  hardMaxItems?: number;
  interpolation?: ToolcraftCurveInterpolation;
  items?: readonly ToolcraftImagePickerItemSchema[];
  itemControl?: ToolcraftCollectionItemControlSchema;
  itemDefaultValue?: unknown;
  itemLabel?: string;
  keyframeable?: boolean;
  label?: boolean | string;
  markerCount?: number;
  max?: number;
  min?: number;
  minItems?: number;
  multiple?: boolean;
  orderRole?: ToolcraftControlOrderRole;
  performanceReason?: string;
  performanceRole?: ToolcraftControlPerformanceRole;
  options?: readonly { label: string; value: string }[];
  recommendedMaxItems?: number;
  removeLabel?: string;
  step?: number;
  target: string;
  type: string;
  unit?: string;
  valueLabel?: string;
  variant?: string;
  visibleWhen?: ToolcraftControlConditionSchema;
  xLabel?: string;
  yLabel?: string;
};

export type ToolcraftControlLayoutGroupSchema = {
  columns?: ToolcraftControlLayoutGroupColumns;
  controls: readonly string[];
  layout: ToolcraftControlLayoutGroupLayout;
};

export type ToolcraftControlSectionSchema = {
  actionGroup?: "primary" | "secondary";
  controls: Record<string, ToolcraftControlSchema>;
  layout?: ToolcraftSectionLayout;
  layoutGroups?: readonly ToolcraftControlLayoutGroupSchema[];
  title?: string;
  visibleWhen?: ToolcraftControlConditionSchema;
};

export type ToolcraftControlsPanelSchema = {
  sections: readonly ToolcraftControlSectionSchema[];
  title: string;
};

export type ToolcraftPanelsSchema = {
  controls?: ToolcraftControlsPanelSchema;
  layers?: boolean;
  timeline?: ToolcraftTimelinePanelSchema;
};

export type ResolvedToolcraftPanelsSchema = {
  controls?: ToolcraftControlsPanelSchema;
  layers?: boolean;
  timeline?: ResolvedToolcraftTimelinePanelSchema;
};

export type ToolcraftAppSchema = {
  canvas: ToolcraftCanvasSchema;
  export?: ToolcraftExportSchema;
  media?: ToolcraftMediaSchema;
  panels: ToolcraftPanelsSchema;
  persistence?: ToolcraftPersistenceSchema;
  settingsTransfer?: ToolcraftSettingsTransferSchema;
  toolbar?: ToolcraftToolbarSchema;
};

export type ResolvedToolcraftAppSchema = {
  assembly: ToolcraftAssemblyContract;
  canvas: Omit<Required<ToolcraftCanvasSchema>, "renderScale"> & {
    renderScale: ResolvedToolcraftCanvasRenderScaleSchema;
    size: ToolcraftCanvasSize;
    sizeSource: ToolcraftCanvasSizeSource;
  };
  export: ResolvedToolcraftExportSchema;
  media: ResolvedToolcraftMediaSchema;
  panels: ResolvedToolcraftPanelsSchema;
  persistence: ResolvedToolcraftPersistenceSchema;
  settingsTransfer: ResolvedToolcraftSettingsTransferSchema;
  toolbar: Required<ToolcraftToolbarSchema>;
};
