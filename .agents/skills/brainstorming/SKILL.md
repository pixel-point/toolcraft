---
name: brainstorming
description: Use before creating Toolcraft app features, changing behavior, or assembling app specs.
---

# Toolcraft Brainstorming

Use this skill before changing a Toolcraft generated app spec, behavior, controls,
canvas output, panels, export behavior, renderer technique, timeline, layers, or
media flow.

## Process

1. Read the generated app `AGENTS.md` and relevant `docs/toolcraft/*` contract
   files first.
2. Identify the product goal, visible output, editable entities, required
   controls, export behavior, and verification tier.
3. Make a Control Section Inventory grouped by product entity or workflow stage,
   not by UI component type.
4. Decide whether layers, timeline, persistence, settings transfer, custom
   controls, or a custom renderer are actually required.
5. Record decisions in `docs/toolcraft/agent-worklog.md`.

## Toolcraft Rule

The local Toolcraft app contract is the source of truth. Do not ask the user to
confirm decisions already covered by the prompt, `AGENTS.md`, or local
Toolcraft docs. Continue when the product behavior is clear.
