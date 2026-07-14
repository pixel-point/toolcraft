# Implementation Worklog

This file records product decisions and the evidence behind them. Keep it short, factual, and current. Update it after schema, renderer, timeline, layer, export, performance, or acceptance decisions.

## Status

Mode: starter

The neutral starter has no product renderer, timeline, layers, export behavior, or performance workload yet. Replace this status with `Mode: product` when the folder becomes a real app.

## Decision Trail

No product iterations yet. When this folder becomes a product, replace this note with iteration entries:

### Iteration 1 — <short task name>

- Request:
- Task type:
- User-visible result:
- Source/reference checked:
- Reference inputs:
- Docs/contracts read:
- Contract rules applied:
- Decision:
- Alternatives rejected:
- State/output mapping:
- Files changed:
- Verification:
- Skipped checks:
- Risks:

## Decisions

### Renderer

- Decision: No product renderer yet.
- Reason: The starter is intentionally neutral.
- Evidence: No `canvasContent` product renderer is declared.

### Timeline

- Decision: No timeline yet.
- Reason: The starter has no product animation behavior.
- Evidence: `panels.timeline` is omitted.

### Layers

- Decision: No layers yet.
- Reason: The starter has no layer workflow.
- Evidence: `panels.layers` is omitted.

### Controls

- Decision: No product controls yet.
- Reason: Controls are added only after the requested product behavior is known.
- Evidence: The starter schema exposes no product control sections.

### Export

- Decision: No product export yet.
- Reason: Export actions are added when the app has product output.
- Evidence: No sticky product `panelActions` are declared.

### Performance

- Decision: No product performance workload yet.
- Reason: Performance scenarios depend on renderer and control workload.
- Evidence: The starter performance matrix is a neutral baseline.

## Evidence

- Source reviewed: neutral starter schema and local Toolcraft docs.
- Contract applied: starter baseline remains neutral until product behavior exists.

## Verification

- Run: `npm run verify:quick` for starter baseline checks.
- Run: `npm run verify:final` after turning this folder into a product app.

## Risks

- Risk: This template must be replaced with product-specific decisions before final delivery.
