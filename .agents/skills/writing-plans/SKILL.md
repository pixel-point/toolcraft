---
name: writing-plans
description: Use before Toolcraft code changes once the product behavior or approved spec is clear.
---

# Toolcraft Writing Plans

Use this skill before editing generated app code from a clear Toolcraft spec or
user request.

## Plan Content

Write a concise implementation plan that names:

1. Files to change under `src/app`, `src/routes`, docs, tests, or scripts.
2. Schema controls, sections, panel actions, renderer output, timeline, layers,
   persistence, settings transfer, and export paths affected by the work.
3. Acceptance, browser, and performance coverage required by the selected
   verification tier.
4. Commands to run before completion.

## Toolcraft Rule

Keep implementation plans focused on app behavior and verification. Do not move
runtime behavior into route-local state, do not patch copied `src/toolcraft`
internals for one app, and do not replace built-in Toolcraft surfaces.
