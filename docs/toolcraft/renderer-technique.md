# Renderer Technique

> Reading route: start with `workflow.md`. Core generated-app rules live in `core/*`; this file is a focused renderer reference for the topic below.

Choose render technology per product layer. Do not choose a renderer because it is convenient; choose it from product output semantics, reference behavior, fidelity, and workload.

The initial renderer choice is provisional. It becomes accepted only after the app passes performance checks with the largest useful product canvas and the heaviest useful values for its own controls. If those checks show frame gaps, long tasks, viewport shaking, slow export, or interaction jank, revise the renderer strategy from that evidence before delivery. Do not make a renderer look fast by silently reducing the selected preview scale, backing pixels, source media quality, or export fidelity.

## Strategy Guide

- DOM: native product text, editable text, accessible product labels, low-count structured markup.
- SVG: crisp vector shapes, lines, icons, product foreground geometry, handles, and hit targets.
- Canvas 2D: medium raster compositing, text-to-canvas export, simple procedural previews, export passes.
- WebGL or WebGPU: dense pixels, shaders, image processing, high-resolution procedural output, large particle fields, heavy animated backgrounds.
- Mixed: use separate layers when background, product foreground, editing handles, and export composite have different semantics.

Dense backgrounds may use Canvas 2D, WebGL, or WebGPU when the spec names primitive count and performance reason. A dense raster background does not justify rasterizing low-count foreground geometry or text.

Heavy bitmap-media, shader-like, noise/texture, filter, halftone, mesh, and per-pixel image-processing layers must evaluate WebGL/WebGPU before delivery. Keeping the pixel work on Canvas 2D requires measured worst-case evidence in `whyNotAlternativeStrategies` or `performanceRisks`, using the real media/canvas stress fixture. Do not keep CPU Canvas 2D by default and then pass budgets by downsampling, lowering render scale, or testing a small upload.

Do not force WebGL only because an app is visually rich, and do not keep Canvas 2D only because the primitive is text or vector. Use the stress results. High-count text, vectors, particles, grids, media, or procedural layers can stay on Canvas/SVG/DOM only when worst-case preview or animation tests prove they remain responsive. If they do not, split layers or move the heavy product renderer to WebGL/WebGPU.

## Required Matrix

Custom renderer specs and `src/app/app-performance.ts` must mirror the decision:

- `sourceRepresentation`;
- `productRepresentation`;
- `previewRenderer`;
- `exportRenderer`;
- `rendererWorkload`;
- `rendererStrategy`;
- `whyNotAlternativeStrategies`;
- `fidelityRisks`;
- `performanceRisks`.

If text or vector output is intentionally rasterized, include `intentionalRasterizationReason`. If preview and export renderers differ, include `previewExportDifferenceReason`. If a reference runtime renderer changes, include `referenceRendererChangeReason`.

`rendererTechnique` chooses the technology. `rendererPipeline` proves the architecture. Do not start a custom renderer until both are written: technology without pass invalidation still lets an app recompute too much work.

For heavy custom renderers, specs and `app-performance.ts` must also include stress preview or animation evidence using real maximum values from the app: max density, max text length, max item count, max canvas size, max animation speed, max export quality, max media size, or the nearest real heavy fixture for the product.

## Layer Inventory

Custom renderer specs must classify product layers when they exist:

- `background`;
- `product-foreground`;
- `editing-handles`;
- `export-composite`.

Mirror these in `rendererTechnique.layers` with visible `uiSelector` values for browser verification.

Editing handles should be DOM/SVG overlays, must not appear in export/copy output, and must write through runtime state.
