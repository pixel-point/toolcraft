# Toolcraft

Toolcraft is a starter kit for building focused creative tools with an AI coding
agent. It provides the common editor foundation—canvas, controls, panels,
uploads, history, zoom, optional layers and timelines, export support, and
verification—so you can focus on what the tool should make.

Toolcraft is built by [Pixel Point](https://pixelpoint.io/).

## Create a project

Run the CLI:

```bash
npx @pixel-point/toolcraft create
```

Choose a project name and your AI agent. Then open the generated folder in that
agent and describe the tool you want to build:

```text
Build an app that applies an ASCII effect to an uploaded image.
```

Once the app is ready, start it locally:

```bash
npm run dev
```

## What Toolcraft includes

- A React and TypeScript starter app
- A canvas with upload, pan, zoom, radar, and history support
- Built-in controls for common creative-tool settings
- Optional layers, animation timelines, and keyframes
- Image and video export workflows
- Local instructions for AI coding agents
- Unit, browser, acceptance, and performance checks
- Editable runtime and UI source inside each generated project

The checked-in app is intentionally neutral. It starts with the Toolcraft
canvas, upload flow, controls panel, and toolbar. Product-specific controls,
renderers, layers, timelines, and exports are added only when the tool needs
them.

## What to build

Toolcraft works best for apps that combine a visual canvas with a focused set of
controls, such as:

- Procedural graphics and gradient generators
- Image stylization, ASCII, pixel, halftone, and glitch effects
- Shader and Three.js experiments
- Animation and video-effect tools
- Blog cover and branded asset generators

## Repository structure

- `src/app` — product schema, acceptance coverage, and performance configuration
- `src/routes` — application routes and Toolcraft composition
- `src/toolcraft/runtime` — state, commands, canvas, panels, timeline, and export runtime
- `src/toolcraft/ui` — Toolcraft controls and interface components
- `docs/toolcraft` — local rules and reference docs for AI agents
- `e2e` — browser acceptance and performance tests

This repository contains the standalone starter produced by the Toolcraft CLI.
The runtime and UI source are included directly instead of being hidden behind
a package, so generated projects can be inspected and changed when needed.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start the local app
npm run test         # Run unit and contract checks
npm run verify:quick # Run the normal development checks
npm run verify:final # Run the complete functional gate
npm run build        # Create a production build
```

## Learn more

Read [Build personal design tools with AI using Toolcraft](https://pixelpoint.io/blog/how-to-craft-personal-design-tools-with-toolcraft/)
for the background, workflow, and example projects.

## License

[MIT](LICENSE.md)
