#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const codexHome = process.env.CODEX_HOME
  ? path.resolve(process.env.CODEX_HOME)
  : path.join(os.homedir(), ".codex");
const claudeHome = process.env.CLAUDE_HOME
  ? path.resolve(process.env.CLAUDE_HOME)
  : path.join(os.homedir(), ".claude");
const cursorHome = path.join(os.homedir(), ".cursor");
const configHome = process.env.XDG_CONFIG_HOME
  ? path.resolve(process.env.XDG_CONFIG_HOME)
  : path.join(os.homedir(), ".config");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");

const skillRoots = [
  path.join(projectRoot, ".agents/skills"),
  path.join(projectRoot, ".claude/skills"),
  path.join(codexHome, "skills"),
  path.join(claudeHome, "skills"),
  path.join(cursorHome, "skills"),
  path.join(configHome, "opencode/skills"),
  path.join(configHome, "agents/skills"),
];

function skillPaths(name) {
  return skillRoots.map((root) => path.join(root, name, "SKILL.md"));
}

const requiredSkills = [
  {
    name: "brainstorming",
    purpose: "shape the app behavior, panels, controls, canvas, media, export, and ambiguity before code",
    paths: skillPaths("brainstorming"),
  },
  {
    name: "writing-plans",
    purpose: "turn the approved app spec into a deterministic Toolcraft implementation plan",
    paths: skillPaths("writing-plans"),
  },
  {
    name: "systematic-debugging",
    purpose: "investigate root cause before fixing broken controls, tests, builds, visual regressions, or runtime bugs",
    paths: skillPaths("systematic-debugging"),
  },
  {
    name: "figma",
    purpose: "inspect actual Figma structure before implementing Figma-referenced Toolcraft apps",
    paths: skillPaths("figma"),
  },
  {
    name: "figma-implement-design",
    purpose: "translate inspected Figma structure into Toolcraft schema, renderer, and verification coverage",
    paths: skillPaths("figma-implement-design"),
  },
  {
    name: "browser",
    purpose: "verify the generated UI in a running local browser after implementation",
    paths: [
      ...skillPaths("browser"),
      path.join(codexHome, "skills/browser/SKILL.md"),
      path.join(codexHome, "skills/browser/browser/SKILL.md"),
      path.join(codexHome, "plugins/cache/openai-bundled/browser/0.1.0-alpha2/skills/browser/SKILL.md"),
      path.join(codexHome, "plugins/cache/openai-bundled/browser/*/skills/browser/SKILL.md"),
      path.join(codexHome, "plugins/cache/openai-bundled/browser/*/skills/control-in-app-browser/SKILL.md"),
    ],
  },
];

function pathPatternExists(candidatePath) {
  if (!candidatePath.includes("*")) {
    return fs.existsSync(candidatePath);
  }

  const { root } = path.parse(candidatePath);
  const segments = candidatePath.slice(root.length).split(path.sep).filter(Boolean);

  function walk(index, currentPath) {
    if (index >= segments.length) {
      return fs.existsSync(currentPath);
    }

    const segment = segments[index];

    if (segment !== "*") {
      return walk(index + 1, path.join(currentPath, segment));
    }

    if (!fs.existsSync(currentPath)) {
      return false;
    }

    return fs
      .readdirSync(currentPath, { withFileTypes: true })
      .some((entry) => entry.isDirectory() && walk(index + 1, path.join(currentPath, entry.name)));
  }

  return walk(0, root);
}

function hasAnyPath(paths) {
  return paths.some((candidatePath) => pathPatternExists(candidatePath));
}

const missingSkills = requiredSkills.filter((skill) => !hasAnyPath(skill.paths));

if (missingSkills.length === 0) {
  console.log("AI workflow skills are installed:");
  for (const skill of requiredSkills) {
    console.log(`- ${skill.name}: ${skill.purpose}`);
  }
  process.exit(0);
}

console.error("Missing required AI workflow skills:");
for (const skill of missingSkills) {
  console.error(`- ${skill.name}: ${skill.purpose}`);
}

console.error("");
console.error("If your AI environment supports Codex skills, install the missing skills before implementation.");
console.error("If installation is not available, stop and ask the user to install them.");
console.error("Checked project and global skill locations for Codex, Claude Code, Cursor, and OpenCode-compatible agents.");

process.exit(1);
