---
name: browser
description: Use to verify Toolcraft generated apps in a real local browser after implementation.
---

# Toolcraft Browser Verification

Use this skill after implementing generated app behavior that affects visible UI,
canvas output, export behavior, upload/media flow, panels, controls, timeline,
layers, or viewport interactions.

## Process

1. Run the app with `pnpm dev`.
2. Open the local URL in a real browser.
3. Verify the product output, canvas backing, controls, panel actions, upload or
   export flow, responsive layout, and any timeline or layer behavior touched by
   the change.
4. For final delivery, run the generated app verification commands required by
   `AGENTS.md`.

## Toolcraft Rule

Browser verification is part of the Toolcraft contract. A typecheck or build
alone is not enough for visible app behavior.
