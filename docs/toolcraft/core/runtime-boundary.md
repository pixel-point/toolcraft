# Runtime Boundary

Read this module before changing app assembly, routes, runtime surfaces, custom renderers, canvas output, panels, toolbar, timeline, layers, or controls.

## Required Runtime Shell

- Build through `defineToolcraft`.
- Render through `ToolcraftApp`.
- Read `appSchema.assembly` before adding custom JSX. It lists the enabled runtime surfaces, capabilities, commands, and assumptions for the current app.
- Keep app state in the Toolcraft runtime schema and runtime commands.
- Keep route files thin: routes compose the schema-backed Toolcraft app and product renderers.
- Do not replace Toolcraft with copied reference UI, route-local panels, standalone forms, or hand-built editor chrome.

## Allowed Extension Points

Use only these app-specific extension points unless you are intentionally changing the shared Toolcraft runtime:

- schema controls;
- schema `canvas`, `panels`, `toolbar`, `panelActions`, `persistence`, `media`, `assembly`, and transfer-mode metadata;
- `canvasContent` for product output only;
- `renderDefaultCanvasMedia={false}` only when a product renderer replaces the default media preview;
- `controlRenderers` only for true custom controls that pass the built-in fit check;
- `onPanelAction` for sticky product actions;
- runtime commands and hooks.

## Forbidden Rebuilds

- Do not hand-compose `ToolcraftRoot`, `CanvasShell`, `ControlsPanel`, `LayersPanel`, `TimelinePanel`, `ToolbarPanel`, or panel containers in product routes.
- Do not render built-in control components such as `SliderControl`, `SelectControl`, `ColorControl`, `GradientControl`, `FontPickerControl`, `FileDropControl`, or `PanelActionsControl` directly in app code.
- Do not recreate controls, panels, toolbar, timeline, layers, canvas shell, drag handles, section headers, section reset, history, or runtime surfaces by hand.
- If a shared behavior is wrong, fix the shared runtime/template source and regenerate or sync the copied Toolcraft source instead of patching one exported app.

## Canvas Boundary

- `canvasContent` contains product output only: WebGL, Canvas 2D, SVG, DOM product text, shaders, generated previews, export previews, or product editing handles.
- App UI, CTAs, upload prompts, helper copy, placeholder instructions, buttons, menus, forms, and settings do not belong in `canvasContent`.
- If upload/import is part of the source-material flow, the pre-content canvas stays neutral and runtime-backed. Upload affordance belongs in `fileDrop`.
- DOM product text rendered inside `canvasContent` must be marked with `data-toolcraft-product-output` or `data-toolcraft-product-text` so tests and performance fixtures can target product output instead of app chrome.
- Product editing handles must be textless overlays, write to runtime state, and stay out of export/copy output.
- Preserve the runtime canvas backing. Product renderers may draw their own product background, but must not hide, replace, or make the Toolcraft canvas shell/backing transparent.

## State Boundary

- Bind every visible control to runtime schema state or a runtime command side effect.
- Use `defaultValue` for resettable controls.
- Use runtime commands such as `controls.reset`, `controls.resetTargets`, `media.import`, `media.delete`, `canvas.center`, `history.undo`, and `history.redo`.
- Do not keep final product settings in isolated local React state when they need reset, persistence, import/export, keyframes, browser acceptance, or product export.

## Generated App Source Boundary

- Generated applications keep their public editing surface in `src/app/app-schema.ts` and app-specific files under `src/app` and `src/routes`.
- Do not edit `src/toolcraft` in one generated app unless the task is intentionally changing the local copied runtime. Prefer fixing the monorepo runtime and regenerating or syncing.
- Generated apps must not contain monorepo app/package folders, workspace-protocol dependencies, or workspace package imports.
