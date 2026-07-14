# Decision Contract

Use this before writing a schema, spec, or implementation plan. It separates hard runtime rules from product decisions.

## Rule Levels

| Level | Meaning | Required Handling |
| --- | --- | --- |
| Invariant | Cannot be violated | Follow it; tests should fail if broken |
| Default | Normal choice | Use it unless the spec proves a reason not to |
| Heuristic | Product-dependent decision | Decide from product behavior and test the choice |
| Escape hatch | Allowed exception | Explain why and add stronger coverage |
| Recommendation | Style guidance | Follow unless product behavior requires otherwise |

## Area Guide

| Area | Decision Type | Summary |
| --- | --- | --- |
| Runtime shell | Invariant | Use `defineToolcraft` and `ToolcraftApp` |
| Canvas | Mixed | No app UI in `canvasContent`; handles are product-dependent |
| Panels | Mixed | Panel mechanics are hard; panel presence is product-dependent |
| Layers | Heuristic, then invariant | Enable only for real layer behavior; fully test when enabled |
| Timeline | Heuristic, then invariant | Choose from Animation Intent Inventory and transport behavior |
| Controls | Mixed | Bind every visible control and prove product output behavior |
| Renderer | Default with escape hatches | Choose technique from fidelity, reference behavior, and workload |
| Reference analysis | Invariant | Study video references as frame-to-frame behavior before implementation |
| Reference clone | Invariant | Preserve reference behavior unless redesign is explicit |
| Acceptance | Invariant | Prove product observables, not only runtime mutation |
| Performance | Mixed | Workload controls need workload budgets; ordinary controls need responsiveness coverage; animated previews yield to viewport interactions |
| Persistence | Default, then invariant | State persistence must be explicit; localStorage apps must prove reload restoration |
| Workflow | Invariant | Use required skills and browser verification |

The runtime shell invariant means product routes render `ToolcraftApp` directly. Do not hand-compose `ToolcraftRoot`, `CanvasShell`, `ControlsPanel`, `TimelinePanel`, `LayersPanel`, or `ToolbarPanel`; those surfaces are shared runtime design, not app-specific implementation details. App-specific source also must not render built-in control components directly; schema controls and `controlRenderers` are the allowed control extension points.

## Rule Catalog

This catalog mirrors `TOOLCRAFT_DECISION_CONTRACT`. If runtime adds or renames a rule id, this page and `AGENTS.md` must list the same id.

| Rule ID | Level | Area |
| --- | --- | --- |
| `runtime-shell-required` | Invariant | Runtime shell |
| `canvas-no-app-ui` | Invariant | Canvas |
| `canvas-surface-preserved` | Invariant | Canvas |
| `canvas-handle-placement` | Heuristic | Canvas |
| `panel-host-behavior` | Invariant | Panels |
| `layers-enable-only-when-needed` | Heuristic | Layers |
| `layers-enabled-behavior` | Invariant | Layers |
| `timeline-mode-choice` | Heuristic | Timeline |
| `timeline-enabled-behavior` | Invariant | Timeline |
| `controls-product-coverage` | Invariant | Controls |
| `output-export-required` | Invariant | Controls |
| `controls-layout-heuristics` | Heuristic | Controls |
| `renderer-technique-inventory` | Default | Renderer |
| `video-reference-analysis` | Invariant | Reference analysis |
| `reference-clone-source-of-truth` | Invariant | Reference clone |
| `acceptance-product-observable` | Invariant | Acceptance |
| `performance-coverage-levels` | Invariant | Performance |
| `persistence-policy-explicit` | Default | Persistence |
| `workflow-required` | Invariant | Workflow |

## Enforcement

Hard rules belong in validators and browser gates, not only prose. Heuristics need decision criteria and tests for the chosen behavior.

| Enforcement | Use It For |
| --- | --- |
| Runtime behavior | Mechanics owned by the shared runtime |
| Schema normalization | Repeated layout and density decisions |
| Acceptance validator | Product behavior and control coverage |
| Performance validator | Workload and responsiveness budgets |
| Browser helper | Real UI interaction and visual breakage |
| CLI integrity check | Generated-app source boundaries |
| Local docs and `AGENTS.md` | Decision criteria and workflow instructions |
