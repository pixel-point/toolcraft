# Performance

> Reading route: start with `workflow.md`. Core generated-app rules live in `core/*`; this file is a focused performance reference for the topic below.

Every visible non-action control needs a `performanceRole` and `performanceReason`.

Performance coverage has two levels:

- workload coverage for controls that change render cost;
- responsiveness coverage for ordinary controls that still must not freeze input or break the viewport.

The preferred browser performance runner is the current AI agent's controlled browser. Use `npm run verify:perf` only as the Playwright fallback when no agent-controlled browser is available or in CI/non-agent automation.

`app-performance.ts` must keep this policy:

```ts
browserCheckPolicy: {
  preferredRunner: "agent-browser",
  fallbackRunner: "playwright",
  fallbackWhen: ["agent-browser-unavailable", "ci"],
}
```

Do not change the preferred runner to Playwright to make local automation easier; that reverses the contract. Playwright is portable fallback evidence, not the primary agent workflow.

## Workload Coverage

Use workload coverage for controls that change rendering cost:

- output size;
- media resolution;
- sample count;
- character or grid density;
- particle count;
- blur radius;
- shader complexity;
- iterations;
- quality;
- timeline playback;
- keyframe scrubbing.

Sensitive controls need min/default/max scenarios, `stressFixture`, and real product-output checks.

`stressFixture` is the machine-checkable value for the scenario itself. For a slider drag, it is the exact slider value to apply. For a text input, it can be the long text value. For preview, zoom, animation, or export stress scenarios, it can be a combined object state.

When the scenario control is not itself the whole heavy source, add `workloadFixture` as the independent heavy baseline that must be applied before measuring. Examples: a large uploaded image before dragging an effect slider, long text before dragging a density slider, many items before dragging spacing, or `renderScale: 2` before checking high-frequency controls. `workloadFixture` must be paired with `stressFixture`: first apply the app baseline, then apply the measured scenario value. Do not encode this as a named-control rule; decide from the renderer pipeline and product workload.

Both fixture types must include:

- `kind`: `large-text`, `large-canvas`, `high-density`, `many-items`, `max-value`, `media`, or `custom`;
- `reason`: why this value is the heaviest useful product case;
- `value`: the actual value the browser performance check will apply.

Fixtures that represent numeric maximums, density, item counts, canvas/media size, or custom combined heavy states also declare `loadProfile`. This separates the product `hardLimit` from the `smoothTarget` that the browser performance checkpoint guarantees. `hardLimit` is the largest product range or tier the app exposes; `smoothTarget` is the value the browser performance check applies and must match `stressFixture.value` or `workloadFixture.value`.

Default to `smoothTargetRatio: 1`, which means the full hard limit must pass budgets. If the hard limit cannot pass after reasonable renderer and pipeline optimizations, lower the smooth target only in 10 percent steps (`0.9`, then `0.8`, and so on). Every lower step must include `loadProfile.evidence` with the failed higher target, measured result, optimization attempted, and decision. When `smoothTargetRatio < 1`, set `userFacingRange: "experimental-above-smooth"` so the range above the smooth target is not silently presented as guaranteed.

For multiline text, prompt, code, JSON, CSS, shader, script, or template workload controls, use `kind: "large-text"`. The fixture must contain at least `50_000` characters and `1_000` lines unless the product has a stricter real-world maximum.

For uploaded images, videos, source media, and image-processing workloads, use `kind: "media"` with a `value` object containing numeric `width` and `height`. The fixture must be at least `1920x1080`-equivalent, and products that claim high-resolution media or export quality should test a 4K-class source when that is the realistic heavy case. Do not satisfy media import, preview, effect-slider, or image-processing performance with `640x480`, thumbnails, or toy fixtures.

Choose heavy fixtures from this app's real controls, not from generic examples. Derive the workload from four app-specific sources: schema controls and `performanceRole`, `rendererTechnique`, `rendererPipeline`, and real product stress values such as large text, source media dimensions, `canvas.renderScale`, canvas size, export resolution, animation speed, viewport interactions, and effect strength. Try the product hard limit first, then use a documented smooth target only when measured evidence shows the hard limit cannot be made smooth without changing product scope.

Browser performance tests for workload and stress scenarios must read the scenario value through:

```ts
getToolcraftPerformanceStressValue(appPerformance, "scenario-id")
```

For workload sliders, the fallback Playwright test uses `dragToolcraftSliderToPerformanceStressValue(page, label, appPerformance, "scenario-id")` so the test applies the exact numeric value through the real slider min/max range. Agent-browser checks must apply the same value from `app-performance.ts`. Do not divide a stress value by the slider max, type a separate short value, or hardcode a runner-local ratio. If a browser check uses a toy value while `app-performance.ts` claims a heavy fixture, the performance checkpoint must fail.

Slider and range slider performance scenarios must preserve live product feedback. The browser test should drag the real thumb and verify the canvas/product output changes during drag. If that drag misses budget, keep the live control semantics and optimize the renderer path first: cache expensive inputs, update uniforms or stable buffers, coalesce preview work to `requestAnimationFrame`, cancel stale async renders, move work off React renders, reuse GPU resources, or change renderer strategy. Do not pass performance by making the slider update only after pointer release or Apply.

When a scenario declares `workloadFixture`, apply it first with `getToolcraftPerformanceWorkloadValue` or `applyToolcraftPerformanceWorkloadFixture`, then apply `stressFixture`, then measure. A control-drag scenario that only sets its own slider value while leaving the source media, text, item count, render scale, or dense scene at defaults is invalid.

For combined worst cases, put every relevant independent baseline value in `workloadFixture.value` for control scenarios, such as `{ sourceMedia: { width: 3840, height: 2160 }, renderScale: 2 }`, and put the tested control value in `stressFixture.value`. For preview, zoom, drag, animation, or export scenarios that stress the entire state instead of one control, use `stressFixture.value`, such as `{ detail: 96, scale: 0.6, renderScale: 2 }`. Testing workload controls one-by-one is not enough when the product exposes combinations that multiply render cost.

Use `kind: "custom"` only for combined object fixtures. Single numeric/string heavy values should use a semantic kind such as `max-value`, `high-density`, `large-canvas`, `many-items`, or `large-text`. Custom object fixtures are still semantically validated: keys such as `content`, `text`, `prompt`, `code`, `script`, `shader`, `template`, `json`, and `css` must hold real `large-text` values; keys for media/image/video must hold realistic `width`/`height`; and `renderScale` / `canvas.renderScale` / `resolutionScale` must be numeric values greater than `1`. Do not hide a short text string, thumbnail media, or a non-applied render scale inside `kind: "custom"`. Browser tests for custom object fixtures must call:

```ts
await applyToolcraftPerformanceStressFixture(page, appPerformance, "scenario-id", {
  detail: async (value) => {
    await dragToolcraftSliderToValue(page, "Detail", Number(value));
  },
  scale: async (value) => {
    await dragToolcraftSliderToValue(page, "Scale", Number(value));
  },
});
```

The applier object must contain exactly one entry for each key in `stressFixture.value`. Missing keys and stale extra keys are test failures, so every heavy-state part is intentionally mapped through the real UI before measurement.

For `workloadFixture.value` object fixtures, use `applyToolcraftPerformanceWorkloadFixture` with the same exact-key rule. `workloadFixture` is the app baseline; `stressFixture` is the action under test.

## Responsiveness Coverage

Ordinary controls still need lightweight responsiveness checks. They should not cause:

- frozen pointer drag;
- delayed input;
- broken slider movement;
- stale async renders;
- canvas zoom or offset jumps;
- panel scroll affecting canvas zoom;
- timeline or layer interactions destabilizing the viewport.

When `canvas.renderScale` / `Resolution scale` is enabled, responsiveness coverage must include slider or other high-frequency control drags at the selected scale. Browser performance tests for scenarios that include `renderScale`, `canvas.renderScale`, or the Resolution scale control must assert backing canvas pixels with `expectToolcraftCanvasBackingPixelsForRenderScale`; state-only checks, labels, or visual CSS stretching do not prove the selected scale was applied. If the canvas lags, diagnose the source before changing quality: renderer technique, React update frequency, decoded media, shader/program setup, buffer uploads, layout work, stale async renders, or animation scheduling.

## Renderer Performance

Custom renderers should:

- initialize contexts, programs, shaders, pipelines, textures, and large buffers once;
- update uniforms or stable buffers when controls change;
- cache decoded media;
- coalesce high-frequency preview work and split lightweight live feedback from heavier refinement when needed;
- cancel stale async renders;
- avoid re-decoding media on every control change;
- cancel scheduled frames during cleanup.

Coalescing may reduce redundant renders during high-frequency slider drags, but it must not make the slider feel deferred or leave the canvas unchanged until release.

Custom renderers must declare `rendererPipeline` in `src/app/app-performance.ts`. This is the machine-checkable Render Pipeline Inventory:

- every render pass has an `id`, `kind`, `runsOn`, `output`, `quality`, `inputs`, and `invalidatedBy`;
- cache-sensitive passes such as `decode`, `preprocess`, `pixel-transform`, `text-layout`, `rasterize`, and `composite` include `cacheKey`;
- `interactionInvalidation` maps controls and high-frequency interactions to the passes they invalidate;
- animation frames, drag, pan, zoom, timeline playback, timeline scrub, and mask movement must not invalidate upstream decode/preprocess/pixel-transform work unless that runtime target truly changes the upstream result;
- each `workloadTargets` entry appears in `interactionInvalidation.targets` so tests can prove which control changes renderer cost.

Write this inventory before custom renderer code. If the inventory says a slider only updates a shader uniform, the implementation should update a uniform or stable buffer, not rebuild media decode, glyph layout, or raster caches. If the inventory says media import invalidates source decode, browser performance must include a realistic `media-import` scenario.

Pixel-output renderers may use a capped preview pixel budget, but export/copy must render final product output at `state.canvas.size`.

Text-output and vector-output previews must preserve native output fidelity. Do not render low-resolution text/vector output into an offscreen canvas and upscale it.

For heavy bitmap-media, shader-like, noise/texture, filters, halftone, mesh, and per-pixel image-processing paths, WebGL/WebGPU is a required candidate before choosing CPU Canvas 2D. Canvas 2D is allowed only when `rendererTechnique.measuredAlternativeEvidence` records a structured WebGL/WebGPU comparison with `alternativeStrategy`, `scenarioId`, `fixture`, `measuredResult`, and `decision`. Prose in `whyNotAlternativeStrategies` or `performanceRisks` is not enough. A worker can protect the UI thread, but it is not a substitute for GPU acceleration when the workload is fundamentally per-pixel or when the pipeline has main-thread rasterize/composite preview pressure.

Renderer strategy is not final until the heavy scenarios pass. When stress preview, animation, drag, zoom, or export tests exceed budget, first decide whether the chosen renderer is wrong for this workload. Move heavy work to WebGL/WebGPU, split semantic foreground from heavy backgrounds, cache atlases/buffers, coalesce high-frequency preview updates, or change the rendering layer model before reducing product quality or relaxing budgets.

Do not pass performance by lowering output quality, render scale, canvas backing pixels, export resolution, media fidelity, maximum detail, item count, or animation fidelity. If all reasonable optimizations are exhausted and the app still cannot meet the budget at the hard limit, document the measured ceiling with `loadProfile`: exact hard limit, smooth target, ratio, failed higher measurements, attempted optimizations, why further changes would harm product quality or require a different product scope, and whether the range above the smooth target remains experimental. Lowering the smooth target does not relax frame, interaction, preview, render, export, or long-task budgets.

## Required Browser Checks

Use real interactions for:

- `preview-render`;
- `control-change`;
- `control-drag`;
- `mask-drag` when canvas handles, masks, pins, or on-canvas anchors affect output;
- `media-import` when upload exists;
- `export-copy` for product export actions and clipboard actions; measure the selected output dimensions, not CSS preview size;
- `timeline-playback` or `timeline-scrub` when timeline exists;
- `layers-interactions` when layers exist;
- `viewport-zoom-stress` for detail-heavy or animated custom renderers;
- `viewport-stability`.

For `slider` and `rangeSlider`, the required performance scenario is `control-drag`. A `control-change` scenario can cover selects, inputs, toggles, and other non-drag controls, but it does not prove live canvas feedback or drag smoothness for sliders.

Animated custom renderers also need `animation-viewport-drag`. Animation-only frame sampling and viewport-only stability are not enough: the browser test must sample frames while physically dragging or panning the canvas viewport. If SVG/DOM cannot pass that combined budget, choose a different renderer strategy from evidence instead of loosening the budget.

Detail-heavy or animated custom renderers also need `viewport-zoom-stress`. This test must apply the combined worst-case stress fixture first, then use the real toolbar zoom controls while sampling frame gaps and long tasks. Do not satisfy it by calling `canvas.zoom`, mutating runtime state directly, checking only the final zoom value, or zooming a default/lightweight output.

Detail-heavy custom renderers also need a stress `preview-render` or `animation-frame` scenario with a `maxLongTaskMs` budget. A high-count Canvas 2D layer must carry that evidence before delivery. If it fails, revise renderer strategy from the measured failure instead of keeping Canvas 2D by default.

During canvas drag, pan, pinch, zoom, and radar/center interactions, animated preview renderers must suspend or coalesce non-essential animation work. This is an interaction-performance throttle, not a user-visible playback command: do not flip the user's Play/Pause state, do not reset timeline time, and do not change export behavior. After the interaction settles, resume from the correct timeline or autonomous time without canvas offset or zoom jumps.

Animation checks should sample enough frames to catch jank. Interaction budgets must match scenario type rather than using one universal number.

Use `app-performance.ts` as the single budget and fixture source. Browser performance tests must call `getToolcraftPerformanceStressValue(appPerformance, scenarioId)` for workload values and `expectToolcraftScenarioPerformanceBudget(..., appPerformance, scenarioId)` for budgets.

Run targeted performance scenarios for Tier 3 performance-sensitive edits when they directly exercise the touched workload, viewport, or export path. The default `npm run test:browser` / `npm run verify:ui` gate excludes every Playwright test whose name contains `browser perf:`, including the performance audit and budget scenarios. The full performance checkpoint prefers the current AI agent's controlled browser. `npm run verify:perf` is the Playwright fallback suite; it runs every `browser perf:` scenario with one worker so budget failures are not hidden or created by unrelated parallel browser tests.

Run a full performance checkpoint only when:

- the first working version of the app exists;
- the user explicitly asks to optimize performance, fix lag, remove jank, speed up animation, stabilize drag/zoom, or otherwise complains about performance.

For the first working product app, this checkpoint is mandatory: the app is not complete until `npm run verify:final` and the browser performance checkpoint have both passed and the worklog records the runner as `agent-browser` or `playwright-fallback`. Use `npm run verify:perf` only as the fallback when no agent-controlled browser is available or in CI/non-agent automation.

Performance fixes must preserve selected output and preview quality. Do not pass budgets by lowering image quality, selected `canvas.renderScale`, export resolution, source media fidelity, or canvas backing pixels unless the user explicitly chooses that lower-quality value through a visible control. Prefer coalescing slider updates, caching expensive inputs, moving work off the React render path, reusing GPU resources, or changing renderer strategy over reducing visual fidelity.

Do not use the full performance suite as the default loop for feature work after the first working version. Those edits still need the targeted checks named by the verification tier, but they should not pay for every renderer and viewport stress test unless one of the two full-performance triggers applies. If a feature loop skips full performance, record the reason in the worklog.
