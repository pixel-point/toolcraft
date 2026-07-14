# Control Selection

Read this module before adding, replacing, grouping, or custom-rendering controls.

## Built-In First

- Choose controls by product value model before UI appearance.
- Use built-in Toolcraft controls before custom controls.
- If multiple built-ins can work, choose the closest one and record the reason.
- If a built-in owner is discovered after a custom workaround, replace the workaround with the built-in.
- Custom controls are allowed only after documenting checked built-ins and why the closest one is insufficient.

## Control Selection Inventory

Before writing schema controls, map every user-visible product setting or action:

```txt
Product need:
Value model:
Candidate built-ins checked:
Best built-in:
Why:
Rejected alternatives:
Target:
Renderer/export mapping:
Acceptance coverage:
```

This inventory can be in implementation notes, `starterControlSectionInventory`, or `docs/toolcraft/agent-worklog.md`, but the decision must exist before custom UI is introduced.

## Exact Owners

- Use `gradient` for adjustable gradients, color transitions, gradient fills, stops, type, and angle. Do not replace it with two `color` controls.
- Use `fontPicker` for typography that includes font family, weight, size, text case, text color/opacity, letter spacing, or line height.
- Use `colorOpacity` when one product entity owns both color and opacity.
- Use `rangeSlider` or `rangeInput` for lower/upper bounds or from/to ranges.
- Use `curves` for editable tone, response, easing, remapping, opacity, depth, mask, or channel curves.
- Use `vector` only for stable manually-authored two-axis product parameters such as position, offset, direction, focus, anchor, light direction, white balance, color balance, chroma offset, or tone bias.
- Use `fileDrop` for source material uploads.
- Use `imagePicker` for choosing one visual option from a set.
- Use `palette` only for constrained design-token color choices with both family and shade.
- Use `actions` for local section commands that affect only the nearby entity.
- Use `collectionActions` for repeatable product entities whose actual item list can grow or shrink.
- Use `panelActions` for sticky final product actions such as export, copy, generate, apply, or download.

## Compound Controls Are Atomic

- `fontPicker` owns font family, weight, size, text case, text color/opacity, letter spacing, and line height.
- `gradient` owns gradient type, angle, draggable stop track, and Stops list.
- RGB `curves`, `channelMixer`, `palette`, and `collectionActions` are also compound controls.
- Do not split owned fields into neighboring schema controls.
- If a needed owned field is missing from a built-in, extend the kit instead of composing a parallel control.

## Collection Actions

- Use `collectionActions` when users edit the actual growable/shrinkable set: colors, glyphs, symbols, points, rules, variants, objects, style entries, or similar repeatable entities.
- Adding/removing items must update runtime state and product preview/export.
- Do not use a count slider plus hidden fixed item controls when the user needs to add or remove actual entities.
- The collection control shows the collection label on the left and remove/add icon buttons on the right.
- Homogeneous repeated items do not show visible per-item labels when the collection label already names the group.
- Plain color items may use equal 50% columns; color+opacity items stay stacked.

## Actions

- Use schema `actions` for local section commands such as randomize palette, normalize weights, sort glyphs, clear selection, duplicate item, or reset current stop.
- If there is one `actions` button, the control label and button label must not be identical. Keep the button as the command verb and make the label a concise context.
- If an `actions` control has a visible label, the label is above the buttons.
- Actions render in 50% cells: one button uses the left half, two buttons fill one row, and larger groups continue in two columns.
- Do not stretch an odd trailing action full-width or center it.
- Keep final product actions in `panelActions`, keep timeline transport in the top timeline, and keep global reset in the controls panel header.

## Vector Ownership

Use Vector only when the user is meant to manually author a stable two-axis product parameter.

Before adding Vector to an animated or interactive product, classify movement ownership:

- `direct-authored`: stable user-authored parameter such as light direction, focus, anchor, or object offset. This can be Vector.
- `timeline-driven`: movement comes from playback/keyframes. Use timeline, speed, duration, path, step, or amplitude controls instead.
- `keyboard/pointer-driven`: movement comes from user input on the canvas/app. Keep current position/direction in interaction state and expose only useful tuning controls.
- `simulation-owned`: movement comes from physics/procedural state. Keep current pose/velocity internal and expose high-level tuning controls.

Do not expose a pad for current animation state, keyboard movement, pointer movement, physics state, timeline phase, velocity, target pose, current pose, or simulated position/direction just because the internal value has `x` and `y`.

## Custom Control Gate

- Custom controls are for product interactions that built-ins cannot represent.
- Custom controls must use Toolcraft primitives, tokens, spacing, typography, and action affordances.
- Custom controls must expose the minimum UI needed to understand and operate the product value.
- Every visible custom-control element must have a job: choose, order, preview, delete, upload, edit, or show useful status.
- Remove file names, helper text, and captions that do not help distinguish items or explain state.
- Do not make tiny item-level action buttons below kit comfort sizes.
- Do not recreate built-in controls, panels, toolbar, timeline, layers, canvas shell, or runtime surfaces.
