---
name: systematic-debugging
description: Use before fixing broken Toolcraft controls, tests, builds, visual mismatches, exports, or runtime regressions.
---

# Toolcraft Systematic Debugging

Use this skill before fixing any Toolcraft generated app failure.

## Process

1. Reproduce the failure with the smallest command or browser action.
2. Read the full error, stack trace, failing assertion, or visual mismatch.
3. Identify whether the root cause is app schema, app renderer, acceptance data,
   browser test setup, copied runtime source, dependencies, or generated docs.
4. Compare the failure against the local Toolcraft docs and existing passing
   patterns in the generated app.
5. Make one targeted fix and rerun the relevant verification.

## Toolcraft Rule

Fix source behavior in the monorepo runtime or starter when the generated
template is wrong. Do not patch copied `src/toolcraft` files inside one generated
app unless the user explicitly wants a local fork.
