# Toolcraft Workflow

This file is the app-local routing layer for Toolcraft work. It does not replace the detailed contracts; it tells an agent which contract to read and which verification path to use before editing.

## Required Preflight

Before planning or editing app code, runtime code, controls, canvas, panels, renderer, timeline, layers, export, or tests:

1. Confirm the nearest `AGENTS.md` is the active project contract.
2. Classify the project type:
   - **Generated app**: use local `docs/toolcraft/*`.
   - **Starter source**: use `starter/AGENTS.md`, local starter docs, and runtime contracts.
   - **Runtime/template source**: use root `AGENTS.md` and runtime contracts.
3. Classify the task type.
4. Read the task-specific docs below.
5. Choose and record a verification tier before implementation.

Do not edit implementation files until this preflight is complete.

Core modules are required reading when listed by the routing table. Read each listed module fully. Do not rely on a truncated terminal excerpt; reopen the specific module or use a narrower range when a tool output is clipped.

## Task Routing

Use the smallest reading set that covers the changed surface. If a task touches multiple surfaces, combine every matching row instead of picking only the closest one.

| Task type | Read before editing |
| --- | --- |
| App assembly, route structure, generated app porting | `core/runtime-boundary.md`, `assembly-workflow.md`, `decision-contract.md` |
| Reference app study, audit, or port | `core/reference-study.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, `schema-reference.md`, `acceptance-testing.md`, `decision-contract.md` |
| Schema, controls, defaults, persistence, actions | `core/control-selection.md`, `core/layout.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md` |
| Custom controls | `core/control-selection.md`, `core/layout.md`, `custom-controls.md`, `component-rules.md`, `acceptance-testing.md` |
| Renderer, canvas output, visual technique | `core/runtime-boundary.md`, `core/performance.md`, `renderer-technique.md`, `performance.md`, `acceptance-testing.md` |
| Timeline, keyframes, animation transport | `core/timeline-animation.md`, `core/performance.md`, `decision-contract.md`, `component-rules.md`, `acceptance-testing.md` |
| Layers | `core/runtime-boundary.md`, `core/layout.md`, `decision-contract.md`, `component-rules.md`, `acceptance-testing.md` |
| Export, copy, media, background | `core/setup-export.md`, `core/media-upload.md`, `schema-reference.md`, `component-rules.md`, `acceptance-testing.md`, `performance.md` |
| Broken control, visual mismatch, failed build, export bug, performance issue | `decision-contract.md`, the relevant `core/*` module, the relevant component/runtime doc, and the failing test/log first |
| Figma implementation | Use Figma MCP/design context, then `core/reference-study.md`, `core/runtime-boundary.md`, `assembly-workflow.md`, and the relevant component docs |

## Worklog Gate

For product app work, update `docs/toolcraft/agent-worklog.md` before reporting completion. Record:

- `Decision Trail` entries for each significant implementation pass, including:
  - request;
  - task type;
  - user-visible result;
  - source/reference checked;
  - docs/contracts read;
  - contract rules applied;
  - decision;
  - alternatives rejected;
  - state/output mapping from controls, commands, timeline, layers, media, or renderer to the visible product;
  - files changed;
  - verification;
  - skipped checks with reason;
  - risks or follow-ups.
- updated high-level decisions for renderer, timeline, layers, controls, export, and performance when those choices change.

If the folder is still the neutral starter, do not invent product decisions. Once it becomes a product, switch the worklog to product mode and keep it concrete.

## Runtime Boundary

Use the runtime extension points described in the current contracts:

- schema controls;
- `canvasContent` for product output only;
- `controlRenderers` only for true custom controls;
- `onPanelAction` for sticky product actions;
- runtime commands and hooks.

Do not recreate controls, panels, toolbar, timeline, layers, canvas shell, or runtime surfaces by hand. If a shared behavior is wrong, fix the shared runtime/template source and regenerate when needed.

## Verification Gate

Choose the tier from `AGENTS.md` before editing. Use the tier to decide checks.

- Tier 0-1: targeted docs/typecheck/unit plus focused browser when visual.
- Tier 2: `npm run verify:quick` plus relevant browser acceptance.
- Tier 3: `npm run verify:quick`, targeted browser acceptance, and targeted performance scenarios only for touched workload/viewport/export paths.
- Tier 4: `npm run verify:final`; for the first working product version also run and pass a browser performance checkpoint with the current AI agent's controlled browser when available, using `npm run verify:perf` only as fallback, then start `npm run dev` for the local URL.

Run a full performance checkpoint only when:

- the first working version of the app exists;
- the user explicitly asks to optimize performance, fix lag, remove jank, speed up animation, stabilize drag/zoom, or otherwise complains about performance.

Fast feature loops after the first working version do not run the full performance suite by default. Renderer, canvas, animation, export, timeline, layers, `canvas.renderScale`, bug fixes, and performance-sensitive controls still need targeted functional/browser checks first, plus targeted performance scenarios only when they directly exercise the touched path. Record any skipped full performance run and reason in the worklog.

The app is not complete when required checks are failed, incomplete, pending, blocked, or listed as skipped. First working product delivery must record `npm run verify:final` and the browser performance checkpoint as passed in the worklog, including runner `agent-browser` or `playwright-fallback`. After the first working version, skipping the full performance suite is valid only when the worklog explicitly says the full performance checkpoint is not required for a post-first-working non-performance edit.
