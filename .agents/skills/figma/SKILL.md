---
name: figma
description: Use when a Toolcraft task includes a Figma URL, node ID, or design-to-code requirement.
---

# Toolcraft Figma Workflow

Use this skill when the user provides a Figma URL, node ID, or asks to implement
or match a Figma design.

## Process

1. Inspect the Figma file through the available Figma MCP or design context
   tooling.
2. Read actual nodes, layers, components, variables, styles, assets, and layout
   structure.
3. Translate the design into Toolcraft schema controls, product renderer output,
   canvas sizing, export behavior, and verification coverage.
4. Use screenshots only for final visual QA, not as the source of truth.

## Toolcraft Rule

Do not implement a Figma task from a screenshot or by eye when Figma context is
available. The Figma structure is the reference.
