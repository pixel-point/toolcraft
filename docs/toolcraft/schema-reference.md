# Schema Reference

> Reading route: start with `workflow.md`. Core generated-app rules live in `core/*`; this file is a field reference for `src/app/app-schema.ts`.

Edit `src/app/app-schema.ts` as the public product surface. Use `defineToolcraft` to configure runtime surfaces, product controls, defaults, persistence, and product actions.

## Runtime Shape

Top-level schema fields:

| Field | Purpose | Detailed rules |
| --- | --- | --- |
| `canvas` | Product workspace, output size, upload/drop support, render scale. | `core/runtime-boundary.md`, `core/setup-export.md`, `core/media-upload.md` |
| `media` | Predefined attached files/images that appear in `fileDrop`. | `core/media-upload.md` |
| `panels` | Controls, layers, timeline. | `core/runtime-boundary.md`, `core/timeline-animation.md` |
| `toolbar` | History, radar, theme, zoom. | `assembly-workflow.md` |
| `persistence` | Intentional reload persistence for runtime slices. | `performance.md`, `acceptance-testing.md` |
| `settingsTransfer` | Runtime-owned Export Settings / Import Settings identity. | `core/setup-export.md` |
| `panelActions` | Sticky product delivery actions such as export, copy, generate, apply. | `core/setup-export.md`, `core/control-selection.md` |

Schema controls always bind to a `target`, use `defaultValue` for reset behavior, and include `performanceRole` / `performanceReason` on visible non-action controls. Use built-in control `type` values before `controlRenderers`.

## Canvas

Canvas sizing modes:

- `editable-output`: product/export apps. Runtime `Setup` shows `Aspect ratio`, `Canvas width`, `Canvas height`, optional `Resolution scale`, and optional `Timeline`.
- `intrinsic-media`: explicit media-viewer/source-native products where imported media intentionally owns `canvas.size`.
- `fixed-output`: non-product/internal fixtures where users must not edit output size.

Product-output, exportable, shader, procedural, and reference-clone apps use `editable-output`. Uploaded background/source images inside a product canvas also use `editable-output`: keep the current canvas size and render the image as cover/crop inside current canvas bounds.

Use `canvas.renderScale: true` only for non-vector raster previews such as Canvas 2D, WebGL, or WebGPU. Do not enable it for DOM/SVG/vector-native previews.

## Media Defaults

Use `media.defaultAssets` for predefined files, source images, masks, symbol sets, or background images:

```ts
media: {
  defaultAssets: [
    {
      id: "default-source",
      name: "source.png",
      sourceTarget: "source.image",
      url: "/assets/source.png",
    },
  ],
}
```

`sourceTarget` must match a `fileDrop` control target. Runtime shows the asset as an attached file, users can remove it, and Reset restores it.

## Panels

- `panels.controls` contains product sections after mandatory runtime `Setup`.
- `panels.layers` is only for multiple editable objects, media objects, groups, visibility, selection, or reorder.
- `panels.timeline` is required for product animation, keyframes, playback, and video export.

Timeline compact/extended presentation is runtime UI state owned by the auto-injected `Setup` switch. Do not create product targets for `panels.timeline.extended`.

## Toolbar

`toolbar` configures runtime-owned controls:

```ts
toolbar: {
  history: true,
  radar: true,
  theme: true,
  zoom: true,
}
```

History owns undo/redo and keyboard shortcuts. Do not add route-local undo/redo listeners.

## Control Fields

Common control fields:

| Field | Purpose |
| --- | --- |
| `type` | Built-in type or registered custom renderer type. |
| `target` | Runtime state target. |
| `defaultValue` | Initial value and reset value. |
| `label` | Short UI label, `false`, or omitted. |
| `description` | Product-specific help text only when it adds meaning beyond the label. |
| `visibleWhen` | Mode/type/source/include/variant/count visibility. Hidden values are preserved. |
| `orderRole` | Makes section order testable. |
| `performanceRole` | `"workload"` or `"responsiveness"` for coverage derivation. |
| `performanceReason` | Why the role fits this app. |
| `commitMode` | `text` controls: `"content"` applies while typing, `"setting"` commits on blur/Enter. |
| `keyframeable` | Timeline/keyframe capability override when structurally needed. |
| `variant` | Component-specific variant. |

Use `visibleWhen` for product availability. Do not use `disabled`, `disabledWhen`, or inert visible controls for generated product branches.

Conditions support `equals`, `notEquals`, `oneOf`, `notOneOf`, `greaterThan`, `greaterThanOrEqual`, `lessThan`, and `lessThanOrEqual`.

Reserved runtime targets include `runtime.settingsTransfer`, `canvas.aspectRatio`, `canvas.size.width`, `canvas.size.height`, `canvas.renderScale`, and `panels.timeline.extended`. Product sections must not declare those controls.

## Built-In Control Types

| `type` | Renders |
| --- | --- |
| `actions` | Local section commands in 50% button cells. |
| `anchorGrid` | Anchor picker. |
| `channelMixer` | RGB channel mixer. |
| `checkbox` | Checkbox field. |
| `collectionActions` | Add/remove controls for growable runtime-backed item lists. |
| `code` | Multiline editor for long or structured content. |
| `color` | Hex color picker. |
| `colorOpacity` | Hex color plus opacity. |
| `curves` | Single or RGB curve editor. |
| `fileDrop` | Image/file upload, multiple upload, sorting, and image transforms. |
| `fontPicker` | Atomic typography block: font, weight, size, case, color/opacity, letter spacing, line height. |
| `gradient` | Gradient type, angle, track, stops. |
| `imagePicker` | Visual option picker. |
| `palette` | Design-token palette family + shade. |
| `rangeInput` | Two compact text values. |
| `rangeSlider` | Two-thumb slider. |
| `segmented` | Full-width compact finite choice. |
| `select` | Dropdown. |
| `slider` | Single-value slider. |
| `switch` | Binary switch. |
| `text` | Single-line input. |
| `vector` | X/Y vector pad and fields. |

Use `component-rules.md` for component-specific fit, labels, variants, units, parser behavior, and exceptions. Use `core/control-selection.md` before deciding a custom control is needed.

## Control Section Inventory

Before writing `panels.controls.sections`, export `starterControlSectionInventory` beside `appAcceptance`:

```ts
export const starterControlSectionInventory = [
  {
    entity: "Text block",
    groupingReason:
      "These controls edit the text content, typography, and visible text fill together.",
    targets: ["text.content", "text.font"],
    title: "Text",
  },
] as const;
```

Every product control target appears exactly once in the inventory. Runtime `Setup`, sticky footer `Export`, settings transfer, and runtime canvas sizing targets do not need entries.

## Transfer Metadata

Reference and motion metadata lives in `appTransferMode`.

Use `transferMode: "reference-runtime-clone"` when porting an existing app unless the user explicitly asks for redesign. Reference clones declare `referenceStudy`, `referenceFeatureInventory`, and acceptance mapping; detailed evidence requirements live in `core/reference-study.md`.

Video references declare `videoReferenceStudy` before implementation. Animated products declare `animationIntent`, and playback/keyframe timeline apps declare a proven loop duration when known. Detailed animation rules live in `core/timeline-animation.md`.

## Export And Actions

Product apps expose delivery through sticky `panelActions`, not canvas UI or ordinary body controls. Still products expose `Export PNG`; animated products expose `Export Video` plus `Export PNG`.

Every app with `Export PNG` includes `Image Export` controls with `export.image.format` and `export.image.resolution`. Animated apps also include `Video Export` controls with `export.video.format` and `export.video.resolution`.

Use standard helpers:

- `createToolcraftPngExportCanvas({ resolution, includeBackground, state, render })`
- `shouldIncludeToolcraftPreviewBackground(state)`
- `getToolcraftVideoExportSize({ resolution, state })`

Detailed Setup, Background, Image Export, Video Export, sticky action, icon, and progress rules live in `core/setup-export.md`.

## Persistence

Use persistence only for intentional user-edited state:

```ts
persistence: {
  storage: "localStorage",
  key: "my-toolcraft-app",
  version: 1,
  include: ["values", "canvas", "panels"],
}
```

Add `"timeline"`, `"layers"`, or `"media"` only when those runtime slices should survive reload. If localStorage is enabled, add reload acceptance coverage.

## Settings Transfer

`settingsTransfer` customizes runtime-owned settings import/export identity:

```ts
settingsTransfer: "auto"
```

Allowed values are `"auto"`, `true`, `false`, or `{ enabled, appId, fileName }`. None of these hide mandatory runtime `Setup`; they only affect metadata. Do not implement settings import/export through `panelActions`, hidden file inputs, or route-local handlers.
