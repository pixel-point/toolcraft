# Component Rules

> Reading route: start with `workflow.md`. Core generated-app rules live in `core/*`; this file is a focused component reference for the topic below.

## Control Decision Catalog

Use `core/control-selection.md` for the built-in fit check, exact control owners, compound-control ownership, actions, collection actions, vector ownership, and the custom control gate.

## Dividers

Use `core/layout.md` for section dividers and compound-control divider rules. Component-specific exceptions are documented in the relevant component sections below.

## Sliders

Slider `step` means numeric snapping only. It does not make a slider visually discrete by itself.

Classify every stepped slider as either `stepped continuous` or `visual discrete` in the spec and schema tests.

Use `variant: "discrete"` for semantic integer domains where markers help choose positions: counts, rows, columns, levels, bands, passes, points, tiles, segments, finite position choices, and finite animation-step controls such as flip depth, character count, glyph steps, or frame steps.

Keep large or precision stepped ranges visually continuous, even with `step`: speed, FPS, rate, duration, seconds, milliseconds, density, size, intensity, quality, and other ranges with many positions.

Visual discrete sliders must declare `step`; the runtime derives one marker per value position from `min`, `max`, and `step`. Visual discrete sliders with too many positions are invalid because they produce marker noise.

Schema sliders always render stacked at full width. Do not put `slider` or `rangeSlider` controls in two-column inline rows. The only built-in exception is `fontPicker`, whose letter-spacing and line-height footer sliders stay paired inside that component.

Use slider `unit` only for real measurement suffixes: `%`, `px`, `°`, `s`, `ms`, `fps`, `rows`, `cols`, or a similarly useful domain unit. Do not use `unit: "x"`; scale, multiplier, intensity, opacity, strength, depth, and shader amount sliders display plain numbers unless a real measurement unit applies. Do not use `unit` to repeat the entity already named by the section or label. Avoid `Letters` + `letters`, `Shape Density / Count` + `shapes`, `Words` + `words`, `Symbols` + `symbols`, `Items` + `items`, `Particles` + `particles`, and `Layers` + `layers`. If the numeric value needs an entity noun to make sense, rename the label or section instead of appending the noun to the value. Compact units render tight (`70%`, `24px`, `8s`); word or acronym units render with a space (`5 cols`, `17 fps`) only when they are truly needed.

Slider value labels are editable only when they contain a numeric value. Textual state labels such as `Normal` are display-only and must not expose hover or click editing affordances.

Range sliders are always full-width two-thumb controls. Do not put a `rangeSlider` in an inline row. Its `defaultValue` must start with different lower and upper values, such as `[20, 80]`, so the control does not collapse into a single-value slider.

Range slider value editing accepts common range separators such as `20/80`, `20-80`, `20 - 80`, `20 80`, and en-dash ranges. Use the built-in parser instead of adding custom label parsing.

Discrete sliders must still drag smoothly. Heavy preview work may be coalesced, cached, or split into lightweight live feedback plus heavier refinement, but the canvas/product output must not stay unchanged until pointer release.

Use `visibleWhen` when a slider or range slider is meaningful only in some mode, type, source, include, variant, or count state. Inactive branches disappear so the panel shows only controls that can be used in the current state.

Do not use schema `disabled: true` or `disabledWhen` for product sliders and range sliders. Product panels should show only controls usable in the current state. Use `visibleWhen` for unavailable product states instead of rendering disabled controls.

For mode/type/source/include/count branches, hide with `visibleWhen` instead of disabling. Example: when Texture is `Off`, hide texture pattern, upload, blend, and opacity. When Texture is `Image`, show the image uploader and shared texture settings. When `Shades` is `2`, `Shade 3`, `Shade 4`, and `Shade 5` are not visible. Do not keep inactive controls visible while making the renderer ignore them.

If `visibleWhen` points to a selector for the same target entity or selected branch, keep the selector and the dependent controls in the same semantic section. A section that exists only because one selector option is active is not a separate product section just because the branch uses a standalone control. Use one section with conditional controls; split only when the dependent branch is a separate product entity with its own workflow and acceptance evidence.

## Palette

Use `palette` only when the product needs a constrained token palette: family plus shade. It is for design-system color tokens, not for arbitrary color entry.

Use `color` for free hex colors, `colorOpacity` when opacity belongs to the same color entity, `gradient` for color transitions, and `fontPicker` when the color belongs to typography. Palette is a live control: family and shade changes update runtime state immediately, before delayed persistence/commit settles, so the next canvas interaction uses the selected token. Browser acceptance must change both `palette.family` and `palette.shade` and prove the rendered/exported output consumes both parts.

## Segmented Controls

Use segmented controls only for compact mode choices that preserve every cell's internal padding.

Segmented controls are full-width. Do not place `segmented` beside Switch, Color, Select, or another control in a two-column inline row; use `select` when a finite choice must occupy a half-width column.

Limits:

- at most four options;
- no option label longer than nine characters;
- no more than twenty-four total option-label characters.

If cells clip, collide, lose padding, or force labels into adjacent cells, shorten labels first. If compact labels still fail, use `select`.

## Select Controls

Standalone `select` controls render stacked and full-width: label above, dropdown below. Do not use the old compact side-label form with label on the left and dropdown on the right.

Use a two-column inline row only for related short `select` pairs that tune one workflow or entity, such as export `Format` and `Resolution`. If either label or selected value clips, truncates, or loses internal padding, stack the pair and record the fit reason.

## Slider Responsiveness

Use `core/performance.md` for live slider responsiveness, renderer optimization, and browser evidence requirements.

## Sections

Use `core/layout.md` for section grouping, dependency cohesion, headers, reset, collapse persistence, spacing, dividers, labels, inline rows, and color-row fit. Keep this page focused on component-specific behavior.

## Colors

Use `core/layout.md` for semantic color grouping, color labels, row fit, and color/opacity layout. Use `core/setup-export.md` for the required output `Background` section and export background behavior.

## File Upload

Use `core/media-upload.md` for `fileDrop` ownership, image/file modes, multiple uploads, sorting, transform actions, canvas source images, default assets, and layer ownership.

## Image Picker

Every visible `ImagePicker` item must be actionable in the current product context. Do not show choices that sanitize to fallback or no-op behavior.

Sizing:

- two options: large tiles;
- three or six options: medium tiles;
- larger sets: small tiles.

Filter or split choices by template, mode, or selected object when only some choices are valid.

## Font Picker

Use `fontPicker` for typography choices that need font preview plus weight, size, text-case, text color/opacity, letter-spacing, and line-height controls. Do not recreate it with a plain `select`, custom font list, or separate typography inputs.

The value is one object: `{ fontId, fontWeight, fontSize, letterSpacing, lineHeight, textCase, color, opacity }`. Typography renderers and exports must consume all eight parts.

The standard/default text color is `#FFFFFF` with opacity `100`. Omit `color`/`opacity` or use those values unless the prompt or reference explicitly requires a different initial text color.

If `fontPicker` controls product text, the preview renderer and export renderer must apply the selected `fontId`, `fontWeight`, `fontSize`, `letterSpacing`, `lineHeight`, `textCase`, `color`, and `opacity` to that actual text. Do not stop at updating runtime state, the select label, or the popup preview.

The component owns search, category filters, virtualized scrolling, font preview loading, selected-row behavior, the font-weight select, the font-size input, the text-case select, the color/opacity control, and the two footer sliders. Browser acceptance must choose a different font, change weight, change size, change text case, change color/opacity, move Letter spacing, and move Line height.

`fontPicker` is an atomic typography block. Do not place sibling schema controls for `Case`, `Weight`, `Size`, `Letter spacing`, `Line height`, `Color`, or `Opacity` when they affect the same product text entity. If a typography part is missing from the built-in value model, extend `fontPicker` in the kit instead of composing a neighboring control.

Do not add `description` to `fontPicker` just to list these owned fields. If the section title and visible field labels already make the text target clear, omit `description`; use it only for non-obvious product scope.

## Vector

One vector control in the controls panel uses the square X/Y pad. Multiple vector controls use compact pads so the sidebar does not become too tall.

Use variants by product meaning:

- default: position, offset, direction, focus, anchor, light direction;
- `whiteBalance`: temperature and tint;
- `colorBalance`: paired color-balance axes;
- `chromaOffset`: RGB or chromatic offset;
- `toneBias`: split-tone, duotone, or color-grading bias.

Use Vector only when the user is meant to manually author a stable two-axis product parameter. Do not expose a pad for current animation state, keyboard movement, pointer movement, physics state, timeline phase, velocity, target pose, current pose, or simulated position/direction just because the internal value has `x` and `y`.

Before adding a Vector control to an animated or interactive product, classify movement ownership:

- `direct-authored`: a stable parameter the user manually edits, such as light direction, focus, anchor, or object offset. This can be Vector.
- `timeline-driven`: movement comes from playback/keyframes. Use timeline, speed, duration, path, step, or amplitude controls instead.
- `keyboard/pointer-driven`: movement comes from user input on the canvas/app. Keep position/direction in interaction state and expose only useful tuning controls.
- `simulation-owned`: movement comes from physics/procedural state. Keep current pose/velocity internal and expose high-level tuning controls.

Default/spatial vector pads use screen-coordinate movement. Dragging the pad left/up lowers `vector.x` and `vector.y`, so an object on the canvas moves left/up without renderer-side Y inversion. Use `coordinateMode: "cartesian"` only when the product intentionally exposes mathematical Y-up coordinates.

Vector pad value labels are compact UI labels, not raw state dumps. They show rounded normalized coordinates and must never expose floating-point tails such as `-0.07070312499999998`.

Double-clicking the vector pad resets both axes to the control default through the normal runtime value update, matching the reset button in the section header. If no default is defined, the fallback is `0,0`. Do not add a separate custom reset button for basic pad reset behavior.

Holding Shift while dragging a vector pad locks movement to the dominant axis and must not select text or page content. Use the built-in `vector` control for constrained two-axis direct-authored parameters instead of creating a custom pad.

Do not add custom vector sizing props. Choose the right number, variant, and section grouping, then let runtime sizing handle the pad.

## Curves

Use `curves` for editable remapping curves. First decide the curve variant by product meaning; do not rely on the runtime default.

Use `variant: "single"` for one standalone curve without channel tabs, such as acceleration, bend, easing, opacity response, depth response, mask response, threshold response, tone response, or another single mapping curve. Do not create a custom curve UI just to remove RGB tabs.

RGB Curves is the color-correction or channel-specific case. Use RGB/R/G/B tabs only when the product edits RGB channels, color correction, color grading, or channel curves. Do not force RGB/R/G/B tabs onto products that need only one response, bend, depth, or easing curve.

Single Curves is one labeled control and does not use internal dividers. RGB Curves is the compound variant because it contains channel tabs plus curve points, so it follows the compound divider rules when mixed with sibling controls.

Choose interpolation by product meaning:

- `interpolation: "smooth"` for photo/editor-like visual tone, color, and RGB curves where the curve should feel like a creative spline;
- `interpolation: "monotone"` for depth, response, mask, opacity, threshold, and data-mapping curves where order must be preserved and overshoot is unsafe.

Single curves default to monotone. If a single curve is still a creative visual tone curve, set `interpolation: "smooth"` explicitly.

Acceptance for curves should include an off-center control point near an edge so smooth-vs-monotone interpolation mistakes are visible in the actual product output, not only in the curve UI.

## Text And Code

Use `text` for short single-line strings: button labels, canvas labels, names, small values, compact prompts, titles, captions, badges, and tokens.

For `text`, separate content from settings. `commitMode` defaults to `"content"`: content strings such as prompts, names, titles, tokens, and short text update while the user types. Use `commitMode: "setting"` for text inputs that edit settings such as font size, numeric-like style values, dimensions, ids, or configuration fields; setting text commits on blur or Enter. Canvas width and Canvas height are runtime-owned editable-size fields and always commit on blur or Enter.

Use `code` / `CodeTextarea` as the base multiline content editor for any potentially long value: long prompts, multiline text, instructions, JSON, CSS, shader code, scripts, templates, or other structured text. It applies while typing, is capped at 12 visible lines, and long content scrolls inside the textarea instead of making the controls panel taller. Do not use it for short one-line button/canvas text such as `Glass`, `Submit`, `Title`, or `Badge`; use `text`. If the default value is short but the intended input is long or structured, make that reason explicit in `description`. Do not name a section `Code` unless the product value is actually code.

## Labels

Use `core/layout.md` for label naming, help tooltip eligibility, switch/checkbox naming, toggle rows, and label parity. Component pages should add `description` only for non-obvious product behavior that the core layout rules allow.

## Layers

Enable layers only when the app has multiple editable objects, media objects, groups, visibility, selection, reorder, or selected-layer controls.

Do not show Layers for a single-layer app. Do not use `selectedLayer.*` targets when Layers are disabled.

When Layers are enabled, browser tests must use the real LayersPanel UI: select, visibility, reorder, grouping, and media lifecycle when uploads/deletes create or remove layers.

## Timeline

Use `core/timeline-animation.md` for animation intent, playback/keyframe timeline choice, forward seamless loop rules, duration mapping, keyframe evaluation, viewport interaction performance, and video export timing.

## Panel Actions

Use `core/setup-export.md` for mandatory runtime Setup, background, Image Export, Video Export, sticky product actions, export icons, and async progress. Use `core/control-selection.md` for choosing `actions` versus sticky `panelActions`.

## Canvas Handles

Use product editing handles only when direct manipulation is better than panel-only editing: gradient stops, focus points, light vectors, crop bounds, mask points, transforms, bezier anchors, or perspective corners.

Handles are visual overlays, not app UI. They must be textless, tokenized, bound to runtime state, and excluded from export/copy output.
