# Toolcraft Template Local Docs

This folder is the local operational reference for a standalone Toolcraft template app.

Use `../../AGENTS.md` as the entry contract, then read `workflow.md` before planning or editing app work. Use the remaining docs when a decision needs more detail:

The starter app itself is intentionally neutral. It should show the Toolcraft canvas/upload/toolbar baseline only until the product schema is authored. Demo controls, prompt inputs, layers, and timeline belong in tests/docs or in a real generated product that needs them.

## Core modules

`workflow.md` routes agents to these focused modules. Read every module listed for the task type; each module is intended to be small enough to read fully without relying on truncated terminal output.

- `core/runtime-boundary.md` — Toolcraft shell, allowed extension points, canvas boundary, and generated-app source boundary.
- `core/setup-export.md` — required Setup, canvas sizing, render scale, Timeline switch, Background, Image Export, Video Export, and sticky export actions.
- `core/control-selection.md` — built-in control fit, exact owners, compound controls, actions, collection actions, vector ownership, and custom control gate.
- `core/layout.md` — sections, dependency cohesion, headers, reset, spacing, dividers, labels, inline rows, actions layout, colors, select, and segmented fit.
- `core/media-upload.md` — file/image upload, multi-upload, sorting, transform actions, canvas source images, default assets, and source material behavior.
- `core/timeline-animation.md` — animation intent, timeline requirement, compact/extended timeline, seamless forward loops, duration changes, keyframes, and video timing.
- `core/performance.md` — verification triggers, workload fixtures, media/pixel workloads, render scale, live slider responsiveness, renderer pipeline inventory, and optimization evidence.
- `core/reference-study.md` — reference-runtime clone, feature inventory, reference study, Figma source, video references, acceptance mapping, and worklog evidence.

The broad docs below remain compatibility and topic references. They do not replace `workflow.md` routing or the `core/*` modules.

1. `workflow.md` — required preflight, task routing, worklog gate, and verification routing.
2. `assembly-workflow.md` — how the app must be assembled.
3. `decision-contract.md` — hard rules, defaults, heuristics, and escape hatches.
4. `schema-reference.md` — how to write `src/app/app-schema.ts`.
5. `component-rules.md` — component-specific layout and behavior rules.
6. `acceptance-testing.md` — how every visible entity proves it works.
7. `performance.md` — performance matrix and responsiveness gates.
8. `renderer-technique.md` — how to choose DOM, SVG, Canvas 2D, WebGL, WebGPU, or mixed rendering.
9. `agent-worklog.md` — implementation decision trail, evidence, verification, and risks.
10. `custom-controls.md` — how to register custom controls without editing `src/toolcraft`.

`agent-worklog.md` starts as a neutral starter template. Once the folder becomes a product, change it to `Mode: product`, add `Decision Trail` entries for significant implementation passes, and record concrete renderer, timeline, layers, controls, export, and performance decisions with evidence. Each iteration must explain the user-visible result, source/reference checked, contract rules applied, rejected alternatives, and state/output mapping so later debugging can reconstruct why the app was built that way. The final test gate fails if this worklog is missing, stale, lacks decision-trail fields, or lacks verification.

Every implementation pass must choose a verification tier before editing. Use the smallest tier that covers the changed surface, and move one tier higher when unsure.

| Tier | Use for | Typical command |
| --- | --- | --- |
| Tier 0 | Docs/copy only | targeted docs/typecheck |
| Tier 1 | One control or panel visual state | targeted test + focused browser check |
| Tier 2 | Schema, defaults, persistence, actions, product mapping | `npm run verify:quick` + relevant browser acceptance |
| Tier 3 | Renderer, canvas, timeline, layers, upload, export, zoom, heavy controls, or a touched performance-sensitive path | `npm run verify:quick` + targeted browser checks, plus targeted perf scenarios only for the touched path |
| Tier 4 | Final delivery, fresh export, runtime/template/contract changes, broad renderer/product rewrites | `npm run verify:final`; for the first working product version also run and pass a browser performance checkpoint with the agent-controlled browser when available, using `npm run verify:perf` only as fallback |

Run the full performance checkpoint only when the first working app version exists, or when the user explicitly asks to optimize performance, fix lag, remove jank, speed up animation, stabilize drag/zoom, or otherwise complains about performance. Prefer the current AI agent's controlled browser. Use `npm run verify:perf` only when no agent browser is available or in CI/non-agent automation.

Performance fixtures use `loadProfile` for reasoned workload ceilings: test the product hard limit first, and only lower the guaranteed `smoothTarget` in 10 percent steps with failed-measurement and optimization evidence. Ranges above the smooth target must be treated as experimental, not silently guaranteed.

The first working product app version is not complete until `npm run verify:final` and the required browser performance checkpoint have passed and the worklog records the runner as `agent-browser` or `playwright-fallback`. Do not report final delivery when required checks are failed, incomplete, pending, blocked, or listed as skipped. After the first working version, a skipped full performance run is valid only when the worklog explicitly says the full performance checkpoint is not required for a post-first-working non-performance edit.

Fresh folders or dependency changes need `npm install` before verification. Final delivery still starts the local app after the gate:

```bash
npm run verify:final
npm run verify:perf # Playwright fallback when no agent browser is available or in CI/non-agent automation
npm run dev
```

Do not kill existing local servers to free `3002` during a first start. Dev, preview, and browser verification prefer `3002`, then move to the next free port only while assigning this app's first saved port. After that, normal dev/preview starts use the saved port; if that port is already serving this app, report the existing URL instead of creating a second server. A launch is successful only after the selected port serves this app's Toolcraft server identity endpoint plus the `toolcraft-app-title` marker from `index.html`; never trust a port only because some server responds there. When restarting the same app server, use `npm run dev:restart` or `npm run preview:restart`; restart mode reuses the saved app port and stops only the listener on that exact port before starting again, forcing it only when the soft stop does not release the port, then verifies the identity before saving/reporting the port.
