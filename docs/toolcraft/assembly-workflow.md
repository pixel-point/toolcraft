# Assembly Workflow

> Reading route: start with `workflow.md`. Core generated-app rules live in `core/*`; this file is the focused runtime assembly path.

Build the app from the local Toolcraft runtime copy. Do not recreate controls, panels, toolbar, canvas behavior, timeline, layers, or app chrome by hand.

Use:

- `@/toolcraft/runtime` for schema, contracts, state, commands, history, canvas, panels, timeline, layers, toolbar, and tests.
- `@/toolcraft/runtime/react` for `ToolcraftApp` and hooks.
- `@/toolcraft/runtime/styles.css` for runtime styles.
- `@/toolcraft/ui` for visual components.

## Runtime Path

Declare the product with `defineToolcraft`. Render through `ToolcraftApp`.

```tsx
import { defineToolcraft } from "@/toolcraft/runtime";
import { ToolcraftApp } from "@/toolcraft/runtime/react";

const appSchema = defineToolcraft({
  canvas: { enabled: true, sizing: { mode: "editable-output" }, upload: true },
  panels: {},
  toolbar: { history: true, radar: true, theme: true, zoom: true },
});

export function AppHome() {
  return <ToolcraftApp schema={appSchema} />;
}
```

Routes must render `ToolcraftApp` directly. Do not compose `ToolcraftRoot`, `CanvasShell`, `ControlsPanel`, `LayersPanel`, `TimelinePanel`, or `ToolbarPanel` by hand. If a runtime surface has a performance or behavior issue, fix the shared runtime instead of replacing the surface locally.

Allowed app extension points:

| Extension point | Use for |
| --- | --- |
| Schema controls | Built-in controls, targets, defaults, visibility, panel actions. |
| `canvasContent` | Product output only. |
| `controlRenderers` | True custom controls only after the built-in fit check. |
| `onPanelAction` | Sticky footer product actions. |
| Runtime commands/hooks | History, media, canvas, timeline, layers, and controlled app behavior. |

Do not render built-in controls such as `SliderControl`, `SelectControl`, `ColorControl`, `GradientControl`, `FontPickerControl`, `FileDropControl`, or `PanelActionsControl` directly in app code. Declare them in schema so layout, reset, history, visibility, keyframes, labels, and tests stay runtime-owned.

## Product Readiness

The starter baseline is neutral: canvas/upload/toolbar shell only. Do not include demo controls, prompt fields, timeline, or layers until product behavior requires them.

Once the folder is a real product, switch `src/app/app-acceptance.ts` from neutral readiness to:

```ts
export const appProductReadiness = {
  mode: "product",
  productName: "Product name",
  productSummary: "What the app creates or edits.",
  requestedBehavior: "The user-facing behavior this app must implement.",
} as const;
```

## Controls

Before writing product sections, export `starterControlSectionInventory`. Each product section declares its title, targets, product entity or workflow stage, and grouping reason.

Use `core/layout.md` for section grouping, dependency cohesion, headers, reset, collapse, spacing, dividers, labels, and inline rows. Use `core/control-selection.md` and `component-rules.md` before choosing concrete controls. Built-in compound controls stay compound; extend the kit instead of splitting owned fields into neighboring controls.

## Canvas And Product Output

Use `canvasContent` only for product output: WebGL, Canvas 2D, SVG, DOM product text, shader previews, generated previews, export previews, or product editing handles.

`canvasContent` must not contain app UI: buttons, forms, CTAs, upload prompts, helper text, settings, menus, labels, placeholder copy, or empty-state instructions.

If upload/import is part of the source-material flow, use `fileDrop` and keep the pre-content canvas neutral. Do not invent canvas placeholder artwork, source CTAs, fake sample output, or hidden preset files. Use `media.defaultAssets` when the prompt or reference actually provides default files.

Use `core/runtime-boundary.md` for shell boundaries, `core/media-upload.md` for upload behavior, and `core/setup-export.md` for editable output size, background, and export sections.

## Reference And Design Sources

If a Figma URL is provided, use Figma MCP/design context before implementation and rebuild from file structure, not from a screenshot.

If a video, GIF, screen recording, contact sheet, or extracted-frame sequence is provided, write a Video Reference Study before implementation.

When porting an existing app, use `transferMode: "reference-runtime-clone"` unless the user explicitly asks for redesign. Declare `referenceStudy` plus `referenceFeatureInventory`, then prove each inspected reference feature with acceptance coverage. Use `core/reference-study.md` for the detailed reference, Figma, and video study rules.

## Timeline And Animation

Before adding animation controls, write an Animation Intent Inventory. Product animation, keyframes, playback, and video export use the top Toolcraft timeline. Autonomous no-timeline animation is allowed only for non-product decorative motion with no user-facing transport and no video export.

Use `core/timeline-animation.md` for timeline mode, compact/extended timeline, seamless forward loops, duration changes, keyframes, viewport interaction performance, and video export timing.

## Renderer Work

For custom renderers, write the Renderer Technique Decision Matrix and Render Pipeline Inventory before code. The implementation plan maps every performance-sensitive control to the render pass it invalidates.

Use `renderer-technique.md` and `core/performance.md` for renderer strategy, cache keys, workload fixtures, render scale, and optimization evidence.

## Verification Tiers

Before every edit, classify blast radius and record the planned checks:

```md
Verification tier: Tier N
Reason: <changed surface and expected blast radius>
Run: <commands and browser checks>
Skip: <checks not needed for this pass and why>
```

Use `npm run verify:ui` when browser acceptance is required without the performance suite. Run `npm run verify:final` for first working product delivery, folder export, runtime/template/contract/CLI changes, broad refactors, and final gates. Full performance checkpoints run only for the first working product version or explicit performance complaints; otherwise run targeted performance checks only for touched paths.

For final delivery, run:

```bash
npm run verify:final
npm run dev
```
