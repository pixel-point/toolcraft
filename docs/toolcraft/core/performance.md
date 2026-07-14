# Performance

Read this module before changing renderer technique, animation, canvas, media, export, render scale, heavy controls, or performance tests.

## Verification Triggers

Run a full performance checkpoint only when:

- the first working product app version exists;
- the user explicitly asks to optimize performance, fix lag, remove jank, speed up animation, stabilize drag/zoom, or otherwise complains about performance.

After the first working version, feature loops do not run the full performance suite by default. Renderer, canvas, animation, export, timeline, layers, `canvas.renderScale`, bug fixes, and performance-sensitive controls still need targeted functional/browser checks first, plus targeted performance scenarios only when they directly exercise the touched workload, viewport, or export path.

## Verification Tiers

- Tier 0-1: targeted docs/typecheck/unit plus focused browser when visual.
- Tier 2: `npm run verify:quick` plus relevant browser acceptance.
- Tier 3: `npm run verify:quick`, targeted browser acceptance, and targeted performance scenarios for touched workload/viewport/export paths.
- Tier 4: `npm run verify:final`; for the first working product version also run and pass a browser performance checkpoint with the current AI agent's controlled browser when available, using `npm run verify:perf` only as fallback.

Record skipped full performance runs and reason in the verification note or worklog.

## Workload Fixtures

- Performance scenarios declare `stressFixture` for the tested control value.
- Browser perf tests use `getToolcraftPerformanceStressValue(appPerformance, scenarioId)` so heavy-case tests cannot use toy values.
- When the tested control is not itself the whole heavy source, declare `workloadFixture` and apply it first.
- Numeric maximums, density, item counts, canvas/media size, and combined heavy states declare `loadProfile` with `hardLimit`, `smoothTarget`, and `smoothTargetRatio`.
- Try the hard limit first.
- Lower the guaranteed smooth target only in 10 percent steps with failed-measurement and optimization evidence.
- Ranges above `smoothTarget` are experimental, not silently guaranteed.

## Media And Pixel Workloads

- Media import and image-processing workloads use realistic `kind: "media"` fixtures at least `1920x1080`-equivalent.
- Heavy upload/preview tests must cover realistic source dimensions such as 2K/4K when the app accepts images.
- Heavy pixel/media Canvas 2D must evaluate WebGL or WebGPU with measured evidence before staying on CPU.
- Do not stay on CPU for millions of per-pixel operations on the main thread unless measurement proves it remains responsive and alternatives were evaluated.

## Render Scale

- Non-vector raster, Canvas 2D, WebGL, and WebGPU previews set `canvas.renderScale: true`.
- Runtime `Resolution scale` defaults to `2` and changes backing pixels without changing CSS/output size.
- Performance fixes must preserve selected render scale and visible output quality.
- Do not downsample, blur, stretch low-resolution backing pixels, or clamp render scale below the user's chosen value to pass budgets.

## Slider Responsiveness

- Slider and range slider controls are live canvas controls.
- Dragging a thumb updates runtime state and product output while the drag is in progress.
- If live updates are slow, fix renderer path first:
  - update uniforms or stable buffers;
  - cache decoded media and expensive derived inputs;
  - coalesce preview work to `requestAnimationFrame`;
  - cancel stale async renders;
  - move heavy work off React renders;
  - change renderer strategy when measured evidence supports it.
- Only at an extreme measured ceiling may the app use degraded live preview or delayed heavy refinement; even then, immediate canvas feedback is required.

## Renderer Pipeline Inventory

Custom renderer apps declare a typed `rendererPipeline`:

- render passes;
- cache keys;
- execution location;
- preview/export quality;
- interaction invalidation;
- control-to-pass mapping.

Every performance-sensitive control maps to the pass it invalidates.

## Optimization Evidence

Optimization worklogs record:

- bottleneck diagnosis;
- renderer technique evaluated;
- fixtures used;
- measurements before and after;
- rejected alternatives;
- remaining risks;
- why quality was preserved.
