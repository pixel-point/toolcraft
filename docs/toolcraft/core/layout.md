# Controls Layout

Read this module before changing sections, labels, helper icons, inline rows, dividers, action layouts, or panel density.

## Sections

- Build controls-panel sections from product entities and workflow stages, not component types.
- Before writing controls, export `starterControlSectionInventory`. Each product section declares title, product entity or workflow stage, targets, and grouping reason.
- Keep sections discrete. Two to seven product controls is the normal size.
- Split sections that grow past seven controls or mix several meanings.
- Do not reuse the same section title for multiple sections.
- Bad titles: `Controls`, `Settings`, `Options`, `Sliders`, `Inputs`, `Buttons`, `Color`, `Colors`.
- Good titles name the edited thing: `Background`, `Object`, `Token Pattern`, `Motion`, `Tone Mapping`, `Export`.
- Every app-authored controls-panel body section has a short meaningful visible title.
- Runtime `Setup` is the first visible headerless controls block. Sticky footer export actions render without a visible heading.

## Dependency Cohesion

- A selector that controls mode, type, source, variant, or include state stays with the controls it gates when they share the same product entity.
- Use `visibleWhen` for inactive product branches so the panel shows only usable controls.
- Do not create a separate section that merely mirrors one selector option unless that branch is a genuinely separate product entity with its own workflow evidence.
- A section with no visible controls is hidden automatically.
- Do not use `disabled: true` or `disabledWhen` for generated product controls.

## Section Headers And Reset

- Every visible section title renders through the standard 36px collapsible header row.
- Do not hand-build section headers in generated apps.
- Section expand/collapse uses the standard runtime height/opacity animation.
- Collapsed/expanded state persists as per-app runtime UI preference.
- Collapsed/expanded state is not undo/redo state, settings import/export state, or Reset controls state.
- Ordinary section headers expose the runtime section reset action before the collapse button.
- Section reset dispatches `controls.resetTargets` and restores only that section's targets to schema `defaultValue`.
- Runtime `Setup` is not collapsible and has no reset action. Sticky footer export sections are not collapsible.

## Section Spacing

- Runtime `Setup` and ordinary body sections use 8px top spacing and 24px bottom spacing for control content.
- Sticky footer action sections keep their dedicated spacing.
- Do not add custom padding in generated apps to compensate for a local section issue. Fix the shared layout rule.

## Dividers

- Full-width dividers belong only to panel sections.
- Large built-in compound controls inside a section render content-width internal dividers only when their parent section contains more than one visible control item.
- Keep 18px between each rendered internal divider and compound-control content.
- If the compound control is the first item in that section, render only its bottom internal divider and remove top internal padding.
- If the compound control is the last item, render only its top internal divider and remove bottom internal padding.
- If a section contains exactly one control, simple or compound, render only the parent section dividers.
- Do not add full-width borders inside a compound control.
- Do not put dividers only around an internal subsection such as Gradient Stops.
- Small compound fields such as `colorOpacity` and `rangeInput` stay inline fields without section dividers.

## Labels And Help

- Keep labels short but semantically sufficient with the nearest visible section/group context.
- Put product-specific behavior help in schema `description`.
- Runtime shows the help icon only when `description` adds meaning beyond the label.
- Do not use descriptions that recap the label, such as `Adjusts Opacity`.
- Do not add helper icons to obvious homogeneous groups when the section title and label already explain the control.
- In toggle components, do not prefix labels with `Enable`; the switch already communicates on/off.
- When a section title supplies the context, remove repeated nouns from nearby labels. For example, in `Background`, the switch label is `Include`, not `Include background`.

## Inline Rows

- Inline rows are allowed only when the controls are related, short, and preserve internal padding.
- Every 50/50 inline row uses the same horizontal column gap as paired select controls.
- Controls in a 50/50 row each occupy half the available content width.
- If any label or value clips, truncates, or loses internal padding, stack the controls and record the fit reason.
- Toggle-plus-parameter rows are allowed when the toggle enables/includes the same entity and the parameter is short. Keep the toggle label visible and set the non-toggle parameter `label: false`.
- If the non-toggle parameter label is necessary, stack the controls instead.
- Sliders and range sliders are full-width and do not sit in inline rows.
- Segmented controls are full-width and do not sit beside Switch, Color, Select, or another control.
- Standalone selects are full-width with label above dropdown. Use two-column select rows only for related short pairs such as export `Format` and `Resolution`.

## Actions Layout

- If an `actions` control has a visible label, the label is above the buttons.
- One action button occupies the left 50% cell.
- Two action buttons fill one row.
- Larger groups continue in two columns.
- Odd trailing actions stay in the left 50% cell.
- Sticky footer `panelActions` use the sticky footer action layout, where a final odd action can span the full row.

## Colors In Rows

- First identify the semantic entity the color belongs to: background, object, connector, glow, tone mapping, brand, export, or named product object.
- Keep color inside the entity section when it configures the same entity as nearby controls.
- Use a standalone color section only when color is the whole semantic section.
- Standalone color section titles must describe product role. Never create a section titled `Color` or `Colors`.
- Omit per-item labels such as `Color 1`, `Color 2`, or `Color 3` when colors only add variety to one shared palette/color bank.
- Keep visible labels when each color edits a distinct user-facing entity or role.
- Apply label visibility to the whole semantic color group; do not mix labeled and unlabeled items inside one bank.
- Multiple related plain colors render at most two per row.
- An odd trailing plain `color` keeps the same half-width footprint instead of stretching to full width.
- If any color has opacity, keep it stacked instead of placing it in a two-column row.
- `colorOpacity` owns color plus opacity for one entity and must not be split into color plus opacity slider/input.

## Select And Segmented Fit

- Standalone `select` controls render stacked and full-width.
- Use compact two-column select layout only for related short pairs that tune one workflow or entity.
- Segmented controls are full-width compact choices with at most four options, no option label longer than nine characters, and no more than twenty-four total option-label characters.
- If segmented cells clip, collide, lose padding, or force labels into adjacent cells, shorten labels first. If compact labels still fail, use `select`.
