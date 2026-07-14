# Reference Study

Read this module before porting, auditing, or rebuilding from a reference app, Figma file, video, GIF, screen recording, contact sheet, or extracted frames.

## Reference Runtime Clone

When porting an existing app, use `transferMode: "reference-runtime-clone"` unless the user explicitly asks for redesign.

Preserve the reference runtime as source of truth:

- animation loop and time ownership;
- refs and mutable renderer state;
- particles, objects, connections, spawn cadence, and lifetime rules;
- pause/resume, restart, progress, export, and copy semantics;
- canvas sizing and media lifecycle;
- control-to-renderer mapping.

Toolcraft still owns the shell: schema, controls, canvas, panels, toolbar, file upload, sticky footer actions, and `canvasContent`.

Do not iframe the reference, replace the route with copied original UI, or rebuild the app as a different shell.

## Feature Inventory

Before implementation, create `appTransferMode.referenceFeatureInventory` from inspected reference source/runtime/UI.

Include every user-visible and output-affecting behavior:

- controls;
- modes;
- generated objects;
- renderer state;
- media import lifecycle;
- canvas sizing;
- layers and selection;
- timeline and transport;
- export/copy;
- persistence;
- randomization;
- reset behavior.

Each inventory item names the reference feature, cites source evidence, cites feature-level behavior evidence, describes original behavior, describes Toolcraft mapping, and points to an `acceptanceId` that proves the behavior.

Use `status: "ported"` when the behavior is carried over directly and `status: "toolcraft-native"` when Toolcraft owns the same behavior. If behavior is intentionally changed or omitted, mark it `status: "intentionally-changed"` and set `userApprovedChangeReason` with explicit user approval or redesign/change-request evidence.

Do not rely on the user to find missing reference functionality after delivery.

## Reference Study Record

Declare `appTransferMode.referenceStudy` and record:

- where the reference lives;
- which source/runtime files, routes, assets, and handlers were inspected;
- how the original was run or restored locally in the Toolcraft environment;
- which runtime/browser behaviors were checked.

Use:

- `status: "ran-original"` when the original can run as-is;
- `status: "restored-local"` when enough of the reference was reconstructed locally to observe behavior;
- `status: "source-inspection-only"` only when running or restoring is blocked. Set `sourceOnlyReason` to the concrete blocker and compensate with stronger source evidence and acceptance coverage.

Reference clones also declare `referenceTimeline` with mode `none`, `toolcraft-playback`, `toolcraft-keyframes`, or `custom-reference-timeline`. Custom reference transport such as state buttons, trim handles, selected ranges, or range export uses `referenceTimeline.mode: "custom-reference-timeline"` plus browser-backed `referenceTimelineCoverage`.

## Figma Source

When a prompt provides a Figma URL, treat the Figma file as the design source of truth.

Required flow:

- Use Figma MCP/design context before implementation.
- Inspect the target node, layer tree, component instances, variants, text nodes, variables, styles, and assets.
- Recreate the design from the Figma structure and Toolcraft runtime/component contracts.
- Use screenshots only for final visual QA after reading the file structure.

Do not implement a Figma design by eye from an image, screenshot, exported PNG, or rough visual memory.

## Video References

When the prompt provides a video, GIF, screen recording, contact sheet, or extracted-frame sequence, study it as behavior before implementation.

Write a Video Reference Study before coding. Record:

- `referenceLocation`;
- `extractionEvidence`;
- `storyboard` with timecoded frames, visible state, and behavior observations;
- `transitionAnalysis` with frame-to-frame deltas;
- `behaviorDecomposition`;
- `acceptanceMapping`.

The transition analysis explains what changes between frames: entities, anchors, state persistence, releases, retargeting, input, timeline state, and copied behavior.

Do not implement video references from a single screenshot, generic visual summary, or a few static style observations.

## Acceptance Mapping

Every reference feature maps to acceptance coverage.

Each `acceptanceMapping` item points to a real acceptance row that proves the copied behavior with automated and browser coverage.

The port is incomplete until inventory and acceptance coverage prove that reference functionality was reviewed and transferred.

## Worklog Evidence

`docs/toolcraft/agent-worklog.md` records:

- explicit reference inputs;
- source/reference checked;
- contract rules applied;
- decisions;
- alternatives rejected;
- state/output mapping;
- verification;
- risks or follow-ups.

If a worklog cites a video, GIF, screen recording, contact sheet, extracted frames, Figma URL, or reference app, it must include the corresponding study evidence.
