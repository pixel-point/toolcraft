# Custom Controls

> Reading route: start with `workflow.md`. Core generated-app rules live in `core/*`; this file is a focused custom-control reference for the topic below.

Use a custom control only when no built-in Toolcraft control represents the product interaction.

Built-ins come first: `slider`, `rangeSlider`, `select`, `segmented`, `switch`, `checkbox`, `color`, `colorOpacity`, `vector`, `gradient`, `curves`, `fontPicker`, `imagePicker`, `fileDrop`, `text`, `code`, `rangeInput`, `palette`, `actions`, `collectionActions`, and `panelActions`.

Register custom renderers through `ToolcraftApp controlRenderers`.

Do not use `controlRenderers` to recreate a built-in control. If the product needs a slider, select, segmented mode picker, color input, gradient editor, font picker, image upload, arbitrary file upload, textarea, local action group, repeatable item add/remove, or footer action, declare the matching schema control instead of rendering the component manually.

Do not edit `ControlsPanel`, copied `src/toolcraft`, or Toolcraft internals inside a generated app.

Import custom renderer types from `@/toolcraft/runtime/react`.

## Required Schema

Custom control schemas still need:

- `type`;
- `target`;
- `defaultValue`;
- `label`;
- `orderRole`;
- acceptance coverage;
- `customControlCoverage`;
- `builtInFitCheck`;
- browser coverage;
- performance coverage when they can trigger product work.

`builtInFitCheck` is required for every custom control acceptance row:

```ts
builtInFitCheck: {
  checkedBuiltIns: ["fileDrop", "collectionActions", "imagePicker"],
  closestBuiltIn: "fileDrop",
  whyInsufficient:
    "FileDrop imports, previews, orders, and removes source files, but this product also needs per-glyph density thresholds stored with each item.",
  productObservable:
    "Changing a glyph density threshold changes which uploaded glyph renders for the same depth-map tone.",
}
```

`checkedBuiltIns` must name real Toolcraft built-in controls. `closestBuiltIn` must be one of those checked controls or `"none"` when no built-in is meaningfully close. `whyInsufficient` explains the missing interaction. `productObservable` names the output or side effect that proves the custom control is necessary.

If the custom control owns a growable, removable, selectable, or reorderable runtime item set, `checkedBuiltIns` must include both `collectionActions` and `actions`. Decide this from the value model and workflow, such as arrays, `{ items: [...] }` objects, selected-item state, or add/remove/reorder behavior, not from entity names like masks or glyphs. This applies even when the empty state visually looks like a few icon buttons: the fit check must prove why `collectionActions` cannot own the runtime list and why `actions` alone cannot represent the collection state.

Do not justify a custom control with icons, layout, styling, compactness, or custom buttons alone. If the built-in control has the right value model and mechanics, use it or improve that built-in instead.

## State Rules

Custom renderers must write through the provided `setValue(nextValue, meta)` callback or existing runtime commands.

Local-only custom control state is invalid unless it is transient draft, hover, focus, or drag state. Final product state belongs to the Toolcraft runtime.

## Keyframes

If a custom value is keyframe-capable, the renderer must work with runtime keyframes instead of local animation state. Store typed values in keyframes through runtime commands and consume `useToolcraftEvaluatedValues`, `useToolcraftEvaluatedValue`, `evaluateToolcraftTimelineValues`, or `evaluateToolcraftTimelineValue`.

## Visual Rules

Custom controls should use Toolcraft tokens, spacing, focus states, disabled opacity, and interaction patterns. A custom control should look like it belongs in the controls panel.

Custom controls must render the minimum UI needed to understand the value, context, and available actions. Do not add decorative metadata or text that repeats the section title, control label, or obvious item state.

Every visible custom-control element must justify its space by enabling selection, ordering, preview, removal, upload, editing, or a product-affecting status. If text is only nice-to-have, remove it.

Use Toolcraft primitives for all custom-control chrome. Do not hand-style basic buttons, inputs, selects, sliders, scroll areas, or focus states.

Custom controls may use primitives for app-specific chrome, but they must not duplicate toolbar, timeline, layers, canvas, panel, or built-in control mechanics.

Choose element sizes from interaction need, not from how much content you want to fit. Glyphs, swatches, chips, and thumbnails can be compact, but destructive, reorder, upload, and primary actions must keep comfortable kit button or icon-button sizes.

When a custom list item needs context, prefer concise semantic labels such as `Darkest`, `Mid tone`, or `Lightest`. Omit file names, long captions, and duplicate helper text unless they are required to distinguish items.

If a custom control is really direct manipulation of the product output, prefer a product editing handle in `canvasContent` plus a schema-backed target.
