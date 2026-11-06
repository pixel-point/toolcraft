# Toolcraft

<img width="1200" height="630" alt="og-toolcraft-v2" src="https://github.com/user-attachments/assets/5a5da97c-2ab4-416e-af24-7cee0e82dffb" />

Toolcraft is an open-source starter kit and UI library for building custom design apps with AI. Use it to create small creative products, internal utilities, interactive experiments, and tools tailored to your workflow.

It works with any AI agent (Codex, Claude, Cursor).

Built by [Pixel Point](https://pixelpoint.io/).

## Table of contents

- [Getting started](#getting-started)
- [What Toolcraft includes](#what-toolcraft-includes)
- [What to build](#what-to-build)
- [FAQ](#faq)
- [Repository structure](#repository-structure)
- [Commands](#commands)
- [License](#license)

### Resources

[Website](https://toolcraft.sh) · [Examples](https://toolcraft.sh/gallery) · [YouTube video](https://youtu.be/-QlmkGZLzFo) · [Blog post](https://pixelpoint.io/blog/how-to-craft-personal-design-tools-with-toolcraft/) · [Meetup Speech](https://youtu.be/yXkJ85hvC5k?si=pQYBgujxscS4ZURO)

## Getting started

Your AI agent can handle setup for you. Start with a prompt,
or use the CLI below.

### Start with a prompt

Open an empty project folder in Codex, Claude Code, Cursor, or another AI coding
agent. Copy the prompt below and replace the text in brackets with your idea.
The agent handles setup for you—no terminal commands to type.

```text
Install any missing prerequisites, including Node.js and npm. Set up Toolcraft
with `npx --yes @pixel-point/toolcraft create --yes`,
then build [describe your tool] and start a local dev server.
```

### Or start in the terminal

Run this command in your terminal:

```bash
npx @pixel-point/toolcraft create
```

Follow the prompts, then open the generated project in your AI coding agent.
Describe the tool you want to build and ask the agent to start a local preview:

```text
Build an app that applies an ASCII effect to an uploaded image and start a local preview.
```

## What Toolcraft includes

- A starter app built with TanStack Router, React, TypeScript, Tailwind CSS, and Base UI
- A canvas with the familiar pan and zoom controls you’d expect from a design tool
- A component library with buttons, dropdowns, sliders, font pickers, color palettes, curve editors, image uploaders, and more
- Built-in layers, animation timelines, and keyframes that your agent can turn on as your app needs them.
- Image and video export workflows
- An AI harness that gives your agent the skills, instructions, and checks to build on Toolcraft’s design system.
- Unit, browser, acceptance, and performance checks
- All the code behind your app, ready to customize with your AI agent

## What to build

Toolcraft works best for apps that combine a visual canvas with a focused set of
controls, such as:

- Procedural graphics and gradient generators
- Image stylization, ASCII, pixel, halftone, and glitch effects
- Shader and Three.js experiments
- Animation and video-effect tools
- Blog cover and branded asset generators

## FAQ

<details>
<summary>Why would I use Toolcraft instead of Figma?</summary>

Use Toolcraft only when a custom app would solve your task faster or better than
Figma or another design tool. First consider what your existing software can do,
including its AI features, and account for the time needed to build the app.

For example, you might be developing a brand’s visual language around procedural
graphics. Managing hundreds of small layers and repeatedly applying effects or
adjustments can become cumbersome in Figma. With a custom app, you decide which
controls and parameters to include, how the design responds to them, and which
export options you need, including video. You can build a repeatable workflow for
producing consistent brand assets in batches, then keep expanding it as your ideas
evolve. You can also share the app with your client so they can create new assets
on their own.

</details>

<details>
<summary>How long does it take to generate an app?</summary>

It depends on what you want to build. You can usually expect a first working
result 30–60 minutes after your initial prompt. More complex tasks, such as
reverse engineering a reference, combining multiple WebGL effects, or building
3D tools, can take longer.

Toolcraft isn’t a magic tool that lets you create anything instantly. It gives
you the workspace, AI guardrails, and skills to make the process smoother and
improve your chances of getting the result you want.

At Pixel Point, we often spend 1–3 days on a single app and go through 30–50
iterations with AI, sometimes more, before reaching a version that matches
what we envisioned.

</details>

<details>
<summary>Where can I find my generated app?</summary>

Toolcraft uses port 3002 for the local development environment by default. If
it’s busy on the first launch, it picks the next available port and remembers it
for your project.

After creating the app, your AI agent will usually give you a URL like
[http://localhost:3002](http://localhost:3002) that you can open in your browser.
If it doesn’t, simply ask your agent to start the dev server or give you the
local URL.

</details>

<details>
<summary>Is a $20/month Codex, Cursor, or Claude plan enough to build an app?</summary>

No. In general, $20/month plans aren’t suitable for meaningful work. Use a plan
that costs at least $100/month.

</details>

<details>
<summary>Is Toolcraft an application or a cloud service?</summary>

No. It’s a batch of files copied into a folder of your choice when you use the
command-line tool or ask an agent to do it for you. Those files contain the
starter, component library, and AI harness that help you build your own design
apps faster and better.

</details>

<details>
<summary>Does Toolcraft work on Windows, Mac, Linux?</summary>

Yes.

</details>

<details>
<summary>Is Toolcraft free?</summary>

Yes. Toolcraft is completely free, open-source software licensed under MIT.
You’re free to use it in commercial projects, modify it, and distribute it to
your clients.

</details>

<details>
<summary>Can I use apps built with Toolcraft for commercial projects and client work?</summary>

Yes. The starter in this repository uses the [MIT license](LICENSE.md), which
allows commercial use, modification, and distribution. You can build tools for
paid client work and use them in your business.

</details>

<details>
<summary>Which AI agents can I use with Toolcraft?</summary>

You can use Codex, Claude Code, Cursor, or another coding agent that can read and
edit project files, run commands, and follow the project's instructions. Open the
project in your agent and describe what you want to build. Toolcraft includes
instructions and skills to guide the work.

</details>

<details>
<summary>Can I start from an existing example instead of building from scratch?</summary>

Yes. Browse the [example apps](https://toolcraft.sh/gallery), open the one you want
to start from, and click **Clone with CLI** on its page to copy the setup command.
Ask your agent to run it, or paste it into your terminal. For example:

```bash
npx @pixel-point/toolcraft@latest create --template prism-flow
```

Your new project starts with that example's design and features, which you can
then change with your agent.

</details>

<details>
<summary>Can I publish my app and share it with teammates or clients?</summary>

Yes. Your agent can prepare the app for publishing and help you deploy it to a
web host of your choice. It can run pretty much anywhere and can be easily
deployed to Cloudflare, Vercel, or Netlify.

</details>

<details>
<summary>Will my app keep working without an AI subscription?</summary>

Yes. Your AI agent helps build and change the app. The generated app can run
independently. You can keep using it after cancelling your AI subscription.
If you add features that call an AI service, those features still need access to
that service.

</details>

<details>
<summary>Do my images and files stay on my computer?</summary>

Files you import into a Toolcraft app are processed in your browser. Toolcraft
does not send them anywhere else, since it isn’t a cloud service.

</details>

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

## License

[MIT](LICENSE.md)
