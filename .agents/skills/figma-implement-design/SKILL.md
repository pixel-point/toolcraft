---
name: figma-implement-design
description: Use to translate inspected Figma structure into a production-ready Toolcraft generated app.
---

# Toolcraft Figma Implementation

Use this skill after Figma context has been inspected and the task is to build or
update a Toolcraft generated app from that design.

## Process

1. Map Figma sections, components, and visual entities to product output and
   schema controls.
2. Use built-in Toolcraft controls before custom controls.
3. Keep app UI out of `canvasContent`; render product output there only.
4. Preserve the Toolcraft runtime canvas backing.
5. Add acceptance, browser, and performance coverage for every visible product
   entity.

## Toolcraft Rule

Build through `defineToolcraft` and `ToolcraftApp`. Do not recreate Toolcraft
panels, toolbar, controls, canvas, layers, or timeline by hand.
