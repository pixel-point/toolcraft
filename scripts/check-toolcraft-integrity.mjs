#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const toolcraftRoot = path.join(appRoot, "src/toolcraft");
const manifestPath = path.join(toolcraftRoot, ".toolcraft-manifest.json");
const appSourceRoot = path.join(appRoot, "src/app");
const routesSourceRoot = path.join(appRoot, "src/routes");
const runtimeSurfaceComponentNames = [
  "ToolcraftRoot",
  "CanvasShell",
  "ControlsPanel",
  "LayersPanel",
  "TimelinePanel",
  "ToolbarPanel",
];
const runtimeSurfaceNamePattern = runtimeSurfaceComponentNames.join("|");
const lowLevelRuntimeSurfaceImportPattern = new RegExp(
  `import\\s*\\{[^}]*\\b(?:${runtimeSurfaceNamePattern})\\b[^}]*\\}\\s*from\\s*["'][^"']*runtime/react["']`,
);
const manualRuntimeSurfaceRenderPattern = new RegExp(
  `<\\s*(?:(?:${runtimeSurfaceNamePattern})\\b|[A-Za-z_$][\\w$]*\\.(?:${runtimeSurfaceNamePattern})\\b)|React\\.createElement\\s*\\(\\s*(?:(?:${runtimeSurfaceNamePattern})\\b|[A-Za-z_$][\\w$]*\\.(?:${runtimeSurfaceNamePattern})\\b)`,
);
const builtInControlComponentNames = [
  "ActionsControl",
  "AnchorGridControl",
  "ChannelMixerControl",
  "CheckboxControl",
  "CodeTextareaControl",
  "ColorControl",
  "ColorOpacityControl",
  "CurvesControl",
  "FileDropControl",
  "FontPickerControl",
  "GradientControl",
  "ImagePickerControl",
  "PaletteControl",
  "PanelActionsControl",
  "RangeInputControl",
  "RangeSliderControl",
  "SegmentedControl",
  "SelectControl",
  "SliderControl",
  "SwitchControl",
  "TextInputControl",
  "VectorControl",
];
const builtInControlNamePattern = builtInControlComponentNames.join("|");
const repoUiImportPattern = "@repo" + "/ui";
const builtInControlImportSourcePattern = ["toolcraft/ui", repoUiImportPattern].join("|");
const builtInControlImportPattern = new RegExp(
  `import\\s*\\{[^}]*\\b(?:${builtInControlNamePattern})\\b[^}]*\\}\\s*from\\s*["'][^"']*(?:${builtInControlImportSourcePattern})[^"']*["']`,
);
const directBuiltInControlRenderPattern = new RegExp(
  `<\\s*(?:(?:${builtInControlNamePattern})\\b|[A-Za-z_$][\\w$]*\\.(?:${builtInControlNamePattern})\\b)|React\\.createElement\\s*\\(\\s*(?:(?:${builtInControlNamePattern})\\b|[A-Za-z_$][\\w$]*\\.(?:${builtInControlNamePattern})\\b)`,
);

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(filePath) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function collectFiles(rootDir) {
  const files = [];

  async function visit(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await visit(filePath);
        continue;
      }

      if (entry.isFile() && entry.name !== ".toolcraft-manifest.json") {
        files.push(path.relative(rootDir, filePath).split(path.sep).join("/"));
      }
    }
  }

  await visit(rootDir);
  return files.sort();
}

function stripJsComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

async function collectSourceText(rootDir, { excludeTests = false } = {}) {
  if (!(await pathExists(rootDir))) {
    return "";
  }

  const chunks = [];

  async function visit(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const filePath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await visit(filePath);
        continue;
      }

      if (!entry.isFile() || !/\.[cm]?[jt]sx?$/.test(entry.name)) {
        continue;
      }

      if (excludeTests && /\.(test|spec)\.[cm]?[jt]sx?$/.test(entry.name)) {
        continue;
      }

      chunks.push(await fs.readFile(filePath, "utf8"));
    }
  }

  await visit(rootDir);
  return stripJsComments(chunks.join("\n"));
}

if (!(await pathExists(manifestPath))) {
  console.log("Toolcraft integrity manifest not found; skipping copied source check.");
  process.exit(0);
}

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const expectedFiles = new Map(
  Object.entries(manifest.files ?? {}).map(([relativePath, hash]) => [
    relativePath,
    String(hash),
  ]),
);
const actualFiles = await collectFiles(toolcraftRoot);
const actualFileSet = new Set(actualFiles);
const failures = [];
const routesSource = await collectSourceText(routesSourceRoot, { excludeTests: true });
const implementationSource = [
  routesSource,
  await collectSourceText(appSourceRoot, { excludeTests: true }),
].join("\n");

if (!/\bToolcraftApp\b/.test(implementationSource)) {
  failures.push(
    "app shell bypass: src/routes or src/app must render ToolcraftApp instead of replacing the Toolcraft runtime shell",
  );
}

if (lowLevelRuntimeSurfaceImportPattern.test(implementationSource)) {
  failures.push(
    "app shell bypass: app-specific source must not import low-level runtime surfaces; render ToolcraftApp and use schema, canvasContent, controlRenderers, onPanelAction, and runtime commands",
  );
}

if (manualRuntimeSurfaceRenderPattern.test(implementationSource)) {
  failures.push(
    "app shell bypass: app-specific source must not render low-level runtime surfaces such as CanvasShell, ControlsPanel, TimelinePanel, LayersPanel, or ToolbarPanel directly",
  );
}

if (builtInControlImportPattern.test(implementationSource)) {
  failures.push(
    "control bypass: app-specific source must not import built-in Toolcraft control components directly; declare schema controls or register a true custom controlRenderer",
  );
}

if (directBuiltInControlRenderPattern.test(implementationSource)) {
  failures.push(
    "control bypass: app-specific source must not render built-in Toolcraft control components directly; declare schema controls or register a true custom controlRenderer",
  );
}

if (/<\s*iframe\b|React\.createElement\s*\(\s*["']iframe["']/i.test(routesSource)) {
  failures.push(
    "app shell bypass: route files must not render a full-page iframe; preserve reference behavior inside ToolcraftApp canvasContent",
  );
}

for (const relativePath of expectedFiles.keys()) {
  if (!actualFileSet.has(relativePath)) {
    failures.push(`deleted ${relativePath}`);
    continue;
  }

  const actualHash = await hashFile(path.join(toolcraftRoot, relativePath));

  if (actualHash !== expectedFiles.get(relativePath)) {
    failures.push(`modified ${relativePath}`);
  }
}

for (const relativePath of actualFiles) {
  if (!expectedFiles.has(relativePath)) {
    failures.push(`added ${relativePath}`);
  }
}

if (failures.length > 0) {
  console.error("Toolcraft generated app integrity check failed.");
  console.error(
    "Do not edit src/toolcraft or replace the Toolcraft runtime shell in generated apps.",
  );
  console.error(
    "Fix the app schema/source runtime in the monorepo, preserve ToolcraftApp, then regenerate.",
  );

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log(`Toolcraft integrity check passed (${actualFiles.length} files).`);
